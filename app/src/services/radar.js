/**
 * « Radar » : repère les jours où plusieurs signaux s'écartent en même temps de
 * *votre* norme, dans un sens ou dans l'autre (D6 : aucun sens n'est « mauvais »
 * par principe). Hypothèse générale, affichée comme telle : FC repos haute, VFC
 * ou sommeil bas accompagnent souvent la fatigue, l'alcool ou une infection.
 *
 * Inspiré d'Oura Symptom/Health Radar et des travaux de Stanford sur la FC au
 * repos (Mishra et al. 2020, Nat Biomed Eng 4:1208) : un seul indicateur hors
 * norme est banal, plusieurs à la fois et sur plusieurs nuits le sont beaucoup moins.
 * Méthode, volontairement simple et explicable :
 *   - une valeur par jour : FC au repos, VFC (moyennes du jour, cf. baselines.js)
 *     et durée de sommeil de la nuit qui se termine ce jour-là ;
 *   - norme = moyenne ± ET des 60 jours qui précèdent les 3 jours évalués
 *     (≥ 14 jours par métrique ; VFC en log, comme dans baselines.js) ;
 *   - signal = écart inhabituel : |z| ≥ 1,5, avec son sens et `generalFatigue`
 *     (vrai si ce sens est celui que l'hypothèse générale associe à la fatigue) ;
 *   - jour « inhabituel » = au moins 2 signaux ;
 *   - niveau : « watch » si le dernier jour mesuré est inhabituel, « alert » si
 *     c'est le cas 2 jours de suite ou plus ; sinon « calm ».
 * C'est une observation, jamais un diagnostic : l'UI doit le dire.
 */

import { BASELINE_METRICS, dailyValues } from './baselines'
import { localDateKey } from './wellbeingSeries'
import { BEHAVIOR_TAGS, measuredTagsByDay } from './behaviorTags'
import { oneSleepSourcePerNight } from './sleepSources'

export const RADAR_DAYS = 3
export const RADAR_BASELINE_DAYS = 60
export const MIN_RADAR_BASELINE_DAYS = 14
export const MIN_SIGNALS = 2

const ASLEEP_STATES = new Set(['asleep', 'light', 'deep', 'rem'])

export const SLEEP_METRIC = {
  key: 'sleepMinutes',
  label: 'Sommeil',
  unit: 'min',
  generalHigherIsBetter: true, // hypothèse générale seulement (D6)
  log: false,
  minSd: 20,
  plausible: [60, 960],
}

export const RADAR_METRICS = [
  { ...BASELINE_METRICS.restingHeartRate, threshold: 1.5 },
  { ...BASELINE_METRICS.heartRateVariability, label: 'VFC', threshold: 1.5 },
  { ...SLEEP_METRIC, threshold: 1.5 },
]

/**
 * Durée de sommeil par nuit, rattachée au jour local du réveil.
 * Les phases (léger, profond, paradoxal, « endormi ») sont additionnées ; les éveils
 * sont ignorés ; « au lit » ne sert que si c'est le seul enregistrement de la nuit
 * (sinon il chevauche les phases et serait compté deux fois). Une seule source par nuit (sleepSources.js) :
 * montre et Health Connect ne s'additionnent jamais.
 * `phoneFallback` : une nuit sans montre prend la durée estimée par le téléphone (entrée `phone_usage`) ;
 * le Radar ne l'utilise pas (trop imprécise pour signaler un écart).
 * @returns {Map<string, number>} jour (YYYY-MM-DD) → minutes
 */
export function nightlySleep(entries, { phoneFallback = false } = {}) {
  const asleep = new Map()
  const inBed = new Map()
  const phone = new Map()
  for (const e of oneSleepSourcePerNight(entries)) {
    if (phoneFallback && e?.type === 'phone_usage') {
      const est = e.payload?.sleepEstimate
      if (e.payload?.date && Number.isFinite(est?.minutes) && est.minutes > 0) phone.set(e.payload.date, est.minutes)
      continue
    }
    if (e?.type !== 'sleep' || !e.at || e.payload?.nap) continue
    const mins = e.payload?.durationMinutes
    if (typeof mins !== 'number' || !Number.isFinite(mins) || mins <= 0) continue
    const state = e.payload?.sleepState
    const end = e.payload?.endDate || new Date(new Date(e.at).getTime() + mins * 60000).toISOString()
    const key = localDateKey(end)
    if (!state || ASLEEP_STATES.has(state)) asleep.set(key, (asleep.get(key) || 0) + mins)
    else if (state === 'inBed') inBed.set(key, (inBed.get(key) || 0) + mins)
  }
  // Nuit estimée par le téléphone (temps d'écran) : seulement les nuits sans montre.
  const out = new Map(phone)
  for (const [key, mins] of inBed) out.set(key, mins)
  for (const [key, mins] of asleep) out.set(key, mins)
  const [min, max] = SLEEP_METRIC.plausible
  for (const [key, mins] of out) if (mins < min || mins > max) out.delete(key)
  return out
}

function dayKeyOffset(now, daysBack) {
  return localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack, 12).toISOString())
}

function meanSd(values) {
  const n = values.length
  const mean = values.reduce((s, v) => s + v, 0) / n
  const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0
  return { mean, sd: Math.sqrt(variance) }
}

/**
 * @returns {{
 *   level: 'insufficient' | 'stale' | 'calm' | 'watch' | 'alert',
 *   metricsChecked: object[],
 *   streak: number,
 *   dateKey: string | null,
 *   signals: { metric: object, value: number, typical: number, z: number,
 *              direction: 'above' | 'below', generalFatigue: boolean }[],
 *   generalFatigue: boolean, tous les signaux vont dans le sens « fatigue » de l'hypothèse générale
 * }}
 */
export function computeRadar(entries, now = new Date()) {
  const series = {
    restingHeartRate: dailyValues(entries, BASELINE_METRICS.restingHeartRate),
    heartRateVariability: dailyValues(entries, BASELINE_METRICS.heartRateVariability),
    sleepMinutes: nightlySleep(entries),
  }
  const evalKeys = Array.from({ length: RADAR_DAYS }, (_, i) => dayKeyOffset(now, i)) // aujourd'hui d'abord
  const baselineEnd = evalKeys[evalKeys.length - 1]
  const baselineStart = dayKeyOffset(now, RADAR_DAYS - 1 + RADAR_BASELINE_DAYS)

  const norms = []
  for (const metric of RADAR_METRICS) {
    const fwd = metric.log ? Math.log : (v) => v
    const values = []
    for (const [key, v] of series[metric.key]) {
      if (key >= baselineStart && key < baselineEnd) values.push(fwd(v))
    }
    if (values.length < MIN_RADAR_BASELINE_DAYS) continue
    const { mean, sd } = meanSd(values)
    norms.push({ metric, fwd, mean, sd: Math.max(sd, metric.minSd), back: metric.log ? Math.exp : (v) => v })
  }

  const result = { metricsChecked: norms.map((n) => n.metric), streak: 0, dateKey: null, signals: [], generalFatigue: false }
  if (norms.length < MIN_SIGNALS) return { ...result, level: 'insufficient' }

  // Pour chaque jour évalué ayant au moins 2 métriques mesurées : ses écarts inhabituels, dans les deux sens
  const days = []
  for (const key of evalKeys) {
    let measured = 0
    const signals = []
    for (const { metric, fwd, mean, sd, back } of norms) {
      const value = series[metric.key].get(key)
      if (value == null) continue
      measured += 1
      const z = (fwd(value) - mean) / sd
      if (Math.abs(z) < metric.threshold) continue
      const direction = z > 0 ? 'above' : 'below'
      const generalFatigue = (direction === 'above') !== metric.generalHigherIsBetter
      signals.push({ metric, value, typical: back(mean), z, direction, generalFatigue })
    }
    if (measured >= MIN_SIGNALS) days.push({ key, signals })
  }
  if (days.length === 0) return { ...result, level: 'stale' }

  const latest = days[0]
  let streak = 0
  for (let i = 0; i < days.length; i++) {
    // un jour sans mesure au milieu interrompt la série
    if (days[i].key !== evalKeys[evalKeys.indexOf(latest.key) + i]) break
    if (days[i].signals.length < MIN_SIGNALS) break
    streak += 1
  }
  const level = streak >= 2 ? 'alert' : streak === 1 ? 'watch' : 'calm'
  const signals = streak > 0 ? latest.signals : []
  const generalFatigue = signals.length > 0 && signals.every((sig) => sig.generalFatigue)
  return { ...result, level, streak, dateKey: latest.key, signals, generalFatigue }
}

function prevDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10)
}

/**
 * « Radar expliqué » (journal/IDEES.md, I22) : un écart de FC repos / VFC / sommeil suit souvent
 * un verre, un sport tardif, un voyage ou un vaccin. Si l'utilisateur a noté un tel tag dans son
 * check-in le jour signalé ou la veille, le radar le dit (« probablement lié à… ») au lieu de
 * s'inquiéter — le reproche n° 1 fait aux alertes des montres. Le tag « Malade » ne l'explique pas :
 * il confirme.
 * Un check-in du soir (« Alcool » le 3) comme du lendemain matin (« Alcool » noté le 4 au réveil)
 * tombe dans la fenêtre [veille, jour] du jour signalé.
 * @param {{ level: string, dateKey: string|null, streak: number }} radar résultat de computeRadar
 * Les tags mesurés comptent aussi (séance du soir enregistrée, repas tardif noté) : ils n'ont pas à être cochés.
 * @param {object[]} wellbeingEntries check-ins (payload.tags), et les séances (`activity`) / repas (`food`)
 * @returns {null | { causes: { tag: object, dateKey: string }[], explained: boolean, sick: boolean }}
 *   `explained` : chacun des jours signalés de la série a une cause la veille ou le jour même.
 */
export function explainRadar(radar, wellbeingEntries) {
  if (!radar || (radar.level !== 'watch' && radar.level !== 'alert') || !radar.dateKey) return null
  const flaggedDays = [radar.dateKey]
  for (let i = 1; i < radar.streak; i++) flaggedDays.push(prevDateKey(flaggedDays[i - 1]))
  const window = new Set(flaggedDays.flatMap((d) => [d, prevDateKey(d)]))

  const tagsByDay = new Map()
  for (const e of wellbeingEntries || []) {
    if (e?.type !== 'wellbeing' || !e.at || !Array.isArray(e.payload?.tags)) continue
    const key = localDateKey(e.at)
    if (!window.has(key)) continue
    const set = tagsByDay.get(key) || new Set()
    for (const t of e.payload.tags) set.add(t)
    tagsByDay.set(key, set)
  }
  for (const [tagId, days] of measuredTagsByDay(wellbeingEntries || [])) {
    for (const [key, has] of days) {
      if (!has || !window.has(key)) continue
      const set = tagsByDay.get(key) || new Set()
      set.add(tagId)
      tagsByDay.set(key, set)
    }
  }

  const latest = new Map() // tag id → jour le plus récent
  for (const [key, set] of tagsByDay) {
    for (const id of set) if (!latest.has(id) || key > latest.get(id)) latest.set(id, key)
  }
  const causes = BEHAVIOR_TAGS.filter((t) => t.radarCause && latest.has(t.id)).map((tag) => ({ tag, dateKey: latest.get(tag.id) }))
  const hasCause = (day) => [day, prevDateKey(day)].some((k) => BEHAVIOR_TAGS.some((t) => t.radarCause && tagsByDay.get(k)?.has(t.id)))
  return {
    causes,
    explained: causes.length > 0 && flaggedDays.every(hasCause),
    sick: latest.has('sick'),
  }
}
