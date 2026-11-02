import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync } from 'node:crypto'
import {
  parseAuthData, aaguidEnvironment, appleExtensions, coseP256ToKey, AuthDataError,
  AAGUID_PRODUCTION, AAGUID_DEVELOPMENT,
} from '../src/authdata.js'
import { encodeCbor } from './helpers/cborEncode.js'

// Team ID fictif : le vrai (P38) n'est pas nécessaire pour lire authData
const RP_ID_HASH = createHash('sha256').update('TEAMID1234.fr.jpesquet.sante').digest()

function freshKey() {
  const { publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  const jwk = publicKey.export({ format: 'jwk' })
  const x = Buffer.from(jwk.x, 'base64url')
  const y = Buffer.from(jwk.y, 'base64url')
  const point = Buffer.concat([Buffer.from([4]), x, y])
  const cose = new Map([[1, 2], [3, -7], [-1, 1], [-2, x], [-3, y]])
  return { point, cose, keyId: createHash('sha256').update(point).digest() }
}

function build({ flags, counter = 0, aaguid = AAGUID_PRODUCTION, credentialId, cose, extensions, rpIdHash = RP_ID_HASH }) {
  const head = Buffer.alloc(37)
  rpIdHash.copy(head, 0)
  head[32] = flags
  head.writeUInt32BE(counter, 33)
  const parts = [head]
  if (flags & 0x40) {
    const len = Buffer.alloc(2)
    len.writeUInt16BE(credentialId.length)
    parts.push(aaguid, len, credentialId, encodeCbor(cose))
  }
  if (flags & 0x80) parts.push(encodeCbor(extensions))
  return Buffer.concat(parts)
}

test('attestation : rpIdHash, compteur 0, aaguid, credentialId = keyId et clé P-256 relus', () => {
  const k = freshKey()
  const out = parseAuthData(build({ flags: 0x41, credentialId: k.keyId, cose: k.cose }))
  assert.deepEqual(out.rpIdHash, RP_ID_HASH)
  assert.equal(out.userPresent, true)
  assert.equal(out.counter, 0)
  assert.equal(aaguidEnvironment(out.aaguid), 'production')
  assert.deepEqual(out.credentialId, k.keyId)
  assert.deepEqual(out.publicKey, k.point)
  assert.equal(out.keyObject.asymmetricKeyDetails.namedCurve, 'prime256v1')
  // keyId = SHA-256 du point non compressé : ce que vérifiera appattest.js
  assert.deepEqual(createHash('sha256').update(out.publicKey).digest(), out.credentialId)
  assert.equal(out.extensions, null)
})

test('assertion : seulement rpIdHash, flags et compteur (gros-boutiste)', () => {
  const out = parseAuthData(build({ flags: 0x00, counter: 0x01020304 }))
  assert.equal(out.counter, 16909060)
  assert.equal(out.userPresent, false)
  assert.equal(out.aaguid, null)
  assert.equal(out.publicKey, null)
})

test('extensions d’Apple lues si présentes, ignorées sinon', () => {
  const k = freshKey()
  const extensions = new Map([['apple_validation_category_01', 4], ['apple_bundle_version_01', '1.2.0']])
  const out = parseAuthData(build({ flags: 0xc1, credentialId: k.keyId, cose: k.cose, extensions }))
  assert.deepEqual(appleExtensions(out.extensions), { category: 4, bundleVersion: '1.2.0' })
  assert.deepEqual(appleExtensions(null), { category: null, bundleVersion: null })
  assert.deepEqual(appleExtensions(new Map([['apple_validation_category_01', 'x']])), { category: null, bundleVersion: null })
})

test('environnement de la clé d’après l’aaguid', () => {
  assert.equal(aaguidEnvironment(AAGUID_DEVELOPMENT), 'development')
  assert.equal(aaguidEnvironment(Buffer.alloc(16)), null)
  assert.equal(aaguidEnvironment(null), null)
})

const rejects = (bytes, reason) =>
  assert.throws(() => parseAuthData(bytes), (e) => e instanceof AuthDataError && e.reason === reason)

test('refuse un authData tronqué, mal formé ou avec des octets en trop', () => {
  const k = freshKey()
  const good = build({ flags: 0x41, credentialId: k.keyId, cose: k.cose })
  rejects(good.subarray(0, 36), 'trop court')
  rejects(good.subarray(0, 50), 'données de clé tronquées')
  rejects(good.subarray(0, 37 + 18 + 10), 'credentialId invalide')
  rejects(good.subarray(0, good.length - 1), 'tronqué')
  rejects(Buffer.concat([good, Buffer.from([0])]), 'octets en trop')
  rejects(build({ flags: 0x41, credentialId: Buffer.alloc(0), cose: k.cose }), 'credentialId invalide')
  rejects(build({ flags: 0x81, extensions: [1] }), 'extensions invalides')
  rejects('pas des octets', 'pas des octets')
})

test('refuse une clé COSE qui n’est pas une clé P-256 valide', () => {
  const k = freshKey()
  const withCose = (cose) => build({ flags: 0x41, credentialId: k.keyId, cose })
  rejects(withCose(new Map([...k.cose, [3, -257]])), 'clé COSE non P-256')
  rejects(withCose(new Map([...k.cose, [-1, 2]])), 'clé COSE non P-256')
  rejects(withCose(new Map([...k.cose, [-2, Buffer.alloc(31)]])), 'coordonnées COSE invalides')
  rejects(withCose(new Map([...k.cose, [-3, Buffer.alloc(32, 7)]])), 'point hors de la courbe')
  rejects(withCose([1, 2]), 'clé COSE absente')
  assert.throws(() => coseP256ToKey(null), AuthDataError)
})
