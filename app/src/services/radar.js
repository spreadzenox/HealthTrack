/**
 * « Radar » : repère les jours où plusieurs signaux s'écartent en même temps,
 * dans le mauvais sens, de *votre* norme — ce qui accompagne souvent la fatigue,
 * le surmenage, l'alcool ou le début d'une infection.
 *
 * Inspiré d'Oura Symptom/Health Radar et des travaux de Stanford sur la FC au
 * repos (Mishra et al. 2020, Nat Biomed Eng 4:1208) : un seul indicateur hors
 * norme est banal, plusieurs à la fois et sur plusieurs nuits le sont beaucoup moins.
 * Méthode, volontairement simple et explicable :
 *   - une valeur par jour : FC au repos, VFC (moyennes du jour, cf. baselines.js)
 *     et durée de sommeil de la nuit qui se termine ce jour-là ;
 *   - norme = moyenne ± ET des 60 jours qui précèdent les 3 jours évalués
 *     (≥ 14 jours par métrique ; VFC en log, comme dans baselines.js) ;
 *   - signal = écart défavorable : FC repos z ≥ +1,5, VFC z ≤ −1,5, sommeil z ≤ −1,5 ;
 *   - jour « inhabituel » = au moins 2 signaux ;
 *   - niveau : « watch » si le dernier jour mesuré est inhabituel, « alert » si
 *     c'est le cas 2 jours de suite ou plus ; sinon « calm ».
 * C'est une observation, jamais un diagnostic : l'UI doit le dire.
 */

import { BASELINE_METRICS, dailyValues } from './baselines'
import { localDateKey } from './wellbeingSeries'

export const RADAR_DAYS = 3
export const RADAR_BASELINE_DAYS = 60
export const MIN_RADAR_BASELINE_DAYS = 14
export const MIN_SIGNALS = 2

const ASLEEP_STATES = new Set(['asleep', 'light', 'deep', 'rem'])

export const SLEEP_METRIC = {
  key: 'sleepMinutes',
  label: 'Sommeil',
  unit: 'min',
  higherIsBetter: true,
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
 * (sinon il chevauche les phases et serait compté deux fois).
 * @returns {Map<string, number>} jour (YYYY-MM-DD) → minutes
 */
export function nightlySleep(entries) {
  const asleep = new Map()
  const inBed = new Map()
  for (const e of entries || []) {
    if (e?.type !== 'sleep' || !e.at) continue
    const mins = e.payload?.durationMinutes
    if (typeof mins !== 'number' || !Number.isFinite(mins) || mins <= 0) continue
    const state = e.payload?.sleepState
    const end = e.payload?.endDate || new Date(new Date(e.at).getTime() + mins * 60000).toISOString()
    const key = localDateKey(end)
    if (!state || ASLEEP_STATES.has(state)) asleep.set(key, (asleep.get(key) || 0) + mins)
    else if (state === 'inBed') inBed.set(key, (inBed.get(key) || 0) + mins)
  }
  const out = new Map(inBed)
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
 *   signals: { metric: object, value: number, typical: number, z: number }[],
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

  const result = { metricsChecked: norms.map((n) => n.metric), streak: 0, dateKey: null, signals: [] }
  if (norms.length < MIN_SIGNALS) return { ...result, level: 'insufficient' }

  // Pour chaque jour évalué ayant au moins 2 métriques mesurées : ses signaux défavorables
  const days = []
  for (const key of evalKeys) {
    let measured = 0
    const signals = []
    for (const { metric, fwd, mean, sd, back } of norms) {
      const value = series[metric.key].get(key)
      if (value == null) continue
      measured += 1
      const z = (fwd(value) - mean) / sd
      const unfavourable = metric.higherIsBetter ? z <= -metric.threshold : z >= metric.threshold
      if (unfavourable) signals.push({ metric, value, typical: back(mean), z })
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
  return { ...result, level, streak, dateKey: latest.key, signals: streak > 0 ? latest.signals : [] }
}
