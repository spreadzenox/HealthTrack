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

/**
 * Mesures du visualiseur, dans l'ordre du menu « + ». `tone` = couleur du thème (src/theme/themes.js).
 * `gloss` : dit une fois sous les mesures affichées, le nom en toutes lettres d'une abréviation (POLISH-SIM-6) ou la
 * note de chaque niveau de la digestion notée en mots (POLISH-SIM-54, mêmes notes que GUT_COMFORT).
 */
export const TREND_MEASURES = [
  { key: 'wellbeing', label: 'Bien-être', unit: '/5', tone: 'mint', state: true, fmt: (v) => `${n1(v)} /5` },
  { key: 'digestion', label: 'Confort digestif', unit: '/5', tone: 'peach', state: true, fmt: (v) => `${n1(v)} /5`,
    gloss: 'Calme 5, Gêne 3, Douleur 1' },
  { key: 'sleep', label: 'Sommeil', unit: 'h', tone: 'night', field: 'sleepMinutes', scale: 1 / 60, fmt: (v) => formatDuration(v * 60) },
  { key: 'steps', label: 'Pas', unit: 'pas', tone: 'lilac', field: 'steps', fmt: (v) => n0(v) },
  // POLISH-SIM-47 : la pesée (à la main ou balance), dernière du jour ; thème corps
  { key: 'weight', label: 'Poids', unit: 'kg', tone: 'rose', field: 'weightKg', fmt: (v) => `${n1(v)} kg` },
  { key: 'hrv', label: 'VFC nuit', unit: 'ms', tone: 'rose', field: 'hrv', fmt: (v) => `${n0(v)} ms`,
    gloss: 'variabilité de la fréquence cardiaque pendant la nuit, en millisecondes' },
  { key: 'restingHr', label: 'FC au repos', unit: 'bpm', tone: 'rose', field: 'restingHr', fmt: (v) => `${n0(v)} bpm`,
    gloss: 'fréquence cardiaque au repos, en battements par minute' },
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

/** Mesure de Tendances → courbe des changements durables (TS-2, services/method/changes.js). */
export const CHANGE_KEYS = { wellbeing: 'wellbeing', digestion: 'digestion', sleep: 'sleepMinutes', hrv: 'hrv_ms', restingHr: 'restingHR', steps: 'steps', screen: 'screen_minutes' }
const CHANGE_LABELS = { wellbeing: 'Bien-être', digestion: 'Confort digestif', sleepMinutes: 'Sommeil', hrv_ms: 'VFC', restingHR: 'FC au repos', steps: 'Pas', screen_minutes: 'Temps d’écran' }

/**
 * Repères « changement » des mesures affichées dans la période (vue Mois) : niveau avant et après, dans l'unité de
 * la courbe, et « Au même moment » (autres changements à ± 5 jours). Jamais de cause.
 * @param {Record<string, Array>} all  sortie de changesFromEntries
 */
export function changeMarks(all, keys, dates) {
  if (!all) return []
  const inRange = new Set(dates)
  const out = []
  for (const k of keys) {
    const m = trendMeasure(k)
    const ck = CHANGE_KEYS[k]
    for (const c of all[ck] || []) {
      if (!inRange.has(c.date)) continue
      const conv = (v) => (m.state ? toDisplay(v) : v * (m.scale ?? 1))
      const near = []
      for (const [other, list] of Object.entries(all)) {
        if (other === ck) continue
        for (const o of list) {
          const gap = Math.abs(Date.parse(`${o.date}T12:00:00`) - Date.parse(`${c.date}T12:00:00`)) / 86_400_000
          if (gap <= 5) near.push(CHANGE_LABELS[other] ?? other)
        }
      }
      out.push({ key: k, date: c.date, label: m.label, tone: m.tone, before: m.fmt(conv(c.before)), after: m.fmt(conv(c.after)), sameTime: [...new Set(near)] })
    }
  }
  return out
}

/**
 * Vue à l'ouverture de Tendances (correction T1 du propriétaire, 07/11) : une courbe dès qu'une mesure le peut.
 * Le bien-être d'abord, en Semaine s'il a au moins 3 jours, sinon en Jour s'il a des lectures ou des notes ; sans
 * bien-être, la première mesure qui a une courbe. Une demande explicite (`?mesure`, `?vue=jour`) prime.
 * @param {{ asked?: string|null, askedDay?: boolean, available: string[], hasWellbeing: boolean }} input
 * @returns {{ period: 'day'|'week', keys: string[] }}
 */
export function defaultTrendsView({ asked = null, askedDay = false, available = [], hasWellbeing = false }) {
  if (askedDay) return { period: 'day', keys: ['wellbeing'] }
  if (trendMeasure(asked)) return { period: 'week', keys: [asked] }
  if (available.includes('wellbeing')) return { period: 'week', keys: ['wellbeing'] }
  if (hasWellbeing) return { period: 'day', keys: ['wellbeing'] }
  return { period: 'week', keys: available.slice(0, 1) }
}

/**
 * POLISH-SIM-4 : ce que dit la ligne d'un jour passé à côté de son chiffre, pour qu'un bien-être de 3,2 à côté d'une
 * note de 3,4 se comprenne (l'estimation du jour mêle la note au visage, ou aux jours voisins quand il n'a pas de
 * lecture). Le sens de l'échelle digestive est dit sous la courbe (POLISH-SIM-54).
 * @param {'wellbeing'|'digestion'} key
 * @param {{ value: number, note?: number|null, readings?: number, gut?: string|null, observed?: boolean }} d
 */
export function detailSource(key, { value, note = null, readings = 0, gut = null, observed = false }) {
  // POLISH-SIM-54 : l'échelle est dite une fois sous la courbe (gloss), plus à chaque jour
  if (key === 'digestion') return gut ? `noté « ${gut} »` : observed ? 'noté' : 'estimé'
  if (note != null) {
    if (Math.round(value * 10) === Math.round(note * 10)) return 'votre note'
    const n = note.toLocaleString(appLocale(), { maximumFractionDigits: 1 })
    return `votre note ${n} et ${readings > 0 ? 'le visage' : 'les jours voisins'}`
  }
  if (readings > 0) return 'd’après le visage'
  return observed ? 'noté' : 'estimé'
}
