/**
 * Calcul des totaux nutritionnels à partir des entrées repas (items avec ingredient + quantity_g).
 * Utilise la base ingredientsNutrition (name -> per_100g) pour le calcul côté client : elle est
 * chargée à la demande (`loadNutritionTable()`), à attendre avant d'appeler ces fonctions.
 */

import { getNutritionTable } from '../data/nutritionTable'
import measurements from '../data/fodmapMeasurements.json'
import { estimateMealFodmap, highFodmapGroups } from './fodmapGroups'

/**
 * All numeric fields that can be summed from ingredientsNutrition.json
 * (fodmap_score, lui, se calcule à part : voir computeTotalsFromItems)
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
 * @returns {object} totals for all NUTRITION_FIELDS, plus fodmap_groups (sous-groupes FODMAP au-dessus du repère de
 *   départ, `probable` compris, voir fodmapGroups.js), fodmap_score (leur nombre, 0–6 ; il remplace l'ancien score 0–3 de la table,
 *   inventé, qui n'est plus lu) and unknown_share :
 *   pour chaque champ dont Ciqual n'a pas mesuré la teneur d'au moins un aliment, la part (0–1) du poids
 *   mangé concernée. Le total ne compte que les teneurs mesurées : il est alors un minimum, pas un zéro caché.
 */
export function computeTotalsFromItems(items) {
  const nutritionMap = getNutritionTable()
  // Erreur franche plutôt que des totaux à zéro (qui seraient ensuite mis en cache)
  if (!nutritionMap) throw new Error('Table nutritionnelle non chargée (loadNutritionTable)')
  const totals = Object.fromEntries(NUTRITION_FIELDS.map((f) => [f, 0]))
  const unknownG = Object.fromEntries(NUTRITION_FIELDS.map((f) => [f, 0]))
  let weightG = 0

  if (!Array.isArray(items)) return { ...totals, fodmap_score: 0, fodmap_groups: [], unknown_share: {} }

  for (const it of items) {
    const name = (it.ingredient || '').trim()
    const qtyG = it.quantity_g != null ? Number(it.quantity_g) : 0
    if (!name || qtyG <= 0) continue
    const p100 = nutritionMap[name]
    if (!p100) continue
    const factor = qtyG / 100
    weightG += qtyG

    for (const field of NUTRITION_FIELDS) {
      if (p100[field] == null) unknownG[field] += qtyG
      else totals[field] += p100[field] * factor
    }
  }

  // Round summable fields to 1 decimal
  const rounded = {}
  for (const field of NUTRITION_FIELDS) {
    rounded[field] = Math.round(totals[field] * 10) / 10
  }
  rounded.fodmap_groups = highFodmapGroups(estimateMealFodmap(items, nutritionMap, measurements))
  rounded.fodmap_score = rounded.fodmap_groups.length
  rounded.unknown_share = {}
  for (const field of NUTRITION_FIELDS) {
    if (unknownG[field] > 0) rounded.unknown_share[field] = Math.round((unknownG[field] / weightG) * 100) / 100
  }

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
