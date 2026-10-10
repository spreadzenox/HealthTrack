import { describe, it, expect } from 'vitest'
import {
  normalCdf,
  lag1Autocorrelation,
  effectiveSampleSize,
  correlationPValue,
  benjaminiHochberg,
  correlationStrength,
  evidenceLevel,
  isWeekendKey,
  residualizeByGroup,
} from './statistics'

describe('normalCdf', () => {
  it('matches reference values of the standard normal distribution', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6)
    expect(normalCdf(1.959964)).toBeCloseTo(0.975, 4)
    expect(normalCdf(-1.959964)).toBeCloseTo(0.025, 4)
    expect(normalCdf(3)).toBeCloseTo(0.99865, 4)
  })
})

describe('lag1Autocorrelation', () => {
  it('is close to 1 for a smooth trend and negative for an alternating series', () => {
    const trend = Array.from({ length: 30 }, (_, i) => i)
    const alternating = Array.from({ length: 30 }, (_, i) => (i % 2 ? 1 : -1))
    expect(lag1Autocorrelation(trend)).toBeGreaterThan(0.85)
    expect(lag1Autocorrelation(alternating)).toBeLessThan(-0.9)
  })

  it('returns 0 for constant or too-short series', () => {
    expect(lag1Autocorrelation([3, 3, 3, 3])).toBe(0)
    expect(lag1Autocorrelation([1, 2])).toBe(0)
  })
})

describe('effectiveSampleSize', () => {
  it('equals n when series are not autocorrelated', () => {
    const x = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1]
    const y = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    // Opposite-sign autocorrelations never inflate n beyond the real count
    expect(effectiveSampleSize(x, y)).toBe(x.length)
  })

  it('is much smaller than n when both series are smooth trends', () => {
    const x = Array.from({ length: 40 }, (_, i) => i)
    const y = Array.from({ length: 40 }, (_, i) => i * 0.5 + 3)
    const nEff = effectiveSampleSize(x, y)
    expect(nEff).toBeLessThan(10)
    expect(nEff).toBeGreaterThanOrEqual(3)
  })
})

describe('correlationPValue', () => {
  it('gives p ≈ 1 for r = 0 and a small p for a strong correlation on many points', () => {
    expect(correlationPValue(0, 30)).toBeCloseTo(1, 6)
    expect(correlationPValue(0.6, 60)).toBeLessThan(0.001)
  })

  it('a moderate r on few points is not significant', () => {
    expect(correlationPValue(0.4, 8)).toBeGreaterThan(0.2)
  })

  it('is symmetric in the sign of r and returns 1 when n is too small', () => {
    expect(correlationPValue(-0.5, 20)).toBeCloseTo(correlationPValue(0.5, 20), 10)
    expect(correlationPValue(0.9, 3)).toBe(1)
  })

  it('handles |r| = 1 without returning NaN', () => {
    const p = correlationPValue(1, 10)
    expect(Number.isNaN(p)).toBe(false)
    expect(p).toBeLessThan(0.001)
  })
})

describe('benjaminiHochberg', () => {
  it('matches the textbook example and keeps the input order', () => {
    // p-values from Benjamini & Hochberg (1995) style example
    const p = [0.01, 0.04, 0.03, 0.005]
    const q = benjaminiHochberg(p)
    // sorted: 0.005*4/1=0.02, 0.01*4/2=0.02, 0.03*4/3=0.04, 0.04*4/4=0.04
    expect(q[3]).toBeCloseTo(0.02, 10)
    expect(q[0]).toBeCloseTo(0.02, 10)
    expect(q[2]).toBeCloseTo(0.04, 10)
    expect(q[1]).toBeCloseTo(0.04, 10)
  })

  it('is monotone and capped at 1', () => {
    const q = benjaminiHochberg([0.9, 0.8, 0.95])
    for (const v of q) expect(v).toBeLessThanOrEqual(1)
    expect(q[0]).toBeCloseTo(0.95, 10)
  })

  it('returns an empty array for no tests', () => {
    expect(benjaminiHochberg([])).toEqual([])
  })
})

describe('correlationStrength', () => {
  it('classifies |r| with conventional thresholds', () => {
    expect(correlationStrength(0.05)).toBe('négligeable')
    expect(correlationStrength(-0.2)).toBe('faible')
    expect(correlationStrength(0.35)).toBe('modéré')
    expect(correlationStrength(-0.7)).toBe('fort')
  })
})

describe('evidenceLevel', () => {
  it('maps the adjusted p-value to a confidence level', () => {
    expect(evidenceLevel(0.01)).toBe('solide')
    expect(evidenceLevel(0.1)).toBe('à confirmer')
    expect(evidenceLevel(0.5)).toBe('incertain')
  })
})

describe('isWeekendKey', () => {
  it('is true for Saturday and Sunday only', () => {
    expect(isWeekendKey('2026-10-10')).toBe(true) // samedi
    expect(isWeekendKey('2026-10-11')).toBe(true) // dimanche
    expect(isWeekendKey('2026-10-12')).toBe(false) // lundi
    expect(isWeekendKey('2026-10-09')).toBe(false) // vendredi
  })
})

describe('residualizeByGroup', () => {
  it('subtracts the mean of each group', () => {
    expect(residualizeByGroup([1, 3, 10, 14], [0, 0, 1, 1])).toEqual([-1, 1, -2, 2])
  })

  it('removes a pure group effect entirely', () => {
    const res = residualizeByGroup([5, 5, 2, 2], [1, 1, 0, 0])
    expect(res.every((v) => v === 0)).toBe(true)
  })
})
