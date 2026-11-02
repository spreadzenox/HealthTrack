/**
 * I6-RELAIS-5d-2 : chaque analyse iPhone porte une assertion App Attest (X-AppAttest-Key, X-AppAttest-Assertion,
 * X-AppAttest-Time), vérifiée par la garde d'intégrité sur le corps brut de la requête. Registre factice : aucune clé
 * ni vraie assertion dans le dépôt.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { AppAttestError } from '../src/appattest.js'
import { createAttestRoutes } from '../src/attestroutes.js'
import { createIntegrityGuard } from '../src/integrity.js'
import { createHandler } from '../src/server.js'
import { createQuota } from '../src/quota.js'

const INSTALL = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const KEY_ID = Buffer.alloc(32, 7).toString('base64')
const ATTEST = { keyId: KEY_ID, assertion: Buffer.from('assertion').toString('base64'), time: '1793620800000' }

function fakeRegistry(behaviour = () => ({ keyId: 'ab', counter: 2, environment: 'production', persisted: true })) {
  const calls = []
  return {
    calls,
    async register() {
      throw new Error('pas ici')
    },
    async check(input) {
      calls.push(input)
      return behaviour(input)
    },
  }
}

function setup({ attestMode = 'observe', integrityMode = 'observe', behaviour, client = { decode: async () => { throw new Error('pas Android') } } } = {}) {
  const logs = []
  const registry = fakeRegistry(behaviour)
  const appAttest = createAttestRoutes({ registry, mode: attestMode, log: (e) => logs.push(e), hash: (id) => `h:${id.slice(0, 4)}` })
  const guard = createIntegrityGuard({ client, packageName: 'fr.jpesquet.sante', mode: integrityMode, appAttest, log: (e) => logs.push(e) })
  return { guard, registry, logs }
}

test('verify : assertion valide → attest_passed, corps brut et heure transmis au registre', async () => {
  const { guard, registry, logs } = setup()
  const body = Buffer.from('{"kind":"text","description":"une pomme"}')
  const res = await guard.check(INSTALL, undefined, { platform: 'ios', attest: ATTEST, body })
  assert.deepEqual(res, { ok: true, mode: 'observe', status: 'attest_passed' })
  assert.equal(registry.calls.length, 1)
  assert.equal(registry.calls[0].installId, INSTALL)
  assert.equal(registry.calls[0].keyId, KEY_ID)
  assert.equal(registry.calls[0].time, ATTEST.time)
  assert.ok(Buffer.isBuffer(registry.calls[0].body))
  assert.equal(registry.calls[0].body.toString(), body.toString())
  assert.equal(logs.length, 1)
  assert.equal(logs[0].event, 'integrity')
  assert.equal(logs[0].platform, 'ios')
  assert.equal(logs[0].status, 'attest_passed')
  assert.equal(logs[0].environment, 'production')
  assert.equal(logs[0].install, 'h:a1b2')
  // Jamais la clé, l'assertion ni le corps dans les journaux
  const text = JSON.stringify(logs)
  assert.ok(!text.includes(KEY_ID) && !text.includes(ATTEST.assertion) && !text.includes('pomme'))
})

test('verify en observe : sans assertion ou assertion refusée → journalisé, jamais bloqué', async () => {
  const { guard, logs } = setup({ behaviour: () => { throw new AppAttestError('counter', 'rejeu') } })
  assert.deepEqual(await guard.check(INSTALL, undefined, { platform: 'ios' }), { ok: true, mode: 'observe', status: 'attest_missing' })
  assert.deepEqual(await guard.check(INSTALL, undefined, { platform: 'ios', attest: { ...ATTEST, time: '' } }), { ok: true, mode: 'observe', status: 'attest_missing' })
  assert.deepEqual(await guard.check(INSTALL, undefined, { platform: 'ios', attest: ATTEST, body: Buffer.alloc(0) }), { ok: true, mode: 'observe', status: 'attest_rejected' })
  assert.deepEqual(logs.map((e) => [e.status, e.reasons]), [['attest_missing', undefined], ['attest_missing', undefined], ['attest_rejected', ['counter']]])
})

test('verify en enforce : manquante ou refusée → bloquée ; Firestore en panne → laissée passer', async () => {
  let fail = new AppAttestError('signature', 'mauvaise signature')
  const { guard, logs } = setup({ attestMode: 'enforce', behaviour: () => { throw fail } })
  assert.deepEqual(await guard.check(INSTALL, undefined, { platform: 'ios' }), { ok: false, mode: 'enforce', status: 'attest_missing' })
  assert.deepEqual(await guard.check(INSTALL, undefined, { platform: 'ios', attest: ATTEST }), { ok: false, mode: 'enforce', status: 'attest_rejected' })
  fail = Object.assign(new Error('Firestore : lecture refusée (503)'), { status: 503 })
  assert.deepEqual(await guard.check(INSTALL, undefined, { platform: 'ios', attest: ATTEST }), { ok: true, mode: 'enforce', status: 'attest_unavailable' })
  assert.equal(logs[2].httpStatus, 503)
})

test('verify : champs trop longs ou mal formés → attest_missing sans appeler le registre', async () => {
  const { guard, registry } = setup({ attestMode: 'enforce' })
  const long = 'A'.repeat(20_000)
  assert.equal((await guard.check(INSTALL, undefined, { platform: 'ios', attest: { ...ATTEST, assertion: long } })).status, 'attest_missing')
  assert.equal((await guard.check(INSTALL, undefined, { platform: 'ios', attest: { ...ATTEST, keyId: ['x'] } })).status, 'attest_missing')
  assert.equal(registry.calls.length, 0)
})

test('App Attest indépendant de Play Integrity : vérifié même si INTEGRITY_MODE vaut off ; Android jamais concerné', async () => {
  const off = setup({ integrityMode: 'off', attestMode: 'enforce' })
  assert.deepEqual(await off.guard.check(INSTALL, undefined, { platform: 'ios' }), { ok: false, mode: 'enforce', status: 'attest_missing' })
  assert.deepEqual(await off.guard.check(INSTALL, undefined, { platform: 'android', attest: ATTEST }), { ok: true, mode: 'off', status: 'off' })
  assert.equal(off.registry.calls.length, 0)
  // no_plugin sans X-Platform = iPhone (comme avant)
  const obs = setup({ attestMode: 'observe' })
  assert.equal((await obs.guard.check(INSTALL, undefined, { clientStatus: 'no_plugin', attest: ATTEST })).status, 'attest_passed')
})

test('sans App Attest (mode off) : comportement d’avant, iPhone → not_android', async () => {
  const { guard, registry } = setup({ attestMode: 'off', integrityMode: 'enforce' })
  assert.deepEqual(await guard.check(INSTALL, undefined, { platform: 'ios', attest: ATTEST }), { ok: true, mode: 'enforce', status: 'not_android' })
  assert.equal(registry.calls.length, 0)
  const bare = createIntegrityGuard({ client: { decode: async () => ({}) }, packageName: 'p', mode: 'enforce' })
  assert.equal((await bare.check(INSTALL, undefined, { platform: 'ios' })).status, 'not_android')
})

async function withServer(deps, fn) {
  const handler = createHandler({ quota: createQuota({ installPerDay: 50, globalPerDay: 500, globalPerMinute: 50 }), ingredientNames: ['pomme'], ...deps })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  try {
    await fn(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise((r) => server.close(r))
  }
}

const okVertex = (calls = []) => ({
  generateJson: async (req) => {
    calls.push(req)
    return { parsed: { foods: [] }, model: 'm', location: 'europe-west1', usage: {} }
  },
})

test('serveur : l’analyse iPhone transmet les en-têtes App Attest et le corps exact ; refus en enforce → 403', async () => {
  const { guard, registry } = setup({ attestMode: 'enforce', behaviour: () => { throw new AppAttestError('counter', 'rejeu') } })
  const calls = []
  await withServer({ vertex: okVertex(calls), integrity: guard }, async (url) => {
    const raw = '{"kind":"text",  "description":"une pomme"}'
    const res = await fetch(`${url}/v1/meal/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Install-Id': INSTALL,
        'X-Platform': 'ios',
        'X-AppAttest-Key': ATTEST.keyId,
        'X-AppAttest-Assertion': ATTEST.assertion,
        'X-AppAttest-Time': ATTEST.time,
      },
      body: raw,
    })
    assert.equal(res.status, 403)
    const payload = await res.json()
    assert.equal(payload.error, 'integrity')
    assert.match(payload.message, /App Store/)
    assert.equal(calls.length, 0)
    assert.equal(registry.calls.length, 1)
    assert.equal(registry.calls[0].body.toString(), raw)
    assert.equal(registry.calls[0].assertion, ATTEST.assertion)
  })
})
