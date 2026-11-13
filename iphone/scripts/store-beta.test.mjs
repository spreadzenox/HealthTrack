import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GROUP_FIELDS, GROUP_NAME, verdict, describe, masked, survey, reviewsOutsideGroup } from './store-beta.mjs'

test('le lien public du groupe n’est jamais demandé (dépôt et journaux publics)', () => {
  assert.ok(!GROUP_FIELDS.split(',').includes('publicLink'))
  assert.ok(GROUP_FIELDS.split(',').includes('name'))
})

test('verdict : en attente, en test ou refusée, d’après l’examen bêta et l’état externe', () => {
  assert.equal(verdict({ review: 'WAITING_FOR_REVIEW', external: 'WAITING_FOR_BETA_REVIEW' }), 'attente')
  assert.equal(verdict({ review: 'IN_REVIEW', external: 'IN_BETA_REVIEW' }), 'attente')
  assert.equal(verdict({ review: 'APPROVED', external: 'BETA_APPROVED' }), 'test')
  assert.equal(verdict({ review: 'APPROVED', external: 'IN_BETA_TESTING' }), 'test')
  assert.equal(verdict({ review: null, external: 'READY_FOR_BETA_TESTING' }), 'test')
  assert.equal(verdict({ review: 'REJECTED', external: 'BETA_REJECTED' }), 'refusée')
  assert.equal(verdict({ review: null, external: 'BETA_REJECTED' }), 'refusée')
  assert.equal(verdict({ review: null, external: 'EXPIRED' }), 'expirée')
  assert.equal(verdict({ review: null, external: null }), 'attente')
})

test('une ligne par build, en français, avec les états bruts d’Apple', () => {
  const line = describe({ version: '839.337', review: 'WAITING_FOR_REVIEW', external: 'WAITING_FOR_BETA_REVIEW' })
  assert.match(line, /^839\.337 : en attente de l'examen bêta/)
  assert.match(line, /WAITING_FOR_REVIEW/)
  const rejected = describe({ version: '817.312', review: 'REJECTED', external: 'BETA_REJECTED' })
  assert.match(rejected, /refusée/)
  assert.match(rejected, /motif : pas lisible par l'API/)
})

test('masque toute adresse TestFlight qui passerait quand même', () => {
  assert.equal(masked('lien https://testflight.apple.com/join/AbCdEf12 ici'), 'lien [lien TestFlight masqué] ici')
  assert.equal(masked('rien à masquer'), 'rien à masquer')
})

test('relevé : seulement des lectures, groupe externe trouvé par son nom, builds triées de la plus récente', async () => {
  const calls = []
  const pages = {
    '/v1/apps': { data: [{ id: 'app1', attributes: { bundleId: 'fr.jpesquet.sante' } }] },
    '/v1/apps/app1/betaGroups': {
      data: [
        { id: 'g-int', attributes: { name: 'Interne Halcya', isInternalGroup: true } },
        { id: 'g-ext', attributes: { name: GROUP_NAME, isInternalGroup: false, publicLinkEnabled: true } },
      ],
    },
    '/v1/betaGroups/g-ext/builds': {
      data: [
        { id: 'b1', attributes: { version: '817.312', expired: false } },
        { id: 'b2', attributes: { version: '839.337', expired: false } },
      ],
    },
    '/v1/builds/b1/betaAppReviewSubmission': { data: { attributes: { betaReviewState: 'APPROVED' } } },
    '/v1/builds/b1/buildBetaDetail': { data: { attributes: { externalBuildState: 'IN_BETA_TESTING' } } },
    '/v1/builds/b2/betaAppReviewSubmission': { data: { attributes: { betaReviewState: 'WAITING_FOR_REVIEW' } } },
    '/v1/builds/b2/buildBetaDetail': { data: { attributes: { externalBuildState: 'WAITING_FOR_BETA_REVIEW' } } },
  }
  const fetchImpl = async (url, { method }) => {
    const path = new URL(url).pathname
    calls.push({ method, url })
    const body = pages[path]
    return { ok: Boolean(body), status: body ? 200 : 404, json: async () => body ?? { errors: [{ title: 'absent' }] } }
  }
  const { group, builds } = await survey({ token: 't', fetchImpl })
  assert.equal(group.name, GROUP_NAME)
  assert.deepEqual(builds.map((b) => [b.version, verdict(b)]), [['839.337', 'attente'], ['817.312', 'test']])
  assert.ok(calls.every((c) => c.method === 'GET'))
  assert.ok(calls.some((c) => c.url.includes(`fields[betaGroups]=${GROUP_FIELDS}`)))
})

// 8/11 : Apple refusait la 918.396 (« Another build in the same train is already in beta review ») alors que la 896.376
// n'était plus dans le groupe : le relevé dit aussi quelles builds récentes sont en examen bêta hors du groupe
test('relevé : builds en examen bêta hors du groupe, demandées par leur état (lecture seule, sans limite d’âge)', async () => {
  const calls = []
  const fetchImpl = async (url, { method }) => {
    calls.push({ method, url })
    const u = new URL(url)
    const state = u.searchParams.get('filter[betaAppReviewSubmission.betaReviewState]')
    const data = state === 'WAITING_FOR_REVIEW'
      ? [{ id: 'b8', attributes: { version: '896.376' } }, { id: 'b9', attributes: { version: '918.396' } }]
      : []
    return { ok: true, status: 200, json: async () => ({ data }) }
  }
  const out = await reviewsOutsideGroup({ token: 't', fetchImpl, appId: 'app1', inGroup: ['918.396'] })
  assert.deepEqual(out, [{ version: '896.376', review: 'WAITING_FOR_REVIEW' }])
  assert.ok(calls.every((c) => c.method === 'GET'))
  assert.ok(calls.every((c) => c.url.includes('filter[app]=app1')))
  assert.deepEqual(calls.map((c) => new URL(c.url).searchParams.get('filter[betaAppReviewSubmission.betaReviewState]')), ['WAITING_FOR_REVIEW', 'IN_REVIEW'])
})
