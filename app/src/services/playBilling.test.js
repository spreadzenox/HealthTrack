import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'node:crypto'

import { getInstallId } from './aiRelay'
import {
  PRODUCT_ID,
  obfuscatedAccountId,
  describePlans,
  loadPlans,
  purchasePlan,
  restorePurchases,
  syncEntitlement,
  handlePurchasesUpdated,
  startPurchaseWatch,
  getStoredPurchaseToken,
  formatMicros,
  monthlyEquivalent,
  annualSavingPercent,
} from './playBilling'

const phase = (formattedPrice, priceMicros, billingPeriod, extra = {}) => ({
  formattedPrice,
  priceMicros,
  currency: 'EUR',
  billingPeriod,
  ...extra,
})

/** Réponse synthétique du plugin natif PlayBilling.getProducts (ProductDetails réduits). */
const PRODUCTS = [
  {
    productId: PRODUCT_ID,
    offers: [
      { basePlanId: 'mensuel', offerId: null, offerToken: 'tok-mensuel', phases: [phase('4,99 €', 4_990_000, 'P1M')] },
      { basePlanId: 'annuel', offerId: null, offerToken: 'tok-annuel', phases: [phase('29,99 €', 29_990_000, 'P1Y')] },
      {
        basePlanId: 'annuel',
        offerId: 'essai-14j',
        offerToken: 'tok-annuel-essai',
        phases: [phase('Gratuit', 0, 'P2W', { cycles: 1 }), phase('29,99 €', 29_990_000, 'P1Y')],
      },
    ],
  },
]

const purchased = (token = 'tok.achat-0123456789abcdef', extra = {}) => ({
  purchaseToken: token,
  products: [PRODUCT_ID],
  state: 'purchased',
  acknowledged: false,
  autoRenewing: true,
  ...extra,
})

describe('Google Play Billing côté app (jalon 6c-2)', () => {
  beforeEach(() => localStorage.clear())

  it('identifiant de compte masqué : même empreinte que le relais (sha256 de « halcya:<installation> »)', async () => {
    const expected = createHash('sha256').update(`halcya:${getInstallId()}`).digest('hex')
    await expect(obfuscatedAccountId()).resolves.toBe(expected)
  })

  it('formules lues dans Play Billing : annuel d’abord, essai seulement si Google le propose', () => {
    const plans = describePlans(PRODUCTS)
    expect(plans.map((p) => p.basePlanId)).toEqual(['annuel', 'mensuel'])
    expect(plans[0]).toMatchObject({ period: 'year', price: '29,99 €', priceMicros: 29_990_000, offerToken: 'tok-annuel-essai', trialDays: 14 })
    expect(plans[1]).toMatchObject({ period: 'month', price: '4,99 €', offerToken: 'tok-mensuel', trialDays: null })
  })

  it('sans offre d’essai (déjà utilisée) : l’offre de base, sans essai promis', () => {
    const noTrial = [{ ...PRODUCTS[0], offers: PRODUCTS[0].offers.filter((o) => !o.offerId) }]
    expect(describePlans(noTrial)[0]).toMatchObject({ basePlanId: 'annuel', offerToken: 'tok-annuel', trialDays: null })
  })

  it('produit absent ou illisible : aucune formule (jamais de prix inventé)', () => {
    expect(describePlans([])).toEqual([])
    expect(describePlans(null)).toEqual([])
    expect(describePlans([{ productId: 'autre', offers: PRODUCTS[0].offers }])).toEqual([])
  })

  it('sans Play Billing (sideload, navigateur) : aucune formule', async () => {
    await expect(loadPlans({ native: null })).resolves.toEqual([])
  })

  it('loadPlans demande le seul produit Halcya au plugin natif', async () => {
    const native = { getProducts: vi.fn().mockResolvedValue({ products: PRODUCTS }) }
    const plans = await loadPlans({ native })
    expect(native.getProducts).toHaveBeenCalledWith({ productIds: [PRODUCT_ID] })
    expect(plans).toHaveLength(2)
  })

  it('achat réussi : le jeton est vérifié par le relais (seule source de vérité) puis retenu', async () => {
    const native = { purchase: vi.fn().mockResolvedValue({ status: 'purchased', purchases: [purchased()] }) }
    const refresh = vi.fn().mockResolvedValue({ premium: true, source: 'play' })
    const plan = describePlans(PRODUCTS)[0]
    const res = await purchasePlan(plan, { native, refresh })
    expect(native.purchase).toHaveBeenCalledWith({
      productId: PRODUCT_ID,
      offerToken: 'tok-annuel-essai',
      obfuscatedAccountId: await obfuscatedAccountId(),
    })
    expect(refresh).toHaveBeenCalledWith({ purchaseToken: 'tok.achat-0123456789abcdef' })
    expect(res).toMatchObject({ status: 'purchased', entitlement: { premium: true } })
    expect(getStoredPurchaseToken()).toBe('tok.achat-0123456789abcdef')
  })

  it('achat annulé par la personne : rien n’est vérifié ni retenu', async () => {
    const native = { purchase: vi.fn().mockResolvedValue({ status: 'cancelled', purchases: [] }) }
    const refresh = vi.fn()
    const res = await purchasePlan(describePlans(PRODUCTS)[1], { native, refresh })
    expect(res.status).toBe('cancelled')
    expect(refresh).not.toHaveBeenCalled()
    expect(getStoredPurchaseToken()).toBeNull()
  })

  it('paiement en attente : retenu pour plus tard, sans premium tant que Google ne l’a pas confirmé', async () => {
    const native = { purchase: vi.fn().mockResolvedValue({ status: 'pending', purchases: [purchased('tok.attente-0123456789ab', { state: 'pending' })] }) }
    const refresh = vi.fn()
    const res = await purchasePlan(describePlans(PRODUCTS)[1], { native, refresh })
    expect(res.status).toBe('pending')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('erreur de Play Billing : message simple, sans terme technique', async () => {
    const native = { purchase: vi.fn().mockRejectedValue(new Error('BILLING_UNAVAILABLE (3)')) }
    const res = await purchasePlan(describePlans(PRODUCTS)[1], { native, refresh: vi.fn() })
    expect(res.status).toBe('error')
    expect(res.message).toMatch(/Google Play/)
    expect(res.message).not.toMatch(/BILLING_UNAVAILABLE/)
  })

  it('restaurer : un abonnement trouvé dans Google Play est revérifié par le relais', async () => {
    const native = { queryPurchases: vi.fn().mockResolvedValue({ purchases: [purchased('tok.restaure-0123456789ab')] }) }
    const refresh = vi.fn().mockResolvedValue({ premium: true, source: 'play' })
    const res = await restorePurchases({ native, refresh })
    expect(refresh).toHaveBeenCalledWith({ purchaseToken: 'tok.restaure-0123456789ab' })
    expect(res).toMatchObject({ found: true, entitlement: { premium: true } })
    expect(getStoredPurchaseToken()).toBe('tok.restaure-0123456789ab')
  })

  it('restaurer sans abonnement dans Google Play : le jeton retenu est oublié', async () => {
    localStorage.setItem('halcya_purchase_token', 'tok.ancien-0123456789abc')
    const native = { queryPurchases: vi.fn().mockResolvedValue({ purchases: [] }) }
    const refresh = vi.fn().mockResolvedValue({ premium: false })
    const res = await restorePurchases({ native, refresh })
    expect(refresh).toHaveBeenCalledWith({ purchaseToken: null })
    expect(res.found).toBe(false)
    expect(getStoredPurchaseToken()).toBeNull()
  })

  it('synchroniser hors Play Billing : réutilise le jeton retenu', async () => {
    localStorage.setItem('halcya_purchase_token', 'tok.retenu-0123456789abc')
    const refresh = vi.fn().mockResolvedValue({ premium: true })
    await syncEntitlement({ native: null, refresh })
    expect(refresh).toHaveBeenCalledWith({ purchaseToken: 'tok.retenu-0123456789abc' })
  })

  it('synchroniser : si Play Billing ne répond pas, on se rabat sur le jeton retenu', async () => {
    localStorage.setItem('halcya_purchase_token', 'tok.retenu-0123456789abc')
    const native = { queryPurchases: vi.fn().mockRejectedValue(new Error('SERVICE_DISCONNECTED')) }
    const refresh = vi.fn().mockResolvedValue({ premium: true })
    await syncEntitlement({ native, refresh })
    expect(refresh).toHaveBeenCalledWith({ purchaseToken: 'tok.retenu-0123456789abc' })
  })
})

describe('Paywall : montants calculés sur les prix de Google Play (jalon 6c-3)', () => {
  const nbsp = (v) => String(v).replace(/[\u00a0\u202f]/g, ' ')
  const plans = describePlans(PRODUCTS)

  it('équivalent mensuel de l’annuel (2,50 €), rien pour le mensuel', () => {
    const year = plans.find((p) => p.period === 'year')
    expect(nbsp(monthlyEquivalent(year))).toBe('2,50 €')
    expect(monthlyEquivalent(plans.find((p) => p.period === 'month'))).toBeNull()
  })

  it('économie de l’annuel sur 12 mois de mensuel : 50 %', () => {
    expect(annualSavingPercent(plans)).toBe(50)
  })

  it('aucune économie affichée sans les deux formules, avec deux devises, ou si elle est négligeable', () => {
    expect(annualSavingPercent([plans[0]])).toBeNull()
    expect(annualSavingPercent([{ ...plans[0], currency: 'USD' }, plans[1]])).toBeNull()
    expect(annualSavingPercent([{ period: 'year', priceMicros: 58_000_000, currency: 'EUR' }, { period: 'month', priceMicros: 4_990_000, currency: 'EUR' }])).toBeNull()
  })

  it('formatMicros refuse une devise absente ou inconnue', () => {
    expect(formatMicros(1_000_000, null)).toBeNull()
    expect(formatMicros(1_000_000, 'XXXX')).toBeNull()
  })
})

describe('Achats terminés hors du parcours d’achat (jalon 6c-3c)', () => {
  beforeEach(() => localStorage.clear())

  it('un paiement en attente confirmé plus tard est revérifié par le relais et retenu', async () => {
    const refresh = vi.fn().mockResolvedValue({ premium: true, source: 'play' })
    const ent = await handlePurchasesUpdated({ code: 0, purchases: [purchased('tok.confirme-0123456789ab')] }, { refresh })
    expect(refresh).toHaveBeenCalledWith({ purchaseToken: 'tok.confirme-0123456789ab' })
    expect(ent).toMatchObject({ premium: true })
    expect(getStoredPurchaseToken()).toBe('tok.confirme-0123456789ab')
  })

  it('annulation, erreur ou achat encore en attente : rien n’est envoyé au relais', async () => {
    const refresh = vi.fn()
    expect(await handlePurchasesUpdated({ code: 1, purchases: [] }, { refresh })).toBeNull()
    expect(await handlePurchasesUpdated({ code: 6, purchases: [purchased('tok.x-0123456789abcdef')] }, { refresh })).toBeNull()
    expect(await handlePurchasesUpdated({ code: 0, purchases: [{ ...purchased('tok.y-0123456789abcdef'), state: 'pending' }] }, { refresh })).toBeNull()
    expect(await handlePurchasesUpdated(null, { refresh })).toBeNull()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('l’événement et la fin de l’achat ne vérifient le même jeton qu’une fois', async () => {
    let release
    const refresh = vi.fn(() => new Promise((r) => (release = () => r({ premium: true }))))
    const event = { code: 0, purchases: [purchased('tok.unique-0123456789abc')] }
    const native = { purchase: vi.fn().mockResolvedValue({ status: 'purchased', purchases: event.purchases }) }
    const fromEvent = handlePurchasesUpdated(event, { refresh })
    const fromFlow = purchasePlan(describePlans(PRODUCTS)[1], { native, refresh })
    await vi.waitFor(() => expect(release).toBeTypeOf('function'))
    release()
    await Promise.all([fromEvent, fromFlow])
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('suivi : écoute Google Play, resynchronise au démarrage puis au retour dans l’app (au plus toutes les 15 min)', async () => {
    let listener
    const remove = vi.fn()
    const native = {
      addListener: vi.fn(async (name, fn) => {
        listener = fn
        return { remove }
      }),
      queryPurchases: vi.fn().mockResolvedValue({ purchases: [] }),
    }
    const refresh = vi.fn().mockResolvedValue({ premium: false })
    let t = 1_000_000
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' })
    const stop = await startPurchaseWatch({ native, refresh, doc, now: () => t })
    expect(native.addListener).toHaveBeenCalledWith('purchasesUpdated', expect.any(Function))
    await vi.waitFor(() => expect(native.queryPurchases).toHaveBeenCalledTimes(1))

    doc.dispatchEvent(new Event('visibilitychange'))
    t += 5 * 60_000
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(native.queryPurchases).toHaveBeenCalledTimes(1)
    t += 15 * 60_000
    doc.dispatchEvent(new Event('visibilitychange'))
    await vi.waitFor(() => expect(native.queryPurchases).toHaveBeenCalledTimes(2))

    listener({ code: 0, purchases: [purchased('tok.ecoute-0123456789abc')] })
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledWith({ purchaseToken: 'tok.ecoute-0123456789abc' }))

    stop()
    expect(remove).toHaveBeenCalled()
    t += 60 * 60_000
    doc.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()
    expect(native.queryPurchases).toHaveBeenCalledTimes(2)
  })

  it('suivi hors variante play (pas de plugin) : ne fait rien', async () => {
    const refresh = vi.fn()
    const stop = await startPurchaseWatch({ native: null, refresh })
    expect(typeof stop).toBe('function')
    stop()
    expect(refresh).not.toHaveBeenCalled()
  })
})
