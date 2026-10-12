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
export const JOURNAL_SUMMARY_TYPES = [
  'heart_rate', 'steps', 'calories', 'sleep',
  'respiratory_rate', 'body_temperature', 'blood_pressure', 'blood_glucose', 'weather',
  'phone_usage',
]

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
    _inBed: 0,
    _dayTotals: { steps: [], calories: [] },
    _partials: { steps: 0, calories: 0 },
    _hasPartial: { steps: false, calories: false },
    _hr: [],
    _resting: [],
    _hrv: [],
    _spo2: [],
    _resp: [],
    _temp: [],
    _bp: [],
    _glucose: [],
    _wellbeing: [],
    _weather: null,
    _phone: null,
    _hasOwnData: false,
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

function phoneSleep(day) {
  const mins = day._phone?.sleepEstimate?.minutes
  return isNum(mins) && mins > 0 ? mins : null
}

function finalize(day) {
  const hr = day._hr
  const wb = day._wellbeing
  return {
    dateKey: day.dateKey,
    items: day.items.sort((a, b) => (b.at < a.at ? -1 : 1)),
    summary: {
      // « Au lit » seulement si la nuit n'a pas de phases (sinon il les chevauche)
      // À défaut de montre : nuit estimée par le téléphone (temps d'écran)
      sleepMinutes: day._sleep > 0 ? day._sleep : day._inBed > 0 ? day._inBed : phoneSleep(day),
      sleepEstimated: !(day._sleep > 0 || day._inBed > 0) && phoneSleep(day) != null,
      screenMinutes: isNum(day._phone?.screenMinutes) ? day._phone.screenMinutes : null,
      steps: dailyTotal(day, 'steps'),
      burnedKcal: isNum(dailyTotal(day, 'calories')) ? Math.round(dailyTotal(day, 'calories')) : null,
      restingHr: last(day._resting),
      hrv: last(day._hrv),
      spo2: last(day._spo2),
      respiratoryRate: day._resp.length
        ? Math.round((day._resp.reduce((a, v) => a + v, 0) / day._resp.length) * 10) / 10
        : null,
      temperatureC: last(day._temp),
      bloodPressure: last(day._bp),
      weather: day._weather,
      glucoseMgDl: last(day._glucose),
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
 * Une pesée Withings crée une entrée « poids » et une « composition corporelle » au même instant :
 * on n'en garde qu'une (la composition, avec le poids), pour ne pas afficher deux cartes.
 */
function mergeWeighIns(entries) {
  const key = (e) => `${e.source}|${e.at}`
  const weights = new Map(entries.filter((e) => e.type === 'weight').map((e) => [key(e), e]))
  const merged = new Set()
  const out = []
  for (const e of entries) {
    if (e.type === 'body_composition' && weights.has(key(e))) {
      merged.add(key(e))
      const valueKg = weights.get(key(e)).payload?.valueKg
      const hasKg = isNum(e.payload?.valueKg) || !isNum(valueKg)
      out.push(hasKg ? e : { ...e, payload: { ...e.payload, valueKg } })
    } else out.push(e)
  }
  return dropHealthConnectCopies(out.filter((e) => !(e.type === 'weight' && merged.has(key(e)))))
}

const WEIGH_IN_TYPES = new Set(['weight', 'body_composition'])
const SAME_WEIGH_IN_MS = 10 * 60 * 1000

/**
 * Withings (et d'autres balances) écrivent aussi leurs pesées dans Health Connect : la copie
 * relue par Health Connect, à quelques minutes d'une pesée importée directement, est écartée.
 */
function dropHealthConnectCopies(entries) {
  const direct = entries
    .filter((e) => WEIGH_IN_TYPES.has(e.type) && e.source !== 'health_connect')
    .map((e) => new Date(e.at).getTime())
  if (!direct.length) return entries
  return entries.filter((e) => {
    if (!WEIGH_IN_TYPES.has(e.type) || e.source !== 'health_connect') return true
    const t = new Date(e.at).getTime()
    return !direct.some((d) => Math.abs(d - t) <= SAME_WEIGH_IN_MS)
  })
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
  const sorted = mergeWeighIns((entries || []).filter((e) => e?.at)).sort((a, b) => (a.at < b.at ? -1 : 1))

  for (const e of sorted) {
    const p = e.payload || {}
    if (e.type === 'sleep') {
      const day = getDay(sleepDateKey(e))
      day._hasOwnData = true
      if (isNum(p.durationMinutes) && p.durationMinutes > 0) {
        if (!NOT_ASLEEP.has(p.sleepState)) day._sleep += p.durationMinutes
        else if (p.sleepState === 'inBed') day._inBed += p.durationMinutes
      }
      continue
    }
    const day = getDay(localDateKey(e.at))
    if (e.type === 'weather') {
      day._weather = p
      continue
    }
    if (e.type === 'phone_usage') {
      // Arrive tout seul chaque jour, comme la météo : ne fait pas apparaître une journée à lui seul.
      getDay(p.date || localDateKey(e.at))._phone = p
      continue
    }
    day._hasOwnData = true
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
      case 'respiratory_rate':
        if (isNum(p.value) && p.value > 0) day._resp.push(p.value)
        break
      case 'body_temperature':
        if (isNum(p.valueC)) day._temp.push(p.valueC)
        break
      case 'blood_pressure':
        if (isNum(p.systolic) && isNum(p.diastolic)) day._bp.push({ systolic: p.systolic, diastolic: p.diastolic })
        break
      case 'blood_glucose':
        if (isNum(p.mgDl)) day._glucose.push(p.mgDl)
        break
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

  // La météo arrive toute seule : une journée sans aucune autre donnée n'est pas affichée.
  return [...days.values()]
    .filter((d) => d._hasOwnData)
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

/**
 * Repas regroupés par jour local (page Alimentation) : le plus récent en premier, repas du soir avant
 * celui du midi, avec le total de kcal estimé du jour.
 * @param {Array<{id, at, payload?: {items?: Array}}>} meals
 * @param {{maxDays?: number}} [opts]
 * @returns {Array<{dateKey: string, meals: Array, kcal: number}>}
 */
export function groupMealsByDay(meals, { maxDays = Infinity } = {}) {
  const days = new Map()
  for (const m of meals) {
    if (Number.isNaN(new Date(m.at).getTime())) continue
    const key = localDateKey(m.at)
    if (!days.has(key)) days.set(key, { dateKey: key, meals: [], kcal: 0 })
    const day = days.get(key)
    day.meals.push(m)
    day.kcal += mealKcal(m.payload?.items)
  }
  return [...days.values()]
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
    .slice(0, maxDays)
    .map((d) => ({ ...d, meals: d.meals.sort((a, b) => new Date(b.at) - new Date(a.at)) }))
}
