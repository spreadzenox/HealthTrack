/**
 * Local statistical & machine-learning analysis engine.
 *
 * All computations run 100% client-side, no network, no API key.
 *
 * Architecture:
 *   1. buildDailyDataset  – aggregates raw IndexedDB entries into one row per day
 *   2. pearsonCorrelation  – pure Pearson r between two numeric arrays
 *   3. computeBasicCorrelations  – "Recommandations basiques" (≥ MIN_DAYS_BASIC days)
 *   4. computeAdvancedAnalysis   – "Recommandations avancées"  (≥ MIN_DAYS_ADVANCED days)
 *      Uses multiple linear regression (OLS via normal equations) for feature importance.
 */

import { computeTotalsFromItems } from './nutritionKPIs'

// ─── Public constants ────────────────────────────────────────────────────────

export const MIN_DAYS_BASIC = 2
export const MIN_DAYS_ADVANCED = 7

// ─── Variable metadata ───────────────────────────────────────────────────────

export const VARIABLE_META = {
  sleepMinutes: {
    label: 'Durée de sommeil',
    unit: 'min',
    format: (v) => `${Math.round(v)} min`,
    direction: 'higher_better',
  },
  steps: {
    label: 'Pas quotidiens',
    unit: 'pas',
    format: (v) => `${Math.round(v).toLocaleString('fr-FR')} pas`,
    direction: 'higher_better',
  },
  activityCalories: {
    label: 'Calories brûlées (activité)',
    unit: 'kcal',
    format: (v) => `${Math.round(v)} kcal`,
    direction: 'higher_better',
  },
  restingHR: {
    label: 'FC repos',
    unit: 'bpm',
    format: (v) => `${Math.round(v)} bpm`,
    direction: 'lower_better',
  },
  kcal: {
    label: 'Apport calorique',
    unit: 'kcal',
    format: (v) => `${Math.round(v)} kcal`,
    direction: 'neutral',
  },
  protein_g: {
    label: 'Protéines',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'higher_better',
  },
  fat_g: {
    label: 'Lipides',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'neutral',
  },
  carbohydrates_g: {
    label: 'Glucides',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'neutral',
  },
  fiber_g: {
    label: 'Fibres',
    unit: 'g',
    format: (v) => `${v.toFixed(1)} g`,
    direction: 'higher_better',
  },
  mealCount: {
    label: 'Nombre de repas',
    unit: 'repas',
    format: (v) => `${Math.round(v)} repas`,
    direction: 'neutral',
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
 * @param {Array} entries  raw entries from listEntries()
 * @returns {Array<DayRow>}  sorted ascending by dateKey
 *
 * DayRow shape:
 * {
 *   dateKey:          string   YYYY-MM-DD
 *   wellbeing:        number   avg 0–5
 *   sleepMinutes:     number   total sleep minutes (may be 0)
 *   steps:            number   total steps (may be 0)
 *   activityCalories: number   total kcal from activities (may be 0)
 *   restingHR:        number   avg resting bpm (may be 0 = missing)
 *   kcal:             number   total food energy (may be 0)
 *   protein_g:        number
 *   fat_g:            number
 *   carbohydrates_g:  number
 *   fiber_g:          number
 *   mealCount:        number
 * }
 */
export function buildDailyDataset(entries) {
  if (!entries || entries.length === 0) return []

  // Buckets by date key
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
        kcal: 0, protein_g: 0, fat_g: 0, carbohydrates_g: 0, fiber_g: 0,
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
        // Only use restingHeartRate
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
        day.mealCount += 1
        break
      }

      default:
        break
    }
  }

  // Only keep days with at least one wellbeing score; compute averages
  const result = []
  for (const [, day] of days) {
    if (day._wellbeingCount === 0) continue
    result.push({
      dateKey: day.dateKey,
      wellbeing: day._wellbeingSum / day._wellbeingCount,
      sleepMinutes: day.sleepMinutes,
      steps: day.steps,
      activityCalories: day.activityCalories,
      restingHR: day._hrCount > 0 ? day._hrSum / day._hrCount : 0,
      kcal: day.kcal,
      protein_g: day.protein_g,
      fat_g: day.fat_g,
      carbohydrates_g: day.carbohydrates_g,
      fiber_g: day.fiber_g,
      mealCount: day.mealCount,
    })
  }

  result.sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1))
  return result
}

// ─── Step 2 — Pearson correlation ────────────────────────────────────────────

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

// ─── Step 3 — basic correlations ─────────────────────────────────────────────

/**
 * Computes Pearson correlation between each health variable and wellbeing,
 * then returns the top-3 factors that most *decrease* wellbeing (i.e. the
 * variables whose absence / low values hurt the score the most).
 *
 * Active after MIN_DAYS_BASIC days of wellbeing history.
 *
 * @param {Array} entries
 * @returns {BasicResult}
 *
 * BasicResult:
 * { status: 'not_enough_data', minDays, currentDays }
 * | { status: 'ok', datasetDays, correlations, topNegativeFactors }
 *
 * correlations: Array<{ variable, label, r, direction }>
 * topNegativeFactors: Array<{ variable, label, r, impact, advice }>
 */
export function computeBasicCorrelations(entries) {
  const dataset = buildDailyDataset(entries)
  const n = dataset.length

  if (n < MIN_DAYS_BASIC) {
    return {
      status: 'not_enough_data',
      minDays: MIN_DAYS_BASIC,
      currentDays: n,
    }
  }

  const wellbeingVec = dataset.map((d) => d.wellbeing)
  const featureKeys = Object.keys(VARIABLE_META)

  const correlations = []
  for (const key of featureKeys) {
    const vec = dataset.map((d) => d[key] ?? 0)
    // Skip variables that are all zeros (not measured)
    if (vec.every((v) => v === 0)) continue
    const r = pearsonCorrelation(wellbeingVec, vec)
    if (r === null) continue
    correlations.push({
      variable: key,
      label: VARIABLE_META[key].label,
      r,
      direction: VARIABLE_META[key].direction,
    })
  }

  // Sort by absolute correlation descending
  correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r))

  // Top 3 negative-impact factors:
  // For "higher_better" variables: a negative r means "too little → lower wellbeing"
  // For "lower_better" variables: a positive r means "too high → lower wellbeing"
  // For "neutral": both directions matter but we flag largest absolute impact
  const negativeFactors = correlations
    .filter((c) => {
      if (c.direction === 'higher_better') return c.r < -0.15
      if (c.direction === 'lower_better') return c.r > 0.15
      return Math.abs(c.r) > 0.15
    })
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
    .slice(0, 3)

  // If not enough strictly negative factors, fill with highest absolute correlations
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

/** Build a short actionable advice sentence from a correlation result. */
function buildBasicAdvice({ variable, r, direction }) {
  const meta = VARIABLE_META[variable]
  const label = meta?.label ?? variable

  if (direction === 'higher_better' && r < 0) {
    return `Augmenter votre ${label.toLowerCase()} pourrait améliorer votre bien-être.`
  }
  if (direction === 'lower_better' && r > 0) {
    return `Réduire votre ${label.toLowerCase()} pourrait améliorer votre bien-être.`
  }
  if (r > 0) {
    return `Un ${label.toLowerCase()} plus élevé est associé à un meilleur bien-être.`
  }
  return `Un ${label.toLowerCase()} plus bas est associé à un meilleur bien-être.`
}

// ─── Step 4 — advanced ML analysis (OLS multiple regression) ─────────────────

/**
 * Fits an Ordinary Least Squares multiple linear regression model
 * (wellbeing ~ features) using the normal equations:
 *   β = (XᵀX)⁻¹ Xᵀy
 *
 * Then reports:
 *   - Feature importance via standardised coefficients (β × σ_x / σ_y)
 *   - R² (in-sample coefficient of determination)
 *   - Predicted wellbeing vs actual (residuals)
 *   - Top recommendations based on feature importance
 *
 * Active after MIN_DAYS_ADVANCED days.
 *
 * @param {Array} entries
 * @returns {AdvancedResult}
 */
export function computeAdvancedAnalysis(entries) {
  const dataset = buildDailyDataset(entries)
  const n = dataset.length

  if (n < MIN_DAYS_ADVANCED) {
    return {
      status: 'not_enough_data',
      minDays: MIN_DAYS_ADVANCED,
      currentDays: n,
    }
  }

  const featureKeys = Object.keys(VARIABLE_META).filter((k) => {
    const vec = dataset.map((d) => d[k] ?? 0)
    return !vec.every((v) => v === 0)
  })

  if (featureKeys.length === 0) {
    return { status: 'not_enough_data', minDays: MIN_DAYS_ADVANCED, currentDays: n }
  }

  const y = dataset.map((d) => d.wellbeing)
  const stdY = std(y)

  // Build feature matrix (n × p) — standardised for stability
  const featureMeans = featureKeys.map((k) => mean(dataset.map((d) => d[k] ?? 0)))
  const featureStds = featureKeys.map((k) => {
    const s = std(dataset.map((d) => d[k] ?? 0))
    return s === 0 ? 1 : s
  })

  // X: n × (p+1) with intercept column
  const X = dataset.map((row) => {
    const feats = featureKeys.map((k, j) => {
      return ((row[k] ?? 0) - featureMeans[j]) / featureStds[j]
    })
    return [1, ...feats] // intercept
  })

  const beta = olsNormalEquations(X, y)
  if (!beta) {
    // Singular matrix — fall back to correlation-only
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
        advice: buildAdvancedAdvice(c.variable, c.r, dataset),
      })),
      topRecommendations: basic.topNegativeFactors.map((f) => f.advice),
      residuals: null,
    }
  }

  // Compute R²
  const yPred = X.map((row) => row.reduce((s, x, j) => s + x * beta[j], 0))
  const r2 = computeR2(y, yPred)

  // Standardised coefficients (β_j * σ_xj / σ_y) → feature importance
  const featureImportance = featureKeys.map((key, j) => {
    const betaJ = beta[j + 1] // +1 because beta[0] is intercept
    const stdX = featureStds[j]
    const stdCoeff = stdY > 0 ? (betaJ * stdX) / stdY : 0
    return {
      variable: key,
      label: VARIABLE_META[key].label,
      importance: Math.abs(stdCoeff),
      direction: stdCoeff >= 0 ? 'positive' : 'negative',
      coefficient: stdCoeff,
      advice: buildAdvancedAdvice(key, stdCoeff, dataset),
    }
  })

  featureImportance.sort((a, b) => b.importance - a.importance)

  // Top recommendations: focus on variables with negative standardised coefficients
  // (negative impact on wellbeing = opportunity for improvement)
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
    },
    featureImportance: featureImportance.slice(0, 8),
    topRecommendations,
    residuals: y.map((actual, i) => ({ dateKey: dataset[i].dateKey, actual, predicted: yPred[i] })),
  }
}

// ─── OLS helpers ─────────────────────────────────────────────────────────────

/**
 * Solves β = (XᵀX)⁻¹ Xᵀy via Gaussian elimination.
 * X is n×k, y is length-n. Returns beta (length k) or null if singular.
 */
function olsNormalEquations(X, y) {
  const n = X.length
  if (n === 0) return null
  const k = X[0].length

  // Compute A = XᵀX (k×k) and b = Xᵀy (k)
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

  // Augmented matrix [A | b]
  const aug = A.map((row, i) => [...row, b[i]])
  const eps = 1e-10

  // Forward elimination
  for (let col = 0; col < k; col++) {
    // Find pivot
    let maxRow = col
    for (let row = col + 1; row < k; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row
    }
    ;[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]
    if (Math.abs(aug[col][col]) < eps) return null // singular

    const pivot = aug[col][col]
    for (let row = col + 1; row < k; row++) {
      const factor = aug[row][col] / pivot
      for (let j = col; j <= k; j++) {
        aug[row][j] -= factor * aug[col][j]
      }
    }
  }

  // Back substitution
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
    // Negative impact on wellbeing
    if (meta?.direction === 'higher_better') {
      return `Votre ${label.toLowerCase()} moyen est de ${formattedAvg}. L'augmenter devrait significativement améliorer votre bien-être selon le modèle.`
    }
    if (meta?.direction === 'lower_better') {
      return `Votre ${label.toLowerCase()} est actuellement de ${formattedAvg}. Le réduire est associé à un meilleur bien-être selon le modèle.`
    }
    return `Votre ${label.toLowerCase()} actuel (${formattedAvg}) a un impact négatif sur votre bien-être. Essayez d'ajuster ce paramètre.`
  } else {
    // Positive impact
    if (meta?.direction === 'higher_better') {
      return `Votre ${label.toLowerCase()} moyen est de ${formattedAvg}. Ce facteur impacte positivement votre bien-être : continuez ainsi !`
    }
    if (meta?.direction === 'lower_better') {
      return `Votre ${label.toLowerCase()} est actuellement de ${formattedAvg}. Continuer à le maintenir bas est bénéfique pour votre bien-être.`
    }
    return `Votre ${label.toLowerCase()} actuel (${formattedAvg}) contribue positivement à votre bien-être.`
  }
}
