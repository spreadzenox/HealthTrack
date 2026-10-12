import { describe, it, expect, beforeEach } from 'vitest'
import { shouldShowCigaretteCounter, setCigaretteCounterPinned, isCigaretteCounterPinned } from './cigaretteCounter'

describe('cigaretteCounter', () => {
  beforeEach(() => localStorage.clear())

  it('caché pour un non-fumeur (aucune cigarette récente, rien demandé)', () => {
    expect(shouldShowCigaretteCounter([{ type: 'steps' }])).toBe(false)
  })

  it('affiché dès qu’une cigarette figure dans les entrées récentes', () => {
    expect(shouldShowCigaretteCounter([{ type: 'steps' }, { type: 'cigarette' }])).toBe(true)
  })

  it('affiché quand il est demandé dans Paramètres, et se retire', () => {
    setCigaretteCounterPinned(true)
    expect(isCigaretteCounterPinned()).toBe(true)
    expect(shouldShowCigaretteCounter([])).toBe(true)
    setCigaretteCounterPinned(false)
    expect(shouldShowCigaretteCounter([])).toBe(false)
  })
})
