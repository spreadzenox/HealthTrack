import { describe, it, expect } from 'vitest'
import { wellbeingHistory, expressionMix, EXPRESSIONS, DAY_MAX_POINTS, viewEnd } from './wellbeingHistory'

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

  it('jour : au-delà de DAY_MAX_POINTS lectures, un point par heure (médiane), la moyenne reste celle des lectures', () => {
    // Toutes les 5 min de 8 h à 10 h (24 lectures basses), puis toutes les 15 min de 10 h à 11 h (4 hautes).
    const entries = []
    for (let m = 0; m < 120; m += 5) entries.push(burst(new Date(2026, 9, 24, 8, m), { valence: -0.4 }))
    for (let m = 0; m < 60; m += 15) entries.push(burst(new Date(2026, 9, 24, 10, m), { valence: 0.6 }))
    const h = wellbeingHistory(entries, { period: 'day', now: NOW })
    expect(entries.length).toBeGreaterThan(DAY_MAX_POINTS)
    expect(h.readings).toBe(28)
    expect(h.points.map((p) => p.readings)).toEqual([12, 12, 4])
    expect(h.points.every((p) => p.hourly)).toBe(true)
    expect(h.points.map((p) => new Date(p.at).getHours())).toEqual([8, 9, 10])
    expect(h.points[0].note).toBeLessThan(h.points[2].note)
    expect(h.points[0].low).toBeLessThan(h.points[0].note)
    expect(h.points[0].high).toBeGreaterThan(h.points[0].note)
    // Moyenne des 28 lectures (pondérée par heure), pas des 3 heures.
    const byReadings = h.points.reduce((s, p) => s + p.note * p.readings, 0) / 28
    const byHours = h.points.reduce((s, p) => s + p.note, 0) / 3
    expect(h.mean).toBeCloseTo(byReadings, 1)
    expect(Math.abs(h.mean - byHours)).toBeGreaterThan(0.2)
    const perReading = wellbeingHistory(entries.slice(0, DAY_MAX_POINTS), { period: 'day', now: NOW })
    expect(perReading.points).toHaveLength(DAY_MAX_POINTS)
    expect(perReading.points.some((p) => p.hourly)).toBe(false)
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

  describe('détail d’un point (BE-HISTO-DETAIL, retour (6) du 04/11)', () => {
    const ex = (over) => ({ ...EX_ZERO, exNeutral: 0.6, exSadness: 0.3, exHappiness: 0.1, ...over })

    it('jour : chaque lecture porte sa valence, son éveil, ses expressions et sa netteté', () => {
      const entries = [
        burst(at(0, 8), { valence: 0.2, arousal: 0.1, ...ex() }),
        burst(at(0, 12), { valence: -0.4, arousal: 0.3, yaw: 30 }, { valid: 2 }),
      ]
      const h = wellbeingHistory(entries, { period: 'day', now: NOW })
      const [a, b] = h.points
      expect(a.detail).toMatchObject({ readings: 1, poor: 0, valence: 0.2, arousal: 0.1 })
      expect(a.detail.expressions.items[0]).toMatchObject({ key: 'exNeutral', p: 0.6 })
      expect(b.detail).toMatchObject({ readings: 1, poor: 1, valence: -0.4, arousal: 0.3, expressions: null })
    })

    it('jour très lu : le détail d’une heure couvre toutes ses lectures', () => {
      const entries = []
      for (let m = 0; m <= 120; m += 5) entries.push(burst(new Date(2026, 9, 24, 8, m), { valence: m < 60 ? -0.2 : 0.4, ...ex() }))
      const h = wellbeingHistory(entries, { period: 'day', now: NOW })
      expect(h.points[0].detail).toMatchObject({ readings: 12, poor: 0, valence: -0.2 })
      expect(h.points[1].detail).toMatchObject({ readings: 12, valence: 0.4 })
      expect(h.points[1].detail.expressions.readings).toBe(12)
    })

    it('semaine : le détail d’un jour reprend les lectures de ce jour seulement', () => {
      const entries = [
        burst(at(1, 9), { valence: 0.5, arousal: -0.2 }), burst(at(1, 18), { valence: 0.1, arousal: 0 }),
        burst(at(0, 9), { valence: -0.6, arousal: 0.4, ...ex() }),
      ]
      const h = wellbeingHistory(entries, { period: 'week', now: NOW })
      expect(h.points[0].detail).toMatchObject({ readings: 2, valence: 0.3, arousal: -0.1, expressions: null })
      expect(h.points[1].detail).toMatchObject({ readings: 1, valence: -0.6, arousal: 0.4 })
      expect(h.points[1].detail.expressions.readings).toBe(1)
    })
  })

  describe('remonter le temps (BE-HISTO-DETAIL-2, retour (6) du 04/11)', () => {
    it('viewEnd : maintenant au décalage 0, sinon la fin du dernier jour de la période d’avant', () => {
      expect(viewEnd('week', NOW, 0)).toBe(NOW)
      expect(viewEnd('day', NOW, 1)).toEqual(new Date(2026, 9, 23, 23, 59, 59, 999))
      expect(viewEnd('week', NOW, 2)).toEqual(new Date(2026, 9, 10, 23, 59, 59, 999))
      expect(viewEnd('month', NOW, 1)).toEqual(new Date(2026, 8, 24, 23, 59, 59, 999))
    })

    it('une semaine passée ne montre que ses jours, et dit où commence l’historique', () => {
      const entries = [burst(at(10, 9)), burst(at(9, 9)), burst(at(1, 9)),
        { type: 'wellbeing', at: at(12, 21).toISOString(), payload: { score: 4 } }]
      const past = wellbeingHistory(entries, { period: 'week', now: viewEnd('week', NOW, 1) })
      expect(past.points.map((p) => p.date)).toEqual(['2026-10-14', '2026-10-15'])
      expect(past.notes).toHaveLength(1)
      expect(past.earliest).toBe(at(12, 21).toISOString())
      expect(wellbeingHistory([], { period: 'week', now: NOW }).earliest).toBeNull()
    })
  })
})
