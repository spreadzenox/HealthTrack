/**
 * Compare weekly food intake vs official nutrient targets.
 */

import { aggregateNutrition } from './nutritionKPIs'
import {
  computeDailyNutrientTargets,
  NUTRITION_TAB_FIELDS,
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
  LOWER_IS_BETTER_NUTRIENTS,
} from './nutrientReferenceIntakes'

/**
 * Monday 00:00:00 of the current week (local time).
 */
export function getCurrentWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  monday.setDate(monday.getDate() + diff)
  return monday
}

/**
 * @returns {{ start: Date, end: Date, label: string }}
 */
export function getCurrentWeekRange() {
  const start = getCurrentWeekStart()
  const end = new Date()
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
  return {
    start,
    end,
    label: `${fmt.format(start)} – ${fmt.format(end)}`,
  }
}

/**
 * Filters food entries to the current calendar week (Mon–today).
 */
export function filterEntriesCurrentWeek(entries) {
  const weekStart = getCurrentWeekStart().toISOString()
  return (entries || []).filter(
    (e) => e.type === 'food' && e.at >= weekStart,
  )
}

/**
 * @param {Array} foodEntries  entries already filtered to current week
 * @param {object} profile  from getBodyProfile
 * @param {number} daysInWeek  days elapsed in week (for prorated targets), default 7
 */
export function compareWeeklyIntake(foodEntries, profile, daysInWeek = 7) {
  const filtered = filterEntriesCurrentWeek(foodEntries)
  const { totals, mealCount } = aggregateNutrition(filtered, {})

  const dailyTargets = computeDailyNutrientTargets(profile)
  const elapsed = Math.min(
    daysInWeek,
    Math.max(1, Math.ceil((Date.now() - getCurrentWeekStart().getTime()) / (24 * 60 * 60 * 1000))),
  )

  const rows = NUTRITION_TAB_FIELDS.map((key) => {
    const actual = totals[key] ?? 0
    const dailyTarget = dailyTargets[key] ?? 0
    const weeklyTarget = dailyTarget * elapsed
    const lowerBetter = LOWER_IS_BETTER_NUTRIENTS.has(key)

    let pct
    if (lowerBetter) {
      pct = weeklyTarget > 0
        ? Math.min(100, Math.round((weeklyTarget / Math.max(actual, 0.01)) * 100))
        : 100
    } else {
      pct = weeklyTarget > 0
        ? Math.min(150, Math.round((actual / weeklyTarget) * 100))
        : 0
    }

    return {
      key,
      label: NUTRIENT_LABELS[key] || key,
      unit: NUTRIENT_UNITS[key] || '',
      actual: Math.round(actual * 10) / 10,
      weeklyTarget: Math.round(weeklyTarget * 10) / 10,
      dailyTarget,
      pct: Math.min(100, pct),
      pctRaw: pct,
      lowerBetter,
      status: lowerBetter
        ? (actual <= weeklyTarget ? 'ok' : 'over')
        : (pct >= 100 ? 'ok' : pct >= 70 ? 'partial' : 'low'),
    }
  })

  return {
    totals,
    mealCount,
    elapsedDays: elapsed,
    rows,
    weekLabel: getCurrentWeekRange().label,
  }
}
