/**
 * Validation croisée robuste aux dérives lentes (journal/IDEES.md I121). L'humeur ressemble à celle de la veille,
 * et ce que lit la caméra dérive aussi lentement pour des raisons sans rapport (lumière de saison, lunettes, coque) :
 * deux séries qui dérivent chacune de leur côté ont l'air liées bien plus souvent qu'on ne le croit. Deux parades :
 * - **par blocs** : pour prédire un jour, apprendre sans les jours à moins de `gap` jours de lui (sinon la semaine
 *   voisine, presque identique, « souffle » la réponse) ;
 * - **taille d'échantillon effective** : un z calculé comme si les jours étaient indépendants est réduit d'un
 *   facteur √((1 − a)/(1 + a)), a = produit des autocorrélations d'un jour à l'autre des deux séries (≥ 0).
 * Fonctions pures.
 */

export const BLOCK_GAP_DAYS = 7
/** En dessous, la prédiction d'un jour est la moyenne des notes d'apprentissage (pas de Ridge sur trop peu). */
export const BLOCK_MIN_TRAIN = 20

/**
 * Prédiction de y[i] par une Ridge apprise sans les lignes à ≤ `gap` jours de la ligne i.
 * @param {number[][]} X  lignes avec l'intercept en colonne 0 (non pénalisé)
 * @param {number[]} y
 * @param {number[]} dayNums  numéro de jour de chaque ligne
 * @returns {number[] | null}
 */
export function blockedRidgePredictions(X, y, dayNums, lambda, { gap = BLOCK_GAP_DAYS, minTrain = BLOCK_MIN_TRAIN } = {}) {
  const n = X.length
  if (!n || y.length !== n || dayNums.length !== n) return null
  const k = X[0].length
  // Gram et Xᵀy complets, puis retrait des lignes voisines de i : O(voisins × k²) par jour au lieu de O(n × k²).
  const G = Array.from({ length: k }, () => new Array(k).fill(0))
  const b = new Array(k).fill(0)
  let ySum = 0
  for (let r = 0; r < n; r++) {
    for (let j = 0; j < k; j++) {
      b[j] += X[r][j] * y[r]
      for (let l = 0; l < k; l++) G[j][l] += X[r][j] * X[r][l]
    }
    ySum += y[r]
  }
  const out = new Array(n)
  for (let i = 0; i < n; i++) {
    const Gi = G.map((row) => [...row])
    const bi = [...b]
    let m = n
    let yi = ySum
    for (let r = 0; r < n; r++) {
      if (Math.abs(dayNums[r] - dayNums[i]) > gap) continue
      m--
      yi -= y[r]
      for (let j = 0; j < k; j++) {
        bi[j] -= X[r][j] * y[r]
        for (let l = 0; l < k; l++) Gi[j][l] -= X[r][j] * X[r][l]
      }
    }
    if (m <= 0) return null
    if (m < minTrain) {
      out[i] = yi / m
      continue
    }
    for (let j = 1; j < k; j++) Gi[j][j] += lambda
    const beta = solve(Gi, bi)
    out[i] = beta ? X[i].reduce((s, x, j) => s + x * beta[j], 0) : yi / m
  }
  return out
}

/** Moyenne d'apprentissage par blocs (même exclusion) : la référence « sans le visage » de la calibration. */
export function blockedMeanPredictions(y, dayNums, { gap = BLOCK_GAP_DAYS } = {}) {
  return y.map((_, i) => {
    let s = 0
    let m = 0
    for (let r = 0; r < y.length; r++) {
      if (Math.abs(dayNums[r] - dayNums[i]) > gap) {
        s += y[r]
        m++
      }
    }
    return m ? s / m : null
  })
}

/** Gauss-Jordan avec pivot partiel sur la matrice augmentée [A | b]. */
function solve(A, b) {
  const k = b.length
  const M = A.map((row, j) => [...row, b[j]])
  for (let c = 0; c < k; c++) {
    let p = c
    for (let r = c + 1; r < k; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    if (Math.abs(M[p][c]) < 1e-12) return null
    ;[M[c], M[p]] = [M[p], M[c]]
    for (let r = 0; r < k; r++) {
      if (r === c) continue
      const f = M[r][c] / M[c][c]
      if (!f) continue
      for (let l = c; l <= k; l++) M[r][l] -= f * M[c][l]
    }
  }
  return M.map((row, j) => row[k] / M[j][j])
}

/**
 * Autocorrélation d'un jour au suivant, sur les paires de jours consécutifs présents (trous ignorés) ;
 * 0 avec moins de 5 paires.
 */
export function lag1Autocorrelation(values, dayNums) {
  const n = values.length
  if (n < 3) return 0
  const mean = values.reduce((s, v) => s + v, 0) / n
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  if (!(variance > 1e-12)) return 0
  const at = new Map(dayNums.map((d, i) => [d, i]))
  let s = 0
  let pairs = 0
  for (let i = 0; i < n; i++) {
    const j = at.get(dayNums[i] + 1)
    if (j == null) continue
    s += (values[i] - mean) * (values[j] - mean)
    pairs++
  }
  return pairs >= 5 ? s / pairs / variance : 0
}

/** Autocorrélation « retenue » de deux séries : a = max(0, r1(x)) × max(0, r1(y)). */
export function sharedAutocorrelation(x, y, dayNums) {
  return Math.max(0, lag1Autocorrelation(x, dayNums)) * Math.max(0, lag1Autocorrelation(y, dayNums))
}

/** z ramené à la taille d'échantillon effective : z × √((1 − a)/(1 + a)). */
export function effectiveZ(z, a) {
  const c = Math.min(Math.max(a, 0), 0.99)
  return z * Math.sqrt((1 - c) / (1 + c))
}
