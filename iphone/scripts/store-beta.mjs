#!/usr/bin/env node
// Examen bêta d'Apple (TestFlight externe) : relevé en LECTURE SEULE de l'état des builds du groupe externe
// « Testeurs Halcya » (décision du propriétaire du 06/11 vers 18:20 : « relève à chaque run l'état de l'examen bêta…
// ne soumets rien et ne change rien dans App Store Connect »). Que des GET : rien n'est écrit chez Apple.
//
// Le dépôt et les journaux des workflows sont publics : le lien public du groupe n'est jamais demandé
// (`GROUP_FIELDS` sans `publicLink`) et toute adresse TestFlight qui passerait quand même est masquée à l'affichage.
// Le motif d'un refus n'est pas exposé par l'API (Apple l'écrit dans App Store Connect → TestFlight et par e-mail) :
// le relevé le dit au lieu de l'inventer. Lancé par .github/workflows/store-beta.yml avec la clé de l'environnement
// `appstore`, jamais affichée.
import { pathToFileURL } from 'node:url'
import { jwt } from './store-push.mjs'
import { client } from './store-subscriptions.mjs'

export const BUNDLE_ID = 'fr.jpesquet.sante'
export const GROUP_NAME = 'Testeurs Halcya'
/** Champs lus pour les groupes : jamais `publicLink` (dépôt public). */
export const GROUP_FIELDS = 'name,isInternalGroup,publicLinkEnabled'

const REVIEW = {
  WAITING_FOR_REVIEW: "en attente de l'examen bêta",
  IN_REVIEW: "en cours d'examen bêta",
  APPROVED: 'acceptée par Apple',
  REJECTED: 'refusée par Apple',
}

/** « test » (lien public utilisable), « refusée », « expirée » ou « attente », d'après les deux états d'Apple. */
export function verdict({ review, external }) {
  if (review === 'REJECTED' || external === 'BETA_REJECTED') return 'refusée'
  if (external === 'EXPIRED') return 'expirée'
  if (review === 'APPROVED' || ['BETA_APPROVED', 'IN_BETA_TESTING', 'READY_FOR_BETA_TESTING'].includes(external)) return 'test'
  return 'attente'
}

export function describe(build) {
  const v = verdict(build)
  const said = v === 'test' ? 'en test (lien public utilisable)'
    : v === 'refusée' ? "refusée par Apple (motif : pas lisible par l'API, voir App Store Connect → TestFlight ou l'e-mail d'Apple)"
      : v === 'expirée' ? 'expirée'
        : REVIEW[build.review] ?? "en attente de l'examen bêta"
  return `${build.version} : ${said} [examen ${build.review ?? '—'}, TestFlight externe ${build.external ?? '—'}]`
}

export function masked(line) {
  return String(line).replace(/https?:\/\/testflight\.apple\.com\/\S*/g, '[lien TestFlight masqué]')
}

async function maybe(read) {
  try {
    return await read()
  } catch (e) {
    if (e.status === 404) return null
    throw e
  }
}

/** Le groupe externe et ses builds (de la plus récente à la plus ancienne) avec leurs deux états d'examen. */
export async function survey({ token, fetchImpl = fetch }) {
  const { api, all } = client(token, fetchImpl)
  const apps = await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}&fields[apps]=bundleId`)
  const app = (apps.data || [])[0]
  if (!app) throw new Error(`aucune app ${BUNDLE_ID} dans App Store Connect`)
  const groups = await all(`/v1/apps/${app.id}/betaGroups?fields[betaGroups]=${GROUP_FIELDS}&limit=50`)
  const found = groups.find((g) => g.attributes?.name === GROUP_NAME && !g.attributes?.isInternalGroup)
  if (!found) throw new Error(`groupe externe « ${GROUP_NAME} » introuvable`)
  const group = { id: found.id, name: found.attributes.name, publicLinkEnabled: Boolean(found.attributes.publicLinkEnabled) }
  const raw = await all(`/v1/betaGroups/${group.id}/builds?fields[builds]=version,expired,processingState&limit=50`)
  const builds = []
  for (const b of raw) {
    const review = await maybe(() => api('GET', `/v1/builds/${b.id}/betaAppReviewSubmission?fields[betaAppReviewSubmissions]=betaReviewState`))
    const detail = await maybe(() => api('GET', `/v1/builds/${b.id}/buildBetaDetail?fields[buildBetaDetails]=externalBuildState`))
    builds.push({
      version: b.attributes?.version ?? '?',
      review: review?.data?.attributes?.betaReviewState ?? null,
      external: detail?.data?.attributes?.externalBuildState ?? null,
    })
  }
  const rank = (v) => String(v).split('.').map(Number)
  builds.sort((x, y) => {
    const [a1, a2] = rank(x.version)
    const [b1, b2] = rank(y.version)
    return b1 - a1 || b2 - a2
  })
  return { group, builds, appId: app.id }
}

/**
 * Builds récentes de l'app en examen bêta hors du groupe externe (8/11 : la 896.376, retirée du groupe, bloquait encore
 * la 918.396 : « Another build in the same train is already in beta review »). Que des GET.
 */
export async function reviewsOutsideGroup({ token, fetchImpl = fetch, appId, inGroup = [] }) {
  const { api } = client(token, fetchImpl)
  // 9/11 : demandé à Apple par l'état d'examen, sans limite d'âge (les 20 builds les plus récentes ne suffisaient plus :
  // la 896.376 en était sortie et le relevé disait « aucune » à tort)
  const out = []
  for (const state of ['WAITING_FOR_REVIEW', 'IN_REVIEW']) {
    const found = await api('GET', `/v1/builds?filter[app]=${appId}&filter[betaAppReviewSubmission.betaReviewState]=${state}&limit=50&fields[builds]=version`)
    for (const b of found.data || []) {
      const version = b.attributes?.version
      if (version && !inGroup.includes(version)) out.push({ version, review: state })
    }
  }
  return out
}

async function main() {
  const log = (line) => console.log(masked(line))
  for (const name of ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8']) {
    if (!process.env[name]) throw new Error(`secret ${name} absent de l'environnement appstore`)
  }
  const token = jwt({ keyId: process.env.ASC_KEY_ID, issuerId: process.env.ASC_ISSUER_ID, p8: process.env.ASC_KEY_P8 })
  const { group, builds, appId } = await survey({ token })
  log(`Groupe externe « ${group.name} » : lien public ${group.publicLinkEnabled ? 'activé' : 'désactivé'} (adresse jamais lue ici) ; ${builds.length} build(s)`)
  for (const b of builds) log(`- ${describe(b)}`)
  const by = (v) => builds.filter((b) => verdict(b) === v).map((b) => b.version)
  log(`Verdict : en test ${by('test').join(', ') || 'aucune'} ; refusées ${by('refusée').join(', ') || 'aucune'} ; en attente ${by('attente').join(', ') || 'aucune'}`)
  const outside = await reviewsOutsideGroup({ token, appId, inGroup: builds.map((b) => b.version) })
  log(`Hors du groupe, en examen bêta : ${outside.map((b) => `${b.version} (${b.review})`).join(', ') || 'aucune'}`)
  log('Lecture seule : rien n\'a été soumis ni changé dans App Store Connect.')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.log(`::error::${masked(e.message)}`)
    process.exit(1)
  })
}
