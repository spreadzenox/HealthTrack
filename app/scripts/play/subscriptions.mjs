/**
 * Catalogue d'abonnement sur Google Play (étape 6d, journal/IDEES.md I158) : l'abonnement `halcya_premium`, ses deux
 * formules (`annuel` 29,99 €/an, `mensuel` 4,99 €/mois), la période de grâce et la suspension de compte, et l'offre
 * d'essai gratuit de 14 jours sur l'annuel, créés et activés par l'API Android Publisher v3 (monetization).
 *
 * Idempotent : on lit d'abord, on ne crée que ce qui manque, on n'active que ce qui est en brouillon. Les prix d'un
 * abonnement déjà créé ne sont jamais modifiés ici (un changement de prix touche les abonnés : décision du
 * propriétaire) ; un écart est seulement signalé. Les identifiants sont immuables chez Google : ils sont figés par
 * subscriptions.test.mjs et doivent rester ceux que l'app attend (src/services/playBilling.js).
 */
import { API, PlayApiError, call, withRetry } from './publish.mjs'
import { PREMIUM_BENEFITS } from '../../src/config/premiumBenefits.js'
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

const days = (iso) => Number(/^P(\d+)D$/.exec(iso)?.[1] ?? NaN)
export const holdTotalDays = (plan) => days(plan.grace) + days(plan.hold)

/** Corps des requêtes de création (fonction pure, testée). */
export function buildCatalog(packageName) {
  const subscription = {
    packageName,
    productId: PRODUCT_ID,
    listings: [
      {
        languageCode: 'fr-FR',
        title: `${APP_NAME} Premium`,
        description: 'Comprendre ce qui va avec vos bons et mauvais jours.',
        // Seulement ce qui est livré : jamais plus que le paywall (VC-17).
        benefits: PREMIUM_BENEFITS.filter((b) => b.delivered).map((b) => b.playLabel),
      },
    ],
    basePlans: BASE_PLANS.map(buildBasePlan),
  }
  const offer = {
    packageName,
    productId: PRODUCT_ID,
    basePlanId: TRIAL.basePlanId,
    offerId: TRIAL_OFFER_ID,
    phases: [{ recurrenceCount: 1, duration: TRIAL.duration, regionalConfigs: [{ regionCode: REGION.regionCode, free: {} }] }],
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
 * `{ created, addedBasePlans, offerCreated, activated, drift, plans, offerState }`.
 */
export async function ensureCatalog({ packageName, token, fetchImpl = fetch, sleep, log = () => {} }) {
  const f = withRetry(fetchImpl, sleep ? { sleep } : undefined)
  const base = `${API}/${packageName}/subscriptions`
  const sub = `${base}/${PRODUCT_ID}`
  const rv = `regionsVersion.version=${encodeURIComponent(REGIONS_VERSION)}`
  const catalog = buildCatalog(packageName)
  const result = { created: false, addedBasePlans: [], offerCreated: false, activated: [], drift: [] }

  let remote = null
  try {
    remote = await call(f, 'lecture de l’abonnement', sub, { token })
  } catch (err) {
    if (!notFound(err)) throw err
  }

  if (!remote) {
    log(`Création de l’abonnement ${PRODUCT_ID}…`)
    remote = await call(f, 'création de l’abonnement', `${base}?productId=${PRODUCT_ID}&${rv}`, { method: 'POST', token, body: catalog.subscription })
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
    for (const want of BASE_PLANS) {
      const got = (remote.basePlans ?? []).find((p) => p.basePlanId === want.basePlanId)
      const fr = got?.regionalConfigs?.find((c) => c.regionCode === REGION.regionCode)
      const expected = formatPrice({ currencyCode: REGION.currencyCode, ...want.price })
      if (fr && formatPrice(fr.price) !== expected) {
        result.drift.push(`${want.basePlanId} : ${formatPrice(fr.price)} sur Play, ${expected} attendu (non modifié)`)
      }
    }
  }

  const offerUrl = `${sub}/basePlans/${TRIAL.basePlanId}/offers`
  let offer = null
  try {
    offer = await call(f, 'lecture de l’offre d’essai', `${offerUrl}/${TRIAL_OFFER_ID}`, { token })
  } catch (err) {
    if (!notFound(err)) throw err
  }
  if (!offer) {
    log(`Création de l’offre ${TRIAL_OFFER_ID}…`)
    offer = await call(f, 'création de l’offre d’essai', `${offerUrl}?offerId=${TRIAL_OFFER_ID}&${rv}`, { method: 'POST', token, body: catalog.offer })
    result.offerCreated = true
  }

  // Formules et offres naissent en brouillon ; la formule doit être active pour que l'offre serve.
  for (const plan of remote.basePlans ?? []) {
    if (!BASE_PLANS.some((p) => p.basePlanId === plan.basePlanId) || plan.state === 'ACTIVE') continue
    log(`Activation de la formule ${plan.basePlanId}…`)
    await call(f, `activation de la formule ${plan.basePlanId}`, `${sub}/basePlans/${plan.basePlanId}:activate`, {
      method: 'POST',
      token,
      body: { packageName, productId: PRODUCT_ID, basePlanId: plan.basePlanId },
    })
    result.activated.push(plan.basePlanId)
  }
  if (offer.state !== 'ACTIVE') {
    log(`Activation de l’offre ${TRIAL_OFFER_ID}…`)
    await call(f, 'activation de l’offre d’essai', `${offerUrl}/${TRIAL_OFFER_ID}:activate`, {
      method: 'POST',
      token,
      body: { packageName, productId: PRODUCT_ID, basePlanId: TRIAL.basePlanId, offerId: TRIAL_OFFER_ID },
    })
    result.activated.push(TRIAL_OFFER_ID)
  }

  // Relecture : ce que Play a réellement enregistré (sert aussi de sonde aux runs suivants).
  const final = await call(f, 'relecture de l’abonnement', sub, { token })
  const finalOffer = await call(f, 'relecture de l’offre d’essai', `${offerUrl}/${TRIAL_OFFER_ID}`, { token })
  result.plans = (final.basePlans ?? []).map((p) => ({
    basePlanId: p.basePlanId,
    state: p.state ?? '?',
    period: p.autoRenewingBasePlanType?.billingPeriodDuration ?? '?',
    price: formatPrice(p.regionalConfigs?.find((c) => c.regionCode === REGION.regionCode)?.price),
  }))
  result.offerState = finalOffer.state ?? '?'
  return result
}
