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
  { key: 'hrv', field: 'hrv', up: 'VFC de la nuit plus haute', down: 'VFC de la nuit plus basse', minAbs: 4, fmt: (v) => `${Math.round(v)} ms` },
  { key: 'restingHr', field: 'restingHr', up: 'FC au repos plus haute', down: 'FC au repos plus basse', minAbs: 3, fmt: (v) => `${Math.round(v)} bpm` },
  { key: 'steps', field: 'steps', up: 'Plus de pas', down: 'Moins de pas', minAbs: 1000, cumulative: true, fmt: (v) => Math.round(v).toLocaleString(appLocale()) },
  { key: 'screen', field: 'screenMinutes', up: 'Plus de temps d’écran', down: 'Moins de temps d’écran', minAbs: 20, cumulative: true, fmt: hm },
]

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

function median(values) {
  const s = [...values].sort((a, b) => a - b)
  const n = s.length
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}

/**
 * @param {{ dateKey: string, summary: object }[]} days  sortie de buildDailyJournal (ordre indifférent)
 * @param {Date} now
 * @returns {{ ready: boolean, items: Array<{ key: string, text: string, value: string, usual: string,
 *   direction: 'up'|'down', score: number }> }}
 *   `ready` : au moins une mesure a assez de jours passés (sinon la section reste masquée).
 */
export function dayDeviations(days, now = new Date()) {
  const today = localDateKey(now.toISOString())
  const from = localDateKey(new Date(now.getTime() - DEVIATION_WINDOW_DAYS * DAY_MS).toISOString())
  const past = (days || []).filter((d) => d?.dateKey >= from && d.dateKey < today)
  const todaySummary = (days || []).find((d) => d?.dateKey === today)?.summary || {}
  const evening = now.getHours() >= CUMULATIVE_FROM_HOUR

  let ready = false
  const items = []
  for (const m of METRICS) {
    const values = past.map((d) => d.summary?.[m.field]).filter(isNum)
    if (values.length < DEVIATION_MIN_PAST_DAYS) continue
    ready = true
    const v = todaySummary[m.field]
    if (!isNum(v)) continue
    const med = median(values)
    const mad = median(values.map((x) => Math.abs(x - med))) * 1.4826
    const diff = v - med
    if (Math.abs(diff) < m.minAbs) continue
    const scale = Math.max(mad, Math.abs(med) * 0.05, m.minAbs / 2)
    const score = Math.abs(diff) / scale
    if (score < DEVIATION_MIN_SCORE) continue
    const direction = diff > 0 ? 'up' : 'down'
    if (m.cumulative && direction === 'down' && !evening) continue
    items.push({
      key: m.key,
      text: m[direction],
      value: m.fmt(v),
      usual: `d’habitude ${m.fmt(med)}`,
      direction,
      score: Math.round(score * 10) / 10,
    })
  }
  items.sort((a, b) => b.score - a.score)
  return { ready, items: items.slice(0, DEVIATION_MAX_ITEMS) }
}

/**
 * Seules les mesures comparées sont lues, sur 15 jours (une nuit de plus pour celle qui finit le premier jour) ; la
 * fréquence cardiaque par ses seuls sous-types repos et VFC (budget de lectures de l'Accueil, perf D2).
 */
export async function readDeviationEntries(now = new Date()) {
  const since = new Date(now.getTime() - (DEVIATION_WINDOW_DAYS + 1) * DAY_MS).toISOString()
  const sleepSince = new Date(now.getTime() - (DEVIATION_WINDOW_DAYS + 2) * DAY_MS).toISOString()
  const lists = await Promise.all([
    listEntries({ type: 'sleep', since: sleepSince, limit: Infinity }),
    listEntries({ type: 'steps', since, limit: Infinity }),
    listEntries({ type: 'heart_rate', subtypes: ['restingHeartRate', 'heartRateVariability'], since, limit: Infinity }),
    listEntries({ type: 'phone_usage', since, limit: Infinity }),
  ])
  return lists.flat()
}

