import { describe, it, expect } from 'vitest'
import { calibrateRidge, predictCalibrated, MIN_CALIBRATION_ROWS } from './calibration'

/** Générateur pseudo-aléatoire déterministe (LCG) dans [-1, 1]. */
function noise(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return (s / 2147483648) * 2 - 1
  }
}

function sample(n, f, seed = 7) {
  const r = noise(seed)
  const X = []
  const y = []
  for (let i = 0; i < n; i++) {
    const row = [r() * 2, r() * 2]
    X.push(row)
    y.push(f(row, r))
  }
  return { X, y }
}

describe('calibrateRidge', () => {
  it('learns which direct signal follows the self-reported mood, with a range', () => {
    const { X, y } = sample(30, ([a], r) => 3 + 0.8 * a + 0.1 * r())
    const model = calibrateRidge(X, y)
    expect(model).not.toBeNull()
    expect(model.beta[1]).toBeGreaterThan(0.5)
    expect(Math.abs(model.beta[2])).toBeLessThan(0.2)
    expect(model.rmse).toBeLessThan(0.3)
    expect(predictCalibrated(model, [1, 0])).toBeCloseTo(3.8, 0)
  })

  it('refuses when the signals do not predict the notes better than their mean', () => {
    const { X, y } = sample(30, (_, r) => 3 + r(), 11)
    expect(calibrateRidge(X, y)).toBeNull()
  })

  it(`needs at least ${MIN_CALIBRATION_ROWS} rated days`, () => {
    const { X, y } = sample(MIN_CALIBRATION_ROWS - 1, ([a]) => 3 + a)
    expect(calibrateRidge(X, y)).toBeNull()
    const more = sample(MIN_CALIBRATION_ROWS, ([a]) => 3 + a)
    expect(calibrateRidge(more.X, more.y)).not.toBeNull()
  })
})
