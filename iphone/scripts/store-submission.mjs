#!/usr/bin/env node
// Préparation de la soumission App Store de la refonte (retours du propriétaire du 18/11 : « oui go soumettre
// directement la refonte » ; mission PI2, partie 0 ; BACKLOG R18-SOUMISSION-a). Lancé par
// .github/workflows/ios-store-submission.yml (manuel, main, environnement `appstore`, clé jamais affichée).
//
// - Sans option : relevé seul (version iOS en préparation, numéro, état, build attachée, publication, notes pour
//   l'examen). Aucune écriture.
// - `--preparer --build <N>` (N = numéro de build, ex. 1180.1180) : (1) la version en préparation prend le numéro des
//   builds TestFlight (testflight-version.json, 893), seulement si elle est « Prepare for Submission » ; (2) la build N
//   est attachée, si elle porte ce numéro de version, est traitée par Apple, non expirée et distribuée au groupe
//   externe « Testeurs Halcya » ; (3) les notes pour l'examen deviennent le texte de store/app-store/notes-examen.md
//   (après le trait), sans compte de démonstration ; (4) publication manuelle (MANUAL).
// - `--essai` avec `--preparer` : le plan seul, rien n'est écrit.
//
// JAMAIS d'envoi à l'examen : aucune `reviewSubmissions` ni `subscriptionSubmissions`, aucun POST hors de la fiche
// d'examen (garde dans `submissionClient`). « Submit for Review » reste le geste du propriétaire.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { jwt, testflightVersion } from './store-push.mjs'
import { client } from './store-subscriptions.mjs'
import { BUNDLE_ID, GROUP_NAME, GROUP_FIELDS, masked, verdict } from './store-beta.mjs'

const NOTES_MD = join(import.meta.dirname, '..', 'store', 'app-store', 'notes-examen.md')
/** Limite d'App Store Connect pour « Notes » (App Review Information). */
export const NOTES_LIMIT = 4000
/** Seul état où l'on change le numéro, la build ou les notes d'une version. */
export const PREPARE = 'PREPARE_FOR_SUBMISSION'

/** Texte des notes : tout ce qui suit la première ligne « --- » de notes-examen.md (l'en-tête est pour le dépôt). */
export function reviewNotes(md = readFileSync(NOTES_MD, 'utf8')) {
  const parts = md.split(/^---\s*$/m)
  if (parts.length < 2) throw new Error('notes-examen.md : trait « --- » introuvable')
  const text = parts.slice(1).join('---').trim()
  if (!text) throw new Error('notes-examen.md : notes vides')
  if (text.length > NOTES_LIMIT) throw new Error(`notes-examen.md : ${text.length} caractères (limite ${NOTES_LIMIT})`)
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) throw new Error('notes-examen.md : une adresse e-mail dans les notes')
  return text
}

/** Client dont les seules écritures sont celles de la préparation ; tout envoi à l'examen est refusé. */
export function submissionClient(token, fetchImpl) {
  const { api, all } = client(token, fetchImpl)
  const keys = (body) => Object.keys(body?.data?.attributes || {}).sort().join()
  const check = (method, path, body) => {
    if (method === 'GET') return
    const p = path.split('?')[0]
    const ok = (method === 'PATCH' && /^\/v1\/appStoreVersions\/[^/]+$/.test(p) && body?.data?.type === 'appStoreVersions'
        && ['releaseType', 'versionString', 'releaseType,versionString'].includes(keys(body)) && !body.data.relationships)
      || (method === 'PATCH' && /^\/v1\/appStoreVersions\/[^/]+\/relationships\/build$/.test(p) && body?.data?.type === 'builds')
      || (method === 'PATCH' && /^\/v1\/appStoreReviewDetails\/[^/]+$/.test(p) && body?.data?.type === 'appStoreReviewDetails'
        && keys(body) === 'demoAccountRequired,notes')
      || (method === 'POST' && p === '/v1/appStoreReviewDetails' && body?.data?.type === 'appStoreReviewDetails'
        && keys(body) === 'demoAccountRequired,notes')
    if (!ok) throw new Error(`écriture interdite : ${method} ${p} (préparation seule, jamais d'envoi à l'examen)`)
  }
  return {
    api: async (method, path, body) => { check(method, path, body); return api(method, path, body) },
    all,
  }
}

async function maybe(read) {
  try {
    return await read()
  } catch (e) {
    if (e.status === 404) return null
    throw e
  }
}

const stateOf = (v) => v?.attributes?.appVersionState ?? v?.attributes?.appStoreState ?? null

/** La version iOS en préparation, ou une erreur claire (aucune, ou plusieurs). */
export function preparing(versions) {
  const found = (versions || []).filter((v) => stateOf(v) === PREPARE)
  if (found.length !== 1) {
    const seen = (versions || []).map((v) => `${v.attributes?.versionString} (${stateOf(v)})`).join(', ') || 'aucune'
    throw new Error(`version « Prepare for Submission » : ${found.length} trouvée(s) ; versions iOS : ${seen}`)
  }
  return found[0]
}

/** Raisons de refuser la build : rend [] si elle peut être attachée à la version `wanted`. */
export function buildProblems(build, wanted) {
  if (!build) return ['build introuvable']
  const out = []
  if (build.marketing !== wanted) out.push(`numéro de version ${build.marketing ?? '?'} au lieu de ${wanted}`)
  if (build.state !== 'VALID') out.push(`pas traitée par Apple (${build.state ?? '?'})`)
  if (build.expired) out.push('expirée')
  if (!build.inGroup) out.push(`absente du groupe externe « ${GROUP_NAME} »`)
  else if (verdict(build) !== 'test') out.push('pas encore validée pour les testeurs externes')
  return out
}

/** Ce que la préparation fera, d'après le relevé (fonction pure). */
export function plan({ version, attached, review, wanted, build, notes }) {
  const steps = []
  if (stateOf(version) !== PREPARE) throw new Error(`version ${version.attributes?.versionString} en ${stateOf(version)} : rien n'est modifié`)
  const problems = buildProblems(build, wanted)
  if (problems.length) throw new Error(`build ${build?.version ?? '?'} refusée : ${problems.join(' ; ')}`)
  const attrs = {}
  if (version.attributes?.versionString !== wanted) attrs.versionString = wanted
  if (version.attributes?.releaseType !== 'MANUAL') attrs.releaseType = 'MANUAL'
  if (Object.keys(attrs).length) steps.push({ what: 'version', attrs })
  if (attached !== build.version) steps.push({ what: 'build', id: build.id, version: build.version })
  const current = review?.attributes ?? null
  if (!current || current.notes !== notes || current.demoAccountRequired !== false) {
    steps.push({ what: 'notes', id: review?.id ?? null })
  }
  return steps
}

/** Relevé : l'app, la version en préparation, sa build et sa fiche d'examen, et la build demandée (si `--build`). */
export async function survey({ api, all }, { buildNumber = null } = {}) {
  const apps = await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}&fields[apps]=bundleId`)
  const app = (apps.data || [])[0]
  if (!app) throw new Error(`aucune app ${BUNDLE_ID} dans App Store Connect`)
  const versions = await all(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&fields[appStoreVersions]=versionString,appStoreState,appVersionState,releaseType&limit=20`)
  const version = versions.find((v) => stateOf(v) === PREPARE) ?? null
  let attached = null
  let review = null
  if (version) {
    attached = (await maybe(() => api('GET', `/v1/appStoreVersions/${version.id}/build?fields[builds]=version`)))?.data?.attributes?.version ?? null
    review = (await maybe(() => api('GET', `/v1/appStoreVersions/${version.id}/appStoreReviewDetail`)))?.data ?? null
  }
  let build = null
  if (buildNumber) {
    const page = await api('GET', `/v1/builds?filter[app]=${app.id}&filter[version]=${encodeURIComponent(buildNumber)}&limit=5`
      + '&fields[builds]=version,processingState,expired,preReleaseVersion,buildBetaDetail,betaAppReviewSubmission'
      + '&include=preReleaseVersion,buildBetaDetail,betaAppReviewSubmission&fields[preReleaseVersions]=version'
      + '&fields[buildBetaDetails]=externalBuildState&fields[betaAppReviewSubmissions]=betaReviewState')
    const b = (page.data || []).find((x) => x.attributes?.version === buildNumber)
    if (b) {
      const included = new Map((page.included || []).map((x) => [`${x.type}/${x.id}`, x]))
      const rel = (name) => {
        const d = b.relationships?.[name]?.data
        return d ? included.get(`${d.type}/${d.id}`) : null
      }
      const groups = await all(`/v1/apps/${app.id}/betaGroups?fields[betaGroups]=${GROUP_FIELDS}&limit=50`)
      const group = groups.find((g) => g.attributes?.name === GROUP_NAME && !g.attributes?.isInternalGroup)
      const inGroup = group
        ? (await all(`/v1/betaGroups/${group.id}/builds?fields[builds]=version&limit=200`)).some((x) => x.id === b.id)
        : false
      build = {
        id: b.id,
        version: b.attributes.version,
        marketing: rel('preReleaseVersion')?.attributes?.version ?? null,
        state: b.attributes?.processingState ?? null,
        expired: Boolean(b.attributes?.expired),
        review: rel('betaAppReviewSubmission')?.attributes?.betaReviewState ?? null,
        external: rel('buildBetaDetail')?.attributes?.externalBuildState ?? null,
        inGroup,
      }
    }
  }
  return { app, versions, version, attached, review, build }
}

/** Lignes du relevé, sans rien de secret. */
export function report({ versions, version, attached, review, build }, notes) {
  const lines = [`Versions iOS : ${versions.map((v) => `${v.attributes?.versionString} (${stateOf(v)})`).join(', ') || 'aucune'}`]
  if (!version) lines.push('Aucune version « Prepare for Submission ».')
  else {
    lines.push(`En préparation : ${version.attributes?.versionString} ; publication ${version.attributes?.releaseType ?? '?'} ; build attachée ${attached ?? 'aucune'}`)
    const n = review?.attributes?.notes ?? ''
    lines.push(`Notes pour l'examen : ${n.length} caractères ; ${n === notes ? 'identiques à notes-examen.md' : 'différentes de notes-examen.md'} ; compte de démonstration ${review?.attributes?.demoAccountRequired === false ? 'non requis' : String(review?.attributes?.demoAccountRequired ?? '?')}`)
  }
  if (build) lines.push(`Build ${build.version} : version ${build.marketing ?? '?'}, ${build.state ?? '?'}${build.expired ? ', expirée' : ''}, groupe externe ${build.inGroup ? 'oui' : 'non'}, examen bêta ${build.review ?? '—'}, externe ${build.external ?? '—'}`)
  return lines
}

/** Applique le plan (sauf `essai`). */
export async function apply({ api, version, steps, notes, essai = false, log = () => {} }) {
  for (const s of steps) {
    if (s.what === 'version') {
      log(`${essai ? 'Essai : ' : ''}version ${version.attributes?.versionString} → ${JSON.stringify(s.attrs)}`)
      if (!essai) await api('PATCH', `/v1/appStoreVersions/${version.id}`, { data: { type: 'appStoreVersions', id: version.id, attributes: s.attrs } })
    } else if (s.what === 'build') {
      log(`${essai ? 'Essai : ' : ''}build ${s.version} attachée`)
      if (!essai) await api('PATCH', `/v1/appStoreVersions/${version.id}/relationships/build`, { data: { type: 'builds', id: s.id } })
    } else if (s.what === 'notes') {
      log(`${essai ? 'Essai : ' : ''}notes pour l'examen remplacées (${notes.length} caractères), compte de démonstration non requis`)
      if (essai) continue
      const attributes = { notes, demoAccountRequired: false }
      if (s.id) await api('PATCH', `/v1/appStoreReviewDetails/${s.id}`, { data: { type: 'appStoreReviewDetails', id: s.id, attributes } })
      else {
        await api('POST', '/v1/appStoreReviewDetails', {
          data: { type: 'appStoreReviewDetails', attributes, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } } },
        })
      }
    }
  }
}

export function parseArgs(argv) {
  const at = argv.indexOf('--build')
  const buildNumber = at > 0 ? (argv[at + 1] || '').trim() : null
  const prepare = argv.includes('--preparer')
  if (prepare && !/^\d+(\.\d+)*$/.test(buildNumber || '')) throw new Error('--preparer demande --build <numéro> (ex. 1180.1180)')
  return { prepare, buildNumber: buildNumber || null, essai: argv.includes('--essai') }
}

async function main() {
  const log = (line) => console.log(masked(line))
  const opts = parseArgs(process.argv)
  const notes = reviewNotes()
  const wanted = String(testflightVersion())
  for (const name of ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8']) {
    if (!process.env[name]) throw new Error(`secret ${name} absent de l'environnement appstore`)
  }
  const token = jwt({ keyId: process.env.ASC_KEY_ID, issuerId: process.env.ASC_ISSUER_ID, p8: process.env.ASC_KEY_P8 })
  const { api, all } = submissionClient(token)
  const state = await survey({ api, all }, { buildNumber: opts.buildNumber })
  for (const l of report(state, notes)) log(l)
  if (!opts.prepare) {
    log('Relevé seul : rien n\'a été modifié ni soumis.')
    return
  }
  const version = preparing(state.versions)
  const steps = plan({ version, attached: state.attached, review: state.review, wanted, build: state.build, notes })
  if (!steps.length) log('Déjà prête : rien à changer.')
  await apply({ api, version, steps, notes, essai: opts.essai, log })
  if (!opts.essai && steps.length) {
    const after = await survey({ api, all }, { buildNumber: opts.buildNumber })
    log('Relevé après :')
    for (const l of report(after, notes)) log(l)
  }
  log('Rien n\'a été soumis à l\'examen : « Submit for Review » reste le geste du propriétaire.')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.log(`::error::${masked(e.message)}`)
    process.exit(1)
  })
}
