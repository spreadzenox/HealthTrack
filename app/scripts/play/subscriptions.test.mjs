import { describe, it, expect, vi } from 'vitest'
import {
  buildCatalog,
  ensureCatalog,
  formatPrice,
  holdTotalDays,
  isPaymentProfilePending,
  BASE_PLANS,
  LISTING_LIMITS,
  PRODUCT_ID,
  TRIAL_OFFER_ID,
  REGIONS_VERSION,
  GOLD,
  GOLD_PRODUCT_ID,
  PRODUCTS,
} from './subscriptions.mjs'
import { SILVER_PRODUCT_ID as RELAY_SILVER, GOLD_PRODUCT_ID as RELAY_GOLD } from '../../../relay/src/billing.js'
import { API, PlayApiError, isAccessDenied } from './publish.mjs'
import { PRODUCT_ID as APP_PRODUCT_ID } from '../../src/services/playBilling.js'
import { deliveredBenefits, PREMIUM_BENEFITS } from '../../src/config/premiumBenefits.js'
import { FORBIDDEN_WORDING } from '../../src/data/wordingRules.js'

const PKG = 'fr.jpesquet.sante'
const SUB = `${API}/${PKG}/subscriptions/${PRODUCT_ID}`
const OFFERS = `${SUB}/basePlans/annuel/offers`
const RV = `regionsVersion.version=${encodeURIComponent(REGIONS_VERSION)}`

function fakePlay(routes) {
  const calls = []
  const fetchImpl = vi.fn(async (url, init) => {
    const key = `${init.method} ${url}`
    calls.push({ key, body: init.body ? JSON.parse(init.body) : undefined })
    let r = routes[key]
    if (Array.isArray(r)) r = r.shift()
    if (!r) r = { status: 404, body: { error: { message: `route inconnue ${key}` } } }
    const status = r.status ?? 200
    return { ok: status < 300, status, text: async () => JSON.stringify(r.body ?? {}) }
  })
  return { fetchImpl, calls }
}

const NOT_FOUND = { status: 404, body: { error: { message: 'Not found' } } }
const plan = (id, state, units = id === 'annuel' ? '29' : '4') => ({
  basePlanId: id,
  state,
  autoRenewingBasePlanType: { billingPeriodDuration: id === 'annuel' ? 'P1Y' : 'P1M' },
  regionalConfigs: [{ regionCode: 'FR', price: { currencyCode: 'EUR', units, nanos: 990000000 } }],
})
const remoteSub = (state) => ({ productId: PRODUCT_ID, listings: [{}], basePlans: [plan('annuel', state), plan('mensuel', state)] })

describe('identifiants (immuables chez Google)', () => {
  it('sont figés et sont ceux que l’app attend', () => {
    expect(PRODUCT_ID).toBe('halcya_premium')
    expect(APP_PRODUCT_ID).toBe(PRODUCT_ID)
    expect(BASE_PLANS.map((p) => p.basePlanId)).toEqual(['annuel', 'mensuel'])
    expect(TRIAL_OFFER_ID).toBe('essai-14j')
    expect(GOLD_PRODUCT_ID).toBe('halcya_gold')
  })

  it('sont ceux d’après lesquels le relais déduit le niveau (Silver / Gold)', () => {
    expect(RELAY_SILVER).toBe(PRODUCT_ID)
    expect(RELAY_GOLD).toBe(GOLD_PRODUCT_ID)
    expect(PRODUCTS.map((p) => [p.tier, p.productId])).toEqual([
      ['silver', 'halcya_premium'],
      ['gold', 'halcya_gold'],
    ])
  })
})

describe('Gold (halcya_gold)', () => {
  const { subscription, offer } = buildCatalog(PKG, GOLD)

  it('formule mensuelle à 9,99 €, sans essai (proposition P35)', () => {
    expect(subscription.productId).toBe('halcya_gold')
    expect(subscription.basePlans).toHaveLength(1)
    const [mensuel] = subscription.basePlans
    expect(mensuel.basePlanId).toBe('mensuel')
    expect(mensuel.autoRenewingBasePlanType).toMatchObject({ billingPeriodDuration: 'P1M', gracePeriodDuration: 'P7D', accountHoldDuration: 'P53D' })
    expect(mensuel.regionalConfigs[0].price).toEqual({ currencyCode: 'EUR', units: '9', nanos: 990000000 })
    expect(offer).toBeNull()
  })

  it('fiche dans les limites, 20 analyses par jour, sans nom de modèle ni promesse de précision', () => {
    const [listing] = subscription.listings
    expect(listing.title).toMatch(/Gold$/)
    expect([...listing.title].length).toBeLessThanOrEqual(LISTING_LIMITS.title)
    expect([...listing.description].length).toBeLessThanOrEqual(LISTING_LIMITS.description)
    expect(listing.benefits.length).toBeLessThanOrEqual(LISTING_LIMITS.benefits)
    expect(listing.benefits[0]).toBe('Analyse IA des repas, 20 par jour')
    for (const t of [listing.title, listing.description, ...listing.benefits]) {
      expect([...t].length).toBeLessThanOrEqual(t === listing.title ? LISTING_LIMITS.title : LISTING_LIMITS.description)
      expect(t).not.toMatch(/gemini|flash|erreur|précis/i)
      for (const { re } of FORBIDDEN_WORDING) expect(t).not.toMatch(re)
    }
    for (const b of listing.benefits) expect([...b].length).toBeLessThanOrEqual(LISTING_LIMITS.benefit)
  })

  it('rien sur Play : crée l’abonnement, active la formule, ne touche à aucune offre', async () => {
    const GSUB = `${API}/${PKG}/subscriptions/halcya_gold`
    const gplan = { ...plan('mensuel', 'ACTIVE', '9') }
    const play = fakePlay({
      [`GET ${GSUB}`]: [NOT_FOUND, { body: { productId: 'halcya_gold', basePlans: [gplan] } }],
      [`POST ${API}/${PKG}/subscriptions?productId=halcya_gold&${RV}`]: { body: { productId: 'halcya_gold', basePlans: [plan('mensuel', 'DRAFT', '9')] } },
      [`POST ${GSUB}/basePlans/mensuel:activate`]: { body: {} },
    })
    const r = await ensureCatalog({ packageName: PKG, token: 't', product: GOLD, fetchImpl: play.fetchImpl, sleep: async () => {} })
    expect(r).toMatchObject({ productId: 'halcya_gold', created: true, offerCreated: false, activated: ['mensuel'], drift: [], offerState: null })
    expect(r.plans).toEqual([{ basePlanId: 'mensuel', state: 'ACTIVE', period: 'P1M', price: formatPrice({ currencyCode: 'EUR', units: '9', nanos: 990000000 }) }])
    expect(play.calls.some((c) => c.key.includes('/offers'))).toBe(false)
    expect(play.calls.every((c) => !c.key.includes('halcya_premium'))).toBe(true)
  })

  it('déjà en place : aucune écriture ; prix changé à la main sur Play : signalé, jamais modifié', async () => {
    const GSUB = `${API}/${PKG}/subscriptions/halcya_gold`
    const play = fakePlay({ [`GET ${GSUB}`]: { body: { productId: 'halcya_gold', basePlans: [plan('mensuel', 'ACTIVE', '10')] } } })
    const r = await ensureCatalog({ packageName: PKG, token: 't', product: GOLD, fetchImpl: play.fetchImpl, sleep: async () => {} })
    expect(play.calls.every((c) => c.key.startsWith('GET'))).toBe(true)
    expect(r.drift).toHaveLength(1)
    expect(r.drift[0]).toMatch(/^halcya_gold\/mensuel : 10,99/)
  })
})

describe('buildCatalog', () => {
  const { subscription, offer } = buildCatalog(PKG)

  it('prix décidés par le propriétaire : 29,99 €/an et 4,99 €/mois, en France', () => {
    const [annuel, mensuel] = subscription.basePlans
    expect(annuel.autoRenewingBasePlanType.billingPeriodDuration).toBe('P1Y')
    expect(mensuel.autoRenewingBasePlanType.billingPeriodDuration).toBe('P1M')
    expect(formatPrice(annuel.regionalConfigs[0].price)).toBe(formatPrice({ currencyCode: 'EUR', units: '29', nanos: 990000000 }))
    expect(annuel.regionalConfigs[0]).toMatchObject({ regionCode: 'FR', newSubscriberAvailability: true, price: { currencyCode: 'EUR', units: '29', nanos: 990000000 } })
    expect(mensuel.regionalConfigs[0].price).toEqual({ currencyCode: 'EUR', units: '4', nanos: 990000000 })
  })

  it('grâce + suspension entre 30 et 60 jours, grâce au plus la période', () => {
    for (const p of BASE_PLANS) {
      expect(holdTotalDays(p)).toBeGreaterThanOrEqual(30)
      expect(holdTotalDays(p)).toBeLessThanOrEqual(60)
    }
    expect(BASE_PLANS.find((p) => p.basePlanId === 'mensuel').grace).toBe('P7D')
  })

  it('essai gratuit de 14 jours sur l’annuel, réservé à qui n’a jamais eu l’abonnement', () => {
    expect(offer).toMatchObject({ productId: PRODUCT_ID, basePlanId: 'annuel', offerId: 'essai-14j' })
    expect(offer.phases).toEqual([{ recurrenceCount: 1, duration: 'P14D', regionalConfigs: [{ regionCode: 'FR', free: {} }] }])
    expect(offer.targeting.acquisitionRule.scope).toEqual({ thisSubscription: {} })
  })

  it('fiche fr-FR dans les limites de Google, sans promettre plus que ce qui est livré', () => {
    const [listing] = subscription.listings
    expect(listing.languageCode).toBe('fr-FR')
    expect([...listing.title].length).toBeLessThanOrEqual(LISTING_LIMITS.title)
    expect([...listing.description].length).toBeLessThanOrEqual(LISTING_LIMITS.description)
    expect(listing.benefits.length).toBeGreaterThan(0)
    expect(listing.benefits.length).toBeLessThanOrEqual(LISTING_LIMITS.benefits)
    expect(listing.benefits).toEqual(deliveredBenefits().map((b) => b.playLabel))
    for (const t of [listing.title, listing.description, ...listing.benefits]) {
      for (const { re } of FORBIDDEN_WORDING) expect(t).not.toMatch(re)
    }
  })

  it('chaque avantage a une version courte pour Play (≤ 40 caractères)', () => {
    for (const b of PREMIUM_BENEFITS) {
      expect(b.playLabel, b.id).toBeTruthy()
      expect([...b.playLabel].length, b.playLabel).toBeLessThanOrEqual(LISTING_LIMITS.benefit)
    }
  })
})

describe('ensureCatalog', () => {
  const run = (routes) => {
    const play = fakePlay(routes)
    return { play, p: ensureCatalog({ packageName: PKG, token: 't', fetchImpl: play.fetchImpl, sleep: async () => {} }) }
  }

  it('rien sur Play : crée l’abonnement et l’essai, active les deux formules puis l’offre, relit', async () => {
    const { play, p } = run({
      [`GET ${SUB}`]: [NOT_FOUND, { body: remoteSub('ACTIVE') }],
      [`POST ${API}/${PKG}/subscriptions?productId=${PRODUCT_ID}&${RV}`]: { body: remoteSub('DRAFT') },
      [`GET ${OFFERS}/essai-14j`]: [NOT_FOUND, { body: { state: 'ACTIVE' } }],
      [`POST ${OFFERS}?offerId=essai-14j&${RV}`]: { body: { state: 'DRAFT' } },
      [`POST ${SUB}/basePlans/annuel:activate`]: { body: {} },
      [`POST ${SUB}/basePlans/mensuel:activate`]: { body: {} },
      [`POST ${OFFERS}/essai-14j:activate`]: { body: {} },
    })
    const r = await p
    expect(r).toMatchObject({ created: true, offerCreated: true, activated: ['annuel', 'mensuel', 'essai-14j'], drift: [], offerState: 'ACTIVE' })
    expect(r.plans.map((x) => [x.basePlanId, x.state, x.period])).toEqual([
      ['annuel', 'ACTIVE', 'P1Y'],
      ['mensuel', 'ACTIVE', 'P1M'],
    ])
    const create = play.calls.find((c) => c.key.startsWith('POST') && c.key.includes('?productId='))
    expect(create.body).toEqual(buildCatalog(PKG).subscription)
    // Les formules sont activées avant l'offre.
    const order = play.calls.filter((c) => c.key.endsWith(':activate')).map((c) => c.key.split('/').pop())
    expect(order).toEqual(['annuel:activate', 'mensuel:activate', 'essai-14j:activate'])
  })

  it('déjà en place et actif : aucune écriture', async () => {
    const { play, p } = run({
      [`GET ${SUB}`]: { body: remoteSub('ACTIVE') },
      [`GET ${OFFERS}/essai-14j`]: { body: { state: 'ACTIVE' } },
    })
    const r = await p
    expect(r).toMatchObject({ created: false, offerCreated: false, activated: [], addedBasePlans: [], drift: [] })
    expect(play.calls.every((c) => c.key.startsWith('GET'))).toBe(true)
  })

  it('formule manquante : ajoutée sans toucher à l’autre ; prix différent : signalé, jamais modifié', async () => {
    const existing = { productId: PRODUCT_ID, listings: [{}], basePlans: [plan('annuel', 'ACTIVE', '19')] }
    const patched = { ...existing, basePlans: [...existing.basePlans, plan('mensuel', 'DRAFT')] }
    const { play, p } = run({
      [`GET ${SUB}`]: [{ body: existing }, { body: patched }],
      [`PATCH ${SUB}?updateMask=basePlans&${RV}`]: { body: patched },
      [`GET ${OFFERS}/essai-14j`]: { body: { state: 'ACTIVE' } },
      [`POST ${SUB}/basePlans/mensuel:activate`]: { body: {} },
    })
    const r = await p
    expect(r.addedBasePlans).toEqual(['mensuel'])
    expect(r.activated).toEqual(['mensuel'])
    expect(r.drift).toHaveLength(1)
    expect(r.drift[0]).toMatch(/^halcya_premium\/annuel : 19,99/)
    const patch = play.calls.find((c) => c.key.startsWith('PATCH'))
    expect(patch.body.basePlans.map((b) => b.basePlanId)).toEqual(['annuel', 'mensuel'])
    expect(patch.body.basePlans[0].regionalConfigs[0].price.units).toBe('19')
  })

  it('accès refusé : erreur reconnaissable, rien n’est écrit', async () => {
    const { play, p } = run({ [`GET ${SUB}`]: { status: 403, body: { error: { message: 'The caller does not have permission' } } } })
    const err = await p.catch((e) => e)
    expect(isAccessDenied(err)).toBe(true)
    expect(play.calls).toHaveLength(1)
  })

  it('refus faute de profil de paiement vérifié : reconnu comme « à réessayer »', async () => {
    const { p } = run({
      [`GET ${SUB}`]: NOT_FOUND,
      [`POST ${API}/${PKG}/subscriptions?productId=${PRODUCT_ID}&${RV}`]: {
        status: 400,
        body: { error: { message: 'Please set up a merchant account before creating subscriptions.' } },
      },
    })
    const err = await p.catch((e) => e)
    expect(isPaymentProfilePending(err)).toBe(true)
    expect(err.message).toContain('création de l’abonnement : HTTP 400')
  })

  it('autre erreur : propagée telle quelle', async () => {
    const err = new PlayApiError('x', 400, 'Invalid duration')
    expect(isPaymentProfilePending(err)).toBe(false)
  })
})
