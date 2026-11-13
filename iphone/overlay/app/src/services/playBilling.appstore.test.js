import { describe, it, expect, vi } from 'vitest'
import { describePlans, annualSavingPercent } from './playBilling'

// Version iOS (HealthTrack-iOS), étape I6 : le plugin Swift rend les produits de StoreKit 2 sous la forme des
// ProductDetails de PlayBilling (ios/HalcyaRules › BillingRule, testé par XCTest) ; ce contrat garde
// `describePlans` d'Android utilisable tel quel. Mêmes valeurs que BillingRuleTests.swift.
const fromStoreKit = [
  {
    productId: 'halcya_premium',
    offers: [
      {
        basePlanId: 'annuel',
        offerToken: 'halcya_premium_annuel',
        phases: [
          { priceMicros: 0, formattedPrice: '', billingPeriod: 'P2W', currency: 'EUR' },
          { priceMicros: 29_990_000, formattedPrice: '29,99 €', billingPeriod: 'P1Y', currency: 'EUR' },
        ],
      },
      {
        basePlanId: 'mensuel',
        offerToken: 'halcya_premium_mensuel',
        phases: [{ priceMicros: 2_990_000, formattedPrice: '2,99 €', billingPeriod: 'P1M', currency: 'EUR' }],
      },
    ],
  },
  // Gold (Android v681) : `halcya_gold_mensuel` chez Apple, rendu comme la formule `mensuel` de `halcya_gold`
  {
    productId: 'halcya_gold',
    offers: [
      {
        basePlanId: 'mensuel',
        offerToken: 'halcya_gold_mensuel',
        phases: [{ priceMicros: 9_990_000, formattedPrice: '9,99 €', billingPeriod: 'P1M', currency: 'EUR' }],
      },
    ],
  },
]

describe('formules App Store lues par describePlans (contrat avec BillingRule.swift)', () => {
  it('annuel avec essai de 14 jours, puis mensuel ; le jeton d’offre est l’id du produit App Store', () => {
    expect(describePlans(fromStoreKit)).toEqual([
      // Depuis Android v682 (GOLD-b4), chaque formule dit son produit et son niveau (Silver ou Gold)
      { basePlanId: 'annuel', offerToken: 'halcya_premium_annuel', productId: 'halcya_premium', tier: 'silver', period: 'year', price: '29,99 €', priceMicros: 29_990_000, currency: 'EUR', trialDays: 14 },
      { basePlanId: 'mensuel', offerToken: 'halcya_premium_mensuel', productId: 'halcya_premium', tier: 'silver', period: 'month', price: '2,99 €', priceMicros: 2_990_000, currency: 'EUR', trialDays: null },
    ])
  })

  it('Gold : la formule mensuelle de `halcya_gold`, sans essai ; le jeton d’offre est l’id du produit App Store', () => {
    expect(describePlans(fromStoreKit, 'halcya_gold')).toEqual([
      { basePlanId: 'mensuel', offerToken: 'halcya_gold_mensuel', productId: 'halcya_gold', tier: 'gold', period: 'month', price: '9,99 €', priceMicros: 9_990_000, currency: 'EUR', trialDays: null },
    ])
  })

  it('l’économie de l’annuel se calcule sur les prix de l’App Store, comme sur ceux de Google Play', () => {
    expect(annualSavingPercent(describePlans(fromStoreKit))).toBe(16)
  })
})

describe('plugin natif sur iPhone', () => {
  it('l’app iPhone prend le plugin StoreKit 2 (`AppStoreBilling`), de même forme que PlayBilling', async () => {
    vi.resetModules()
    vi.doMock('../config/distribution', async (orig) => ({ ...(await orig()), FEATURES: { billing: true } }))
    const registered = []
    vi.doMock('@capacitor/core', () => ({
      Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios', isPluginAvailable: (n) => n === 'AppStoreBilling' },
      registerPlugin: (name) => {
        registered.push(name)
        return { getProducts: async () => ({ products: fromStoreKit }) }
      },
    }))
    const { loadBillingPlugin, loadPlans } = await import('./playBilling')
    const plugin = await loadBillingPlugin()
    expect(registered).toEqual(['AppStoreBilling'])
    expect((await loadPlans({ native: plugin })).map((p) => `${p.tier}:${p.basePlanId}`)).toEqual(['silver:annuel', 'silver:mensuel', 'gold:mensuel'])
    vi.doUnmock('@capacitor/core')
    vi.doUnmock('../config/distribution')
  })

  // Build de captures de la PR #473 : un registerPlugin('AppStoreBilling') à chaque appel faisait écrire à Capacitor
  // « plugin "AppStoreBilling" already registered » (Premium, Réglages, l'abonnement relu au retour dans l'app)
  it('le plugin StoreKit 2 n’est enregistré qu’une fois, quel que soit le nombre d’appels', async () => {
    vi.resetModules()
    vi.doMock('../config/distribution', async (orig) => ({ ...(await orig()), FEATURES: { billing: true } }))
    const registered = []
    vi.doMock('@capacitor/core', () => ({
      Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios', isPluginAvailable: (n) => n === 'AppStoreBilling' },
      registerPlugin: (name) => {
        registered.push(name)
        return { getProducts: async () => ({ products: fromStoreKit }) }
      },
    }))
    const { loadBillingPlugin } = await import('./playBilling')
    const first = await loadBillingPlugin()
    const second = await loadBillingPlugin()
    expect(registered).toEqual(['AppStoreBilling'])
    expect(second).toBe(first)
    vi.doUnmock('@capacitor/core')
    vi.doUnmock('../config/distribution')
  })
})
