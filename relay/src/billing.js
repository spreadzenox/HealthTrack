/**
 * Abonnements Google Play (jalon 6b) : le relais est la seule source de vérité des droits premium de la variante play.
 *
 * - L'app envoie le jeton d'achat que Play Billing lui a remis ; le relais relit l'abonnement chez Google
 *   (`purchases.subscriptionsv2.get`, Android Publisher API) sous l'identité relay-runtime, en déduit les droits,
 *   et en accuse réception côté serveur (sans accusé sous 3 jours, Google rembourse l'achat).
 * - Les notifications en temps réel (RTDN, sujet Pub/Sub play-rtdn, abonnement push créé par la CI) ne sont qu'un
 *   signal : le relais relit l'abonnement et accuse réception, même si l'app n'est jamais rouverte.
 * - Rien n'est stocké : ni jeton, ni compte. Les journaux ne contiennent que le type de notification, l'état et une
 *   empreinte courte du jeton.
 * - « Période de lancement » (P23, option ②) : entre `from` (inclus, facultatif) et `until` (exclu), toute installation
 *   de la variante play a les droits premium, sans achat (pour les testeurs du test fermé). Réglée dans
 *   src/launch-period.json ; `off` la coupe sans toucher aux dates. Vide par défaut.
 */
import { createHash } from 'node:crypto'
import { HttpError } from './http.js'

const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'
const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
export const ANDROIDPUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher'

/** Jetons d'achat Play : longues chaînes opaques (lettres, chiffres, points, tirets, soulignés). */
const PURCHASE_TOKEN = /^[A-Za-z0-9._-]{20,4096}$/
/** Transactions StoreKit 2 de l'app iPhone (I6-RELAIS) : JWS compact, jusqu'à 16 Kio (trois certificats dans l'en-tête). */
const JWS_TOKEN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
export const isTokenShape = (token) => typeof token === 'string' &&
  (PURCHASE_TOKEN.test(token) || (token.length <= 16_384 && JWS_TOKEN.test(token)))

/**
 * Niveaux payants (31/10) : Silver = l'abonnement historique `halcya_premium`, Gold = le produit séparé `halcya_gold`.
 * Le relais déduit le niveau du produit de l'achat relu chez Google, jamais d'une déclaration de l'app.
 */
export const SILVER_PRODUCT_ID = 'halcya_premium'
export const GOLD_PRODUCT_ID = 'halcya_gold'
export const tierOfProduct = (productId) => (productId === GOLD_PRODUCT_ID ? 'gold' : 'silver')

export const hashToken = (token) => createHash('sha256').update(String(token)).digest('hex').slice(0, 12)

/**
 * Identifiant de compte masqué (`obfuscatedAccountId`) que l'app passe à Play Billing : empreinte de l'identifiant
 * aléatoire d'installation, 64 caractères au plus, aucune donnée personnelle.
 */
export const accountIdFor = (installId) => createHash('sha256').update(`halcya:${installId}`).digest('hex')

/** Types de notification RTDN (subscriptionNotification.notificationType), pour des journaux lisibles. */
export const RTDN_TYPES = {
  1: 'RECOVERED', 2: 'RENEWED', 3: 'CANCELED', 4: 'PURCHASED', 5: 'ON_HOLD', 6: 'IN_GRACE_PERIOD', 7: 'RESTARTED',
  8: 'PRICE_CHANGE_CONFIRMED', 9: 'DEFERRED', 10: 'PAUSED', 11: 'PAUSE_SCHEDULE_CHANGED', 12: 'REVOKED',
  13: 'EXPIRED', 17: 'ITEMS_CHANGED', 18: 'CANCELLATION_SCHEDULED', 19: 'PRICE_CHANGE_UPDATED',
  20: 'PENDING_PURCHASE_CANCELED', 22: 'PRICE_STEP_UP_CONSENT_UPDATED',
}

export class PlayApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

/** Client minimal de l'API Android Publisher (lecture d'un abonnement, accusé de réception). */
export function createPlayClient({ packageName, getToken, fetchImpl = fetch, timeoutMs = 15_000 }) {
  async function call(url, init = {}) {
    const token = await getToken()
    const res = await fetchImpl(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (res.ok) {
      const text = await res.text()
      return text ? JSON.parse(text) : {}
    }
    const text = await res.text()
    let message = text
    try {
      message = JSON.parse(text).error?.message || text
    } catch { /* texte brut */ }
    throw new PlayApiError(String(message).slice(0, 300), res.status)
  }
  const base = `${API}/${encodeURIComponent(packageName)}/purchases`
  return {
    getSubscription: (purchaseToken) =>
      call(`${base}/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`),
    acknowledge: (productId, purchaseToken) =>
      call(`${base}/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`, {
        method: 'POST',
        body: '{}',
      }),
  }
}

/** États qui donnent droit au premium (la période de grâce aussi : Google réessaie le paiement). */
const PREMIUM_STATES = new Set(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'])

const SHORT_STATE = {
  SUBSCRIPTION_STATE_ACTIVE: 'active',
  SUBSCRIPTION_STATE_IN_GRACE_PERIOD: 'grace',
  SUBSCRIPTION_STATE_ON_HOLD: 'on_hold',
  SUBSCRIPTION_STATE_PAUSED: 'paused',
  SUBSCRIPTION_STATE_CANCELED: 'canceled',
  SUBSCRIPTION_STATE_EXPIRED: 'expired',
  SUBSCRIPTION_STATE_PENDING: 'pending',
  SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED: 'pending_canceled',
}

/**
 * Droits déduits d'une réponse `subscriptionsv2.get`.
 * Un abonnement annulé reste premium jusqu'à la fin de la période payée ; en pause, suspendu (on_hold), expiré ou en
 * attente de paiement, il ne l'est pas.
 */
export function entitlementFrom(sub, now = Date.now()) {
  const items = Array.isArray(sub?.lineItems) ? sub.lineItems : []
  // Ligne qui expire le plus tard (un abonnement Halcya n'a qu'un produit, mais l'API en permet plusieurs)
  const item = items.reduce((best, it) => (!best || Date.parse(it.expiryTime ?? 0) > Date.parse(best.expiryTime ?? 0) ? it : best), null)
  const expiresMs = item?.expiryTime ? Date.parse(item.expiryTime) : NaN
  const rawState = sub?.subscriptionState ?? 'SUBSCRIPTION_STATE_UNSPECIFIED'
  const notExpired = Number.isFinite(expiresMs) && expiresMs > now
  const premium = PREMIUM_STATES.has(rawState)
    ? notExpired || rawState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
    : rawState === 'SUBSCRIPTION_STATE_CANCELED' && notExpired
  return {
    premium,
    tier: premium ? tierOfProduct(item?.productId) : null,
    state: SHORT_STATE[rawState] ?? 'unknown',
    productId: item?.productId ?? null,
    basePlanId: item?.offerDetails?.basePlanId ?? null,
    expiresAt: Number.isFinite(expiresMs) ? new Date(expiresMs).toISOString() : null,
    autoRenewing: Boolean(item?.autoRenewingPlan?.autoRenewEnabled),
    trial: Boolean(item?.offerPhase?.freeTrial),
    test: Boolean(sub?.testPurchase),
    needsAck: sub?.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING',
    replaces: sub?.linkedPurchaseToken ?? null,
    accountId: sub?.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null,
  }
}

/** Accuse réception d'un achat payé ou en essai (jamais d'un achat en attente de paiement). */
async function acknowledgeIfNeeded(play, ent, purchaseToken) {
  if (!ent.needsAck || !ent.productId || !['active', 'grace', 'canceled'].includes(ent.state)) return false
  await play.acknowledge(ent.productId, purchaseToken)
  return true
}

/** Date de fin (ISO) si la période de lancement court à l'instant `now`, sinon null. */
export const isLaunchPeriod = ({ from = '', until = '', off = false } = {}, now) => {
  if (off) return null
  const end = Date.parse(until ?? '')
  if (!Number.isFinite(end) || now >= end) return null
  const start = from ? Date.parse(from) : -Infinity
  if (Number.isNaN(start) || now < start) return null
  return new Date(end).toISOString()
}

/**
 * Réponse au format attendu par le validateur de capacitor-plugin-cdv-purchase (`ok`, `data.collection`), enrichie
 * de nos propres champs (`premium`, `source`, `state`…), pour l'app (jalon 6c).
 */
export function verifyResponse({ ent, launchUntil, acknowledged, accountMatch }) {
  const premium = Boolean(ent?.premium) || Boolean(launchUntil)
  const source = ent?.premium ? ent.source ?? 'play' : launchUntil ? 'launch' : null
  // Pendant la période de lancement, toute installation play a Gold (décision du 31/10), même abonnée Silver
  const tier = launchUntil ? 'gold' : ent?.premium ? ent.tier ?? tierOfProduct(ent.productId) : null
  const payload = {
    premium,
    source,
    tier,
    launchUntil,
    state: ent?.state ?? null,
    productId: ent?.productId ?? null,
    basePlanId: ent?.basePlanId ?? null,
    expiresAt: ent?.expiresAt ?? null,
    autoRenewing: ent?.autoRenewing ?? false,
    trial: ent?.trial ?? false,
    test: ent?.test ?? false,
    acknowledged: Boolean(acknowledged),
    replaces: ent?.replaces ?? null,
    accountMatch: accountMatch ?? null,
  }
  return {
    ok: true,
    data: {
      id: payload.productId,
      latest_receipt: true,
      transaction: { type: ent?.source === 'appstore' ? 'ios-appstore' : 'android-playstore' },
      collection: ent?.productId
        ? [{
            id: ent.productId,
            expiryDate: ent.expiresAt ? Date.parse(ent.expiresAt) : undefined,
            isExpired: !ent.premium,
            isBillingRetryPeriod: ent.state === 'grace',
            isTrialPeriod: ent.trial,
            renewalIntent: ent.autoRenewing ? 'Renew' : 'Lapse',
          }]
        : [],
    },
    ...payload,
  }
}

/** Jeton d'achat envoyé par l'app : au premier niveau, ou dans `transaction` (format cdv-purchase). */
export function purchaseTokenFrom(body) {
  const token = body?.purchaseToken ?? body?.transaction?.purchaseToken ?? null
  if (token == null || token === '') return null
  if (!isTokenShape(token)) {
    throw new HttpError(400, 'bad_token', 'Jeton d\'achat invalide.')
  }
  return token
}

/**
 * Vérifie le jeton OIDC d'une livraison push Pub/Sub (en-tête Authorization) : émis par Google pour le compte de
 * service attendu et pour l'adresse du relais. Lecture par le point tokeninfo de Google (pas de clé à gérer).
 */
export function createPushVerifier({ audience, serviceAccount, fetchImpl = fetch }) {
  return async (authorization) => {
    const match = /^Bearer\s+(\S+)$/.exec(String(authorization ?? ''))
    if (!match) return false
    const res = await fetchImpl(`${TOKENINFO_URL}?id_token=${encodeURIComponent(match[1])}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return false
    const claims = await res.json()
    const verified = claims.email_verified === true || claims.email_verified === 'true'
    const issuer = ['https://accounts.google.com', 'accounts.google.com'].includes(claims.iss)
    return issuer && verified && claims.email === serviceAccount && claims.aud === audience
  }
}

/**
 * Routes d'abonnement, branchées par server.js.
 * @param {{ play: ReturnType<typeof createPlayClient>, packageName: string, launchPremium?: { from?: string, until?: string, off?: boolean },
 *   verifyPush: (authorization: string) => Promise<boolean>, log?: (e: object) => void, now?: () => number }} deps
 */
export function createBillingRoutes({ play, appStore = null, packageName, launchPremium = {}, verifyPush, log = () => {}, now = Date.now }) {
  return {
    /** POST /v1/subscription/verify — droits premium d'une installation (avec ou sans jeton d'achat). */
    async verify(body, installId) {
      const launchUntil = isLaunchPeriod(launchPremium, now())
      const purchaseToken = purchaseTokenFrom(body)
      if (!purchaseToken) return { status: 200, payload: verifyResponse({ ent: null, launchUntil }) }

      // Achat iPhone (transaction StoreKit 2 signée) : vérifié sur place, sans appel à Google ni à Apple
      if (appStore?.isJws(purchaseToken)) {
        const signedRenewalInfo = body?.renewalInfo ?? body?.transaction?.renewalInfo ?? null
        let checked
        try {
          checked = appStore.verify(purchaseToken, installId, { signedRenewalInfo, now: now() })
        } catch (err) {
          if (!err?.code) throw err
          log({ event: 'verify', source: 'appstore', result: err.code, token: hashToken(purchaseToken) })
          return { status: 400, payload: { ok: false, error: 'invalid_purchase', message: 'Achat App Store non reconnu.', ...verifyResponse({ ent: null, launchUntil }) } }
        }
        const { ent, accountMatch, environment } = checked
        log({ event: 'verify', source: 'appstore', environment, state: ent.state, premium: ent.premium, tier: ent.tier, accountMatch, token: hashToken(purchaseToken) })
        return { status: 200, payload: verifyResponse({ ent, launchUntil, acknowledged: true, accountMatch }) }
      }

      let sub
      try {
        sub = await play.getSubscription(purchaseToken)
      } catch (err) {
        if (err instanceof PlayApiError && (err.status === 400 || err.status === 404 || err.status === 410)) {
          log({ event: 'verify', result: 'unknown_token', status: err.status, token: hashToken(purchaseToken) })
          return { status: 404, payload: { ok: false, error: 'unknown_purchase', message: 'Achat introuvable chez Google Play.', ...verifyResponse({ ent: null, launchUntil }) } }
        }
        throw err
      }
      const ent = entitlementFrom(sub, now())
      const accountMatch = ent.accountId ? ent.accountId === accountIdFor(installId) : null
      let acknowledged = !ent.needsAck
      try {
        if (await acknowledgeIfNeeded(play, ent, purchaseToken)) acknowledged = true
      } catch (err) {
        // L'accusé sera retenté à la prochaine vérification ou notification RTDN
        log({ event: 'ack_failed', status: err?.status ?? null, token: hashToken(purchaseToken) })
      }
      log({ event: 'verify', state: ent.state, premium: ent.premium, test: ent.test, acknowledged, accountMatch, token: hashToken(purchaseToken) })
      return { status: 200, payload: verifyResponse({ ent, launchUntil, acknowledged, accountMatch }) }
    },

    /**
     * POST /pubsub/rtdn — livraison push d'une notification RTDN. 204 quand elle est traitée ou à ignorer ;
     * 503 si Google est momentanément injoignable (Pub/Sub la relivrera).
     */
    async rtdn(body, authorization) {
      if (!(await verifyPush(authorization))) throw new HttpError(401, 'unauthenticated', 'Livraison non authentifiée.')
      const data = body?.message?.data
      if (typeof data !== 'string') throw new HttpError(400, 'bad_message', 'Message Pub/Sub attendu.')
      let note
      try {
        note = JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
      } catch {
        log({ event: 'rtdn', result: 'unreadable' })
        return { status: 204 }
      }
      if (note.packageName !== packageName) {
        log({ event: 'rtdn', result: 'other_package' })
        return { status: 204 }
      }
      if (note.testNotification) {
        log({ event: 'rtdn', type: 'TEST' })
        return { status: 204 }
      }
      const sn = note.subscriptionNotification
      if (!sn?.purchaseToken) {
        log({ event: 'rtdn', type: note.voidedPurchaseNotification ? 'VOIDED' : 'OTHER' })
        return { status: 204 }
      }
      const type = RTDN_TYPES[sn.notificationType] ?? `TYPE_${sn.notificationType}`
      try {
        const ent = entitlementFrom(await play.getSubscription(sn.purchaseToken), now())
        const acknowledged = await acknowledgeIfNeeded(play, ent, sn.purchaseToken)
        log({ event: 'rtdn', type, state: ent.state, premium: ent.premium, acknowledged, token: hashToken(sn.purchaseToken) })
        return { status: 204 }
      } catch (err) {
        const status = err?.status ?? null
        log({ event: 'rtdn', type, result: 'play_error', status, token: hashToken(sn.purchaseToken) })
        // Erreur définitive (jeton inconnu, droits manquants) : inutile que Pub/Sub relivre en boucle
        return { status: status && status < 500 && status !== 429 ? 204 : 503 }
      }
    },
  }
}
