/**
 * App Attest pour l'iPhone (I6-RELAIS-5b), l'équivalent de Play Integrity : l'iPhone crée une clé P-256 dans sa
 * Secure Enclave, la fait attester une fois par Apple, puis signe ses requêtes avec (assertions, étape 5c).
 * Ce module vérifie l'attestation (objet CBOR `{ fmt: 'apple-appattest', attStmt: { x5c, receipt }, authData }`) :
 *   1. chaîne x5c [certificat de la clé, intermédiaire] jusqu'à la racine App Attest d'Apple, épinglée ;
 *   2. nonce = SHA-256(authData ‖ SHA-256(défi)), égal à celui de l'extension 1.2.840.113635.100.8.2 ;
 *   3. keyId = SHA-256(clé publique du certificat, point non compressé) = credentialId de authData ;
 *   4. rpIdHash = SHA-256(« <Team ID>.fr.jpesquet.sante »), compteur 0, aaguid de production (ou de développement
 *      si on l'autorise), catégorie de validation 2 (TestFlight) ou 4 (App Store) si l'iPhone l'envoie.
 * Le reçu (receipt) n'est ni lu ni gardé : il ne sert qu'au « fraud metric », qui demanderait une clé secrète.
 * Puis, à chaque requête, l'assertion (5c, `createAssertionVerifier`) : signature de la clé attestée sur
 * SHA-256(authenticatorData ‖ SHA-256(clientData)), même rpIdHash, compteur strictement croissant, et un `clientData`
 * que le relais recompose lui-même (installation, heure à ±5 min, empreinte du corps). Le registre des clés est dans
 * `attestregistry.js`. Rien n'est branché dans le serveur à cette étape.
 */
import { createHash, createPublicKey, timingSafeEqual, verify as verifySignature, X509Certificate } from 'node:crypto'
import { decodeCbor, CborError } from './cbor.js'
import { parseAuthData, aaguidEnvironment, appleExtensions, AuthDataError } from './authdata.js'
import { APPSTORE_BUNDLE_ID } from './appstore.js'

/** Racine publique (https://www.apple.com/certificateauthority/Apple_App_Attestation_Root_CA.pem), P-384, 2020–2045. */
export const APPLE_APP_ATTEST_ROOT_PEM = `-----BEGIN CERTIFICATE-----
MIICITCCAaegAwIBAgIQC/O+DvHN0uD7jG5yH2IXmDAKBggqhkjOPQQDAzBSMSYw
JAYDVQQDDB1BcHBsZSBBcHAgQXR0ZXN0YXRpb24gUm9vdCBDQTETMBEGA1UECgwK
QXBwbGUgSW5jLjETMBEGA1UECAwKQ2FsaWZvcm5pYTAeFw0yMDAzMTgxODMyNTNa
Fw00NTAzMTUwMDAwMDBaMFIxJjAkBgNVBAMMHUFwcGxlIEFwcCBBdHRlc3RhdGlv
biBSb290IENBMRMwEQYDVQQKDApBcHBsZSBJbmMuMRMwEQYDVQQIDApDYWxpZm9y
bmlhMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAERTHhmLW07ATaFQIEVwTtT4dyctdh
NbJhFs/Ii2FdCgAHGbpphY3+d8qjuDngIN3WVhQUBHAoMeQ/cLiP1sOUtgjqK9au
Yen1mMEvRq9Sk3Jm5X8U62H+xTD3FE9TgS41o0IwQDAPBgNVHRMBAf8EBTADAQH/
MB0GA1UdDgQWBBSskRBTM72+aEH/pwyp5frq5eWKoTAOBgNVHQ8BAf8EBAMCAQYw
CgYIKoZIzj0EAwMDaAAwZQIwQgFGnByvsiVbpTKwSga0kP0e8EeDS4+sQmTvb7vn
53O5+FRXgeLhpJ06ysC5PrOyAjEAp5U4xDgEgllF7En3VcE3iexZZtKeYnpqtijV
oyFraWVIyd/dganmrduC1bmTBGwD
-----END CERTIFICATE-----
`
export const APPLE_APP_ATTEST_ROOT_SHA256 =
  '1C:B9:82:3B:A2:8B:A6:AD:2D:33:A0:06:94:1D:E2:AE:4F:51:3E:F1:D4:E8:31:B9:F7:E0:FA:7B:62:42:C9:32'

/** Taille maximale d'une attestation (≈ 5 Ko en pratique : deux certificats et le reçu). */
export const MAX_ATTESTATION_BYTES = 16 * 1024

/** Catégories de validation acceptées (extension apple_validation_category_01) : 2 TestFlight, 4 App Store. */
const RELEASE_CATEGORIES = new Set([2, 4])
const DEVELOPMENT_CATEGORY = 3

export class AppAttestError extends Error {
  /**
   * @param {'format'|'chain'|'nonce'|'key_id'|'rp_id'|'aaguid'|'counter'|'category'|'signature'|'clock'|
   *   'unknown_key'|'key_reused'} reason
   */
  constructor(reason, message) {
    super(message)
    this.name = 'AppAttestError'
    this.reason = reason
  }
}

const sha256 = (...parts) => {
  const h = createHash('sha256')
  for (const p of parts) h.update(p)
  return h.digest()
}
const same = (a, b) => Buffer.isBuffer(a) && Buffer.isBuffer(b) && a.length === b.length && timingSafeEqual(a, b)

// --- Lecture DER minimale : juste de quoi atteindre une extension d'un certificat déjà vérifié -----------------------

function tlv(buf, pos) {
  if (pos + 2 > buf.length) throw new AppAttestError('chain', 'Certificat tronqué.')
  const tag = buf[pos]
  let len = buf[pos + 1]
  let start = pos + 2
  if (len & 0x80) {
    const n = len & 0x7f
    if (n === 0 || n > 3 || start + n > buf.length) throw new AppAttestError('chain', 'Longueur DER invalide.')
    len = 0
    for (let i = 0; i < n; i++) len = len * 256 + buf[start + i]
    start += n
  }
  const end = start + len
  if (end > buf.length) throw new AppAttestError('chain', 'Certificat tronqué.')
  return { tag, start, end }
}

function children(buf, { start, end }) {
  const out = []
  for (let pos = start; pos < end;) {
    const t = tlv(buf, pos)
    out.push(t)
    pos = t.end
  }
  return out
}

/** OID 1.2.840.113635.100.8.2, encodé (contenu seul). */
const NONCE_OID = Buffer.from('2a864886f763640802', 'hex')

/** Valeur (contenu de l'OCTET STRING) de l'extension `oid` d'un certificat, ou null. */
export function certificateExtension(der, oid = NONCE_OID) {
  const cert = tlv(der, 0)
  const [tbs] = children(der, cert)
  if (!tbs || tbs.tag !== 0x30) throw new AppAttestError('chain', 'Certificat illisible.')
  const exts = children(der, tbs).find((t) => t.tag === 0xa3)
  if (!exts) return null
  const [list] = children(der, exts)
  for (const ext of children(der, list)) {
    const parts = children(der, ext)
    if (parts[0]?.tag !== 0x06) continue
    if (!der.subarray(parts[0].start, parts[0].end).equals(oid)) continue
    const value = parts[parts.length - 1]
    if (value.tag !== 0x04) throw new AppAttestError('nonce', 'Extension App Attest illisible.')
    return Buffer.from(der.subarray(value.start, value.end))
  }
  return null
}

/**
 * Nonce porté par l'extension App Attest : SEQUENCE { [1] { OCTET STRING (32 octets) } } (forme d'Apple), ou
 * SEQUENCE { OCTET STRING } (forme décrite plus sobrement dans la documentation).
 */
export function nonceFromExtension(value) {
  const seq = tlv(value, 0)
  if (seq.tag !== 0x30 || seq.end !== value.length) throw new AppAttestError('nonce', 'Extension App Attest illisible.')
  let [inner, ...rest] = children(value, seq)
  if (inner?.tag === 0xa1 && rest.length === 0) {
    ;[inner, ...rest] = children(value, inner)
  }
  if (inner?.tag !== 0x04 || rest.length || inner.end - inner.start !== 32) {
    throw new AppAttestError('nonce', 'Extension App Attest illisible.')
  }
  return Buffer.from(value.subarray(inner.start, inner.end))
}

/** Point non compressé X9.62 (65 octets) de la clé P-256 d'un certificat. */
function p256Point(cert) {
  const key = cert.publicKey
  if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') {
    throw new AppAttestError('chain', 'Clé du certificat non P-256.')
  }
  const jwk = key.export({ format: 'jwk' })
  return Buffer.concat([Buffer.from([0x04]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')])
}

const validAt = (cert, t) => Date.parse(cert.validFrom) <= t && t <= Date.parse(cert.validTo)

function toBytes(v, name) {
  if (Buffer.isBuffer(v)) return v
  if (v instanceof Uint8Array) return Buffer.from(v.buffer, v.byteOffset, v.byteLength)
  if (typeof v === 'string' && /^[A-Za-z0-9+/_-]+={0,2}$/.test(v)) return Buffer.from(v, 'base64')
  throw new AppAttestError('format', `${name} absent.`)
}

/**
 * @param {{ teamId: string, bundleId?: string, roots?: string[], now?: () => number, allowDevelopment?: boolean }} opts
 *   teamId : identifiant d'équipe Apple (10 caractères, P38) ; roots : racine App Attest d'Apple par défaut, une
 *   racine de test dans les tests ; allowDevelopment : accepter les clés des builds Xcode (aaguid « appattestdevelop »).
 */
export function createAppAttestVerifier({
  teamId, bundleId = APPSTORE_BUNDLE_ID, roots = [APPLE_APP_ATTEST_ROOT_PEM], now = Date.now, allowDevelopment = false,
}) {
  if (!/^[A-Z0-9]{10}$/.test(String(teamId ?? ''))) throw new Error('Team ID Apple invalide (10 caractères).')
  const rpIdHash = sha256(`${teamId}.${bundleId}`)
  const trusted = roots.map((pem) => new X509Certificate(pem))

  /**
   * @param {{ keyId: Buffer|string, attestation: Buffer|string, challenge: Buffer|string }} input keyId et
   *   attestation tels que l'app les envoie (base64 ou octets) ; challenge = le défi donné par le relais.
   * @returns {{ keyId: Buffer, publicKey: Buffer, keyObject: import('node:crypto').KeyObject,
   *   environment: 'production'|'development', category: number|null, bundleVersion: string|null, counter: 0 }}
   */
  return function verifyAttestation({ keyId, attestation, challenge }) {
    const keyIdBytes = toBytes(keyId, 'keyId')
    const raw = toBytes(attestation, 'Attestation')
    const challengeBytes = toBytes(challenge, 'Défi')
    if (keyIdBytes.length !== 32) throw new AppAttestError('key_id', 'keyId invalide.')
    if (raw.length > MAX_ATTESTATION_BYTES) throw new AppAttestError('format', 'Attestation trop longue.')
    if (challengeBytes.length < 16) throw new AppAttestError('format', 'Défi trop court.')

    let obj
    try {
      obj = decodeCbor(raw, { maxBytes: MAX_ATTESTATION_BYTES })
    } catch (err) {
      if (err instanceof CborError) throw new AppAttestError('format', 'Attestation illisible.')
      throw err
    }
    const stmt = obj instanceof Map ? obj.get('attStmt') : null
    const x5c = stmt instanceof Map ? stmt.get('x5c') : null
    const authBytes = obj instanceof Map ? obj.get('authData') : null
    if (!(obj instanceof Map) || obj.get('fmt') !== 'apple-appattest' || !(stmt instanceof Map) ||
      !Array.isArray(x5c) || x5c.length !== 2 || !x5c.every(Buffer.isBuffer) || !Buffer.isBuffer(authBytes)) {
      throw new AppAttestError('format', 'Ce n\'est pas une attestation App Attest.')
    }

    // 1. Chaîne de certificats
    let credCert, intermediate
    try {
      ;[credCert, intermediate] = x5c.map((der) => new X509Certificate(der))
    } catch {
      throw new AppAttestError('chain', 'Certificat illisible.')
    }
    const root = trusted.find((r) => intermediate.checkIssued(r) && intermediate.verify(r.publicKey))
    if (!root || !intermediate.ca) throw new AppAttestError('chain', 'Intermédiaire non émis par la racine App Attest.')
    if (credCert.ca || !credCert.checkIssued(intermediate) || !credCert.verify(intermediate.publicKey)) {
      throw new AppAttestError('chain', 'Certificat de la clé non émis par l\'intermédiaire.')
    }
    const t = now()
    if (![credCert, intermediate, root].every((c) => validAt(c, t))) {
      throw new AppAttestError('chain', 'Certificat hors de sa période de validité.')
    }

    // 2. Nonce
    const ext = certificateExtension(credCert.raw)
    if (!ext) throw new AppAttestError('nonce', 'Extension App Attest absente.')
    const expected = sha256(authBytes, sha256(challengeBytes))
    if (!same(nonceFromExtension(ext), expected)) throw new AppAttestError('nonce', 'Nonce différent.')

    // 3. Identifiant de la clé
    const point = p256Point(credCert)
    if (!same(sha256(point), keyIdBytes)) throw new AppAttestError('key_id', 'keyId différent de la clé attestée.')

    // 4. Données d'authentificateur
    let auth
    try {
      auth = parseAuthData(authBytes)
    } catch (err) {
      if (err instanceof AuthDataError) throw new AppAttestError('format', err.message)
      throw err
    }
    if (!same(auth.rpIdHash, rpIdHash)) throw new AppAttestError('rp_id', 'Attestation d\'une autre app.')
    if (auth.counter !== 0) throw new AppAttestError('counter', 'Compteur non nul.')
    const environment = aaguidEnvironment(auth.aaguid)
    if (!environment || (environment === 'development' && !allowDevelopment)) {
      throw new AppAttestError('aaguid', 'Environnement App Attest refusé.')
    }
    if (!same(auth.credentialId, keyIdBytes) || !same(auth.publicKey, point)) {
      throw new AppAttestError('key_id', 'Clé de authData différente de la clé attestée.')
    }
    const { category, bundleVersion } = appleExtensions(auth.extensions)
    if (category !== null && !RELEASE_CATEGORIES.has(category) &&
      !(allowDevelopment && category === DEVELOPMENT_CATEGORY)) {
      throw new AppAttestError('category', 'Catégorie de validation refusée.')
    }
    return { keyId: keyIdBytes, publicKey: point, keyObject: auth.keyObject, environment, category, bundleVersion, counter: 0 }
  }
}

// --- Assertions (I6-RELAIS-5c) -------------------------------------------------------------------------------------

/** Taille maximale d'une assertion (≈ 150 octets en pratique : une signature DER et 37 octets de authData). */
export const MAX_ASSERTION_BYTES = 1024

/** Écart toléré entre l'heure de l'iPhone et celle du relais. */
export const ASSERTION_CLOCK_SKEW_MS = 5 * 60 * 1000

/**
 * Ce que l'iPhone signe pour une requête : « halcya-assert:<installId>:<heure en ms>:<SHA-256 hex du corps> ».
 * Le relais le recompose à partir de la requête reçue : un corps ou une installation différents cassent la signature.
 */
export function assertionClientData({ installId, time, body = '' }) {
  const bodyHash = createHash('sha256').update(body ?? '').digest('hex')
  return `halcya-assert:${installId}:${time}:${bodyHash}`
}

/** Clé publique gardée (point X9.62 de 65 octets, en octets ou base64) → KeyObject. */
export function keyFromPoint(point) {
  const p = toBytes(point, 'Clé publique')
  if (p.length !== 65 || p[0] !== 0x04) throw new AppAttestError('format', 'Clé publique gardée invalide.')
  return createPublicKey({
    key: { kty: 'EC', crv: 'P-256', x: p.subarray(1, 33).toString('base64url'), y: p.subarray(33).toString('base64url') },
    format: 'jwk',
  })
}

/**
 * @param {{ teamId: string, bundleId?: string, now?: () => number, skewMs?: number }} opts
 */
export function createAssertionVerifier({ teamId, bundleId = APPSTORE_BUNDLE_ID, now = Date.now, skewMs = ASSERTION_CLOCK_SKEW_MS }) {
  if (!/^[A-Z0-9]{10}$/.test(String(teamId ?? ''))) throw new Error('Team ID Apple invalide (10 caractères).')
  const rpIdHash = sha256(`${teamId}.${bundleId}`)

  /**
   * @param {{ assertion: Buffer|string, installId: string, time: string|number, body?: Buffer|string,
   *   publicKey: Buffer|string|import('node:crypto').KeyObject, lastCounter: number }} input
   * @returns {{ counter: number }} le nouveau compteur, à garder
   */
  return function verifyAssertion({ assertion, installId, time, body = '', publicKey, lastCounter }) {
    const raw = toBytes(assertion, 'Assertion')
    if (raw.length > MAX_ASSERTION_BYTES) throw new AppAttestError('format', 'Assertion trop longue.')
    const t = Number(time)
    if (!/^\d{1,16}$/.test(String(time ?? '')) || !Number.isSafeInteger(t)) {
      throw new AppAttestError('clock', 'Heure de la requête absente.')
    }
    if (Math.abs(now() - t) > skewMs) throw new AppAttestError('clock', 'Heure de la requête trop éloignée.')

    let obj
    try {
      obj = decodeCbor(raw, { maxBytes: MAX_ASSERTION_BYTES })
    } catch (err) {
      if (err instanceof CborError) throw new AppAttestError('format', 'Assertion illisible.')
      throw err
    }
    const signature = obj instanceof Map ? obj.get('signature') : null
    const authBytes = obj instanceof Map ? obj.get('authenticatorData') : null
    if (!Buffer.isBuffer(signature) || !Buffer.isBuffer(authBytes)) {
      throw new AppAttestError('format', 'Ce n\'est pas une assertion App Attest.')
    }
    let auth
    try {
      auth = parseAuthData(authBytes)
    } catch (err) {
      if (err instanceof AuthDataError) throw new AppAttestError('format', err.message)
      throw err
    }
    if (auth.credentialId) throw new AppAttestError('format', 'Une assertion ne porte pas de clé.')

    const key = publicKey && typeof publicKey === 'object' && publicKey.asymmetricKeyType ? publicKey : keyFromPoint(publicKey)
    const clientData = assertionClientData({ installId, time: String(time), body })
    const nonce = sha256(authBytes, sha256(clientData))
    let ok = false
    try {
      ok = verifySignature('sha256', nonce, { key, dsaEncoding: 'der' }, signature)
    } catch {
      ok = false
    }
    if (!ok) throw new AppAttestError('signature', 'Signature de l\'assertion invalide.')
    if (!same(auth.rpIdHash, rpIdHash)) throw new AppAttestError('rp_id', 'Assertion d\'une autre app.')
    if (!Number.isInteger(lastCounter) || auth.counter <= lastCounter) {
      throw new AppAttestError('counter', 'Compteur déjà vu (rejeu).')
    }
    return { counter: auth.counter }
  }
}
