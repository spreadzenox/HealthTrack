/**
 * Calibration personnelle d'un estimateur d'humeur sur les notes que l'utilisateur donne lui-même :
 * régression Ridge des notes sur des signaux directs (colonnes de X, sans intercept), λ choisi par
 * validation croisée (LOO). Gardée seulement si elle prédit les notes mises de côté au moins 10 %
 * mieux que la moyenne des notes ; sinon null (l'app ne prétend pas savoir).
 *
 * Extraite de l'ancien « Humeur estimée » (retiré : ses entrées étaient des comportements, cf.
 * `estimatorInputs.js`) pour servir aux signaux visage / voix (chantier D4).
 */
import { olsNormalEquations, ridgeLooPredictions, RIDGE_LAMBDAS } from '../analysisEngine'

export const MIN_CALIBRATION_ROWS = 14
const MIN_LOO_GAIN = 0.1

function meanSd(values) {
  const n = values.length
  const mean = values.reduce((s, v) => s + v, 0) / n
  const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0
  return { mean, sd: Math.sqrt(variance) }
}

/**
 * @param {number[][]} X  une ligne par jour noté, une colonne par signal direct
 * @param {number[]} y    notes de bien-être de ces jours
 * @returns {{ beta: number[], lambda: number, rmse: number, yMean: number, ySd: number } | null}
 *   beta[0] = intercept, beta[j + 1] = poids de la colonne j ; rmse = erreur LOO.
 */
export function calibrateRidge(X, y) {
  const n = y.length
  if (n < MIN_CALIBRATION_ROWS || X.length !== n) return null
  const design = X.map((row) => [1, ...row])
  const { mean: yMean, sd: ySd } = meanSd(y)
  // LOO de la moyenne seule : (y_i − ȳ) · n / (n − 1)
  const meanMse = y.reduce((t, v) => t + ((v - yMean) * n / (n - 1)) ** 2, 0) / n
  let best = null
  for (const lambda of RIDGE_LAMBDAS) {
    const loo = ridgeLooPredictions(design, y, lambda)
    if (!loo) continue
    const mse = loo.reduce((t, p, i) => t + (y[i] - p) ** 2, 0) / n
    if (!best || mse < best.mse) best = { lambda, mse }
  }
  if (!best || meanMse <= 0 || best.mse > (1 - MIN_LOO_GAIN) * meanMse) return null
  const beta = olsNormalEquations(design, y, best.lambda)
  if (!beta) return null
  return { beta, lambda: best.lambda, rmse: Math.sqrt(best.mse), yMean, ySd: Math.max(ySd, 0.1) }
}

/** Note estimée pour une ligne de signaux (mêmes colonnes que la calibration). */
export function predictCalibrated(model, row) {
  return row.reduce((t, x, j) => t + x * model.beta[j + 1], model.beta[0])
}
