import { describe, it, expect, beforeEach } from 'vitest'
import { createBus, EVENTS } from '../bus'
import { watchReducedMotion } from './reducedMotionRoot'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.reducedMotion
})

describe('mouvements réduits : la racine suit le réglage de l’app', () => {
  it('« Activé » au démarrage, puis désactivé', () => {
    localStorage.setItem('halcya.companion.reducedMotion', 'on')
    const b = createBus()
    watchReducedMotion(b)
    expect(document.documentElement.dataset.reducedMotion).toBe('on')
    localStorage.setItem('halcya.companion.reducedMotion', 'off')
    b.emit(EVENTS.REDUCED_MOTION_CHANGED, { value: false })
    expect(document.documentElement.dataset.reducedMotion).toBeUndefined()
  })
})
