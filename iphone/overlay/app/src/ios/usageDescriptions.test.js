import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Version iOS (HealthTrack-iOS) : iOS ferme l'app qui ouvre la caméra sans phrase d'usage dans Info.plist, et refuse la
// position sans la sienne. Toute fonction du code partagé qui y touche (photo du repas, météo) doit avoir sa phrase,
// en français, vraie sur iPhone.
// Vitest tourne depuis upstream/app, où scripts/upstream.sh a copié ios/
const src = join(process.cwd(), 'src')
const plist = readFileSync(join(process.cwd(), 'ios/App/App/Info.plist'), 'utf8')

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return files(p)
    return /\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name) ? [p] : []
  })
}
const code = files(src).map((p) => readFileSync(p, 'utf8')).join('\n')
// Sources Swift de l'app (copiées dans upstream/app/ios), hors tests des paquets
function swiftFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return /^(Tests|\.build|DerivedData|node_modules)$/.test(name) ? [] : swiftFiles(p)
    return name.endsWith('.swift') ? [p] : []
  })
}
const usage = (key) => plist.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`))?.[1]
const flag = (key) => plist.match(new RegExp(`<key>${key}</key>\\s*<(true|false)/>`))?.[1]

describe('phrases d’usage de l’iPhone (Info.plist)', () => {
  it('la photo du repas ouvre la caméra : phrase d’usage de la caméra', () => {
    expect(code).toMatch(/capture="environment"/)
    expect(usage('NSCameraUsageDescription')).toMatch(/caméra.*repas/)
  })

  it('la photo des selles (Android v809, décision du 05/11) : la phrase de la caméra la cite, photo effacée après l’analyse', () => {
    expect(usage('NSCameraUsageDescription')).toMatch(/forme de vos selles/)
    expect(usage('NSCameraUsageDescription')).toMatch(/effacée/)
  })

  it('la lecture du visage (plugin FaceSense) : la phrase de la caméra le dit, images gardées sur l’iPhone', () => {
    expect(usage('NSCameraUsageDescription')).toMatch(/lire votre visage.*restent sur cet iPhone/)
  })

  it('la météo demande la position : phrase d’usage, position approximative seulement', () => {
    expect(code).toMatch(/navigator\.geolocation/)
    expect(usage('NSLocationWhenInUseUsageDescription')).toMatch(/position approximative.*météo/)
    expect(flag('NSLocationDefaultAccuracyReduced')).toBe('true')
  })

  it('app Santé : la lecture expliquée ; l’écriture, exigée par Apple, dit que Halcya n’écrit rien', () => {
    // Le plugin Santé contient du code d'écriture : sans cette phrase, App Store Connect refuse l'envoi (TestFlight,
    // 30/10). L'app livrée n'écrit rien dans Santé ; seule la build de captures y écrit des mesures de démonstration.
    expect(usage('NSHealthShareUsageDescription')).toMatch(/lit vos mesures/)
    expect(usage('NSHealthUpdateUsageDescription')).toMatch(/n’écrit rien dans l’app Santé/)
  })

  it('chaque framework sensible importé par le Swift de l’app a sa phrase (ITMS-90683, 31/10 : Speech manquait)', () => {
    // App Store Connect exige la phrase dès que le code fait référence au framework, même sans demande d'autorisation
    const NEEDS = {
      Speech: 'NSSpeechRecognitionUsageDescription', Contacts: 'NSContactsUsageDescription',
      EventKit: 'NSCalendarsUsageDescription', CoreMotion: 'NSMotionUsageDescription',
      Photos: 'NSPhotoLibraryUsageDescription', CoreBluetooth: 'NSBluetoothAlwaysUsageDescription',
      CoreLocation: 'NSLocationWhenInUseUsageDescription', HealthKit: 'NSHealthShareUsageDescription',
    }
    const swift = swiftFiles(join(process.cwd(), 'ios')).map((p) => readFileSync(p, 'utf8')).join('\n')
    const imported = Object.keys(NEEDS).filter((fw) => new RegExp(`^import ${fw}$`, 'm').test(swift))
    expect(imported).toContain('Speech')
    for (const fw of imported) expect(usage(NEEDS[fw]), `${fw} → ${NEEDS[fw]}`).toBeTruthy()
  })

  it('la sonde vocale (Speech) : la phrase dit qu’aucune voix n’est écoutée ni envoyée', () => {
    expect(usage('NSSpeechRecognitionUsageDescription')).toMatch(/français sur cet iPhone/)
    expect(usage('NSSpeechRecognitionUsageDescription')).toMatch(/ni écoutée ni enregistrée/)
  })

  it('aucune phrase ne parle d’Android, toutes vouvoient', () => {
    const all = [...plist.matchAll(/<key>NS\w+UsageDescription<\/key>\s*<string>([^<]+)<\/string>/g)].map((m) => m[1])
    expect(all.length).toBeGreaterThanOrEqual(4)
    for (const s of all) {
      expect(s).not.toMatch(/Android|Health Connect/)
      expect(s).not.toMatch(/\b(tu|ton|ta|tes)\b/)
    }
  })
})
