/**
 * Local statistical & machine-learning analysis engine.
 *
 * All computations run 100% client-side, no network, no API key.
 *
 * Architecture:
 *   1. buildDailyDataset         – aggregates raw IndexedDB entries into one row per day
 *   2. buildLaggedDataset        – applies a 10.5-day linear-decay temporal window to
 *                                  nutrition features so that each meal influences wellbeing
 *                                  over the following ~1.5 weeks (linearly decreasing weight).
 *   3. pearsonCorrelation        – pure Pearson r between two numeric arrays
 *   4. computeBasicCorrelations  – "Recommandations basiques" (≥ MIN_DAYS_BASIC days)
 *   5. computeAdvancedAnalysis   – "Recommandations avancées"  (≥ MIN_DAYS_ADVANCED days)
 *      Uses multiple linear regression (OLS via normal equations) for feature importance.
 *
 * Time-lag model
 * ──────────────
 * Nutritional intake at day d contributes to wellbeing on days d … d+LAG_DAYS
 * with a weight that decreases linearly from 1.0 (same day) to 0.0 (day d+LAG_DAYS).
 * This reflects the physiological reality that macro/micronutrient status evolves
 * over ~10–14 days and does not reset daily.
 *
 * The objective is to maximise the *integral* of the wellbeing curve over time,
 * avoiding sharp drops to zero by accounting for the delayed effects of diet.
 */

import { computeTotalsFromItems, NUTRITION_FIELDS } from './nutritionKPIs'

// ─── Public constants ────────────────────────────────────────────────────────

export const MIN_DAYS_BASIC    = 2
export const MIN_DAYS_ADVANCED = 7

/**
 * Meal influence half-life: a meal affects wellbeing for this many days
 * with linearly decreasing weight (1.0 → 0.0 over LAG_DAYS days).
 */
export const LAG_DAYS = 10.5

// ─── Variable metadata ───────────────────────────────────────────────────────

export const VARIABLE_META = {
  // ── Lifestyle ──────────────────────────────────────────────────────────────
  sleepMinutes: {
    label: 'Durée de sommeil',
    unit: 'min',
    format: (v) => `${Math.round(v)} min`,
    direction: 'higher_better',
    group: 'lifestyle',
  },
  steps: {
    label: 'Pas quotidiens',
    unit: 'pas',
    format: (v) => `${Math.round(v).toLocaleString('fr-FR')} pas`,
    direction: 'higher_better',
    group: 'lifestyle',
  },
  activityCalories: {
    label: 'Calories brûlées (activité)',
    unit: 'kcal',
    format: (v) => `${Math.round(v)} kcal`,
    direction: 'higher_better',
    group: 'lifestyle',
  },
  restingHR: {
    label: 'FC repos',
    unit: 'bpm',
    format: (v) => `${Math.round(v)} bpm`,
    direction: 'lower_better',
    group: 'lifestyle',
  },
  // ── Macronutrients ─────────────────────────────────────────────────────────
  kcal: {
    label: 'Apport calorique',
    unit: 'kcal',
    format: (v) => `${Math.round(v)} kcal`,
    direction: 'neutral',
    group: 'macro',
  },
  protein_g: {
    label: 'Protéines',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'higher_better',
    group: 'macro',
  },
  fat_g: {
    label: 'Lipides',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'neutral',
    group: 'macro',
  },
  carbohydrates_g: {
    label: 'Glucides',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'neutral',
    group: 'macro',
  },
  fiber_g: {
    label: 'Fibres',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'higher_better',
    group: 'macro',
  },
  sugar_g: {
    label: 'Sucres',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'lower_better',
    group: 'macro',
  },
  saturated_fat_g: {
    label: 'Acides gras saturés',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'lower_better',
    group: 'macro',
  },
  omega3_g: {
    label: 'Oméga-3',
    unit: 'g',
    format: (v) => `${v.toFixed(2)} g`,
    direction: 'higher_better',
    group: 'macro',
  },
  alcohol_g: {
    label: 'Alcool',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'lower_better',
    group: 'macro',
  },
  mealCount: {
    label: 'Nombre de repas',
    unit: 'repas',
    format: (v) => `${Math.round(v)} repas`,
    direction: 'neutral',
    group: 'lifestyle',
  },
  // ── FODMAPs ────────────────────────────────────────────────────────────────
  fodmap_score: {
    label: 'Score FODMAP (repas le plus élevé)',
    unit: '',
    format: (v) => {
      const labels = ['Aucun', 'Faible', 'Modéré', 'Élevé']
      return labels[Math.round(v)] ?? `${v.toFixed(1)}`
    },
    direction: 'lower_better',
    group: 'fodmap',
  },
  // ── Vitamines ──────────────────────────────────────────────────────────────
  vitamin_c_mg: {
    label: 'Vitamine C',
    unit: 'mg',
    format: (v) => `${v.toFixed(1)} mg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  vitamin_d_ug: {
    label: 'Vitamine D',
    unit: 'µg',
    format: (v) => `${v.toFixed(2)} µg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  vitamin_b12_ug: {
    label: 'Vitamine B12',
    unit: 'µg',
    format: (v) => `${v.toFixed(2)} µg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  vitamin_b9_ug: {
    label: 'Folates (B9)',
    unit: 'µg',
    format: (v) => `${v.toFixed(1)} µg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  vitamin_a_ug: {
    label: 'Vitamine A',
    unit: 'µg',
    format: (v) => `${v.toFixed(1)} µg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  vitamin_e_mg: {
    label: 'Vitamine E',
    unit: 'mg',
    format: (v) => `${v.toFixed(2)} mg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  // ── Minéraux ───────────────────────────────────────────────────────────────
  calcium_mg: {
    label: 'Calcium',
    unit: 'mg',
    format: (v) => `${v.toFixed(1)} mg`,
    direction: 'higher_better',
    group: 'mineral',
  },
  iron_mg: {
    label: 'Fer',
    unit: 'mg',
    format: (v) => `${v.toFixed(2)} mg`,
    direction: 'higher_better',
    group: 'mineral',
  },
  magnesium_mg: {
    label: 'Magnésium',
    unit: 'mg',
    format: (v) => `${v.toFixed(1)} mg`,
    direction: 'higher_better',
    group: 'mineral',
  },
  zinc_mg: {
    label: 'Zinc',
    unit: 'mg',
    format: (v) => `${v.toFixed(2)} mg`,
    direction: 'higher_better',
    group: 'mineral',
  },
  potassium_mg: {
    label: 'Potassium',
    unit: 'mg',
    format: (v) => `${v.toFixed(1)} mg`,
    direction: 'higher_better',
    group: 'mineral',
  },
  sodium_mg: {
    label: 'Sodium',
    unit: 'mg',
    format: (v) => `${v.toFixed(1)} mg`,
    direction: 'lower_better',
    group: 'mineral',
  },
}

// ─── Step 1 — build daily dataset ────────────────────────────────────────────

/**
 * @param {string} iso
 * @returns {string} YYYY-MM-DD in local calendar
 */
export function localDateKey(iso) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Aggregates raw health entries into one feature-row per calendar day.
 * Only days that contain at least one wellbeing score are included (wellbeing
 * is the target variable for every analysis).
 *
 * Nutrition fields in the day row are the raw daily totals
 * (not yet time-lagged — see buildLaggedDataset).
 *
 * @param {Array} entries  raw entries from listEntries()
 * @returns {Array<DayRow>}  sorted ascending by dateKey
 */
export function buildDailyDataset(entries) {
  if (!entries || entries.length === 0) return []

  const days = new Map()

  function getDay(dateKey) {
    if (!days.has(dateKey)) {
      days.set(dateKey, {
        dateKey,
        _wellbeingSum: 0, _wellbeingCount: 0,
        sleepMinutes: 0,
        steps: 0,
        activityCalories: 0,
        _hrSum: 0, _hrCount: 0,
        kcal: 0,
        protein_g: 0,
        fat_g: 0,
        carbohydrates_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        saturated_fat_g: 0,
        omega3_g: 0,
        alcohol_g: 0,
        fodmap_score: 0,
        vitamin_c_mg: 0,
        vitamin_d_ug: 0,
        vitamin_b12_ug: 0,
        vitamin_b9_ug: 0,
        vitamin_a_ug: 0,
        vitamin_e_mg: 0,
        calcium_mg: 0,
        iron_mg: 0,
        magnesium_mg: 0,
        zinc_mg: 0,
        potassium_mg: 0,
        sodium_mg: 0,
        mealCount: 0,
      })
    }
    return days.get(dateKey)
  }

  for (const e of entries) {
    if (!e.at) continue
    const dk = localDateKey(e.at)
    const day = getDay(dk)

    switch (e.type) {
      case 'wellbeing': {
        const score = e.payload?.score
        if (typeof score === 'number' && score >= 0 && score <= 5) {
          day._wellbeingSum += score
          day._wellbeingCount += 1
        }
        break
      }

      case 'sleep': {
        const mins = e.payload?.durationMinutes
        if (typeof mins === 'number' && mins > 0) {
          day.sleepMinutes += mins
        }
        break
      }

      case 'steps': {
        const val = e.payload?.value
        if (typeof val === 'number' && val > 0) {
          day.steps += val
        }
        break
      }

      case 'activity': {
        const cal = e.payload?.totalCalories
        if (typeof cal === 'number' && cal > 0) {
          day.activityCalories += cal
        }
        break
      }

      case 'heart_rate': {
        const subtype = e.payload?.subtype
        if (subtype !== 'restingHeartRate') break
        const bpm = e.payload?.bpm ?? e.payload?.value
        if (typeof bpm === 'number' && bpm > 0) {
          day._hrSum += bpm
          day._hrCount += 1
        }
        break
      }

      case 'food': {
        const items = e.payload?.items
        if (!Array.isArray(items) || items.length === 0) break
        const totals = computeTotalsFromItems(items)
        day.kcal += totals.energy_kcal
        day.protein_g += totals.protein_g
        day.fat_g += totals.fat_g
        day.carbohydrates_g += totals.carbohydrates_g
        day.fiber_g += totals.fiber_g
        day.sugar_g += totals.sugar_g
        day.saturated_fat_g += totals.saturated_fat_g
        day.omega3_g += totals.omega3_g
        day.alcohol_g += totals.alcohol_g
        // FODMAP: keep the max across all meals of the day
        if (typeof totals.fodmap_score === 'number') {
          day.fodmap_score = Math.max(day.fodmap_score, totals.fodmap_score)
        }
        day.vitamin_c_mg += totals.vitamin_c_mg
        day.vitamin_d_ug += totals.vitamin_d_ug
        day.vitamin_b12_ug += totals.vitamin_b12_ug
        day.vitamin_b9_ug += totals.vitamin_b9_ug
        day.vitamin_a_ug += totals.vitamin_a_ug
        day.vitamin_e_mg += totals.vitamin_e_mg
        day.calcium_mg += totals.calcium_mg
        day.iron_mg += totals.iron_mg
        day.magnesium_mg += totals.magnesium_mg
        day.zinc_mg += totals.zinc_mg
        day.potassium_mg += totals.potassium_mg
        day.sodium_mg += totals.sodium_mg
        day.mealCount += 1
        break
      }

      default:
        break
    }
  }

  const result = []
  for (const [, day] of days) {
    if (day._wellbeingCount === 0) continue
    result.push({
      dateKey:          day.dateKey,
      wellbeing:        day._wellbeingSum / day._wellbeingCount,
      sleepMinutes:     day.sleepMinutes,
      steps:            day.steps,
      activityCalories: day.activityCalories,
      restingHR:        day._hrCount > 0 ? day._hrSum / day._hrCount : 0,
      kcal:             day.kcal,
      protein_g:        day.protein_g,
      fat_g:            day.fat_g,
      carbohydrates_g:  day.carbohydrates_g,
      fiber_g:          day.fiber_g,
      sugar_g:          day.sugar_g,
      saturated_fat_g:  day.saturated_fat_g,
      omega3_g:         day.omega3_g,
      alcohol_g:        day.alcohol_g,
      fodmap_score:     day.fodmap_score,
      vitamin_c_mg:     day.vitamin_c_mg,
      vitamin_d_ug:     day.vitamin_d_ug,
      vitamin_b12_ug:   day.vitamin_b12_ug,
      vitamin_b9_ug:    day.vitamin_b9_ug,
      vitamin_a_ug:     day.vitamin_a_ug,
      vitamin_e_mg:     day.vitamin_e_mg,
      calcium_mg:       day.calcium_mg,
      iron_mg:          day.iron_mg,
      magnesium_mg:     day.magnesium_mg,
      zinc_mg:          day.zinc_mg,
      potassium_mg:     day.potassium_mg,
      sodium_mg:        day.sodium_mg,
      mealCount:        day.mealCount,
    })
  }

  result.sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1))
  return result
}

// ─── Step 2 — time-lag smoothing ─────────────────────────────────────────────

/**
 * Nutrition keys that are subject to time-lag smoothing.
 * Lifestyle metrics (sleep, steps, etc.) are not lagged because they reflect
 * the state of the *current* day, not accumulated nutritional status.
 *
 * FODMAP score uses a special max-based approach rather than weighted sum,
 * so it is excluded from the linear-decay list and handled separately.
 */
const LAGGED_NUTRITION_KEYS = NUTRITION_FIELDS.filter((f) => f !== 'energy_kcal')
  .concat(['kcal'])
  .filter((f) => f !== 'fodmap_score')

/**
 * Applies a linear-decay temporal window to nutrition features.
 *
 * For each target day t (a day with a wellbeing score), the effective
 * nutritional value of key k is:
 *
 *   effectiveK(t) = Σ_{d ≤ t, d ≥ t-LAG_DAYS} rawK(d) * w(t - d)
 *
 * where w(Δ) = max(0, 1 - Δ / LAG_DAYS)
 *
 * The denominator (sum of weights over days that have data) is used to
 * normalise, so the result stays on the same scale as the raw values.
 *
 * This lets the model capture the sustained influence of diet on wellbeing
 * over ~1.5 weeks, rather than treating each day in isolation.
 *
 * @param {Array<DayRow>} dataset  sorted ascending (output of buildDailyDataset)
 * @returns {Array<DayRow>}  same structure, nutrition keys replaced with lagged values
 */
export function buildLaggedDataset(dataset) {
  if (!dataset || dataset.length === 0) return []

  // Build a fast lookup: dateKey → raw row
  const byDate = new Map(dataset.map((d) => [d.dateKey, d]))

  return dataset.map((targetRow) => {
    const targetDate = new Date(targetRow.dateKey + 'T00:00:00Z')
    const laggedRow = { ...targetRow }

    const weightedSums = Object.fromEntries(LAGGED_NUTRITION_KEYS.map((k) => [k, 0]))
    let totalWeight = 0

    for (let delta = 0; delta <= LAG_DAYS; delta++) {
      const w = 1 - delta / LAG_DAYS
      if (w <= 0) continue

      const d = new Date(targetDate)
      d.setUTCDate(d.getUTCDate() - delta)
      const dk = d.toISOString().slice(0, 10)

      const srcRow = byDate.get(dk)
      if (!srcRow) continue

      totalWeight += w
      for (const key of LAGGED_NUTRITION_KEYS) {
        weightedSums[key] += (srcRow[key] ?? 0) * w
      }
    }

    if (totalWeight > 0) {
      for (const key of LAGGED_NUTRITION_KEYS) {
        laggedRow[key] = weightedSums[key] / totalWeight
      }
    }

    return laggedRow
  })
}

// ─── Step 3 — Pearson correlation ────────────────────────────────────────────

/**
 * Returns the Pearson r between two equal-length numeric arrays, or null if
 * the input is invalid (< 3 points, unequal length, zero variance).
 *
 * @param {number[]} x
 * @param {number[]} y
 * @returns {number|null}
 */
export function pearsonCorrelation(x, y) {
  if (!x || !y || x.length !== y.length || x.length < 3) return null

  const n = x.length
  const meanX = x.reduce((s, v) => s + v, 0) / n
  const meanY = y.reduce((s, v) => s + v, 0) / n

  let num = 0, sdX = 0, sdY = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    num += dx * dy
    sdX += dx * dx
    sdY += dy * dy
  }

  if (sdX === 0 || sdY === 0) return 0
  return num / Math.sqrt(sdX * sdY)
}

// ─── Step 4 — basic correlations ─────────────────────────────────────────────

/**
 * Computes Pearson correlation between each health variable and wellbeing,
 * then returns the top-3 factors that most *decrease* wellbeing.
 *
 * Uses the time-lagged dataset for nutrition variables.
 *
 * @param {Array} entries
 * @returns {BasicResult}
 */
export function computeBasicCorrelations(entries) {
  const rawDataset = buildDailyDataset(entries)
  const n = rawDataset.length

  if (n < MIN_DAYS_BASIC) {
    return {
      status: 'not_enough_data',
      minDays: MIN_DAYS_BASIC,
      currentDays: n,
    }
  }

  const dataset = buildLaggedDataset(rawDataset)

  const wellbeingVec = dataset.map((d) => d.wellbeing)
  const featureKeys = Object.keys(VARIABLE_META)

  const correlations = []
  for (const key of featureKeys) {
    const vec = dataset.map((d) => d[key] ?? 0)
    if (vec.every((v) => v === 0)) continue
    const r = pearsonCorrelation(wellbeingVec, vec)
    if (r === null) continue
    correlations.push({
      variable: key,
      label: VARIABLE_META[key].label,
      r,
      direction: VARIABLE_META[key].direction,
      group: VARIABLE_META[key].group,
    })
  }

  correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r))

  const negativeFactors = correlations
    .filter((c) => {
      if (c.direction === 'higher_better') return c.r < -0.15
      if (c.direction === 'lower_better') return c.r < -0.15
      return Math.abs(c.r) > 0.15
    })
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
    .slice(0, 3)

  const topNegativeFactors =
    negativeFactors.length > 0
      ? negativeFactors
      : correlations.slice(0, 3)

  return {
    status: 'ok',
    datasetDays: n,
    correlations,
    topNegativeFactors: topNegativeFactors.map((c) => ({
      ...c,
      impact: Math.abs(c.r),
      advice: buildBasicAdvice(c),
    })),
  }
}

function buildBasicAdvice({ variable, r, direction }) {
  const meta = VARIABLE_META[variable]
  const label = meta?.label ?? variable

  if (direction === 'higher_better' && r < 0) {
    return `Augmenter votre apport en ${label.toLowerCase()} pourrait améliorer votre bien-être.`
  }
  if (direction === 'lower_better' && r < 0) {
    return `Réduire votre ${label.toLowerCase()} pourrait améliorer votre bien-être.`
  }
  if (r > 0) {
    return `Un ${label.toLowerCase()} plus élevé est associé à un meilleur bien-être.`
  }
  return `Un ${label.toLowerCase()} plus bas est associé à un meilleur bien-être.`
}

// ─── Step 5 — advanced ML analysis (OLS multiple regression) ─────────────────

/**
 * Fits an OLS multiple linear regression on the time-lagged dataset.
 *
 * Uses the lagged nutrition values so that the model captures the sustained
 * nutritional influence over ~10.5 days. The objective is to identify which
 * dietary patterns maximise the integral of wellbeing over time.
 *
 * @param {Array} entries
 * @returns {AdvancedResult}
 */
export function computeAdvancedAnalysis(entries) {
  const rawDataset = buildDailyDataset(entries)
  const n = rawDataset.length

  if (n < MIN_DAYS_ADVANCED) {
    return {
      status: 'not_enough_data',
      minDays: MIN_DAYS_ADVANCED,
      currentDays: n,
    }
  }

  const dataset = buildLaggedDataset(rawDataset)

  const featureKeys = Object.keys(VARIABLE_META).filter((k) => {
    const vec = dataset.map((d) => d[k] ?? 0)
    return !vec.every((v) => v === 0)
  })

  if (featureKeys.length === 0) {
    return { status: 'not_enough_data', minDays: MIN_DAYS_ADVANCED, currentDays: n }
  }

  const y = dataset.map((d) => d.wellbeing)
  const stdY = std(y)

  const featureMeans = featureKeys.map((k) => mean(dataset.map((d) => d[k] ?? 0)))
  const featureStds = featureKeys.map((k) => {
    const s = std(dataset.map((d) => d[k] ?? 0))
    return s === 0 ? 1 : s
  })

  // X: n × (p+1) with intercept column, features standardised
  const X = dataset.map((row) => {
    const feats = featureKeys.map((k, j) => {
      return ((row[k] ?? 0) - featureMeans[j]) / featureStds[j]
    })
    return [1, ...feats]
  })

  const beta = olsNormalEquations(X, y)
  if (!beta) {
    const basic = computeBasicCorrelations(entries)
    if (basic.status !== 'ok') return { status: 'not_enough_data', minDays: MIN_DAYS_ADVANCED, currentDays: n }
    return {
      status: 'ok',
      datasetDays: n,
      modelInfo: { r2: null, method: 'correlation_fallback' },
      featureImportance: basic.correlations.slice(0, 5).map((c) => ({
        variable: c.variable,
        label: c.label,
        importance: Math.abs(c.r),
        direction: c.r > 0 ? 'positive' : 'negative',
        coefficient: c.r,
        group: c.group,
        advice: buildAdvancedAdvice(c.variable, c.r, dataset),
      })),
      topRecommendations: basic.topNegativeFactors.map((f) => f.advice),
      residuals: null,
    }
  }

  const yPred = X.map((row) => row.reduce((s, x, j) => s + x * beta[j], 0))
  const r2 = computeR2(y, yPred)

  const featureImportance = featureKeys.map((key, j) => {
    const betaJ = beta[j + 1]
    const stdX = featureStds[j]
    const stdCoeff = stdY > 0 ? (betaJ * stdX) / stdY : 0
    return {
      variable: key,
      label: VARIABLE_META[key].label,
      importance: Math.abs(stdCoeff),
      direction: stdCoeff >= 0 ? 'positive' : 'negative',
      coefficient: stdCoeff,
      group: VARIABLE_META[key].group,
      advice: buildAdvancedAdvice(key, stdCoeff, dataset),
    }
  })

  featureImportance.sort((a, b) => b.importance - a.importance)

  const negImpact = featureImportance
    .filter((f) => f.direction === 'negative' && f.importance > 0.05)
    .slice(0, 5)

  const topRecommendations = negImpact.length > 0
    ? negImpact.map((f) => f.advice)
    : featureImportance.slice(0, 3).map((f) => f.advice)

  return {
    status: 'ok',
    datasetDays: n,
    modelInfo: {
      r2,
      method: 'ols_linear_regression',
      nFeatures: featureKeys.length,
      lagDays: LAG_DAYS,
    },
    featureImportance: featureImportance.slice(0, 12),
    topRecommendations,
    residuals: y.map((actual, i) => ({ dateKey: dataset[i].dateKey, actual, predicted: yPred[i] })),
  }
}

// ─── OLS helpers ─────────────────────────────────────────────────────────────

function olsNormalEquations(X, y) {
  const n = X.length
  if (n === 0) return null
  const k = X[0].length

  const A = Array.from({ length: k }, () => new Array(k).fill(0))
  const b = new Array(k).fill(0)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < k; j++) {
      b[j] += X[i][j] * y[i]
      for (let l = 0; l < k; l++) {
        A[j][l] += X[i][j] * X[i][l]
      }
    }
  }

  const aug = A.map((row, i) => [...row, b[i]])
  const eps = 1e-10

  for (let col = 0; col < k; col++) {
    let maxRow = col
    for (let row = col + 1; row < k; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row
    }
    ;[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]
    if (Math.abs(aug[col][col]) < eps) return null

    const pivot = aug[col][col]
    for (let row = col + 1; row < k; row++) {
      const factor = aug[row][col] / pivot
      for (let j = col; j <= k; j++) {
        aug[row][j] -= factor * aug[col][j]
      }
    }
  }

  const beta = new Array(k).fill(0)
  for (let i = k - 1; i >= 0; i--) {
    beta[i] = aug[i][k]
    for (let j = i + 1; j < k; j++) {
      beta[i] -= aug[i][j] * beta[j]
    }
    beta[i] /= aug[i][i]
  }

  return beta
}

function computeR2(yTrue, yPred) {
  const yMean = mean(yTrue)
  const ssTot = yTrue.reduce((s, v) => s + (v - yMean) ** 2, 0)
  const ssRes = yTrue.reduce((s, v, i) => s + (v - yPred[i]) ** 2, 0)
  if (ssTot === 0) return 0
  return 1 - ssRes / ssTot
}

function mean(arr) {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function std(arr) {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

// ─── Advanced advice builder ──────────────────────────────────────────────────

function buildAdvancedAdvice(variable, coefficient, dataset) {
  const meta = VARIABLE_META[variable]
  const label = meta?.label ?? variable
  const avg = mean(dataset.map((d) => d[variable] ?? 0))
  const formattedAvg = meta ? meta.format(avg) : avg.toFixed(1)

  if (coefficient < 0) {
    if (meta?.direction === 'higher_better') {
      return `Votre ${label.toLowerCase()} moyen est de ${formattedAvg}. L'augmenter devrait significativement améliorer votre bien-être selon le modèle.`
    }
    if (meta?.direction === 'lower_better') {
      return `Votre ${label.toLowerCase()} est actuellement de ${formattedAvg}. Le réduire est associé à un meilleur bien-être selon le modèle.`
    }
    return `Votre ${label.toLowerCase()} actuel (${formattedAvg}) a un impact négatif sur votre bien-être. Essayez d'ajuster ce paramètre.`
  } else {
    if (meta?.direction === 'higher_better') {
      return `Votre ${label.toLowerCase()} moyen est de ${formattedAvg}. Ce facteur impacte positivement votre bien-être : continuez ainsi !`
    }
    if (meta?.direction === 'lower_better') {
      return `Votre ${label.toLowerCase()} est actuellement de ${formattedAvg}. Continuer à le maintenir bas est bénéfique pour votre bien-être.`
    }
    return `Votre ${label.toLowerCase()} actuel (${formattedAvg}) contribue positivement à votre bien-être.`
  }
}
