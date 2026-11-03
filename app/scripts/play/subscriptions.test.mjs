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
  SILVER,
  listingDiffers,
  missingRegions,
  regionPrice,
  GOLD_BASE_PLANS,
  SALE_REGIONS,
} from './subscriptions.mjs'
import { APP_NAME } from '../../src/config/brand.js'
import { tierName } from '../../src/services/entitlement.js'
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
const ALL = SALE_REGIONS.map((r) => r.regionCode)
const plan = (id, state, units = id === 'annuel' ? '29' : '4', regions = ALL) => ({
  basePlanId: id,
  state,
  autoRenewingBasePlanType: { billingPeriodDuration: id === 'annuel' ? 'P1Y' : 'P1M' },
  regionalConfigs: [
    { regionCode: 'FR', price: { currencyCode: 'EUR', units, nanos: 990000000 } },
    ...SALE_REGIONS.filter((r) => r.regionCode !== 'FR' && regions.includes(r.regionCode)).map((r) => ({
      regionCode: r.regionCode,
      newSubscriberAvailability: true,
      price: { currencyCode: r.currencyCode, units: '1', nanos: 0 },
    })),
  ],
})
const trialOffer = (state, regions = ALL) => ({
  offerId: 'essai-14j',
  state,
  phases: [{ recurrenceCount: 1, duration: 'P14D', regionalConfigs: regions.map((regionCode) => ({ regionCode, free: {} })) }],
  regionalConfigs: regions.map((regionCode) => ({ regionCode, newSubscriberAvailability: true })),
})
const silverListings = () => buildCatalog(PKG, SILVER).subscription.listings
const goldListings = () => buildCatalog(PKG, GOLD).subscription.listings
const remoteSub = (state) => ({ productId: PRODUCT_ID, listings: silverListings(), basePlans: [plan('annuel', state), plan('mensuel', state)] })

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
    expect(listing.benefits[0]).toBe('IA : 20/jour, estime mieux les quantités')
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
    expect(r.plans).toEqual([{ basePlanId: 'mensuel', state: 'ACTIVE', period: 'P1M', price: formatPrice({ currencyCode: 'EUR', units: '9', nanos: 990000000 }), regions: ALL }])
    expect(play.calls.some((c) => c.key.includes('/offers'))).toBe(false)
    expect(play.calls.every((c) => !c.key.includes('halcya_premium'))).toBe(true)
  })

  it('déjà en place : aucune écriture ; prix changé à la main sur Play : signalé, jamais modifié', async () => {
    const GSUB = `${API}/${PKG}/subscriptions/halcya_gold`
    const play = fakePlay({ [`GET ${GSUB}`]: { body: { productId: 'halcya_gold', listings: goldListings(), basePlans: [plan('mensuel', 'ACTIVE', '10')] } } })
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
    expect(offer.phases).toEqual([{ recurrenceCount: 1, duration: 'P14D', regionalConfigs: ALL.map((regionCode) => ({ regionCode, free: {} })) }])
    expect(offer.regionalConfigs.map((c) => c.regionCode)).toEqual(ALL)
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

describe('noms des formules (LISTING-2)', () => {
  it('le titre de chaque abonnement chez Google est le nom de l’app suivi du niveau que l’app affiche', () => {
    expect(SILVER.title).toBe(`${APP_NAME} ${tierName({ premium: true, productId: PRODUCT_ID })}`)
    expect(GOLD.title).toBe(`${APP_NAME} ${tierName({ premium: true, productId: GOLD_PRODUCT_ID })}`)
    expect([SILVER.title, GOLD.title]).toEqual(['Halcya Silver', 'Halcya Gold'])
  })

  it('« Premium » ne désigne plus une formule dans la fiche des abonnements', () => {
    for (const product of PRODUCTS) {
      const [l] = buildCatalog(PKG, product).subscription.listings
      for (const t of [l.title, l.description, ...l.benefits]) expect(t).not.toMatch(/premium/i)
    }
    expect(GOLD.description).toMatch(/^Tout Silver/)
  })

  it('listingDiffers : fiche absente, titre, description ou avantages différents', () => {
    const [want] = silverListings()
    expect(listingDiffers(undefined, want)).toBe(true)
    expect(listingDiffers([{ ...want, languageCode: 'en-US' }], want)).toBe(true)
    expect(listingDiffers([{ ...want }], want)).toBe(false)
    expect(listingDiffers([{ ...want, title: 'Halcya Premium' }], want)).toBe(true)
    expect(listingDiffers([{ ...want, description: 'x' }], want)).toBe(true)
    expect(listingDiffers([{ ...want, benefits: want.benefits.slice(1) }], want)).toBe(true)
  })
})

describe('pays de vente (P32)', () => {
  it('France, Belgique, Luxembourg, Suisse et Canada ; jamais les États-Unis', () => {
    expect(ALL).toEqual(['FR', 'BE', 'LU', 'CH', 'CA'])
    expect(ALL).not.toContain('US')
    expect(SALE_REGIONS.find((r) => r.regionCode === 'CH').currencyCode).toBe('CHF')
    expect(SALE_REGIONS.find((r) => r.regionCode === 'CA').currencyCode).toBe('CAD')
  })

  it('chaque formule a un prix dans chaque pays ; zone euro au même prix qu’en France', () => {
    for (const product of PRODUCTS) {
      for (const bp of buildCatalog(PKG, product).subscription.basePlans) {
        expect(bp.regionalConfigs.map((c) => c.regionCode)).toEqual(ALL)
        const fr = bp.regionalConfigs[0].price
        for (const c of bp.regionalConfigs) {
          expect(c.newSubscriberAvailability).toBe(true)
          expect(Number(c.price.units) + c.price.nanos / 1e9).toBeGreaterThan(0)
          if (c.price.currencyCode === 'EUR') expect(c.price).toEqual(fr)
        }
      }
    }
  })

  it('l’annuel reste nettement moins cher que 12 mensuels dans chaque devise, Gold plus cher que Silver', () => {
    const [annuel, mensuel] = BASE_PLANS
    const [gold] = GOLD_BASE_PLANS
    const v = (plan, r) => {
      const p = regionPrice(plan, r)
      return Number(p.units) + p.nanos / 1e9
    }
    for (const r of SALE_REGIONS) {
      expect(v(annuel, r)).toBeLessThan(v(mensuel, r) * 12 * 0.6)
      expect(v(gold, r)).toBeGreaterThan(v(mensuel, r))
    }
  })

  it('missingRegions : seulement les pays de vente absents', () => {
    expect(missingRegions([{ regionCode: 'FR' }, { regionCode: 'CH' }]).map((r) => r.regionCode)).toEqual(['BE', 'LU', 'CA'])
    expect(missingRegions(undefined)).toHaveLength(5)
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
      [`GET ${OFFERS}/essai-14j`]: [NOT_FOUND, { body: trialOffer('ACTIVE') }],
      [`POST ${OFFERS}?offerId=essai-14j&${RV}`]: { body: trialOffer('DRAFT') },
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
      [`GET ${OFFERS}/essai-14j`]: { body: trialOffer('ACTIVE') },
    })
    const r = await p
    expect(r).toMatchObject({ created: false, offerCreated: false, activated: [], addedBasePlans: [], drift: [] })
    expect(play.calls.every((c) => c.key.startsWith('GET'))).toBe(true)
  })

  it('formule manquante : ajoutée sans toucher à l’autre ; prix différent : signalé, jamais modifié', async () => {
    const existing = { productId: PRODUCT_ID, listings: silverListings(), basePlans: [plan('annuel', 'ACTIVE', '19')] }
    const patched = { ...existing, basePlans: [...existing.basePlans, plan('mensuel', 'DRAFT')] }
    const { play, p } = run({
      [`GET ${SUB}`]: [{ body: existing }, { body: patched }],
      [`PATCH ${SUB}?updateMask=basePlans&${RV}`]: { body: patched },
      [`GET ${OFFERS}/essai-14j`]: { body: trialOffer('ACTIVE') },
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

  it('fiche encore « Halcya Premium » : seule la fiche fr-FR est réécrite, les autres langues et les prix restent', async () => {
    const en = { languageCode: 'en-US', title: 'Halcya Premium', description: 'd', benefits: ['b'] }
    const old = { ...silverListings()[0], title: 'Halcya Premium' }
    const existing = { ...remoteSub('ACTIVE'), listings: [en, old] }
    const patched = { ...existing, listings: [en, silverListings()[0]] }
    const { play, p } = run({
      [`GET ${SUB}`]: [{ body: existing }, { body: patched }],
      [`PATCH ${SUB}?updateMask=listings&${RV}`]: { body: patched },
      [`GET ${OFFERS}/essai-14j`]: { body: trialOffer('ACTIVE') },
    })
    const r = await p
    expect(r).toMatchObject({ listingUpdated: true, created: false, addedBasePlans: [], activated: [], drift: [] })
    const patches = play.calls.filter((c) => c.key.startsWith('PATCH'))
    expect(patches).toHaveLength(1)
    expect(patches[0].body.listings).toEqual([en, silverListings()[0]])
    expect(patches[0].body.basePlans).toEqual(existing.basePlans)
  })

  it('abonnement créé en France seulement : ajoute les autres pays aux formules et à l’essai, prix français intacts', async () => {
    const frOnly = { ...remoteSub('ACTIVE'), basePlans: [plan('annuel', 'ACTIVE', '29', ['FR']), plan('mensuel', 'ACTIVE', '4', ['FR'])] }
    const { play, p } = run({
      [`GET ${SUB}`]: [{ body: frOnly }, { body: remoteSub('ACTIVE') }],
      [`PATCH ${SUB}?updateMask=basePlans&${RV}`]: { body: remoteSub('ACTIVE') },
      [`GET ${OFFERS}/essai-14j`]: [{ body: trialOffer('ACTIVE', ['FR']) }, { body: trialOffer('ACTIVE') }],
      [`PATCH ${OFFERS}/essai-14j?updateMask=phases,regionalConfigs&${RV}`]: { body: trialOffer('ACTIVE') },
    })
    const r = await p
    expect(r.regionError).toBeNull()
    expect(r.addedRegions).toEqual(['annuel : BE, LU, CH, CA', 'mensuel : BE, LU, CH, CA', 'essai-14j : BE, LU, CH, CA'])
    const [subPatch, offerPatch] = play.calls.filter((c) => c.key.startsWith('PATCH'))
    const annuel = subPatch.body.basePlans[0]
    expect(annuel.regionalConfigs[0]).toEqual(frOnly.basePlans[0].regionalConfigs[0])
    expect(annuel.regionalConfigs.find((c) => c.regionCode === 'CH').price).toEqual({ currencyCode: 'CHF', units: '29', nanos: 0 })
    expect(annuel.regionalConfigs.find((c) => c.regionCode === 'BE').price).toEqual({ currencyCode: 'EUR', units: '29', nanos: 990000000 })
    expect(subPatch.body.listings).toEqual(frOnly.listings)
    expect(offerPatch.body.phases[0].regionalConfigs.map((c) => c.regionCode)).toEqual(ALL)
    expect(offerPatch.body.phases[0].regionalConfigs.every((c) => c.free)).toBe(true)
    expect(offerPatch.body.regionalConfigs.map((c) => c.regionCode)).toEqual(ALL)
    expect(r.plans[0].regions).toEqual(ALL)
    expect(play.calls.some((c) => c.key.endsWith(':activate'))).toBe(false)
  })

  it('pays refusés par Google : erreur rapportée, essai non touché, le reste continue', async () => {
    const frOnly = { ...remoteSub('ACTIVE'), basePlans: [plan('annuel', 'ACTIVE', '29', ['FR']), plan('mensuel', 'ACTIVE', '4', ['FR'])] }
    const { play, p } = run({
      [`GET ${SUB}`]: [{ body: frOnly }, { body: frOnly }],
      [`PATCH ${SUB}?updateMask=basePlans&${RV}`]: { status: 400, body: { error: { message: 'Price is out of range' } } },
      [`GET ${OFFERS}/essai-14j`]: { body: trialOffer('ACTIVE', ['FR']) },
    })
    const r = await p
    expect(r.regionError).toContain('Price is out of range')
    expect(r.addedRegions).toEqual([])
    expect(play.calls.filter((c) => c.key.startsWith('PATCH'))).toHaveLength(1)
    expect(r.plans[0].regions).toEqual(['FR'])
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
