import { describe, it, expect } from 'vitest'
import { dayFaceDetail, shiftsSentence, vaSentence } from './trendsDay'
import { EXPRESSIONS } from './mood/wellbeingHistory'

const ex = (over = {}) => Object.fromEntries(EXPRESSIONS.map(({ key }) => [key, over[key] ?? (key === 'exNeutral' ? 0.5 : 0.5 / 7)]))
const burst = (d, h, values) => ({
  type: 'face_burst', at: new Date(2026, 10, d, h).toISOString(),
  payload: { trigger: 'unlock', valid: 3, values: { valence: 0.1, arousal: 0, ...ex(), ...values } },
})

describe('Détail d’un jour de Tendances (ORG-3c)', () => {
  it('« Plus de tristesse, moins de joie que d’habitude » dès 5 points d’écart', () => {
    expect(shiftsSentence([{ label: 'Tristesse', delta: 0.08 }, { label: 'Joie', delta: -0.06 }])).toBe('Plus de tristesse, moins de joie que d’habitude')
    expect(shiftsSentence([])).toBeNull()
  })

  it('« Éveil plutôt calme, moins que d’habitude »', () => {
    expect(vaSentence({ v: 0.1, a: -0.3 }, { v: 0.1, a: 0 })).toBe('Éveil plutôt calme, moins que d’habitude')
    expect(vaSentence({ v: -0.4, a: 0 }, { v: 0.1, a: 0 })).toBe('Expression plutôt désagréable, moins que d’habitude')
    expect(vaSentence({ v: 0.1, a: 0.05 }, null)).toBe('Éveil plutôt animé')
  })

  it('lit les lectures du jour, la note, et l’habitude des jours d’avant', () => {
    const entries = [
      ...[1, 2, 3, 4].flatMap((d) => [burst(d, 9, {}), burst(d, 18, { arousal: 0.2 })]),
      burst(7, 9, { exSadness: 0.3, exHappiness: 0.02, arousal: -0.4 }),
      burst(7, 12, { exSadness: 0.3, exHappiness: 0.02, arousal: -0.3 }),
      { type: 'wellbeing', at: new Date(2026, 10, 7, 21).toISOString(), payload: { score: 2.5 } },
    ]
    const d = dayFaceDetail(entries, '2026-11-07')
    expect(d.readings).toBe(2)
    expect(d.note).toBeCloseTo(3)
    expect(d.points).toHaveLength(2)
    expect(d.habit).not.toBeNull()
    expect(d.shifts).toMatch(/^Plus de tristesse/)
    expect(d.vaText).toBe('Éveil plutôt calme, moins que d’habitude')
  })
})
