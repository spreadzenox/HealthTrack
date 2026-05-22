import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCurrentWeekStart,
  compareWeeklyIntake,
} from './nutritionIntakeCompare'

describe('nutritionIntakeCompare', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-22T12:00:00Z')) // Thursday
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('week starts on Monday', () => {
    const start = getCurrentWeekStart()
    expect(start.getDay()).toBe(1)
    expect(start.getDate()).toBe(18)
  })

  it('aggregates food from current week only', () => {
    const profile = { weightKg: 70, heightCm: 170, sex: 'M', age: 30 }
    const entries = [
      {
        type: 'food',
        at: '2026-05-19T12:00:00Z',
        payload: {
          items: [{ ingredient: 'Abat, cuit (aliment moyen)', quantity_g: 200 }],
        },
      },
      {
        type: 'food',
        at: '2026-05-10T12:00:00Z',
        payload: {
          items: [{ ingredient: 'Abat, cuit (aliment moyen)', quantity_g: 200 }],
        },
      },
    ]
    const result = compareWeeklyIntake(entries, profile)
    expect(result.mealCount).toBe(1)
    expect(result.rows.length).toBeGreaterThan(10)
  })
})
