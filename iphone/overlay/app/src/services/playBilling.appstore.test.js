import { describe, it, expect } from 'vitest'
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

// Le choix du plugin StoreKit 2 (`AppStoreBilling`) sur iPhone est testé dans le code commun (app/src/services/playBilling.test.js)
