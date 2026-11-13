import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanupPlan, collect, distributed, expire, expiryClient, fromPage, namedPlan, staleReviews } from './store-beta-expire.mjs'
import { GROUP_NAME } from './store-beta.mjs'

const b = (version, extra = {}) => ({ id: `id-${version}`, version, state: 'VALID', expired: false, review: null, submitted: null, external: null, inGroup: false, ...extra })
const ok = (json) => ({ ok: true, status: 200, json: async () => json })

// L'état du 9/11 matin : 844.344 attachée à la version de l'App Store, 839.337 distribuée aux testeurs, 896.376 en
// examen hors du groupe, 918.396 dans le groupe sans examen, des builds internes de 919 à 937
const today = () => [
  b('844.344'),
  b('839.337', { inGroup: true, review: 'APPROVED', external: 'IN_BETA_TESTING' }),
  b('817.312', { inGroup: true, review: 'APPROVED', external: 'IN_BETA_TESTING' }),
  b('896.376', { review: 'WAITING_FOR_REVIEW', submitted: '2026-11-08T10:00:00Z' }),
  b('918.396', { inGroup: true, external: 'READY_FOR_BETA_SUBMISSION' }),
  b('935.412'),
  b('935.413'),
  b('937.414'),
  b('938.415', { state: 'PROCESSING' }),
]

test('nettoyage : gardées la build de l’App Store, la dernière distribuée, celles en examen, en traitement et la plus récente', () => {
  const builds = today().map((x) => (x.version === '918.396' ? { ...x, review: 'WAITING_FOR_REVIEW' } : x))
  const plan = cleanupPlan({ builds, attached: ['844.344'] })
  assert.deepEqual(plan.keep.map((k) => k.version).sort(), ['839.337', '844.344', '896.376', '918.396', '937.414', '938.415'])
  assert.deepEqual(plan.expire.map((x) => x.version), ['935.413', '935.412', '817.312'])
})

test('nettoyage : une build ajoutée au groupe externe mais pas encore soumise reste (la 918.396 du 9/11)', () => {
  const plan = cleanupPlan({ builds: today(), attached: ['844.344'] })
  assert.ok(plan.keep.some((k) => k.version === '918.396' && /à soumettre/.test(k.why)))
  assert.ok(!plan.expire.some((x) => x.version === '918.396'))
  // plus ancienne que la build distribuée : elle ne sert plus
  const old = [b('839.337', { inGroup: true, review: 'APPROVED', external: 'IN_BETA_TESTING' }), b('830.323', { inGroup: true }), b('937.414')]
  assert.deepEqual(cleanupPlan({ builds: old }).expire.map((x) => x.version), ['830.323'])
})

test('nettoyage : la 844.344 reste même sans lecture de la version de l’App Store', () => {
  const plan = cleanupPlan({ builds: today(), attached: [] })
  assert.ok(plan.keep.some((k) => k.version === '844.344'))
  assert.ok(!plan.expire.some((x) => x.version === '844.344'))
})

test('nettoyage : la distribuée reste jusqu’à ce que sa remplaçante soit distribuée', () => {
  const builds = [b('839.337', { inGroup: true, review: 'APPROVED', external: 'IN_BETA_TESTING' }), b('918.396', { inGroup: true, review: 'IN_REVIEW' }), b('937.414')]
  assert.deepEqual(cleanupPlan({ builds }).expire, [])
  const approved = builds.map((x) => (x.version === '918.396' ? { ...x, review: 'APPROVED', external: 'IN_BETA_TESTING' } : x))
  assert.deepEqual(cleanupPlan({ builds: approved }).expire.map((x) => x.version), ['839.337'])
  assert.equal(distributed(approved).version, '918.396')
})

test('builds nommées : la 896.376 en examen peut partir ; jamais la 844.344 ni la dernière distribuée', () => {
  const { expire: list, refused } = namedPlan({ builds: today(), wanted: ['896.376', '844.344', '839.337', '700.1'], attached: ['844.344'] })
  assert.deepEqual(list.map((x) => x.version), ['896.376'])
  assert.deepEqual(refused.map((r) => r.version), ['844.344', '839.337', '700.1'])
})

test('examen bêta de plus de 24 h repéré (soumission quotidienne)', () => {
  const stale = staleReviews(today(), new Date('2026-11-09T11:00:00Z'))
  assert.deepEqual(stale.map((x) => [x.version, x.hours]), [['896.376', 25]])
  assert.deepEqual(staleReviews(today(), new Date('2026-11-09T09:00:00Z')), [])
})

test('seule écriture permise : expirer une build ; la version de l’App Store est lue, jamais écrite', async () => {
  const calls = []
  const { api } = expiryClient('t', async (url, init) => { calls.push([init.method, url]); return ok({}) })
  await api('GET', '/v1/appStoreVersions/1/build')
  await api('PATCH', '/v1/builds/9', { data: { type: 'builds', id: '9', attributes: { expired: true } } })
  for (const [method, path, body] of [
    ['PATCH', '/v1/appStoreVersions/1', { data: { attributes: { versionString: '1' } } }],
    ['POST', '/v1/betaAppReviewSubmissions', { data: {} }],
    ['PATCH', '/v1/builds/9', { data: { type: 'builds', id: '9', attributes: { expired: false } } }],
    ['PATCH', '/v1/builds/9', { data: { type: 'builds', id: '9', attributes: { expired: true, usesNonExemptEncryption: false } } }],
    ['DELETE', '/v1/builds/9'],
  ]) {
    await assert.rejects(() => api(method, path, body), /écriture interdite/)
  }
  assert.deepEqual(calls.map(([m]) => m), ['GET', 'PATCH'])
})

test('expiration : un PATCH « expired » par build ; essai sans appel ; la 844.344 jamais', async () => {
  const calls = []
  const { api } = expiryClient('t', async (url, init) => { calls.push([init.method, url.split('/v1')[1], JSON.parse(init.body || '{}')]); return ok({}) })
  assert.deepEqual(await expire({ api, plan: [b('896.376')] }), ['896.376'])
  assert.deepEqual(calls, [['PATCH', '/builds/id-896.376', { data: { type: 'builds', id: 'id-896.376', attributes: { expired: true } } }]])
  assert.deepEqual(await expire({ api, plan: [b('935.412')], essai: true }), [])
  assert.equal(calls.length, 1)
  await assert.rejects(() => expire({ api, plan: [b('844.344')] }), /protégée/)
})

test('lecture : builds avec examen et état externe inclus, groupe, build de la version de l’App Store', async () => {
  const pages = {
    '/apps?': { data: [{ id: 'app' }] },
    '/apps/app/betaGroups': { data: [{ id: 'g', attributes: { name: GROUP_NAME, isInternalGroup: false } }] },
    '/betaGroups/g/builds': { data: [{ id: 'id-839.337' }] },
    '/apps/app/appStoreVersions': { data: [{ id: 'v844' }] },
    '/appStoreVersions/v844/build': { data: { id: 'id-844.344', attributes: { version: '844.344' } } },
    '/builds?': {
      data: [
        { id: 'id-839.337', attributes: { version: '839.337', processingState: 'VALID', expired: false },
          relationships: { betaAppReviewSubmission: { data: { type: 'betaAppReviewSubmissions', id: 'r1' } }, buildBetaDetail: { data: { type: 'buildBetaDetails', id: 'd1' } } } },
        { id: 'id-896.376', attributes: { version: '896.376', processingState: 'VALID', expired: false },
          relationships: { betaAppReviewSubmission: { data: { type: 'betaAppReviewSubmissions', id: 'r2' } } } },
      ],
      included: [
        { type: 'betaAppReviewSubmissions', id: 'r1', attributes: { betaReviewState: 'APPROVED' } },
        { type: 'buildBetaDetails', id: 'd1', attributes: { externalBuildState: 'IN_BETA_TESTING' } },
        { type: 'betaAppReviewSubmissions', id: 'r2', attributes: { betaReviewState: 'WAITING_FOR_REVIEW', submittedDate: '2026-11-08T10:00:00Z' } },
      ],
    },
  }
  const seen = []
  const fake = async (url) => {
    const path = url.split('/v1')[1]
    seen.push(path)
    const key = Object.keys(pages).find((k) => path.startsWith(k))
    return ok(pages[key])
  }
  const { builds, attached } = await collect(expiryClient('t', fake))
  assert.deepEqual(attached, ['844.344'])
  assert.deepEqual(builds.map((x) => [x.version, x.review, x.external, x.inGroup]), [
    ['839.337', 'APPROVED', 'IN_BETA_TESTING', true],
    ['896.376', 'WAITING_FOR_REVIEW', null, false],
  ])
  assert.ok(seen.some((p) => p.includes('filter[expired]=false') && p.includes('include=betaAppReviewSubmission,buildBetaDetail')))
  assert.equal(fromPage({}).length, 0)
})

test('nettoyage : Android v1000 (11/11) : la 1000.477 passe après la 999.476 (numéros comparés en nombres, pas en texte)', () => {
  const builds = [
    b('844.344'),
    b('999.476', { inGroup: true, review: 'APPROVED', external: 'IN_BETA_TESTING' }),
    b('1000.477', { inGroup: true, review: 'APPROVED', external: 'IN_BETA_TESTING' }),
  ]
  assert.equal(distributed(builds).version, '1000.477')
  const plan = cleanupPlan({ builds, attached: ['844.344'] })
  assert.deepEqual(plan.expire.map((x) => x.version), ['999.476'])
})
