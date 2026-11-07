import { describe, it, expect } from 'vitest'
import {
  wellbeingWeeks, wellbeingWeeksReady, shownWellbeingWeeks, wellbeingWeekLabel, WELLBEING_WEEKS,
} from './wellbeingWeeks'
import { faceMoodDays } from './faceMoodDays'

const NOW = new Date(2026, 10, 6, 10) // vendredi 6 novembre 2026, 10 h
const NEUTRAL = { smile: 0.1, duchenne: 0.05, mouthFrown: 0.05, browDown: 0.15, browInnerUp: 0.1, yaw: 4 }
const burst = (d, h, valence) => ({
  type: 'face_burst', source: 'face_sense', at: d(h).toISOString(),
  payload: { v: 1, trigger: 'unlock', frames: 3, valid: 3, values: { ...NEUTRAL, valence, arousal: 0 }, rejected: {} },
})
const date = (m, day) => (h) => new Date(2026, m - 1, day, h)
const note = (m, day, h, score) => ({ type: 'wellbeing', at: date(m, day)(h).toISOString(), payload: { score } })
const faceDay = (m, day, valence) => [9, 13, 18].map((h) => burst(date(m, day), h, valence))

describe('wellbeingWeeks — bien-être semaine par semaine (onglet Bien-être)', () => {
  it('rend 8 semaines de 7 jours, la dernière finit aujourd’hui', () => {
    const w = wellbeingWeeks([], { now: NOW })
    expect(w).toHaveLength(WELLBEING_WEEKS)
    expect(w[7]).toMatchObject({ from: '2026-10-31', to: '2026-11-06', estDays: 0, est: null, noteDays: 0, note: null })
    expect(w[0].from).toBe('2026-09-12')
  })

  it('l’estimé reprend la note du jour de l’historique et des Analyses (faceMoodDays), moyennée par semaine', () => {
    const entries = [...faceDay(11, 2, 0.4), ...faceDay(11, 4, -0.2), ...faceDay(10, 26, 0)]
    const w = wellbeingWeeks(entries, { now: NOW })
    const days = faceMoodDays(entries)
    const lastWeek = days.filter((d) => d.date >= '2026-10-31').map((d) => d.note)
    expect(w[7].estDays).toBe(2)
    expect(w[7].est).toBeCloseTo(Math.round(((lastWeek[0] + lastWeek[1]) / 2) * 10) / 10, 5)
    expect(w[6].estDays).toBe(1)
    expect(w[7].noteDays).toBe(0)
  })

  it('les notes restent à part : plusieurs notes un même jour comptent pour un jour', () => {
    const w = wellbeingWeeks([note(11, 5, 9, 2), note(11, 5, 21, 4), note(11, 3, 20, 5)], { now: NOW })
    expect(w[7]).toMatchObject({ noteDays: 2, note: 4, estDays: 0, est: null })
  })

  it('un jour de moins de 3 lectures n’est pas estimé ; les jours hors période et les autres entrées sont ignorés', () => {
    const w = wellbeingWeeks([
      burst(date(11, 5), 9, 0.3),
      ...faceDay(9, 1, 0.3),
      note(11, 7, 9, 3),
      { type: 'wellbeing', at: 'pas une date', payload: { score: 3 } },
      { type: 'food', at: date(11, 5)(12).toISOString(), payload: { score: 5 } },
    ], { now: NOW })
    expect(w.every((x) => x.estDays === 0 && x.noteDays === 0)).toBe(true)
  })

  it('le graphique attend deux semaines lues ou notées et commence à la première', () => {
    const one = wellbeingWeeks([note(11, 5, 9, 3)], { now: NOW })
    expect(wellbeingWeeksReady(one)).toBe(false)
    const two = wellbeingWeeks([note(11, 5, 9, 3), ...faceDay(10, 20, 0)], { now: NOW })
    expect(wellbeingWeeksReady(two)).toBe(true)
    expect(shownWellbeingWeeks(two).map((x) => x.from)).toEqual(['2026-10-17', '2026-10-24', '2026-10-31'])
    expect(wellbeingWeeksReady(undefined)).toBe(false)
    expect(shownWellbeingWeeks(undefined)).toEqual([])
  })

  it('libellé pour le lecteur d’écran', () => {
    expect(wellbeingWeekLabel({ from: '2026-10-26', estDays: 6, est: 3.4, noteDays: 1, note: 4 }))
      .toBe('Semaine du 26 oct. : estimé 3,7 sur 5 (6 jours), vos notes 4,2 sur 5 (1 jour)')
    expect(wellbeingWeekLabel({ from: '2026-10-26', estDays: 0, est: null, noteDays: 0, note: null }))
      .toBe('Semaine du 26 oct. : rien de lu ni de noté')
  })
})
