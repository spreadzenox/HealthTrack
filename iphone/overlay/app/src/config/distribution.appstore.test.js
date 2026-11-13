import { describe, it, expect } from 'vitest'
import { resolveDistribution, featuresFor, DISTRIBUTIONS, storeFor, storeOfPurchase } from './distribution'

// Variante iOS (App Store), ajoutée par le dépôt HealthTrack-iOS (patches/01-variante-appstore.patch)
describe('variante appstore (iOS)', () => {
  it('est reconnue, sans tenir compte de la casse ni des espaces', () => {
    expect(DISTRIBUTIONS).toContain('appstore')
    expect(resolveDistribution('appstore')).toBe('appstore')
    expect(resolveDistribution(' AppStore ')).toBe('appstore')
  })

  it('se comporte comme play : relais IA, lecture du visage à l’ouverture, pas d’auto-mise à jour', () => {
    expect(featuresFor('appstore')).toMatchObject({
      selfUpdate: false,
      faceUnlock: false,
      faceAppOpen: true,
      aiRelay: true,
      debugMenu: false,
      withingsApi: false,
      gadgetbridgeGuide: false,
      cigaretteSetting: false,
    })
  })

  it("abonnement App Store ouvert (étape I6) : le relais d'Android vérifie les achats de l'iPhone depuis la v689", () => {
    expect(featuresFor('appstore').billing).toBe(true)
  })

  it("le magasin de l'iPhone se nomme l'App Store, avec la gestion des abonnements d'Apple (VITE_STORE=appstore)", () => {
    const store = storeFor('appstore')
    expect(store).toMatchObject({ id: 'appstore', name: 'l’App Store', Name: 'L’App Store', account: 'ce compte Apple', inStore: 'dans l’App Store' })
    expect(store.manageUrl('halcya_gold')).toBe('https://apps.apple.com/account/subscriptions')
    // Un achat garde le magasin d'où il vient, même lu dans l'autre version
    expect(storeOfPurchase('appstore', storeFor('play')).id).toBe('appstore')
  })

  it('ne nomme jamais le modèle d’IA derrière l’analyse des repas (décision du 31/10, formules Silver et Gold)', () => {
    expect(featuresFor('appstore').aiModelName).toBe(false)
  })

  it('ne change rien aux variantes Android', () => {
    expect(featuresFor('play')).toMatchObject({ faceAppOpen: true, aiRelay: true, billing: true, selfUpdate: false })
    expect(featuresFor('sideload')).toMatchObject({ faceAppOpen: false, aiRelay: false, billing: false, selfUpdate: true })
  })
})
