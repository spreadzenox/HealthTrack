// Garde-fou des variantes Android (jalon 3) : la permission d'installer des APK ne vit que dans la sideload,
// et l'identifiant play, définitif une fois publié, ne change pas par accident.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { READ_TYPES } from '../connectors/HealthConnectConnector'

const android = resolve(import.meta.dirname, '../../android/app')
const read = (p) => readFileSync(resolve(android, p), 'utf-8')

describe('variantes Android play / sideload', () => {
  it('REQUEST_INSTALL_PACKAGES seulement dans le manifeste sideload', () => {
    expect(read('src/main/AndroidManifest.xml')).not.toMatch(/REQUEST_INSTALL_PACKAGES/)
    expect(read('src/sideload/AndroidManifest.xml')).toMatch(/android\.permission\.REQUEST_INSTALL_PACKAGES/)
  })

  it('identifiants : historique pour la sideload, neutre et distinct pour play', () => {
    const gradle = read('build.gradle')
    expect(gradle).toMatch(/sideload \{[^}]*applicationId 'com\.healthtrack\.app'/)
    expect(gradle).toMatch(/play \{[^}]*applicationId 'fr\.jpesquet\.sante'/)
    expect(gradle).toMatch(/play \{[^}]*SELF_UPDATE', 'false'/)
  })

  it("le plugin de mise à jour n'est enregistré que si SELF_UPDATE", () => {
    expect(read('src/main/java/com/healthtrack/app/MainActivity.java')).toMatch(
      /if \(BuildConfig\.SELF_UPDATE\) registerPlugin\(AppUpdatePlugin\.class\)/,
    )
  })

  it('Google Play Billing (6c-2) : bibliothèque et plugin dans la seule variante play', () => {
    const gradle = read('build.gradle')
    expect(gradle).toMatch(/playImplementation 'com\.android\.billingclient:billing:(\d+)\./)
    expect(Number(gradle.match(/billingclient:billing:(\d+)\./)[1])).toBeGreaterThanOrEqual(8)
    expect(gradle).not.toMatch(/^\s*implementation 'com\.android\.billingclient/m)
    expect(read('src/play/java/com/healthtrack/app/FlavorPlugins.java')).toMatch(/PlayBillingPlugin\.class/)
    expect(read('src/sideload/java/com/healthtrack/app/FlavorPlugins.java')).not.toMatch(/BillingPlugin/)
    expect(read('src/main/java/com/healthtrack/app/MainActivity.java')).toMatch(/registerPlugins\(FlavorPlugins\.list\(\)\)/)
    // Le plugin n'accuse jamais réception lui-même : c'est le relais, après vérification chez Google
    expect(read('src/play/java/com/healthtrack/app/PlayBillingPlugin.java')).not.toMatch(/acknowledgePurchase\(/)
  })

  it('rappel de fin d’essai (VC-18b) : plugin et récepteur dans la seule variante play, sans alarme exacte', () => {
    expect(read('src/play/java/com/healthtrack/app/FlavorPlugins.java')).toMatch(/TrialReminderPlugin\.class/)
    expect(read('src/sideload/java/com/healthtrack/app/FlavorPlugins.java')).not.toMatch(/TrialReminder/)
    expect(read('src/play/AndroidManifest.xml')).toContain('android:name="com.healthtrack.app.TrialReminderReceiver"')
    expect(read('src/main/AndroidManifest.xml')).not.toMatch(/SCHEDULE_EXACT_ALARM|USE_EXACT_ALARM/)
    expect(read('src/play/java/com/healthtrack/app/TrialReminder.java')).toMatch(/setAndAllowWhileIdle/)
  })

  it('play : pas de lecture du visage au déverrouillage (service caméra, relance, exemption de batterie)', () => {
    const play = read('src/play/AndroidManifest.xml')
    for (const name of ['.FaceSenseService', '.FaceResumeJob', '.FaceResumeReceiver']) {
      expect(play).toContain(`android:name="com.healthtrack.app${name}" tools:node="remove"`)
    }
    for (const perm of ['FOREGROUND_SERVICE', 'FOREGROUND_SERVICE_CAMERA', 'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS']) {
      expect(play).toMatch(new RegExp(`android\\.permission\\.${perm}" tools:node="remove"`))
    }
    const gradle = read('build.gradle')
    expect(gradle).toMatch(/sideload \{[^}]*FACE_UNLOCK', 'true'/)
    expect(gradle).toMatch(/sideload \{[^}]*FACE_KEEPALIVE', 'true'/)
    // Interrupteur POL-1 : coupé sauf -PfaceUnlockPlay=true ; jamais de relance ni d'exemption de batterie en play
    expect(gradle).toMatch(/play \{[^}]*FACE_UNLOCK', faceUnlockPlay \? 'true' : 'false'/)
    expect(gradle).toMatch(/play \{[^}]*FACE_KEEPALIVE', 'false'/)
    expect(gradle).toMatch(/def faceUnlockPlay = \(project\.findProperty\('faceUnlockPlay'\) \?: 'false'\)\.toBoolean\(\)/)
    // ancienne permission de stockage bornée (sans effet depuis Android 13, signalée par Play sinon)
    expect(read('src/main/AndroidManifest.xml')).toMatch(/READ_EXTERNAL_STORAGE" android:maxSdkVersion="32"/)
  })

  it('play : seules les lectures Health Connect du connecteur restent (I131), aucune écriture', () => {
    // Identifiants du plugin → enregistrement Health Connect (HealthDataType.kt de @capgo/capacitor-health)
    const RECORD = {
      steps: 'STEPS', sleep: 'SLEEP', heartRate: 'HEART_RATE', restingHeartRate: 'RESTING_HEART_RATE',
      heartRateVariability: 'HEART_RATE_VARIABILITY', oxygenSaturation: 'OXYGEN_SATURATION',
      calories: 'ACTIVE_CALORIES_BURNED', distance: 'DISTANCE', workouts: 'EXERCISE',
      respiratoryRate: 'RESPIRATORY_RATE', bodyTemperature: 'BODY_TEMPERATURE', bloodPressure: 'BLOOD_PRESSURE',
      bloodGlucose: 'BLOOD_GLUCOSE', weight: 'WEIGHT', bodyFat: 'BODY_FAT',
    }
    const kept = new Set(READ_TYPES.map((t) => {
      expect(RECORD[t], `type ${t} sans permission connue`).toBeTruthy()
      return `android.permission.health.READ_${RECORD[t]}`
    }))
    const declared = readFileSync(
      resolve(import.meta.dirname, '../../node_modules/@capgo/capacitor-health/android/src/main/AndroidManifest.xml'), 'utf-8',
    ).match(/android\.permission\.health\.[A-Z_]+/g)
    const removed = new Set(
      [...read('src/play/AndroidManifest.xml').matchAll(/"(android\.permission\.health\.[A-Z_]+)" tools:node="remove"/g)].map((m) => m[1]),
    )
    for (const perm of new Set(declared)) {
      if (kept.has(perm)) expect(removed.has(perm), `${perm} est lue par le connecteur`).toBe(false)
      else expect(removed.has(perm), `${perm} n'est pas utilisée : à retirer en play`).toBe(true)
    }
  })

  it('POL-1 : le manifeste play « lecture au déverrouillage » ne diffère que par le service caméra', () => {
    const strip = (xml) => xml.replace(/<!--[\s\S]*?-->/g, '').split('\n').map((l) => l.trim()).filter(Boolean)
    const off = strip(read('src/play/AndroidManifest.xml'))
    const on = strip(read('src/playFaceUnlock/AndroidManifest.xml'))
    const kept = [
      '<service android:name="com.healthtrack.app.FaceSenseService" tools:node="remove" />',
      '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" tools:node="remove" />',
      '<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" tools:node="remove" />',
    ]
    expect(off.filter((l) => !kept.includes(l))).toEqual(on)
    for (const l of kept) expect(off).toContain(l)
    // relance et exemption de batterie restent retirées
    expect(on).toContain('<service android:name="com.healthtrack.app.FaceResumeJob" tools:node="remove" />')
    expect(on).toContain('<receiver android:name="com.healthtrack.app.FaceResumeReceiver" tools:node="remove" />')
    expect(on).toContain('<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" tools:node="remove" />')
    expect(read('build.gradle')).toMatch(/if \(faceUnlockPlay\) play \{ manifest\.srcFile 'src\/playFaceUnlock\/AndroidManifest\.xml' \}/)
  })

  it('POL-1 : en play, ni relance, ni exemption de batterie, et « Arrêter » ne coupe que le déverrouillage', () => {
    const plugin = read('src/main/java/com/healthtrack/app/FaceSensePlugin.java')
    const service = read('src/main/java/com/healthtrack/app/FaceSenseService.java')
    // toute programmation de la vérification horaire est sous FACE_KEEPALIVE (sideload)
    for (const line of plugin.split('\n').filter((l) => l.includes('FaceResumeJob.ensureScheduled'))) {
      expect(line).toMatch(/FACE_KEEPALIVE/)
    }
    expect(plugin).toMatch(/requestBatteryExemption[\s\S]{0,120}if \(!BuildConfig\.FACE_KEEPALIVE\)/)
    expect(service).toMatch(/return BuildConfig\.FACE_KEEPALIVE \? "enabled" : UNLOCK_PREF/)
    expect(service).toMatch(/ACTION_STOP\.equals\(action\)\) \{\s*prefs\(this\)\.edit\(\)\.putBoolean\(runPref\(\), false\)/)
    expect(service).toMatch(/\.addAction\(0, "Arrêter", stop\)/)
    expect(service).toMatch(/BuildConfig\.FACE_KEEPALIVE \? NotificationManager\.IMPORTANCE_MIN : NotificationManager\.IMPORTANCE_LOW/)
  })

  it('POL-PLAY-10 : R8 sur la release (variante play seule), règles étroites pour les modèles du visage', () => {
    const gradle = read('build.gradle')
    const release = gradle.match(/release \{[\s\S]*?\n {8}\}/)[0]
    expect(release).toMatch(/minifyEnabled true/)
    expect(release).toMatch(/proguard-android-optimize\.txt/)
    // la clé de debug ne signe une release que pour le test sur émulateur, jamais quand la clé d'envoi est là
    expect(release).toMatch(/HT_UPLOAD_KEYSTORE[\s\S]*signingConfigs\.upload[\s\S]*else if \(releaseDebugSign\)/)
    const rules = read('proguard-rules.pro')
    expect(rules).toMatch(/^-keepattributes SourceFile,LineNumberTable/m)
    expect(rules).toMatch(/^-keep class ai\.onnxruntime\.\*\* \{ \*; \}/m)
    expect(rules).toMatch(/^-keep class org\.tensorflow\.lite\.\*\* \{ \*; \}/m)
    // jamais tout garder : l'obscurcissement exigé par Google Play tomberait à zéro
    expect(rules).not.toMatch(/^-keep[a-z]* class \*\* /m)
    expect(rules).not.toMatch(/^-dontobfuscate|^-dontoptimize|^-dontshrink/m)
  })
})
