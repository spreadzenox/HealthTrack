#!/usr/bin/env node
// Fiche App Store fr-FR (store/app-store/fr-FR) envoyée à App Store Connect par son API (I9, autorisation permanente du
// propriétaire : « mettre à jour la fiche App Store par l'API »). Ne touche qu'à une version encore « Prête à
// soumettre » : rien n'est publié ni soumis à l'examen (geste du propriétaire). Lancé par
// .github/workflows/store-push.yml avec la clé de l'environnement `appstore` (ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8),
// jamais affichée. `--dry-run` : montre ce qui serait envoyé, sans réseau ni clé. `--captures <dossier>` : envoie aussi
// les captures 6,9" de store/app-store/captures.md (branche captures/store), dans l'ordre du tableau, à la place des
// précédentes. `--captures-ipad <dossier>` : de même pour l'iPad 13" (section « iPad 13" » de captures.md, branche
// captures/store-ipad ; Nutrition y remplace Sources, choix du propriétaire du 2/11).
// Le numéro de cette version prend celui des builds (versionCode d'Android suivi, `upstream.json`), sauf quand une
// build y est attachée : c'est alors le choix du propriétaire, la version garde son numéro (2/11).
// Catégorie et classification par âge : store/app-store/classification.json.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash, sign } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const DIR = join(import.meta.dirname, '..', 'store', 'app-store', 'fr-FR')
const CAPTURES_MD = join(import.meta.dirname, '..', 'store', 'app-store', 'captures.md')
const UPSTREAM_JSON = join(import.meta.dirname, '..', 'upstream.json')
const TESTFLIGHT_VERSION_JSON = join(import.meta.dirname, '..', 'testflight-version.json')
const CLASSIFICATION_JSON = join(import.meta.dirname, '..', 'store', 'app-store', 'classification.json')
/** Captures 6,9" (1320 × 2868) : App Store Connect les reprend pour les iPhone plus petits. */
const DISPLAY_TYPE = 'APP_IPHONE_67'
/** Captures iPad 13" (2064 × 2752 ou 2048 × 2732) : exigées par Apple, l'app étant aussi pour iPad (« 1,2 »). */
export const IPAD_DISPLAY_TYPE = 'APP_IPAD_PRO_3GEN_129'
const API = 'https://api.appstoreconnect.apple.com'
const BUNDLE_ID = 'fr.jpesquet.sante'
const LOCALE = 'fr-FR'
const SITE = 'https://spreadzenox.github.io/HealthTrack-iOS'
export const PRIVACY_URL = `${SITE}/confidentialite/`
export const SUPPORT_URL = `${SITE}/assistance/`
/** États où App Store Connect laisse modifier la fiche d'une version. */
const EDITABLE = new Set(['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'])

const read = (name, dir = DIR) => readFileSync(join(dir, name), 'utf8').replace(/\n+$/, '')

/** Champs de la fiche : ceux de l'app (nom, sous-titre, confidentialité) et ceux de la version. */
export function fiche(dir = DIR) {
  return {
    info: { name: read('name.txt', dir), subtitle: read('subtitle.txt', dir), privacyPolicyUrl: PRIVACY_URL },
    version: {
      description: read('description.txt', dir),
      keywords: read('keywords.txt', dir),
      promotionalText: read('promotional-text.txt', dir),
      supportUrl: SUPPORT_URL,
    },
  }
}

/** Numéro de version fixe des builds de test pendant un cycle (testflight-version.json), ou null sans ce fichier. */
export function testflightVersion(path = TESTFLIGHT_VERSION_JSON) {
  if (!existsSync(path)) return null
  const n = JSON.parse(readFileSync(path, 'utf8'))?.version
  if (!Number.isInteger(n) || n <= 0) throw new Error('testflight-version.json : version absente ou invalide')
  return n
}

/**
 * Numéro de la version iOS, celui des builds envoyées sur TestFlight (CFBundleShortVersionString, testflight.yml) :
 * le numéro fixe du cycle (testflight-version.json, décision du propriétaire du 07/11 vers 19:35), sinon le versionCode
 * d'Android suivi (upstream.json). App Store Connect ne laisse choisir pour une version que des builds de même numéro :
 * la version « Prête à soumettre » le reprend.
 */
export function versionString(json = JSON.parse(readFileSync(UPSTREAM_JSON, 'utf8')), fixed = testflightVersion()) {
  const n = json?.versionCode
  if (!Number.isInteger(n) || n <= 0) throw new Error('upstream.json : versionCode absent ou invalide')
  return String(fixed ?? n)
}

/**
 * Catégorie et classification par âge (store/app-store/classification.json, expliquées dans le README) : Santé et
 * forme, 18 ans et plus comme sur Google Play.
 */
export function classification(path = CLASSIFICATION_JSON) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/**
 * Fichiers des captures de la fiche, dans l'ordre d'affichage : tableau iPhone 6,9" de store/app-store/captures.md, ou
 * (`device` = 'ipad') celui de sa section « ## iPad 13" ».
 */
export function captureFiles(md = readFileSync(CAPTURES_MD, 'utf8'), device = 'iphone') {
  const [iphone, ipad = ''] = md.split(/^## iPad\b.*$/m)
  return [...(device === 'ipad' ? ipad : iphone).matchAll(/^\|\s*\d+\s*\|\s*`([^`]+\.png)`\s*\|/gm)].map((m) => m[1])
}

/** Les captures listées, toutes présentes dans le dossier : une seule manquante (ou une liste vide) arrête tout. */
export function presentFiles(listed, dirFiles) {
  if (!listed.length) throw new Error('aucune capture listée dans captures.md')
  const missing = listed.filter((name) => !dirFiles.includes(name))
  if (missing.length) throw new Error(`capture absente : ${missing.join(', ')}`)
  return listed
}

/**
 * Numéro de la version : celui des builds (`wanted`), sauf si une build y est déjà attachée (choisie par le
 * propriétaire pour la soumission) : la renommer la détacherait. `followBuilds` (option `--version-des-builds`, pour
 * la build finale d'une soumission) renomme quand même : Apple n'attache une build qu'à la version du même numéro.
 */
export function versionPlan({ current, wanted, attachedBuild, followBuilds = false }) {
  if (current === wanted) return { rename: false, keep: current, reason: null }
  if (attachedBuild && !followBuilds) return { rename: false, keep: current, reason: `build ${attachedBuild} attachée` }
  return { rename: true, keep: wanted, reason: attachedBuild ? `build ${attachedBuild} à remplacer par une ${wanted}.x` : null }
}

/**
 * Build à attacher à la version (`--attacher-build`, décision du propriétaire du 05/11 vers 23:00) : la plus récente
 * build traitée par Apple (VALID, non expirée) dont le numéro commence par celui de la version (« 825.320 » pour 825).
 */
export function latestBuild(builds, versionNumber) {
  const ok = (builds ?? []).filter((b) => {
    const a = b?.attributes ?? {}
    return a.processingState === 'VALID' && !a.expired && String(a.version ?? '').startsWith(`${versionNumber}.`)
  })
  const rank = (b) => Number(String(b.attributes.version).split('.')[1]) || 0
  return ok.sort((x, y) => rank(y) - rank(x))[0] ?? null
}

/** Empreinte MD5 qu'App Store Connect vérifie à la fin de l'envoi d'une capture. */
export const md5 = (bytes) => createHash('md5').update(bytes).digest('hex')

/** Morceaux à envoyer, d'après les opérations rendues par App Store Connect pour une capture. */
export function slices(bytes, operations) {
  return (operations || []).map((op) => ({
    method: op.method,
    url: op.url,
    body: bytes.subarray(op.offset, op.offset + op.length),
    headers: Object.fromEntries((op.requestHeaders || []).map((h) => [h.name, h.value])),
  }))
}

/** Jeton de l'API App Store Connect (ES256, 20 minutes au plus). */
export function jwt({ keyId, issuerId, p8, now = Math.floor(Date.now() / 1000) }) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const input = `${b64({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.${b64({ iss: issuerId, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })}`
  const signature = sign('sha256', Buffer.from(input), { key: p8, dsaEncoding: 'ieee-p1363' })
  return `${input}.${signature.toString('base64url')}`
}

/** La version (ou les informations de l'app) encore modifiable, sinon undefined. */
export function editable(items) {
  return (items || []).find((it) => {
    const a = it?.attributes || {}
    return [a.appVersionState, a.appStoreState, a.state].some((s) => EDITABLE.has(s))
  })
}

async function api(token, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = res.status === 204 ? {} : await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = (json.errors || []).map((e) => `${e.title || ''} ${e.detail || ''}`.trim()).join(' ; ')
    throw new Error(`${method} ${path.split('?')[0]} : ${res.status} ${detail}`)
  }
  return json
}

/** Localisation fr-FR mise à jour, ou créée si la version ou l'app ne l'ont pas encore. */
async function upsertLocalization(token, { listPath, type, parentType, parentRel, parentId, attributes }) {
  const { data = [] } = await api(token, 'GET', `${listPath}?limit=50`)
  const found = data.find((l) => l.attributes?.locale === LOCALE)
  if (found) {
    await api(token, 'PATCH', `/v1/${type}/${found.id}`, { data: { type, id: found.id, attributes } })
    return { action: 'mise à jour', id: found.id }
  }
  const created = await api(token, 'POST', `/v1/${type}`, {
    data: { type, attributes: { locale: LOCALE, ...attributes }, relationships: { [parentRel]: { data: { type: parentType, id: parentId } } } },
  })
  return { action: 'créée', id: created.data?.id }
}

/**
 * État des captures chez Apple (`assetDeliveryState`) : traitées (COMPLETE), en cours (envoyées, pas encore
 * traitées), refusées (FAILED, avec la raison donnée par Apple).
 */
export function screenshotStates(items) {
  const out = { total: 0, complete: 0, pending: 0, failed: [] }
  for (const it of items || []) {
    const a = it?.attributes || {}
    const st = a.assetDeliveryState || {}
    out.total += 1
    if (st.state === 'COMPLETE') out.complete += 1
    else if (st.state === 'FAILED') {
      const why = (st.errors || []).map((e) => e.description || e.code).filter(Boolean).join(', ')
      out.failed.push(`${a.fileName || '?'} : ${why || 'refusée'}`)
    } else out.pending += 1
  }
  return out
}

/** Lit l'état des captures d'un format de la fiche ; attend jusqu'à `waitMs` que le traitement d'Apple se termine. */
async function screenshotReport(token, localizationId, { waitMs = 0, displayType = DISPLAY_TYPE } = {}) {
  const sets = await api(token, 'GET', `/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets?limit=50`)
  const set = (sets.data || []).find((x) => x.attributes?.screenshotDisplayType === displayType)
  if (!set) return null
  const until = Date.now() + waitMs
  for (;;) {
    const shots = await api(token, 'GET', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50&fields[appScreenshots]=fileName,assetDeliveryState`)
    const r = screenshotStates(shots.data)
    if (r.pending === 0 || Date.now() >= until) return r
    await new Promise((ok) => setTimeout(ok, 5000))
  }
}

/** Captures d'un format de la fiche remplacées par celles du dossier, dans l'ordre de captures.md. */
async function uploadScreenshots(token, localizationId, dir, { displayType = DISPLAY_TYPE, files = captureFiles() } = {}) {
  const sets = await api(token, 'GET', `/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets?limit=50`)
  let set = (sets.data || []).find((s) => s.attributes?.screenshotDisplayType === displayType)
  if (!set) {
    set = (await api(token, 'POST', '/v1/appScreenshotSets', {
      data: {
        type: 'appScreenshotSets', attributes: { screenshotDisplayType: displayType },
        relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: localizationId } } },
      },
    })).data
  }
  const old = await api(token, 'GET', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`)
  for (const shot of old.data || []) await api(token, 'DELETE', `/v1/appScreenshots/${shot.id}`)
  const ids = []
  for (const name of files) {
    const bytes = readFileSync(join(dir, name))
    const created = (await api(token, 'POST', '/v1/appScreenshots', {
      data: {
        type: 'appScreenshots', attributes: { fileName: name, fileSize: bytes.length },
        relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } },
      },
    })).data
    for (const part of slices(bytes, created.attributes?.uploadOperations)) {
      const res = await fetch(part.url, { method: part.method, headers: part.headers, body: part.body })
      if (!res.ok) throw new Error(`envoi de ${name} : ${res.status}`)
    }
    await api(token, 'PATCH', `/v1/appScreenshots/${created.id}`, {
      data: { type: 'appScreenshots', id: created.id, attributes: { uploaded: true, sourceFileChecksum: md5(bytes) } },
    })
    ids.push(created.id)
  }
  await api(token, 'PATCH', `/v1/appScreenshotSets/${set.id}/relationships/appScreenshots`, {
    data: ids.map((id) => ({ type: 'appScreenshots', id })),
  })
  return files.length
}

async function main() {
  const f = fiche()
  const sizes = (o) => Object.entries(o).map(([k, v]) => `${k} ${[...v].length} car.`).join(', ')
  console.log(`Fiche ${LOCALE} — app : ${sizes(f.info)}`)
  console.log(`Fiche ${LOCALE} — version : ${sizes(f.version)}`)
  const at = process.argv.indexOf('--captures')
  const capturesDir = at > 0 ? process.argv[at + 1] : null
  if (capturesDir || process.argv.includes('--dry-run')) console.log(`Captures (${DISPLAY_TYPE}) : ${captureFiles().join(', ')}`)
  const atIpad = process.argv.indexOf('--captures-ipad')
  const ipadDir = atIpad > 0 ? process.argv[atIpad + 1] : null
  const ipadFiles = ipadDir ? presentFiles(captureFiles(undefined, 'ipad'), readdirSync(ipadDir)) : null
  if (ipadFiles) console.log(`Captures (${IPAD_DISPLAY_TYPE}) : ${ipadFiles.join(', ')}`)
  const c = classification()
  console.log(`Catégorie : ${c.primaryCategory} ; âge : ${c.ageRating.ageRatingOverrideV2}`)
  const wanted = versionString()
  console.log(`Numéro de la version : ${wanted} (${testflightVersion() ? 'numéro fixe du cycle, testflight-version.json' : "versionCode d'Android suivi"}, comme les builds de TestFlight)`)
  if (process.argv.includes('--dry-run')) return

  for (const name of ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8']) {
    if (!process.env[name]) throw new Error(`secret ${name} absent de l'environnement appstore`)
  }
  const token = jwt({ keyId: process.env.ASC_KEY_ID, issuerId: process.env.ASC_ISSUER_ID, p8: process.env.ASC_KEY_P8 })

  const apps = await api(token, 'GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}&fields[apps]=bundleId,name`)
  const app = apps.data?.[0]
  if (!app) throw new Error(`aucune app ${BUNDLE_ID} dans App Store Connect`)

  const versions = await api(token, 'GET', `/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=20`)
  const version = editable(versions.data)
  if (!version) throw new Error('aucune version iOS « Prête à soumettre » : rien à modifier (version en examen ou en vente)')
  const attached = (await api(token, 'GET', `/v1/appStoreVersions/${version.id}/build?fields[builds]=version`)).data
  const followBuilds = process.argv.includes('--version-des-builds')
  const plan = versionPlan({ current: version.attributes?.versionString, wanted, attachedBuild: attached?.attributes?.version ?? null, followBuilds })
  if (plan.rename) {
    await api(token, 'PATCH', `/v1/appStoreVersions/${version.id}`, { data: { type: 'appStoreVersions', id: version.id, attributes: { versionString: wanted } } })
    console.log(`Version ${version.attributes?.versionString} renommée ${wanted}${plan.reason ? ` (${plan.reason}, à choisir par le propriétaire)` : ''}`)
    version.attributes = { ...version.attributes, versionString: wanted }
  } else if (plan.reason) {
    console.log(`Version ${plan.keep} gardée (${plan.reason}, choisie par le propriétaire) ; builds en ${wanted}`)
  }
  // Build finale (`--attacher-build`) : la plus récente build valide du numéro de la version, attachée à la version ;
  // jamais soumise ici (la soumission à l'examen reste le geste du propriétaire)
  if (process.argv.includes('--attacher-build')) {
    const number = version.attributes?.versionString
    const builds = await api(token, 'GET', `/v1/builds?filter[app]=${app.id}&filter[preReleaseVersion.version]=${number}&limit=50&fields[builds]=version,processingState,expired`)
    const build = latestBuild(builds.data, number)
    if (!build) {
      console.log(`::warning::aucune build ${number}.x traitée par Apple : rien d'attaché`)
    } else if (attached?.attributes?.version === build.attributes.version && !plan.rename) {
      console.log(`Build ${build.attributes.version} déjà attachée à la version ${number}`)
    } else {
      await api(token, 'PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, { data: { type: 'builds', id: build.id } })
      console.log(`Build ${build.attributes.version} attachée à la version ${number} (à soumettre par le propriétaire)`)
    }
  }
  const v = await upsertLocalization(token, {
    listPath: `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`,
    type: 'appStoreVersionLocalizations', parentType: 'appStoreVersions', parentRel: 'appStoreVersion', parentId: version.id,
    attributes: f.version,
  })
  console.log(`Version ${version.attributes?.versionString} : fiche ${LOCALE} ${v.action} (description, mots-clés, texte promotionnel, assistance)`)
  if (capturesDir) console.log(`Captures : ${await uploadScreenshots(token, v.id, capturesDir)} envoyées dans l'ordre de captures.md`)
  if (ipadFiles) console.log(`Captures iPad : ${await uploadScreenshots(token, v.id, ipadDir, { displayType: IPAD_DISPLAY_TYPE, files: ipadFiles })} envoyées dans l'ordre de captures.md`)
  // État relu à chaque envoi de la fiche, même sans nouvelles captures (celles d'Apple se traitent en différé)
  const ipad = await screenshotReport(token, v.id, { waitMs: ipadFiles ? 120000 : 0, displayType: IPAD_DISPLAY_TYPE })
  if (!ipad) console.log(`Captures (${IPAD_DISPLAY_TYPE}) : aucune dans la fiche`)
  else {
    console.log(`Captures (${IPAD_DISPLAY_TYPE}) chez Apple : ${ipad.complete}/${ipad.total} traitées, ${ipad.pending} en cours, ${ipad.failed.length} refusées`)
    if (ipad.failed.length) throw new Error(`captures iPad refusées par Apple : ${ipad.failed.join(' ; ')}`)
  }
  const shots = await screenshotReport(token, v.id, { waitMs: capturesDir ? 120000 : 0 })
  if (!shots) console.log(`Captures (${DISPLAY_TYPE}) : aucune dans la fiche`)
  else {
    console.log(`Captures (${DISPLAY_TYPE}) chez Apple : ${shots.complete}/${shots.total} traitées, ${shots.pending} en cours, ${shots.failed.length} refusées`)
    if (shots.failed.length) throw new Error(`captures refusées par Apple : ${shots.failed.join(' ; ')}`)
  }

  const infos = await api(token, 'GET', `/v1/apps/${app.id}/appInfos?limit=10`)
  const info = editable(infos.data)
  if (!info) throw new Error('aucune information d\'app modifiable (nom, sous-titre) : version en examen ou en vente')
  const i = await upsertLocalization(token, {
    listPath: `/v1/appInfos/${info.id}/appInfoLocalizations`,
    type: 'appInfoLocalizations', parentType: 'appInfos', parentRel: 'appInfo', parentId: info.id,
    attributes: f.info,
  })
  console.log(`App : nom, sous-titre et confidentialité ${LOCALE} ${i.action === 'créée' ? 'créés' : 'mis à jour'}`)

  await api(token, 'PATCH', `/v1/appInfos/${info.id}`, {
    data: { type: 'appInfos', id: info.id, relationships: { primaryCategory: { data: { type: 'appCategories', id: c.primaryCategory } } } },
  })
  const { data: rating } = await api(token, 'GET', `/v1/appInfos/${info.id}/ageRatingDeclaration`)
  if (!rating?.id) throw new Error('classification par âge introuvable dans App Store Connect')
  await api(token, 'PATCH', `/v1/ageRatingDeclarations/${rating.id}`, { data: { type: 'ageRatingDeclarations', id: rating.id, attributes: c.ageRating } })
  console.log(`App : catégorie ${c.primaryCategory}, classification par âge ${c.ageRating.ageRatingOverrideV2} (classification.json)`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.log(`::error::${e.message}`)
    process.exit(1)
  })
}
