/**
 * Cycle menstruel (CYCLE-1, décision du propriétaire du 10/11) : brique partagée Android / iPhone.
 *
 * Stockage : des entrées ordinaires de la table `health_entries` (aucune migration de schéma), donc
 * comprises telles quelles par l'export et l'import JSON et par les anciennes versions de l'app.
 * - `{ type: 'cycle', payload: { subtype: 'period', flow } }` : un jour de règles (flux léger, moyen, abondant ou
 *   inconnu) ;
 * - `{ type: 'cycle', payload: { subtype: 'spotting' } }` : saignement hors des règles (ne commence pas de cycle) ;
 * - `{ type: 'cycle', payload: { subtype: 'symptom', symptom } }` : un symptôme du cycle ce jour-là
 *   (sept : crampes, douleur pelvienne, ballonnements, maux de tête, fatigue, constipation, diarrhée).
 * Les données restent sur le téléphone. Le cycle est un contexte (variable X), jamais une cause ni un diagnostic.
 */
import { localDateKey } from './analysisEngine'

export const CYCLE_TYPE = 'cycle'
/** Saisie à la main dans l'app (Health Connect aura sa propre source). */
export const CYCLE_SOURCE = 'app_cycle'

export const FLOWS = ['light', 'medium', 'heavy', 'unknown']
export const FLOW_LABELS = { light: 'flux léger', medium: 'flux moyen', heavy: 'flux abondant', unknown: null }

// Ajouts en fin de liste seulement : la minute de saisie d'un symptôme dépend de sa place (symptomEntry)
export const SYMPTOMS = ['cramps', 'pelvic_pain', 'bloating', 'headache', 'fatigue', 'constipation', 'diarrhea']
export const SYMPTOM_LABELS = {
  cramps: 'Crampes',
  pelvic_pain: 'Douleur pelvienne',
  bloating: 'Ballonnements',
  headache: 'Maux de tête',
  fatigue: 'Fatigue',
  constipation: 'Constipation',
  diarrhea: 'Diarrhée',
}

/** Jours sans règles tolérés à l'intérieur d'une même période (un jour oublié ne coupe pas les règles en deux). */
const PERIOD_GAP_DAYS = 2
/** Au-delà, le jour du cycle n'est plus affiché : il manque sans doute des règles, mieux vaut ne rien dire. */
export const MAX_CYCLE_DAY = 60

const DAY_MS = 86400000

/**
 * Midi (plus `minute`), heure locale, du jour `dateKey` (AAAA-MM-JJ), en ISO : la saisie tombe toujours sur le bon
 * jour. Chaque sous-type a sa minute : le dédoublonnage (source, date, type) de l'import garde les règles et chaque
 * symptôme d'un même jour, et ne refusera que la même saisie en double.
 */
function noonIso(dateKey, minute = 0) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d, 12, minute).toISOString()
}

/** Nombre de jours entre deux clés AAAA-MM-JJ (b − a), insensible aux changements d'heure. */
export function daysBetween(a, b) {
  const [ya, ma, da] = a.split('-').map(Number)
  const [yb, mb, db] = b.split('-').map(Number)
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / DAY_MS)
}

const isDateKey = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

/** Entrée « jour de règles » prête pour `createEntry`. */
export function periodEntry(dateKey, flow = 'unknown', source = CYCLE_SOURCE) {
  if (!isDateKey(dateKey)) throw new Error('date invalide')
  return { type: CYCLE_TYPE, source, at: noonIso(dateKey), payload: { subtype: 'period', flow: FLOWS.includes(flow) ? flow : 'unknown' } }
}

/** Entrée « saignement hors des règles ». */
export function spottingEntry(dateKey, source = CYCLE_SOURCE) {
  if (!isDateKey(dateKey)) throw new Error('date invalide')
  return { type: CYCLE_TYPE, source, at: noonIso(dateKey, 1), payload: { subtype: 'spotting' } }
}

/** Entrée « symptôme du cycle ». */
export function symptomEntry(dateKey, symptom, source = CYCLE_SOURCE) {
  if (!isDateKey(dateKey)) throw new Error('date invalide')
  if (!SYMPTOMS.includes(symptom)) throw new Error('symptôme inconnu')
  return { type: CYCLE_TYPE, source, at: noonIso(dateKey, 2 + SYMPTOMS.indexOf(symptom)), payload: { subtype: 'symptom', symptom } }
}

const stamp = (e) => e.updated_at || e.created_at || e.at || ''

/**
 * Le cycle jour par jour.
 * @param {Array<{ type: string, at: string, payload?: object }>} entries — toutes entrées confondues
 * @param {string[]} [dateKeys] — jours voulus (en plus des jours qui ont une donnée de cycle)
 * @returns {Map<string, { period: boolean, flow: string|null, periodDay: number|null, cycleDay: number|null,
 *   spotting: boolean, symptoms: string[] }>}
 */
export function cycleByDay(entries, dateKeys = []) {
  const flows = new Map() // dateKey → { flow, stamp } (la saisie la plus récente gagne)
  const spotting = new Set()
  const symptoms = new Map()
  for (const e of entries || []) {
    if (e?.type !== CYCLE_TYPE || !e.at) continue
    const key = localDateKey(e.at)
    const p = e.payload || {}
    if (p.subtype === 'period') {
      const prev = flows.get(key)
      if (!prev || stamp(e) >= prev.stamp) flows.set(key, { flow: FLOWS.includes(p.flow) ? p.flow : 'unknown', stamp: stamp(e) })
    } else if (p.subtype === 'spotting') {
      spotting.add(key)
    } else if (p.subtype === 'symptom' && SYMPTOMS.includes(p.symptom)) {
      const list = symptoms.get(key) || []
      if (!list.includes(p.symptom)) list.push(p.symptom)
      symptoms.set(key, list)
    }
  }

  // Débuts des périodes : un jour de règles sans autre jour de règles dans les PERIOD_GAP_DAYS jours d'avant
  const periodKeys = [...flows.keys()].sort()
  const starts = []
  const periodDay = new Map()
  let start = null
  let prev = null
  for (const key of periodKeys) {
    if (!prev || daysBetween(prev, key) > PERIOD_GAP_DAYS) {
      start = key
      starts.push(key)
    }
    periodDay.set(key, daysBetween(start, key) + 1)
    prev = key
  }

  const out = new Map()
  const keys = new Set([...dateKeys.filter(isDateKey), ...flows.keys(), ...spotting, ...symptoms.keys()])
  for (const key of [...keys].sort()) {
    let lastStart = null
    for (const s of starts) {
      if (s <= key) lastStart = s
      else break
    }
    const day = lastStart ? daysBetween(lastStart, key) + 1 : null
    const flow = flows.get(key)?.flow ?? null
    out.set(key, {
      period: flows.has(key),
      flow: flow && flow !== 'unknown' ? flow : null,
      periodDay: periodDay.get(key) ?? null,
      cycleDay: day && day <= MAX_CYCLE_DAY ? day : null,
      spotting: spotting.has(key),
      symptoms: symptoms.get(key) || [],
    })
  }
  return out
}

/** Le cycle a-t-il au moins une donnée ? */
export function hasCycleData(entries) {
  return (entries || []).some((e) => e?.type === CYCLE_TYPE)
}

/**
 * Rien du cycle ne s'affiche tant que « Mon cycle » n'est pas coché et qu'il n'y a aucune donnée de cycle.
 * @param {string[]} goals
 * @param {boolean} hasData
 */
export function cycleVisible(goals, hasData) {
  return Boolean(hasData) || (Array.isArray(goals) && goals.includes('cycle'))
}

/**
 * Ligne du Journal pour un jour : « Règles · 2e jour · flux moyen » (l'ordinal est rendu par <Ordinal>).
 * @returns {{ label: string, periodDay: number|null, flow: string|null }|null}
 */
export function cycleLineParts(info) {
  if (!info) return null
  if (info.period) return { label: 'Règles', periodDay: info.periodDay, flow: FLOW_LABELS[info.flow] ?? null }
  if (info.spotting) return { label: 'Saignement léger', periodDay: null, flow: null }
  return null
}
