import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createHandler, FEEDBACK_QUOTA_MESSAGE } from '../src/server.js'
import { createQuota } from '../src/quota.js'
import { loadConfig } from '../src/config.js'
import { FEEDBACK_MAX_LENGTH, createFirestoreFeedbackStore, createMemoryFeedbackStore, parseFeedback, redactPersonal } from '../src/feedback.js'

const INSTALL = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
const NOW = Date.parse('2026-11-04T21:00:00Z')

async function withServer(deps, fn) {
  const logs = []
  const handler = createHandler({
    quota: createQuota({ globalPerDay: 100, installPerDay: 2, globalPerMinute: 100 }),
    ingredientNames: [],
    allowedOrigins: ['https://localhost'],
    log: (e) => logs.push(e),
    now: () => NOW,
    ...deps,
  })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  try {
    await fn(`http://127.0.0.1:${server.address().port}`, logs)
  } finally {
    server.close()
  }
}

const feedbackDeps = (overrides = {}) => ({
  quota: createQuota({ installPerDay: 5, globalPerDay: 200, globalPerMinute: 20, now: () => NOW }),
  store: createMemoryFeedbackStore(),
  ...overrides,
})

const send = (url, body, headers = { 'X-Install-Id': INSTALL }) =>
  fetch(`${url}/v1/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://localhost', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

test('redactPersonal masque e-mails et longs numéros, garde le reste', () => {
  assert.equal(redactPersonal('écrivez à jean.dupont@exemple.fr svp'), 'écrivez à [e-mail masqué] svp')
  assert.equal(redactPersonal('mon 06 12 34 56 78 !'), 'mon [numéro masqué] !')
  assert.equal(redactPersonal('+33612345678'), '[numéro masqué]')
  assert.equal(redactPersonal('version 1.2.3, 3 repas, 2026'), 'version 1.2.3, 3 repas, 2026')
})

test('parseFeedback : texte requis, borné, champs normalisés, expiration à 90 jours, aucun identifiant', () => {
  assert.throws(() => parseFeedback({ text: '   ' }), { code: 'empty' })
  assert.throws(() => parseFeedback({ text: 'x'.repeat(FEEDBACK_MAX_LENGTH + 1) }), { code: 'too_long' })
  const entry = parseFeedback({ text: ' Super app ', version: '1.0.496', variant: 'play', installId: INSTALL }, { now: NOW })
  assert.deepEqual(entry, {
    text: 'Super app',
    version: '1.0.496',
    variant: 'play',
    platform: 'android',
    day: '2026-11-04',
    createdAt: '2026-11-04T21:00:00.000Z',
    expireAt: '2027-02-02T21:00:00.000Z',
  })
  const odd = parseFeedback({ text: 'ok', version: '<script>', variant: 'autre' }, { now: NOW, platform: 'ios' })
  assert.equal(odd.version, 'inconnue')
  assert.equal(odd.variant, 'inconnue')
  assert.equal(odd.platform, 'ios')
})

test('POST /v1/feedback : avis gardé sans identifiant, journal sans texte', async () => {
  const deps = feedbackDeps()
  await withServer({ feedback: deps }, async (url, logs) => {
    const res = await send(url, { text: 'Le bouton photo est top, mail: a@b.fr', version: '1.0.496', variant: 'play' })
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { ok: true })
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://localhost')
    assert.equal(deps.store.items.length, 1)
    assert.equal(deps.store.items[0].text, 'Le bouton photo est top, mail: [e-mail masqué]')
    const stored = JSON.stringify(deps.store.items)
    assert.ok(!stored.includes(INSTALL))
    const serialized = JSON.stringify(logs)
    assert.ok(!serialized.includes('bouton photo'))
    assert.ok(!serialized.includes(INSTALL))
    assert.ok(logs.some((e) => e.event === 'feedback' && e.variant === 'play'))
  })
})

test('POST /v1/feedback : 5 avis par jour et par installation, puis 429 avec un message clair', async () => {
  const deps = feedbackDeps()
  await withServer({ feedback: deps }, async (url) => {
    for (let i = 0; i < 5; i += 1) assert.equal((await send(url, { text: `avis ${i}` })).status, 200)
    const res = await send(url, { text: 'un de trop' })
    assert.equal(res.status, 429)
    assert.equal((await res.json()).message, FEEDBACK_QUOTA_MESSAGE)
    assert.equal(deps.store.items.length, 5)
  })
})

test('POST /v1/feedback : refus sans identifiant, mauvais JSON, mauvaise méthode, corps trop gros', async () => {
  await withServer({ feedback: feedbackDeps() }, async (url) => {
    assert.equal((await send(url, { text: 'ok' }, {})).status, 400)
    assert.equal((await send(url, '{pas du json')).status, 400)
    assert.equal((await fetch(`${url}/v1/feedback`)).status, 405)
    const big = await send(url, { text: 'é'.repeat(9000) }).catch(() => null)
    assert.ok(!big || big.status === 413)
  })
})

test('POST /v1/feedback : stockage injoignable → 503 et quota rendu', async () => {
  let fail = true
  const items = []
  const deps = feedbackDeps({ store: { add: async (e) => { if (fail) throw Object.assign(new Error('x'), { status: 503 }); items.push(e) } } })
  await withServer({ feedback: deps }, async (url, logs) => {
    assert.equal((await send(url, { text: 'a' })).status, 503)
    assert.ok(logs.some((e) => e.event === 'feedback_store_failed'))
    fail = false
    for (let i = 0; i < 5; i += 1) assert.equal((await send(url, { text: `b${i}` })).status, 200)
    assert.equal(items.length, 5)
  })
})

test('POST /v1/feedback : verdict d\'intégrité refusé (enforce) → 403, rien gardé', async () => {
  const deps = feedbackDeps()
  const integrity = { check: async () => ({ ok: false, status: 'denied' }) }
  await withServer({ feedback: deps, integrity }, async (url) => {
    assert.equal((await send(url, { text: 'a' })).status, 403)
    assert.equal(deps.store.items.length, 0)
  })
})

test('sans module feedback, la route reste inconnue (404)', async () => {
  await withServer({}, async (url) => {
    assert.equal((await send(url, { text: 'a' })).status, 404)
  })
})

test('Firestore : un document par avis, champs typés, expireAt en horodatage', async () => {
  const calls = []
  const store = createFirestoreFeedbackStore({
    project: 'p',
    getToken: async () => 'tok',
    fetchImpl: async (u, init) => { calls.push({ u, init }); return { ok: true, status: 200 } },
  })
  await store.add(parseFeedback({ text: 'ok', version: '1', variant: 'play' }, { now: NOW }))
  assert.equal(calls[0].u, 'https://firestore.googleapis.com/v1/projects/p/databases/(default)/documents/feedback')
  assert.equal(calls[0].init.method, 'POST')
  const { fields } = JSON.parse(calls[0].init.body)
  assert.equal(fields.text.stringValue, 'ok')
  assert.equal(fields.expireAt.timestampValue, '2027-02-02T21:00:00.000Z')
  assert.deepEqual(Object.keys(fields).sort(), ['createdAt', 'day', 'expireAt', 'platform', 'text', 'variant', 'version'])
  const failing = createFirestoreFeedbackStore({ project: 'p', getToken: async () => 't', fetchImpl: async () => ({ ok: false, status: 403 }) })
  await assert.rejects(failing.add(parseFeedback({ text: 'a' }, { now: NOW })), { status: 403 })
})

test('config : plafonds de « Votre avis » par défaut', () => {
  const c = loadConfig({ GOOGLE_CLOUD_PROJECT: 'p' })
  assert.equal(c.feedbackPerDay, 5)
  assert.equal(c.feedbackGlobalPerDay, 200)
  assert.equal(c.feedbackPerMinute, 20)
})
