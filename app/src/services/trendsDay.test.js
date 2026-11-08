import { describe, it, expect } from 'vitest'
import { dayFaceDetail, dayReadingsView, latestReadingDay, shiftsSentence, vaSentence } from './trendsDay'
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

// Correction T2 du propriétaire (07/11 vers 23:50) : la vue Jour de la maquette
describe('Vue Jour de Tendances (T2)', () => {
  const note = (d, h, score) => ({ type: 'wellbeing', at: new Date(2026, 10, d, h, 30).toISOString(), payload: { score } })
  const entries = [burst(5, 9, {}), burst(5, 13, {}), burst(5, 18, {}), burst(6, 10, {}), note(5, 21, 2.5)]

  it('les lectures du jour à leur heure, sur l’échelle affichée de 1 à 5, et la note (losange)', () => {
    const v = dayReadingsView(entries, '2026-11-05', new Date(2026, 10, 7, 20))
    expect(v.readings.map((r) => r.hour)).toEqual([9, 13, 18])
    for (const r of v.readings) expect(r.value).toBeGreaterThanOrEqual(1)
    for (const r of v.readings) expect(r.value).toBeLessThanOrEqual(5)
    expect(v.note).toEqual({ hour: 21.5, value: 3 })
    expect(v.nowHour).toBeNull()
  })

  it('aujourd’hui : seulement les lectures déjà faites, et l’heure de « maintenant »', () => {
    const v = dayReadingsView([...entries, burst(7, 9, {}), burst(7, 19, {})], '2026-11-07', new Date(2026, 10, 7, 16, 30))
    expect(v.readings.map((r) => r.hour)).toEqual([9])
    expect(v.nowHour).toBe(16.5)
    expect(v.note).toBeNull()
  })

  it('un jour sans lecture ni note : listes vides', () => {
    const v = dayReadingsView(entries, '2026-11-02', new Date(2026, 10, 7, 20))
    expect(v.readings).toEqual([])
    expect(v.note).toBeNull()
  })
})

// T3 (historique presque vide, 08/11) : la vue Jour s'ouvre sur le dernier jour qui a une lecture ou une note
describe('Jour ouvert par défaut (T3)', () => {
  const note = (d, h, score) => ({ type: 'wellbeing', at: new Date(2026, 10, d, h).toISOString(), payload: { score } })

  it('aujourd’hui s’il a déjà une lecture', () => {
    expect(latestReadingDay([burst(6, 9, {}), burst(7, 1, {})], new Date(2026, 10, 7, 2))).toBe('2026-11-07')
  })

  it('sinon le dernier jour qui a une lecture ou une note (nuit, rien encore aujourd’hui)', () => {
    expect(latestReadingDay([burst(5, 9, {}), note(6, 21, 3)], new Date(2026, 10, 7, 2))).toBe('2026-11-06')
  })

  it('ignore le futur et les autres entrées ; null sans rien', () => {
    expect(latestReadingDay([burst(5, 9, {}), burst(7, 20, {}), { type: 'sleep', at: new Date(2026, 10, 7, 1).toISOString() }], new Date(2026, 10, 7, 2))).toBe('2026-11-05')
    expect(latestReadingDay([], new Date(2026, 10, 7, 2))).toBeNull()
  })
})
