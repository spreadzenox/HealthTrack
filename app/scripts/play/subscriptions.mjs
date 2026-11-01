/**
 * Catalogue d'abonnement sur Google Play (étape 6d, journal/IDEES.md I158) : l'abonnement `halcya_premium`, ses deux
 * formules (`annuel` 29,99 €/an, `mensuel` 4,99 €/mois), la période de grâce et la suspension de compte, et l'offre
 * d'essai gratuit de 14 jours sur l'annuel, créés et activés par l'API Android Publisher v3 (monetization).
 *
 * Idempotent : on lit d'abord, on ne crée que ce qui manque, on n'active que ce qui est en brouillon. Les prix d'un
 * abonnement déjà créé ne sont jamais modifiés ici (un changement de prix touche les abonnés : décision du
 * propriétaire) ; un écart est seulement signalé. Les identifiants sont immuables chez Google : ils sont figés par
 * subscriptions.test.mjs et doivent rester ceux que l'app attend (src/services/playBilling.js).
 *
 * Deux niveaux depuis le 01/11 (décision du 31/10, GOLD-b3) : Silver = `halcya_premium` (inchangé), Gold =
 * `halcya_gold`, formule `mensuel` à 9,99 €, sans essai (proposition P35 appliquée sans réponse du propriétaire).
 */
import { API, PlayApiError, call, withRetry } from './publish.mjs'
import { PREMIUM_BENEFITS, goldPlayBenefits } from '../../src/config/premiumBenefits.js'
import { APP_NAME } from '../../src/config/brand.js'

export const PRODUCT_ID = 'halcya_premium'
export const TRIAL_OFFER_ID = 'essai-14j'
export const REGIONS_VERSION = '2022/02'
export const REGION = { regionCode: 'FR', currencyCode: 'EUR' }

/** Limites de Google pour la fiche d'un abonnement (caractères). */
export const LISTING_LIMITS = { title: 55, description: 80, benefit: 40, benefits: 4 }

/**
 * Formules (décision du propriétaire du 20/10). Prix TTC vus par l'acheteur en France. Grâce + suspension entre
 * 30 et 60 jours au total (règle de Google) : le maximum, pour laisser le temps de corriger un moyen de paiement.
 */
export const BASE_PLANS = [
  { basePlanId: 'annuel', period: 'P1Y', price: { units: '29', nanos: 990000000 }, grace: 'P14D', hold: 'P46D' },
  { basePlanId: 'mensuel', period: 'P1M', price: { units: '4', nanos: 990000000 }, grace: 'P7D', hold: 'P53D' },
]
export const TRIAL = { basePlanId: 'annuel', duration: 'P14D' }

export const GOLD_PRODUCT_ID = 'halcya_gold'
export const GOLD_BASE_PLANS = [
  { basePlanId: 'mensuel', period: 'P1M', price: { units: '9', nanos: 990000000 }, grace: 'P7D', hold: 'P53D' },
]

/** Les abonnements tenus par ce script. Silver garde son identifiant historique. */
export const PRODUCTS = [
  {
    tier: 'silver',
    productId: PRODUCT_ID,
    title: `${APP_NAME} Premium`,
    description: 'Comprendre ce qui va avec vos bons et mauvais jours.',
    // Seulement ce qui est livré : jamais plus que le paywall (VC-17).
    benefits: () => PREMIUM_BENEFITS.filter((b) => b.delivered).map((b) => b.playLabel),
    basePlans: BASE_PLANS,
    trial: { ...TRIAL, offerId: TRIAL_OFFER_ID },
  },
  {
    tier: 'gold',
    productId: GOLD_PRODUCT_ID,
    title: `${APP_NAME} Gold`,
    description: 'Tout Premium, et deux fois plus d’analyses IA de repas par jour.',
    benefits: goldPlayBenefits,
    basePlans: GOLD_BASE_PLANS,
    trial: null,
  },
]
export const SILVER = PRODUCTS[0]
export const GOLD = PRODUCTS[1]

const days = (iso) => Number(/^P(\d+)D$/.exec(iso)?.[1] ?? NaN)
export const holdTotalDays = (plan) => days(plan.grace) + days(plan.hold)

/** Corps des requêtes de création (fonction pure, testée). `offer` est null pour un abonnement sans essai. */
export function buildCatalog(packageName, product = SILVER) {
  const subscription = {
    packageName,
    productId: product.productId,
    listings: [
      {
        languageCode: 'fr-FR',
        title: product.title,
        description: product.description,
        benefits: product.benefits(),
      },
    ],
    basePlans: product.basePlans.map(buildBasePlan),
  }
  const { trial } = product
  const offer = trial && {
    packageName,
    productId: product.productId,
    basePlanId: trial.basePlanId,
    offerId: trial.offerId,
    phases: [{ recurrenceCount: 1, duration: trial.duration, regionalConfigs: [{ regionCode: REGION.regionCode, free: {} }] }],
    regionalConfigs: [{ regionCode: REGION.regionCode, newSubscriberAvailability: true }],
    // « N'a jamais eu cet abonnement » : Google ne montre l'essai qu'aux personnes éligibles.
    targeting: { acquisitionRule: { scope: { thisSubscription: {} } } },
    offerTags: [{ tag: 'essai' }],
  }
  return { subscription, offer }
}

function buildBasePlan(plan) {
  return {
    basePlanId: plan.basePlanId,
    regionalConfigs: [
      {
        regionCode: REGION.regionCode,
        newSubscriberAvailability: true,
        price: { currencyCode: REGION.currencyCode, ...plan.price },
      },
    ],
    autoRenewingBasePlanType: {
      billingPeriodDuration: plan.period,
      gracePeriodDuration: plan.grace,
      accountHoldDuration: plan.hold,
      resubscribeState: 'RESUBSCRIBE_STATE_ACTIVE',
    },
  }
}

/** Prix lisible d'une configuration régionale de l'API (« 29,99 € »). */
export function formatPrice(price) {
  if (!price) return '?'
  const value = Number(price.units ?? 0) + Number(price.nanos ?? 0) / 1e9
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: price.currencyCode ?? 'EUR' }).format(value)
}

/** Refus lié au profil de paiement (vérification bancaire en cours) : à réessayer plus tard, sans rien contourner. */
export function isPaymentProfilePending(err) {
  return err instanceof PlayApiError && /payment|merchant|paiement|marchand/i.test(err.apiMessage ?? '')
}

const notFound = (err) => err instanceof PlayApiError && err.status === 404

/**
 * Crée ce qui manque, active les brouillons, relit et rend un résumé :
 * `{ productId, created, addedBasePlans, offerCreated, activated, drift, plans, offerState }`
 * (`offerState` null pour un abonnement sans essai).
 */
export async function ensureCatalog({ packageName, token, product = SILVER, fetchImpl = fetch, sleep, log = () => {} }) {
  const f = withRetry(fetchImpl, sleep ? { sleep } : undefined)
  const { productId, trial } = product
  const base = `${API}/${packageName}/subscriptions`
  const sub = `${base}/${productId}`
  const rv = `regionsVersion.version=${encodeURIComponent(REGIONS_VERSION)}`
  const catalog = buildCatalog(packageName, product)
  const result = { productId, created: false, addedBasePlans: [], offerCreated: false, activated: [], drift: [] }

  let remote = null
  try {
    remote = await call(f, 'lecture de l’abonnement', sub, { token })
  } catch (err) {
    if (!notFound(err)) throw err
  }

  if (!remote) {
    log(`Création de l’abonnement ${productId}…`)
    remote = await call(f, 'création de l’abonnement', `${base}?productId=${productId}&${rv}`, { method: 'POST', token, body: catalog.subscription })
    result.created = true
  } else {
    const have = new Set((remote.basePlans ?? []).map((p) => p.basePlanId))
    const missing = catalog.subscription.basePlans.filter((p) => !have.has(p.basePlanId))
    if (missing.length) {
      log(`Ajout des formules ${missing.map((p) => p.basePlanId).join(', ')}…`)
      remote = await call(f, 'ajout des formules', `${sub}?updateMask=basePlans&${rv}`, {
        method: 'PATCH',
        token,
        body: { ...remote, basePlans: [...(remote.basePlans ?? []), ...missing] },
      })
      result.addedBasePlans = missing.map((p) => p.basePlanId)
    }
    for (const want of product.basePlans) {
      const got = (remote.basePlans ?? []).find((p) => p.basePlanId === want.basePlanId)
      const fr = got?.regionalConfigs?.find((c) => c.regionCode === REGION.regionCode)
      const expected = formatPrice({ currencyCode: REGION.currencyCode, ...want.price })
      if (fr && formatPrice(fr.price) !== expected) {
        result.drift.push(`${productId}/${want.basePlanId} : ${formatPrice(fr.price)} sur Play, ${expected} attendu (non modifié)`)
      }
    }
  }

  const offerUrl = trial && `${sub}/basePlans/${trial.basePlanId}/offers`
  let offer = null
  if (trial) {
    try {
      offer = await call(f, 'lecture de l’offre d’essai', `${offerUrl}/${trial.offerId}`, { token })
    } catch (err) {
      if (!notFound(err)) throw err
    }
    if (!offer) {
      log(`Création de l’offre ${trial.offerId}…`)
      offer = await call(f, 'création de l’offre d’essai', `${offerUrl}?offerId=${trial.offerId}&${rv}`, { method: 'POST', token, body: catalog.offer })
      result.offerCreated = true
    }
  }

  // Formules et offres naissent en brouillon ; la formule doit être active pour que l'offre serve.
  for (const plan of remote.basePlans ?? []) {
    if (!product.basePlans.some((p) => p.basePlanId === plan.basePlanId) || plan.state === 'ACTIVE') continue
    log(`Activation de la formule ${productId}/${plan.basePlanId}…`)
    await call(f, `activation de la formule ${plan.basePlanId}`, `${sub}/basePlans/${plan.basePlanId}:activate`, {
      method: 'POST',
      token,
      body: { packageName, productId, basePlanId: plan.basePlanId },
    })
    result.activated.push(plan.basePlanId)
  }
  if (trial && offer.state !== 'ACTIVE') {
    log(`Activation de l’offre ${trial.offerId}…`)
    await call(f, 'activation de l’offre d’essai', `${offerUrl}/${trial.offerId}:activate`, {
      method: 'POST',
      token,
      body: { packageName, productId, basePlanId: trial.basePlanId, offerId: trial.offerId },
    })
    result.activated.push(trial.offerId)
  }

  // Relecture : ce que Play a réellement enregistré (sert aussi de sonde aux runs suivants).
  const final = await call(f, 'relecture de l’abonnement', sub, { token })
  const finalOffer = trial ? await call(f, 'relecture de l’offre d’essai', `${offerUrl}/${trial.offerId}`, { token }) : null
  result.plans = (final.basePlans ?? []).map((p) => ({
    basePlanId: p.basePlanId,
    state: p.state ?? '?',
    period: p.autoRenewingBasePlanType?.billingPeriodDuration ?? '?',
    price: formatPrice(p.regionalConfigs?.find((c) => c.regionCode === REGION.regionCode)?.price),
  }))
  result.offerState = trial ? (finalOffer.state ?? '?') : null
  return result
}
