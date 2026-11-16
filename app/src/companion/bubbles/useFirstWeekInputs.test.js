import { describe, it, expect } from 'vitest'
import { countObserved, mergeCounts } from './useFirstWeekInputs'

const NOW = new Date(2026, 10, 16, 20)
const at = (d, h = 9) => new Date(2026, 10, d, h).toISOString()

describe('compte léger de la première semaine', () => {
  it('un jour observé par note de bien-être ; la digestion par note du ventre', () => {
    const entries = [
      { type: 'wellbeing', at: at(14), payload: { score: 3 } },
      { type: 'wellbeing', at: at(14, 20), payload: { score: 4 } },
      { type: 'wellbeing', at: at(16), payload: { score: 4 } },
      { type: 'gut', at: at(15, 20), payload: { level: 'calm' } },
    ]
    expect(countObserved(entries, NOW)).toEqual({
      wellbeing: { noted: 2, todayNoted: true },
      gut: { daysLeft: 13 },
    })
    expect(countObserved([], NOW)).toEqual({ wellbeing: { noted: 0, todayNoted: false }, gut: { daysLeft: 14 } })
  })

  it('le plus avancé des comptes l’emporte', () => {
    const a = { wellbeing: { noted: 3, todayNoted: false }, gut: { daysLeft: 9 } }
    const b = { wellbeing: { noted: 9, todayNoted: true }, gut: { daysLeft: 0 } }
    expect(mergeCounts(a, b)).toEqual({ wellbeing: { noted: 9, todayNoted: true }, gut: { daysLeft: 0 } })
    expect(mergeCounts(a, null)).toBe(a)
  })
})
