/**
 * I6-RELAIS-5b : attestations App Attest synthétiques, signées par une chaîne de test générée à la volée (openssl,
 * dossier temporaire effacé). Aucune clé privée ni vraie attestation dans le dépôt ; Team ID fictif.
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash, createPrivateKey, X509Certificate } from 'node:crypto'
import {
  APPLE_APP_ATTEST_ROOT_PEM, APPLE_APP_ATTEST_ROOT_SHA256, AppAttestError, createAppAttestVerifier,
  certificateExtension, nonceFromExtension,
} from '../src/appattest.js'
import { AAGUID_DEVELOPMENT, AAGUID_PRODUCTION } from '../src/authdata.js'
import { encodeCbor } from './helpers/cborEncode.js'

const dir = mkdtempSync(join(tmpdir(), 'appattest-test-'))
after(() => rmSync(dir, { recursive: true, force: true }))
const ssl = (...args) => execFileSync('openssl', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] })
const read = (f) => readFileSync(join(dir, f), 'utf8')
const sha256 = (...parts) => parts.reduce((h, p) => h.update(p), createHash('sha256')).digest()

const TEAM = 'TEAMID1234'
const NOW = Date.now()
const CHALLENGE = Buffer.alloc(32, 7)

/** Racine P-384 → intermédiaire P-384 (comme chez Apple). */
function ca(name) {
  ssl('ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', `${name}-root.key`)
  ssl('req', '-x509', '-new', '-key', `${name}-root.key`, '-subj', `/CN=${name} Test Attestation Root`, '-days', '3650',
    '-out', `${name}-root.pem`, '-addext', 'basicConstraints=critical,CA:TRUE', '-addext', 'keyUsage=critical,keyCertSign,cRLSign')
  ssl('ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', `${name}-inter.key`)
  writeFileSync(join(dir, `${name}-inter.ext`), 'basicConstraints=critical,CA:TRUE,pathlen:0\nkeyUsage=critical,keyCertSign,cRLSign\n')
  ssl('req', '-new', '-key', `${name}-inter.key`, '-subj', `/CN=${name} Test Attestation CA`, '-out', `${name}-inter.csr`)
  ssl('x509', '-req', '-in', `${name}-inter.csr`, '-CA', `${name}-root.pem`, '-CAkey', `${name}-root.key`, '-CAcreateserial',
    '-days', '3650', '-extfile', `${name}-inter.ext`, '-out', `${name}-inter.pem`)
  return { name, rootPem: read(`${name}-root.pem`) }
}
const good = ca('good')
const rogue = ca('rogue')

let serial = 0
/** Clé P-256 « de l'iPhone » : point non compressé, keyId, clé COSE. */
function deviceKey() {
  const f = `dev${++serial}.key`
  ssl('ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', f)
  const jwk = createPrivateKey(read(f)).export({ format: 'jwk' })
  const x = Buffer.from(jwk.x, 'base64url')
  const y = Buffer.from(jwk.y, 'base64url')
  const point = Buffer.concat([Buffer.from([4]), x, y])
  return { file: f, point, keyId: sha256(point), cose: new Map([[1, 2], [3, -7], [-1, 1], [-2, x], [-3, y]]) }
}

function authData({ key, rpId = `${TEAM}.fr.jpesquet.sante`, counter = 0, aaguid = AAGUID_PRODUCTION, credentialId = key.keyId,
  cose = key.cose, extensions = null }) {
  const head = Buffer.alloc(37)
  sha256(rpId).copy(head, 0)
  head[32] = 0x40 | (extensions ? 0x80 : 0)
  head.writeUInt32BE(counter, 33)
  const len = Buffer.alloc(2)
  len.writeUInt16BE(credentialId.length)
  return Buffer.concat([head, aaguid, len, credentialId, encodeCbor(cose), ...(extensions ? [encodeCbor(extensions)] : [])])
}

/** Certificat de la clé, émis par l'intermédiaire, avec l'extension nonce (forme d'Apple : [1] explicite). */
function credCert(c, key, nonce, { form = 'apple', days = '30' } = {}) {
  const n = nonce.toString('hex')
  const der = form === 'apple' ? `3024a1220420${n}` : form === 'plain' ? `30220420${n}` : null
  const f = `cred${++serial}`
  writeFileSync(join(dir, `${f}.ext`), `basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature\n${der ? `1.2.840.113635.100.8.2=DER:${der}\n` : ''}`)
  ssl('req', '-new', '-key', key.file, '-subj', '/CN=synthetic-key', '-out', `${f}.csr`)
  ssl('x509', '-req', '-in', `${f}.csr`, '-CA', `${c.name}-inter.pem`, '-CAkey', `${c.name}-inter.key`, '-CAcreateserial',
    '-days', days, '-extfile', `${f}.ext`, '-out', `${f}.pem`)
  return new X509Certificate(read(`${f}.pem`)).raw
}

/** Attestation complète ; chaque option permet d'en fausser un élément. */
function attest({ c = good, key = deviceKey(), challenge = CHALLENGE, auth = {}, nonce, form, fmt = 'apple-appattest', x5c } = {}) {
  const ad = authData({ key, ...auth })
  const cert = credCert(c, key, nonce ?? sha256(ad, sha256(challenge)), { form })
  const inter = new X509Certificate(read(`${c.name}-inter.pem`)).raw
  const obj = { fmt, attStmt: { x5c: x5c ?? [cert, inter], receipt: Buffer.from('reçu synthétique') }, authData: ad }
  return { key, keyId: key.keyId.toString('base64'), attestation: encodeCbor(obj).toString('base64') }
}

const verify = createAppAttestVerifier({ teamId: TEAM, roots: [good.rootPem] })
const reason = (fn) => {
  try {
    fn()
  } catch (err) {
    assert.ok(err instanceof AppAttestError, err.message)
    return err.reason
  }
  assert.fail('aucune erreur')
}

test('la racine embarquée est bien « Apple App Attestation Root CA » (empreinte publiée par Apple)', () => {
  const root = new X509Certificate(APPLE_APP_ATTEST_ROOT_PEM)
  assert.equal(root.fingerprint256, APPLE_APP_ATTEST_ROOT_SHA256)
  assert.match(root.subject, /Apple App Attestation Root CA/)
  assert.equal(root.publicKey.asymmetricKeyDetails.namedCurve, 'secp384r1')
})

test('attestation valide : clé, keyId, environnement de production, compteur 0', () => {
  const a = attest()
  const out = verify({ keyId: a.keyId, attestation: a.attestation, challenge: CHALLENGE })
  assert.deepEqual(out.keyId, a.key.keyId)
  assert.deepEqual(out.publicKey, a.key.point)
  assert.equal(out.keyObject.asymmetricKeyDetails.namedCurve, 'prime256v1')
  assert.equal(out.environment, 'production')
  assert.equal(out.counter, 0)
  assert.equal(out.category, null)
  // octets acceptés comme base64
  const raw = verify({ keyId: a.key.keyId, attestation: Buffer.from(a.attestation, 'base64'), challenge: CHALLENGE })
  assert.equal(raw.environment, 'production')
})

test('extension nonce : forme d\'Apple et forme sans étiquette relues ; autres formes refusées', () => {
  const key = deviceKey()
  const nonce = Buffer.alloc(32, 9)
  assert.deepEqual(nonceFromExtension(certificateExtension(credCert(good, key, nonce))), nonce)
  assert.deepEqual(nonceFromExtension(certificateExtension(credCert(good, key, nonce, { form: 'plain' }))), nonce)
  assert.equal(certificateExtension(credCert(good, key, nonce, { form: 'none' })), null)
  assert.equal(reason(() => nonceFromExtension(Buffer.from('30030401ff', 'hex'))), 'nonce')
  assert.equal(reason(() => nonceFromExtension(Buffer.from(`30220420${'00'.repeat(32)}00`, 'hex'))), 'nonce')
  const p = attest({ form: 'plain' })
  assert.equal(verify({ ...p, challenge: CHALLENGE }).environment, 'production')
})

test('chaîne : racine inconnue, x5c incomplet, certificat illisible refusés', () => {
  assert.equal(reason(() => verify({ ...attest({ c: rogue }), challenge: CHALLENGE })), 'chain')
  // la vraie racine d'Apple (par défaut) n'a pas émis la chaîne de test
  const apple = createAppAttestVerifier({ teamId: TEAM })
  assert.equal(reason(() => apple({ ...attest(), challenge: CHALLENGE })), 'chain')
  const key = deviceKey()
  const ad = authData({ key })
  const cert = credCert(good, key, sha256(ad, sha256(CHALLENGE)))
  assert.equal(reason(() => verify({ ...attest({ key, x5c: [cert] }), challenge: CHALLENGE })), 'format')
  assert.equal(reason(() => verify({ ...attest({ x5c: [Buffer.from('pas un certificat'), cert] }), challenge: CHALLENGE })), 'chain')
  // la racine à la place de l'intermédiaire : le certificat de la clé n'en vient pas
  const root = new X509Certificate(good.rootPem).raw
  assert.equal(reason(() => verify({ ...attest({ x5c: [cert, root] }), challenge: CHALLENGE })), 'chain')
})

test('chaîne : certificat expiré ou pas encore valide refusé', () => {
  const a = attest()
  const later = createAppAttestVerifier({ teamId: TEAM, roots: [good.rootPem], now: () => NOW + 60 * 86_400_000 })
  assert.equal(reason(() => later({ ...a, challenge: CHALLENGE })), 'chain')
  const before = createAppAttestVerifier({ teamId: TEAM, roots: [good.rootPem], now: () => NOW - 2 * 86_400_000 })
  assert.equal(reason(() => before({ ...a, challenge: CHALLENGE })), 'chain')
})

test('nonce : autre défi, nonce faux ou extension absente refusés', () => {
  const a = attest()
  assert.equal(reason(() => verify({ ...a, challenge: Buffer.alloc(32, 8) })), 'nonce')
  assert.equal(reason(() => verify({ ...attest({ nonce: Buffer.alloc(32) }), challenge: CHALLENGE })), 'nonce')
  assert.equal(reason(() => verify({ ...attest({ form: 'none' }), challenge: CHALLENGE })), 'nonce')
})

test('keyId : différent de la clé du certificat, ou credentialId / clé COSE de authData différents, refusés', () => {
  const a = attest()
  assert.equal(reason(() => verify({ ...a, keyId: Buffer.alloc(32, 1).toString('base64'), challenge: CHALLENGE })), 'key_id')
  assert.equal(reason(() => verify({ ...a, keyId: Buffer.alloc(20).toString('base64'), challenge: CHALLENGE })), 'key_id')
  assert.equal(reason(() => verify({ ...attest({ auth: { credentialId: Buffer.alloc(32, 3) } }), challenge: CHALLENGE })), 'key_id')
  const other = deviceKey()
  assert.equal(reason(() => verify({ ...attest({ auth: { cose: other.cose } }), challenge: CHALLENGE })), 'key_id')
})

test('authData : autre app (Team ID ou bundle), compteur non nul, aaguid inconnu refusés', () => {
  assert.equal(reason(() => verify({ ...attest({ auth: { rpId: 'AUTRE00000.fr.jpesquet.sante' } }), challenge: CHALLENGE })), 'rp_id')
  assert.equal(reason(() => verify({ ...attest({ auth: { rpId: `${TEAM}.com.healthtrack.app` } }), challenge: CHALLENGE })), 'rp_id')
  assert.equal(reason(() => verify({ ...attest({ auth: { counter: 1 } }), challenge: CHALLENGE })), 'counter')
  assert.equal(reason(() => verify({ ...attest({ auth: { aaguid: Buffer.alloc(16) } }), challenge: CHALLENGE })), 'aaguid')
})

test('build Xcode (appattestdevelop) : refusé par défaut, accepté si allowDevelopment', () => {
  const a = attest({ auth: { aaguid: AAGUID_DEVELOPMENT } })
  assert.equal(reason(() => verify({ ...a, challenge: CHALLENGE })), 'aaguid')
  const dev = createAppAttestVerifier({ teamId: TEAM, roots: [good.rootPem], allowDevelopment: true })
  assert.equal(dev({ ...a, challenge: CHALLENGE }).environment, 'development')
})

test('catégorie de validation : 2 et 4 acceptées, 0 refusée, 3 seulement avec allowDevelopment ; version relue', () => {
  const ext = (category) => new Map([['apple_validation_category_01', category], ['apple_bundle_version_01', '1.2.0']])
  for (const c of [2, 4]) {
    const out = verify({ ...attest({ auth: { extensions: ext(c) } }), challenge: CHALLENGE })
    assert.equal(out.category, c)
    assert.equal(out.bundleVersion, '1.2.0')
  }
  assert.equal(reason(() => verify({ ...attest({ auth: { extensions: ext(0) } }), challenge: CHALLENGE })), 'category')
  const three = attest({ auth: { extensions: ext(3) } })
  assert.equal(reason(() => verify({ ...three, challenge: CHALLENGE })), 'category')
  const dev = createAppAttestVerifier({ teamId: TEAM, roots: [good.rootPem], allowDevelopment: true })
  assert.equal(dev({ ...three, challenge: CHALLENGE }).category, 3)
})

test('format : fmt inattendu, CBOR illisible, trop long, défi trop court refusés ; Team ID obligatoire', () => {
  assert.equal(reason(() => verify({ ...attest({ fmt: 'packed' }), challenge: CHALLENGE })), 'format')
  const a = attest()
  assert.equal(reason(() => verify({ ...a, attestation: 'AAAA', challenge: CHALLENGE })), 'format')
  assert.equal(reason(() => verify({ ...a, attestation: Buffer.alloc(17 * 1024, 0x40), challenge: CHALLENGE })), 'format')
  assert.equal(reason(() => verify({ ...a, challenge: Buffer.alloc(8) })), 'format')
  assert.equal(reason(() => verify({ ...a, attestation: null, challenge: CHALLENGE })), 'format')
  assert.throws(() => createAppAttestVerifier({}), /Team ID/)
  assert.throws(() => createAppAttestVerifier({ teamId: 'abc' }), /Team ID/)
})
