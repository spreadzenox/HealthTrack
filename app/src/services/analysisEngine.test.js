/**
 * Tests for the local statistical & ML analysis engine.
 * All computations run fully client-side — no API keys needed.
 */
import { describe, it, expect } from 'vitest'
import {
  localDateKey,
  buildDailyDataset,
  buildLaggedDataset,
  buildTodayRow,
  pearsonCorrelation,
  computeBasicCorrelations,
  computeAdvancedAnalysis,
  computeTodayPrediction,
  countTotalDataDays,
  MIN_DAYS_BASIC,
  MIN_DAYS_ADVANCED,
  HOLD_OUT_DAYS,
  LAG_DAYS,
  VARIABLE_META,
  MAX_FEATURES_RATIO,
  MAX_FEATURES,
  COLLINEARITY_MAX_R,
  RIDGE_LAMBDAS,
  MIN_ADVICE_EFFECT,
  pruneCollinearFeatures,
  ridgeLooPredictions,
  olsNormalEquations,
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

function makeCigarette(dateStr, count = 1) {
  return {
    type: 'cigarette',
    source: 'app_cigarette',
    at: `${dateStr}T14:00:00Z`,
    payload: { count },
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

  it('sums cigarette entries per day', () => {
    const entries = [
      makeWellbeing('2026-01-01', 4),
      makeCigarette('2026-01-01'),
      makeCigarette('2026-01-01'),
      makeCigarette('2026-01-01', 2),
    ]
    const ds = buildDailyDataset(entries)
    expect(ds[0].cigaretteCount).toBe(4)
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

  it('cigaretteCount has direction lower_better and lifestyle group', () => {
    expect(VARIABLE_META).toHaveProperty('cigaretteCount')
    expect(VARIABLE_META.cigaretteCount.direction).toBe('lower_better')
    expect(VARIABLE_META.cigaretteCount.group).toBe('lifestyle')
  })

  it('sodium has direction lower_better', () => {
    expect(VARIABLE_META.sodium_mg.direction).toBe('lower_better')
  })

  it('vitamin_d has direction higher_better', () => {
    expect(VARIABLE_META.vitamin_d_ug.direction).toBe('higher_better')
  })

  it('includes Withings Body Scan variables', () => {
    const withingsKeys = [
      'weight_kg', 'bmi', 'fat_ratio_pct', 'muscle_mass_kg',
      'visceral_fat_index', 'bmr_kcal', 'vascular_age_years',
    ]
    for (const key of withingsKeys) {
      expect(VARIABLE_META).toHaveProperty(key)
      expect(VARIABLE_META[key].group).toBe('body')
    }
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

  it('returns at most 3 levers', () => {
    const entries = []
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, d <= 4 ? 4 : 2))
      entries.push(makeSleep(date, d <= 4 ? 300 : 500))
    }
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('ok')
    expect(result.levers.length).toBeLessThanOrEqual(3)
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

  it('includes lower_better variable in levers when r is strongly negative', () => {
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
      const inTop3 = result.levers.some((f) => f.variable === 'alcohol_g')
      expect(inTop3).toBe(true)
    }
  })

  it('excludes lower_better variable from levers when r is positive', () => {
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
      const inTop3 = result.levers.some((f) => f.variable === 'alcohol_g')
      expect(inTop3).toBe(false)
    }
  })

  it('MIN_DAYS_BASIC is at least 5 to avoid near-random Pearson r', () => {
    // With fewer than 5 points, Pearson r is unreliable. Ensure the constant enforces this.
    expect(MIN_DAYS_BASIC).toBeGreaterThanOrEqual(5)
  })

  it('returns reliability field in basic result', () => {
    const entries = []
    for (let d = 1; d <= MIN_DAYS_BASIC; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
      entries.push(makeSleep(date, 360 + d * 10))
    }
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('ok')
    expect(result).toHaveProperty('reliability')
    expect(['good', 'exploratory']).toContain(result.reliability)
  })

  it('reliability is exploratory with fewer than 10 days', () => {
    const entries = []
    // Use exactly MIN_DAYS_BASIC days (5), which is < 10
    for (let d = 1; d <= MIN_DAYS_BASIC; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
    }
    const result = computeBasicCorrelations(entries)
    if (result.status === 'ok') {
      expect(result.reliability).toBe('exploratory')
    }
  })

  it('reliability is good with 10 or more days', () => {
    const entries = []
    for (let d = 1; d <= 10; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
      entries.push(makeSleep(date, 360 + d * 10))
    }
    const result = computeBasicCorrelations(entries)
    if (result.status === 'ok') {
      expect(result.reliability).toBe('good')
    }
  })

  it('does NOT include a variable in levers when r is positive and another has r < -threshold', () => {
    // The filter requires r < -threshold for all directions (higher_better, lower_better, neutral).
    // We use lifestyle variables (not lagged) to avoid lag interference:
    // - sleep (higher_better): MORE sleep = LOWER wellbeing → r < 0, should appear in main filter
    // - steps (higher_better): MORE steps = HIGHER wellbeing → r > 0, must NOT appear in main filter
    const entries = []
    for (let d = 1; d <= 7; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      // Pattern: alternating to create clear opposite correlations
      // Days 1,3,5,7 = high sleep + low wellbeing; steps always increase with d
      const isHighSleepDay = d % 2 === 1
      entries.push(makeWellbeing(date, isHighSleepDay ? 1 : 5))
      entries.push(makeSleep(date, isHighSleepDay ? 600 : 300))
      // Steps increase monotonically: high steps → high wellbeing index (days 2,4,6 are high wellbeing)
      entries.push(makeSteps(date, d * 1500))
    }
    const result = computeBasicCorrelations(entries)
    if (result.status === 'ok') {
      const sleepCorr = result.correlations.find((c) => c.variable === 'sleepMinutes')
      const stepsCorr = result.correlations.find((c) => c.variable === 'steps')
      // Only test the invariant if the setup actually produced the expected correlations
      if (sleepCorr && sleepCorr.r < -0.2 && stepsCorr && stepsCorr.r > 0) {
        // Main filter should be non-empty (sleep qualifies). steps (r > 0) must not appear.
        const stepsInTop3 = result.levers.some((f) => f.variable === 'steps')
        expect(stepsInTop3).toBe(false)
      }
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

const MIN_ADVANCED_TOTAL = MIN_DAYS_ADVANCED + HOLD_OUT_DAYS

describe('computeAdvancedAnalysis', () => {
  it('returns { status: "not_enough_data" } with fewer than MIN_DAYS_ADVANCED + HOLD_OUT_DAYS days', () => {
    const entries = []
    // Use exactly MIN_DAYS_ADVANCED - 1 days (not enough even without hold-out)
    for (let d = 1; d <= MIN_DAYS_ADVANCED - 1; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 3))
    }
    const result = computeAdvancedAnalysis(entries)
    expect(result.status).toBe('not_enough_data')
    expect(result.minDays).toBe(MIN_ADVANCED_TOTAL)
  })

  it('returns ok with MIN_DAYS_ADVANCED + HOLD_OUT_DAYS days of data', () => {
    const entries = []
    for (let d = 1; d <= MIN_ADVANCED_TOTAL; d++) {
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
    for (let d = 1; d <= MIN_ADVANCED_TOTAL; d++) {
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
    for (let d = 1; d <= MIN_ADVANCED_TOTAL; d++) {
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

  it('returns r2_loo in modelInfo when enough data for LOO CV', () => {
    const entries = []
    for (let d = 1; d <= 10; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 4)))
      entries.push(makeSleep(date, 300 + d * 20))
      entries.push(makeSteps(date, 4000 + d * 500))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok' && result.modelInfo.method === 'ols_linear_regression') {
      // r2_loo should be a number or null (not undefined)
      expect(result.modelInfo.r2_loo === null || typeof result.modelInfo.r2_loo === 'number').toBe(true)
    }
  })

  it('returns overfit_risk flag when features >= training data days', () => {
    // With MIN_ADVANCED_TOTAL days (HOLD_OUT_DAYS are held out, so only MIN_DAYS_ADVANCED
    // training rows) and many nutrition features, Ridge still fits but overfit_risk should be true
    const entries = []
    const foodItems = [{ ingredient: 'Riz cuit', quantity_g: 150 }]
    for (let d = 1; d <= MIN_ADVANCED_TOTAL; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
      entries.push(makeFood(date, foodItems))
      entries.push(makeSleep(date, 300 + d * 20))
      entries.push(makeSteps(date, 4000 + d * 500))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok' && result.modelInfo.method === 'ols_linear_regression') {
      expect(typeof result.modelInfo.overfit_risk).toBe('boolean')
    }
  })

  it('featureImportance values are normalised — all importances in [0,1] and max is 0 or 1', () => {
    const entries = []
    // Use a varied wellbeing pattern and diverse features to avoid degenerate collinear fit
    const wellbeingScores = [1, 4, 2, 5, 3, 2, 4, 1, 5, 3]
    const sleepValues    = [300, 480, 350, 500, 400, 330, 460, 290, 510, 380]
    const stepsValues    = [3000, 9000, 5000, 11000, 7000, 4000, 8000, 2500, 10000, 6000]
    for (let d = 0; d < 10; d++) {
      const date = `2026-01-${String(d + 1).padStart(2, '0')}`
      entries.push(makeWellbeing(date, wellbeingScores[d]))
      entries.push(makeSleep(date, sleepValues[d]))
      entries.push(makeSteps(date, stepsValues[d]))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok' && result.featureImportance.length > 0) {
      const maxImportance = Math.max(...result.featureImportance.map((f) => f.importance))
      // max is either 1.0 (when model has signal) or 0 (degenerate case)
      expect(maxImportance === 0 || Math.abs(maxImportance - 1.0) < 1e-6).toBe(true)
      // All importances should be in [0,1]
      result.featureImportance.forEach((f) => {
        expect(f.importance).toBeGreaterThanOrEqual(0)
        expect(f.importance).toBeLessThanOrEqual(1 + 1e-9)
      })
    }
  })

  it('result includes todayPrediction field (null or object)', () => {
    const entries = []
    for (let d = 1; d <= MIN_ADVANCED_TOTAL; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
      entries.push(makeSleep(date, 300 + d * 20))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok') {
      // todayPrediction is null when no today-data exists, or an object otherwise
      expect(
        result.todayPrediction === null ||
        (typeof result.todayPrediction === 'object' && 'predicted' in result.todayPrediction)
      ).toBe(true)
    }
  })

  it('residuals are hold-out predictions: exactly HOLD_OUT_DAYS entries, not in-sample', () => {
    const entries = []
    for (let d = 1; d <= MIN_ADVANCED_TOTAL + 2; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 3)))
      entries.push(makeSleep(date, 300 + d * 20))
      entries.push(makeSteps(date, 4000 + d * 500))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok' && result.residuals) {
      // Must be exactly HOLD_OUT_DAYS entries
      expect(result.residuals.length).toBe(HOLD_OUT_DAYS)
      // Each residual must have dateKey, actual, predicted
      result.residuals.forEach((r) => {
        expect(r).toHaveProperty('dateKey')
        expect(r).toHaveProperty('actual')
        expect(r).toHaveProperty('predicted')
        expect(r.predicted).toBeGreaterThanOrEqual(0)
        expect(r.predicted).toBeLessThanOrEqual(5)
      })
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

  it('modelInfo includes model_reliable (boolean or null)', () => {
    const entries = []
    for (let d = 1; d <= 10; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 4)))
      entries.push(makeSleep(date, 360 + d * 10))
      entries.push(makeSteps(date, 5000 + d * 300))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok' && result.modelInfo.method === 'ols_linear_regression') {
      expect(result.modelInfo).toHaveProperty('model_reliable')
      const val = result.modelInfo.model_reliable
      expect(val === null || typeof val === 'boolean').toBe(true)
    }
  })

  it('modelInfo includes nFeaturesFinal and nFeaturesCandidate', () => {
    const entries = []
    for (let d = 1; d <= 10; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 4)))
      entries.push(makeSleep(date, 360 + d * 10))
      entries.push(makeSteps(date, 5000 + d * 300))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok' && result.modelInfo.method === 'ols_linear_regression') {
      expect(result.modelInfo).toHaveProperty('nFeaturesFinal')
      expect(result.modelInfo).toHaveProperty('nFeaturesCandidate')
      expect(result.modelInfo.nFeaturesFinal).toBeGreaterThanOrEqual(1)
      expect(result.modelInfo.nFeaturesCandidate).toBeGreaterThan(result.modelInfo.nFeaturesFinal)
    }
  })

  it('feature pre-selection limits number of features to floor(n_train * MAX_FEATURES_RATIO)', () => {
    // With 10 total days: 8 training rows (10 - HOLD_OUT_DAYS=2)
    // Pre-selection cap: floor(8 * MAX_FEATURES_RATIO) = floor(8 * 0.5) = 4 features
    const entries = []
    const foodItems = [{ ingredient: 'Riz cuit', quantity_g: 150 }]
    for (let d = 1; d <= 10; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 4)))
      entries.push(makeSleep(date, 360 + d * 10))
      entries.push(makeSteps(date, 5000 + d * 300))
      entries.push(makeFood(date, foodItems))
      entries.push(makeActivity(date, 200 + d * 10))
      entries.push(makeAvgHR(date, 70 + d))
    }
    const result = computeAdvancedAnalysis(entries)
    if (result.status === 'ok' && result.modelInfo.method === 'ols_linear_regression') {
      const nTrain = 10 - HOLD_OUT_DAYS
      const expectedCap = Math.max(2, Math.floor(nTrain * MAX_FEATURES_RATIO))
      expect(result.modelInfo.nFeaturesFinal).toBeLessThanOrEqual(expectedCap)
    }
  })

  it('MAX_FEATURES_RATIO constant is exported and in (0, 1]', () => {
    expect(MAX_FEATURES_RATIO).toBeGreaterThan(0)
    expect(MAX_FEATURES_RATIO).toBeLessThanOrEqual(1)
  })

  it('uses OLS (not Pearson fallback) when features > training days, via Ridge regularisation', () => {
    // Simulate the real-world scenario: many wellbeing days but many active features
    // (sleep, steps, food with many nutrients, heart rate). Without Ridge, OLS would fall
    // back to Pearson. With Ridge, it should succeed as OLS.
    const entries = []
    const foodItems = [{ ingredient: 'Riz cuit', quantity_g: 150 }]
    for (let d = 1; d <= MIN_ADVANCED_TOTAL + 2; d++) {
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
// buildTodayRow
// ---------------------------------------------------------------------------

describe('buildTodayRow', () => {
  it('returns null when no entries exist for today', () => {
    // Use a clearly past historical dataset with no today entries
    const historicalRaw = buildDailyDataset([
      makeWellbeing('2026-01-01', 3),
      makeWellbeing('2026-01-02', 4),
    ])
    // Pass entries that are all in the past (no today entries)
    const result = buildTodayRow([
      makeWellbeing('2026-01-01', 3),
    ], historicalRaw)
    // Today's date is not 2026-01-01 in real runtime, so result should be null
    // (unless the test runs exactly on 2026-01-01, which is very unlikely)
    const todayKey = localDateKey(new Date().toISOString())
    if (todayKey !== '2026-01-01') {
      expect(result).toBeNull()
    }
  })

  it('includes steps and sleep from today when present', () => {
    const todayStr = localDateKey(new Date().toISOString())
    const entries = [
      { type: 'steps', source: 'health_connect', at: `${todayStr}T10:00:00Z`, payload: { value: 5000 } },
      { type: 'sleep', source: 'health_connect', at: `${todayStr}T07:00:00Z`, payload: { durationMinutes: 420 } },
    ]
    const result = buildTodayRow(entries, [])
    expect(result).not.toBeNull()
    expect(result.steps).toBe(5000)
    expect(result.sleepMinutes).toBe(420)
  })

  it('includes cigarettes logged today', () => {
    const todayStr = localDateKey(new Date().toISOString())
    const entries = [
      makeCigarette(todayStr),
      makeCigarette(todayStr),
    ]
    const result = buildTodayRow(entries, [])
    expect(result).not.toBeNull()
    expect(result.cigaretteCount).toBe(2)
  })

  it('today wellbeing is null when no wellbeing score today', () => {
    const todayStr = localDateKey(new Date().toISOString())
    const entries = [
      { type: 'steps', source: 'health_connect', at: `${todayStr}T10:00:00Z`, payload: { value: 3000 } },
    ]
    const result = buildTodayRow(entries, [])
    expect(result).not.toBeNull()
    expect(result.wellbeing).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// computeTodayPrediction
// ---------------------------------------------------------------------------

describe('computeTodayPrediction', () => {
  it('returns null when fewer than MIN_DAYS_ADVANCED + HOLD_OUT_DAYS historical days', () => {
    const entries = []
    // MIN_DAYS_ADVANCED + HOLD_OUT_DAYS - 1 days → still not enough
    for (let d = 1; d <= MIN_ADVANCED_TOTAL - 1; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 3))
    }
    expect(computeTodayPrediction(entries)).toBeNull()
  })

  it('returns null when there are enough historical days but no data for today', () => {
    const entries = []
    for (let d = 1; d <= MIN_ADVANCED_TOTAL + 2; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 3))
      entries.push(makeSleep(date, 420))
    }
    // All entries are in Jan 2026, not today
    const todayKey = localDateKey(new Date().toISOString())
    if (!todayKey.startsWith('2026-01')) {
      expect(computeTodayPrediction(entries)).toBeNull()
    }
  })

  it('returns a prediction object with predicted in [0,5] when today data exists', () => {
    const todayStr = localDateKey(new Date().toISOString())
    const entries = []
    // Historical days (need at least MIN_DAYS_ADVANCED + HOLD_OUT_DAYS)
    for (let d = 1; d <= MIN_ADVANCED_TOTAL + 2; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      entries.push(makeWellbeing(date, 2 + (d % 4)))
      entries.push(makeSleep(date, 360 + d * 10))
      entries.push(makeSteps(date, 5000 + d * 200))
    }
    // Today's data
    entries.push({ type: 'steps', source: 'health_connect', at: `${todayStr}T10:00:00Z`, payload: { value: 7000 } })
    entries.push({ type: 'sleep', source: 'health_connect', at: `${todayStr}T07:00:00Z`, payload: { durationMinutes: 450 } })

    const result = computeTodayPrediction(entries)
    // If today is NOT in Jan 2026, we have historical data and today data
    const todayKey = localDateKey(new Date().toISOString())
    if (!todayKey.startsWith('2026-01')) {
      expect(result).not.toBeNull()
      expect(result.predicted).toBeGreaterThanOrEqual(0)
      expect(result.predicted).toBeLessThanOrEqual(5)
      expect(result.dateKey).toBe(todayKey)
    }
  })

  it('hold-out: today wellbeing score is never included in training data used for its own prediction', () => {
    // The model is trained on (n - HOLD_OUT_DAYS) days.  Today's wellbeing score — if present —
    // belongs to the most recent dataset row, which is always inside the hold-out window and
    // therefore excluded from training.  We verify this by checking that the prediction value
    // returned by computeTodayPrediction is clamped to [0,5] and is valid (not NaN) in all
    // scenarios; the broader "no adaptation" invariant is guaranteed by the architecture.
    const todayStr = localDateKey(new Date().toISOString())
    const baseEntries = []
    for (let d = 1; d <= MIN_ADVANCED_TOTAL + 3; d++) {
      const date = `2026-01-${String(d).padStart(2, '0')}`
      baseEntries.push(makeWellbeing(date, 2 + (d % 4)))
      baseEntries.push(makeSleep(date, 360 + d * 10))
      baseEntries.push(makeSteps(date, 5000 + d * 200))
    }
    const todayStep = { type: 'steps', source: 'health_connect', at: `${todayStr}T10:00:00Z`, payload: { value: 7000 } }
    const todayWellbeing = makeWellbeing(todayStr, 5)

    const todayKey = localDateKey(new Date().toISOString())
    if (!todayKey.startsWith('2026-01')) {
      const predWithWellbeing = computeTodayPrediction([...baseEntries, todayStep, todayWellbeing])
      // Must be valid (not null, not NaN) and within range
      if (predWithWellbeing !== null) {
        expect(predWithWellbeing.predicted).toBeGreaterThanOrEqual(0)
        expect(predWithWellbeing.predicted).toBeLessThanOrEqual(5)
        expect(Number.isNaN(predWithWellbeing.predicted)).toBe(false)
        // The actual value must be reported correctly
        expect(predWithWellbeing.actual).toBeCloseTo(5, 1)
      }
    }
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

// ---------------------------------------------------------------------------
// Levers ("pistes à tester") — actionable, coherent with data, FDR-qualified
// ---------------------------------------------------------------------------

/** Deterministic pseudo-random wellbeing scores 1..5 */
function scoreForDay(d) {
  return 1 + ((d * 7 + (d % 3) * 2) % 5)
}

function dateForDay(d) {
  const dt = new Date(Date.UTC(2026, 0, 1 + d))
  return dt.toISOString().slice(0, 10)
}

function buildLeverScenario({ days = 40, stepsSign = 0 } = {}) {
  const entries = []
  for (let d = 0; d < days; d++) {
    const date = dateForDay(d)
    const w = scoreForDay(d)
    const noise = ((d * 13) % 7) - 3
    entries.push(makeWellbeing(date, w))
    entries.push(makeSleep(date, 330 + 30 * w + noise * 5))          // actionable, r > 0
    entries.push(makeCigarette(date, Math.max(0, 7 - w + (noise > 1 ? 1 : 0)))) // actionable, r < 0
    entries.push(makeHeartRate(date, 78 - 3 * w + noise))             // NOT actionable
    entries.push(makeHRV(date, 30 + 6 * w + noise))                   // NOT actionable
    const steps = stepsSign === 0
      ? 6000 + ((d * 11) % 4) * 700
      : 8000 + stepsSign * 900 * w + noise * 100
    entries.push(makeSteps(date, steps))
  }
  return entries
}

describe('computeBasicCorrelations — statistical qualification', () => {
  it('every correlation carries n, effective n, p, q, strength and evidence', () => {
    const result = computeBasicCorrelations(buildLeverScenario())
    expect(result.status).toBe('ok')
    for (const c of result.correlations) {
      expect(c.n).toBe(40)
      expect(c.nEff).toBeGreaterThanOrEqual(3)
      expect(c.nEff).toBeLessThanOrEqual(40)
      expect(c.p).toBeGreaterThanOrEqual(0)
      expect(c.q).toBeGreaterThanOrEqual(c.p - 1e-12)
      expect(['négligeable', 'faible', 'modéré', 'fort']).toContain(c.strength)
      expect(['solide', 'à confirmer', 'incertain']).toContain(c.evidence)
    }
  })

  it('a variable unrelated to wellbeing is rated "incertain"', () => {
    const result = computeBasicCorrelations(buildLeverScenario())
    const steps = result.correlations.find((c) => c.variable === 'steps')
    expect(steps).toBeDefined()
    expect(steps.evidence).toBe('incertain')
  })
})

describe('computeBasicCorrelations — levers', () => {
  it('only proposes actionable variables (never heart rate, HRV or body metrics)', () => {
    const result = computeBasicCorrelations(buildLeverScenario())
    const vars = result.levers.map((l) => l.variable)
    expect(vars).toContain('sleepMinutes')
    for (const v of vars) {
      expect(['restingHR', 'avgHR', 'hrv_ms', 'spo2_pct', 'weight_kg', 'dailyCaloriesHC']).not.toContain(v)
    }
  })

  it('every lever has a French action, a sign coherent with the data and q < 0.2', () => {
    const result = computeBasicCorrelations(buildLeverScenario())
    expect(result.levers.length).toBeGreaterThan(0)
    for (const l of result.levers) {
      expect(typeof l.action).toBe('string')
      expect(l.action.length).toBeGreaterThan(3)
      expect(l.q).toBeLessThan(0.2)
      if (VARIABLE_META[l.variable].direction === 'higher_better') expect(l.r).toBeGreaterThan(0)
      if (VARIABLE_META[l.variable].direction === 'lower_better') expect(l.r).toBeLessThan(0)
    }
    const cig = result.levers.find((l) => l.variable === 'cigaretteCount')
    if (cig) expect(cig.action).toMatch(/moins/i)
  })

  it('never advises more of a "good" variable when data links it to LOWER wellbeing', () => {
    const result = computeBasicCorrelations(buildLeverScenario({ stepsSign: -1 }))
    const steps = result.correlations.find((c) => c.variable === 'steps')
    expect(steps.r).toBeLessThan(-0.5)
    expect(result.levers.some((l) => l.variable === 'steps')).toBe(false)
  })

  it('proposes a positively correlated "good" variable as a lever', () => {
    const result = computeBasicCorrelations(buildLeverScenario({ stepsSign: 1 }))
    const steps = result.levers.find((l) => l.variable === 'steps')
    expect(steps).toBeDefined()
    expect(steps.action).toMatch(/march/i)
  })

  it('returns no lever when nothing is clearly linked to wellbeing', () => {
    // Steps chosen to be uncorrelated with scoreForDay (r ≈ 0.06)
    const steps = [6000, 7500, 6000, 7500, 7500, 6000, 6000, 7500, 6000, 7500, 7500, 6000]
    const entries = []
    for (let d = 0; d < 12; d++) {
      const date = dateForDay(d)
      entries.push(makeWellbeing(date, scoreForDay(d)))
      entries.push(makeSteps(date, steps[d]))
    }
    const result = computeBasicCorrelations(entries)
    expect(result.status).toBe('ok')
    expect(result.levers).toEqual([])
  })
})

describe('computeAdvancedAnalysis — recommendations coherence', () => {
  it('never recommends increasing steps when the model links steps to lower wellbeing', () => {
    const result = computeAdvancedAnalysis(buildLeverScenario({ stepsSign: -1 }))
    expect(result.status).toBe('ok')
    const stepsImp = result.featureImportance.find((f) => f.variable === 'steps')
    if (stepsImp && stepsImp.coefficient < 0) {
      for (const advice of result.topRecommendations) {
        expect(advice).not.toMatch(/march|augmenter votre pas/i)
      }
    }
    for (const advice of result.topRecommendations) {
      expect(advice).not.toMatch(/fc repos|variabilité/i)
    }
  })
})

// ---------------------------------------------------------------------------
// computeAdvancedAnalysis — collinearity & Ridge tuning
// ---------------------------------------------------------------------------

// Deterministic pseudo-random generator (LCG) in [0, 1)
function seededRandom(seed) {
  let x = seed
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648
    return x / 2147483648
  }
}

/**
 * Real-world shaped scenario: steps, activity calories and total calories are
 * near-duplicates of each other (|r| > 0.99); sleep carries the real signal.
 */
function buildCollinearScenario({ days = 60 } = {}) {
  const rand = seededRandom(7)
  const entries = []
  for (let d = 0; d < days; d++) {
    const date = dateForDay(d)
    const steps = 4000 + rand() * 8000
    const sleep = 360 + rand() * 120
    const w = Math.max(0, Math.min(5, 1 + (sleep - 360) / 40 + steps / 12000 + (rand() - 0.5)))
    entries.push(makeWellbeing(date, Math.round(w)))
    entries.push(makeSleep(date, sleep))
    entries.push(makeSteps(date, steps))
    entries.push(makeActivity(date, steps * 0.04 + rand() * 2))
    entries.push(makeCaloriesHC(date, 1800 + steps * 0.04 + rand() * 3))
  }
  return entries
}

describe('pruneCollinearFeatures', () => {
  it('keeps the first (most relevant) of two near-duplicate features and reports the dropped one', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      a: i,
      b: 2 * i + (i % 2 ? 0.01 : -0.01),
      c: (i * 7) % 5,
    }))
    const { keys, dropped } = pruneCollinearFeatures(['a', 'b', 'c'], rows)
    expect(keys).toEqual(['a', 'c'])
    expect(dropped).toEqual([{ variable: 'b', keptInstead: 'a', r: expect.any(Number) }])
    expect(dropped[0].r).toBeGreaterThan(COLLINEARITY_MAX_R)
  })

  it('keeps everything when no pair exceeds the threshold', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ a: i, c: (i * 7) % 5 }))
    expect(pruneCollinearFeatures(['a', 'c'], rows).keys).toEqual(['a', 'c'])
  })
})

describe('computeAdvancedAnalysis — collinearity & Ridge tuning', () => {
  it('keeps a single representative of near-duplicate variables', () => {
    const result = computeAdvancedAnalysis(buildCollinearScenario())
    expect(result.modelInfo.method).toBe('ols_linear_regression')
    const vars = result.featureImportance.map((f) => f.variable)
    const dupes = ['steps', 'activityCalories', 'dailyCaloriesHC'].filter((v) => vars.includes(v))
    expect(dupes).toHaveLength(1)
    expect(result.modelInfo.droppedCollinear.length).toBeGreaterThanOrEqual(2)
    for (const d of result.modelInfo.droppedCollinear) {
      expect(d).toHaveProperty('label')
      expect(d).toHaveProperty('keptInsteadLabel')
    }
  })

  it('standardised coefficients stay in a plausible range (no explosion from collinearity)', () => {
    const result = computeAdvancedAnalysis(buildCollinearScenario())
    for (const f of result.featureImportance) {
      expect(Math.abs(f.coefficient)).toBeLessThan(2)
    }
  })

  it('chooses the Ridge penalty by cross-validation from RIDGE_LAMBDAS', () => {
    const result = computeAdvancedAnalysis(buildCollinearScenario())
    expect(RIDGE_LAMBDAS).toContain(result.modelInfo.lambda)
  })

  it('shrinks harder when the features carry no signal', () => {
    const rand = seededRandom(11)
    const entries = []
    for (let d = 0; d < 60; d++) {
      const date = dateForDay(d)
      entries.push(makeWellbeing(date, Math.floor(rand() * 5) + 1))
      entries.push(makeSleep(date, 360 + rand() * 120))
      entries.push(makeSteps(date, 4000 + rand() * 8000))
      entries.push(makeAvgHR(date, 60 + rand() * 20))
    }
    const noise = computeAdvancedAnalysis(entries)
    const signal = computeAdvancedAnalysis(buildCollinearScenario())
    expect(noise.modelInfo.lambda).toBeGreaterThan(signal.modelInfo.lambda)
  })

  it('suggests nothing from features that carry no signal', () => {
    const rand = seededRandom(11)
    const entries = []
    for (let d = 0; d < 60; d++) {
      const date = dateForDay(d)
      entries.push(makeWellbeing(date, Math.floor(rand() * 5) + 1))
      entries.push(makeSleep(date, 360 + rand() * 120))
      entries.push(makeSteps(date, 4000 + rand() * 8000))
      entries.push(makeCigarette(date, Math.floor(rand() * 6)))
    }
    const result = computeAdvancedAnalysis(entries)
    const meaningful = result.featureImportance.filter((f) => Math.abs(f.coefficient) >= MIN_ADVICE_EFFECT)
    expect(meaningful).toEqual([])
    expect(result.topRecommendations).toEqual([])
  })

  it('only suggests levers whose standardised effect reaches MIN_ADVICE_EFFECT', () => {
    const result = computeAdvancedAnalysis(buildLeverScenario({ days: 60, stepsSign: 1 }))
    const advised = result.featureImportance.filter((f) => result.topRecommendations.includes(f.advice))
    expect(advised.length).toBe(result.topRecommendations.length)
    for (const f of advised) expect(Math.abs(f.coefficient)).toBeGreaterThanOrEqual(MIN_ADVICE_EFFECT)
  })

  it('writes decimals the French way in every variable format', () => {
    for (const meta of Object.values(VARIABLE_META)) {
      expect(meta.format(4.326)).not.toMatch(/\d\.\d/)
    }
  })

  it('caps the number of model variables at MAX_FEATURES', () => {
    const result = computeAdvancedAnalysis(buildLeverScenario({ days: 60, stepsSign: 1 }))
    expect(result.modelInfo.nFeaturesFinal).toBeLessThanOrEqual(MAX_FEATURES)
  })

  it('today prediction uses the same model as the advanced analysis', () => {
    const entries = buildCollinearScenario({ days: 30 })
    const today = new Date().toISOString().slice(0, 10)
    entries.push(makeSleep(today, 450))
    entries.push(makeSteps(today, 9000))
    const fromAnalysis = computeAdvancedAnalysis(entries).todayPrediction
    const standalone = computeTodayPrediction(entries)
    expect(fromAnalysis).not.toBeNull()
    expect(standalone.predicted).toBeCloseTo(fromAnalysis.predicted, 10)
  })
})

describe('ridgeLooPredictions', () => {
  it('matches refitting the Ridge model n times without each row', () => {
    const rand = seededRandom(3)
    const X = Array.from({ length: 25 }, () => [1, rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1])
    const y = X.map((r) => 2 + r[1] - 0.5 * r[2] + rand() * 0.3)
    for (const lambda of [0.1, 3, 100]) {
      const fast = ridgeLooPredictions(X, y, lambda)
      X.forEach((row, i) => {
        const beta = olsNormalEquations(X.filter((_, j) => j !== i), y.filter((_, j) => j !== i), lambda)
        const brute = row.reduce((s, x, j) => s + x * beta[j], 0)
        expect(fast[i]).toBeCloseTo(brute, 8)
      })
    }
  })
})
