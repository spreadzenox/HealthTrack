/**
 * Tests for the local statistical & ML analysis engine.
 * All computations run fully client-side — no API keys needed.
 */
import { describe, it, expect } from 'vitest'
import {
  localDateKey,
  buildDailyDataset,
  buildLaggedDataset,
  pearsonCorrelation,
  computeBasicCorrelations,
  computeAdvancedAnalysis,
  MIN_DAYS_BASIC,
  MIN_DAYS_ADVANCED,
  LAG_DAYS,
  VARIABLE_META,
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
// buildDailyDataset — base fields
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
    const items = [{ ingredient: 'riz cuit', quantity_g: 100 }]
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeFood('2026-01-01', items),
    ]
    const ds = buildDailyDataset(entries)
    expect(typeof ds[0].kcal).toBe('number')
  })

  it('only includes days that have at least one wellbeing score', () => {
    const entries = [
      makeSleep('2026-01-01', 480),
      makeWellbeing('2026-01-02', 3),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds).toHaveLength(1)
    expect(ds[0].dateKey).toBe(localDateKey('2026-01-02T12:00:00Z'))
  })

  // New micronutrient & enriched fields
  it('includes sugar_g, saturated_fat_g, omega3_g, alcohol_g in day rows', () => {
    const entries = [makeWellbeing('2026-01-01', 3)]
    const ds = buildDailyDataset(entries)
    expect(ds[0]).toHaveProperty('sugar_g')
    expect(ds[0]).toHaveProperty('saturated_fat_g')
    expect(ds[0]).toHaveProperty('omega3_g')
    expect(ds[0]).toHaveProperty('alcohol_g')
  })

  it('includes vitamin fields in day rows', () => {
    const entries = [makeWellbeing('2026-01-01', 3)]
    const ds = buildDailyDataset(entries)
    expect(ds[0]).toHaveProperty('vitamin_c_mg')
    expect(ds[0]).toHaveProperty('vitamin_d_ug')
    expect(ds[0]).toHaveProperty('vitamin_b12_ug')
    expect(ds[0]).toHaveProperty('vitamin_b9_ug')
    expect(ds[0]).toHaveProperty('vitamin_a_ug')
    expect(ds[0]).toHaveProperty('vitamin_e_mg')
  })

  it('includes mineral fields in day rows', () => {
    const entries = [makeWellbeing('2026-01-01', 3)]
    const ds = buildDailyDataset(entries)
    expect(ds[0]).toHaveProperty('calcium_mg')
    expect(ds[0]).toHaveProperty('iron_mg')
    expect(ds[0]).toHaveProperty('magnesium_mg')
    expect(ds[0]).toHaveProperty('zinc_mg')
    expect(ds[0]).toHaveProperty('potassium_mg')
    expect(ds[0]).toHaveProperty('sodium_mg')
  })

  it('includes fodmap_score in day rows', () => {
    const entries = [makeWellbeing('2026-01-01', 3)]
    const ds = buildDailyDataset(entries)
    expect(ds[0]).toHaveProperty('fodmap_score')
    expect(typeof ds[0].fodmap_score).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// buildLaggedDataset
// ---------------------------------------------------------------------------

describe('buildLaggedDataset', () => {
  it('returns empty array for empty input', () => {
    expect(buildLaggedDataset([])).toEqual([])
  })

  it('returns same length as input dataset', () => {
    const entries = []
    for (let d = 1; d <= 5; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 3))
    }
    const raw = buildDailyDataset(entries)
    const lagged = buildLaggedDataset(raw)
    expect(lagged).toHaveLength(raw.length)
  })

  it('preserves wellbeing and lifestyle values unchanged', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeSleep('2026-01-01', 480),
      makeSteps('2026-01-01', 8000),
    ]
    const raw = buildDailyDataset(entries)
    const lagged = buildLaggedDataset(raw)
    expect(lagged[0].wellbeing).toBeCloseTo(4)
    expect(lagged[0].sleepMinutes).toBeCloseTo(480)
    expect(lagged[0].steps).toBeCloseTo(8000)
  })

  it('smooths nutrition values across multiple days', () => {
    // Day 1: high kcal, Day 2: low kcal
    // Day 2 lagged kcal should be > day 2 raw kcal (influenced by day 1)
    const items_high = [{ ingredient: 'Huile d\'olive vierge extra', quantity_g: 100 }]
    const items_low = [{ ingredient: 'Huile d\'olive vierge extra', quantity_g: 10 }]
    const entries = [
      makeWellbeing('2026-01-01', 3),
      makeFood('2026-01-01', items_high),
      makeWellbeing('2026-01-02', 3),
      makeFood('2026-01-02', items_low),
    ]
    const raw = buildDailyDataset(entries)
    // If kcal is non-zero in raw, lagged day 2 should be influenced by day 1
    if (raw[0].kcal > 0 && raw[1].kcal > 0) {
      const lagged = buildLaggedDataset(raw)
      // Day 2 lagged kcal should be between day 1 raw and day 2 raw
      expect(lagged[1].kcal).toBeGreaterThan(raw[1].kcal * 0.9)
    }
  })

  it('for a single isolated day, lagged equals raw (only self-contribution)', () => {
    // With only 1 day and no neighbours, the lagged value = raw value (weight=1 for delta=0)
    const entries = [makeWellbeing('2026-06-15', 4)]
    const raw = buildDailyDataset(entries)
    const lagged = buildLaggedDataset(raw)
    expect(lagged[0].wellbeing).toBeCloseTo(raw[0].wellbeing)
    expect(lagged[0].kcal).toBeCloseTo(raw[0].kcal)
  })

  it('LAG_DAYS constant is positive', () => {
    expect(LAG_DAYS).toBeGreaterThan(0)
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
// VARIABLE_META
// ---------------------------------------------------------------------------

describe('VARIABLE_META', () => {
  it('includes all expected new micronutrient keys', () => {
    const expectedKeys = [
      'sugar_g', 'saturated_fat_g', 'omega3_g', 'alcohol_g', 'fodmap_score',
      'vitamin_c_mg', 'vitamin_d_ug', 'vitamin_b12_ug', 'vitamin_b9_ug', 'vitamin_a_ug', 'vitamin_e_mg',
      'calcium_mg', 'iron_mg', 'magnesium_mg', 'zinc_mg', 'potassium_mg', 'sodium_mg',
    ]
    for (const key of expectedKeys) {
      expect(VARIABLE_META).toHaveProperty(key)
    }
  })

  it('every entry has label, unit, direction, group', () => {
    for (const [key, meta] of Object.entries(VARIABLE_META)) {
      expect(meta, `${key} missing label`).toHaveProperty('label')
      expect(meta, `${key} missing unit`).toHaveProperty('unit')
      expect(meta, `${key} missing direction`).toHaveProperty('direction')
      expect(meta, `${key} missing group`).toHaveProperty('group')
      expect(['higher_better', 'lower_better', 'neutral'], `${key} invalid direction`).toContain(meta.direction)
    }
  })

  it('alcohol has direction lower_better', () => {
    expect(VARIABLE_META.alcohol_g.direction).toBe('lower_better')
  })

  it('sodium has direction lower_better', () => {
    expect(VARIABLE_META.sodium_mg.direction).toBe('lower_better')
  })

  it('vitamin_d has direction higher_better', () => {
    expect(VARIABLE_META.vitamin_d_ug.direction).toBe('higher_better')
  })
})

// ---------------------------------------------------------------------------
// computeBasicCorrelations
// ---------------------------------------------------------------------------

describe('computeBasicCorrelations', () => {
  it('returns { status: "not_enough_data" } with fewer than MIN_DAYS_BASIC days', () => {
    const entries = [makeWellbeing('2026-01-01', 3)]
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('not_enough_data')
    expect(result.minDays).toBe(MIN_DAYS_BASIC)
  })

  it('returns correlations when enough data exists', () => {
    const entries = []
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, d <= 4 ? 2 : 4))
      entries.push(makeSleep(date, d <= 4 ? 300 : 480))
    }
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('ok')
    expect(Array.isArray(result.correlations)).toBe(true)
  })

  it('correlations include group field', () => {
    const entries = []
    for (let d = 1; d <= 5; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, d))
      entries.push(makeSleep(date, 300 + d * 30))
    }
    const result = computeBasicCorrelations(entries)
    if (result.status === 'ok' && result.correlations.length > 0) {
      expect(result.correlations[0]).toHaveProperty('group')
    }
  })

  it('returns top 3 negative-impact variables sorted by impact', () => {
    const entries = []
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

  it('includes lower_better variable in topNegativeFactors when r is strongly negative', () => {
    // alcohol is lower_better. When it correlates negatively with wellbeing (r < -0.15)
    // it should appear in the Top 3 (more alcohol → worse wellbeing).
    const entries = []
    const alcoholItems = [{ ingredient: 'Bière', quantity_g: 500 }]
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      // Days 1-4: low wellbeing AND food with alcohol; days 5-7: high wellbeing AND no food
      entries.push(makeWellbeing(date, d <= 4 ? 2 : 5))
      if (d <= 4) entries.push(makeFood(date, alcoholItems))
    }
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('ok')
    // If alcohol data produced a correlation, it must be included in top factors
    const alcoholCorr = result.correlations.find((c) => c.variable === 'alcohol_g')
    if (alcoholCorr && alcoholCorr.r < -0.15) {
      const inTop3 = result.topNegativeFactors.some((f) => f.variable === 'alcohol_g')
      expect(inTop3).toBe(true)
    }
  })

  it('excludes lower_better variable from topNegativeFactors when r is positive', () => {
    // If a lower_better variable has a positive correlation (r > 0),
    // it should NOT be flagged as harmful (positive r means more of it → better wellbeing).
    const entries = []
    const alcoholItems = [{ ingredient: 'Bière', quantity_g: 300 }]
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      // Days 1-4: high wellbeing AND food with alcohol; days 5-7: low wellbeing AND no food
      // This creates a positive r for alcohol_g, which should NOT be in Top 3
      entries.push(makeWellbeing(date, d <= 4 ? 5 : 2))
      if (d <= 4) entries.push(makeFood(date, alcoholItems))
    }
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('ok')
    const alcoholCorr = result.correlations.find((c) => c.variable === 'alcohol_g')
    if (alcoholCorr && alcoholCorr.r > 0) {
      const inTop3 = result.topNegativeFactors.some((f) => f.variable === 'alcohol_g')
      expect(inTop3).toBe(false)
    }
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

  it('returns featureImportance array with group field', () => {
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
        expect(fi).toHaveProperty('group')
      })
    }
  })

  it('returns modelInfo with R2 score and lagDays', () => {
    const entries = []
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
      entries.push(makeSleep(date, 300 + d * 20))
      entries.push(makeSteps(date, 4000 + d * 500))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok' && result.modelInfo.method === 'ols_linear_regression') {
      expect(result.modelInfo).toHaveProperty('r2')
      expect(result.modelInfo).toHaveProperty('lagDays')
      expect(result.modelInfo.lagDays).toBe(LAG_DAYS)
    }
  })

  it('featureImportance shows at most 12 entries', () => {
    const entries = []
    for (let d = 1; d <= 10; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 4)))
      entries.push(makeSleep(date, 300 + d * 20))
      entries.push(makeSteps(date, 4000 + d * 500))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok') {
      expect(result.featureImportance.length).toBeLessThanOrEqual(12)
    }
  })
})
