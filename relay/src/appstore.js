/**
 * Abonnements de l'App Store (I6-RELAIS, demande du 01/11) : l'app iPhone envoie, dans le même champ `purchaseToken`
 * que Google Play, la transaction StoreKit 2 signée par Apple (JWS compact en trois parties). Le relais :
 * - vérifie la signature ES256 avec le certificat feuille de l'en-tête `x5c`, puis la chaîne feuille → intermédiaire →
 *   racine jusqu'à la racine publique d'Apple (Apple Root CA - G3), avec les marqueurs d'Apple propres aux certificats
 *   de l'App Store (OID 1.2.840.113635.100.6.11.1 sur la feuille, 1.2.840.113635.100.6.2.1 sur l'intermédiaire) ;
 * - contrôle bundleId, environnement (Sandbox pour TestFlight, Production), expiresDate et revocationDate ;
 * - en déduit les mêmes droits que pour Google Play (premium, tier, state, expiresAt, autoRenewing, trial), avec
 *   `source: 'appstore'`. Rien n'est stocké.
 * Le chemin Google Play ne change pas : un jeton qui n'a pas la forme d'un JWS part chez Google comme avant.
 */
import { createHash, verify as verifySignature, X509Certificate } from 'node:crypto'

/** Racine publique d'Apple (https://www.apple.com/certificateauthority/AppleRootCA-G3.cer), SHA-256 63:34:3A:BF…:91:79. */
export const APPLE_ROOT_CA_G3_PEM = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----
`
export const APPLE_ROOT_CA_G3_SHA256 = '63343ABFB89A6A03EBB57E9B3F5FA7BE7C4F5C756F3017B3A8C488C3653E9179'

/** Identifiant (bundle ID) de l'app iPhone. */
export const APPSTORE_BUNDLE_ID = 'fr.jpesquet.sante'
const ENVIRONMENTS = new Set(['Sandbox', 'Production'])

/** OID encodés (DER, étiquette + longueur) que porte chaque certificat de signature de l'App Store. */
const LEAF_OID = Buffer.from('060a2a864886f76364060b01', 'hex') // 1.2.840.113635.100.6.11.1
const INTERMEDIATE_OID = Buffer.from('060a2a864886f76364060201', 'hex') // 1.2.840.113635.100.6.2.1

const JWS = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
/** Taille maximale d'un JWS StoreKit (trois certificats dans l'en-tête : environ 5 Ko en pratique). */
export const MAX_JWS_LENGTH = 16_384
/** Une notification V2 emboîte la transaction et le renouvellement signés (deux JWS) : bien plus longue. */
export const MAX_NOTIFICATION_LENGTH = 64 * 1024

export class AppStoreJwsError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

const b64url = (s) => Buffer.from(s, 'base64url')
const json = (part) => JSON.parse(b64url(part).toString('utf8'))

/** En-tête JWS décodé, ou null si ce n'est pas un JWS (un jeton Google Play, par exemple). */
function jwsHeader(token, maxLength = MAX_JWS_LENGTH) {
  if (typeof token !== 'string' || token.length > maxLength || !JWS.test(token)) return null
  try {
    const header = json(token.split('.', 1)[0])
    return header && typeof header === 'object' && typeof header.alg === 'string' ? header : null
  } catch {
    return null
  }
}

/** Le jeton est-il un JWS signé (transaction StoreKit 2) plutôt qu'un jeton d'achat Google Play ? */
export const isAppStoreJws = (token) => jwsHeader(token) !== null

/**
 * `appAccountToken` que l'app iPhone passe à StoreKit : les 32 premiers chiffres de accountIdFor(installation), au
 * format UUID (8-4-4-4-12), en minuscules.
 */
export function appAccountTokenFor(installId) {
  // Même empreinte que accountIdFor (billing.js), recalculée ici pour éviter une importation circulaire
  const h = createHash('sha256').update(`halcya:${installId}`).digest('hex').slice(0, 32)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
}

/** Niveau d'un produit iPhone : halcya_gold… → Gold, halcya_premium… → Silver, sinon aucun. */
export function tierOfAppStoreProduct(productId) {
  const id = String(productId ?? '')
  if (id.startsWith('halcya_gold')) return 'gold'
  if (id.startsWith('halcya_premium')) return 'silver'
  return null
}

const validAt = (cert, t) => Date.parse(cert.validFrom) <= t && t <= Date.parse(cert.validTo)

/**
 * Vérificateur de JWS signés par l'App Store (transactions, informations de renouvellement, notifications V2).
 * @param {{ roots?: string[], now?: () => number }} [opts] racines de confiance (PEM) : celle d'Apple par défaut,
 *   une racine de test dans les tests.
 */
export function createAppStoreVerifier({ roots = [APPLE_ROOT_CA_G3_PEM], now = Date.now } = {}) {
  const trusted = roots.map((pem) => new X509Certificate(pem).raw)

  /** Charge utile vérifiée, ou AppStoreJwsError. */
  return function verifyJws(token, { maxLength = MAX_JWS_LENGTH } = {}) {
    const header = jwsHeader(token, maxLength)
    if (!header) throw new AppStoreJwsError('not_jws', 'Ce n\'est pas une transaction signée.')
    if (header.alg !== 'ES256') throw new AppStoreJwsError('bad_alg', 'Algorithme de signature inattendu.')
    const x5c = header.x5c
    if (!Array.isArray(x5c) || x5c.length !== 3 || !x5c.every((c) => typeof c === 'string')) {
      throw new AppStoreJwsError('bad_chain', 'Chaîne de certificats absente.')
    }
    let leaf, intermediate, root
    try {
      ;[leaf, intermediate, root] = x5c.map((c) => new X509Certificate(Buffer.from(c, 'base64')))
    } catch {
      throw new AppStoreJwsError('bad_chain', 'Certificat illisible.')
    }
    if (!trusted.some((raw) => raw.equals(root.raw))) throw new AppStoreJwsError('untrusted_root', 'Racine inconnue.')
    if (!intermediate.ca || !intermediate.checkIssued(root) || !intermediate.verify(root.publicKey)) {
      throw new AppStoreJwsError('bad_chain', 'Intermédiaire non émis par la racine.')
    }
    if (leaf.ca || !leaf.checkIssued(intermediate) || !leaf.verify(intermediate.publicKey)) {
      throw new AppStoreJwsError('bad_chain', 'Certificat de signature non émis par l\'intermédiaire.')
    }
    if (!leaf.raw.includes(LEAF_OID) || !intermediate.raw.includes(INTERMEDIATE_OID)) {
      throw new AppStoreJwsError('bad_chain', 'Certificats qui ne sont pas ceux de l\'App Store.')
    }
    const [h, p, s] = token.split('.')
    const signature = b64url(s)
    const ok = signature.length === 64 &&
      verifySignature('sha256', Buffer.from(`${h}.${p}`), { key: leaf.publicKey, dsaEncoding: 'ieee-p1363' }, signature)
    if (!ok) throw new AppStoreJwsError('bad_signature', 'Signature invalide.')
    let payload
    try {
      payload = json(p)
    } catch {
      throw new AppStoreJwsError('bad_payload', 'Contenu illisible.')
    }
    // Comme la bibliothèque serveur d'Apple : validité des certificats à la date de signature (sinon maintenant)
    const at = Number.isFinite(payload?.signedDate) ? payload.signedDate : now()
    if (![leaf, intermediate, root].every((c) => validAt(c, at))) {
      throw new AppStoreJwsError('expired_chain', 'Certificat hors de sa période de validité.')
    }
    return payload
  }
}

/**
 * Droits déduits d'une transaction StoreKit 2 vérifiée (et, si l'app l'envoie, des informations de renouvellement
 * vérifiées de la même façon : renouvellement automatique et période de grâce). Même forme que entitlementFrom (Play).
 */
export function entitlementFromTransaction(tx, renewal = null, now = Date.now()) {
  const sameSub = renewal && renewal.originalTransactionId === tx?.originalTransactionId ? renewal : null
  const expiresMs = Number(tx?.expiresDate)
  const revoked = tx?.revocationDate != null
  const tier = tierOfAppStoreProduct(tx?.productId)
  const active = !revoked && Number.isFinite(expiresMs) && expiresMs > now
  const graceMs = Number(sameSub?.gracePeriodExpiresDate)
  const grace = !revoked && !active && Number.isFinite(graceMs) && graceMs > now
  const autoRenewing = sameSub ? sameSub.autoRenewStatus === 1 : false
  const state = revoked ? 'revoked'
    : active ? (sameSub && !autoRenewing ? 'canceled' : 'active')
      : grace ? 'grace' : 'expired'
  const premium = Boolean(tier) && (active || grace)
  return {
    premium,
    tier: premium ? tier : null,
    state,
    source: 'appstore',
    productId: tx?.productId ?? null,
    basePlanId: null,
    expiresAt: Number.isFinite(expiresMs) ? new Date(expiresMs).toISOString() : null,
    autoRenewing,
    trial: tx?.offerDiscountType === 'FREE_TRIAL' || (tx?.offerType === 1 && tx?.offerDiscountType == null),
    test: tx?.environment === 'Sandbox',
    needsAck: false,
    replaces: null,
    accountId: typeof tx?.appAccountToken === 'string' ? tx.appAccountToken.toLowerCase() : null,
  }
}

/**
 * Vérification complète d'un achat iPhone pour /v1/subscription/verify.
 * @returns {Promise<{ ent: ReturnType<typeof entitlementFromTransaction>, accountMatch: boolean|null, environment: string,
 *   locked: boolean, lockError: boolean }>}
 */
export function createAppStoreBilling({ verifyJws, bundleId = APPSTORE_BUNDLE_ID, notifications = null }) {
  const checkApp = (payload) => {
    if (payload?.bundleId !== bundleId) throw new AppStoreJwsError('other_app', 'Achat d\'une autre app.')
    if (!ENVIRONMENTS.has(payload?.environment)) throw new AppStoreJwsError('bad_environment', 'Environnement inconnu.')
  }
  return {
    isJws: isAppStoreJws,
    async verify(signedTransaction, installId, { signedRenewalInfo = null, now = Date.now() } = {}) {
      const tx = verifyJws(signedTransaction)
      checkApp(tx)
      if (tx.type && tx.type !== 'Auto-Renewable Subscription') {
        throw new AppStoreJwsError('not_subscription', 'Ce n\'est pas un abonnement.')
      }
      // Informations de renouvellement : facultatives, ignorées si elles ne se vérifient pas
      let renewal = null
      if (signedRenewalInfo) {
        try {
          renewal = verifyJws(signedRenewalInfo)
        } catch {
          renewal = null
        }
        if (renewal?.environment !== tx.environment) renewal = null
      }
      let ent = entitlementFromTransaction(tx, renewal, now)
      // Verrou posé par une notification (remboursement, révocation…) après la signature de cette transaction.
      // Registre injoignable : on ne bloque pas un abonné, la transaction signée fait foi (lockError rapporté).
      let locked = null
      let lockError = false
      if (notifications && ent.premium) {
        try {
          locked = await notifications.lockFor(tx)
        } catch {
          lockError = true
        }
        if (locked) ent = { ...ent, premium: false, tier: null, state: locked.state, autoRenewing: false }
      }
      const accountMatch = ent.accountId ? ent.accountId === appAccountTokenFor(installId) : null
      return { ent, accountMatch, environment: tx.environment, locked: Boolean(locked), lockError }
    },
  }
}

/**
 * Notifications serveur V2 de l'App Store (I6-RELAIS-3) : l'App Store POSTe `{ signedPayload }` sur
 * /appstore/notifications à chaque changement d'un abonnement (renouvellement, expiration, remboursement, révocation,
 * période de grâce, changement de formule…). Même vérification que les transactions, puis celle des deux JWS
 * emboîtés (`data.signedTransactionInfo`, `data.signedRenewalInfo`).
 *
 * Le relais ne garde aucun achat : il vérifie à chaque appel la transaction que l'app lui envoie. Mais une transaction
 * signée avant un remboursement reste valide jusqu'à son `expiresDate`. La notification sert donc à poser un
 * « verrou » par abonnement (empreinte de `originalTransactionId`, sans identifiant de personne) quand il n'ouvre plus
 * de droits (remboursé, révoqué, expiré), et à le lever dès qu'il en rouvre (renouvellement, nouvel achat) ; le
 * registre garde le dernier état et sa date, pour qu'une notification ancienne relivrée ne reverrouille rien. Une
 * transaction signée avant le verrou est refusée ; une transaction signée après (achat refait) passe.
 */
export const subscriptionKey = (originalTransactionId) =>
  createHash('sha256').update(`appstore:${originalTransactionId}`).digest('hex').slice(0, 32)

/** Registre des verrous en mémoire (tests, ou relais sans Firestore). */
export function createMemoryStatusStore() {
  const map = new Map()
  return {
    async get(key) { return map.get(key) ?? null },
    async set(key, value) { map.set(key, { ...value }) },
  }
}

export function createAppStoreNotifications({ verifyJws, bundleId = APPSTORE_BUNDLE_ID, status = createMemoryStatusStore() }) {
  return {
    /**
     * Notification vérifiée et appliquée au registre.
     * @returns {{ type: string, subtype: string|null, environment: string|null, uuid: string|null,
     *   ent: object|null, lock: 'set'|'cleared'|null, key: string|null }}
     */
    async handle(signedPayload, now = Date.now()) {
      const note = verifyJws(signedPayload, { maxLength: MAX_NOTIFICATION_LENGTH })
      const data = note?.data ?? null
      const type = typeof note?.notificationType === 'string' ? note.notificationType : 'UNKNOWN'
      const subtype = typeof note?.subtype === 'string' ? note.subtype : null
      const uuid = typeof note?.notificationUUID === 'string' ? note.notificationUUID : null
      const environment = data?.environment ?? null
      const base = { type, subtype, environment, uuid, ent: null, lock: null, key: null }
      if (!data) return base // notifications récapitulatives sans abonnement (SUMMARY…)
      if (data.bundleId !== bundleId) throw new AppStoreJwsError('other_app', 'Notification d\'une autre app.')
      if (!ENVIRONMENTS.has(environment)) throw new AppStoreJwsError('bad_environment', 'Environnement inconnu.')
      if (type === 'TEST' || !data.signedTransactionInfo) return base
      const tx = verifyJws(data.signedTransactionInfo)
      if (tx.bundleId !== bundleId || tx.environment !== environment) {
        throw new AppStoreJwsError('other_app', 'Transaction d\'une autre app.')
      }
      let renewal = null
      if (data.signedRenewalInfo) {
        try {
          renewal = verifyJws(data.signedRenewalInfo)
        } catch {
          renewal = null
        }
      }
      if (!tx.originalTransactionId) return base
      // État à la date de la notification (l'App Store peut relivrer une notification ancienne : on ne remonte pas
      // le temps, et un verrou plus récent n'est jamais écrasé par une notification plus ancienne)
      const signedAt = Number.isFinite(note.signedDate) ? note.signedDate : now
      const ent = entitlementFromTransaction(tx, renewal, signedAt)
      const key = subscriptionKey(tx.originalTransactionId)
      const current = await status.get(key)
      if (current && current.at > signedAt) return { ...base, ent, key }
      // On garde aussi l'état « ouvert » et sa date, pour qu'une notification ancienne relivrée ne reverrouille pas
      await status.set(key, { state: ent.state, premium: ent.premium, at: signedAt })
      const wasLocked = Boolean(current && !current.premium)
      return { ...base, ent, key, lock: ent.premium ? (wasLocked ? 'cleared' : null) : 'set' }
    },

    /** Verrou posé après la signature de cette transaction ? (alors elle ne vaut plus) */
    async lockFor(tx) {
      if (!tx?.originalTransactionId) return null
      const current = await status.get(subscriptionKey(tx.originalTransactionId))
      const signedAt = Number.isFinite(tx.signedDate) ? tx.signedDate : 0
      return current && !current.premium && current.at > signedAt ? current : null
    },
  }
}

/** Registre des verrous dans Firestore (collection `appstore-status`, un document par abonnement, sans donnée personnelle). */
export function createFirestoreStatusStore({ project, getToken, fetchImpl = fetch, collection = 'appstore-status' }) {
  const url = (key) => `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${collection}/${key}`
  const headers = async () => ({ Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' })
  const fail = (what, res) => Object.assign(new Error(`Firestore : ${what} refusée (${res.status})`), { status: res.status })
  return {
    async get(key) {
      const res = await fetchImpl(url(key), { headers: await headers() })
      if (res.status === 404) return null
      if (!res.ok) throw fail('lecture', res)
      const f = (await res.json())?.fields ?? {}
      return { state: f.state?.stringValue ?? 'expired', premium: f.premium?.booleanValue === true, at: Number(f.at?.integerValue ?? 0) }
    },
    async set(key, { state, premium, at }) {
      const fields = { state: { stringValue: state }, premium: { booleanValue: Boolean(premium) }, at: { integerValue: String(at) } }
      const res = await fetchImpl(url(key), { method: 'PATCH', headers: await headers(), body: JSON.stringify({ fields }) })
      if (!res.ok) throw fail('écriture', res)
    },
  }
}

/** Empreinte SHA-256 (hexadécimal majuscule) d'un certificat PEM, pour vérifier la racine embarquée. */
export const fingerprint256 = (pem) => createHash('sha256').update(new X509Certificate(pem).raw).digest('hex').toUpperCase()
