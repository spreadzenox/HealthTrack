import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createIntegrityClient, createIntegrityGuard, evaluateVerdict, requestHashFor, isIntegrityToken, requestPlatform,
  REJECT_CACHE_MS, VERDICT_CACHE_MS, MAX_TOKEN_AGE_MS,
} from '../src/integrity.js'

const PKG = 'fr.jpesquet.sante'
const INSTALL = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const NOW = Date.parse('2026-10-23T06:00:00Z')
const TOKEN = 'e'.repeat(200)

/** Verdict synthétique au format `tokenPayloadExternal`. */
const goodPayload = (over = {}) => ({
  requestDetails: { requestPackageName: PKG, requestHash: requestHashFor(INSTALL), timestampMillis: String(NOW - 5_000) },
  appIntegrity: { appRecognitionVerdict: 'PLAY_RECOGNIZED', packageName: PKG },
  deviceIntegrity: { deviceRecognitionVerdict: ['MEETS_DEVICE_INTEGRITY'] },
  accountDetails: { appLicensingVerdict: 'LICENSED' },
  ...over,
})

test('requestHashFor : empreinte stable, propre à chaque installation, sans l\'identifiant en clair', () => {
  assert.equal(requestHashFor(INSTALL), requestHashFor(INSTALL))
  assert.notEqual(requestHashFor(INSTALL), requestHashFor('autre-installation-1234'))
  assert.match(requestHashFor(INSTALL), /^[0-9a-f]{64}$/)
  assert.ok(!requestHashFor(INSTALL).includes(INSTALL))
  // Même vecteur que app/src/services/playIntegrity.test.js : l'app et le relais doivent calculer la même empreinte
  assert.equal(requestHashFor('abc123'), '5540733c35182f8d31cc8b5f5da1f438d47dd58b691989c0f4036be0ef67c790')
})

test('isIntegrityToken : refuse les valeurs vides, courtes ou exotiques', () => {
  assert.ok(isIntegrityToken(TOKEN))
  assert.ok(!isIntegrityToken(undefined))
  assert.ok(!isIntegrityToken('abc'))
  assert.ok(!isIntegrityToken(`${'e'.repeat(150)} <script>`))
})

test('evaluateVerdict : un vrai téléphone avec l\'app du Play Store passe', () => {
  assert.deepEqual(evaluateVerdict(goodPayload(), { packageName: PKG, requestHash: requestHashFor(INSTALL), now: NOW }), { ok: true, reasons: [], licensed: true })
})

test('evaluateVerdict : licence absente journalisée mais non exigée', () => {
  const v = evaluateVerdict(goodPayload({ accountDetails: { appLicensingVerdict: 'UNEVALUATED' } }), { packageName: PKG, requestHash: requestHashFor(INSTALL), now: NOW })
  assert.equal(v.ok, true)
  assert.equal(v.licensed, false)
})

test('evaluateVerdict : app modifiée, appareil non certifié, autre installation ou jeton ancien → refus motivé', () => {
  const opts = { packageName: PKG, requestHash: requestHashFor(INSTALL), now: NOW }
  assert.deepEqual(evaluateVerdict(goodPayload({ appIntegrity: { appRecognitionVerdict: 'UNRECOGNIZED_VERSION' } }), opts).reasons, ['app_unrecognized_version'])
  assert.deepEqual(evaluateVerdict(goodPayload({ deviceIntegrity: {} }), opts).reasons, ['device'])
  assert.deepEqual(evaluateVerdict(goodPayload(), { ...opts, requestHash: requestHashFor('autre-installation-1234') }).reasons, ['request_hash'])
  const old = goodPayload()
  old.requestDetails.timestampMillis = String(NOW - MAX_TOKEN_AGE_MS - 1)
  assert.deepEqual(evaluateVerdict(old, opts).reasons, ['stale'])
  assert.deepEqual(evaluateVerdict(goodPayload(), { ...opts, packageName: 'com.healthtrack.app' }).reasons, ['package'])
  assert.equal(evaluateVerdict({}, opts).ok, false)
})

test('client : appelle decodeIntegrityToken avec le jeton OAuth et renvoie tokenPayloadExternal', async () => {
  const calls = []
  const client = createIntegrityClient({
    packageName: PKG,
    getToken: async () => 'oauth-token',
    fetchImpl: async (url, init) => {
      calls.push({ url, init })
      return new Response(JSON.stringify({ tokenPayloadExternal: goodPayload() }), { status: 200 })
    },
  })
  const payload = await client.decode(TOKEN)
  assert.equal(payload.appIntegrity.appRecognitionVerdict, 'PLAY_RECOGNIZED')
  assert.equal(calls[0].url, `https://playintegrity.googleapis.com/v1/${PKG}:decodeIntegrityToken`)
  assert.equal(calls[0].init.headers.Authorization, 'Bearer oauth-token')
  assert.deepEqual(JSON.parse(calls[0].init.body), { integrity_token: TOKEN })
})

test('client : une erreur de Google remonte avec son statut', async () => {
  const client = createIntegrityClient({
    packageName: PKG,
    getToken: async () => 't',
    fetchImpl: async () => new Response(JSON.stringify({ error: { message: 'Permission denied' } }), { status: 403 }),
  })
  await assert.rejects(client.decode(TOKEN), (err) => err.status === 403 && /Permission denied/.test(err.message))
})

function guard({ mode, payload = goodPayload(), fail = null, now = () => NOW } = {}) {
  const logs = []
  let decodes = 0
  const client = {
    decode: async () => {
      decodes += 1
      if (fail) throw fail
      return payload
    },
  }
  const g = createIntegrityGuard({ client, packageName: PKG, mode, log: (e) => logs.push(e), now })
  return { g, logs, decodes: () => decodes }
}

test('garde observe : ne bloque jamais, mais journalise le verdict sans jeton ni identifiant en clair', async () => {
  const { g, logs } = guard({ mode: 'observe', payload: goodPayload({ deviceIntegrity: {} }) })
  assert.deepEqual(await g.check(INSTALL, TOKEN), { ok: true, mode: 'observe', status: 'rejected' })
  assert.deepEqual(await g.check('sans-jeton-installation-1', undefined), { ok: true, mode: 'observe', status: 'missing' })
  assert.equal(logs[0].reasons[0], 'device')
  assert.ok(!JSON.stringify(logs).includes(TOKEN))
})

test('jeton absent : la raison donnée par l\'app (bornée) et l\'origine CI sont journalisées, rien d\'autre', async () => {
  const { g, logs } = guard({ mode: 'observe' })
  await g.check('sans-jeton-installation-1', undefined, { clientStatus: 'timeout' })
  await g.check('sans-jeton-installation-2', undefined, { clientStatus: 'error:-12' })
  await g.check('ci-smoke-1234567890', undefined)
  await g.check('sans-jeton-installation-3', undefined, { clientStatus: 'x'.repeat(80) })
  await g.check('sans-jeton-installation-4', undefined, { clientStatus: 'mon e-mail <a@b.fr>' })
  assert.deepEqual(logs.map((e) => [e.status, e.client, e.ci]), [
    ['missing', 'timeout', false],
    ['missing', 'error:-12', false],
    ['missing', 'none', true],
    ['missing', 'other', false],
    ['missing', 'other', false],
  ])
  assert.ok(!JSON.stringify(logs).includes('a@b.fr'))
})

test('appareil de test de Google (rapport de pré-lancement) : signalé par l\'app, journalisé à part', async () => {
  const { g, logs } = guard({ mode: 'observe' })
  await g.check('sans-jeton-installation-1', undefined, { clientStatus: 'timeout', testDevice: true })
  await g.check('sans-jeton-installation-2', undefined, { clientStatus: 'timeout' })
  await g.check(INSTALL, TOKEN, { testDevice: true })
  assert.deepEqual(logs.map((e) => [e.status, e.testlab]), [['missing', true], ['missing', false], ['passed', true]])
})

test('jeton présent : origine CI journalisée aussi avec le verdict', async () => {
  const { g, logs } = guard({ mode: 'observe' })
  await g.check(INSTALL, TOKEN)
  assert.equal(logs[0].status, 'passed')
  assert.equal(logs[0].ci, false)
})

test('garde enforce : refuse sans jeton ou sur mauvais verdict, accepte un bon verdict', async () => {
  assert.equal((await guard({ mode: 'enforce' }).g.check(INSTALL, undefined)).ok, false)
  assert.equal((await guard({ mode: 'enforce', payload: goodPayload({ appIntegrity: {} }) }).g.check(INSTALL, TOKEN)).ok, false)
  assert.deepEqual(await guard({ mode: 'enforce' }).g.check(INSTALL, TOKEN), { ok: true, mode: 'enforce', status: 'passed' })
})

test('garde : un verdict accepté couvre l\'installation 24 h (un seul décodage), puis il faut un jeton neuf', async () => {
  let t = NOW
  const { g, decodes } = guard({ mode: 'enforce', now: () => t })
  await g.check(INSTALL, TOKEN)
  assert.equal((await g.check(INSTALL, undefined)).status, 'trusted')
  assert.equal(decodes(), 1)
  t += VERDICT_CACHE_MS + 1
  assert.equal((await g.check(INSTALL, undefined)).ok, false)
})

test('garde : un refus n\'est pas redécodé pendant 10 minutes (un script ne fait pas travailler Google sans fin)', async () => {
  let t = NOW
  const { g, decodes } = guard({ mode: 'enforce', payload: goodPayload({ deviceIntegrity: {} }), now: () => t })
  await g.check(INSTALL, TOKEN)
  assert.equal((await g.check(INSTALL, TOKEN)).status, 'rejected')
  assert.equal(decodes(), 1)
  t += REJECT_CACHE_MS + 1
  await g.check(INSTALL, TOKEN)
  assert.equal(decodes(), 2)
})

test('garde : Google injoignable → on laisse passer (les plafonds du relais restent), même en enforce', async () => {
  const err = Object.assign(new Error('timeout'), { status: 503 })
  const { g, logs } = guard({ mode: 'enforce', fail: err })
  assert.deepEqual(await g.check(INSTALL, TOKEN), { ok: true, mode: 'enforce', status: 'unavailable' })
  assert.equal(logs[0].httpStatus, 503)
})

test('garde : mode off ou inconnu', async () => {
  assert.equal((await guard({ mode: 'off' }).g.check(INSTALL, undefined)).status, 'off')
  assert.equal(guard({ mode: 'n-importe-quoi' }).g.mode, 'observe')
})

test('requestPlatform : iOS par X-Platform, ou par no_plugin sans X-Platform ; Android sinon', () => {
  assert.equal(requestPlatform('ios'), 'ios')
  assert.equal(requestPlatform(' iOS '), 'ios')
  assert.equal(requestPlatform(undefined, 'no_plugin'), 'ios')
  assert.equal(requestPlatform('android', 'no_plugin'), 'android')
  assert.equal(requestPlatform(undefined, 'timeout'), 'android')
  assert.equal(requestPlatform(undefined, undefined), 'android')
  assert.equal(requestPlatform('windows'), 'android')
})

test('garde enforce : une requête iPhone n\'est jamais bloquée, journalisée à part ; Android sans jeton reste refusé', async () => {
  const { g, logs, decodes } = guard({ mode: 'enforce' })
  assert.deepEqual(await g.check('iphone-installation-1', undefined, { clientStatus: 'no_plugin', platform: 'ios' }), { ok: true, mode: 'enforce', status: 'not_android' })
  assert.deepEqual(await g.check('iphone-installation-2', undefined, { clientStatus: 'no_plugin' }), { ok: true, mode: 'enforce', status: 'not_android' })
  assert.deepEqual(await g.check('android-installation-1', undefined, { clientStatus: 'timeout' }), { ok: false, mode: 'enforce', status: 'missing' })
  assert.deepEqual(await g.check('android-installation-2', undefined, { clientStatus: 'no_plugin', platform: 'android' }), { ok: false, mode: 'enforce', status: 'missing' })
  assert.equal(decodes(), 0)
  assert.deepEqual(logs.map((e) => [e.status, e.platform]), [['not_android', 'ios'], ['not_android', 'ios'], ['missing', undefined], ['missing', undefined]])
})
