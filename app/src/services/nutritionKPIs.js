/**
 * Calcul des totaux nutritionnels à partir des entrées repas (items avec ingredient + quantity_g).
 * Utilise la base ingredientsNutrition (name -> per_100g) pour le calcul côté client.
 */

import nutritionMap from '../data/ingredientsNutrition.json'

/**
 * @param {{ ingredient: string, quantity_g?: number }[]} items
 * @returns {{ energy_kcal: number, protein_g: number, carbohydrates_g: number, fat_g: number, fiber_g: number }}
 */
export function computeTotalsFromItems(items) {
  const totals = {
    energy_kcal: 0,
    protein_g: 0,
    carbohydrates_g: 0,
    fat_g: 0,
    fiber_g: 0,
  }
  if (!Array.isArray(items)) return totals

  for (const it of items) {
    const name = (it.ingredient || '').trim()
    const qtyG = it.quantity_g != null ? Number(it.quantity_g) : 0
    if (!name || qtyG <= 0) continue
    const p100 = nutritionMap[name]
    if (!p100) continue
    const factor = qtyG / 100
    totals.energy_kcal += (p100.energy_kcal || 0) * factor
    totals.protein_g += (p100.protein_g || 0) * factor
    totals.carbohydrates_g += (p100.carbohydrates_g || 0) * factor
    totals.fat_g += (p100.fat_g || 0) * factor
    totals.fiber_g += (p100.fiber_g || 0) * factor
  }

  return {
    energy_kcal: Math.round(totals.energy_kcal * 10) / 10,
    protein_g: Math.round(totals.protein_g * 10) / 10,
    carbohydrates_g: Math.round(totals.carbohydrates_g * 10) / 10,
    fat_g: Math.round(totals.fat_g * 10) / 10,
    fiber_g: Math.round(totals.fiber_g * 10) / 10,
  }
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
