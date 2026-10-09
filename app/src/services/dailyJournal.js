/**
 * Journal du tableau de bord : les entrées regroupées par jour, avec un résumé de la journée.
 *
 * Les mesures automatiques (FC toutes les heures, pas, calories, sommeil) sont résumées en une
 * ligne au lieu d'occuper une carte chacune ; les saisies et événements (repas, bien-être,
 * cigarettes, activités, pesées) restent listés un par un, pour pouvoir les relire ou les supprimer.
 */
import { localDateKey } from './analysisEngine'
import { mealKcal } from './mealEditing'

/** Types uniquement résumés (jamais listés individuellement). */
export const JOURNAL_SUMMARY_TYPES = ['heart_rate', 'steps', 'calories', 'sleep']

/** Phases qui ne comptent pas comme du sommeil. */
const NOT_ASLEEP = new Set(['awake', 'inBed', 'outOfBed'])

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

/** Jour du réveil : une nuit commencée le 7 à 23 h compte pour le 8. */
function sleepDateKey(entry) {
  const p = entry.payload || {}
  if (p.endDate) return localDateKey(p.endDate)
  if (isNum(p.durationMinutes)) {
    return localDateKey(new Date(new Date(entry.at).getTime() + p.durationMinutes * 60000).toISOString())
  }
  return localDateKey(entry.at)
}

function emptyDay(dateKey) {
  return {
    dateKey,
    items: [],
    _sleep: 0,
    _dayTotals: { steps: [], calories: [] },
    _partials: { steps: 0, calories: 0 },
    _hasPartial: { steps: false, calories: false },
    _hr: [],
    _resting: [],
    _hrv: [],
    _spo2: [],
    _wellbeing: [],
    cigarettes: 0,
    meals: 0,
    mealKcal: 0,
  }
}

function last(values) {
  return values.length ? values[values.length - 1] : null
}

/** Total journalier si la source en fournit un (le plus grand, s'il y a des doublons), sinon la somme. */
function dailyTotal(day, kind) {
  if (day._dayTotals[kind].length) return Math.max(...day._dayTotals[kind])
  return day._hasPartial[kind] ? day._partials[kind] : null
}

function finalize(day) {
  const hr = day._hr
  const wb = day._wellbeing
  return {
    dateKey: day.dateKey,
    items: day.items.sort((a, b) => (b.at < a.at ? -1 : 1)),
    summary: {
      sleepMinutes: day._sleep > 0 ? day._sleep : null,
      steps: dailyTotal(day, 'steps'),
      burnedKcal: isNum(dailyTotal(day, 'calories')) ? Math.round(dailyTotal(day, 'calories')) : null,
      restingHr: last(day._resting),
      hrv: last(day._hrv),
      spo2: last(day._spo2),
      heartRate: hr.length ? { min: Math.min(...hr), max: Math.max(...hr), count: hr.length } : null,
      wellbeing: wb.length
        ? { average: Math.round((wb.reduce((s, v) => s + v, 0) / wb.length) * 10) / 10, count: wb.length }
        : null,
      cigarettes: day.cigarettes,
      meals: day.meals,
      mealKcal: day.mealKcal,
    },
  }
}

/**
 * @param {Array} entries - entrées brutes (ordre indifférent)
 * @returns {Array<{dateKey: string, summary: object, items: Array}>} jours, le plus récent en premier
 */
export function buildDailyJournal(entries) {
  const days = new Map()
  const getDay = (key) => {
    if (!days.has(key)) days.set(key, emptyDay(key))
    return days.get(key)
  }
  // Ordre chronologique : « la dernière valeur » d'un jour est bien la plus récente.
  const sorted = (entries || []).filter((e) => e?.at).sort((a, b) => (a.at < b.at ? -1 : 1))

  for (const e of sorted) {
    const p = e.payload || {}
    if (e.type === 'sleep') {
      const day = getDay(sleepDateKey(e))
      if (isNum(p.durationMinutes) && p.durationMinutes > 0 && !NOT_ASLEEP.has(p.sleepState)) {
        day._sleep += p.durationMinutes
      }
      continue
    }
    const day = getDay(localDateKey(e.at))
    switch (e.type) {
      case 'steps':
      case 'calories': {
        const kind = e.type
        if (!isNum(p.value)) break
        if (p.period === 'day') day._dayTotals[kind].push(p.value)
        else {
          day._partials[kind] += p.value
          day._hasPartial[kind] = true
        }
        break
      }
      case 'heart_rate': {
        const v = p.bpm ?? p.value
        if (!isNum(v) || v <= 0) break
        if (p.subtype === 'restingHeartRate') day._resting.push(v)
        else if (p.subtype === 'heartRateVariability') day._hrv.push(v)
        else if (p.subtype === 'oxygenSaturation') day._spo2.push(v)
        else day._hr.push(v)
        break
      }
      case 'wellbeing':
        if (isNum(p.score)) day._wellbeing.push(p.score)
        day.items.push(e)
        break
      case 'cigarette':
        day.cigarettes += isNum(p.count) && p.count > 0 ? p.count : 1
        day.items.push(e)
        break
      case 'food':
        day.meals += 1
        day.mealKcal += mealKcal(p.items)
        day.items.push(e)
        break
      default:
        day.items.push(e)
    }
  }

  return [...days.values()]
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
    .map(finalize)
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Titre d'un jour : « Aujourd’hui », « Hier » ou le jour de la semaine, + la date en clair.
 * @param {string} dateKey - AAAA-MM-JJ (heure locale)
 * @param {Date} [now]
 */
export function dayHeading(dateKey, now = new Date()) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  let title
  if (dateKey === localDateKey(now.toISOString())) title = 'Aujourd’hui'
  else if (dateKey === localDateKey(yesterday.toISOString())) title = 'Hier'
  else title = capitalize(date.toLocaleDateString('fr-FR', { weekday: 'long' }))
  const opts = { day: 'numeric', month: 'long' }
  if (y !== now.getFullYear()) opts.year = 'numeric'
  return { title, date: date.toLocaleDateString('fr-FR', opts) }
}
