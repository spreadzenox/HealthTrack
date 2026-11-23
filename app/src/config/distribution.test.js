import { describe, it, expect } from 'vitest'
import { resolveDistribution, featuresFor, DISTRIBUTION, FEATURES, resolveStore, storeFor, storeOfPurchase, STORE } from './distribution'

describe('variante de distribution', () => {
  it('sideload par défaut, y compris pour une valeur inconnue', () => {
    expect(resolveDistribution(undefined)).toBe('sideload')
    expect(resolveDistribution('')).toBe('sideload')
    expect(resolveDistribution('store')).toBe('sideload')
    expect(DISTRIBUTION).toBe('sideload')
  })

  it('reconnaît play sans tenir compte de la casse ni des espaces', () => {
    expect(resolveDistribution('play')).toBe('play')
    expect(resolveDistribution(' PLAY ')).toBe('play')
  })

  it("seule la variante sideload a l'auto-mise à jour", () => {
    expect(featuresFor('sideload').selfUpdate).toBe(true)
    expect(featuresFor('play').selfUpdate).toBe(false)
    expect(FEATURES.selfUpdate).toBe(true)
  })

  it('lecture du visage : au déverrouillage en sideload, à l’ouverture de l’app en play', () => {
    expect(featuresFor('sideload')).toMatchObject({ faceUnlock: true, faceAppOpen: false, aiRelay: false })
    expect(featuresFor('play')).toMatchObject({ faceUnlock: false, faceAppOpen: true, aiRelay: true })
    // Abonnement Google Play : seulement dans la variante play ; la sideload ne perd aucune fonction
    expect(featuresFor('play').billing).toBe(true)
    expect(featuresFor('sideload').billing).toBe(false)
  })

  it('réglage « Mode diagnostic » visible d’emblée en sideload seulement (VC-4)', () => {
    expect(featuresFor('sideload').debugMenu).toBe(true)
    expect(featuresFor('play').debugMenu).toBe(false)
  })

  it('nom technique du modèle d’IA : jamais dans la variante play (31/10)', () => {
    expect(featuresFor('play').aiModelName).toBe(false)
    expect(featuresFor('sideload').aiModelName).toBe(true)
  })
})

describe('magasin d’applications (I6-RELAIS-6)', () => {
  it('Google Play par défaut, l’App Store seulement si demandé', () => {
    expect(STORE.id).toBe('play')
    expect(resolveStore(undefined)).toBe('play')
    expect(resolveStore('ios')).toBe('play')
    expect(resolveStore(' AppStore ')).toBe('appstore')
  })

  it('noms prêts à placer dans une phrase', () => {
    expect(storeFor('play')).toMatchObject({ name: 'Google Play', Name: 'Google Play', inStore: 'dans Google Play', fromStore: 'auprès de Google Play', account: 'ce compte Google Play' })
    expect(storeFor('appstore')).toMatchObject({ name: 'l’App Store', Name: 'L’App Store', inStore: 'dans l’App Store', fromStore: 'auprès de l’App Store', account: 'ce compte Apple' })
  })

  it('lien de gestion : Google Play sur le produit, abonnements du compte Apple pour l’App Store', () => {
    expect(storeFor('play').manageUrl('halcya_gold')).toBe('https://play.google.com/store/account/subscriptions?sku=halcya_gold&package=fr.jpesquet.sante')
    expect(storeFor('appstore').manageUrl('halcya_gold_mensuel')).toBe('https://apps.apple.com/account/subscriptions')
  })

  it('un achat garde le magasin d’où il vient ; période de lancement → magasin de cette version', () => {
    expect(storeOfPurchase('appstore').id).toBe('appstore')
    expect(storeOfPurchase('play', storeFor('appstore')).id).toBe('play')
    expect(storeOfPurchase('launch', storeFor('appstore')).id).toBe('appstore')
    expect(storeOfPurchase(null).id).toBe('play')
  })
})

describe('nom des réglages de l’app dans les textes (DEM-IOS-7)', () => {
  it('« Réglages » sur Android, « Réglages de l’app » sur iPhone, où Réglages est aussi l’app du système', async () => {
    const { inAppSettingsFor, IN_APP_SETTINGS } = await import('./distribution')
    expect(inAppSettingsFor({})).toBe('Réglages')
    expect(inAppSettingsFor({ iosStore: false })).toBe('Réglages')
    expect(inAppSettingsFor({ iosStore: true })).toBe('Réglages de l’app')
    expect(IN_APP_SETTINGS).toBe('Réglages')
    // aucun emoji : iOS dessine « ⚙ » en emoji couleur
    expect(inAppSettingsFor({ iosStore: true })).not.toMatch(/\p{Extended_Pictographic}/u)
  })

  it('aucun texte de l’app n’écrit « Réglages › » en dur, hors chemins des réglages du système', async () => {
    const files = import.meta.glob(['../**/*.{js,jsx}', '!../**/*.test.{js,jsx}'], { query: '?raw', import: 'default', eager: true })
    const system = /Réglages › (Notifications|Général|Santé|Temps d’écran)/
    const offenders = []
    for (const [path, src] of Object.entries(files)) {
      src.split('\n').forEach((line, i) => {
        const code = line.replace(/^\s*(\*|\/\/).*$/, '').replace(/\/\/.*$/, '')
        if (/Réglages ›/.test(code) && !system.test(code)) offenders.push(`${path}:${i + 1}`)
      })
    }
    expect(offenders).toEqual([])
  })
})
