/**
 * Plantages et ANR de la variante play, lus dans Android vitals (API Google Play Developer Reporting, v1beta1),
 * pour le bilan de « Play — AAB » (POL-PLAY-11, TEST-ALPHA-1 : choisir une version Alpha sans plantage connu).
 *
 * Lecture seule : `errorIssues:search` (regroupements d'erreurs des 30 derniers jours, période par défaut de Google).
 * Rien de personnel : Google ne donne que des comptes, la classe de l'erreur et l'endroit du code. Le jeton
 * (portée playdeveloperreporting) vient de la connexion sans clé de la CI ; il n'est jamais écrit.
 */
import { call, withRetry, PlayApiError } from './publish.mjs'

export const REPORTING_API = 'https://playdeveloperreporting.googleapis.com/v1beta1'
export const MAX_PAGES = 5
const PAGE_SIZE = 50
const TYPE_LABELS = { CRASH: 'Plantage', ANR: 'ANR' }

export async function readErrorIssues({ packageName, token, fetchImpl = fetch, sleep }) {
  fetchImpl = withRetry(fetchImpl, { sleep })
  const base = `${REPORTING_API}/apps/${packageName}/errorIssues:search`
  const issues = []
  let pageToken
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ pageSize: String(PAGE_SIZE) })
    if (pageToken) params.set('pageToken', pageToken)
    const res = await call(fetchImpl, 'Lecture des plantages (Android vitals)', `${base}?${params}`, { token })
    issues.push(...(res?.errorIssues ?? []))
    pageToken = res?.nextPageToken
    if (!pageToken) break
  }
  return issues
}

/** Texte court et sûr pour une cellule du tableau Markdown. */
const cell = (s) => String(s ?? '—').replace(/[|\n\r`]/g, ' ').trim().slice(0, 120) || '—'

const parisTime = (iso) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  )
  return `${p.day}/${p.month} ${p.hour}:${p.minute}`
}

const count = (v) => Number(v ?? 0) || 0

/** Bilan Markdown : verdict d'abord, puis un tableau des plantages et ANR (les erreurs non fatales sont ignorées). */
export function formatErrorIssues(issues, { versionCode } = {}) {
  const head = ['', '#### Plantages et ANR (Android vitals, 30 derniers jours)', '']
  const fatal = issues.filter((i) => TYPE_LABELS[i.type]).sort((a, b) => count(b.errorReportCount) - count(a.errorReportCount))
  if (!fatal.length) return [...head, '- ✅ Aucun plantage ni ANR signalé par Google sur 30 jours (les rapports arrivent avec quelques heures de retard).']
  const crashes = fatal.filter((i) => i.type === 'CRASH').length
  const anrs = fatal.length - crashes
  const vc = versionCode ? String(versionCode) : null
  const touching = vc ? fatal.filter((i) => String(i.lastAppVersion?.versionCode ?? '') === vc).length : 0
  const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`
  return [
    ...head,
    `- ${plural(crashes, 'plantage')}, ${anrs} ANR (regroupements de Google).${touching ? ` ⚠️ ${touching} touche la version ${vc}.` : ''}`,
    '',
    '| Type | Erreur | Endroit | Versions | Rapports | Utilisateurs | Dernier (Paris) |',
    '|---|---|---|---|---|---|---|',
    ...fatal.slice(0, 15).map((i) => {
      const first = i.firstAppVersion?.versionCode
      const last = i.lastAppVersion?.versionCode
      const versions = first && last && first !== last ? `${first} → ${last}` : cell(last ?? first)
      return `| ${TYPE_LABELS[i.type]} | ${cell(i.cause)} | \`${cell(i.location)}\` | ${versions} | ${count(i.errorReportCount)} | ${count(i.distinctUsers)} | ${parisTime(i.lastErrorReportTime)} |`
    }),
    ...(fatal.length > 15 ? [`| … | ${fatal.length - 15} autre(s) | | | | | |`] : []),
    '',
    'Traces complètes : Play Console → Qualité → Android vitals → Plantages et ANR.',
  ]
}

/** Explication d'un échec de lecture, avec le geste du propriétaire quand il y en a un. Jamais bloquant. */
export function explainVitalsError(err) {
  const msg = err instanceof PlayApiError ? err.apiMessage ?? err.message : err?.message ?? String(err)
  const lines = ['', '#### Plantages et ANR (Android vitals)', '']
  if (err instanceof PlayApiError && err.status === 403 && /has not been used|is disabled|SERVICE_DISABLED/i.test(msg)) {
    lines.push(
      '- Lecture impossible : l’API « Google Play Developer Reporting » n’est pas activée dans le projet.',
      '- Action du propriétaire (une fois) : `gcloud services enable playdeveloperreporting.googleapis.com --project=healthtrack-824b26` (ou console Google Cloud → API et services → Activer « Google Play Developer Reporting API »).',
    )
  } else if (err instanceof PlayApiError && err.status === 403) {
    lines.push(
      `- Lecture refusée : ${cell(msg)}`,
      '- Action du propriétaire : Play Console → Utilisateurs et autorisations → gh-deployer → Autorisations de l’application Halcya → cocher « Afficher les informations de l’application (lecture seule) ».',
    )
  } else {
    lines.push(`- Lecture impossible : ${cell(msg)}`)
  }
  lines.push('- Cela n’empêche pas l’envoi de la version.')
  return lines
}
