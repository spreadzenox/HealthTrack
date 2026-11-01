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

export class AppStoreJwsError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

const b64url = (s) => Buffer.from(s, 'base64url')
const json = (part) => JSON.parse(b64url(part).toString('utf8'))

/** En-tête JWS décodé, ou null si ce n'est pas un JWS (un jeton Google Play, par exemple). */
function jwsHeader(token) {
  if (typeof token !== 'string' || token.length > MAX_JWS_LENGTH || !JWS.test(token)) return null
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
  return function verifyJws(token) {
    const header = jwsHeader(token)
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
 * @returns {{ ent: ReturnType<typeof entitlementFromTransaction>, accountMatch: boolean|null, environment: string }}
 */
export function createAppStoreBilling({ verifyJws, bundleId = APPSTORE_BUNDLE_ID }) {
  const checkApp = (payload) => {
    if (payload?.bundleId !== bundleId) throw new AppStoreJwsError('other_app', 'Achat d\'une autre app.')
    if (!ENVIRONMENTS.has(payload?.environment)) throw new AppStoreJwsError('bad_environment', 'Environnement inconnu.')
  }
  return {
    isJws: isAppStoreJws,
    verify(signedTransaction, installId, { signedRenewalInfo = null, now = Date.now() } = {}) {
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
      const ent = entitlementFromTransaction(tx, renewal, now)
      const accountMatch = ent.accountId ? ent.accountId === appAccountTokenFor(installId) : null
      return { ent, accountMatch, environment: tx.environment }
    },
  }
}

/** Empreinte SHA-256 (hexadécimal majuscule) d'un certificat PEM, pour vérifier la racine embarquée. */
export const fingerprint256 = (pem) => createHash('sha256').update(new X509Certificate(pem).raw).digest('hex').toUpperCase()
