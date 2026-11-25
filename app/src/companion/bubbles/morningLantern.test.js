import { describe, it, expect, beforeEach } from 'vitest'
import { lanternToShow, markLanternShown, summariesOf, LANTERN_SEEN_KEY } from './morningLantern'
import { createTrial } from '../../services/trials'

const sleep = { key: 'sleepMinutes', label: 'Sommeil', outcome: 'wellbeing', effect: 0.4 }
const schedule = [...Array(10)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 }))
const trial = { ...createTrial(sleep, { now: new Date(2026, 10, 1, 9) }), threshold: 450, direction: 'more', schedule }
const trials = [{ id: 7, type: 'trial', at: '2026-11-01T08:00:00.000Z', payload: trial }]
const NOW = new Date(2026, 10, 4, 8)

describe('LANT-3 : la lanterne du matin, côté Accueil', () => {
  beforeEach(() => localStorage.clear())

  it('les habitudes répondues comptent dans les résumés (essai sur une habitude)', () => {
    const s = summariesOf([{ type: 'habit', at: '2026-11-03T19:00:00', payload: { habit: 'meditation', done: true } }])
    expect(s.get('2026-11-03').habits).toEqual({ meditation: true })
  })

  it('hier tenu (réponse « c’était tenu ? ») : une fois par jour seulement', () => {
    const answered = [{ ...trials[0], payload: { ...trial, answers: { '2026-11-03': true } } }]
    const lit = lanternToShow({ trials: answered, entries: [], now: NOW })
    expect(lit).toEqual({ date: '2026-11-03', key: '2026-11-04' })
    markLanternShown(lit.key)
    expect(localStorage.getItem(LANTERN_SEEN_KEY)).toBe('2026-11-04')
    expect(lanternToShow({ trials: answered, entries: [], now: NOW })).toBeNull()
    expect(lanternToShow({ trials: answered, entries: [], now: new Date(2026, 10, 6, 8) })).toBeNull() // hier (5) : jour sans
  })

  it('rien sans essai, ni quand hier n’est pas connu comme tenu', () => {
    expect(lanternToShow({ trials: [], entries: [], now: NOW })).toBeNull()
    expect(lanternToShow({ trials, entries: [], now: NOW })).toBeNull()
  })
})
