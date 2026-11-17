import { describe, it, expect, afterEach } from 'vitest'
import { restExpression, appOpenedReaction } from './mood'
import { emitAppOpened } from './life/appOpened'
import { createBus, EVENTS } from './bus'

afterEach(() => localStorage.clear())

describe('Pilou dort la nuit (POLISH-PILOU-DORT-YEUX)', () => {
  it('au repos : endormi la nuit, l’humeur du jour sinon', () => {
    expect(restExpression(true, 0.95)).toBe('endormi')
    expect(restExpression(false, 0.95)).toBe('rayonnant')
    expect(restExpression(false)).toBe('tranquille')
  })

  it('ouvrir l’app la nuit ne le réveille pas', () => {
    expect(appOpenedReaction({ morning: true }, true)).toBeNull()
    expect(appOpenedReaction({ morning: false }, true)).toBeNull()
    expect(appOpenedReaction({ morning: true }, false)).toEqual({ play: 'reveil' })
    expect(appOpenedReaction({ morning: false }, false)).toEqual({ set: 'salut' })
  })

  it('le « matin » de l’ouverture commence à 5 h (1 h du matin n’est pas un réveil)', () => {
    const seen = []
    const bus = createBus()
    bus.on(EVENTS.APP_OPENED, (p) => seen.push(p.morning))
    emitAppOpened(new Date(2026, 10, 17, 1, 50), bus)
    emitAppOpened(new Date(2026, 10, 17, 7, 30), bus)
    emitAppOpened(new Date(2026, 10, 17, 14, 0), bus)
    expect(seen).toEqual([false, true, false])
  })
})
