import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NOTES_LIMIT, apply, buildProblems, parseArgs, plan, preparing, report, reviewNotes, submissionClient, survey } from './store-submission.mjs'
import { GROUP_NAME } from './store-beta.mjs'

const ok = (json) => ({ ok: true, status: 200, json: async () => json })
const version = (versionString = '844', extra = {}) => ({ id: 'v1', attributes: { versionString, appVersionState: 'PREPARE_FOR_SUBMISSION', releaseType: 'MANUAL', ...extra } })
const good = (extra = {}) => ({ id: 'b1180', version: '1180.1180', marketing: '893', state: 'VALID', expired: false, review: 'APPROVED', external: 'IN_BETA_TESTING', inGroup: true, ...extra })

test('notes : le texte du dépôt, après le trait, sous la limite d’Apple et sans adresse e-mail', () => {
  const notes = reviewNotes()
  assert.ok(notes.startsWith('Halcya is a personal gut-and-wellbeing journal'))
  assert.ok(notes.length <= NOTES_LIMIT, `${notes.length} caractères`)
  assert.ok(!/@/.test(notes))
  assert.ok(!/^---/m.test(notes))
  assert.equal(reviewNotes('# Titre\n\nEn-tête\n\n---\n\nTexte.\n'), 'Texte.')
  assert.throws(() => reviewNotes('pas de trait'), /trait/)
  assert.throws(() => reviewNotes(`---\n${'a'.repeat(NOTES_LIMIT + 1)}`), /limite/)
  assert.throws(() => reviewNotes('---\nÉcrire à quelqu.un@exemple.fr'), /e-mail/)
})

test('client : seules les écritures de la préparation passent ; jamais d’envoi à l’examen', async () => {
  const calls = []
  const { api } = submissionClient('t', async (url, init) => { calls.push(`${init.method} ${url}`); return ok({}) })
  await api('GET', '/v1/apps')
  await api('PATCH', '/v1/appStoreVersions/v1', { data: { type: 'appStoreVersions', id: 'v1', attributes: { versionString: '893', releaseType: 'MANUAL' } } })
  await api('PATCH', '/v1/appStoreVersions/v1/relationships/build', { data: { type: 'builds', id: 'b' } })
  await api('PATCH', '/v1/appStoreReviewDetails/r1', { data: { type: 'appStoreReviewDetails', id: 'r1', attributes: { notes: 'x', demoAccountRequired: false } } })
  await api('POST', '/v1/appStoreReviewDetails', { data: { type: 'appStoreReviewDetails', attributes: { notes: 'x', demoAccountRequired: false } } })
  assert.equal(calls.length, 5)
  const refused = [
    ['POST', '/v1/reviewSubmissions', { data: { type: 'reviewSubmissions' } }],
    ['POST', '/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems' } }],
    ['PATCH', '/v1/reviewSubmissions/s1', { data: { type: 'reviewSubmissions', id: 's1', attributes: { submitted: true } } }],
    ['POST', '/v1/subscriptionSubmissions', { data: { type: 'subscriptionSubmissions' } }],
    ['POST', '/v1/appStoreVersionSubmissions', { data: { type: 'appStoreVersionSubmissions' } }],
    ['PATCH', '/v1/appStoreVersions/v1', { data: { type: 'appStoreVersions', id: 'v1', attributes: { earliestReleaseDate: 'x' } } }],
    ['PATCH', '/v1/appStoreReviewDetails/r1', { data: { type: 'appStoreReviewDetails', id: 'r1', attributes: { notes: 'x', demoAccountRequired: false, contactEmail: 'x' } } }],
    ['DELETE', '/v1/appStoreVersions/v1', null],
    ['PATCH', '/v1/builds/b', { data: { type: 'builds', id: 'b', attributes: { expired: true } } }],
  ]
  for (const [m, p, b] of refused) await assert.rejects(() => api(m, p, b), /interdite/, `${m} ${p}`)
  assert.equal(calls.length, 5)
})

test('version en préparation : exactement une, sinon une erreur qui dit ce qui existe', () => {
  assert.equal(preparing([version('844'), { id: 'v0', attributes: { versionString: '700', appStoreState: 'READY_FOR_SALE' } }]).id, 'v1')
  assert.throws(() => preparing([{ id: 'v1', attributes: { versionString: '844', appVersionState: 'WAITING_FOR_REVIEW' } }]), /0 trouvée.*844 \(WAITING_FOR_REVIEW\)/)
})

test('build : refusée si mauvais numéro, pas traitée, expirée, hors du groupe ou pas validée', () => {
  assert.deepEqual(buildProblems(good(), '893'), [])
  assert.match(buildProblems(good({ marketing: '844' }), '893').join(), /844 au lieu de 893/)
  assert.match(buildProblems(good({ state: 'PROCESSING' }), '893').join(), /pas traitée/)
  assert.match(buildProblems(good({ expired: true }), '893').join(), /expirée/)
  assert.match(buildProblems(good({ inGroup: false }), '893').join(), new RegExp(GROUP_NAME))
  assert.match(buildProblems(good({ review: 'WAITING_FOR_REVIEW', external: 'WAITING_FOR_BETA_REVIEW' }), '893').join(), /pas encore validée/)
  assert.deepEqual(buildProblems(null, '893'), ['build introuvable'])
})

test('plan : 844 → 893, build de la refonte, notes ; rien si tout est déjà en place', () => {
  const steps = plan({ version: version('844'), attached: '844.344', review: { id: 'r1', attributes: { notes: 'ancien', demoAccountRequired: false } }, wanted: '893', build: good(), notes: 'nouveau' })
  assert.deepEqual(steps, [
    { what: 'version', attrs: { versionString: '893' } },
    { what: 'build', id: 'b1180', version: '1180.1180' },
    { what: 'notes', id: 'r1' },
  ])
  const done = plan({ version: version('893'), attached: '1180.1180', review: { id: 'r1', attributes: { notes: 'n', demoAccountRequired: false } }, wanted: '893', build: good(), notes: 'n' })
  assert.deepEqual(done, [])
  // publication automatique remise en manuelle ; fiche d'examen absente créée
  const auto = plan({ version: version('893', { releaseType: 'AFTER_APPROVAL' }), attached: '1180.1180', review: null, wanted: '893', build: good(), notes: 'n' })
  assert.deepEqual(auto, [{ what: 'version', attrs: { releaseType: 'MANUAL' } }, { what: 'notes', id: null }])
})

test('plan : refus d’une version déjà envoyée ou d’une build qui ne convient pas', () => {
  assert.throws(() => plan({ version: version('844', { appVersionState: 'WAITING_FOR_REVIEW' }), wanted: '893', build: good(), notes: 'n' }), /rien n'est modifié/)
  assert.throws(() => plan({ version: version('844'), wanted: '893', build: good({ inGroup: false }), notes: 'n' }), /refusée/)
  assert.throws(() => plan({ version: version('844'), wanted: '893', build: null, notes: 'n' }), /introuvable/)
})

const routes = (extra = {}) => ({
  '/v1/apps?': { data: [{ id: 'app' }] },
  '/v1/apps/app/appStoreVersions': { data: [version('844')] },
  '/v1/appStoreVersions/v1/build': { data: { id: 'b844', attributes: { version: '844.344' } } },
  '/v1/appStoreVersions/v1/appStoreReviewDetail': { data: { id: 'r1', attributes: { notes: 'ancien', demoAccountRequired: false } } },
  '/v1/builds?': {
    data: [{ id: 'b1180', attributes: { version: '1180.1180', processingState: 'VALID', expired: false },
      relationships: { preReleaseVersion: { data: { type: 'preReleaseVersions', id: 'p893' } }, buildBetaDetail: { data: { type: 'buildBetaDetails', id: 'd' } }, betaAppReviewSubmission: { data: { type: 'betaAppReviewSubmissions', id: 's' } } } }],
    included: [
      { type: 'preReleaseVersions', id: 'p893', attributes: { version: '893' } },
      { type: 'buildBetaDetails', id: 'd', attributes: { externalBuildState: 'IN_BETA_TESTING' } },
      { type: 'betaAppReviewSubmissions', id: 's', attributes: { betaReviewState: 'APPROVED' } },
    ],
  },
  '/v1/apps/app/betaGroups': { data: [{ id: 'g', attributes: { name: GROUP_NAME, isInternalGroup: false } }] },
  '/v1/betaGroups/g/builds': { data: [{ id: 'b1180' }] },
  ...extra,
})

function fake(table) {
  const calls = []
  const fetchImpl = async (url, init) => {
    const path = url.replace('https://api.appstoreconnect.apple.com', '')
    calls.push({ method: init.method, path, body: init.body ? JSON.parse(init.body) : null })
    if (init.method !== 'GET') return ok({})
    const key = Object.keys(table).find((k) => path.startsWith(k))
    if (!key) return { ok: false, status: 404, json: async () => ({ errors: [{ title: 'Not found' }] }) }
    return ok(table[key])
  }
  return { calls, ...submissionClient('t', fetchImpl) }
}

test('relevé puis préparation sur des réponses synthétiques : trois écritures, aucune soumission', async () => {
  const f = fake(routes())
  const state = await survey(f, { buildNumber: '1180.1180' })
  assert.equal(state.attached, '844.344')
  assert.deepEqual(state.build, good())
  const lines = report(state, 'nouveau')
  assert.match(lines.join('\n'), /En préparation : 844 ; publication MANUAL ; build attachée 844\.344/)
  assert.match(lines.join('\n'), /différentes de notes-examen/)
  const steps = plan({ version: state.version, attached: state.attached, review: state.review, wanted: '893', build: state.build, notes: 'nouveau' })
  const before = f.calls.length
  await apply({ api: f.api, version: state.version, steps, notes: 'nouveau' })
  const writes = f.calls.slice(before)
  assert.deepEqual(writes.map((c) => `${c.method} ${c.path}`), [
    'PATCH /v1/appStoreVersions/v1',
    'PATCH /v1/appStoreVersions/v1/relationships/build',
    'PATCH /v1/appStoreReviewDetails/r1',
  ])
  assert.equal(writes[0].body.data.attributes.versionString, '893')
  assert.deepEqual(writes[2].body.data.attributes, { notes: 'nouveau', demoAccountRequired: false })
  assert.ok(!f.calls.some((c) => c.method !== 'GET' && /[sS]ubmission/.test(c.path)))
})

test('essai : aucune écriture ; fiche d’examen absente créée par POST', async () => {
  const f = fake(routes({ '/v1/appStoreVersions/v1/appStoreReviewDetail': undefined }))
  const state = await survey(f, { buildNumber: '1180.1180' })
  assert.equal(state.review, null)
  const steps = plan({ version: state.version, attached: state.attached, review: state.review, wanted: '893', build: state.build, notes: 'n' })
  const before = f.calls.length
  await apply({ api: f.api, version: state.version, steps, notes: 'n', essai: true })
  assert.equal(f.calls.length, before)
  await apply({ api: f.api, version: state.version, steps, notes: 'n' })
  const post = f.calls.find((c) => c.method === 'POST')
  assert.equal(post.path, '/v1/appStoreReviewDetails')
  assert.equal(post.body.data.relationships.appStoreVersion.data.id, 'v1')
})

test('arguments : relevé par défaut ; --preparer exige --build', () => {
  assert.deepEqual(parseArgs(['node', 's']), { prepare: false, buildNumber: null, essai: false })
  assert.deepEqual(parseArgs(['node', 's', '--preparer', '--build', '1180.1180', '--essai']), { prepare: true, buildNumber: '1180.1180', essai: true })
  assert.throws(() => parseArgs(['node', 's', '--preparer']), /--build/)
})
