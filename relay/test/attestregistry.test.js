/**
 * I6-RELAIS-5c : assertions App Attest et registre des clés. Clés P-256 jetables générées par le test, Team ID fictif ;
 * aucune clé ni vraie assertion dans le dépôt.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import {
  AppAttestError, assertionClientData, createAssertionVerifier, keyFromPoint, ASSERTION_CLOCK_SKEW_MS,
} from '../src/appattest.js'
import {
  attestInstallKey, createAttestRegistry, createFirestoreAttestStore, memoryAttestStore,
} from '../src/attestregistry.js'
import { encodeCbor } from './helpers/cborEncode.js'

const TEAM = 'TEAMID1234'
const NOW = Date.UTC(2026, 10, 2, 10, 0, 0)
const sha256 = (...parts) => parts.reduce((h, p) => h.update(p), createHash('sha256')).digest()

function deviceKey() {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const jwk = publicKey.export({ format: 'jwk' })
  const point = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')])
  return { privateKey, point, keyId: sha256(point) }
}

/** Assertion telle que l'iPhone la fabrique (generateAssertion sur SHA-256(clientData)). */
function assertion(key, { counter, installId = 'inst-1', time = NOW, body = '{"a":1}', rpId = `${TEAM}.fr.jpesquet.sante`,
  clientData, signer = key.privateKey, extra } = {}) {
  const auth = Buffer.alloc(37)
  sha256(rpId).copy(auth, 0)
  auth[32] = 0x01
  auth.writeUInt32BE(counter, 33)
  const cd = clientData ?? assertionClientData({ installId, time: String(time), body })
  const nonce = sha256(auth, sha256(cd))
  const signature = sign('sha256', nonce, { key: signer, dsaEncoding: 'der' })
  return encodeCbor({ signature, authenticatorData: extra ? Buffer.concat([auth, extra]) : auth }).toString('base64')
}

const verifyAssertion = createAssertionVerifier({ teamId: TEAM, now: () => NOW })
const reasonOf = async (fn) => {
  try {
    await fn()
  } catch (err) {
    assert.ok(err instanceof AppAttestError, err.message)
    return err.reason
  }
  assert.fail('aucune erreur')
}
const base = (key, opts = {}) => ({ installId: 'inst-1', time: String(NOW), body: '{"a":1}', publicKey: key.point, lastCounter: 0, ...opts })

test('clientData : installation, heure et empreinte du corps', () => {
  const body = '{"image":"…"}'
  assert.equal(assertionClientData({ installId: 'abc', time: '123', body }),
    `halcya-assert:abc:123:${createHash('sha256').update(body).digest('hex')}`)
  assert.equal(assertionClientData({ installId: 'abc', time: '1' }).split(':')[3], createHash('sha256').update('').digest('hex'))
})

test('assertion valide : signature, rpId, compteur avancé ; clé gardée en base64 ou en KeyObject', () => {
  const key = deviceKey()
  const a = assertion(key, { counter: 1 })
  assert.deepEqual(verifyAssertion({ ...base(key), assertion: a }), { counter: 1 })
  assert.deepEqual(verifyAssertion({ ...base(key, { publicKey: key.point.toString('base64') }), assertion: a }), { counter: 1 })
  assert.deepEqual(verifyAssertion({ ...base(key, { publicKey: keyFromPoint(key.point) }), assertion: a }), { counter: 1 })
  // corps en octets : même empreinte que la chaîne
  assert.deepEqual(verifyAssertion({ ...base(key, { body: Buffer.from('{"a":1}') }), assertion: a }), { counter: 1 })
})

test('signature : autre clé, autre corps, autre installation ou autre heure signée → refus', async () => {
  const key = deviceKey()
  const other = deviceKey()
  const a = assertion(key, { counter: 1 })
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(other), assertion: a })), 'signature')
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key, { body: '{"a":2}' }), assertion: a })), 'signature')
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key, { installId: 'inst-2' }), assertion: a })), 'signature')
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key, { time: String(NOW + 1) }), assertion: a })), 'signature')
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key), assertion: assertion(key, { counter: 1, signer: other.privateKey }) })), 'signature')
})

test('rpId d\'une autre app, compteur rejoué ou en arrière refusés', async () => {
  const key = deviceKey()
  const foreign = assertion(key, { counter: 1, rpId: `${TEAM}.com.healthtrack.app` })
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key), assertion: foreign })), 'rp_id')
  const a = assertion(key, { counter: 5 })
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key, { lastCounter: 5 }), assertion: a })), 'counter')
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key, { lastCounter: 9 }), assertion: a })), 'counter')
  assert.deepEqual(verifyAssertion({ ...base(key, { lastCounter: 4 }), assertion: a }), { counter: 5 })
})

test('heure : absente, illisible ou à plus de 5 minutes refusée', async () => {
  const key = deviceKey()
  for (const t of [NOW + ASSERTION_CLOCK_SKEW_MS + 1, NOW - ASSERTION_CLOCK_SKEW_MS - 1]) {
    const a = assertion(key, { counter: 1, time: t })
    assert.equal(await reasonOf(() => verifyAssertion({ ...base(key, { time: String(t) }), assertion: a })), 'clock')
  }
  const edge = NOW - ASSERTION_CLOCK_SKEW_MS
  assert.deepEqual(verifyAssertion({ ...base(key, { time: String(edge) }), assertion: assertion(key, { counter: 1, time: edge }) }), { counter: 1 })
  const a = assertion(key, { counter: 1 })
  for (const t of [undefined, '', 'demain', '1e12', '-5']) {
    assert.equal(await reasonOf(() => verifyAssertion({ ...base(key, { time: t }), assertion: a })), 'clock')
  }
})

test('format : CBOR illisible, champs absents, octets en trop, clé dans l\'assertion, trop long, clé gardée invalide', async () => {
  const key = deviceKey()
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key), assertion: 'AAAA' })), 'format')
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key), assertion: encodeCbor({ signature: Buffer.alloc(8) }).toString('base64') })), 'format')
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key), assertion: assertion(key, { counter: 1, extra: Buffer.from([0]) }) })), 'format')
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key), assertion: Buffer.alloc(2048, 0x40) })), 'format')
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key), assertion: null })), 'format')
  assert.equal(await reasonOf(() => verifyAssertion({ ...base(key, { publicKey: Buffer.alloc(33) }), assertion: assertion(key, { counter: 1 }) })), 'format')
  assert.throws(() => createAssertionVerifier({ teamId: 'x' }), /Team ID/)
})

// --- Registre ---------------------------------------------------------------------------------------------------------

/** Fausse vérification d'attestation : la clé est celle qu'on lui donne (la vraie est testée dans appattest.test.js). */
const fakeAttestation = ({ keyId, attestation }) => {
  if (attestation === 'refusée') throw new AppAttestError('chain', 'refusée')
  const key = attestation
  return { keyId: key.keyId, publicKey: key.point, environment: 'production', category: 4 }
}

function registry(opts = {}) {
  const store = opts.store ?? memoryAttestStore()
  let t = NOW
  const reg = createAttestRegistry({ verifyAttestation: fakeAttestation, verifyAssertion, store, now: () => t, ...opts })
  return { reg, store, setNow: (v) => (t = v) }
}

test('registre : enregistrement puis assertions successives ; document sans donnée personnelle, expiration à 13 mois', async () => {
  const { reg, store } = registry()
  const key = deviceKey()
  const r = await reg.register({ installId: 'inst-1', keyId: key.keyId, attestation: key, challenge: Buffer.alloc(32) })
  const id = key.keyId.toString('hex')
  assert.deepEqual(r, { keyId: id, environment: 'production', category: 4, persisted: true, already: false })
  const doc = store.docs.get(id)
  assert.deepEqual(Object.keys(doc).sort(), ['category', 'counter', 'createdAt', 'environment', 'expireAt', 'install', 'publicKey'])
  assert.equal(doc.install, attestInstallKey('inst-1'))
  assert.ok(!JSON.stringify(doc).includes('inst-1'))
  assert.equal(doc.counter, 0)
  assert.equal(doc.expireAt, '2028-01-01T00:00:00.000Z')

  const keyId = key.keyId.toString('base64')
  assert.deepEqual(await reg.check({ installId: 'inst-1', keyId, assertion: assertion(key, { counter: 1 }), time: String(NOW), body: '{"a":1}' }),
    { keyId: id, counter: 1, environment: 'production', persisted: true })
  assert.equal((await reg.check({ installId: 'inst-1', keyId, assertion: assertion(key, { counter: 2 }), time: String(NOW), body: '{"a":1}' })).counter, 2)
  assert.equal(store.docs.get(id).counter, 2)
})

test('registre : rejeu refusé, même entre deux instances qui partagent Firestore', async () => {
  const store = memoryAttestStore()
  const { reg } = registry({ store })
  const key = deviceKey()
  await reg.register({ installId: 'inst-1', keyId: key.keyId, attestation: key, challenge: Buffer.alloc(32) })
  const keyId = key.keyId.toString('base64')
  const a1 = assertion(key, { counter: 1 })
  const req = { installId: 'inst-1', keyId, assertion: a1, time: String(NOW), body: '{"a":1}' }
  await reg.check(req)
  assert.equal(await reasonOf(() => reg.check(req)), 'counter')
  // Instance neuve : relit le compteur dans le registre durable
  const { reg: other } = registry({ store })
  assert.equal(await reasonOf(() => other.check(req)), 'counter')
})

test('registre : deux requêtes simultanées avec la même assertion, une seule passe', async () => {
  const store = memoryAttestStore()
  const key = deviceKey()
  await registry({ store }).reg.register({ installId: 'inst-1', keyId: key.keyId, attestation: key, challenge: Buffer.alloc(32) })
  // Lecture Firestore lente : les deux requêtes attendent la même lecture
  const slow = { docs: store.docs, get: async (id) => { await new Promise((r) => setTimeout(r, 5)); return store.get(id) }, set: store.set }
  const { reg } = registry({ store: slow })
  const req = { installId: 'inst-1', keyId: key.keyId.toString('base64'), assertion: assertion(key, { counter: 1 }), time: String(NOW), body: '{"a":1}' }
  const results = await Promise.allSettled([reg.check(req), reg.check(req)])
  assert.deepEqual(results.map((r) => r.status).sort(), ['fulfilled', 'rejected'])
  assert.equal(results.find((r) => r.status === 'rejected').reason.reason, 'counter')
})

test('registre : clé liée à une autre installation refusée (enregistrement et assertion), même installation idempotente', async () => {
  const { reg } = registry()
  const key = deviceKey()
  await reg.register({ installId: 'inst-1', keyId: key.keyId, attestation: key, challenge: Buffer.alloc(32) })
  assert.equal(await reasonOf(() => reg.register({ installId: 'inst-2', keyId: key.keyId, attestation: key, challenge: Buffer.alloc(32) })), 'key_reused')
  const again = await reg.register({ installId: 'inst-1', keyId: key.keyId, attestation: key, challenge: Buffer.alloc(32) })
  assert.equal(again.already, true)
  const a = assertion(key, { counter: 1, installId: 'inst-2' })
  assert.equal(await reasonOf(() => reg.check({ installId: 'inst-2', keyId: key.keyId.toString('base64'), assertion: a, time: String(NOW), body: '{"a":1}' })), 'key_reused')
})

test('registre : clé inconnue, keyId invalide, attestation refusée', async () => {
  const { reg, store } = registry()
  const key = deviceKey()
  const a = assertion(key, { counter: 1 })
  assert.equal(await reasonOf(() => reg.check({ installId: 'inst-1', keyId: key.keyId.toString('base64'), assertion: a, time: String(NOW) })), 'unknown_key')
  assert.equal(await reasonOf(() => reg.check({ installId: 'inst-1', keyId: 'AAAA', assertion: a, time: String(NOW) })), 'key_id')
  assert.equal(await reasonOf(() => reg.register({ installId: 'inst-1', keyId: key.keyId, attestation: 'refusée', challenge: Buffer.alloc(32) })), 'chain')
  assert.equal(store.docs.size, 0)
})

test('registre : Firestore en panne — lecture : erreur remontée (pas une AppAttestError) ; écriture : compteur gardé en mémoire', async () => {
  const key = deviceKey()
  const down = { get: async () => { throw new Error('Firestore : lecture refusée (503)') }, set: async () => {} }
  const { reg } = registry({ store: down })
  await assert.rejects(reg.check({ installId: 'inst-1', keyId: key.keyId.toString('base64'), assertion: assertion(key, { counter: 1 }), time: String(NOW), body: '{"a":1}' }),
    (err) => !(err instanceof AppAttestError) && /503/.test(err.message))

  const readOnly = { get: async () => null, set: async () => { throw new Error('écriture refusée') } }
  const { reg: r2 } = registry({ store: readOnly })
  const out = await r2.register({ installId: 'inst-1', keyId: key.keyId, attestation: key, challenge: Buffer.alloc(32) })
  assert.equal(out.persisted, false)
  const req = { installId: 'inst-1', keyId: key.keyId.toString('base64'), assertion: assertion(key, { counter: 1 }), time: String(NOW), body: '{"a":1}' }
  assert.equal((await r2.check(req)).persisted, false)
  assert.equal(await reasonOf(() => r2.check(req)), 'counter')
})

test('registre : cache borné (les plus anciennes clés relues depuis le registre durable)', async () => {
  const store = memoryAttestStore()
  let reads = 0
  const counting = { docs: store.docs, get: async (id) => { reads++; return store.get(id) }, set: store.set }
  const { reg } = registry({ store: counting, maxCache: 2 })
  const keys = [deviceKey(), deviceKey(), deviceKey()]
  for (const k of keys) await reg.register({ installId: 'inst-1', keyId: k.keyId, attestation: k, challenge: Buffer.alloc(32) })
  const before = reads
  await reg.check({ installId: 'inst-1', keyId: keys[2].keyId.toString('base64'), assertion: assertion(keys[2], { counter: 1 }), time: String(NOW), body: '{"a":1}' })
  assert.equal(reads, before)
  await reg.check({ installId: 'inst-1', keyId: keys[0].keyId.toString('base64'), assertion: assertion(keys[0], { counter: 1 }), time: String(NOW), body: '{"a":1}' })
  assert.equal(reads, before + 1)
})

test('Firestore : collection appattest, lecture, absent, écriture des seuls champs prévus avec expireAt', async () => {
  const calls = []
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init })
    if (init.method === 'PATCH') return { ok: true, status: 200, json: async () => ({}) }
    if (url.endsWith('/absent')) return { ok: false, status: 404 }
    return {
      ok: true, status: 200, json: async () => ({ fields: {
        install: { stringValue: 'e1' }, publicKey: { stringValue: 'BAAA' }, counter: { integerValue: '7' },
        environment: { stringValue: 'production' }, category: { nullValue: null }, createdAt: { timestampValue: '2026-11-02T10:00:00Z' },
      } }),
    }
  }
  const store = createFirestoreAttestStore({ project: 'p', getToken: async () => 'jeton', fetchImpl })
  assert.deepEqual(await store.get('ab'), { install: 'e1', publicKey: 'BAAA', counter: 7, environment: 'production', category: null, createdAt: '2026-11-02T10:00:00Z' })
  assert.equal(calls[0].url, 'https://firestore.googleapis.com/v1/projects/p/databases/(default)/documents/appattest/ab')
  assert.equal(calls[0].init.headers.Authorization, 'Bearer jeton')
  assert.equal(await store.get('absent'), null)
  await store.set('ab', { install: 'e1', publicKey: 'BAAA', counter: 8, environment: 'production', category: 4, createdAt: '2026-11-02T10:00:00Z', expireAt: '2027-12-01T00:00:00.000Z' })
  const body = JSON.parse(calls[2].init.body)
  assert.deepEqual(Object.keys(body.fields).sort(), ['category', 'counter', 'createdAt', 'environment', 'expireAt', 'install', 'publicKey'])
  assert.equal(body.fields.counter.integerValue, '8')
  assert.equal(body.fields.category.integerValue, '4')
  assert.equal(body.fields.expireAt.timestampValue, '2027-12-01T00:00:00.000Z')
  const failing = createFirestoreAttestStore({ project: 'p', getToken: async () => 'j', fetchImpl: async () => ({ ok: false, status: 403 }) })
  await assert.rejects(failing.get('ab'), /403/)
  await assert.rejects(failing.set('ab', { install: 'e', publicKey: 'B', counter: 1, environment: 'production', category: null }), /403/)
})
