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
    expect(gradle).toMatch(/play \{[^}]*FACE_UNLOCK', 'false'/)
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
})
