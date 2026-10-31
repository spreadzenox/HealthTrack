import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getRecentWindowStart,
  compareRecentIntake,
  formatNutrientAmount,
} from './nutritionIntakeCompare'

const profile = { weightKg: 70, heightCm: 170, sex: 'M', age: 30 }
const meal = (at, grams = 200) => ({
  type: 'food',
  at,
  payload: { items: [{ ingredient: 'Abat, cuit (aliment moyen)', quantity_g: grams }] },
})

describe('nutritionIntakeCompare', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 21, 14, 0)) // jeudi 21 mai 2026, 14 h locale
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('window covers the last 7 calendar days including today', () => {
    const start = getRecentWindowStart(7)
    expect(start.getDate()).toBe(15)
    expect(start.getHours()).toBe(0)
  })

  it('ignores meals older than the window', () => {
    const result = compareRecentIntake([
      meal(new Date(2026, 4, 20, 12).toISOString()),
      meal(new Date(2026, 4, 10, 12).toISOString()),
    ], profile)
    expect(result.mealCount).toBe(1)
    expect(result.loggedDays).toBe(1)
  })

  it('averages over days with at least one logged meal, not over elapsed days', () => {
    const oneDay = compareRecentIntake([meal(new Date(2026, 4, 20, 12).toISOString())], profile)
    const twoDays = compareRecentIntake([
      meal(new Date(2026, 4, 18, 12).toISOString()),
      meal(new Date(2026, 4, 20, 12).toISOString()),
    ], profile)
    const p1 = oneDay.rows.find((r) => r.key === 'protein_g')
    const p2 = twoDays.rows.find((r) => r.key === 'protein_g')
    expect(twoDays.loggedDays).toBe(2)
    expect(p2.perDay).toBeCloseTo(p1.perDay, 1)
  })

  it('two meals on the same day count as one logged day', () => {
    const result = compareRecentIntake([
      meal(new Date(2026, 4, 20, 12).toISOString()),
      meal(new Date(2026, 4, 20, 20).toISOString()),
    ], profile)
    expect(result.loggedDays).toBe(1)
    expect(result.mealCount).toBe(2)
  })

  it('compares to the daily target (not a cumulated one)', () => {
    const result = compareRecentIntake([meal(new Date(2026, 4, 20, 12).toISOString())], profile)
    const fiber = result.rows.find((r) => r.key === 'fiber_g')
    expect(fiber.target).toBe(30)
  })

  it('treats sodium as an upper limit: low intake is ok, over the limit is flagged', () => {
    const light = compareRecentIntake([meal(new Date(2026, 4, 20, 12).toISOString(), 10)], profile)
    const sodium = light.rows.find((r) => r.key === 'sodium_mg')
    expect(sodium.limit).toBe(true)
    expect(sodium.target).toBe(2000)
    expect(sodium.status).toBe('ok')
  })

  it('statuses: ok ≥ 100 %, partial ≥ 70 %, low below (journée complète)', () => {
    const result = compareRecentIntake([meal(new Date(2026, 4, 20, 12).toISOString(), 2000)], profile)
    expect(result.likelyIncomplete).toBe(false)
    for (const row of result.rows.filter((r) => !r.limit)) {
      const expected = row.pct >= 100 ? 'ok' : row.pct >= 70 ? 'partial' : 'low'
      expect(row.status).toBe(expected)
      expect(row.barPct).toBeLessThanOrEqual(100)
    }
  })

  it('groups rows into sections and counts reached targets', () => {
    const result = compareRecentIntake([meal(new Date(2026, 4, 20, 12).toISOString())], profile)
    expect(result.groups.map((g) => g.title)).toEqual([
      'Essentiels', 'Vitamines', 'Minéraux', 'À limiter',
    ])
    const total = result.groups.reduce((n, g) => n + g.rows.length, 0)
    expect(total).toBe(result.rows.length)
    expect(result.reachedCount).toBe(result.rows.filter((r) => !r.limit && r.status === 'ok').length)
  })

  it('flags probably incomplete logging when energy per logged day is far below needs', () => {
    const tiny = compareRecentIntake([meal(new Date(2026, 4, 20, 12).toISOString(), 50)], profile)
    expect(tiny.likelyIncomplete).toBe(true)
  })

  it('jours incomplets : « bas » et « proche » deviennent « incertain » (POL-PLAY-75), atteint et dépassé restent', () => {
    const tiny = compareRecentIntake([meal(new Date(2026, 4, 20, 12).toISOString(), 50)], profile)
    for (const row of tiny.rows) {
      const raw = row.limit ? (row.pct > 100 ? 'over' : 'ok') : row.pct >= 100 ? 'ok' : 'uncertain'
      expect(row.status).toBe(raw)
    }
    expect(tiny.rows.some((r) => r.status === 'uncertain')).toBe(true)
    expect(tiny.statuses).toEqual([...new Set(tiny.rows.map((r) => r.status))].sort())
  })

  it('jours complets : aucun statut « incertain », légende limitée aux statuts présents', () => {
    const full = compareRecentIntake([meal(new Date(2026, 4, 20, 12).toISOString(), 2000)], profile)
    expect(full.likelyIncomplete).toBe(false)
    expect(full.rows.some((r) => r.status === 'uncertain')).toBe(false)
    expect(full.statuses).toEqual([...new Set(full.rows.map((r) => r.status))].sort())
  })

  it('marks a nutrient « partiel » when Ciqual did not measure it for ≥ 10 % of the eaten weight (N2b)', () => {
    const at = new Date(2026, 4, 20, 12).toISOString()
    const result = compareRecentIntake([{
      type: 'food',
      at,
      payload: { items: [
        { ingredient: 'Abat, cuit (aliment moyen)', quantity_g: 100 },
        { ingredient: 'Agneau, collier braisé ou bouilli', quantity_g: 100 },
      ] },
    }], profile)
    const sodium = result.rows.find((r) => r.key === 'sodium_mg')
    expect(sodium.partial).toBe(true)
    expect(sodium.unknownShare).toBe(0.5)
    expect(result.rows.find((r) => r.key === 'protein_g').partial).toBe(false)
    expect(result.partialCount).toBeGreaterThanOrEqual(1)
  })

  it('returns an empty comparison when no meal is logged', () => {
    const result = compareRecentIntake([], profile)
    expect(result.mealCount).toBe(0)
    expect(result.loggedDays).toBe(0)
  })
})

describe('formatNutrientAmount', () => {
  it('uses French decimals and no useless decimals', () => {
    expect(formatNutrientAmount(13.24)).toBe('13')
    expect(formatNutrientAmount(4.25)).toBe('4,3')
    expect(formatNutrientAmount(4)).toBe('4')
    expect(formatNutrientAmount(0.04)).toBe('0')
    expect(formatNutrientAmount(14000).replace(/\s/g, ' ')).toBe('14 000')
  })
})
