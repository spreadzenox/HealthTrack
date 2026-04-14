/**
 * Calcul des totaux nutritionnels à partir des entrées repas (items avec ingredient + quantity_g).
 * Utilise la base ingredientsNutrition (name -> per_100g) pour le calcul côté client.
 */

import nutritionMap from '../data/ingredientsNutrition.json'

/**
 * All numeric fields that can be summed from ingredientsNutrition.json
 * (excluding fodmap_score which is a categorical max, not a sum)
 */
export const NUTRITION_FIELDS = [
  'energy_kcal',
  'protein_g',
  'carbohydrates_g',
  'fat_g',
  'fiber_g',
  'sugar_g',
  'saturated_fat_g',
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
  'alcohol_g',
]

/**
 * @param {{ ingredient: string, quantity_g?: number }[]} items
 * @returns {object} totals for all NUTRITION_FIELDS plus fodmap_score (max of items)
 */
export function computeTotalsFromItems(items) {
  const totals = Object.fromEntries(NUTRITION_FIELDS.map((f) => [f, 0]))
  let maxFodmap = 0

  if (!Array.isArray(items)) return { ...totals, fodmap_score: maxFodmap }

  for (const it of items) {
    const name = (it.ingredient || '').trim()
    const qtyG = it.quantity_g != null ? Number(it.quantity_g) : 0
    if (!name || qtyG <= 0) continue
    const p100 = nutritionMap[name]
    if (!p100) continue
    const factor = qtyG / 100

    for (const field of NUTRITION_FIELDS) {
      totals[field] += (p100[field] || 0) * factor
    }
    // FODMAP: take the maximum score among all items in the meal
    if (typeof p100.fodmap_score === 'number' && p100.fodmap_score > maxFodmap) {
      maxFodmap = p100.fodmap_score
    }
  }

  // Round summable fields to 1 decimal
  const rounded = {}
  for (const field of NUTRITION_FIELDS) {
    rounded[field] = Math.round(totals[field] * 10) / 10
  }
  rounded.fodmap_score = maxFodmap

  return rounded
}

/**
 * Agrège les totaux pour des entrées repas (type food) sur une période.
 * @param {Array<{ at: string, type: string, payload?: { items?: Array<{ ingredient: string, quantity_g?: number }> } }>} entries
 * @param {{ onlyToday?: boolean, lastNDays?: number }} [opts]
 * @returns {{ totals: object, mealCount: number }}
 */
export function aggregateNutrition(entries, opts = {}) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10)
  const todayEnd = todayStart + 'T23:59:59.999Z'

  let filtered = (entries || []).filter((e) => e.type === 'food' && e.payload?.items?.length)
  if (opts.onlyToday) {
    filtered = filtered.filter((e) => e.at >= todayStart && e.at <= todayEnd)
  } else if (opts.lastNDays) {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - opts.lastNDays)
    const cutoffStr = cutoff.toISOString()
    filtered = filtered.filter((e) => e.at >= cutoffStr)
  }

  const allItems = filtered.flatMap((e) => e.payload.items)
  const totals = computeTotalsFromItems(allItems)
  return { totals, mealCount: filtered.length }
}
