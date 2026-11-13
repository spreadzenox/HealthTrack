import { describe, it, expect, vi } from 'vitest'
import { PORTION_OPEN_EVENT, onPortionOpen } from './portionOpen'

// Sur iPhone, le toucher du rappel de portion arrive après le retour au premier plan (visibilitychange) : le natif
// (PortionReminderPlugin.swift) le signale par un évènement de la fenêtre, que la page écoute en plus.
describe('rappel de portion touché, signalé par le natif iOS', () => {
  it('appelle la vérification à chaque signal, plus après le retrait de l’écoute', () => {
    const check = vi.fn()
    const off = onPortionOpen(check, window)
    window.dispatchEvent(new Event(PORTION_OPEN_EVENT))
    expect(check).toHaveBeenCalledTimes(1)
    off()
    window.dispatchEvent(new Event(PORTION_OPEN_EVENT))
    expect(check).toHaveBeenCalledTimes(1)
  })

  it('même nom d’évènement que le natif', () => {
    expect(PORTION_OPEN_EVENT).toBe('halcya-portion-open')
  })

  it('sans fenêtre (tests, rendu hors navigateur) : rien à écouter', () => {
    expect(() => onPortionOpen(() => {}, undefined)()).not.toThrow()
  })
})
