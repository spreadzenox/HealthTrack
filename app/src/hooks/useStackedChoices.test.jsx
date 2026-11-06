import { describe, it, expect } from 'vitest'
import { shouldStackChoices } from './useStackedChoices'

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
