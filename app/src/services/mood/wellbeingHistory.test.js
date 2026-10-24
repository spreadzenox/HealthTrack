import { describe, it, expect } from 'vitest'
import { wellbeingHistory, expressionMix, EXPRESSIONS } from './wellbeingHistory'

const NEUTRAL = { smile: 0.1, duchenne: 0.05, mouthFrown: 0.05, browDown: 0.15, browInnerUp: 0.1, yaw: 4 }
const EX_ZERO = Object.fromEntries(EXPRESSIONS.map(({ key }) => [key, 0]))

function burst(at, values = {}, { trigger = 'unlock', valid = 3 } = {}) {
  return { type: 'face_burst', source: 'face_sense', at: at.toISOString(), payload: { v: 1, trigger, frames: 3, valid, values: { ...NEUTRAL, ...values }, rejected: {} } }
}
const NOW = new Date(2026, 9, 24, 20, 0)
const at = (daysAgo, h) => new Date(2026, 9, 24 - daysAgo, h, 0)

describe('wellbeingHistory — historique du bien-être (POL-2)', () => {
  it('jour : un point par lecture du jour, avec sa fourchette', () => {
    const entries = [burst(at(0, 8), { valence: 0.2, arousal: 0.1 }), burst(at(0, 12), { valence: 0.4, arousal: -0.1 }), burst(at(1, 9), { valence: -0.5 })]
    const h = wellbeingHistory(entries, { period: 'day', now: NOW })
    expect(h.points).toHaveLength(2)
    expect(h.points[0].low).toBeLessThan(h.points[0].note)
    expect(h.points[0].high).toBeGreaterThan(h.points[0].note)
    expect(h.readings).toBe(2)
    expect(h.days).toBe(1)
    expect(h.valence).toBeCloseTo(0.3, 5)
    expect(h.arousal).toBeCloseTo(0, 5)
  })

  it('semaine : un point par jour, marqué « peu de lectures » sous 3', () => {
    const entries = [
      burst(at(2, 8), { valence: 0.2 }), burst(at(2, 9), { valence: 0.2 }), burst(at(2, 10), { valence: 0.2 }),
      burst(at(1, 9), { valence: 0.6 }),
      burst(at(8, 9), { valence: 0.9 }), // hors de la semaine
    ]
    const h = wellbeingHistory(entries, { period: 'week', now: NOW })
    expect(h.points.map((p) => p.readings)).toEqual([3, 1])
    expect(h.points.map((p) => p.few)).toEqual([false, true])
    expect(h.points[1].note).toBeGreaterThan(h.points[0].note)
    expect(wellbeingHistory(entries, { period: 'month', now: NOW }).points).toHaveLength(3)
  })

  it('ignore les lectures de test et celles sans visage ; vide sans lecture', () => {
    const entries = [burst(at(0, 8), { valence: 0.2 }, { trigger: 'manual' }), burst(at(0, 9), {}, { valid: 0 })]
    const h = wellbeingHistory(entries, { period: 'week', now: NOW })
    expect(h.points).toEqual([])
    expect(h.readings).toBe(0)
    expect(h.mean).toBeNull()
    expect(h.valence).toBeNull()
    expect(h.expressions).toBeNull()
  })

  it('les notes données à la main restent à part, jamais mêlées à l’estimation', () => {
    const entries = [burst(at(0, 8), { valence: 0 }), { type: 'wellbeing', at: at(0, 9).toISOString(), payload: { score: 5 } }]
    const h = wellbeingHistory(entries, { period: 'day', now: NOW })
    expect(h.notes).toEqual([{ at: at(0, 9).toISOString(), score: 5 }])
    expect(h.points).toHaveLength(1)
    expect(h.points[0].note).toBeCloseTo(2.5, 1)
  })

  it('moyenne les probabilités d’expression des seules lectures qui en portent, triées', () => {
    const entries = [
      burst(at(0, 8), { valence: 0.5, ...EX_ZERO, exHappiness: 0.7, exNeutral: 0.3 }),
      burst(at(0, 9), { valence: 0.1, ...EX_ZERO, exHappiness: 0.3, exNeutral: 0.7 - 0.2, exSadness: 0.2 }),
      burst(at(0, 10), { valence: 0.1 }), // ancienne lecture, sans expressions
    ]
    const mix = wellbeingHistory(entries, { period: 'day', now: NOW }).expressions
    expect(mix.readings).toBe(2)
    expect(mix.items[0]).toEqual({ key: 'exHappiness', label: 'Joie', p: 0.5 })
    expect(mix.items[1]).toEqual({ key: 'exNeutral', label: 'Neutre', p: 0.4 })
    expect(mix.items[2].key).toBe('exSadness')
    expect(mix.items).toHaveLength(8)
    expect(expressionMix([])).toBeNull()
  })
})
