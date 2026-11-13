#!/usr/bin/env node
// Examen bêta d'Apple, chaque nuit (message du propriétaire du 07/11 vers 18:30, inscrit dans la consigne de la
// routine) : après la dernière version d'Android de la journée, la dernière build TestFlight traitée par Apple est
// ajoutée au groupe externe « Testeurs Halcya » et soumise à l'examen bêta. JAMAIS la version de l'App Store : aucun
// chemin `appStoreVersions`, `reviewSubmissions` ni `appStoreVersionSubmissions` n'est appelé (garde dans `guarded`).
//
// Étapes, chacune sautée si elle est déjà faite (relancer ne refait rien) :
// 1. la build : la plus récente traitée (`VALID`, non expirée), ou celle passée en argument (`--build 871.370`) ;
// 2. « À tester » en français (`betaBuildLocalizations`, texte de store/app-store/fr-FR/testflight-a-tester.txt) ;
// 3. la build dans le groupe externe ;
// 4. la soumission à l'examen bêta (`betaAppReviewSubmissions`).
// Le dépôt et les journaux sont publics : le lien public du groupe n'est jamais lu, toute adresse TestFlight est masquée.
// Lancé par .github/workflows/store-beta-submit.yml avec la clé de l'environnement `appstore`, jamais affichée.
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { jwt } from './store-push.mjs'
import { client } from './store-subscriptions.mjs'
import { BUNDLE_ID, GROUP_NAME, GROUP_FIELDS, masked } from './store-beta.mjs'

export const WHATS_NEW_FILE = new URL('../store/app-store/fr-FR/testflight-a-tester.txt', import.meta.url)
export const LOCALE = 'fr-FR'
/** Limite d'Apple pour « À tester » (`whatsNew`). */
export const WHATS_NEW_MAX = 4000
/** Ce que ce script ne touche jamais : la version de l'App Store et sa soumission restent au propriétaire. */
export const FORBIDDEN_SEGMENTS = new Set([
  'appStoreVersions', 'appStoreVersion', 'appStoreVersionSubmissions', 'appStoreVersionSubmission',
  'reviewSubmissions', 'reviewSubmission', 'reviewSubmissionItems',
])
/** Vrai si le chemin touche la version de l'App Store ou sa soumission (l'examen bêta, lui, est permis). */
export const isForbidden = (path) => path.split('?')[0].split('/').some((seg) => FORBIDDEN_SEGMENTS.has(seg))

/** Client qui refuse tout chemin de la version de l'App Store, quelle que soit la méthode. */
export function guarded(token, fetchImpl) {
  const { api, all } = client(token, fetchImpl)
  const check = (path) => {
    if (isForbidden(path)) throw new Error(`chemin interdit (version de l'App Store) : ${path.split('?')[0]}`)
  }
  return {
    api: async (method, path, body) => { check(path); return api(method, path, body) },
    all: async (path) => { check(path); return all(path) },
  }
}

export function readWhatsNew(file = WHATS_NEW_FILE) {
  const text = readFileSync(file, 'utf8').trim()
  if (!text) throw new Error('« À tester » vide')
  if (text.length > WHATS_NEW_MAX) throw new Error(`« À tester » : ${text.length} caractères pour ${WHATS_NEW_MAX} au plus`)
  if (/https?:\/\/testflight\.apple\.com/i.test(text)) throw new Error('« À tester » ne doit contenir aucun lien TestFlight')
  return text
}

const rank = (v) => String(v).split('.').map(Number)
const newer = (x, y) => {
  const [a1, a2 = 0] = rank(x)
  const [b1, b2 = 0] = rank(y)
  return a1 - b1 || a2 - b2
}

/** La build à soumettre : celle demandée, sinon la plus récente traitée et non expirée. */
export function pickBuild(builds, wanted = null) {
  const list = builds.map((b) => ({ id: b.id, version: b.attributes?.version, state: b.attributes?.processingState, expired: Boolean(b.attributes?.expired) }))
  if (wanted) return list.find((b) => b.version === wanted) ?? null
  return list.filter((b) => b.state === 'VALID' && !b.expired).sort((x, y) => newer(y.version, x.version))[0] ?? null
}

async function maybe(read) {
  try {
    return await read()
  } catch (e) {
    if (e.status === 404) return null
    throw e
  }
}

/**
 * Ajoute la build au groupe externe et la soumet à l'examen bêta. Rend `{ build, done }` : `done` liste les étapes
 * faites par ce passage (vide si tout l'était déjà) ; `build` est null si aucune build n'est prête.
 */
export async function submitForBetaReview({ token, fetchImpl = fetch, whatsNew, wanted = null, log = () => {} }) {
  const { api, all } = guarded(token, fetchImpl)
  const done = []
  const apps = await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}&fields[apps]=bundleId`)
  const app = (apps.data || [])[0]
  if (!app) throw new Error(`aucune app ${BUNDLE_ID} dans App Store Connect`)
  const groups = await all(`/v1/apps/${app.id}/betaGroups?fields[betaGroups]=${GROUP_FIELDS}&limit=50`)
  const group = groups.find((g) => g.attributes?.name === GROUP_NAME && !g.attributes?.isInternalGroup)
  if (!group) throw new Error(`groupe externe « ${GROUP_NAME} » introuvable`)

  const recent = await api('GET', `/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=20&fields[builds]=version,processingState,expired,uploadedDate,usesNonExemptEncryption`)
  const build = pickBuild(recent.data || [], wanted)
  if (!build) {
    log(wanted ? `Build ${wanted} introuvable parmi les 20 dernières.` : 'Aucune build traitée par Apple : rien à soumettre pour l\'instant.')
    return { build: null, done }
  }
  if (build.state !== 'VALID') {
    log(`Build ${build.version} pas encore traitée par Apple (${build.state}) : à refaire au run suivant.`)
    return { build: null, done }
  }
  log(`Build ${build.version} (traitée par Apple).`)

  const locs = await api('GET', `/v1/builds/${build.id}/betaBuildLocalizations?fields[betaBuildLocalizations]=locale,whatsNew`)
  const fr = (locs.data || []).find((l) => l.attributes?.locale === LOCALE)
  if (!fr) {
    await api('POST', '/v1/betaBuildLocalizations', {
      data: { type: 'betaBuildLocalizations', attributes: { locale: LOCALE, whatsNew }, relationships: { build: { data: { type: 'builds', id: build.id } } } },
    })
    done.push('à tester')
    log('« À tester » (fr-FR) écrit.')
  } else if (!fr.attributes?.whatsNew) {
    await api('PATCH', `/v1/betaBuildLocalizations/${fr.id}`, { data: { type: 'betaBuildLocalizations', id: fr.id, attributes: { whatsNew } } })
    done.push('à tester')
    log('« À tester » (fr-FR) complété.')
  } else {
    log('« À tester » (fr-FR) déjà là, gardé.')
  }

  // Apple refuse la lecture de /v1/builds/{id}/betaGroups (403, 07/11) : on lit les builds du groupe, comme le relevé
  const groupBuilds = await all(`/v1/betaGroups/${group.id}/builds?fields[builds]=version&limit=200`)
  if (!groupBuilds.some((b) => b.id === build.id)) {
    await api('POST', `/v1/betaGroups/${group.id}/relationships/builds`, { data: [{ type: 'builds', id: build.id }] })
    done.push('groupe')
    log(`Ajoutée au groupe externe « ${GROUP_NAME} ».`)
  } else {
    log(`Déjà dans le groupe externe « ${GROUP_NAME} ».`)
  }

  const review = await maybe(() => api('GET', `/v1/builds/${build.id}/betaAppReviewSubmission?fields[betaAppReviewSubmissions]=betaReviewState`))
  const state = review?.data?.attributes?.betaReviewState
  if (state) {
    log(`Déjà soumise à l'examen bêta (${state}).`)
  } else {
    await api('POST', '/v1/betaAppReviewSubmissions', {
      data: { type: 'betaAppReviewSubmissions', relationships: { build: { data: { type: 'builds', id: build.id } } } },
    })
    done.push('examen bêta')
    log('Soumise à l\'examen bêta d\'Apple.')
  }
  return { build, done }
}

async function main() {
  const log = (line) => console.log(masked(line))
  const whatsNew = readWhatsNew()
  if (process.argv.includes('--dry-run')) {
    log(`« À tester » : ${whatsNew.length}/${WHATS_NEW_MAX} caractères. Essai à blanc : rien envoyé.`)
    return
  }
  for (const name of ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8']) {
    if (!process.env[name]) throw new Error(`secret ${name} absent de l'environnement appstore`)
  }
  const i = process.argv.indexOf('--build')
  const wanted = i > 0 ? process.argv[i + 1] || null : null
  const token = jwt({ keyId: process.env.ASC_KEY_ID, issuerId: process.env.ASC_ISSUER_ID, p8: process.env.ASC_KEY_P8 })
  const { build, done } = await submitForBetaReview({ token, whatsNew, wanted, log })
  log(build ? `Bilan : ${build.version} — ${done.length ? `fait : ${done.join(', ')}` : 'rien à faire, tout était fait'}.` : 'Bilan : aucune build soumise.')
  log('La version de l\'App Store n\'a pas été touchée.')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.log(`::error::${masked(e.message)}`)
    process.exit(1)
  })
}
