import { describe, expect, it } from 'vitest'
import { chipTheme, summaryChips, watchStressBand } from './journalChips'

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

  it('donne un pastel à chaque tuile, météo comprise (POL-PLAY-27 : la tuile Météo restait sans couleur)', () => {
    expect(chipTheme('Météo')).toBe('lilac')
    for (const label of ['Sommeil', 'Pas', 'VFC nuit', 'Repas', 'Écran', 'Météo', 'Stress montre']) {
      expect(['mint', 'peach', 'lilac']).toContain(chipTheme(label))
    }
  })
})

describe('summaryChips — nuit de la montre (MONTRE-SCORE, I200)', () => {
  it('montre le score de la montre et la FC de la nuit juste après le sommeil', () => {
    const chips = summaryChips({ sleepMinutes: 441, watchSleepScore: 82, sleepHr: 57, steps: 4000 })
    expect(chips.slice(0, 3)).toEqual([['Sommeil', '7 h 21'], ['Score montre', '82 / 100'], ['FC nuit', '57 bpm']])
    expect(chipTheme('Score montre')).toBe('mint')
  })

  it('n’ajoute rien sans montre', () => {
    const labels = summaryChips({ sleepMinutes: 441 }).map(([l]) => l)
    expect(labels).not.toContain('Score montre')
    expect(labels).not.toContain('FC nuit')
  })
})

describe('summaryChips — stress de la montre (POL-PLAY-15)', () => {
  it('dit la plage de la montre plutôt que « / 99 »', () => {
    expect(summaryChips({ watchStress: 37 })).toContainEqual(['Stress montre', '37 · normal'])
  })

  it('suit l’échelle de la montre aux bornes', () => {
    expect([1, 29, 30, 59, 60, 79, 80, 99].map(watchStressBand))
      .toEqual(['détendu', 'détendu', 'normal', 'normal', 'moyen', 'moyen', 'élevé', 'élevé'])
  })
})
