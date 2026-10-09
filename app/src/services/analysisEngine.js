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
import {
  effectiveSampleSize,
  correlationPValue,
  benjaminiHochberg,
  correlationStrength,
  evidenceLevel,
} from './statistics'

// ─── Public constants ────────────────────────────────────────────────────────

/**
 * With fewer than 5 wellbeing days, Pearson r is effectively random (3 points
 * always give |r|=1; 4 points are barely better). Require 5 as the minimum
 * for any correlation to be interpretable.
 */
export const MIN_DAYS_BASIC    = 5
export const MIN_DAYS_ADVANCED = 7

/**
 * Feature pre-selection ratio for the advanced model.
 * The number of features fed to OLS is capped at floor(n_train × ratio).
 * This prevents severe overfitting when n_train is small relative to the
 * total number of available predictors (~30).
 * Features are ranked by |Pearson r| with wellbeing on the training set,
 * and only the top K are kept.
 */
export const MAX_FEATURES_RATIO = 0.5

/**
 * Absolute cap on the number of variables in the advanced model, whatever the
 * history length — beyond ~10 predictors a daily wellbeing score cannot
 * support interpretable coefficients.
 */
export const MAX_FEATURES = 10

/**
 * Two candidate variables whose |Pearson r| exceeds this threshold carry the
 * same information (e.g. steps / activity calories / total calories).  Only
 * the one most correlated with wellbeing is kept: fitting both makes their
 * coefficients explode in opposite directions.
 */
export const COLLINEARITY_MAX_R = 0.9

/**
 * Ridge penalties tried for the advanced model (features are standardised).
 * The one with the lowest leave-one-out error is kept.
 */
export const RIDGE_LAMBDAS = [0.1, 0.3, 1, 3, 10, 30, 100, 300]

/**
 * Minimum |standardised coefficient| for the advanced model to suggest a
 * lever: below 0.1 SD of wellbeing per SD of the variable, the effect is too
 * small to be worth acting on (and is usually noise).
 */
export const MIN_ADVICE_EFFECT = 0.1

/**
 * Meal influence half-life: a meal affects wellbeing for this many days
 * with linearly decreasing weight (1.0 → 0.0 over LAG_DAYS days).
 */
export const LAG_DAYS = 10.5

/**
 * Number of most-recent days held out from model training.
 *
 * The model is always trained on (n - HOLD_OUT_DAYS) days and then used to
 * predict the held-out days.  This produces genuine out-of-sample predictions
 * that cannot overfit to the days they were trained on, which prevents the
 * "predicted adapts in real-time to match actual" artefact observed in the
 * in-sample residuals approach.
 */
export const HOLD_OUT_DAYS = 2

// ─── Variable metadata ───────────────────────────────────────────────────────

/** Fixed-decimal number written the French way (« 4,32 »). */
function frDecimal(v, digits) {
  return v.toFixed(digits).replace('.', ',')
}

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
  avgHR: {
    label: 'FC moyenne (journée)',
    unit: 'bpm',
    format: (v) => `${Math.round(v)} bpm`,
    direction: 'neutral',
    group: 'lifestyle',
  },
  hrv_ms: {
    label: 'Variabilité FC (HRV)',
    unit: 'ms',
    format: (v) => `${Math.round(v)} ms`,
    direction: 'higher_better',
    group: 'lifestyle',
  },
  spo2_pct: {
    label: 'Saturation en oxygène (SpO₂)',
    unit: '%',
    format: (v) => `${frDecimal(v, 1)} %`,
    direction: 'higher_better',
    group: 'lifestyle',
  },
  dailyCaloriesHC: {
    label: 'Calories brûlées totales (Health Connect)',
    unit: 'kcal',
    format: (v) => `${Math.round(v)} kcal`,
    direction: 'higher_better',
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
    format: (v) => `${frDecimal(v, 1)} g`,
    direction: 'higher_better',
    group: 'macro',
  },
  fat_g: {
    label: 'Lipides',
    unit: 'g',
    format: (v) => `${frDecimal(v, 1)} g`,
    direction: 'neutral',
    group: 'macro',
  },
  carbohydrates_g: {
    label: 'Glucides',
    unit: 'g',
    format: (v) => `${frDecimal(v, 1)} g`,
    direction: 'neutral',
    group: 'macro',
  },
  fiber_g: {
    label: 'Fibres',
    unit: 'g',
    format: (v) => `${frDecimal(v, 1)} g`,
    direction: 'higher_better',
    group: 'macro',
  },
  sugar_g: {
    label: 'Sucres',
    unit: 'g',
    format: (v) => `${frDecimal(v, 1)} g`,
    direction: 'lower_better',
    group: 'macro',
  },
  saturated_fat_g: {
    label: 'Acides gras saturés',
    unit: 'g',
    format: (v) => `${frDecimal(v, 1)} g`,
    direction: 'lower_better',
    group: 'macro',
  },
  omega3_g: {
    label: 'Oméga-3',
    unit: 'g',
    format: (v) => `${frDecimal(v, 2)} g`,
    direction: 'higher_better',
    group: 'macro',
  },
  alcohol_g: {
    label: 'Alcool',
    unit: 'g',
    format: (v) => `${frDecimal(v, 1)} g`,
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
  cigaretteCount: {
    label: 'Cigarettes',
    unit: 'cig.',
    format: (v) => `${Math.round(v)} cigarette${Math.round(v) > 1 ? 's' : ''}`,
    direction: 'lower_better',
    group: 'lifestyle',
  },
  // ── FODMAPs ────────────────────────────────────────────────────────────────
  fodmap_score: {
    label: 'Score FODMAP (repas le plus élevé)',
    unit: '',
    format: (v) => {
      const labels = ['Aucun', 'Faible', 'Modéré', 'Élevé']
      return labels[Math.round(v)] ?? `${frDecimal(v, 1)}`
    },
    direction: 'lower_better',
    group: 'fodmap',
  },
  // ── Vitamines ──────────────────────────────────────────────────────────────
  vitamin_c_mg: {
    label: 'Vitamine C',
    unit: 'mg',
    format: (v) => `${frDecimal(v, 1)} mg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  vitamin_d_ug: {
    label: 'Vitamine D',
    unit: 'µg',
    format: (v) => `${frDecimal(v, 2)} µg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  vitamin_b12_ug: {
    label: 'Vitamine B12',
    unit: 'µg',
    format: (v) => `${frDecimal(v, 2)} µg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  vitamin_b9_ug: {
    label: 'Folates (B9)',
    unit: 'µg',
    format: (v) => `${frDecimal(v, 1)} µg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  vitamin_a_ug: {
    label: 'Vitamine A',
    unit: 'µg',
    format: (v) => `${frDecimal(v, 1)} µg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  vitamin_e_mg: {
    label: 'Vitamine E',
    unit: 'mg',
    format: (v) => `${frDecimal(v, 2)} mg`,
    direction: 'higher_better',
    group: 'vitamin',
  },
  // ── Minéraux ───────────────────────────────────────────────────────────────
  calcium_mg: {
    label: 'Calcium',
    unit: 'mg',
    format: (v) => `${frDecimal(v, 1)} mg`,
    direction: 'higher_better',
    group: 'mineral',
  },
  iron_mg: {
    label: 'Fer',
    unit: 'mg',
    format: (v) => `${frDecimal(v, 2)} mg`,
    direction: 'higher_better',
    group: 'mineral',
  },
  magnesium_mg: {
    label: 'Magnésium',
    unit: 'mg',
    format: (v) => `${frDecimal(v, 1)} mg`,
    direction: 'higher_better',
    group: 'mineral',
  },
  zinc_mg: {
    label: 'Zinc',
    unit: 'mg',
    format: (v) => `${frDecimal(v, 2)} mg`,
    direction: 'higher_better',
    group: 'mineral',
  },
  potassium_mg: {
    label: 'Potassium',
    unit: 'mg',
    format: (v) => `${frDecimal(v, 1)} mg`,
    direction: 'higher_better',
    group: 'mineral',
  },
  sodium_mg: {
    label: 'Sodium',
    unit: 'mg',
    format: (v) => `${frDecimal(v, 1)} mg`,
    direction: 'lower_better',
    group: 'mineral',
  },
  // ── Withings Body Scan (balance connectée) ─────────────────────────────────
  weight_kg: {
    label: 'Poids',
    unit: 'kg',
    format: (v) => `${frDecimal(v, 1)} kg`,
    direction: 'neutral',
    group: 'body',
  },
  bmi: {
    label: 'IMC',
    unit: '',
    format: (v) => `${frDecimal(v, 1)}`,
    direction: 'neutral',
    group: 'body',
  },
  fat_ratio_pct: {
    label: 'Masse grasse (%)',
    unit: '%',
    format: (v) => `${frDecimal(v, 1)} %`,
    direction: 'lower_better',
    group: 'body',
  },
  fat_mass_kg: {
    label: 'Masse grasse',
    unit: 'kg',
    format: (v) => `${frDecimal(v, 2)} kg`,
    direction: 'lower_better',
    group: 'body',
  },
  muscle_mass_kg: {
    label: 'Masse musculaire',
    unit: 'kg',
    format: (v) => `${frDecimal(v, 2)} kg`,
    direction: 'higher_better',
    group: 'body',
  },
  bone_mass_kg: {
    label: 'Masse osseuse',
    unit: 'kg',
    format: (v) => `${frDecimal(v, 2)} kg`,
    direction: 'higher_better',
    group: 'body',
  },
  hydration_pct: {
    label: 'Hydratation',
    unit: '%',
    format: (v) => `${frDecimal(v, 1)} %`,
    direction: 'higher_better',
    group: 'body',
  },
  visceral_fat_index: {
    label: 'Indice graisse viscérale',
    unit: '',
    format: (v) => `${frDecimal(v, 1)}`,
    direction: 'lower_better',
    group: 'body',
  },
  bmr_kcal: {
    label: 'Métabolisme basal (Withings)',
    unit: 'kcal',
    format: (v) => `${Math.round(v)} kcal`,
    direction: 'neutral',
    group: 'body',
  },
  vascular_age_years: {
    label: 'Âge vasculaire',
    unit: 'ans',
    format: (v) => `${Math.round(v)} ans`,
    direction: 'lower_better',
    group: 'body',
  },
  standing_hr_bpm: {
    label: 'FC debout (balance)',
    unit: 'bpm',
    format: (v) => `${Math.round(v)} bpm`,
    direction: 'neutral',
    group: 'body',
  },
  pwv_mps: {
    label: 'Vitesse d’onde de pouls',
    unit: 'm/s',
    format: (v) => `${frDecimal(v, 1)} m/s`,
    direction: 'lower_better',
    group: 'body',
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
 * Returns the number of distinct calendar days (YYYY-MM-DD) that have any
 * entry, regardless of type. Used to inform the user how many total days of
 * data they have vs. how many include a wellbeing score (the model input).
 *
 * @param {Array} entries
 * @returns {number}
 */
export function countTotalDataDays(entries) {
  if (!entries || entries.length === 0) return 0
  const days = new Set(entries.filter((e) => e.at).map((e) => localDateKey(e.at)))
  return days.size
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
        _avgHRSum: 0, _avgHRCount: 0,
        _hrvSum: 0, _hrvCount: 0,
        _spo2Sum: 0, _spo2Count: 0,
        dailyCaloriesHC: 0,
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
        cigaretteCount: 0,
        weight_kg: 0,
        bmi: 0,
        fat_ratio_pct: 0,
        fat_mass_kg: 0,
        muscle_mass_kg: 0,
        bone_mass_kg: 0,
        hydration_pct: 0,
        visceral_fat_index: 0,
        bmr_kcal: 0,
        vascular_age_years: 0,
        standing_hr_bpm: 0,
        pwv_mps: 0,
        _heightCm: 0,
      })
    }
    return days.get(dateKey)
  }

  function applyBodyComposition(day, payload) {
    if (!payload) return
    if (payload.valueKg > 0) day.weight_kg = payload.valueKg
    if (payload.fatRatioPct > 0) day.fat_ratio_pct = payload.fatRatioPct
    if (payload.fatMassKg > 0) day.fat_mass_kg = payload.fatMassKg
    if (payload.muscleMassKg > 0) day.muscle_mass_kg = payload.muscleMassKg
    if (payload.boneMassKg > 0) day.bone_mass_kg = payload.boneMassKg
    if (payload.hydrationPct > 0) day.hydration_pct = payload.hydrationPct
    if (payload.visceralFatIndex > 0) day.visceral_fat_index = payload.visceralFatIndex
    if (payload.bmrKcal > 0) day.bmr_kcal = payload.bmrKcal
    if (payload.vascularAgeYears > 0) day.vascular_age_years = payload.vascularAgeYears
    if (payload.standingHrBpm > 0) day.standing_hr_bpm = payload.standingHrBpm
    if (payload.pwvMps > 0) day.pwv_mps = payload.pwvMps
  }

  function updateBmi(day) {
    if (day.weight_kg > 0 && day._heightCm > 0) {
      const h = day._heightCm / 100
      day.bmi = Math.round((day.weight_kg / (h * h)) * 10) / 10
    }
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
        const bpm = e.payload?.bpm ?? e.payload?.value
        if (subtype === 'restingHeartRate') {
          if (typeof bpm === 'number' && bpm > 0) {
            day._hrSum += bpm
            day._hrCount += 1
          }
        } else if (subtype === 'heartRate') {
          if (typeof bpm === 'number' && bpm > 0) {
            day._avgHRSum += bpm
            day._avgHRCount += 1
          }
        } else if (subtype === 'heartRateVariability') {
          const hrv = e.payload?.value ?? bpm
          if (typeof hrv === 'number' && hrv > 0) {
            day._hrvSum += hrv
            day._hrvCount += 1
          }
        } else if (subtype === 'oxygenSaturation') {
          const spo2 = e.payload?.value ?? bpm
          if (typeof spo2 === 'number' && spo2 > 0) {
            day._spo2Sum += spo2
            day._spo2Count += 1
          }
        }
        break
      }

      case 'calories': {
        const cal = e.payload?.value
        if (typeof cal === 'number' && cal > 0) {
          day.dailyCaloriesHC += cal
        }
        break
      }

      case 'cigarette': {
        const count = e.payload?.count
        if (typeof count === 'number' && count > 0) {
          day.cigaretteCount += count
        } else {
          day.cigaretteCount += 1
        }
        break
      }

      case 'weight': {
        const kg = e.payload?.valueKg
        if (typeof kg === 'number' && kg > 0) {
          day.weight_kg = kg
          updateBmi(day)
        }
        break
      }

      case 'height': {
        const cm = e.payload?.valueCm
        if (typeof cm === 'number' && cm > 0) {
          day._heightCm = cm
          updateBmi(day)
        }
        break
      }

      case 'body_composition': {
        applyBodyComposition(day, e.payload)
        updateBmi(day)
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
      dateKey:            day.dateKey,
      wellbeing:          day._wellbeingSum / day._wellbeingCount,
      sleepMinutes:       day.sleepMinutes,
      steps:              day.steps,
      activityCalories:   day.activityCalories,
      restingHR:          day._hrCount > 0 ? day._hrSum / day._hrCount : 0,
      avgHR:              day._avgHRCount > 0 ? day._avgHRSum / day._avgHRCount : 0,
      hrv_ms:             day._hrvCount > 0 ? day._hrvSum / day._hrvCount : 0,
      spo2_pct:           day._spo2Count > 0 ? day._spo2Sum / day._spo2Count : 0,
      dailyCaloriesHC:    day.dailyCaloriesHC,
      kcal:               day.kcal,
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
      cigaretteCount:   day.cigaretteCount,
      weight_kg:        day.weight_kg,
      bmi:              day.bmi,
      fat_ratio_pct:    day.fat_ratio_pct,
      fat_mass_kg:      day.fat_mass_kg,
      muscle_mass_kg:   day.muscle_mass_kg,
      bone_mass_kg:     day.bone_mass_kg,
      hydration_pct:    day.hydration_pct,
      visceral_fat_index: day.visceral_fat_index,
      bmr_kcal:         day.bmr_kcal,
      vascular_age_years: day.vascular_age_years,
      standing_hr_bpm:  day.standing_hr_bpm,
      pwv_mps:          day.pwv_mps,
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
    const nEff = effectiveSampleSize(wellbeingVec, vec)
    correlations.push({
      variable: key,
      label: VARIABLE_META[key].label,
      r,
      n,
      nEff,
      p: correlationPValue(r, nEff),
      direction: VARIABLE_META[key].direction,
      group: VARIABLE_META[key].group,
    })
  }

  // Honest qualification: effective n (autocorrelation), p-value, FDR q-value.
  const qValues = benjaminiHochberg(correlations.map((c) => c.p))
  correlations.forEach((c, i) => {
    c.q = qValues[i]
    c.strength = correlationStrength(c.r)
    c.evidence = evidenceLevel(c.q)
  })

  correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r))

  // Reliability assessment for the basic mode:
  // - With 5–9 days, Pearson r is computed but has high uncertainty (treat as exploratory)
  // - With ≥ 10 days, correlations are more stable
  const reliability = n >= 10 ? 'good' : 'exploratory'

  return {
    status: 'ok',
    datasetDays: n,
    reliability,
    correlations,
    levers: correlations
      .filter((c) => c.q < LEVER_MAX_Q && leverAction(c.variable, c.r))
      .slice(0, 3)
      .map((c) => ({ ...c, action: leverAction(c.variable, c.r) })),
  }
}

// ─── Levers (actionable variables) ───────────────────────────────────────────

/** Correlations whose FDR-adjusted p-value is above this are never proposed. */
export const LEVER_MAX_Q = 0.2

/**
 * Variables the user can act on directly, with the healthy action in plain
 * French. Physiological outcomes (heart rate, HRV, SpO₂, body composition…)
 * are deliberately absent: "reduce your resting HR" is not something one does.
 */
export const LEVER_ACTIONS = {
  sleepMinutes: 'Dormir un peu plus longtemps',
  steps: 'Marcher davantage',
  activityCalories: 'Bouger davantage (activité physique)',
  protein_g: 'Manger un peu plus de protéines',
  fiber_g: 'Manger plus de fibres (légumes, légumineuses, céréales complètes)',
  sugar_g: 'Manger moins sucré',
  saturated_fat_g: 'Limiter les graisses saturées (charcuterie, fritures, beurre)',
  omega3_g: 'Manger plus d’oméga-3 (poissons gras, noix, huile de colza)',
  alcohol_g: 'Boire moins d’alcool',
  cigaretteCount: 'Fumer moins de cigarettes',
  fodmap_score: 'Alléger les repas riches en FODMAP',
  vitamin_c_mg: 'Plus de fruits et légumes riches en vitamine C',
  vitamin_d_ug: 'Plus de vitamine D (poissons gras, œufs, soleil)',
  vitamin_b12_ug: 'Plus de vitamine B12 (produits animaux, aliments enrichis)',
  vitamin_b9_ug: 'Plus de folates (légumes verts, légumineuses)',
  vitamin_a_ug: 'Plus de vitamine A (carottes, patate douce, légumes verts)',
  vitamin_e_mg: 'Plus de vitamine E (oléagineux, huiles végétales)',
  calcium_mg: 'Plus de calcium (laitages, eaux calciques, amandes)',
  iron_mg: 'Plus de fer (légumineuses, viande, épinards)',
  magnesium_mg: 'Plus de magnésium (oléagineux, céréales complètes, chocolat noir)',
  zinc_mg: 'Plus de zinc (fruits de mer, viande, graines)',
  potassium_mg: 'Plus de potassium (fruits, légumes, légumineuses)',
  sodium_mg: 'Manger moins salé',
}

/**
 * Returns the action to suggest for this variable, or null when the variable
 * is not actionable or when the observed sign contradicts the healthy
 * direction (e.g. more omega-3 linked to LOWER wellbeing → no advice: the
 * link is probably indirect, and advising the opposite of the data is wrong).
 */
export function leverAction(variable, r) {
  const action = LEVER_ACTIONS[variable]
  const direction = VARIABLE_META[variable]?.direction
  if (!action) return null
  if (direction === 'higher_better' && r > 0) return action
  if (direction === 'lower_better' && r < 0) return action
  return null
}

// ─── Step 5 — advanced ML analysis (OLS multiple regression) ─────────────────

/**
 * Builds a feature row for today from all entries, without requiring a
 * wellbeing score to exist.  Lifestyle metrics (steps, sleep, HR…) are
 * aggregated from today's entries; nutrition keys are lag-weighted using
 * historicalRawDataset as the lookback window.
 *
 * @param {Array}        entries               raw entries from listEntriesForAnalysis
 * @param {Array<DayRow>} historicalRawDataset  output of buildDailyDataset (wellbeing days)
 * @returns {DayRow|null}  today's feature row, or null when no data exists at all today
 */
export function buildTodayRow(entries, historicalRawDataset) {
  const todayKey = localDateKey(new Date().toISOString())

  const row = {
    dateKey: todayKey,
    _wellbeingSum: 0, _wellbeingCount: 0,
    sleepMinutes: 0,
    steps: 0,
    activityCalories: 0,
    _hrSum: 0, _hrCount: 0,
    _avgHRSum: 0, _avgHRCount: 0,
    _hrvSum: 0, _hrvCount: 0,
    _spo2Sum: 0, _spo2Count: 0,
    dailyCaloriesHC: 0,
    kcal: 0, protein_g: 0, fat_g: 0, carbohydrates_g: 0,
    fiber_g: 0, sugar_g: 0, saturated_fat_g: 0, omega3_g: 0, alcohol_g: 0,
    fodmap_score: 0,
    vitamin_c_mg: 0, vitamin_d_ug: 0, vitamin_b12_ug: 0, vitamin_b9_ug: 0,
    vitamin_a_ug: 0, vitamin_e_mg: 0,
    calcium_mg: 0, iron_mg: 0, magnesium_mg: 0, zinc_mg: 0,
    potassium_mg: 0, sodium_mg: 0,
    mealCount: 0,
    cigaretteCount: 0,
  }

  let hasAnyData = false

  for (const e of entries) {
    if (!e.at || localDateKey(e.at) !== todayKey) continue
    hasAnyData = true

    switch (e.type) {
      case 'cigarette': {
        const count = e.payload?.count
        if (typeof count === 'number' && count > 0) {
          row.cigaretteCount += count
        } else {
          row.cigaretteCount += 1
        }
        break
      }
      case 'wellbeing': {
        const score = e.payload?.score
        if (typeof score === 'number' && score >= 0 && score <= 5) {
          row._wellbeingSum += score
          row._wellbeingCount += 1
        }
        break
      }
      case 'sleep': {
        const mins = e.payload?.durationMinutes
        if (typeof mins === 'number' && mins > 0) row.sleepMinutes += mins
        break
      }
      case 'steps': {
        const val = e.payload?.value
        if (typeof val === 'number' && val > 0) row.steps += val
        break
      }
      case 'activity': {
        const cal = e.payload?.totalCalories
        if (typeof cal === 'number' && cal > 0) row.activityCalories += cal
        break
      }
      case 'heart_rate': {
        const subtype = e.payload?.subtype
        const bpm = e.payload?.bpm ?? e.payload?.value
        if (subtype === 'restingHeartRate' && typeof bpm === 'number' && bpm > 0) {
          row._hrSum += bpm; row._hrCount += 1
        } else if (subtype === 'heartRate' && typeof bpm === 'number' && bpm > 0) {
          row._avgHRSum += bpm; row._avgHRCount += 1
        } else if (subtype === 'heartRateVariability') {
          const v = e.payload?.value ?? bpm
          if (typeof v === 'number' && v > 0) { row._hrvSum += v; row._hrvCount += 1 }
        } else if (subtype === 'oxygenSaturation') {
          const v = e.payload?.value ?? bpm
          if (typeof v === 'number' && v > 0) { row._spo2Sum += v; row._spo2Count += 1 }
        }
        break
      }
      case 'calories': {
        const cal = e.payload?.value
        if (typeof cal === 'number' && cal > 0) row.dailyCaloriesHC += cal
        break
      }
      case 'food': {
        const items = e.payload?.items
        if (!Array.isArray(items) || items.length === 0) break
        const totals = computeTotalsFromItems(items)
        row.kcal += totals.energy_kcal
        row.protein_g += totals.protein_g
        row.fat_g += totals.fat_g
        row.carbohydrates_g += totals.carbohydrates_g
        row.fiber_g += totals.fiber_g
        row.sugar_g += totals.sugar_g
        row.saturated_fat_g += totals.saturated_fat_g
        row.omega3_g += totals.omega3_g
        row.alcohol_g += totals.alcohol_g
        if (typeof totals.fodmap_score === 'number') {
          row.fodmap_score = Math.max(row.fodmap_score, totals.fodmap_score)
        }
        row.vitamin_c_mg += totals.vitamin_c_mg
        row.vitamin_d_ug += totals.vitamin_d_ug
        row.vitamin_b12_ug += totals.vitamin_b12_ug
        row.vitamin_b9_ug += totals.vitamin_b9_ug
        row.vitamin_a_ug += totals.vitamin_a_ug
        row.vitamin_e_mg += totals.vitamin_e_mg
        row.calcium_mg += totals.calcium_mg
        row.iron_mg += totals.iron_mg
        row.magnesium_mg += totals.magnesium_mg
        row.zinc_mg += totals.zinc_mg
        row.potassium_mg += totals.potassium_mg
        row.sodium_mg += totals.sodium_mg
        row.mealCount += 1
        break
      }
      default:
        break
    }
  }

  if (!hasAnyData) return null

  // Finalise averaged metrics
  const todayRaw = {
    ...row,
    restingHR:  row._hrCount    > 0 ? row._hrSum    / row._hrCount    : 0,
    avgHR:      row._avgHRCount > 0 ? row._avgHRSum  / row._avgHRCount : 0,
    hrv_ms:     row._hrvCount   > 0 ? row._hrvSum    / row._hrvCount   : 0,
    spo2_pct:   row._spo2Count  > 0 ? row._spo2Sum   / row._spo2Count  : 0,
    wellbeing:  row._wellbeingCount > 0 ? row._wellbeingSum / row._wellbeingCount : null,
  }

  // Apply nutrition lag: merge historical raw data with today's row
  const byDate = new Map(historicalRawDataset.map((d) => [d.dateKey, d]))
  byDate.set(todayKey, todayRaw)

  const targetDate = new Date(todayKey + 'T00:00:00Z')
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
      todayRaw[key] = weightedSums[key] / totalWeight
    }
  }

  return todayRaw
}

/**
 * Fits a Ridge-regularised OLS model on a pre-built lagged dataset slice,
 * returning the fitted parameters needed to make predictions.
 *
 * The caller selects which rows of the lagged dataset to train on; this lets
 * us trivially implement hold-out evaluation without duplicating the
 * standardisation / matrix-build logic.
 *
 * @param {Array<DayRow>} trainRows       subset of lagged rows used for fitting
 * @param {string[]|null} [allowedKeys]   optional pre-selected feature keys;
 *                                        if null, all non-zero keys are used
 * @returns {{ featureKeys, featureMeans, featureStds, beta, X, y } | null}
 *   null when Ridge still cannot produce a solution (degenerate data)
 */
function _fitModelOnRows(trainRows, allowedKeys = null) {
  const candidateKeys = allowedKeys ?? Object.keys(VARIABLE_META)
  const featureKeys = candidateKeys.filter((k) => {
    const vec = trainRows.map((d) => d[k] ?? 0)
    return !vec.every((v) => v === 0)
  })
  if (featureKeys.length === 0) return null

  const featureMeans = featureKeys.map((k) => mean(trainRows.map((d) => d[k] ?? 0)))
  const featureStds  = featureKeys.map((k) => {
    const s = std(trainRows.map((d) => d[k] ?? 0))
    return s === 0 ? 1 : s
  })

  const y = trainRows.map((d) => d.wellbeing)
  const X = trainRows.map((row) => [
    1,
    ...featureKeys.map((k, j) => ((row[k] ?? 0) - featureMeans[j]) / featureStds[j]),
  ])

  const tuned = tuneRidge(X, y)
  if (!tuned) return null

  return { featureKeys, featureMeans, featureStds, ...tuned, X, y }
}

/**
 * Greedy collinearity pruning: walks `rankedKeys` in order (most relevant
 * first) and drops any key whose |r| with an already-kept key exceeds
 * COLLINEARITY_MAX_R.
 *
 * @param {string[]} rankedKeys
 * @param {Array<Object>} rows
 * @param {number} [maxR=COLLINEARITY_MAX_R]
 * @returns {{ keys: string[], dropped: Array<{variable, keptInstead, r}> }}
 */
export function pruneCollinearFeatures(rankedKeys, rows, maxR = COLLINEARITY_MAX_R) {
  const keys = []
  const dropped = []
  const vecs = {}
  for (const key of rankedKeys) {
    vecs[key] = rows.map((d) => d[key] ?? 0)
    const twin = keys
      .map((k) => ({ k, r: Math.abs(pearsonCorrelation(vecs[k], vecs[key]) ?? 0) }))
      .find((c) => c.r > maxR)
    if (twin) dropped.push({ variable: key, keptInstead: twin.k, r: twin.r })
    else keys.push(key)
  }
  return { keys, dropped }
}

/**
 * Feature selection for the advanced model, on the training rows only:
 * rank candidates by |Pearson r| with wellbeing, drop near-duplicates, then
 * keep the top K = min(MAX_FEATURES, max(2, floor(n_train × MAX_FEATURES_RATIO))).
 */
function _selectFeatureKeys(trainRows) {
  const wellbeingVec = trainRows.map((d) => d.wellbeing)
  const ranked = Object.keys(VARIABLE_META)
    .map((k) => {
      const vec = trainRows.map((d) => d[k] ?? 0)
      if (vec.every((v) => v === 0)) return null
      const r = pearsonCorrelation(wellbeingVec, vec)
      return r !== null ? { key: k, absR: Math.abs(r) } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.absR - a.absR)
    .map((c) => c.key)
  const k = Math.min(MAX_FEATURES, Math.max(2, Math.floor(trainRows.length * MAX_FEATURES_RATIO)))
  const { keys, dropped } = pruneCollinearFeatures(ranked, trainRows)
  return { keys: keys.slice(0, k), dropped: dropped.filter((d) => keys.indexOf(d.keptInstead) < k) }
}

/**
 * Fits an OLS multiple linear regression on the time-lagged dataset.
 *
 * Uses the lagged nutrition values so that the model captures the sustained
 * nutritional influence over ~10.5 days. The objective is to identify which
 * dietary patterns maximise the integral of wellbeing over time.
 *
 * The model is trained on all days EXCEPT the last HOLD_OUT_DAYS days.
 * The held-out days are then predicted using this model, producing genuinely
 * out-of-sample residuals (not in-sample fitted values) that cannot adapt to
 * data they never saw during training.
 *
 * @param {Array} entries
 * @returns {AdvancedResult}
 */
export function computeAdvancedAnalysis(entries) {
  const rawDataset = buildDailyDataset(entries)
  const n = rawDataset.length

  // We need at least MIN_DAYS_ADVANCED training days PLUS the hold-out window
  if (n < MIN_DAYS_ADVANCED + HOLD_OUT_DAYS) {
    return {
      status: 'not_enough_data',
      minDays: MIN_DAYS_ADVANCED + HOLD_OUT_DAYS,
      currentDays: n,
    }
  }

  const dataset = buildLaggedDataset(rawDataset)

  // Split: train on everything except the last HOLD_OUT_DAYS days
  const trainRows = dataset.slice(0, n - HOLD_OUT_DAYS)
  const holdOutRows = dataset.slice(n - HOLD_OUT_DAYS)

  const allCandidateKeys = Object.keys(VARIABLE_META)
  const { keys: selectedKeys, dropped } = _selectFeatureKeys(trainRows)
  const droppedCollinear = dropped.map((d) => ({
    ...d,
    label: VARIABLE_META[d.variable].label,
    keptInsteadLabel: VARIABLE_META[d.keptInstead].label,
  }))

  const fit = _fitModelOnRows(trainRows, selectedKeys.length > 0 ? selectedKeys : null)
  if (!fit) {
    const basic = computeBasicCorrelations(entries)
    if (basic.status !== 'ok') return { status: 'not_enough_data', minDays: MIN_DAYS_ADVANCED + HOLD_OUT_DAYS, currentDays: n }
    return {
      status: 'ok',
      datasetDays: n,
      modelInfo: { r2: null, r2_loo: null, method: 'correlation_fallback' },
      featureImportance: basic.correlations.slice(0, 5).map((c) => ({
        variable: c.variable,
        label: c.label,
        importance: Math.abs(c.r),
        direction: c.r > 0 ? 'positive' : 'negative',
        coefficient: c.r,
        group: c.group,
        advice: buildAdvancedAdvice(c.variable, c.r, dataset),
      })),
      topRecommendations: basic.levers.map((l) => buildAdvancedAdvice(l.variable, l.r, dataset)).filter(Boolean),
      residuals: null,
      todayPrediction: null,
    }
  }

  const { featureKeys, featureMeans, featureStds, beta, lambda, r2_loo, X: Xtrain, y: ytrain } = fit

  // In-sample R² on the training partition (for display — expected to be high)
  const yPredTrain = Xtrain.map((row) => row.reduce((s, x, j) => s + x * beta[j], 0))
  const r2 = computeR2(ytrain, yPredTrain)

  const stdY = std(ytrain)

  // Standardised beta coefficients (feature importance).  X is already
  // standardised, so beta[j] is "wellbeing points per 1 SD of the feature":
  // dividing by SD(y) is enough (multiplying again by SD(x) inflated
  // coefficients by the feature's scale — e.g. ×2 000 for steps).
  const rawImportances = featureKeys.map((key, j) => (stdY > 0 ? beta[j + 1] / stdY : 0))

  const maxRawImportance = Math.max(...rawImportances.map(Math.abs))

  const featureImportance = featureKeys.map((key, j) => {
    const stdCoeff = rawImportances[j]
    return {
      variable: key,
      label: VARIABLE_META[key].label,
      importance: maxRawImportance > 1e-9 ? Math.abs(stdCoeff) / maxRawImportance : 0,
      direction: stdCoeff >= 0 ? 'positive' : 'negative',
      coefficient: stdCoeff,
      group: VARIABLE_META[key].group,
      advice: buildAdvancedAdvice(key, stdCoeff, trainRows),
    }
  })

  featureImportance.sort((a, b) => b.importance - a.importance)

  // Only actionable variables whose effect sign matches the healthy direction.
  const topRecommendations = featureImportance
    .filter((f) => Math.abs(f.coefficient) >= MIN_ADVICE_EFFECT && f.advice)
    .slice(0, 3)
    .map((f) => f.advice)

  // Hold-out residuals: predict the last HOLD_OUT_DAYS days using the model
  // trained WITHOUT those days — genuine out-of-sample evaluation.
  const residuals = holdOutRows.map((row) => {
    const xRow = [
      1,
      ...featureKeys.map((k, j) => ((row[k] ?? 0) - featureMeans[j]) / featureStds[j]),
    ]
    const rawPred = xRow.reduce((s, x, j) => s + x * beta[j], 0)
    const predicted = Math.max(0, Math.min(5, rawPred))
    return { dateKey: row.dateKey, actual: row.wellbeing, predicted }
  })

  // Predict today using the hold-out model (trained without last HOLD_OUT_DAYS)
  const todayPrediction = _predictToday(entries, rawDataset, featureKeys, featureMeans, featureStds, beta)

  // Model reliability:
  // - overfit_risk: true when the intercept + all feature coefficients ≥ training days
  //   (classical p ≥ n regime — training R² is inflated even with Ridge)
  // - model_reliable: true when LOO R² is positive, meaning the model generalises
  //   beyond its training data.  null when LOO could not be computed.
  const overfit_risk = featureKeys.length + 1 >= trainRows.length
  const model_reliable = r2_loo !== null ? r2_loo > 0 : null

  return {
    status: 'ok',
    datasetDays: n,
    modelInfo: {
      r2,
      r2_loo,
      method: 'ols_linear_regression',
      nFeatures: featureKeys.length,
      nFeaturesFinal: featureKeys.length,
      nFeaturesCandidate: allCandidateKeys.length,
      lagDays: LAG_DAYS,
      lambda,
      droppedCollinear,
      overfit_risk,
      model_reliable,
    },
    featureImportance: featureImportance.slice(0, 12),
    topRecommendations,
    residuals,
    todayPrediction,
  }
}

/**
 * Standalone function: fit the model and return a prediction for today's
 * wellbeing.  Returns null if there is not enough historical data or no
 * data at all for today.
 *
 * The model is trained on all historical days EXCEPT the last HOLD_OUT_DAYS
 * days, so that the prediction for today is never influenced by recent actual
 * wellbeing scores that the model "saw" during training.  This prevents the
 * artefact where adding a new wellbeing score immediately shifts the predicted
 * value to match it.
 *
 * @param {Array} entries  raw entries from listEntriesForAnalysis
 * @returns {{ dateKey: string, predicted: number, actual: number|null }|null}
 */
export function computeTodayPrediction(entries) {
  const rawDataset = buildDailyDataset(entries)
  // We need at least MIN_DAYS_ADVANCED training rows after removing the hold-out window
  if (rawDataset.length < MIN_DAYS_ADVANCED + HOLD_OUT_DAYS) return null

  const dataset = buildLaggedDataset(rawDataset)

  // Train on all days except the last HOLD_OUT_DAYS
  const trainRows = dataset.slice(0, dataset.length - HOLD_OUT_DAYS)
  const { keys } = _selectFeatureKeys(trainRows)
  const fit = _fitModelOnRows(trainRows, keys.length > 0 ? keys : null)
  if (!fit) return null

  const { featureKeys, featureMeans, featureStds, beta } = fit
  return _predictToday(entries, rawDataset, featureKeys, featureMeans, featureStds, beta)
}

/**
 * Internal helper: given an already-fitted model, build today's feature row
 * and return a prediction.
 */
function _predictToday(entries, rawDataset, featureKeys, featureMeans, featureStds, beta) {
  const todayRow = buildTodayRow(entries, rawDataset)
  if (!todayRow) return null

  const xToday = [
    1,
    ...featureKeys.map((k, j) => ((todayRow[k] ?? 0) - featureMeans[j]) / featureStds[j]),
  ]
  const rawPred = xToday.reduce((s, x, j) => s + x * beta[j], 0)
  // Clamp to valid wellbeing range [0, 5]
  const predicted = Math.max(0, Math.min(5, rawPred))
  const actual = typeof todayRow.wellbeing === 'number' ? todayRow.wellbeing : null

  return {
    dateKey: todayRow.dateKey,
    predicted,
    actual,
  }
}

// ─── OLS helpers ─────────────────────────────────────────────────────────────

/**
 * Solves (X^T X + λI) β = X^T y via Gaussian elimination with partial pivoting.
 * The intercept column (index 0) is NOT regularised (λ only applied to feature cols).
 * Returns null only if the augmented system is still degenerate after regularisation.
 *
 * @param {number[][]} X   n × k design matrix (first column is the intercept 1s)
 * @param {number[]}   y   n-length response vector
 * @param {number}    [lambda=0]  Ridge penalty (L2 regularisation)
 * @returns {number[]|null}  k-length coefficient vector, or null on failure
 */
export function olsNormalEquations(X, y, lambda = 0) {
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

  // Apply Ridge penalty to all columns except the intercept (col 0)
  for (let j = 1; j < k; j++) {
    A[j][j] += lambda
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

/**
 * Exact leave-one-out predictions of a Ridge fit with penalty `lambda`,
 * without refitting n times: for a linear smoother, the LOO residual is
 * e_i / (1 − h_ii) where h_ii = x_i (XᵀX + λD)⁻¹ x_iᵀ.  O(n·k²) instead of
 * O(n²·k²) — matters on a phone with a year of history.
 * Returns null when the system is singular or a point has leverage ≈ 1.
 *
 * @param {number[][]} X  n × k design matrix (intercept column first, not penalised)
 * @param {number[]}   y
 * @param {number}     lambda
 * @returns {number[]|null}
 */
export function ridgeLooPredictions(X, y, lambda) {
  const n = X.length
  if (n === 0) return null
  const k = X[0].length
  const Ainv = invertMatrix(ridgeGram(X, lambda))
  if (!Ainv) return null
  const Xty = new Array(k).fill(0)
  for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) Xty[j] += X[i][j] * y[i]
  const beta = Ainv.map((row) => row.reduce((s, a, j) => s + a * Xty[j], 0))

  const yHat = new Array(n)
  for (let i = 0; i < n; i++) {
    const xi = X[i]
    let h = 0
    for (let j = 0; j < k; j++) {
      let t = 0
      for (let l = 0; l < k; l++) t += Ainv[j][l] * xi[l]
      h += xi[j] * t
    }
    if (1 - h < 1e-9) return null
    const fitted = xi.reduce((s, x, j) => s + x * beta[j], 0)
    yHat[i] = y[i] - (y[i] - fitted) / (1 - h)
  }
  return yHat
}

/** XᵀX + λ·diag(0, 1, …, 1) — the intercept (column 0) is not penalised. */
function ridgeGram(X, lambda) {
  const k = X[0].length
  const A = Array.from({ length: k }, () => new Array(k).fill(0))
  for (const row of X) {
    for (let j = 0; j < k; j++) {
      for (let l = 0; l < k; l++) A[j][l] += row[j] * row[l]
    }
  }
  for (let j = 1; j < k; j++) A[j][j] += lambda
  return A
}

/** Gauss-Jordan inverse with partial pivoting; null when singular. */
function invertMatrix(M) {
  const k = M.length
  const aug = M.map((row, i) => [...row, ...Array.from({ length: k }, (_, j) => (i === j ? 1 : 0))])
  for (let col = 0; col < k; col++) {
    let maxRow = col
    for (let row = col + 1; row < k; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row
    }
    ;[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]
    const pivot = aug[col][col]
    if (Math.abs(pivot) < 1e-10) return null
    for (let j = 0; j < 2 * k; j++) aug[col][j] /= pivot
    for (let row = 0; row < k; row++) {
      if (row === col) continue
      const factor = aug[row][col]
      if (factor === 0) continue
      for (let j = 0; j < 2 * k; j++) aug[row][j] -= factor * aug[col][j]
    }
  }
  return aug.map((row) => row.slice(k))
}

/**
 * Fits Ridge regression with the penalty chosen by leave-one-out
 * cross-validation among RIDGE_LAMBDAS (lowest LOO squared error).
 *
 * r2_loo is the LOO R² at the chosen penalty — slightly optimistic since the
 * penalty itself was picked on it, but far more honest than the training R².
 * Too few rows for LOO → the smallest penalty that solves, r2_loo = null.
 *
 * @param {number[][]} X  n × k design matrix (intercept column first)
 * @param {number[]}   y
 * @returns {{ beta: number[], lambda: number, r2_loo: number|null }|null}
 */
function tuneRidge(X, y) {
  if (X.length < MIN_DAYS_ADVANCED + 1) {
    for (const lambda of RIDGE_LAMBDAS) {
      const beta = olsNormalEquations(X, y, lambda)
      if (beta) return { beta, lambda, r2_loo: null }
    }
    return null
  }

  let best = null
  for (const lambda of RIDGE_LAMBDAS) {
    const yHat = ridgeLooPredictions(X, y, lambda)
    if (!yHat) continue
    const sse = y.reduce((s, v, i) => s + (v - yHat[i]) ** 2, 0)
    if (!best || sse < best.sse - 1e-12) best = { lambda, sse, yHat }
  }
  if (!best) return null
  const beta = olsNormalEquations(X, y, best.lambda)
  if (!beta) return null
  return { beta, lambda: best.lambda, r2_loo: computeR2(y, best.yHat) }
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
  const action = leverAction(variable, coefficient)
  if (!action) return null
  const meta = VARIABLE_META[variable]
  const avg = mean(dataset.map((d) => d[variable] ?? 0))
  return `${action} — votre moyenne actuelle : ${meta.format(avg)}.`
}
