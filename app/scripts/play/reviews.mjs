/**
 * Avis du Play Store, lus par l'API Android Publisher (`reviews.list`, lecture seule), pour le résumé anonyme du
 * workflow « Votre avis — résumé » (retours du propriétaire du 04/11, point (2) ; AVIS-PLAY-1, journal/BACKLOG.md).
 *
 * Le dépôt et les résumés de ses workflows sont publics : le bilan ne contient que des comptes (étoiles, versions,
 * version d'Android, thèmes repérés par les mêmes mots-clés que « Votre avis » dans l'app, avis déjà répondus).
 * Jamais le texte d'un avis, le nom de son auteur, son identifiant ni l'appareil précis. Répondre à un avis reste un
 * geste du propriétaire (droit « Répondre aux avis ») : ce module ne fait que lire.
 *
 * Google ne rend par cette API que les avis écrits ou modifiés les 7 derniers jours, et seulement ceux du Play Store
 * public : tant que l'app n'est pas en production, le bilan dit simplement « aucun avis ».
 */
import { call, withRetry, PlayApiError, API } from './publish.mjs'
import { FEEDBACK_THEMES } from '../../../relay/src/feedback.js'

export const MAX_PAGES = 10
const PAGE_SIZE = 100

export async function readReviews({ packageName, token, fetchImpl = fetch, sleep }) {
  fetchImpl = withRetry(fetchImpl, { sleep })
  const base = `${API}/${packageName}/reviews`
  const reviews = []
  let pageToken
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ maxResults: String(PAGE_SIZE) })
    if (pageToken) params.set('token', pageToken)
    const res = await call(fetchImpl, 'Lecture des avis du Play Store', `${base}?${params}`, { token })
    reviews.push(...(res?.reviews ?? []))
    pageToken = res?.tokenPagination?.nextPageToken
    if (!pageToken) break
  }
  return reviews
}

const inc = (obj, key) => {
  obj[key] = (obj[key] ?? 0) + 1
}

/**
 * Comptes seulement. Chaque avis : sa note (1 à 5), sa version de l'app et d'Android, ses thèmes, et s'il a déjà une
 * réponse. Le texte n'est lu que pour repérer les thèmes, puis oublié.
 */
export function summarizeReviews(reviews) {
  const stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const themes = Object.fromEntries(FEEDBACK_THEMES.map(([key]) => [key, 0]))
  const byVersion = {}
  const byAndroid = {}
  let rated = 0
  let sum = 0
  let answered = 0
  let lowUnanswered = 0
  let withText = 0
  let unclassified = 0
  let latest = null
  for (const review of reviews) {
    const comments = review?.comments ?? []
    const user = comments.find((c) => c?.userComment)?.userComment
    if (!user) continue
    const replied = comments.some((c) => c?.developerComment)
    const star = Number(user.starRating)
    if (star >= 1 && star <= 5) {
      stars[star]++
      rated++
      sum += star
      if (star <= 3 && !replied) lowUnanswered++
    }
    if (replied) answered++
    inc(byVersion, user.appVersionCode ? String(user.appVersionCode) : 'inconnue')
    inc(byAndroid, user.androidOsVersion ? `API ${user.androidOsVersion}` : 'inconnue')
    const text = String(user.text ?? '').trim()
    if (text) {
      withText++
      const hits = FEEDBACK_THEMES.filter(([, , re]) => re.test(text))
      for (const [key] of hits) themes[key]++
      if (!hits.length) unclassified++
    }
    const seconds = Number(user.lastModified?.seconds)
    if (Number.isFinite(seconds) && seconds > 0 && (latest === null || seconds > latest)) latest = seconds
  }
  return {
    total: rated,
    average: rated ? Math.round((sum / rated) * 10) / 10 : null,
    stars,
    answered,
    lowUnanswered,
    withText,
    unclassified,
    themes,
    themeLabels: Object.fromEntries(FEEDBACK_THEMES.map(([key, label]) => [key, label])),
    byVersion,
    byAndroid,
    latest: latest === null ? null : new Date(latest * 1000).toISOString(),
  }
}

const entries = (obj) =>
  Object.entries(obj)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k} × ${v}`)
    .join(', ') || '—'

/** Bilan Markdown pour le résumé du workflow : aucun texte d'avis, aucun nom. */
export function formatReviewSummary(s) {
  const head = ['', '### Avis du Play Store (7 derniers jours)', '']
  if (!s.total) {
    return [
      ...head,
      '- Aucun avis public ces 7 derniers jours. Tant que l’app n’est pas en production, c’est normal : les testeurs du test fermé écrivent dans « Votre avis » (bilan ci-dessus) ou à l’adresse de commentaires de la piste (P45).',
    ]
  }
  const lines = [
    ...head,
    `- ${s.total} avis, note moyenne ${String(s.average).replace('.', ',')} / 5 ; ${s.answered} déjà répondu(s).`,
    ...(s.lowUnanswered
      ? [`- ⚠️ ${s.lowUnanswered} avis à 3 étoiles ou moins sans réponse : à lire dans la Play Console (Qualité → Avis), la réponse est le geste du propriétaire.`]
      : []),
    '',
    '| Étoiles | Avis |',
    '|---|---|',
    ...[5, 4, 3, 2, 1].map((n) => `| ${'★'.repeat(n)} | ${s.stars[n]} |`),
    '',
  ]
  const themeRows = Object.entries(s.themes)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `| ${s.themeLabels[k]} | ${v} |`)
  if (s.withText) {
    lines.push(`Thèmes des ${s.withText} avis avec un texte (mots-clés, un avis peut en toucher plusieurs) :`, '', '| Thème | Avis |', '|---|---|', ...themeRows)
    if (s.unclassified) lines.push(`| Sans thème repéré | ${s.unclassified} |`)
    lines.push('')
  }
  lines.push(`Par version : ${entries(s.byVersion)}`, `Par version d’Android : ${entries(s.byAndroid)}`)
  if (s.latest) lines.push(`Dernier avis : ${s.latest.slice(0, 16).replace('T', ' ')} UTC`)
  return lines
}

/** Explication d'un échec de lecture, avec le geste du propriétaire quand il y en a un. */
export function explainReviewsError(err) {
  const msg = String(err instanceof PlayApiError ? err.apiMessage ?? err.message : err?.message ?? err)
    .replace(/[|\n\r`]/g, ' ')
    .slice(0, 160)
  const lines = ['', '### Avis du Play Store', '']
  if (err instanceof PlayApiError && (err.status === 401 || err.status === 403)) {
    lines.push(
      `- Lecture refusée (HTTP ${err.status}) : ${msg}`,
      '- Action du propriétaire, si cela dure : Play Console → Utilisateurs et autorisations → gh-deployer → Autorisations de l’application Halcya → cocher « Répondre aux avis » (l’API des avis peut le demander, même pour lire ; la routine ne répond jamais elle-même).',
    )
  } else {
    lines.push(`- Lecture impossible : ${msg}`)
  }
  return lines
}
