import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isForbidden, WHATS_NEW_MAX, guarded, pickBuild, readWhatsNew, submitForBetaReview } from './store-beta-submit.mjs'
import { GROUP_NAME } from './store-beta.mjs'

const build = (id, version, processingState = 'VALID', expired = false) => ({ id, attributes: { version, processingState, expired } })

test('« À tester » : en français, sous la limite d’Apple, sans lien TestFlight', () => {
  const text = readWhatsNew()
  assert.ok(text.length > 100 && text.length <= WHATS_NEW_MAX)
  assert.match(text, /Merci de tester Halcya/)
  assert.doesNotMatch(text, /testflight\.apple\.com/)
  assert.doesNotMatch(text, /ventre/i) // décision du propriétaire du 07/11 : « digestion »
})

test('la build : la plus récente traitée et non expirée, ou celle demandée', () => {
  const list = [build('a', '853.354'), build('b', '871.370', 'PROCESSING'), build('c', '865.360', 'VALID', true), build('d', '864.359')]
  assert.equal(pickBuild(list).version, '864.359')
  assert.equal(pickBuild(list, '871.370').state, 'PROCESSING')
  assert.equal(pickBuild(list, '999.1'), null)
  assert.equal(pickBuild([build('e', '871.370', 'PROCESSING')]), null)
})

test('jamais la version de l’App Store : tout chemin qui la touche est refusé avant l’appel', async () => {
  const calls = []
  const { api } = guarded('t', async (url) => { calls.push(url); return { ok: true, status: 200, json: async () => ({}) } })
  for (const path of ['/v1/appStoreVersions/1', '/v1/reviewSubmissions', '/v1/appStoreVersionSubmissions', '/v1/apps/1/appStoreVersions']) {
    assert.ok(isForbidden(path))
    await assert.rejects(() => api('POST', path, {}), /chemin interdit/)
  }
  assert.equal(calls.length, 0)
  // l'examen bêta, lui, est permis
  assert.ok(!isForbidden('/v1/betaAppReviewSubmissions'))
  assert.ok(!isForbidden('/v1/builds/b1/betaAppReviewSubmission?fields[betaAppReviewSubmissions]=betaReviewState'))
})

function fakeApple({ processing = 'VALID', inGroup = false, submitted = null, localized = false } = {}) {
  const calls = []
  const routes = {
    'GET /v1/apps': { data: [{ id: 'app1' }] },
    'GET /v1/apps/app1/betaGroups': {
      data: [
        { id: 'g-int', attributes: { name: 'Interne Halcya', isInternalGroup: true } },
        { id: 'g-ext', attributes: { name: GROUP_NAME, isInternalGroup: false } },
      ],
    },
    'GET /v1/builds': { data: [build('b-old', '853.354'), build('b-new', '871.370', processing)] },
    'GET /v1/builds/b-new/betaBuildLocalizations': { data: localized ? [{ id: 'l1', attributes: { locale: 'fr-FR', whatsNew: 'déjà' } }] : [] },
    'GET /v1/betaGroups/g-ext/builds': { data: inGroup ? [{ id: 'b-old' }, { id: 'b-new' }] : [{ id: 'b-old' }] },
    'GET /v1/builds/b-new/betaAppReviewSubmission': submitted ? { data: { attributes: { betaReviewState: submitted } } } : null,
    'POST /v1/betaBuildLocalizations': { data: { id: 'l2' } },
    'POST /v1/betaGroups/g-ext/relationships/builds': {},
    'POST /v1/betaAppReviewSubmissions': { data: { id: 's1' } },
  }
  const fetchImpl = async (url, { method, body }) => {
    const path = new URL(url).pathname
    calls.push({ method, path, body: body ? JSON.parse(body) : null, url })
    const res = routes[`${method} ${path}`]
    if (res === undefined || res === null) return { ok: false, status: 404, json: async () => ({ errors: [{ title: 'absent' }] }) }
    return { ok: true, status: method === 'POST' && path.includes('relationships') ? 204 : 200, json: async () => res }
  }
  return { calls, fetchImpl }
}

test('build neuve : « À tester », groupe externe, puis examen bêta, et rien d’autre', async () => {
  const { calls, fetchImpl } = fakeApple()
  const { build: b, done } = await submitForBetaReview({ token: 't', fetchImpl, whatsNew: 'Merci de tester Halcya !' })
  assert.equal(b.version, '871.370')
  assert.deepEqual(done, ['à tester', 'groupe', 'examen bêta'])
  const writes = calls.filter((c) => c.method !== 'GET')
  assert.deepEqual(writes.map((c) => `${c.method} ${c.path}`), [
    'POST /v1/betaBuildLocalizations',
    'POST /v1/betaGroups/g-ext/relationships/builds',
    'POST /v1/betaAppReviewSubmissions',
  ])
  assert.equal(writes[0].body.data.attributes.locale, 'fr-FR')
  assert.deepEqual(writes[1].body.data, [{ type: 'builds', id: 'b-new' }])
  assert.equal(writes[2].body.data.relationships.build.data.id, 'b-new')
  assert.ok(calls.every((c) => !isForbidden(c.path)))
  // Apple refuse GET /v1/builds/{id}/betaGroups (403 du 07/11) : jamais appelé
  assert.ok(calls.every((c) => !/\/v1\/builds\/[^/]+\/betaGroups/.test(c.path)))
  assert.ok(calls.every((c) => !/[=,]publicLink(,|&|$)/.test(decodeURIComponent(c.url)))) // l'adresse du lien public n'est jamais demandée
})

test('relancé : tout est déjà fait, aucune écriture', async () => {
  const { calls, fetchImpl } = fakeApple({ inGroup: true, submitted: 'WAITING_FOR_REVIEW', localized: true })
  const { done } = await submitForBetaReview({ token: 't', fetchImpl, whatsNew: 'x' })
  assert.deepEqual(done, [])
  assert.ok(calls.every((c) => c.method === 'GET'))
})

test('build pas encore traitée par Apple : rien n’est écrit, à refaire au run suivant', async () => {
  const lines = []
  const { calls, fetchImpl } = fakeApple({ processing: 'PROCESSING' })
  const { build: b } = await submitForBetaReview({ token: 't', fetchImpl, whatsNew: 'x', wanted: '871.370', log: (l) => lines.push(l) })
  assert.equal(b, null)
  assert.ok(calls.every((c) => c.method === 'GET'))
  assert.match(lines.join('\n'), /pas encore traitée/)
})

test('la build : Android v1000 (11/11) : la 1000.477 est plus récente que la 999.476', () => {
  assert.equal(pickBuild([build('a', '999.476'), build('b', '1000.477'), build('c', '998.475')]).version, '1000.477')
})
