import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { createHandler } from '../src/server.js'
import { createQuota } from '../src/quota.js'
import { createFirestoreFeedbackStore, createMemoryFeedbackStore, digestFeedback, parseFeedback } from '../src/feedback.js'

const NOW = Date.parse('2026-11-10T06:00:00Z')
const DAY = 86_400_000
const SECRET = 'Mon ventre me fait mal après les lentilles, Jeanne'

async function withServer(feedback, fn) {
  const logs = []
  const handler = createHandler({
    quota: createQuota({ globalPerDay: 100, installPerDay: 2, globalPerMinute: 100 }),
    ingredientNames: [],
    allowedOrigins: [],
    log: (e) => logs.push(e),
    now: () => NOW,
    feedback,
  })
  const server = createServer((req, res) => handler(req, res))
  await new Promise((r) => server.listen(0, r))
  try {
    await fn(`http://127.0.0.1:${server.address().port}`, logs)
  } finally {
    server.close()
  }
}

function seeded() {
  const store = createMemoryFeedbackStore()
  const add = (text, ago, extra = {}) => store.items.push(parseFeedback({ text, version: '1.0.498', variant: 'play', ...extra }, { now: NOW - ago }))
  add('Super, merci !', 1 * DAY)
  add('L\'app plante quand j\'ouvre la caméra', 2 * DAY)
  add(SECRET, 3 * DAY, { variant: 'sideload', version: '1.0.497' })
  add('Trop ancien', 9 * DAY)
  return store
}

const deps = (store, ok = true) => ({
  quota: createQuota({ installPerDay: 5, globalPerDay: 200, globalPerMinute: 20, now: () => NOW }),
  store,
  digestAuth: async (authorization) => ok && authorization === 'Bearer ci',
})

test('digestFeedback : comptes par jour, variante, version et thème, aucun texte', () => {
  const store = seeded()
  const d = digestFeedback(store.items.slice(0, 3), { since: 'a', until: 'b' })
  assert.equal(d.total, 3)
  assert.deepEqual(d.byVariant, { play: 2, sideload: 1 })
  assert.deepEqual(d.byVersion, { '1.0.498': 2, '1.0.497': 1 })
  assert.equal(d.themes.merci, 1)
  assert.equal(d.themes.plantage, 1)
  assert.equal(d.themes.bienetre, 1)
  assert.equal(d.themes.ventre, 1)
  assert.equal(d.themes.lenteur, 0)
  assert.equal(d.unclassified, 0)
  assert.equal(d.themeLabels.plantage, 'Plantage ou blocage')
  const json = JSON.stringify(d)
  for (const word of ['lentilles', 'Jeanne', 'Super', 'plante']) assert.ok(!json.includes(word), `« ${word} » ne doit pas sortir`)
})

test('GET /v1/feedback/digest : jeton de la CI exigé, 7 jours par défaut, aucun texte dans la réponse', async () => {
  await withServer(deps(seeded()), async (url, logs) => {
    assert.equal((await fetch(`${url}/v1/feedback/digest`)).status, 401)
    assert.equal((await fetch(`${url}/v1/feedback/digest`, { headers: { Authorization: 'Bearer autre' } })).status, 401)
    assert.equal((await fetch(`${url}/v1/feedback/digest`, { method: 'POST', headers: { Authorization: 'Bearer ci' } })).status, 405)
    const res = await fetch(`${url}/v1/feedback/digest`, { headers: { Authorization: 'Bearer ci' } })
    assert.equal(res.status, 200)
    const raw = await res.text()
    const body = JSON.parse(raw)
    assert.equal(body.days, 7)
    assert.equal(body.total, 3)
    assert.equal(body.since, new Date(NOW - 7 * DAY).toISOString())
    assert.ok(!raw.includes('lentilles') && !raw.includes('Jeanne'))
    const wide = await (await fetch(`${url}/v1/feedback/digest?days=99`, { headers: { Authorization: 'Bearer ci' } })).json()
    assert.equal(wide.days, 30)
    assert.equal(wide.total, 4)
    assert.ok(logs.every((e) => !JSON.stringify(e).includes('lentilles')))
  })
})

test('GET /v1/feedback/digest : Firestore injoignable → 503', async () => {
  const store = { add: async () => {}, list: async () => { throw Object.assign(new Error('x'), { status: 403 }) } }
  await withServer(deps(store), async (url, logs) => {
    const res = await fetch(`${url}/v1/feedback/digest`, { headers: { Authorization: 'Bearer ci' } })
    assert.equal(res.status, 503)
    assert.deepEqual(await res.json(), { error: 'store', status: 403 })
    assert.ok(logs.some((e) => e.event === 'feedback_store_failed' && e.op === 'list'))
  })
})

test('sans vérificateur de jeton, la route du résumé reste inconnue', async () => {
  const { digestAuth, ...noAuth } = deps(seeded())
  assert.ok(digestAuth)
  await withServer(noAuth, async (url) => {
    assert.equal((await fetch(`${url}/v1/feedback/digest`, { headers: { Authorization: 'Bearer ci' } })).status, 404)
  })
})

test('Firestore : runQuery sur createdAt, du plus récent au plus ancien, champs relus', async () => {
  const calls = []
  const store = createFirestoreFeedbackStore({
    project: 'p',
    getToken: async () => 'tok',
    fetchImpl: async (u, init) => {
      calls.push({ u, init })
      return {
        ok: true,
        status: 200,
        json: async () => [
          { document: { fields: { text: { stringValue: 'ok' }, version: { stringValue: '1' }, variant: { stringValue: 'play' }, platform: { stringValue: 'android' }, day: { stringValue: '2026-11-09' }, createdAt: { timestampValue: '2026-11-09T10:00:00Z' } } } },
          { readTime: '2026-11-10T06:00:00Z' },
        ],
      }
    },
  })
  const items = await store.list({ since: '2026-11-03T06:00:00.000Z' })
  assert.equal(calls[0].u, 'https://firestore.googleapis.com/v1/projects/p/databases/(default)/documents:runQuery')
  const { structuredQuery } = JSON.parse(calls[0].init.body)
  assert.deepEqual(structuredQuery.from, [{ collectionId: 'feedback' }])
  assert.equal(structuredQuery.where.fieldFilter.op, 'GREATER_THAN_OR_EQUAL')
  assert.equal(structuredQuery.where.fieldFilter.value.timestampValue, '2026-11-03T06:00:00.000Z')
  assert.equal(structuredQuery.orderBy[0].direction, 'DESCENDING')
  assert.deepEqual(items, [{ text: 'ok', version: '1', variant: 'play', platform: 'android', day: '2026-11-09', createdAt: '2026-11-09T10:00:00Z' }])
  const failing = createFirestoreFeedbackStore({ project: 'p', getToken: async () => 't', fetchImpl: async () => ({ ok: false, status: 403 }) })
  await assert.rejects(failing.list({ since: 'x' }), { status: 403 })
})

test('workflow du résumé : main seulement, jeton OIDC pour la route du résumé, aucun texte publié', () => {
  const wf = readFileSync(new URL('../../.github/workflows/feedback-digest.yml', import.meta.url), 'utf8')
  assert.match(wf, /id_token_audience: https:\/\/halcya-relay-81378799481\.europe-west1\.run\.app\/v1\/feedback\/digest/)
  assert.match(wf, /service_account: gh-deployer@healthtrack-824b26\.iam\.gserviceaccount\.com/)
  assert.match(wf, /refs\/heads\/main/)
  assert.ok(!/\.text\b/.test(wf), 'le workflow ne lit jamais le champ text')
})
