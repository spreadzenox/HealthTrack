import { describe, it, expect } from 'vitest'
import { gutWeeks, gutWeeksReady, gutWeekLabel, GUT_WEEKS } from './gutWeeks'
import { buildReport } from './report/buildReport'

const NOW = new Date(2026, 10, 6, 10) // vendredi 6 novembre 2026, 10 h
const note = (y, m, d, h, level, scope) => ({
  type: 'gut',
  at: new Date(y, m - 1, d, h).toISOString(),
  payload: scope ? { level, scope } : { level },
})

describe('gutWeeks', () => {
  it('rend 8 semaines de 7 jours, la dernière finit aujourd’hui', () => {
    const w = gutWeeks([], { now: NOW })
    expect(w).toHaveLength(GUT_WEEKS)
    expect(w[7]).toMatchObject({ from: '2026-10-31', to: '2026-11-06', notedDays: 0 })
    expect(w[0].from).toBe('2026-09-12')
  })

  it('un jour prend sa note la plus forte, bilan du soir et notes au fil de l’eau confondus', () => {
    const w = gutWeeks([
      note(2026, 11, 5, 9, 'calm'),
      note(2026, 11, 5, 14, 'pain'),
      note(2026, 11, 5, 21, 'discomfort', 'day'),
      note(2026, 11, 4, 21, 'calm', 'day'),
      note(2026, 11, 3, 12, 'discomfort'),
    ], { now: NOW })
    expect(w[7]).toMatchObject({ notedDays: 3, calm: 1, discomfort: 1, pain: 1 })
  })

  it('ignore les autres entrées, les niveaux inconnus et les jours hors période', () => {
    const w = gutWeeks([
      { type: 'wellbeing', at: new Date(2026, 10, 5).toISOString(), payload: { level: 'pain' } },
      note(2026, 11, 5, 9, 'bizarre'),
      note(2026, 9, 1, 9, 'pain'),
      note(2026, 11, 7, 9, 'pain'),
      { type: 'gut', at: 'pas une date', payload: { level: 'pain' } },
    ], { now: NOW })
    expect(w.every((x) => x.notedDays === 0)).toBe(true)
  })

  it('mêmes chiffres que le rapport PDF sur 4 semaines', () => {
    const entries = []
    for (let i = 0; i < 28; i += 1) {
      if (i % 5 === 3) continue
      entries.push(note(2026, 10, 10 + i, 20, ['calm', 'discomfort', 'pain'][i % 3], 'day'))
      if (i % 4 === 0) entries.push(note(2026, 10, 10 + i, 13, 'pain'))
    }
    const report = buildReport(entries, { now: NOW, weeks: 4 })
    const mine = gutWeeks(entries, { now: NOW, weeks: 4 })
    expect(mine).toEqual(report.weekly.map(({ from, to, notedDays, calm, discomfort, pain }) => ({ from, to, notedDays, calm, discomfort, pain })))
  })

  it('le graphique attend deux semaines notées', () => {
    expect(gutWeeksReady(gutWeeks([note(2026, 11, 5, 9, 'calm')], { now: NOW }))).toBe(false)
    expect(gutWeeksReady(gutWeeks([note(2026, 11, 5, 9, 'calm'), note(2026, 10, 25, 9, 'calm')], { now: NOW }))).toBe(true)
    expect(gutWeeksReady(undefined)).toBe(false)
  })

  it('libellé pour le lecteur d’écran', () => {
    expect(gutWeekLabel({ from: '2026-10-26', notedDays: 6, calm: 3, discomfort: 2, pain: 1 }))
      .toBe('Semaine du 26 oct. : 3 calmes, 2 gênes, 1 douleur, 1 jour sans note')
    expect(gutWeekLabel({ from: '2026-10-26', notedDays: 0, calm: 0, discomfort: 0, pain: 0 }))
      .toBe('Semaine du 26 oct. : aucune note')
  })
})
