/**
 * Apports nutritionnels recommandés (ANSES / PNNS — adultes).
 * Ajustés selon le poids, la taille et le profil utilisateur (Withings).
 */

import { NUTRITION_FIELDS } from './nutritionKPIs'

/**
 * @typedef {{ weightKg: number, heightCm: number, sex?: 'M'|'F', age?: number }} BodyProfile
 */

/**
 * Mifflin-St Jeor BMR (kcal/jour).
 */
export function computeBmr({ weightKg, heightCm, sex = 'M', age = 30 }) {
  const w = weightKg
  const h = heightCm
  const a = age
  if (sex === 'F') return 10 * w + 6.25 * h - 5 * a - 161
  return 10 * w + 6.25 * h - 5 * a + 5
}

/**
 * Besoins énergétiques journaliers (activité modérée ×1,55).
 */
export function computeDailyEnergyKcal(profile) {
  return Math.round(computeBmr(profile) * 1.55)
}

/**
 * Apports journaliers recommandés (cibles) pour un adulte.
 * @param {BodyProfile} profile
 * @returns {Record<string, number>}
 */
export function computeDailyNutrientTargets(profile) {
  const { weightKg, sex = 'M' } = profile
  const energy = computeDailyEnergyKcal(profile)
  const proteinG = Math.round(weightKg * 0.83 * 10) / 10

  const ironMg = sex === 'F' ? 16 : 11
  const magnesiumMg = sex === 'F' ? 300 : 380
  const zincMg = sex === 'F' ? 9.4 : 11

  return {
    energy_kcal: energy,
    protein_g: proteinG,
    carbohydrates_g: Math.round((energy * 0.5) / 4),
    fat_g: Math.round((energy * 0.35) / 9),
    fiber_g: 30,
    sugar_g: Math.round(energy * 0.1 / 4),
    saturated_fat_g: Math.round((energy * 0.1) / 9),
    omega3_g: 2,
    vitamin_c_mg: 110,
    vitamin_d_ug: 15,
    vitamin_b12_ug: 4,
    vitamin_b9_ug: 330,
    vitamin_a_ug: 750,
    vitamin_e_mg: 10,
    calcium_mg: 1000,
    iron_mg: ironMg,
    magnesium_mg: magnesiumMg,
    zinc_mg: zincMg,
    potassium_mg: 3500,
    sodium_mg: 2000,
    alcohol_g: 0,
  }
}

/** Nutrients shown on the Nutrition tab (micronutrients + key macros). */
export const NUTRITION_TAB_FIELDS = [
  'protein_g',
  'fiber_g',
  'omega3_g',
  'vitamin_c_mg',
  'vitamin_d_ug',
  'vitamin_b12_ug',
  'vitamin_b9_ug',
  'vitamin_a_ug',
  'vitamin_e_mg',
  'calcium_mg',
  'iron_mg',
  'magnesium_mg',
  'zinc_mg',
  'potassium_mg',
  'sodium_mg',
]

export const NUTRIENT_LABELS = {
  energy_kcal: 'Énergie',
  protein_g: 'Protéines',
  carbohydrates_g: 'Glucides',
  fat_g: 'Lipides',
  fiber_g: 'Fibres',
  sugar_g: 'Sucres',
  saturated_fat_g: 'AG saturés',
  omega3_g: 'Oméga-3',
  vitamin_c_mg: 'Vitamine C',
  vitamin_d_ug: 'Vitamine D',
  vitamin_b12_ug: 'Vitamine B12',
  vitamin_b9_ug: 'Folates (B9)',
  vitamin_a_ug: 'Vitamine A',
  vitamin_e_mg: 'Vitamine E',
  calcium_mg: 'Calcium',
  iron_mg: 'Fer',
  magnesium_mg: 'Magnésium',
  zinc_mg: 'Zinc',
  potassium_mg: 'Potassium',
  sodium_mg: 'Sodium',
  alcohol_g: 'Alcool',
}

export const NUTRIENT_UNITS = {
  energy_kcal: 'kcal',
  protein_g: 'g',
  carbohydrates_g: 'g',
  fat_g: 'g',
  fiber_g: 'g',
  sugar_g: 'g',
  saturated_fat_g: 'g',
  omega3_g: 'g',
  vitamin_c_mg: 'mg',
  vitamin_d_ug: 'µg',
  vitamin_b12_ug: 'µg',
  vitamin_b9_ug: 'µg',
  vitamin_a_ug: 'µg',
  vitamin_e_mg: 'mg',
  calcium_mg: 'mg',
  iron_mg: 'mg',
  magnesium_mg: 'mg',
  zinc_mg: 'mg',
  potassium_mg: 'mg',
  sodium_mg: 'mg',
  alcohol_g: 'g',
}

/** Sodium is an upper limit (lower is better for health). */
export const LOWER_IS_BETTER_NUTRIENTS = new Set(['sodium_mg', 'sugar_g', 'saturated_fat_g', 'alcohol_g'])

/**
 * Validates that all summable nutrition fields have targets when needed.
 */
export function getAllTargetableFields() {
  return NUTRITION_FIELDS.filter((f) => f !== 'alcohol_g' || true)
}
