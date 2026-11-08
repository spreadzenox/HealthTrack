import { describe, it, expect } from 'vitest'
import { createTrial, instruction, trialStatus, habitStatus, TRIAL_DAYS } from './trials'

const sleep = { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', outcome: 'wellbeing', effect: 0.4, center: 420, usualChange: { amount: 30, unit: 'min', text: '30 min de sommeil de plus' } }
const START = new Date(2026, 10, 1, 9)
const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length] }

describe('Essais (ORG-8)', () => {
  it('14 jours tirés au sort, 7 avec et 7 sans ; la consigne d’après la piste', () => {
    const t = createTrial(sleep, { now: START, rng: seq([0.3, 0.7, 0.1, 0.9]) })
    expect(t.schedule).toHaveLength(TRIAL_DAYS)
    expect(t.schedule.filter((d) => d.with)).toHaveLength(7)
    expect(t.schedule[0].date).toBe('2026-11-01')
    expect(instruction(t)).toBe('Dormir au moins 7 h 30')
    expect(instruction(t, false)).toBe('Comme d’habitude')
    expect(instruction(createTrial({ ...sleep, key: 'fiber_g', label: 'Fibres' }, { now: START }))).toBe('Un peu plus de fibres que d’habitude')
    expect(instruction(createTrial({ ...sleep, key: 'alcohol_g', label: 'Alcool', effect: -0.5 }, { now: START }))).toBe('Un peu moins d’alcool que d’habitude')
  })

  it('la tenue vient des données ; la question seulement si elles manquent', () => {
    const t = { ...createTrial(sleep, { now: START }), schedule: [...Array(14)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }
    const summaries = new Map([['2026-11-01', { sleepMinutes: 460 }], ['2026-11-02', { sleepMinutes: 470 }]])
    const s = trialStatus(t, { summaries, now: new Date(2026, 10, 4, 10) })
    expect(s.calendar[0].held).toBe(true)
    expect(s.calendar[1].held).toBe(false)
    expect(s.ask).toMatchObject({ date: '2026-11-03', missing: 'Nous n’avons pas reçu vos données de sommeil pour hier soir.' })
    expect(s.ask.question).toBe('Hier, dormir au moins 7 h 30 : c’était tenu ?')
    expect(trialStatus({ ...t, answers: { '2026-11-03': true } }, { summaries, now: new Date(2026, 10, 4, 10) }).ask).toBeNull()
  })

  it('résultat en cours : écart et fourchette dès 3 lendemains de chaque sorte ; verdict à la fin', () => {
    const t = { ...createTrial(sleep, { now: START }), schedule: [...Array(14)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }
    const outcome = new Map()
    for (let d = 2; d <= 15; d += 1) outcome.set(`2026-11-${String(d).padStart(2, '0')}`, d % 2 === 0 ? 4 + (d % 4) * 0.05 : 2.5 + (d % 3) * 0.05)
    const mid = trialStatus(t, { outcome, now: new Date(2026, 10, 5, 10) })
    expect(mid.result.diff).toBeNull()
    const end = trialStatus(t, { outcome, now: new Date(2026, 10, 17, 10) })
    expect(end.done).toBe(true)
    expect(end.result.diff).toBeGreaterThan(1)
    expect(end.verdict).toBe('verified')
    const flat = new Map([...outcome].map(([k]) => [k, 3]))
    expect(trialStatus(t, { outcome: flat, now: new Date(2026, 10, 17, 10) }).verdict).toBe('no_effect')
  })

  it('habitude : « vous vous éloignez » à 9 jours sur 14 non tenus, au plus une fois par mois', () => {
    const t = { ...createTrial(sleep, { now: START }), kept: true }
    const summaries = new Map()
    for (let d = 1; d <= 14; d += 1) summaries.set(`2026-11-${String(d).padStart(2, '0')}`, { sleepMinutes: d <= 10 ? 380 : 460 })
    const now = new Date(2026, 10, 15, 10)
    expect(habitStatus(t, { summaries, now }).drifting).toBe(false) // a repris hier
    for (let d = 11; d <= 14; d += 1) summaries.set(`2026-11-${d}`, { sleepMinutes: 380 })
    expect(habitStatus(t, { summaries, now }).drifting).toBe(true)
    expect(habitStatus({ ...t, nudgedAt: new Date(2026, 10, 10).toISOString() }, { summaries, now }).drifting).toBe(false)
  })
})
