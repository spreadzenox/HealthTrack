/**
 * Droits premium de la variante play (jalon 6c) : c'est le relais Halcya qui les établit, en relisant l'achat chez
 * Google Play (`purchases.subscriptionsv2.get`) — jamais l'app seule. L'app retient le dernier état connu pour rester
 * utilisable hors connexion, sans jamais prolonger un droit au-delà de la date d'échéance donnée par le relais.
 *
 * Ce qui part : l'identifiant d'installation aléatoire (aiRelay.js) et, quand il existe, le jeton d'achat Google Play.
 * Aucune donnée de santé.
 */
import { RELAY_URL, getInstallId } from './aiRelay'
import { appLocale } from '../i18n/locale.js'
import { storeOfPurchase } from '../config/distribution'

const ENTITLEMENT_KEY = 'halcya_entitlement'
/** Événement `window` émis à chaque nouvel état donné par le relais (`detail` : les droits à jour). */
export const ENTITLEMENT_EVENT = 'halcya:entitlement'
export const ENTITLEMENT_TIMEOUT_MS = 15_000
const GRACE_OFFLINE_MS = 3 * 86_400_000

const FREE = Object.freeze({ premium: false, source: null, state: null, tier: null, productId: null, expiresAt: null, launchUntil: null })

/** Produit Play de Gold (relay/src/billing.js GOLD_PRODUCT_ID) ; tout autre abonnement Halcya est Silver. */
const GOLD_PRODUCT = 'halcya_gold'

const isFuture = (iso, now) => Boolean(iso) && Date.parse(iso) > now

function readStored() {
  try {
    const stored = JSON.parse(localStorage.getItem(ENTITLEMENT_KEY) || 'null')
    return stored && typeof stored === 'object' ? stored : null
  } catch {
    return null
  }
}

/** Ne garde que les champs utiles de la réponse du relais (format `verifyResponse`, relay/src/billing.js). */
function fromRelay(data) {
  return {
    premium: data.premium === true,
    source: ['play', 'appstore', 'launch'].includes(data.source) ? data.source : null,
    state: typeof data.state === 'string' ? data.state : null,
    tier: data.tier === 'gold' || data.tier === 'silver' ? data.tier : null,
    productId: typeof data.productId === 'string' ? data.productId : null,
    expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : null,
    launchUntil: typeof data.launchUntil === 'string' ? data.launchUntil : null,
    autoRenewing: data.autoRenewing === true,
    trial: data.trial === true,
    checkedAt: new Date().toISOString(),
  }
}

/**
 * Dernier état connu, recalculé à l'instant `now` : le premium s'éteint à l'échéance de l'abonnement ou de la période
 * de lancement, même sans nouvelle vérification.
 */
export function getEntitlement({ now = Date.now() } = {}) {
  const stored = readStored()
  if (!stored) return { ...FREE }
  const ent = { ...FREE, ...stored }
  if (ent.premium) {
    const until = ent.source === 'launch' ? ent.launchUntil : ent.expiresAt
    // Période de grâce : Google garde le droit ouvert ; hors connexion, on le garde au plus 3 jours après la
    // dernière vérification réussie
    const graceUntil = ent.state === 'grace' && ent.checkedAt ? new Date(Date.parse(ent.checkedAt) + GRACE_OFFLINE_MS).toISOString() : null
    ent.premium = isFuture(until, now) || isFuture(graceUntil, now)
  }
  return ent
}

/**
 * Demande au relais les droits de cette installation (avec le jeton d'achat Google Play s'il y en a un).
 * Hors connexion ou en cas d'erreur, rend le dernier état connu marqué `offline: true`.
 */
export async function refreshEntitlement({ purchaseToken = null, fetchImpl = globalThis.fetch, timeoutMs = ENTITLEMENT_TIMEOUT_MS } = {}) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
  try {
    const res = await fetchImpl(`${RELAY_URL}/v1/subscription/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Install-Id': getInstallId() },
      body: JSON.stringify(purchaseToken ? { purchaseToken } : {}),
      ...(controller ? { signal: controller.signal } : {}),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || typeof data.premium !== 'boolean') throw new Error(`relais ${res.status}`)
    const ent = fromRelay(data)
    try {
      localStorage.setItem(ENTITLEMENT_KEY, JSON.stringify(ent))
    } catch {
      // stockage indisponible : l'état sera redemandé
    }
    const current = getEntitlement()
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(ENTITLEMENT_EVENT, { detail: current }))
    return current
  } catch {
    return { ...getEntitlement(), offline: true }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// « 1er déc. 2026 » plutôt que « 1 déc. 2026 » en français
const shortDate = (iso) => {
  const date = new Date(iso)
  const text = date.toLocaleDateString(appLocale(), { day: 'numeric', month: 'short', year: 'numeric' })
  return date.getDate() === 1 && appLocale().startsWith('fr') ? text.replace(/^1(?=\s)/, '1er') : text
}

/** La fin de la période de lancement est exclue : on affiche le dernier jour offert (minuit → la veille). */
export const lastLaunchDay = (iso) => shortDate(Date.parse(iso) - 1)

/**
 * Niveau affiché (GOLD-b4) : « Gold » pendant la période de lancement (le relais y sert Gold) ou pour l'abonnement
 * `halcya_gold`, « Silver » pour l'abonnement historique ; null sans premium. Le relais reste seul juge du droit.
 */
export function tierName(ent) {
  if (!ent?.premium) return null
  if (ent.source === 'launch' || ent.tier === 'gold' || ent.productId === GOLD_PRODUCT) return 'Gold'
  return 'Silver'
}

/** Une phrase simple pour les Réglages, sans vocabulaire technique. */
export function describeEntitlement(ent) {
  const until = ent?.expiresAt ? shortDate(ent.expiresAt) : null
  if (ent?.premium && ent.source === 'launch') {
    return ent.launchUntil
      ? `Gold offert pendant le test, jusqu’au ${lastLaunchDay(ent.launchUntil)} : vous n’avez rien à payer.`
      : 'Gold offert pendant le test : vous n’avez rien à payer.'
  }
  const name = tierName(ent) ?? 'Premium'
  switch (ent?.state) {
    case 'active':
      if (!ent.premium) break
      if (ent.trial) return until ? `Essai gratuit en cours · premier paiement le ${until}, sauf si vous annulez.` : 'Essai gratuit en cours.'
      if (!until) return `${name} actif.`
      return ent.autoRenewing ? `${name} actif · renouvellement le ${until}.` : `${name} actif · jusqu’au ${until}.`
    case 'canceled':
      if (!ent.premium) break
      return until ? `Abonnement annulé · ${name} jusqu’au ${until}.` : 'Abonnement annulé.'
    case 'grace':
      return `${name} actif · paiement à régulariser ${storeOfPurchase(ent.source).inStore}.`
    case 'paused':
      return 'Abonnement en pause : le premium reprendra automatiquement à la fin de la pause.'
    case 'on_hold':
      return `Abonnement suspendu : paiement à régulariser ${storeOfPurchase(ent.source).inStore}.`
    default:
      break
  }
  return 'Version gratuite. Ce que vous notez et importez le reste, avec ou sans abonnement.'
}

/**
 * Page « Abonnements » du magasin de l'achat (règle Play et Apple : lien de gestion et d'annulation dans l'app) :
 * Google Play sur le bon produit, ou les abonnements du compte Apple pour un achat `source: 'appstore'`.
 */
export function manageSubscriptionUrl(productId, source) {
  return storeOfPurchase(source).manageUrl(productId)
}

/**
 * Paiement à régulariser (jalon 6e) : en période de grâce ou en suspension, Google recommande de le dire là où la
 * personne le voit, avec un lien direct vers ses abonnements — pas seulement dans les Paramètres.
 */
export function paymentIssue(ent) {
  if (ent?.state === 'grace') {
    return {
      title: 'Votre paiement n’est pas passé',
      text: `Votre premium reste actif pour l’instant. Mettez à jour votre moyen de paiement ${storeOfPurchase(ent.source).inStore} pour le garder.`,
      url: manageSubscriptionUrl(ent.productId, ent.source),
    }
  }
  if (ent?.state === 'on_hold') {
    return {
      title: 'Abonnement suspendu',
      text: `Le paiement n’a pas pu être fait. Votre premium reviendra dès que le paiement sera régularisé ${storeOfPurchase(ent.source).inStore}. Vos données ne changent pas.`,
      url: manageSubscriptionUrl(ent.productId, ent.source),
    }
  }
  return null
}
