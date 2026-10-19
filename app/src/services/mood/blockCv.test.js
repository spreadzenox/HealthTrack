import { describe, it, expect } from 'vitest'
import { blockedMeanPredictions, blockedRidgePredictions, effectiveZ, lag1Autocorrelation, sharedAutocorrelation } from './blockCv'

const days = (n) => Array.from({ length: n }, (_, i) => i)

describe('blockedRidgePredictions', () => {
  it('prédit un jour sans les 7 jours avant et après (une marche qui ne se voit que localement n’est pas apprise)', () => {
    // y suit x seulement par une marche : jours 0–29 à 1, jours 30–59 à 4. x = même marche.
    const n = 60
    const x = days(n).map((i) => (i < 30 ? 0 : 1))
    const y = x.map((v) => 1 + 3 * v)
    const X = x.map((v) => [1, v])
    const pred = blockedRidgePredictions(X, y, days(n), 0.1)
    expect(pred).toHaveLength(n)
    // Loin de la marche, le lien appris ailleurs suffit.
    expect(pred[0]).toBeCloseTo(1, 1)
    expect(pred[59]).toBeCloseTo(4, 1)
  })

  it('revient à la moyenne d’apprentissage avec trop peu de jours hors du bloc', () => {
    const y = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20]
    const X = y.map((v) => [1, v])
    const dayNums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 30]
    const pred = blockedRidgePredictions(X, y, dayNums, 1)
    // Jour 30 : seuls les jours 0–9 restent (10 < 20) → leur moyenne.
    expect(pred[10]).toBeCloseTo(5.5, 6)
    // Jour 0 : restent les jours 8, 9 et 30.
    expect(pred[0]).toBeCloseTo((9 + 10 + 20) / 3, 6)
  })

  it('donne la même chose que la Ridge apprise à la main sur les jours hors du bloc', () => {
    const n = 40
    const X = days(n).map((i) => [1, Math.sin(i), Math.cos(i * 0.7)])
    const y = days(n).map((i) => 2 + Math.sin(i) - 0.5 * Math.cos(i * 0.7) + 0.1 * Math.sin(i * 3.1))
    const pred = blockedRidgePredictions(X, y, days(n), 3)
    // Réponse de référence pour le jour 20 : jours 0–12 et 28–39.
    const train = days(n).filter((j) => Math.abs(j - 20) > 7)
    const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    const b = [0, 0, 0]
    for (const j of train) for (let p = 0; p < 3; p++) {
      b[p] += X[j][p] * y[j]
      for (let q = 0; q < 3; q++) A[p][q] += X[j][p] * X[j][q]
    }
    A[1][1] += 3
    A[2][2] += 3
    const beta = gauss(A, b)
    expect(pred[20]).toBeCloseTo(X[20].reduce((s, v, p) => s + v * beta[p], 0), 8)
  })
})

function gauss(A, b) {
  const M = A.map((r, i) => [...r, b[i]])
  const k = b.length
  for (let c = 0; c < k; c++) for (let r = 0; r < k; r++) {
    if (r === c) continue
    const f = M[r][c] / M[c][c]
    for (let l = c; l <= k; l++) M[r][l] -= f * M[c][l]
  }
  return M.map((r, i) => r[k] / M[i][i])
}

describe('blockedMeanPredictions', () => {
  it('moyenne des jours hors du bloc, null s’il n’y en a aucun', () => {
    expect(blockedMeanPredictions([1, 3, 10], [0, 3, 20])).toEqual([10, 10, 2])
    expect(blockedMeanPredictions([1, 3], [0, 3])).toEqual([null, null])
  })
})

describe('autocorrélation et z effectif', () => {
  it('r1 ≈ 1 pour une série lisse, ≈ −1 en dents de scie, 0 sans paires de jours consécutifs', () => {
    const smooth = days(30).map((i) => i)
    expect(lag1Autocorrelation(smooth, days(30))).toBeGreaterThan(0.85)
    const saw = days(30).map((i) => (i % 2 ? 1 : -1))
    expect(lag1Autocorrelation(saw, days(30))).toBeLessThan(-0.9)
    expect(lag1Autocorrelation(smooth, days(30).map((i) => i * 2))).toBe(0)
  })

  it('a ne retient que les autocorrélations positives des deux séries', () => {
    const smooth = days(30).map((i) => i)
    const saw = days(30).map((i) => (i % 2 ? 1 : -1))
    expect(sharedAutocorrelation(smooth, saw, days(30))).toBe(0)
    expect(sharedAutocorrelation(smooth, smooth, days(30))).toBeGreaterThan(0.7)
  })

  it('z × √((1 − a)/(1 + a)), borné', () => {
    expect(effectiveZ(4, 0)).toBe(4)
    expect(effectiveZ(4, 0.6)).toBeCloseTo(2, 6)
    expect(effectiveZ(4, -0.5)).toBe(4)
    expect(effectiveZ(4, 1)).toBeGreaterThan(0)
  })
})
