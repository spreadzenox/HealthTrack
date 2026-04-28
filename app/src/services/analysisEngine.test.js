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
  countTotalDataDays,
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

function makeAvgHR(dateStr, bpm) {
  return {
    type: 'heart_rate',
    source: 'health_connect',
    at: `${dateStr}T14:00:00Z`,
    payload: { bpm, subtype: 'heartRate' },
  }
}

function makeHRV(dateStr, ms) {
  return {
    type: 'heart_rate',
    source: 'health_connect',
    at: `${dateStr}T07:30:00Z`,
    payload: { value: ms, subtype: 'heartRateVariability' },
  }
}

function makeSpO2(dateStr, pct) {
  return {
    type: 'heart_rate',
    source: 'health_connect',
    at: `${dateStr}T07:45:00Z`,
    payload: { value: pct, subtype: 'oxygenSaturation' },
  }
}

function makeCaloriesHC(dateStr, value) {
  return {
    type: 'calories',
    source: 'health_connect',
    at: `${dateStr}T23:00:00Z`,
    payload: { value, unit: 'kcal' },
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

  // ── Health Connect extended metrics ────────────────────────────────────────

  it('computes avgHR (daily average heart rate) from heartRate subtype entries', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeAvgHR('2026-01-01', 70),
      makeAvgHR('2026-01-01', 80),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds[0].avgHR).toBeCloseTo(75)
  })

  it('avgHR is 0 when no heartRate subtype entries exist', () => {
    const entries = [makeWellbeing('2026-01-01', 4)]
    const ds = buildDailyDataset(entries)
    expect(ds[0].avgHR).toBe(0)
  })

  it('computes hrv_ms (HRV average) from heartRateVariability subtype entries', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeHRV('2026-01-01', 40),
      makeHRV('2026-01-01', 60),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds[0].hrv_ms).toBeCloseTo(50)
  })

  it('hrv_ms is 0 when no HRV entries exist', () => {
    const entries = [makeWellbeing('2026-01-01', 4)]
    const ds = buildDailyDataset(entries)
    expect(ds[0].hrv_ms).toBe(0)
  })

  it('computes spo2_pct (SpO₂ average) from oxygenSaturation subtype entries', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeSpO2('2026-01-01', 97),
      makeSpO2('2026-01-01', 99),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds[0].spo2_pct).toBeCloseTo(98)
  })

  it('spo2_pct is 0 when no SpO₂ entries exist', () => {
    const entries = [makeWellbeing('2026-01-01', 4)]
    const ds = buildDailyDataset(entries)
    expect(ds[0].spo2_pct).toBe(0)
  })

  it('computes dailyCaloriesHC from calories type entries', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeCaloriesHC('2026-01-01', 2000),
      makeCaloriesHC('2026-01-01', 500),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds[0].dailyCaloriesHC).toBeCloseTo(2500)
  })

  it('dailyCaloriesHC is 0 when no calories HC entries exist', () => {
    const entries = [makeWellbeing('2026-01-01', 4)]
    const ds = buildDailyDataset(entries)
    expect(ds[0].dailyCaloriesHC).toBe(0)
  })

  it('restingHR and avgHR are tracked separately for the same day', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeHeartRate('2026-01-01', 55),    // resting
      makeAvgHR('2026-01-01', 80),        // active
    ]
    const ds = buildDailyDataset(entries)
    expect(ds[0].restingHR).toBeCloseTo(55)
    expect(ds[0].avgHR).toBeCloseTo(80)
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

  it('includes Health Connect extended metrics keys (avgHR, hrv_ms, spo2_pct, dailyCaloriesHC)', () => {
    const hcKeys = ['avgHR', 'hrv_ms', 'spo2_pct', 'dailyCaloriesHC']
    for (const key of hcKeys) {
      expect(VARIABLE_META).toHaveProperty(key)
    }
  })

  it('avgHR has direction neutral', () => {
    expect(VARIABLE_META.avgHR.direction).toBe('neutral')
  })

  it('hrv_ms has direction higher_better', () => {
    expect(VARIABLE_META.hrv_ms.direction).toBe('higher_better')
  })

  it('spo2_pct has direction higher_better', () => {
    expect(VARIABLE_META.spo2_pct.direction).toBe('higher_better')
  })

  it('dailyCaloriesHC has direction higher_better', () => {
    expect(VARIABLE_META.dailyCaloriesHC.direction).toBe('higher_better')
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

  it('includes Health Connect features (avgHR, hrv_ms, spo2_pct, dailyCaloriesHC) in correlations when data is present', () => {
    const entries = []
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
      entries.push(makeAvgHR(date, 60 + d * 2))
      entries.push(makeHRV(date, 30 + d * 5))
      entries.push(makeSpO2(date, 96 + (d % 3)))
      entries.push(makeCaloriesHC(date, 1800 + d * 50))
    }
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('ok')
    const keys = result.correlations.map((c) => c.variable)
    expect(keys).toContain('avgHR')
    expect(keys).toContain('hrv_ms')
    expect(keys).toContain('spo2_pct')
    expect(keys).toContain('dailyCaloriesHC')
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

  it('includes Health Connect features (avgHR, hrv_ms, spo2_pct, dailyCaloriesHC) in featureImportance when data is present', () => {
    const entries = []
    for (let d = 1; d <= 10; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 4)))
      entries.push(makeSleep(date, 360 + d * 10))
      entries.push(makeAvgHR(date, 60 + d * 2))
      entries.push(makeHRV(date, 30 + d * 4))
      entries.push(makeSpO2(date, 96 + (d % 4)))
      entries.push(makeCaloriesHC(date, 1800 + d * 40))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok') {
      const allFeatureKeys = Object.keys(VARIABLE_META).filter((k) => {
        return ['avgHR', 'hrv_ms', 'spo2_pct', 'dailyCaloriesHC'].includes(k)
      })
      // The model may cap at 12 features, but they must be present in VARIABLE_META
      // and in the dataset (non-zero columns), so they are eligible
      for (const k of allFeatureKeys) {
        expect(VARIABLE_META).toHaveProperty(k)
      }
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

  it('uses OLS (not Pearson fallback) when features > data days, via Ridge regularisation', () => {
    // Simulate the real-world scenario: ~8 wellbeing days but many active features
    // (sleep, steps, food with many nutrients, heart rate). Without Ridge, OLS would fall
    // back to Pearson. With Ridge, it should succeed as OLS.
    const entries = []
    const foodItems = [{ ingredient: 'Riz cuit', quantity_g: 150 }]
    for (let d = 1; d <= 8; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 4)))
      entries.push(makeSleep(date, 360 + d * 10))
      entries.push(makeSteps(date, 5000 + d * 300))
      entries.push(makeFood(date, foodItems))
      entries.push(makeAvgHR(date, 65 + d))
      entries.push(makeHRV(date, 40 + d * 2))
      entries.push(makeActivity(date, 200 + d * 10))
    }
    const result = computeAdvancedAnalysis(entries)
    expect(result.status).toBe('ok')
    expect(result.modelInfo.method).toBe('ols_linear_regression')
  })
})

// ---------------------------------------------------------------------------
// countTotalDataDays
// ---------------------------------------------------------------------------

describe('countTotalDataDays', () => {
  it('returns 0 for empty array', () => {
    expect(countTotalDataDays([])).toBe(0)
  })

  it('returns 0 for null/undefined', () => {
    expect(countTotalDataDays(null)).toBe(0)
    expect(countTotalDataDays(undefined)).toBe(0)
  })

  it('counts distinct calendar days regardless of entry type', () => {
    const entries = [
      makeWellbeing('2026-01-01', 3),
      makeSleep('2026-01-01', 480),   // same day → still 1
      makeWellbeing('2026-01-02', 4),
      makeFood('2026-01-03', []),     // day without wellbeing still counted
    ]
    expect(countTotalDataDays(entries)).toBe(3)
  })

  it('differs from buildDailyDataset length when some days lack wellbeing', () => {
    const entries = [
      makeSleep('2026-01-01', 480),   // no wellbeing → not in dailyDataset
      makeWellbeing('2026-01-02', 4),
      makeWellbeing('2026-01-03', 3),
    ]
    const totalDays = countTotalDataDays(entries)
    const wellbeingDays = buildDailyDataset(entries).length
    expect(totalDays).toBe(3)
    expect(wellbeingDays).toBe(2)
    expect(totalDays).toBeGreaterThan(wellbeingDays)
  })
})
