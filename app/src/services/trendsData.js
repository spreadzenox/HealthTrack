/**
 * Journal › Tendances (ORG-3, ORG-3c, revue design du 07/11) : un visualiseur. Fonction pure, sans React.
 * Une ou plusieurs mesures superposables, un axe par unité (deux au plus) ; une mesure n'est proposée qu'à partir de
 * 3 points sur la période (leçon 17). Bien-être et confort digestif viennent du modèle à espace d'états (TS-1) :
 * chaque jour une valeur et sa fourchette, un point plein seulement les jours notés ; l'attendu d'après vos habitudes
 * ne prolonge que le futur (pointillés, fourchette qui s'élargit : Semaine 3 jours, Mois 7). Aucun attendu sur le
 * passé. Les autres mesures viennent des résumés du jour (montre, téléphone).
 */
import { toDisplay } from './mood/wellbeingScale'
import { formatDuration } from '../utils/format'
import { appLocale } from '../i18n/locale.js'

const DAY_MS = 86_400_000

export const TREND_PERIODS = {
  week: { past: 7, future: 3 },
  month: { past: 30, future: 7 },
}

const n1 = (v) => v.toLocaleString(appLocale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const n0 = (v) => Math.round(v).toLocaleString(appLocale())

/** Mesures du visualiseur, dans l'ordre du menu « + ». `tone` = couleur du thème (src/theme/themes.js). */
export const TREND_MEASURES = [
  { key: 'wellbeing', label: 'Bien-être', unit: '/5', tone: 'mint', state: true, fmt: (v) => `${n1(v)} /5` },
  { key: 'digestion', label: 'Confort digestif', unit: '/5', tone: 'peach', state: true, fmt: (v) => `${n1(v)} /5` },
  { key: 'sleep', label: 'Sommeil', unit: 'h', tone: 'night', field: 'sleepMinutes', scale: 1 / 60, fmt: (v) => formatDuration(v * 60) },
  { key: 'steps', label: 'Pas', unit: 'pas', tone: 'lilac', field: 'steps', fmt: (v) => n0(v) },
  { key: 'hrv', label: 'VFC nuit', unit: 'ms', tone: 'rose', field: 'hrv', fmt: (v) => `${n0(v)} ms` },
  { key: 'restingHr', label: 'FC au repos', unit: 'bpm', tone: 'rose', field: 'restingHr', fmt: (v) => `${n0(v)} bpm` },
  { key: 'screen', label: 'Écran', unit: 'h', tone: 'stone', field: 'screenMinutes', scale: 1 / 60, fmt: (v) => formatDuration(v * 60) },
]
export const trendMeasure = (key) => TREND_MEASURES.find((m) => m.key === key) ?? null

/** Un graphique à partir de 3 points (leçon 17). */
export const TREND_MIN_POINTS = 3

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

function keyOf(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Les dates de la période : `past` jours jusqu'à aujourd'hui compris, puis `future` jours. */
export function periodDates(period, now = new Date()) {
  const { past, future } = TREND_PERIODS[period]
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  const out = []
  for (let i = -(past - 1); i <= future; i += 1) out.push(keyOf(new Date(base.getTime() + i * DAY_MS)))
  return { dates: out, today: keyOf(base) }
}

const stateValue = (b) => (b && isNum(b.mean) ? { value: toDisplay(b.mean), low: toDisplay(b.low), high: toDisplay(b.high) } : null)

/**
 * @param {{ states: object | null, days: { dateKey: string, summary: object }[], period: 'week'|'month', now?: Date }} input
 *   `states` : sortie d'estimateStates (TS-1) ; `days` : buildDailyJournal.
 * @returns {{ dates: string[], today: string, series: Record<string, Array<{ date, value, low?, high?, observed, future }>>,
 *   available: string[] }}
 */
export function buildTrendSeries({ states = null, days = [], period = 'week', now = new Date() }) {
  const { dates, today } = periodDates(period, now)
  const inRange = new Set(dates)
  const byDate = new Map((days || []).map((d) => [d.dateKey, d.summary || {}]))
  const stateByDate = new Map((states?.days || []).map((d) => [d.date, d]))
  const series = {}
  for (const m of TREND_MEASURES) {
    const pts = []
    for (const date of dates) {
      if (m.state) {
        const d = stateByDate.get(date)
        if (!d) continue
        // Confort digestif : la courbe estimée seulement si elle prédit mieux que la moyenne (TS-1) ; sinon les
        // jours notés seuls, d'après l'information digestive (règle 5)
        if (m.key === 'digestion' && !states.showDigestiveCurve && !d.observed.digestion) continue
        const band = m.key === 'digestion' && !states.showDigestiveCurve ? d.digestionOwn : d[m.key]
        const v = stateValue(band)
        if (!v) continue
        pts.push({ date, ...v, observed: Boolean(d.observed?.[m.key]), future: Boolean(d.future) })
      } else if (date <= today) {
        const raw = byDate.get(date)?.[m.field]
        if (isNum(raw)) pts.push({ date, value: raw * (m.scale ?? 1), observed: true, future: false })
      }
    }
    series[m.key] = pts.filter((p) => inRange.has(p.date))
  }
  const available = TREND_MEASURES
    .filter((m) => series[m.key].filter((p) => !p.future).length >= TREND_MIN_POINTS)
    .map((m) => m.key)
  return { dates, today, series, available }
}

/** Unités des mesures choisies : un axe par unité, deux au plus (gauche, droite). */
export function unitsOf(keys) {
  return [...new Set(keys.map((k) => trendMeasure(k)?.unit).filter(Boolean))]
}

/** Une mesure peut s'ajouter si son unité a déjà un axe, ou s'il reste un axe libre. */
export function canAdd(keys, key) {
  const units = unitsOf(keys)
  return !keys.includes(key) && (units.length < 2 || units.includes(trendMeasure(key)?.unit))
}
