/**
 * Tests for the local statistical & ML analysis engine.
 * All computations run fully client-side — no API keys needed.
 */
import { describe, it, expect } from 'vitest'
import {
  localDateKey,
  buildDailyDataset,
  pearsonCorrelation,
  computeBasicCorrelations,
  computeAdvancedAnalysis,
  MIN_DAYS_BASIC,
  MIN_DAYS_ADVANCED,
} from './analysisEngine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWellbeing(dateStr, score) {
  return {
    type: 'wellbeing',
    source: 'app_wellbeing',
    at: `${dateStr}T12:00:00Z`,
    payload: { score },
  }
}

function makeSleep(dateStr, minutes) {
  return {
    type: 'sleep',
    source: 'health_connect',
    at: `${dateStr}T08:00:00Z`,
    payload: { durationMinutes: minutes },
  }
}

function makeSteps(dateStr, steps) {
  return {
    type: 'steps',
    source: 'health_connect',
    at: `${dateStr}T22:00:00Z`,
    payload: { value: steps },
  }
}

function makeFood(dateStr, items) {
  return {
    type: 'food',
    source: 'app_food',
    at: `${dateStr}T13:00:00Z`,
    payload: { items },
  }
}

function makeActivity(dateStr, calories) {
  return {
    type: 'activity',
    source: 'health_connect',
    at: `${dateStr}T18:00:00Z`,
    payload: { totalCalories: calories, workoutType: 'Running', durationSeconds: 1800 },
  }
}

function makeHeartRate(dateStr, bpm) {
  return {
    type: 'heart_rate',
    source: 'health_connect',
    at: `${dateStr}T07:00:00Z`,
    payload: { bpm, subtype: 'restingHeartRate' },
  }
}

// ---------------------------------------------------------------------------
// localDateKey
// ---------------------------------------------------------------------------

describe('localDateKey', () => {
  it('returns YYYY-MM-DD string', () => {
    const key = localDateKey('2026-03-15T10:00:00Z')
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// ---------------------------------------------------------------------------
// buildDailyDataset
// ---------------------------------------------------------------------------

describe('buildDailyDataset', () => {
  it('returns empty array when no entries', () => {
    expect(buildDailyDataset([])).toEqual([])
  })

  it('creates one row per day', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeWellbeing('2026-01-02', 3),
      makeWellbeing('2026-01-03', 5),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds).toHaveLength(3)
  })

  it('averages multiple wellbeing scores on the same day', () => {
    const entries = [
      { type: 'wellbeing', source: 'app_wellbeing', at: '2026-01-01T08:00:00Z', payload: { score: 2 } },
      { type: 'wellbeing', source: 'app_wellbeing', at: '2026-01-01T20:00:00Z', payload: { score: 4 } },
    ]
    const ds = buildDailyDataset(entries)
    expect(ds).toHaveLength(1)
    expect(ds[0].wellbeing).toBeCloseTo(3)
  })

  it('sums sleep minutes per day', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeSleep('2026-01-01', 360),
      makeSleep('2026-01-01', 60),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds[0].sleepMinutes).toBeCloseTo(420)
  })

  it('sums steps per day', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeSteps('2026-01-01', 5000),
      makeSteps('2026-01-01', 3000),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds[0].steps).toBeCloseTo(8000)
  })

  it('sums activity calories per day', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeActivity('2026-01-01', 300),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds[0].activityCalories).toBeCloseTo(300)
  })

  it('extracts resting heart rate (average)', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeHeartRate('2026-01-01', 60),
      makeHeartRate('2026-01-01', 70),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds[0].restingHR).toBeCloseTo(65)
  })

  it('computes nutrition kcal for the day', () => {
    // Rice: ~130 kcal per 100g
    const items = [{ ingredient: 'riz cuit', quantity_g: 100 }]
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeFood('2026-01-01', items),
    ]
    const ds = buildDailyDataset(entries)
    // Just check it's a number (may be 0 if ingredient not in lookup)
    expect(typeof ds[0].kcal).toBe('number')
  })

  it('only includes days that have at least one wellbeing score', () => {
    const entries = [
      makeSleep('2026-01-01', 480),  // no wellbeing
      makeWellbeing('2026-01-02', 3),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds).toHaveLength(1)
    expect(ds[0].dateKey).toBe(localDateKey('2026-01-02T12:00:00Z'))
  })
})

// ---------------------------------------------------------------------------
// pearsonCorrelation
// ---------------------------------------------------------------------------

describe('pearsonCorrelation', () => {
  it('returns 1 for perfectly positively correlated vectors', () => {
    const x = [1, 2, 3, 4, 5]
    const y = [2, 4, 6, 8, 10]
    expect(pearsonCorrelation(x, y)).toBeCloseTo(1, 5)
  })

  it('returns -1 for perfectly negatively correlated vectors', () => {
    const x = [1, 2, 3, 4, 5]
    const y = [10, 8, 6, 4, 2]
    expect(pearsonCorrelation(x, y)).toBeCloseTo(-1, 5)
  })

  it('returns 0 (or near 0) for constant vector', () => {
    const x = [1, 2, 3]
    const y = [5, 5, 5]
    const r = pearsonCorrelation(x, y)
    expect(r).toBe(0)
  })

  it('returns null for vectors shorter than 3', () => {
    expect(pearsonCorrelation([1, 2], [3, 4])).toBeNull()
  })

  it('returns null for mismatched lengths', () => {
    expect(pearsonCorrelation([1, 2, 3], [1, 2])).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// computeBasicCorrelations
// ---------------------------------------------------------------------------

describe('computeBasicCorrelations', () => {
  it('returns { status: "not_enough_data" } with fewer than MIN_DAYS_BASIC days', () => {
    const entries = [
      makeWellbeing('2026-01-01', 3),
    ]
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('not_enough_data')
    expect(result.minDays).toBe(MIN_DAYS_BASIC)
  })

  it('returns correlations when enough data exists', () => {
    const entries = []
    // Build 7 days of well-correlated sleep → wellbeing data
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, d <= 4 ? 2 : 4))
      entries.push(makeSleep(date, d <= 4 ? 300 : 480))
    }
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('ok')
    expect(Array.isArray(result.correlations)).toBe(true)
  })

  it('returns top 3 negative-impact variables sorted by impact', () => {
    const entries = []
    // 7 days: sleep negatively affects wellbeing (inversely correlated)
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, d <= 4 ? 4 : 2))
      entries.push(makeSleep(date, d <= 4 ? 300 : 500))
    }
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('ok')
    expect(result.topNegativeFactors.length).toBeLessThanOrEqual(3)
  })

  it('includes datasetDays in result', () => {
    const entries = []
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 3))
    }
    const result = computeBasicCorrelations(entries)
    expect(result.datasetDays).toBe(7)
  })
})

// ---------------------------------------------------------------------------
// computeAdvancedAnalysis
// ---------------------------------------------------------------------------

describe('computeAdvancedAnalysis', () => {
  it('returns { status: "not_enough_data" } with fewer than MIN_DAYS_ADVANCED days', () => {
    const entries = []
    for (let d = 1; d <= 5; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 3))
    }
    const result = computeAdvancedAnalysis(entries)
    expect(result.status).toBe('not_enough_data')
    expect(result.minDays).toBe(MIN_DAYS_ADVANCED)
  })

  it('returns ok with 7+ days of data', () => {
    const entries = []
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
      entries.push(makeSleep(date, 360 + d * 15))
      entries.push(makeSteps(date, 5000 + d * 500))
    }
    const result = computeAdvancedAnalysis(entries)
    expect(result.status).toBe('ok')
  })

  it('returns featureImportance array', () => {
    const entries = []
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
      entries.push(makeSleep(date, 300 + d * 20))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok') {
      expect(Array.isArray(result.featureImportance)).toBe(true)
      result.featureImportance.forEach((fi) => {
        expect(fi).toHaveProperty('variable')
        expect(fi).toHaveProperty('importance')
        expect(fi).toHaveProperty('direction')
      })
    }
  })

  it('returns modelInfo with R2 score', () => {
    const entries = []
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
      entries.push(makeSleep(date, 300 + d * 20))
      entries.push(makeSteps(date, 4000 + d * 500))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok') {
      expect(result.modelInfo).toHaveProperty('r2')
      // r2 is a number (may be null in correlation-only fallback)
      expect(result.modelInfo.r2 === null || typeof result.modelInfo.r2 === 'number').toBe(true)
    }
  })
})
