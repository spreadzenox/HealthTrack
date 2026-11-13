import { describe, it, expect } from 'vitest'
import process from 'node:process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Projet iOS copié dans upstream/app/ios par scripts/upstream.sh (les tests tournent depuis upstream/app)
const app = (name) => resolve(process.cwd(), 'ios/App/App', name)

/** Valeur d'une clé de premier niveau d'un plist XML (assez pour ces vérifications). */
const plistValue = (xml, key) => xml.match(new RegExp(`<key>${key}</key>\\s*(<[^>]+>)`))?.[1] ?? null

// App Store (I9) : sans manifeste de confidentialité déclarant les API « à raison requise » utilisées, l'envoi est
// refusé ; l'app n'utilise pas de chiffrement non exempté (HTTPS seulement), dit dans Info.plist pour que la
// question ne soit pas posée à chaque envoi.
describe('manifeste de confidentialité et chiffrement (App Store)', () => {
  it('PrivacyInfo.xcprivacy : aucun pistage, UserDefaults déclaré pour les données de l’app elle-même', () => {
    expect(existsSync(app('PrivacyInfo.xcprivacy'))).toBe(true)
    const xml = readFileSync(app('PrivacyInfo.xcprivacy'), 'utf8')
    expect(plistValue(xml, 'NSPrivacyTracking')).toBe('<false/>')
    expect(xml).toMatch(/<key>NSPrivacyAccessedAPIType<\/key>\s*<string>NSPrivacyAccessedAPICategoryUserDefaults<\/string>/)
    expect(xml).toMatch(/<string>CA92\.1<\/string>/)
  })

  it('Info.plist : pas de chiffrement non exempté', () => {
    const xml = readFileSync(app('Info.plist'), 'utf8')
    expect(plistValue(xml, 'ITSAppUsesNonExemptEncryption')).toBe('<false/>')
  })
})

/** Types de données collectées du manifeste : `{ type: { linked, tracking, purposes } }`. */
function collectedTypes(xml) {
  const block = xml.match(/<key>NSPrivacyCollectedDataTypes<\/key>\s*<array>([\s\S]*?)<\/array>\s*<key>NSPrivacyAccessedAPITypes/)?.[1] ?? ''
  const types = {}
  for (const dict of block.split('</dict>')) {
    const type = dict.match(/<key>NSPrivacyCollectedDataType<\/key>\s*<string>([^<]+)<\/string>/)?.[1]
    if (!type) continue
    const flag = (key) => dict.match(new RegExp(`<key>${key}</key>\\s*<(true|false)/>`))?.[1] === 'true'
    const purposes = [...(dict.match(/<key>NSPrivacyCollectedDataTypePurposes<\/key>\s*<array>([\s\S]*?)<\/array>/)?.[1] ?? '').matchAll(/<string>([^<]+)<\/string>/g)].map((m) => m[1])
    types[type] = { linked: flag('NSPrivacyCollectedDataTypeLinked'), tracking: flag('NSPrivacyCollectedDataTypeTracking'), purposes }
  }
  return types
}

// « Confidentialité de l'app » (A5) : les mêmes données que la « Sécurité des données » de Google Play d'Android
// (app/store/data-safety/answers.mjs), dans les catégories d'Apple, plus « Santé » : depuis Android v809, la photo
// des selles part à l'IA sur geste, et Apple la compte comme donnée de santé (décision du propriétaire du 05/11 vers
// 20:15 : il coche « Santé », liée, Fonctionnalités de l'app, sans pistage). Le reste de la santé et la forme restent
// sur le téléphone.
const PLAY_TO_APPLE = {
  PSL_APPROX_LOCATION: 'NSPrivacyCollectedDataTypeCoarseLocation',
  PSL_PHOTOS: 'NSPrivacyCollectedDataTypePhotosorVideos',
  PSL_USER_GENERATED_CONTENT: 'NSPrivacyCollectedDataTypeOtherUserContent',
  PSL_DEVICE_ID: 'NSPrivacyCollectedDataTypeDeviceID',
  PSL_PURCHASE_HISTORY: 'NSPrivacyCollectedDataTypePurchaseHistory',
}

describe('données collectées déclarées à Apple (A5)', () => {
  const types = () => collectedTypes(readFileSync(app('PrivacyInfo.xcprivacy'), 'utf8'))

  it('les mêmes types que la déclaration de Google Play d’Android, rien de plus', async () => {
    const { DECLARED_DATA_TYPES } = await import('../../store/data-safety/answers.mjs')
    expect(Object.keys(types()).sort()).toEqual([...DECLARED_DATA_TYPES.map((t) => PLAY_TO_APPLE[t]), 'NSPrivacyCollectedDataTypeHealth'].sort())
  })

  it('jamais de pistage, seulement pour faire fonctionner l’app ; la position arrondie n’est liée à rien', () => {
    for (const [type, use] of Object.entries(types())) {
      expect(use.tracking, type).toBe(false)
      expect(use.purposes, type).toEqual(['NSPrivacyCollectedDataTypePurposeAppFunctionality'])
    }
    expect(types().NSPrivacyCollectedDataTypeCoarseLocation.linked).toBe(false)
    // Envoyés au relais avec l'identifiant d'installation : liés à l'installation (choix prudent)
    for (const t of ['PhotosorVideos', 'OtherUserContent', 'DeviceID', 'PurchaseHistory', 'Health']) {
      expect(types()[`NSPrivacyCollectedDataType${t}`].linked, t).toBe(true)
    }
  })

  it('santé : seulement la photo des selles (déclarée) ; jamais la forme', () => {
    expect(Object.keys(types())).toContain('NSPrivacyCollectedDataTypeHealth')
    expect(Object.keys(types())).not.toContain('NSPrivacyCollectedDataTypeFitness')
  })
})
