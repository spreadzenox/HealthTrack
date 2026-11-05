import { describe, it, expect } from 'vitest'
import { GUT_SELF_REPORT_WEIGHT, gutAdjust, gutLevelsByDay } from './gutSelfReport'
import { faceMoodEstimate, describeFaceMood } from './faceMood'
import { faceMoodDays } from './faceMoodDays'
import { wellbeingHistory } from './wellbeingHistory'
import { loadWellbeingToday } from './faceMoodData'

const NEUTRAL = { smile: 0.1, duchenne: 0.05, mouthFrown: 0.05, browDown: 0.15, browInnerUp: 0.1, yaw: 4 }
const burst = (at, valence) => ({ type: 'face_burst', source: 'face_sense', at: at.toISOString(), payload: { v: 1, trigger: 'unlock', frames: 3, valid: 3, values: { ...NEUTRAL, valence, arousal: 0 }, rejected: {} } })
const gut = (at, level, scope) => ({ type: 'gut', source: 'app_gut', at: at.toISOString(), payload: scope ? { level, scope } : { level } })
const NOW = new Date(2026, 10, 5, 20, 0)
const at = (daysAgo, h) => new Date(2026, 10, 5 - daysAgo, h, 0)
const readings = (daysAgo, valence) => [8, 9, 10].map((h) => burst(at(daysAgo, h), valence))

describe('VENTRE-BE-2 : le ressenti du ventre ajuste le bien-être (poids faible)', () => {
  it('gêne et douleur tirent la note vers le bas, d’un pas faible ; calme ne change rien', () => {
    expect(gutAdjust(3.5, 'calm')).toEqual({ note: 3.5, gut: null })
    const pain = gutAdjust(3.5, 'pain')
    expect(pain.note).toBeCloseTo(3.5 + GUT_SELF_REPORT_WEIGHT * (1 - 3.5), 5)
    expect(pain.gut).toEqual({ level: 'pain', shift: -0.5 })
    expect(gutAdjust(3.5, 'discomfort').note).toBeGreaterThan(pain.note)
    expect(Math.abs(pain.note - 3.5)).toBeLessThanOrEqual(1)
  })

  it('ne relève jamais une journée déjà basse', () => {
    expect(gutAdjust(1.5, 'discomfort')).toEqual({ note: 1.5, gut: null })
  })

  it('un seul pas par jour : la note la plus forte du jour', () => {
    const m = gutLevelsByDay([gut(at(0, 9), 'discomfort'), gut(at(0, 14), 'pain'), gut(at(0, 20), 'calm', 'day'), gut(at(1, 9), 'calm')])
    expect([...m.values()]).toEqual(['pain'])
  })

  it('la carte de l’Accueil : la note du jour baisse un peu et dit pourquoi', () => {
    const face = readings(0, 0.4)
    const plain = faceMoodEstimate(face, { now: NOW })
    const withGut = faceMoodEstimate([...face, gut(at(0, 12), 'pain')], { now: NOW })
    expect(withGut.day.note).toBeLessThan(plain.day.note)
    expect(plain.day.note - withGut.day.note).toBeLessThan(0.8)
    expect(withGut.day.gut.level).toBe('pain')
    expect(plain.day.gut).toBeNull()
    expect(withGut.signals).toEqual(['visage', 'ventre'])
    expect(describeFaceMood(withGut).join(' ')).toMatch(/douleur au ventre/)
    // Une note du ventre d'hier ne touche pas aujourd'hui.
    expect(faceMoodEstimate([...face, gut(at(1, 12), 'pain')], { now: NOW }).day.note).toBe(plain.day.note)
  })

  it('même série partout : jours des Analyses et historique du bien-être', () => {
    const face = [...readings(1, 0.4), ...readings(0, 0.4)]
    const entries = [...face, gut(at(1, 20), 'discomfort', 'day')]
    const days = faceMoodDays(entries)
    const plainDays = faceMoodDays(face)
    expect(days[0].note).toBeLessThan(plainDays[0].note)
    expect(days[1].note).toBe(plainDays[1].note)
    const h = wellbeingHistory(entries, { period: 'week', now: NOW })
    expect(h.points[0].note).toBeCloseTo(days[0].note, 1)
    expect(h.points[0].detail.gut).toEqual(expect.objectContaining({ level: 'discomfort' }))
    expect(h.points[1].detail.gut ?? null).toBeNull()
  })

  it('lit les notes du ventre depuis la première lecture du visage', async () => {
    const store = [...readings(0, 0.4), gut(at(0, 12), 'pain'), gut(at(20, 12), 'pain')]
    const list = async ({ type, since }) => store.filter((e) => e.type === type && (!since || e.at >= since))
    const res = await loadWellbeingToday({ list, now: NOW })
    expect(res.est.day.gut.level).toBe('pain')
  })
})
