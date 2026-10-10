import { describe, it, expect } from 'vitest'
import { buildDailyDataset } from './analysisEngine'
import {
  computeLaggedEffects,
  shiftDateKey,
  LAGS,
  LAGGED_KEYS,
  MIN_LAG_PAIRS,
} from './laggedEffects'
import { residualize } from './statistics'

// Deterministic PRNG so the tests never flake.
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function dateKey(i) {
  return new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)
}

const wellbeing = (dk, score) => ({ type: 'wellbeing', source: 'app_wellbeing', at: `${dk}T20:00:00Z`, payload: { score } })
const steps = (dk, value) => ({ type: 'steps', source: 'health_connect', at: `${dk}T22:00:00Z`, payload: { value } })

/**
 * `days` days of steps; wellbeing = f(steps `lag` days before) + noise.
 * lag = null → wellbeing independent of steps.
 */
function makeEntries({ days = 60, lag = 1, effect = 1, seed = 7, skipWellbeing = () => false } = {}) {
  const rand = mulberry32(seed)
  const stepSeries = Array.from({ length: days }, () => Math.round(4000 + rand() * 8000))
  const entries = []
  for (let i = 0; i < days; i++) {
    const dk = dateKey(i)
    entries.push(steps(dk, stepSeries[i]))
    const src = lag != null && i - lag >= 0 ? stepSeries[i - lag] : 8000
    const score = 2.5 + (lag != null ? (effect * (src - 8000)) / 2500 : 0) + (rand() - 0.5) * 1.2
    if (!skipWellbeing(i)) entries.push(wellbeing(dk, Math.round(score * 10) / 10))
  }
  return entries
}

describe('shiftDateKey', () => {
  it('moves a date key across month boundaries', () => {
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDateKey('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('residualize', () => {
  it('removes the linear part explained by the covariates', () => {
    const x = [1, 2, 3, 4, 5, 6]
    const y = x.map((v) => 3 + 2 * v)
    const { residuals, used } = residualize(y, [x])
    expect(used).toBe(1)
    residuals.forEach((r) => expect(Math.abs(r)).toBeLessThan(1e-9))
  })

  it('skips a covariate that is constant or redundant', () => {
    const y = [1, 3, 2, 5, 4]
    const { used } = residualize(y, [[2, 2, 2, 2, 2], [1, 2, 3, 4, 5], [2, 4, 6, 8, 10]])
    expect(used).toBe(1)
  })
})

describe('buildDailyDataset — days without wellbeing', () => {
  it('keeps them (wellbeing null) only when asked', () => {
    const entries = [steps('2026-01-01', 5000), steps('2026-01-02', 6000), wellbeing('2026-01-02', 3)]
    expect(buildDailyDataset(entries)).toHaveLength(1)
    const all = buildDailyDataset(entries, { includeDaysWithoutWellbeing: true })
    expect(all.map((d) => d.dateKey)).toEqual(['2026-01-01', '2026-01-02'])
    expect(all[0].wellbeing).toBeNull()
    expect(all[0].steps).toBe(5000)
  })
})

describe('computeLaggedEffects', () => {
  it('needs enough consecutive days', () => {
    const result = computeLaggedEffects(makeEntries({ days: 8 }))
    expect(result.status).toBe('not_enough_data')
    expect(result.minDays).toBe(MIN_LAG_PAIRS)
  })

  it('finds the day-before effect of steps, with its lag, sign and size', () => {
    const result = computeLaggedEffects(makeEntries({ days: 60, lag: 1 }))
    expect(result.status).toBe('ok')
    const stepsEffect = result.effects.find((e) => e.variable === 'steps')
    expect(stepsEffect).toBeDefined()
    expect(stepsEffect.lag).toBe(1)
    expect(stepsEffect.r).toBeGreaterThan(0.5)
    expect(stepsEffect.evidence).toBe('solide')
    // ~+1 point per 2 500 steps; one usual deviation (≈ 2 300 steps) → ≈ +0,9 point.
    expect(stepsEffect.effectPerSd).toBeGreaterThan(0.6)
    expect(stepsEffect.effectPerSd).toBeLessThan(1.3)
    expect(stepsEffect.sd).toBeGreaterThan(1500)
    expect(stepsEffect.action).toMatch(/Marcher/)
  })

  it('finds a 2-day lag', () => {
    const result = computeLaggedEffects(makeEntries({ days: 70, lag: 2 }))
    const stepsEffect = result.effects.find((e) => e.variable === 'steps')
    expect(stepsEffect?.lag).toBe(2)
  })

  it('reports nothing when wellbeing does not depend on the past', () => {
    const result = computeLaggedEffects(makeEntries({ days: 60, lag: null }))
    expect(result.status).toBe('ok')
    expect(result.effects).toEqual([])
    expect(result.tested).toContain('steps')
  })

  it('does not credit yesterday for what happened today (same-day effect only)', () => {
    const result = computeLaggedEffects(makeEntries({ days: 60, lag: 0 }))
    expect(result.effects).toEqual([])
  })

  it('does not mistake a regular habit for a delayed effect (same-day value controlled)', () => {
    // Steps are autocorrelated (similar from one day to the next) and act on the same day only.
    const rand = mulberry32(11)
    const entries = []
    let s = 8000
    for (let i = 0; i < 90; i++) {
      const dk = dateKey(i)
      s = 8000 + 0.85 * (s - 8000) + (rand() - 0.5) * 4000
      entries.push(steps(dk, Math.round(s)))
      entries.push(wellbeing(dk, Math.round((2.5 + (s - 8000) / 2000 + (rand() - 0.5) * 1.2) * 10) / 10))
    }
    expect(computeLaggedEffects(entries).effects).toEqual([])
  })

  it('uses source days without a wellbeing score for lags ≥ 2', () => {
    // Every 3rd day has no score: lag-2 sources are often such days.
    const entries = makeEntries({ days: 90, lag: 2, skipWellbeing: (i) => i % 3 === 0 })
    const stepsEffect = computeLaggedEffects(entries).effects.find((e) => e.variable === 'steps')
    expect(stepsEffect?.lag).toBe(2)
  })

  it('controls for the previous day wellbeing (a good mood that simply lasts)', () => {
    // Mood persists from day to day and makes one walk more the same day;
    // steps have no effect of their own on the following days.
    const rand = mulberry32(3)
    const entries = []
    let mood = 2.5
    for (let i = 0; i < 80; i++) {
      const dk = dateKey(i)
      mood = 2.5 + 0.8 * (mood - 2.5) + (rand() - 0.5) * 1.6
      entries.push(wellbeing(dk, Math.round(mood * 10) / 10))
      entries.push(steps(dk, Math.round(8000 + (mood - 2.5) * 3000 + (rand() - 0.5) * 1000)))
    }
    const result = computeLaggedEffects(entries)
    expect(result.effects.find((e) => e.variable === 'steps')).toBeUndefined()
  })

  it('only tests lifestyle levers, never constant series', () => {
    const result = computeLaggedEffects(makeEntries({ days: 40 }))
    expect(result.tested).toEqual(['steps'])
    for (const key of result.tested) expect(LAGGED_KEYS).toContain(key)
    expect(LAGS).toEqual([1, 2, 3])
  })
})
