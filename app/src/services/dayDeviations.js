/**
 * « Ce qui change aujourd'hui » (TESTEUR-1d-2, maquette journal/maquettes/aujourdhui §2.3) : les mesures du jour les
 * plus éloignées de VOTRE médiane des 14 jours précédents, trois au plus. Fonction pure, sans React.
 *
 * Règle 6 : rien n'est jugé. Un écart est décrit (« Nuit plus courte »), jamais qualifié de bon ou de mauvais, et
 * aucune cause n'est suggérée. Seule la personne sert de référence, jamais une norme.
 *
 * Écart normalisé : (valeur − médiane) / dispersion, la dispersion étant l'écart absolu médian (× 1,4826), avec un
 * plancher (5 % de la médiane, et un minimum par mesure) pour que des jours très réguliers ne fassent pas d'une
 * minute de sommeil un « écart ». Pas et temps d'écran s'accumulent dans la journée : « en moins » n'est dit qu'à
 * partir de 21 h ; « en plus » à toute heure (la valeur ne peut que monter).
 */
import { localDateKey } from './analysisEngine'
import { appLocale } from '../i18n/locale.js'
import { listEntries } from '../storage/localHealthStorage'
import { normStart } from './method/changes'

export const DEVIATION_WINDOW_DAYS = 14
/** Jours passés avec la mesure avant de comparer. */
export const DEVIATION_MIN_PAST_DAYS = 7
/** Écart normalisé minimal pour parler d'un changement. */
export const DEVIATION_MIN_SCORE = 1.5
export const DEVIATION_MAX_ITEMS = 3
/** Heure à partir de laquelle une mesure cumulée peut être « en moins ». */
export const CUMULATIVE_FROM_HOUR = 21

const DAY_MS = 86_400_000

function hm(minutes) {
  const m = Math.round(minutes)
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h === 0) return `${r} min`
  return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`
}

const METRICS = [
  { key: 'sleep', field: 'sleepMinutes', up: 'Nuit plus longue', down: 'Nuit plus courte', minAbs: 20, fmt: hm },
  { key: 'hrv', field: 'hrv', up: 'Variabilité cardiaque de la nuit plus haute', down: 'Variabilité cardiaque de la nuit plus basse', minAbs: 4, fmt: (v) => `${Math.round(v)} ms` },
  { key: 'restingHr', field: 'restingHr', up: 'FC au repos plus haute', down: 'FC au repos plus basse', minAbs: 3, fmt: (v) => `${Math.round(v)} bpm` },
  { key: 'steps', field: 'steps', up: 'Plus de pas', down: 'Moins de pas', minAbs: 1000, cumulative: true, fmt: (v) => Math.round(v).toLocaleString(appLocale()) },
  { key: 'screen', field: 'screenMinutes', up: 'Plus de temps d’écran', down: 'Moins de temps d’écran', minAbs: 20, cumulative: true, fmt: hm },
]

/** Mesure comparée → courbe des changements durables (TS-2, services/method/changes.js `CHANGE_METRICS`). */
const CHANGE_KEYS = { sleep: 'sleepMinutes', hrv: 'hrv_ms', restingHr: 'restingHR', steps: 'steps', screen: 'screen_minutes' }

/**
 * TS-2 : jour à partir duquel chaque mesure a sa norme, le dernier changement durable confirmé de sa courbe (la norme
 * repart du nouveau niveau). Mesure sans changement : absente (les 14 derniers jours, comme avant).
 * @param {Record<string, Array<{ date: string }>> | null} changes  résultat de la tâche `changes`
 * @returns {Record<string, string>}  mesure → dateKey
 */
export function normSinceFromChanges(changes) {
  const out = {}
  if (!changes || typeof changes !== 'object') return out
  for (const [key, curve] of Object.entries(CHANGE_KEYS)) {
    const start = normStart(Array.isArray(changes[curve]) ? changes[curve] : [])
    if (start) out[key] = start
  }
  return out
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

function median(values) {
  const s = [...values].sort((a, b) => a - b)
  const n = s.length
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}

/**
 * Norme de chaque mesure du jour (AUJ-3, revue du 07/11 : l'écart à votre norme sur la mesure elle-même, dès 7 jours
 * d'historique). Pour chaque mesure qui a une valeur aujourd'hui et au moins 7 jours passés : « d'habitude … » (la
 * médiane de vos 14 derniers jours) et, si l'écart est net, son sens (`up` / `down`) et sa phrase. Jamais un jugement.
 * `since` (TS-2) : mesure → jour du dernier changement durable ; la norme ne prend que les jours depuis ce changement
 * (toujours 7 au moins : un changement n'est confirmé que 7 jours après). Un changement postérieur au jour comparé
 * est ignoré.
 * `dayKey` (POLISH-SIM-11) : compare plutôt la valeur de ce jour passé à la même habitude qu'aujourd'hui (même fenêtre,
 * même chiffre que l'Accueil) ; un jour passé est fini (les cumuls en moins se disent). Hors de la fenêtre : aucune norme.
 * @returns {{ ready: boolean, norms: Record<string, { usual: string, value: string, direction: 'up'|'down'|null,
 *   text: string | null, score: number }> }}
 */
export function measureNorms(days, now = new Date(), { since = {}, dayKey = null } = {}) {
  const today = localDateKey(now.toISOString())
  const from = localDateKey(new Date(now.getTime() - DEVIATION_WINDOW_DAYS * DAY_MS).toISOString())
  const pastDay = dayKey && dayKey < today ? dayKey : null
  if (pastDay && pastDay < from) return { ready: false, norms: {} }
  const past = (days || []).filter((d) => d?.dateKey >= from && d.dateKey < today)
  const todaySummary = (days || []).find((d) => d?.dateKey === (pastDay || today))?.summary || {}
  const evening = pastDay ? true : now.getHours() >= CUMULATIVE_FROM_HOUR

  let ready = false
  const norms = {}
  for (const m of METRICS) {
    const start = since[m.key] && since[m.key] <= today ? since[m.key] : null
    const values = past.filter((d) => !start || d.dateKey >= start).map((d) => d.summary?.[m.field]).filter(isNum)
    if (values.length < DEVIATION_MIN_PAST_DAYS) continue
    ready = true
    const v = todaySummary[m.field]
    if (!isNum(v)) continue
    const med = median(values)
    const mad = median(values.map((x) => Math.abs(x - med))) * 1.4826
    const diff = v - med
    const scale = Math.max(mad, Math.abs(med) * 0.05, m.minAbs / 2)
    const score = Math.abs(diff) / scale
    let direction = diff > 0 ? 'up' : 'down'
    if (Math.abs(diff) < m.minAbs || score < DEVIATION_MIN_SCORE) direction = null
    if (m.cumulative && direction === 'down' && !evening) direction = null
    norms[m.key] = {
      usual: `d’habitude ${m.fmt(med)}`,
      usualValue: m.fmt(med),
      value: m.fmt(v),
      direction,
      text: direction ? m[direction] : null,
      score: Math.round(score * 10) / 10,
    }
  }
  return { ready, norms }
}

/**
 * @param {{ dateKey: string, summary: object }[]} days  sortie de buildDailyJournal (ordre indifférent)
 * @param {Date} now
 * @returns {{ ready: boolean, items: Array<{ key: string, text: string, value: string, usual: string,
 *   direction: 'up'|'down', score: number }> }}
 *   `ready` : au moins une mesure a assez de jours passés (sinon la section reste masquée).
 */
export function dayDeviations(days, now = new Date(), options = {}) {
  const { ready, norms } = measureNorms(days, now, options)
  const items = Object.entries(norms)
    .filter(([, n]) => n.direction)
    .map(([key, n]) => ({ key, text: n.text, value: n.value, usual: n.usual, direction: n.direction, score: n.score }))
  items.sort((a, b) => b.score - a.score)
  return { ready, items: items.slice(0, DEVIATION_MAX_ITEMS) }
}

/**
 * Seules les mesures comparées sont lues, sur 15 jours (une nuit de plus pour celle qui finit le premier jour) ; la
 * fréquence cardiaque par ses seuls sous-types repos et VFC (budget de lectures de l'Accueil, perf D2).
 */
export async function readDeviationEntries(now = new Date(), extraDays = 0) {
  const since = new Date(now.getTime() - (DEVIATION_WINDOW_DAYS + 1 + extraDays) * DAY_MS).toISOString()
  const sleepSince = new Date(now.getTime() - (DEVIATION_WINDOW_DAYS + 2 + extraDays) * DAY_MS).toISOString()
  const lists = await Promise.all([
    listEntries({ type: 'sleep', since: sleepSince, limit: Infinity }),
    listEntries({ type: 'steps', since, limit: Infinity }),
    listEntries({ type: 'heart_rate', subtypes: ['restingHeartRate', 'heartRateVariability'], since, limit: Infinity }),
    listEntries({ type: 'phone_usage', since, limit: Infinity }),
  ])
  return lists.flat()
}

