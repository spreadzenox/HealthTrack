/**
 * Écran « Montre » (M5, signalement du 21/10) : pour chaque donnée que la montre peut rendre, la dernière valeur
 * reçue, sa date, le nombre d'échantillons des 7 derniers jours et l'issue de la dernière lecture. Ne lit que les
 * entrées de la montre en direct (source « huawei_watch ») : Health Connect a ses propres cartes.
 */
import { OUTCOME_LABELS, WATCH_SOURCE } from './sync'
import { formatDuration, workoutTypeLabel } from '../../utils/format'

const DAY = 86_400_000
export const COVERAGE_DAYS = 7
/** Fenêtre lue pour la dernière valeur : au-delà, « rien depuis 30 jours ». */
export const COVERAGE_LOOKBACK_DAYS = 30

const p = (e) => e.payload || {}
const isHr = (subtype) => (e) => e.type === 'heart_rate' && p(e).subtype === subtype
const num = (v, digits = 0) => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const AWAKE = ['awake', 'out_of_bed', 'unknown']

/** Nuit d'une période de sommeil : date locale de (fin − 12 h), la même pour 23:00–23:50 et 00:10–07:00. */
function nightKey(e) {
  const end = Date.parse(p(e).endDate || e.at)
  const d = new Date(end - 12 * 3_600_000)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
const dayKey = (e) => {
  const d = new Date(e.at)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

const asleepMinutes = (list) => list.filter((e) => !AWAKE.includes(p(e).sleepState)).reduce((s, e) => s + (Number(p(e).durationMinutes) || 0), 0)

/** Total d'un jour : l'entrée « period: day » (totaux de la montre) si elle existe, sinon la somme des heures. */
function dayTotal(list) {
  const day = list.filter((e) => p(e).period === 'day').pop()
  return day ? Number(p(day).value) || 0 : list.reduce((s, e) => s + (Number(p(e).value) || 0), 0)
}

/**
 * Types suivis, dans l'ordre de valeur pour le produit. `reads` : lectures de la synchro (SYNC_READS) qui les
 * rendent ; `grouped` : compter des nuits / jours plutôt que des entrées ; `planned` : pas encore lu par l'app.
 */
export const WATCH_DATA_KINDS = [
  {
    id: 'sleep',
    label: 'Sommeil (nuits)',
    reads: ['sleepFile', 'sleep'],
    match: (e) => e.type === 'sleep' && !p(e).nap,
    group: nightKey,
    value: (list) => {
      const score = list.map((e) => p(e).sleepScore).find(Boolean)
      return `${formatDuration(asleepMinutes(list))}${score ? ` · score ${score}` : ''}`
    },
    unit: ['nuit', 'nuits'],
  },
  {
    id: 'nap',
    label: 'Siestes',
    reads: ['sleepFile'],
    match: (e) => e.type === 'sleep' && p(e).nap,
    group: nightKey,
    value: (list) => formatDuration(asleepMinutes(list)),
    unit: ['jour', 'jours'],
  },
  { id: 'hrvNight', label: 'VFC de la nuit', reads: ['sleepFile'], match: (e) => isHr('heartRateVariability')(e) && p(e).during !== 'day', value: (e) => `${num(p(e).value)} ms` },
  { id: 'hrvDay', label: 'VFC de journée', reads: ['hrvDay'], match: (e) => isHr('heartRateVariability')(e) && p(e).during === 'day', value: (e) => `${num(p(e).value)} ms` },
  { id: 'skinTemp', label: 'Température de la peau', reads: ['skinTemp'], match: (e) => e.type === 'body_temperature' && p(e).subtype === 'skin', value: (e) => `${num(p(e).valueC, 1)} °C` },
  { id: 'spo2', label: 'SpO₂', reads: ['minutes', 'sleepFile'], match: isHr('oxygenSaturation'), value: (e) => `${num(p(e).value)} %` },
  { id: 'resp', label: 'Respiration (nuit)', reads: ['sleepFile'], match: (e) => e.type === 'respiratory_rate', value: (e) => `${num(p(e).value, 1)} /min` },
  { id: 'stress', label: 'Stress', reads: [], planned: true },
  { id: 'hr', label: 'Fréquence cardiaque', reads: ['minutes'], match: isHr('heartRate'), value: (e) => `${num(p(e).bpm)} bpm` },
  { id: 'restingHr', label: 'FC au repos', reads: ['minutes'], match: isHr('restingHeartRate'), value: (e) => `${num(p(e).bpm)} bpm` },
  { id: 'steps', label: 'Pas', reads: ['minutes', 'totals'], match: (e) => e.type === 'steps', group: dayKey, value: (list) => `${num(dayTotal(list))} pas`, unit: ['jour', 'jours'] },
  { id: 'calories', label: 'Calories', reads: ['minutes', 'totals'], match: (e) => e.type === 'calories', group: dayKey, value: (list) => `${num(dayTotal(list))} kcal`, unit: ['jour', 'jours'] },
  {
    id: 'workouts',
    label: 'Séances',
    reads: ['workouts'],
    match: (e) => e.type === 'activity',
    value: (e) => [workoutTypeLabel(p(e).workoutType), p(e).durationSeconds ? formatDuration(p(e).durationSeconds / 60) : null].filter(Boolean).join(' · '),
  },
]

/** Issue de la dernière lecture d'un type : « reçu » dès qu'une de ses lectures a rendu quelque chose. */
export function readOutcome(kind, reads) {
  if (!Array.isArray(reads) || !kind.reads.length) return null
  const mine = kind.reads.map((id) => reads.find((r) => r.id === id)).filter(Boolean)
  if (!mine.length) return null
  const best = mine.find((r) => r.outcome === 'ok') || mine.find((r) => r.outcome === 'empty') || mine[0]
  const label = OUTCOME_LABELS[best.outcome] || best.outcome
  return { outcome: best.outcome, label: best.outcome === 'ok' && best.count ? `${label} (${best.count})` : label }
}

/**
 * Une ligne par type : { id, label, status, last: { at, value } | null, count, unit, read }.
 * `status` : ok (reçu ces 7 jours) · stale (seulement plus ancien) · none (rien) · planned (pas encore lu).
 * @param {Array} entries entrées de la montre (toutes sources acceptées : filtrées ici)
 * @param {{ now?: number, reads?: Array<{ id: string, outcome: string }> | null }} [opts]
 */
export function watchCoverage(entries, { now = Date.now(), reads = null } = {}) {
  const mine = (entries || []).filter((e) => e.source === WATCH_SOURCE)
  const since = new Date(now - COVERAGE_DAYS * DAY).toISOString()
  return WATCH_DATA_KINDS.map((kind) => {
    const base = { id: kind.id, label: kind.label, read: readOutcome(kind, reads) }
    if (kind.planned) return { ...base, status: 'planned', last: null, count: 0, unit: null }
    const list = mine.filter(kind.match).sort((a, b) => (a.at < b.at ? 1 : -1))
    if (!list.length) return { ...base, status: 'none', last: null, count: 0, unit: null }
    let last
    let count
    if (kind.group) {
      const byKey = new Map()
      for (const e of list) byKey.set(kind.group(e), [...(byKey.get(kind.group(e)) || []), e])
      const latest = byKey.get(kind.group(list[0])).sort((a, b) => (a.at < b.at ? -1 : 1))
      last = { at: p(latest[latest.length - 1]).endDate || latest[latest.length - 1].at, value: kind.value(latest) }
      count = [...byKey.values()].filter((g) => g.some((e) => e.at >= since)).length
    } else {
      last = { at: list[0].at, value: kind.value(list[0]) }
      count = list.filter((e) => e.at >= since).length
    }
    const unit = kind.unit || ['mesure', 'mesures']
    return { ...base, status: count ? 'ok' : 'stale', last, count, unit: count > 1 ? unit[1] : unit[0] }
  })
}

/** « 6 types sur 12 reçus ces 7 derniers jours » (le stress, pas encore lu, n'est pas compté). */
export function coverageSummary(rows) {
  const counted = rows.filter((r) => r.status !== 'planned')
  const ok = counted.filter((r) => r.status === 'ok').length
  return `${ok} type${ok > 1 ? 's' : ''} sur ${counted.length} reçu${ok > 1 ? 's' : ''} ces ${COVERAGE_DAYS} derniers jours`
}
