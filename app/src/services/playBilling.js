/**
 * Google Play Billing dans la variante play (jalon 6c-2). Le plugin natif `PlayBilling` (PlayBillingPlugin.java, source
 * de la seule variante play) parle à la Play Billing Library ; ici : formules lues dans Play Billing (prix et essai
 * jamais codés en dur), achat, restauration. L'app ne décide jamais seule d'un droit : chaque jeton d'achat est
 * revérifié par le relais Halcya (entitlement.js), qui accuse aussi réception de l'achat auprès de Google.
 *
 * Ce qui part vers Google Play : l'identifiant de compte masqué (empreinte de l'identifiant d'installation aléatoire,
 * aucune donnée personnelle). Vers le relais : ce même identifiant d'installation et le jeton d'achat.
 */
import { getInstallId } from './aiRelay'
import { refreshEntitlement } from './entitlement'
import { FEATURES } from '../config/distribution'

/** Abonnement unique, deux formules (« base plans ») ; créés dans la Play Console par l'API (étape 6d). */
export const PRODUCT_ID = 'halcya_premium'
const PLAN_ORDER = ['annuel', 'mensuel']
const TOKEN_KEY = 'halcya_purchase_token'

/** Même empreinte que `accountIdFor` du relais (relay/src/billing.js) : sha256 hex de « halcya:<installation> ». */
export async function obfuscatedAccountId() {
  const bytes = new TextEncoder().encode(`halcya:${getInstallId()}`)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function getStoredPurchaseToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // stockage indisponible : la restauration le retrouvera dans Google Play
  }
}

/** Durée ISO 8601 (P14D, P2W, P1M, P1Y) en jours approximatifs. */
function periodDays(iso) {
  const m = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/.exec(String(iso ?? ''))
  if (!m) return null
  const [, y = 0, mo = 0, w = 0, d = 0] = m.map((v) => Number(v) || 0)
  return y * 365 + mo * 30 + w * 7 + d || null
}

const PERIODS = { P1Y: 'year', P1M: 'month' }

/**
 * Formules affichables à partir des ProductDetails réduits du plugin natif. Pour chaque formule, l'offre d'essai si
 * Google la propose à cette personne (il ne renvoie que les offres auxquelles elle a droit), sinon l'offre de base.
 */
export function describePlans(products) {
  const product = Array.isArray(products) ? products.find((p) => p?.productId === PRODUCT_ID) : null
  if (!product || !Array.isArray(product.offers)) return []
  const plans = []
  for (const basePlanId of PLAN_ORDER) {
    const offers = product.offers.filter((o) => o?.basePlanId === basePlanId && o.offerToken && Array.isArray(o.phases))
    const withTrial = offers.find((o) => o.phases.some((p) => p.priceMicros === 0))
    const offer = withTrial ?? offers.find((o) => !o.offerId)
    if (!offer) continue
    const recurring = offer.phases.find((p) => p.priceMicros > 0)
    if (!recurring?.formattedPrice || !PERIODS[recurring.billingPeriod]) continue
    const trial = offer.phases.find((p) => p.priceMicros === 0)
    plans.push({
      basePlanId,
      offerToken: offer.offerToken,
      period: PERIODS[recurring.billingPeriod],
      price: recurring.formattedPrice,
      priceMicros: recurring.priceMicros,
      currency: recurring.currency ?? null,
      trialDays: trial ? periodDays(trial.billingPeriod) : null,
    })
  }
  return plans
}

/** Le plugin natif, dans la seule variante play sur Android ; sinon null (sideload, navigateur, tests). */
export async function loadBillingPlugin() {
  if (!FEATURES.billing) return null
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core')
    if (!Capacitor?.isNativePlatform?.() || Capacitor.getPlatform?.() !== 'android') return null
    if (Capacitor.isPluginAvailable && !Capacitor.isPluginAvailable('PlayBilling')) return null
    return registerPlugin('PlayBilling')
  } catch {
    return null
  }
}

const resolveNative = async (native) => (native === undefined ? loadBillingPlugin() : native)

export async function loadPlans({ native } = {}) {
  const plugin = await resolveNative(native)
  if (!plugin) return []
  try {
    const { products } = await plugin.getProducts({ productIds: [PRODUCT_ID] })
    return describePlans(products)
  } catch {
    return []
  }
}

const ownPurchase = (purchases, state = 'purchased') =>
  (Array.isArray(purchases) ? purchases : []).find((p) => p?.state === state && p.products?.includes(PRODUCT_ID) && p.purchaseToken)

const ERROR_MESSAGE = 'Google Play n’a pas pu finaliser l’achat. Vérifiez votre connexion et réessayez ; rien n’a été débité.'

/**
 * Lance l'achat d'une formule. Rend `{ status: 'purchased' | 'pending' | 'cancelled' | 'error', entitlement?, message? }`.
 */
export async function purchasePlan(plan, { native, refresh = refreshEntitlement } = {}) {
  const plugin = await resolveNative(native)
  if (!plugin || !plan?.offerToken) return { status: 'error', message: ERROR_MESSAGE }
  let result
  try {
    result = await plugin.purchase({ productId: PRODUCT_ID, offerToken: plan.offerToken, obfuscatedAccountId: await obfuscatedAccountId() })
  } catch {
    return { status: 'error', message: ERROR_MESSAGE }
  }
  if (result?.status === 'cancelled') return { status: 'cancelled' }
  const done = ownPurchase(result?.purchases)
  if (done) {
    storeToken(done.purchaseToken)
    return { status: 'purchased', entitlement: await refresh({ purchaseToken: done.purchaseToken }) }
  }
  if (result?.status === 'pending' || ownPurchase(result?.purchases, 'pending')) {
    return { status: 'pending', message: 'Paiement en attente chez Google Play : le premium s’activera dès qu’il sera confirmé.' }
  }
  return { status: 'error', message: ERROR_MESSAGE }
}

/** « Restaurer un achat » : relit les abonnements de ce compte Google Play et les fait revérifier par le relais. */
export async function restorePurchases({ native, refresh = refreshEntitlement } = {}) {
  const plugin = await resolveNative(native)
  if (!plugin) return { found: false, entitlement: await refresh({ purchaseToken: getStoredPurchaseToken() }) }
  const { purchases } = await plugin.queryPurchases()
  const owned = ownPurchase(purchases)
  storeToken(owned?.purchaseToken ?? null)
  return { found: Boolean(owned), entitlement: await refresh({ purchaseToken: owned?.purchaseToken ?? null }) }
}

/** À l'ouverture des Réglages : droits à jour, avec Google Play s'il répond, sinon avec le dernier jeton retenu. */
export async function syncEntitlement({ native, refresh = refreshEntitlement } = {}) {
  const plugin = await resolveNative(native)
  if (plugin) {
    try {
      return (await restorePurchases({ native: plugin, refresh })).entitlement
    } catch {
      // Play Billing indisponible (pas de compte Google, Store absent) : on se rabat sur le jeton retenu
    }
  }
  return refresh({ purchaseToken: getStoredPurchaseToken() })
}
