#!/usr/bin/env node
// Livraison continue sur TestFlight (décision du propriétaire du 09/11 vers 11:00, `POUR-IOS.md` de HealthTrack à
// 11:05) : « la routine doit expirer les versions précédentes à chaque fois qu'une nouvelle version arrive ; le but
// c'est de faire du continuous deployment le plus propre possible et rapide ».
//
// Deux usages, lancés par .github/workflows/store-beta-expire.yml (environnement `appstore`, clé jamais affichée) :
// - `--builds 896.376[,…]` : expire les builds nommées (réponse « expire la 896 » ; une build en examen bêta depuis
//   plus de 24 h quand une plus récente est prête) ;
// - `--nettoyage` : à chaque nouvelle build sur TestFlight, expire celles qui ne servent plus. Restent : la build
//   attachée à la version de l'App Store (soumission du propriétaire, 844.344), la dernière build distribuée au groupe
//   externe (les testeurs ont toujours une version installable, jusqu'à ce que sa remplaçante le soit), toute build en
//   examen bêta, toute build du groupe externe pas encore soumise et plus récente que la distribuée, toute build pas
//   encore traitée par Apple et la plus récente (la prochaine à soumettre).
// `--essai` : le plan seul, rien n'est expiré.
//
// Seule écriture permise : `PATCH /v1/builds/{id}` avec `expired: true` (garde dans `expiryClient`). La version de
// l'App Store est seulement lue, pour connaître sa build. La 844.344 n'est jamais expirée, quoi qu'on demande.
import { pathToFileURL } from 'node:url'
import { jwt } from './store-push.mjs'
import { client } from './store-subscriptions.mjs'
import { BUNDLE_ID, GROUP_NAME, GROUP_FIELDS, masked, verdict } from './store-beta.mjs'

/** Jamais expirées, même demandées : la build de la soumission du propriétaire (décisions du 06/11 et du 09/11). */
export const PROTECTED = new Set(['844.344'])
export const IN_REVIEW = new Set(['WAITING_FOR_REVIEW', 'IN_REVIEW'])
/** Au-delà, une build en examen bêta peut céder la place à une plus récente (règle du propriétaire du 09/11). */
export const STALE_REVIEW_HOURS = 24

/** Client dont la seule écriture est l'expiration d'une build ; tout le reste est lu. */
export function expiryClient(token, fetchImpl) {
  const { api, all } = client(token, fetchImpl)
  const check = (method, path, body) => {
    if (method === 'GET') return
    const ok = method === 'PATCH' && /^\/v1\/builds\/[^/?]+$/.test(path)
      && body?.data?.type === 'builds' && Object.keys(body.data.attributes || {}).join() === 'expired' && body.data.attributes.expired === true
    if (!ok) throw new Error(`écriture interdite : ${method} ${path.split('?')[0]} (seule l'expiration d'une build est permise)`)
  }
  return {
    api: async (method, path, body) => { check(method, path, body); return api(method, path, body) },
    all,
  }
}

const rank = (v) => String(v).split('.').map(Number)
const desc = (x, y) => {
  const [a1, a2 = 0] = rank(x.version)
  const [b1, b2 = 0] = rank(y.version)
  return b1 - a1 || b2 - a2
}

/** Builds d'une page de `/v1/builds` (avec examen bêta et état externe inclus). */
export function fromPage(page, groupIds = new Set()) {
  const included = new Map((page?.included || []).map((x) => [`${x.type}/${x.id}`, x]))
  const rel = (b, name) => {
    const d = b.relationships?.[name]?.data
    return d ? included.get(`${d.type}/${d.id}`) : null
  }
  return (page?.data || []).map((b) => {
    const review = rel(b, 'betaAppReviewSubmission')
    return {
      id: b.id,
      version: b.attributes?.version ?? '?',
      state: b.attributes?.processingState ?? null,
      expired: Boolean(b.attributes?.expired),
      review: review?.attributes?.betaReviewState ?? null,
      submitted: review?.attributes?.submittedDate ?? null,
      external: rel(b, 'buildBetaDetail')?.attributes?.externalBuildState ?? null,
      inGroup: groupIds.has(b.id),
    }
  })
}

/** La dernière build distribuée au groupe externe (celle que les testeurs peuvent installer). */
export function distributed(builds) {
  return builds.filter((b) => !b.expired && b.inGroup && verdict(b) === 'test').sort(desc)[0] ?? null
}

/** Ce qu'on garde et pourquoi, ce qu'on expire (`--nettoyage`). */
export function cleanupPlan({ builds, attached = [] }) {
  const live = builds.filter((b) => !b.expired)
  const keep = new Map()
  const add = (b, why) => { if (b && !keep.has(b.version)) keep.set(b.version, why) }
  for (const b of live) if (PROTECTED.has(b.version) || attached.includes(b.version)) add(b, 'version de l’App Store (soumission du propriétaire)')
  const last = distributed(live)
  add(last, 'dernière build distribuée au groupe externe')
  for (const b of live) if (IN_REVIEW.has(b.review)) add(b, 'en examen bêta')
  // Dans le groupe externe sans examen encore (ajoutée, pas soumise : la 918.396 le 9/11) : la prochaine soumission
  for (const b of live) if (b.inGroup && !b.review && b.state === 'VALID' && (!last || desc(b, last) < 0)) add(b, 'dans le groupe externe, à soumettre')
  for (const b of live) if (b.state !== 'VALID') add(b, 'pas encore traitée par Apple')
  add(live.filter((b) => b.state === 'VALID').sort(desc)[0], 'la plus récente')
  return {
    keep: [...keep].map(([version, why]) => ({ version, why })),
    expire: live.filter((b) => !keep.has(b.version)).sort(desc),
  }
}

/** Builds nommées (`--builds`) : refus de la build de l'App Store et de la dernière distribuée aux testeurs. */
export function namedPlan({ builds, wanted, attached = [] }) {
  const last = distributed(builds)
  const expire = []
  const refused = []
  for (const v of wanted) {
    const b = builds.find((x) => x.version === v)
    if (PROTECTED.has(v) || attached.includes(v)) refused.push({ version: v, why: 'version de l’App Store (soumission du propriétaire)' })
    else if (!b) refused.push({ version: v, why: 'introuvable parmi les builds non expirées' })
    else if (last && last.version === v) refused.push({ version: v, why: 'dernière build distribuée au groupe externe' })
    else expire.push(b)
  }
  return { expire, refused }
}

/** Builds en examen bêta depuis plus de `STALE_REVIEW_HOURS` (soumission quotidienne : une plus récente peut passer). */
export function staleReviews(builds, now = new Date()) {
  return builds
    .filter((b) => !b.expired && IN_REVIEW.has(b.review) && b.submitted)
    .map((b) => ({ ...b, hours: Math.floor((now - new Date(b.submitted)) / 3_600_000) }))
    .filter((b) => b.hours >= STALE_REVIEW_HOURS)
}

/** Tout ce qu'il faut savoir : l'app, les builds non expirées, le groupe externe, la build de l'App Store. */
export async function collect({ api, all }) {
  const apps = await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}&fields[apps]=bundleId`)
  const app = (apps.data || [])[0]
  if (!app) throw new Error(`aucune app ${BUNDLE_ID} dans App Store Connect`)
  const groups = await all(`/v1/apps/${app.id}/betaGroups?fields[betaGroups]=${GROUP_FIELDS}&limit=50`)
  const group = groups.find((g) => g.attributes?.name === GROUP_NAME && !g.attributes?.isInternalGroup)
  if (!group) throw new Error(`groupe externe « ${GROUP_NAME} » introuvable`)
  const groupIds = new Set((await all(`/v1/betaGroups/${group.id}/builds?fields[builds]=version&limit=200`)).map((b) => b.id))
  // La build de chaque version de l'App Store, lue seulement : si la lecture échoue, rien n'est expiré
  const versions = await all(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&fields[appStoreVersions]=versionString&limit=20`)
  const attached = []
  for (const v of versions) {
    const b = await api('GET', `/v1/appStoreVersions/${v.id}/build?fields[builds]=version`)
    if (b?.data?.attributes?.version) attached.push(b.data.attributes.version)
  }
  const builds = []
  let next = `/v1/builds?filter[app]=${app.id}&filter[expired]=false&limit=200&fields[builds]=version,processingState,expired,betaAppReviewSubmission,buildBetaDetail`
    + '&include=betaAppReviewSubmission,buildBetaDetail&fields[betaAppReviewSubmissions]=betaReviewState,submittedDate&fields[buildBetaDetails]=externalBuildState'
  while (next) {
    const page = await api('GET', next)
    builds.push(...fromPage(page, groupIds))
    next = page.links?.next || null
  }
  return { builds, attached }
}

/** Expire les builds du plan (sauf `essai`). Rend les versions expirées. */
export async function expire({ api, plan, essai = false, log = () => {} }) {
  const done = []
  for (const b of plan) {
    if (PROTECTED.has(b.version)) throw new Error(`refus : ${b.version} est protégée`)
    if (essai) { log(`Essai : ${b.version} serait expirée.`); continue }
    await api('PATCH', `/v1/builds/${b.id}`, { data: { type: 'builds', id: b.id, attributes: { expired: true } } })
    done.push(b.version)
    log(`Expirée : ${b.version}${b.review ? ` (examen bêta ${b.review})` : ''}.`)
  }
  return done
}

async function main() {
  const log = (line) => console.log(masked(line))
  const arg = (name) => {
    const i = process.argv.indexOf(name)
    return i > 0 ? process.argv[i + 1] || '' : null
  }
  const named = (arg('--builds') || '').split(/[\s,]+/).filter(Boolean)
  const cleanup = process.argv.includes('--nettoyage')
  const essai = process.argv.includes('--essai')
  if (!named.length && !cleanup) throw new Error('rien demandé : --builds 896.376 ou --nettoyage')
  for (const name of ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8']) {
    if (!process.env[name]) throw new Error(`secret ${name} absent de l'environnement appstore`)
  }
  const token = jwt({ keyId: process.env.ASC_KEY_ID, issuerId: process.env.ASC_ISSUER_ID, p8: process.env.ASC_KEY_P8 })
  const { api, all } = expiryClient(token)
  const { builds, attached } = await collect({ api, all })
  log(`Builds non expirées : ${builds.length} ; build de la version de l'App Store : ${attached.join(', ') || 'aucune'}`)
  const last = distributed(builds)
  log(`Dernière distribuée au groupe externe : ${last?.version ?? 'aucune'}`)
  for (const b of builds.filter((x) => IN_REVIEW.has(x.review))) log(`En examen bêta : ${b.version} (${b.review}, soumise ${b.submitted ?? '?'})`)
  for (const b of staleReviews(builds)) log(`En examen depuis plus de ${STALE_REVIEW_HOURS} h : ${b.version} (${b.hours} h)`)

  const expired = []
  if (named.length) {
    const { expire: list, refused } = namedPlan({ builds, wanted: named, attached })
    for (const r of refused) log(`Refusée : ${r.version} (${r.why}).`)
    expired.push(...await expire({ api, plan: list, essai, log }))
  }
  if (cleanup) {
    const after = builds.filter((b) => !expired.includes(b.version))
    const plan = cleanupPlan({ builds: after, attached })
    for (const k of plan.keep) log(`Gardée : ${k.version} (${k.why}).`)
    if (!plan.expire.length) log('Nettoyage : rien à expirer.')
    expired.push(...await expire({ api, plan: plan.expire, essai, log }))
  }
  log(`Bilan : ${essai ? 'essai, rien expiré' : expired.length ? `expirées : ${expired.join(', ')}` : 'rien expiré'}. La version de l'App Store n'a pas été touchée.`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.log(`::error::${masked(e.message)}`)
    process.exit(1)
  })
}
