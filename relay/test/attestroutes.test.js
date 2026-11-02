/**
 * I6-RELAIS-5d-1 : défis App Attest et routes /v1/attest/challenge et /v1/attest/register. Registre factice ou
 * vérificateur factice : aucune clé ni vraie attestation dans le dépôt.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { AppAttestError } from '../src/appattest.js'
import { createAttestRegistry } from '../src/attestregistry.js'
import { APP_ATTEST_MODES, CHALLENGE_TTL_MS, appAttestModeOf, createAttestRoutes, createChallengeStore } from '../src/attestroutes.js'
import { createHandler, hashInstallId } from '../src/server.js'
import { createQuota } from '../src/quota.js'
import { loadConfig } from '../src/config.js'

const INSTALL = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const OTHER = 'ffffffff-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const KEY_ID = Buffer.alloc(32, 7).toString('base64')

function clock(start = Date.UTC(2026, 10, 2, 12, 0, 0)) {
  const c = { t: start }
  c.now = () => c.t
  return c
}

test('mode : off par défaut, toute valeur inconnue → off', () => {
  assert.deepEqual(APP_ATTEST_MODES, ['off', 'observe', 'enforce'])
  assert.equal(appAttestModeOf(undefined), 'off')
  assert.equal(appAttestModeOf('ENFORCE'), 'enforce')
  assert.equal(appAttestModeOf('observe'), 'observe')
  assert.equal(appAttestModeOf('oui'), 'off')
  const config = loadConfig({})
  assert.equal(config.appAttestMode, 'off')
  assert.equal(config.appleTeamId, '')
  assert.equal(loadConfig({ APP_ATTEST_MODE: 'observe', APPLE_TEAM_ID: 'ABCDE12345' }).appleTeamId, 'ABCDE12345')
  assert.equal(loadConfig({ APPLE_TEAM_ID: 'pas un id' }).appleTeamId, '')
})

test('défi : 32 octets aléatoires, usage unique, lié à l’installation', () => {
  const c = clock()
  const store = createChallengeStore({ now: c.now })
  const a = store.issue(INSTALL)
  const b = store.issue(INSTALL)
  assert.notEqual(a, b)
  assert.equal(Buffer.from(a, 'base64').length, 32)
  assert.equal(store.consume(OTHER, a), false, 'autre installation')
  assert.equal(store.consume(INSTALL, a), false, 'déjà brûlé par la tentative précédente')
  assert.equal(store.consume(INSTALL, b), true)
  assert.equal(store.consume(INSTALL, b), false, 'usage unique')
  assert.equal(store.consume(INSTALL, 'inconnu'), false)
  assert.equal(store.consume(INSTALL, undefined), false)
})

test('défi : périmé après 5 minutes, magasin borné', () => {
  const c = clock()
  const store = createChallengeStore({ now: c.now, max: 3 })
  const old = store.issue(INSTALL)
  c.t += CHALLENGE_TTL_MS + 1
  assert.equal(store.consume(INSTALL, old), false)
  const ids = [1, 2, 3, 4].map(() => store.issue(INSTALL))
  assert.ok(store.size() <= 3)
  assert.equal(store.consume(INSTALL, ids[0]), false, 'le plus ancien est évincé')
  assert.equal(store.consume(INSTALL, ids[3]), true)
})

function fakeRegistry({ fail } = {}) {
  const calls = []
  return {
    calls,
    async register(input) {
      calls.push(input)
      if (fail) throw fail
      return { keyId: 'ab'.repeat(32), environment: 'production', category: 2, persisted: true, already: false }
    },
  }
}

test('register : défi consommé puis attestation transmise au registre', async () => {
  const challenges = createChallengeStore()
  const registry = fakeRegistry()
  const logs = []
  const routes = createAttestRoutes({ registry, challenges, mode: 'observe', log: (e) => logs.push(e), hash: hashInstallId })
  const issued = routes.challenge(INSTALL)
  assert.equal(issued.status, 200)
  assert.equal(issued.payload.expiresInSec, 300)
  const res = await routes.register(INSTALL, { keyId: KEY_ID, attestation: 'AAAA', challenge: issued.payload.challenge })
  assert.equal(res.status, 200)
  assert.deepEqual(res.payload, { ok: true, environment: 'production' })
  assert.equal(registry.calls[0].installId, INSTALL)
  assert.ok(Buffer.isBuffer(registry.calls[0].challenge))
  assert.equal(registry.calls[0].challenge.toString('base64'), issued.payload.challenge)
  // Rejeu du même défi : refusé sans appeler le registre
  const again = await routes.register(INSTALL, { keyId: KEY_ID, attestation: 'AAAA', challenge: issued.payload.challenge })
  assert.equal(again.status, 403)
  assert.equal(again.payload.reason, 'challenge')
  assert.equal(registry.calls.length, 1)
  const text = JSON.stringify(logs)
  assert.equal(text.includes(INSTALL), false)
  assert.ok(text.includes('"status":"registered"'))
})

test('register : corps incomplet → 400, attestation refusée → 403 avec la raison, Firestore en panne → 503', async () => {
  const challenges = createChallengeStore()
  const base = { challenges, mode: 'observe', hash: hashInstallId }
  const bad = await createAttestRoutes({ ...base, registry: fakeRegistry() }).register(INSTALL, { keyId: KEY_ID })
  assert.equal(bad.status, 400)
  const refused = createAttestRoutes({ ...base, registry: fakeRegistry({ fail: new AppAttestError('chain', 'x') }) })
  const r1 = await refused.register(INSTALL, { keyId: KEY_ID, attestation: 'AAAA', challenge: refused.challenge(INSTALL).payload.challenge })
  assert.equal(r1.status, 403)
  assert.deepEqual(r1.payload, { error: 'attest', reason: 'chain' })
  const down = createAttestRoutes({ ...base, registry: fakeRegistry({ fail: Object.assign(new Error('Firestore'), { status: 503 }) }) })
  const r2 = await down.register(INSTALL, { keyId: KEY_ID, attestation: 'AAAA', challenge: down.challenge(INSTALL).payload.challenge })
  assert.equal(r2.status, 503)
  assert.equal(r2.payload.error, 'unavailable')
})

test('register avec le vrai registre : le défi transmis est celui que vérifie l’attestation', async () => {
  const seen = []
  const registry = createAttestRegistry({
    verifyAttestation: ({ keyId, challenge }) => {
      seen.push(challenge)
      return { keyId: Buffer.from(keyId, 'base64'), publicKey: Buffer.alloc(65, 4), environment: 'development', category: 3 }
    },
    verifyAssertion: () => ({ counter: 1 }),
  })
  const routes = createAttestRoutes({ registry, challenges: createChallengeStore(), mode: 'observe' })
  const { challenge } = routes.challenge(INSTALL).payload
  const res = await routes.register(INSTALL, { keyId: KEY_ID, attestation: 'AAAA', challenge })
  assert.equal(res.status, 200)
  assert.equal(res.payload.environment, 'development')
  assert.equal(seen[0].toString('base64'), challenge)
})

async function withServer(deps, fn) {
  const handler = createHandler({
    quota: createQuota({ globalPerDay: 100, installPerDay: 2, globalPerMinute: 100 }),
    ingredientNames: ['Pomme, crue'],
    allowedOrigins: ['https://localhost'],
    ...deps,
  })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  try {
    await fn(`http://127.0.0.1:${server.address().port}`)
  } finally {
    server.close()
  }
}

const call = (url, path, { body, installId = INSTALL, method = 'POST' } = {}) =>
  fetch(`${url}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: 'https://localhost', ...(installId ? { 'X-Install-Id': installId } : {}) },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  })

test('serveur : sans App Attest (mode off), les routes n’existent pas', async () => {
  await withServer({}, async (url) => {
    const res = await call(url, '/v1/attest/challenge')
    assert.equal(res.status, 404)
  })
})

test('serveur : défi puis enregistrement, identifiant obligatoire, POST seulement, quota partagé', async () => {
  const registry = fakeRegistry()
  const appAttest = createAttestRoutes({ registry, challenges: createChallengeStore(), mode: 'observe' })
  const billingQuota = createQuota({ installPerDay: 2, globalPerDay: 100, globalPerMinute: 100 })
  await withServer({ appAttest, billingQuota }, async (url) => {
    assert.equal((await call(url, '/v1/attest/challenge', { installId: null })).status, 400)
    assert.equal((await call(url, '/v1/attest/challenge', { method: 'GET' })).status, 405)
    // Sans corps, comme l'enverra l'iPhone
    const issued = await fetch(`${url}/v1/attest/challenge`, { method: 'POST', headers: { Origin: 'https://localhost', 'X-Install-Id': INSTALL } })
    assert.equal(issued.status, 200)
    assert.equal(issued.headers.get('access-control-allow-origin'), 'https://localhost')
    const { challenge } = await issued.json()
    const reg = await call(url, '/v1/attest/register', { body: { keyId: KEY_ID, attestation: 'AAAA', challenge } })
    assert.equal(reg.status, 200)
    assert.deepEqual(await reg.json(), { ok: true, environment: 'production' })
    // 2 par jour et par installation ici (même quota que la vérification d'abonnement)
    const limited = await call(url, '/v1/attest/challenge')
    assert.equal(limited.status, 429)
  })
})

test('serveur : CORS autorise les en-têtes App Attest', async () => {
  await withServer({}, async (url) => {
    const res = await fetch(`${url}/v1/meal/analyze`, { method: 'OPTIONS', headers: { Origin: 'https://localhost' } })
    const allowed = res.headers.get('access-control-allow-headers')
    for (const h of ['X-AppAttest-Key', 'X-AppAttest-Assertion', 'X-AppAttest-Time']) assert.ok(allowed.includes(h), h)
  })
})
