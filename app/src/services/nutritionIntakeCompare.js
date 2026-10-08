/**
 * Compare recent food intake vs official nutrient targets (ANSES).
 *
 * On compare la moyenne **par jour saisi** (jours avec au moins un repas) sur les
 * 7 derniers jours à l'apport journalier recommandé : un jour sans saisie ne fait
 * pas baisser la moyenne, et la cible n'est pas cumulée (pas de « 120 g de fibres »).
 */

import { aggregateNutrition } from './nutritionKPIs'
import {
  computeDailyNutrientTargets,
  NUTRITION_TAB_FIELDS,
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
  LOWER_IS_BETTER_NUTRIENTS,
} from './nutrientReferenceIntakes'

export const RECENT_WINDOW_DAYS = 7

/** Sections affichées, dans l'ordre. Les nutriments absents de la liste vont dans « Minéraux ». */
const GROUPS = [
  { title: 'Essentiels', keys: ['protein_g', 'fiber_g', 'omega3_g'] },
  { title: 'Vitamines', keys: ['vitamin_c_mg', 'vitamin_d_ug', 'vitamin_b12_ug', 'vitamin_b9_ug', 'vitamin_a_ug', 'vitamin_e_mg'] },
  { title: 'Minéraux', keys: ['calcium_mg', 'iron_mg', 'magnesium_mg', 'zinc_mg', 'potassium_mg'] },
  { title: 'À limiter', keys: ['sodium_mg'] },
]

/** Sous ce ratio énergie moyenne / besoins, des repas manquent probablement. */
const INCOMPLETE_ENERGY_RATIO = 0.5

/**
 * Minuit (heure locale) du premier jour de la fenêtre de `days` jours incluant aujourd'hui.
 */
export function getRecentWindowStart(days = RECENT_WINDOW_DAYS) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))
}

function localDayKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/**
 * Nombre au format français, sans décimale inutile (1 décimale sous 10).
 */
export function formatNutrientAmount(value) {
  const v = Number(value) || 0
  const digits = Math.abs(v) < 10 ? 1 : 0
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(v)
}

function statusFor(pct, limit) {
  if (limit) return pct <= 100 ? 'ok' : 'over'
  if (pct >= 100) return 'ok'
  if (pct >= 70) return 'partial'
  return 'low'
}

/**
 * @param {Array} entries  toutes les entrées (filtrées ici)
 * @param {object} profile  from getBodyProfile
 * @param {{ days?: number }} [opts]
 */
export function compareRecentIntake(entries, profile, { days = RECENT_WINDOW_DAYS } = {}) {
  const start = getRecentWindowStart(days)
  const now = new Date()
  const filtered = (entries || []).filter((e) => {
    if (e.type !== 'food' || !e.payload?.items?.length) return false
    const t = new Date(e.at)
    return t >= start && t <= now
  })
  const { totals, mealCount } = aggregateNutrition(filtered, {})
  const loggedDays = new Set(filtered.map((e) => localDayKey(e.at))).size
  const dailyTargets = computeDailyNutrientTargets(profile)
  const divisor = Math.max(1, loggedDays)

  const rows = NUTRITION_TAB_FIELDS.map((key) => {
    const perDay = (totals[key] ?? 0) / divisor
    const target = dailyTargets[key] ?? 0
    const limit = LOWER_IS_BETTER_NUTRIENTS.has(key)
    const pct = target > 0 ? Math.round((perDay / target) * 100) : 0
    return {
      key,
      label: NUTRIENT_LABELS[key] || key,
      unit: NUTRIENT_UNITS[key] || '',
      perDay,
      target,
      limit,
      pct,
      barPct: Math.min(100, pct),
      status: statusFor(pct, limit),
    }
  })

  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]))
  const grouped = new Set(GROUPS.flatMap((g) => g.keys))
  const groups = GROUPS.map((g) => ({
    title: g.title,
    rows: [
      ...g.keys.filter((k) => byKey[k]).map((k) => byKey[k]),
      ...(g.title === 'Minéraux' ? rows.filter((r) => !grouped.has(r.key)) : []),
    ],
  })).filter((g) => g.rows.length > 0)

  const energyPerDay = (totals.energy_kcal ?? 0) / divisor
  const energyTarget = dailyTargets.energy_kcal || 0
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

  return {
    totals,
    mealCount,
    loggedDays,
    windowDays: days,
    rows,
    groups,
    reachedCount: rows.filter((r) => !r.limit && r.status === 'ok').length,
    targetCount: rows.filter((r) => !r.limit).length,
    energyPerDay,
    likelyIncomplete: mealCount > 0 && energyTarget > 0 && energyPerDay < energyTarget * INCOMPLETE_ENERGY_RATIO,
    periodLabel: `${fmt.format(start)} – ${fmt.format(now)}`,
  }
}
