import { describe, it, expect } from 'vitest'
import { NOTE_CHOICES, choiceToScore, scoreToChoice, toDisplay, fromDisplay, gapToDisplay, formatNote } from './wellbeingScale'

describe('échelle visible du bien-être (1 à 5)', () => {
  it('cinq choix avec un milieu', () => {
    expect(NOTE_CHOICES).toEqual([1, 2, 3, 4, 5])
    expect(choiceToScore(3)).toBe(2.5)
  })

  it('bornes : 0 → 1, 5 → 5', () => {
    expect(toDisplay(0)).toBe(1)
    expect(toDisplay(5)).toBe(5)
  })

  it('anciennes notes 0 à 5 : conversion sans perte (aller-retour exact)', () => {
    for (const old of [0, 1, 2, 3, 4, 5]) {
      expect(fromDisplay(toDisplay(old))).toBeCloseTo(old, 12)
    }
    // valeurs continues (moyennes, estimations)
    for (let v = 0; v <= 5; v += 0.37) expect(fromDisplay(toDisplay(v))).toBeCloseTo(v, 12)
  })

  it('l’ordre des anciennes notes est conservé et elles restent distinctes', () => {
    const shown = [0, 1, 2, 3, 4, 5].map(toDisplay)
    expect(shown).toEqual([...shown].sort((a, b) => a - b))
    expect(new Set(shown).size).toBe(6)
    expect(shown.map((v) => formatNote(v === null ? null : fromDisplay(v)))).toEqual(['1', '1,8', '2,6', '3,4', '4,2', '5'])
  })

  it('chaque choix revient à lui-même', () => {
    for (const c of NOTE_CHOICES) expect(scoreToChoice(choiceToScore(c))).toBe(c)
  })

  it('pré-remplissage d’une ancienne note : le choix le plus proche', () => {
    expect([0, 1, 2, 3, 4, 5].map(scoreToChoice)).toEqual([1, 2, 3, 3, 4, 5])
  })

  it('écarts mis à l’échelle, valeurs absentes ignorées', () => {
    expect(gapToDisplay(1)).toBeCloseTo(0.8)
    expect(toDisplay(null)).toBeNull()
    expect(choiceToScore(0)).toBeNull()
    expect(choiceToScore(6)).toBeNull()
    expect(scoreToChoice(undefined)).toBeNull()
    expect(formatNote(NaN)).toBe('')
  })
})
