/**
 * « Humeur estimée » : où en êtes-vous par rapport à *votre* habitude, sans rien saisir ?
 *
 * Inspiré d'Emobot (estimation passive de l'humeur, seuil de 7 jours de données) et de
 * Sahha (score « bien-être mental » = écart de signaux passifs à la norme personnelle).
 * Méthode, volontairement simple et explicable :
 *   - signaux du jour J : sommeil de la nuit qui se termine à J (montre, sinon téléphone),
 *     VFC et FC au repos de J, pas de la veille (journée complète : ceux du jour ne sont
 *     pas finis), écran tard de la soirée qui précède J (téléphone) ;
 *   - norme = moyenne ± ET des 28 jours précédant J (≥ 7 jours par signal ; VFC en log) ;
 *   - score d'un signal = écart à la norme en ET, orienté pour que + soit favorable,
 *     borné à ± 3 ; il faut au moins 2 signaux un jour donné ;
 *   - indice = moyenne des scores : « dans votre plage habituelle » entre −0,75 et +0,75 ;
 *   - calibration (≥ 14 jours avec une note de bien-être) : régression Ridge des notes sur
 *     les scores, λ choisi par validation croisée (LOO) ; gardée seulement si elle prédit
 *     les notes mises de côté au moins 10 % mieux que votre moyenne. Elle donne alors une
 *     note estimée sur 5 avec une fourchette (± 1,28 erreur LOO ≈ 80 %) et les signaux qui
 *     comptent le plus pour vous.
 * Une estimation, jamais un diagnostic : l'UI doit le dire.
 *
 * ⚠️ N'est plus affiché depuis le 12/10/2026 (passe de nettoyage) : il doublait la « Prédiction du
 * jour » et ses entrées sont des comportements (sommeil, pas, écran…) — contraire à la règle
 * anti-circularité du propriétaire (Y = humeur estimée seulement par des signaux émotionnels directs :
 * visage, voix, auto-déclaration ; X = comportements). Conservé pour sa calibration (Ridge + garde-fou
 * LOO), réutilisable quand les signaux directs (chantier D4) existeront.
 */

import { buildDailyDataset, olsNormalEquations, ridgeLooPredictions, RIDGE_LAMBDAS } from './analysisEngine'
import { localDateKey } from './wellbeingSeries'
import { nightlySleep } from './radar'

export const MOOD_NORM_DAYS = 28
export const MIN_NORM_DAYS = 7
export const MIN_SIGNALS = 2
export const MIN_CALIBRATION_DAYS = 14
export const CALIBRATION_WINDOW_DAYS = 90
export const BAND_THRESHOLD = 0.75
const CALIBRATED_BAND_SD = 0.5
const Z_CLAMP = 3
const MIN_LOO_GAIN = 0.1
const RANGE_Z = 1.28
/** Estimation « bas » durable : au moins 10 jours bas parmi les 14 derniers. */
export const PERSISTENT_DAYS = 14
export const PERSISTENT_MIN_LOW = 10

export const MOOD_SIGNALS = [
  { key: 'sleepMinutes', column: 'sleepMinutes', label: 'Sommeil', unit: 'min', higherIsBetter: true, log: false, minSd: 20 },
  { key: 'heartRateVariability', column: 'hrv_ms', label: 'VFC', unit: 'ms', higherIsBetter: true, log: true, minSd: 0.05 },
  { key: 'restingHeartRate', column: 'restingHR', label: 'FC au repos', unit: 'bpm', higherIsBetter: false, log: false, minSd: 1 },
  { key: 'steps', column: 'steps', label: 'Pas (veille)', unit: 'pas', higherIsBetter: true, log: false, minSd: 500, previousDay: true },
  { key: 'screenLateMinutes', column: 'screen_late_minutes', label: 'Écran tard', unit: 'min', higherIsBetter: false, log: false, minSd: 10 },
]

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

function dayKey(base, offset) {
  const [y, m, d] = base.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d + offset, 12).toISOString())
}

function meanSd(values) {
  const n = values.length
  const mean = values.reduce((s, v) => s + v, 0) / n
  const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0
  return { mean, sd: Math.sqrt(variance) }
}

/** Série jour → valeur d'un signal (les pas de la veille sont décalés d'un jour). */
function signalSeries(rows, signal) {
  const out = new Map()
  for (const row of rows) {
    const v = row[signal.column]
    if (!isNum(v)) continue
    if (signal.log && v <= 0) continue
    out.set(signal.previousDay ? dayKey(row.dateKey, 1) : row.dateKey, v)
  }
  return out
}

/** Scores (écart orienté, en ET) d'un jour, pour chaque signal qui a une norme. */
function scoresOn(dateKey, series) {
  const signals = []
  for (const signal of MOOD_SIGNALS) {
    const s = series[signal.key]
    const v = s.get(dateKey)
    if (!isNum(v)) continue
    const fwd = signal.log ? Math.log : (x) => x
    const norm = []
    for (let i = 1; i <= MOOD_NORM_DAYS; i++) {
      const x = s.get(dayKey(dateKey, -i))
      if (isNum(x)) norm.push(fwd(x))
    }
    if (norm.length < MIN_NORM_DAYS) continue
    const { mean, sd: rawSd } = meanSd(norm)
    const sd = Math.max(rawSd, signal.minSd)
    const z = Math.max(-Z_CLAMP, Math.min(Z_CLAMP, (fwd(v) - mean) / sd))
    signals.push({
      key: signal.key,
      label: signal.label,
      unit: signal.unit,
      value: v,
      typical: signal.log ? Math.exp(mean) : mean,
      score: signal.higherIsBetter ? z : -z,
    })
  }
  if (signals.length < MIN_SIGNALS) return null
  return { signals, index: signals.reduce((t, s) => t + s.score, 0) / signals.length }
}

function designRow(day) {
  const byKey = Object.fromEntries(day.signals.map((s) => [s.key, s.score]))
  return [1, ...MOOD_SIGNALS.map((s) => byKey[s.key] ?? 0)]
}

/** Ridge des notes sur les scores ; null si elle ne prédit pas mieux que la moyenne. */
function calibrate(rows) {
  const y = rows.map((r) => r.wellbeing)
  const X = rows.map((r) => designRow(r.day))
  const n = y.length
  const { mean: yMean, sd: ySd } = meanSd(y)
  // LOO de la moyenne seule : (y_i − ȳ) · n / (n − 1)
  const meanMse = y.reduce((t, v) => t + ((v - yMean) * n / (n - 1)) ** 2, 0) / n
  let best = null
  for (const lambda of RIDGE_LAMBDAS) {
    const loo = ridgeLooPredictions(X, y, lambda)
    if (!loo) continue
    const mse = loo.reduce((t, p, i) => t + (y[i] - p) ** 2, 0) / n
    if (!best || mse < best.mse) best = { lambda, mse }
  }
  if (!best || meanMse <= 0 || best.mse > (1 - MIN_LOO_GAIN) * meanMse) return null
  const beta = olsNormalEquations(X, y, best.lambda)
  if (!beta) return null
  return { beta, rmse: Math.sqrt(best.mse), yMean, ySd: Math.max(ySd, 0.1) }
}

function predict(model, day) {
  return designRow(day).reduce((t, x, j) => t + x * model.beta[j], 0)
}

function bandOf(day, model) {
  if (model) {
    const dev = (predict(model, day) - model.yMean) / model.ySd
    return dev > CALIBRATED_BAND_SD ? 'above' : dev < -CALIBRATED_BAND_SD ? 'below' : 'within'
  }
  return day.index > BAND_THRESHOLD ? 'above' : day.index < -BAND_THRESHOLD ? 'below' : 'within'
}

const clamp5 = (v) => Math.max(0, Math.min(5, v))

/**
 * @returns {{
 *   status: 'empty' | 'insufficient' | 'stale' | 'ok',
 *   measuredDays?: number, neededDays?: number,
 *   dateKey?: string, index?: number, band?: 'within' | 'above' | 'below',
 *   signals?: { key, label, unit, value, typical, score }[],
 *   checkInDays?: number, calibrated?: boolean,
 *   estimate?: number, low?: number, high?: number, topSignals?: string[],
 *   persistentLow?: boolean,
 * }}
 */
export function computeMoodEstimate(entries, now = new Date()) {
  const rows = buildDailyDataset(entries || [], { includeDaysWithoutWellbeing: true })
  const series = Object.fromEntries(MOOD_SIGNALS.map((s) => [s.key, signalSeries(rows, s)]))
  // Une nuit compte même si le jour du réveil n'a encore aucune autre entrée.
  series.sleepMinutes = nightlySleep(entries || [], { phoneFallback: true })
  const today = localDateKey(now.toISOString())

  const measured = new Set()
  for (const s of Object.values(series)) for (const k of s.keys()) if (k <= today) measured.add(k)
  if (measured.size === 0) return { status: 'empty' }

  // Indices des jours récents (persistance) et de la fenêtre de calibration
  const days = new Map()
  for (let i = 0; i < CALIBRATION_WINDOW_DAYS; i++) {
    const key = dayKey(today, -i)
    const day = scoresOn(key, series)
    if (day) days.set(key, day)
  }
  if (days.size === 0) {
    return { status: 'insufficient', measuredDays: measured.size, neededDays: MIN_NORM_DAYS + 1 }
  }

  const latestKey = [...days.keys()].sort().pop()
  if (latestKey < dayKey(today, -1)) return { status: 'stale', dateKey: latestKey, measuredDays: measured.size }
  const latest = days.get(latestKey)

  const training = rows
    .filter((r) => isNum(r.wellbeing) && days.has(r.dateKey))
    .map((r) => ({ wellbeing: r.wellbeing, day: days.get(r.dateKey) }))
  const model = training.length >= MIN_CALIBRATION_DAYS ? calibrate(training) : null

  const recent = []
  for (let i = 0; i < PERSISTENT_DAYS; i++) {
    const d = days.get(dayKey(today, -i))
    if (d) recent.push(bandOf(d, model))
  }
  const persistentLow = recent.filter((b) => b === 'below').length >= PERSISTENT_MIN_LOW

  const result = {
    status: 'ok',
    dateKey: latestKey,
    index: latest.index,
    band: bandOf(latest, model),
    signals: latest.signals,
    checkInDays: training.length,
    calibrated: Boolean(model),
    persistentLow,
  }
  if (model) {
    const estimate = predict(model, latest)
    result.estimate = clamp5(estimate)
    result.low = clamp5(estimate - RANGE_Z * model.rmse)
    result.high = clamp5(estimate + RANGE_Z * model.rmse)
    result.topSignals = MOOD_SIGNALS
      .map((s, j) => ({ key: s.key, b: model.beta[j + 1] }))
      .filter((s) => s.b > 0.05)
      .sort((a, b) => b.b - a.b)
      .map((s) => s.key)
  }
  return result
}
