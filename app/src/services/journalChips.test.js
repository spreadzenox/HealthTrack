import { describe, expect, it } from 'vitest'
import { chipTheme, summaryChips } from './journalChips'

describe('summaryChips — repas', () => {
  const meals = (s) => summaryChips(s).find(([label]) => /repas$/i.test(label))

  it('garde la valeur des kcal sur une ligne, le nombre de repas dans le titre (POL-PLAY-8)', () => {
    expect(meals({ meals: 1, mealKcal: 479 })).toEqual(['Repas', '≈ 479 kcal'])
    expect(meals({ meals: 3, mealKcal: 1450 })[0]).toBe('3 repas')
    expect(meals({ meals: 3, mealKcal: 1450 })[1]).not.toMatch(/ /)
    expect(meals({ meals: 2, mealKcal: 0 })).toEqual(['Repas', '2'])
  })

  it('« 3 repas » garde la couleur pêche des repas', () => {
    expect(chipTheme('3 repas')).toBe('peach')
    expect(chipTheme('Repas')).toBe('peach')
  })
})
