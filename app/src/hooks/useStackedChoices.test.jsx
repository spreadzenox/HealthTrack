import { describe, it, expect } from 'vitest'
import { shouldStackChoices, choiceLayout } from './useStackedChoices'

// Revue C1 du 06/11 14:35 (grande police, 360 px) : sur la carte « Votre ventre », « Calme » et « Douleur »
// passaient le rond au-dessus du mot alors que « Gêne » le gardait à côté. Une rangée de choix se décide en bloc.
describe('shouldStackChoices', () => {
  it('garde le rond à côté quand chaque libellé tient', () => {
    expect(shouldStackChoices([{ available: 92, needed: 83 }, { available: 92, needed: 75 }, { available: 92, needed: 92 }])).toBe(false)
  })
  it('empile toute la rangée dès qu’un seul libellé ne tient pas', () => {
    expect(shouldStackChoices([{ available: 92, needed: 96 }, { available: 92, needed: 86 }, { available: 92, needed: 109 }])).toBe(true)
    expect(shouldStackChoices([{ available: 92, needed: 80 }, { available: 92, needed: 86 }, { available: 92, needed: 93 }])).toBe(true)
  })
  it('ne décide rien sans mesure (jsdom, rangée cachée)', () => {
    expect(shouldStackChoices([])).toBe(false)
    expect(shouldStackChoices([{ available: 0, needed: 0 }])).toBe(false)
  })
})

// Revue C1 du 06/11 19:35 (320 px, police ×1,3, démo) : même empilé, « Douleur » seul dépassait son cadre.
// Quand un mot ne tient plus du tout dans sa colonne, les trois choix passent l'un sous l'autre, pleine largeur.
describe('choiceLayout', () => {
  it('rangée quand chaque rond et son mot tiennent', () => {
    expect(choiceLayout([{ available: 92, needed: 83, label: 61 }, { available: 92, needed: 75, label: 53 }])).toBe('row')
  })
  it('empilée quand un rond + mot ne tient pas mais chaque mot seul tient', () => {
    expect(choiceLayout([{ available: 70, needed: 96, label: 66 }, { available: 70, needed: 60, label: 38 }])).toBe('stacked')
  })
  it('colonne dès qu’un mot seul dépasse sa colonne', () => {
    expect(choiceLayout([{ available: 60, needed: 64, label: 42 }, { available: 60, needed: 97, label: 75 }])).toBe('column')
  })
  it('ne décide rien sans mesure', () => {
    expect(choiceLayout([])).toBe('row')
    expect(choiceLayout([{ available: 0, needed: 0, label: 0 }])).toBe('row')
  })
})
