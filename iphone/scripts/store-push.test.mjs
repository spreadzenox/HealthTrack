// Tests de scripts/store-push.mjs (node --test) : fiche lue depuis store/app-store/fr-FR, jeton signé ES256 que la
// clé publique vérifie, choix de la version et des localisations modifiables d'App Store Connect.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, createVerify } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fiche, jwt, editable, versionString, testflightVersion, classification, SUPPORT_URL, PRIVACY_URL } from './store-push.mjs'

test('fiche : textes de store/app-store/fr-FR et adresses du site', () => {
  const f = fiche()
  assert.equal(f.info.name, 'Halcya')
  assert.ok(f.info.subtitle.length > 0 && f.info.subtitle.length <= 30)
  assert.equal(f.info.privacyPolicyUrl, PRIVACY_URL)
  assert.ok(f.version.description.length > 1000 && f.version.description.length <= 4000)
  assert.ok(!f.version.description.endsWith('\n'))
  assert.ok(f.version.keywords.split(',').length > 3)
  assert.equal(f.version.supportUrl, SUPPORT_URL)
  assert.ok(f.version.promotionalText.length <= 170)
  assert.match(PRIVACY_URL, /^https:\/\/spreadzenox\.github\.io\/HealthTrack-iOS\/confidentialite\/$/)
  assert.match(SUPPORT_URL, /^https:\/\/spreadzenox\.github\.io\/HealthTrack-iOS\/assistance\/$/)
})

test('jwt : ES256, en-tête et charge attendus par App Store Connect, signature vérifiable', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' })
  const token = jwt({ keyId: 'ABC123', issuerId: 'iss-1', p8: pem, now: 1_000_000 })
  const [h, p, s] = token.split('.')
  const dec = (x) => JSON.parse(Buffer.from(x, 'base64url').toString())
  assert.deepEqual(dec(h), { alg: 'ES256', kid: 'ABC123', typ: 'JWT' })
  assert.deepEqual(dec(p), { iss: 'iss-1', iat: 1_000_000, exp: 1_000_000 + 1200, aud: 'appstoreconnect-v1' })
  const ok = createVerify('sha256').update(`${h}.${p}`).verify({ key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'))
  assert.equal(ok, true)
})

test('editable : la version ou la fiche encore en préparation, jamais celle en vente ou en examen', () => {
  const items = [
    { id: '1', attributes: { appStoreState: 'READY_FOR_SALE' } },
    { id: '2', attributes: { appVersionState: 'PREPARE_FOR_SUBMISSION' } },
  ]
  assert.equal(editable(items).id, '2')
  assert.equal(editable([{ id: '3', attributes: { state: 'PREPARE_FOR_SUBMISSION' } }]).id, '3')
  assert.equal(editable([{ id: '4', attributes: { appStoreState: 'WAITING_FOR_REVIEW' } }]), undefined)
  assert.equal(editable([]), undefined)
})

test('captures : les 8 fichiers du tableau de store/app-store/captures.md, dans l’ordre d’affichage', async () => {
  const { captureFiles } = await import('./store-push.mjs')
  const files = captureFiles()
  assert.equal(files.length, 8)
  assert.equal(files[0], 'iphone-17-pro-max-demo-clair-accueil.png')
  assert.equal(files[7], 'iphone-17-pro-max-demo-sombre-accueil.png')
  assert.ok(files.every((f) => /^iphone-17-pro-max-.+\.png$/.test(f)))
})

test('envoi d’une capture : morceaux selon les opérations d’Apple, empreinte MD5 du fichier', async () => {
  const { slices, md5 } = await import('./store-push.mjs')
  const bytes = Buffer.from('abcdefghij')
  const ops = [
    { method: 'PUT', url: 'https://u/1', offset: 0, length: 4, requestHeaders: [{ name: 'Content-Type', value: 'image/png' }] },
    { method: 'PUT', url: 'https://u/2', offset: 4, length: 6, requestHeaders: [] },
  ]
  const parts = slices(bytes, ops)
  assert.deepEqual(parts.map((p) => p.body.toString()), ['abcd', 'efghij'])
  assert.deepEqual(parts[0].headers, { 'Content-Type': 'image/png' })
  assert.equal(parts[1].url, 'https://u/2')
  assert.equal(md5(bytes), 'a925576942e94b2ef57a066101b48876')
})

test('versionString : numéro des builds envoyées, fixe pendant un cycle (décision du 07/11), sinon versionCode d’Android', () => {
  const fixed = JSON.parse(readFileSync(new URL('../testflight-version.json', import.meta.url), 'utf8')).version
  assert.equal(testflightVersion(), fixed)
  assert.equal(versionString(), String(fixed))
  assert.equal(versionString({ versionCode: 900 }, 893), '893')
  assert.equal(versionString({ versionCode: 648 }, null), '648')
  assert.equal(testflightVersion('/nulle/part/testflight-version.json'), null)
  assert.throws(() => versionString({}, null), /versionCode/)
  assert.throws(() => versionString({ versionCode: '1.0' }, null), /versionCode/)
})

test('classification : catégorie Santé et forme, 18 ans et plus comme sur Google Play, réponses valides pour Apple', () => {
  const c = classification()
  assert.equal(c.primaryCategory, 'HEALTH_AND_FITNESS')
  const a = c.ageRating
  assert.equal(a.ageRatingOverrideV2, 'EIGHTEEN_PLUS')
  assert.equal(a.healthOrWellnessTopics, true)
  // Relevé des cigarettes, réintroduction FODMAP et rapport pour le médecin : déclarés, au plus prudent.
  assert.equal(a.alcoholTobaccoOrDrugUseOrReferences, 'FREQUENT')
  assert.equal(a.medicalOrTreatmentInformation, 'FREQUENT')
  // Ni publicité, ni échanges entre personnes, ni contenu publié par d'autres : tout reste sur le téléphone.
  for (const k of ['advertising', 'messagingAndChat', 'socialMedia', 'userGeneratedContent', 'unrestrictedWebAccess', 'gambling', 'lootBox']) {
    assert.equal(a[k], false, k)
  }
  // Valeurs admises par l'API d'App Store Connect (AgeRatingDeclarationUpdateRequest, relevées le 31/10/2026).
  const LEVELS = ['NONE', 'INFREQUENT_OR_MILD', 'FREQUENT_OR_INTENSE', 'INFREQUENT', 'FREQUENT']
  const BOOLEANS = ['advertising', 'ageAssurance', 'gambling', 'healthOrWellnessTopics', 'lootBox', 'messagingAndChat',
    'parentalControls', 'socialMedia', 'socialMediaAgeRestricted', 'unrestrictedWebAccess', 'userGeneratedContent']
  const LEVELED = ['alcoholTobaccoOrDrugUseOrReferences', 'contests', 'gamblingSimulated', 'gunsOrOtherWeapons',
    'horrorOrFearThemes', 'matureOrSuggestiveThemes', 'medicalOrTreatmentInformation', 'profanityOrCrudeHumor',
    'sexualContentGraphicAndNudity', 'sexualContentOrNudity', 'violenceCartoonOrFantasy', 'violenceRealistic',
    'violenceRealisticProlongedGraphicOrSadistic']
  for (const k of BOOLEANS) assert.equal(typeof a[k], 'boolean', k)
  for (const k of LEVELED) assert.ok(LEVELS.includes(a[k]), k)
  assert.deepEqual(Object.keys(a).sort(), [...BOOLEANS, ...LEVELED, 'ageRatingOverrideV2'].sort())
})

test('état des captures chez Apple : traitées, en cours, refusées (avec la raison)', async () => {
  const { screenshotStates } = await import('./store-push.mjs')
  const shot = (fileName, state, errors) => ({ attributes: { fileName, assetDeliveryState: { state, errors } } })
  const r = screenshotStates([
    shot('a.png', 'COMPLETE'), shot('b.png', 'UPLOAD_COMPLETE'), shot('c.png', 'AWAITING_UPLOAD'),
    shot('d.png', 'FAILED', [{ code: 'IMAGE_TOO_LARGE', description: 'trop grande' }]), { attributes: {} },
  ])
  assert.deepEqual(r, { total: 5, complete: 1, pending: 3, failed: ['d.png : trop grande'] })
  assert.deepEqual(screenshotStates([]), { total: 0, complete: 0, pending: 0, failed: [] })
})

test('version : jamais renommée quand une build y est attachée (le propriétaire l\'a choisie)', async () => {
  const { versionPlan } = await import('./store-push.mjs')
  assert.deepEqual(versionPlan({ current: '717', wanted: '718', attachedBuild: '717.216' }), { rename: false, keep: '717', reason: 'build 717.216 attachée' })
  assert.deepEqual(versionPlan({ current: '717', wanted: '718', attachedBuild: null }), { rename: true, keep: '718', reason: null })
  assert.deepEqual(versionPlan({ current: '718', wanted: '718', attachedBuild: '718.220' }), { rename: false, keep: '718', reason: null })
  // Build finale d'une soumission (--version-des-builds) : renommée quand même, la nouvelle build est à choisir
  assert.deepEqual(versionPlan({ current: '717', wanted: '723', attachedBuild: '717.216', followBuilds: true }), { rename: true, keep: '723', reason: 'build 717.216 à remplacer par une 723.x' })
  assert.deepEqual(versionPlan({ current: '717', wanted: '723', attachedBuild: null, followBuilds: true }), { rename: true, keep: '723', reason: null })
})

test('captures iPad 13" : tableau de la section iPad de captures.md (Nutrition à la place de Sources), toutes présentes', async () => {
  const { presentFiles, captureFiles, IPAD_DISPLAY_TYPE } = await import('./store-push.mjs')
  assert.equal(IPAD_DISPLAY_TYPE, 'APP_IPAD_PRO_3GEN_129')
  const md = '| 1 | `iphone-a.png` | A |\n## iPad 13"\n| 1 | `ipad-a.png` | A |\n| 2 | `ipad-b.png` | B |\n'
  assert.deepEqual(captureFiles(md), ['iphone-a.png'])
  assert.deepEqual(captureFiles(md, 'ipad'), ['ipad-a.png', 'ipad-b.png'])
  assert.deepEqual(captureFiles('| 1 | `iphone-a.png` | A |\n', 'ipad'), [])
  const dir = ['ipad-b.png', 'ipad-a.png', 'ipad-console.txt']
  assert.deepEqual(presentFiles(['ipad-a.png', 'ipad-b.png'], dir), ['ipad-a.png', 'ipad-b.png'])
  assert.throws(() => presentFiles(['ipad-a.png', 'ipad-c.png'], dir), /ipad-c\.png/)
  assert.throws(() => presentFiles([], dir), /aucune capture/)
  const iphone = captureFiles()
  const ipad = captureFiles(undefined, 'ipad')
  assert.equal(iphone.length, 8)
  assert.equal(ipad.length, 8)
  assert.ok(ipad.every((f) => /^ipad-pro-13-inch-\(m5\)-.+\.png$/.test(f)))
  assert.ok(ipad.some((f) => f.endsWith('-demo-clair-nutrition.png')))
  assert.ok(!ipad.some((f) => f.includes('connectors')))
})

// 6/11, décision du propriétaire du 05/11 vers 23:00 (« renommez-la et donnez-lui la build finale ») : `--attacher-build`
// attache à la version la dernière build traitée par Apple du même numéro ; jamais une build d'un autre numéro, ni une
// build expirée ou encore en traitement
test('latestBuild : la plus récente build valide du numéro de la version, sinon rien', async () => {
  const { latestBuild } = await import('./store-push.mjs')
  const b = (id, version, processingState = 'VALID', expired = false) => ({ id, attributes: { version, processingState, expired } })
  const builds = [b('a', '825.318'), b('b', '825.320'), b('c', '825.319', 'PROCESSING'), b('d', '826.321'), b('e', '825.317', 'VALID', true)]
  assert.equal(latestBuild(builds, '825')?.id, 'b')
  assert.equal(latestBuild(builds, '826')?.id, 'd')
  assert.equal(latestBuild(builds, '827'), null)
  assert.equal(latestBuild([b('x', '825.9'), b('y', '825.10')], '825')?.id, 'y')
  assert.equal(latestBuild([b('z', '8250.1')], '825'), null)
})

