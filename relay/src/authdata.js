import { createPublicKey } from 'node:crypto'
import { decodeCborPrefix, CborError } from './cbor.js'

/**
 * Lecture des « données d'authentificateur » (format WebAuthn) qu'Apple met dans les attestations et les assertions
 * App Attest (I6-RELAIS-5a). Aucune vérification cryptographique ici : `appattest.js` s'en charge.
 *
 *   rpIdHash (32) ‖ flags (1) ‖ counter (4, gros-boutiste)
 *   [si flag AT 0x40] aaguid (16) ‖ longueur de credentialId (2) ‖ credentialId ‖ clé publique COSE (CBOR)
 *   [si flag ED 0x80] extensions (table CBOR)
 */

export class AuthDataError extends Error {
  constructor(reason) {
    super(`authData illisible : ${reason}`)
    this.name = 'AuthDataError'
    this.reason = reason
  }
}

const FLAG_UP = 0x01
const FLAG_AT = 0x40
const FLAG_ED = 0x80

/** aaguid des clés App Attest : « appattest » + 7 octets nuls (TestFlight, App Store) ou « appattestdevelop ». */
export const AAGUID_PRODUCTION = Buffer.concat([Buffer.from('appattest'), Buffer.alloc(7)])
export const AAGUID_DEVELOPMENT = Buffer.from('appattestdevelop')

/** @returns {'production'|'development'|null} */
export function aaguidEnvironment(aaguid) {
  if (!Buffer.isBuffer(aaguid)) return null
  if (aaguid.equals(AAGUID_PRODUCTION)) return 'production'
  if (aaguid.equals(AAGUID_DEVELOPMENT)) return 'development'
  return null
}

/**
 * Convertit une clé COSE EC2 P-256 / ES256 en point non compressé X9.62 (65 octets) et en KeyObject.
 * @param {Map} cose
 */
export function coseP256ToKey(cose) {
  if (!(cose instanceof Map)) throw new AuthDataError('clé COSE absente')
  const x = cose.get(-2)
  const y = cose.get(-3)
  if (cose.get(1) !== 2 || cose.get(3) !== -7 || cose.get(-1) !== 1) throw new AuthDataError('clé COSE non P-256')
  if (!Buffer.isBuffer(x) || !Buffer.isBuffer(y) || x.length !== 32 || y.length !== 32) {
    throw new AuthDataError('coordonnées COSE invalides')
  }
  let keyObject
  try {
    keyObject = createPublicKey({
      key: { kty: 'EC', crv: 'P-256', x: x.toString('base64url'), y: y.toString('base64url') },
      format: 'jwk',
    })
  } catch {
    throw new AuthDataError('point hors de la courbe')
  }
  return { point: Buffer.concat([Buffer.from([0x04]), x, y]), keyObject }
}

/**
 * @param {Uint8Array} bytes
 * @returns {{
 *   rpIdHash: Buffer, flags: number, userPresent: boolean, counter: number,
 *   aaguid: Buffer|null, credentialId: Buffer|null, publicKey: Buffer|null, keyObject: import('node:crypto').KeyObject|null,
 *   extensions: Map|null,
 * }}
 */
export function parseAuthData(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new AuthDataError('pas des octets')
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (buf.length < 37) throw new AuthDataError('trop court')
  const rpIdHash = Buffer.from(buf.subarray(0, 32))
  const flags = buf[32]
  const counter = buf.readUInt32BE(33)
  let pos = 37
  const out = {
    rpIdHash,
    flags,
    userPresent: (flags & FLAG_UP) !== 0,
    counter,
    aaguid: null,
    credentialId: null,
    publicKey: null,
    keyObject: null,
    extensions: null,
  }
  try {
    if (flags & FLAG_AT) {
      if (buf.length < pos + 18) throw new AuthDataError('données de clé tronquées')
      out.aaguid = Buffer.from(buf.subarray(pos, pos + 16))
      const idLen = buf.readUInt16BE(pos + 16)
      pos += 18
      if (idLen === 0 || idLen > 1023 || buf.length < pos + idLen) throw new AuthDataError('credentialId invalide')
      out.credentialId = Buffer.from(buf.subarray(pos, pos + idLen))
      pos += idLen
      const cose = decodeCborPrefix(buf, pos, { maxDepth: 2, maxItems: 32 })
      const key = coseP256ToKey(cose.value)
      out.publicKey = key.point
      out.keyObject = key.keyObject
      pos = cose.end
    }
    if (flags & FLAG_ED) {
      const ext = decodeCborPrefix(buf, pos, { maxDepth: 4, maxItems: 64 })
      if (!(ext.value instanceof Map)) throw new AuthDataError('extensions invalides')
      out.extensions = ext.value
      pos = ext.end
    }
  } catch (err) {
    if (err instanceof CborError) throw new AuthDataError(err.reason)
    throw err
  }
  if (pos !== buf.length) throw new AuthDataError('octets en trop')
  return out
}

/**
 * Extensions propres à Apple (récentes, absentes sur les anciennes versions d'iOS) : catégorie de validation
 * (2 = TestFlight, 4 = App Store, 3 = développement, 0 = invalide) et version de l'app.
 * @param {Map|null} extensions
 * @returns {{ category: number|null, bundleVersion: string|null }}
 */
export function appleExtensions(extensions) {
  const category = extensions?.get('apple_validation_category_01')
  const version = extensions?.get('apple_bundle_version_01')
  return {
    category: Number.isInteger(category) ? category : null,
    bundleVersion: typeof version === 'string' ? version : null,
  }
}
