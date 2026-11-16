import { describe, it, expect, vi, afterEach } from 'vitest'
import { createBus, EVENTS } from '../bus'
import { emitEntry, MEDITATION_MS } from './emit'

const at = (h) => new Date(2026, 10, 16, h, 0).toISOString()

afterEach(() => vi.useRealTimers())

function spy() {
  const target = createBus()
  const got = []
  target.on('*', (payload, type) => got.push([type, payload]))
  return { target, got }
}

describe('emitEntry (CONTRAT.md § 4)', () => {
  it('repas : le créneau et le compte, jamais le contenu', () => {
    const { target, got } = spy()
    emitEntry({ type: 'food', at: at(8), payload: { dish: 'Tartines', kcal: 400 } }, { mealsToday: 1, target })
    expect(got).toEqual([[EVENTS.MEAL_LOGGED, { slot: 'breakfast', count: 1, total: 3 }]])
  })

  it('bien-être : le niveau 1 à 5, « difficile » à 2 ou moins', () => {
    const { target, got } = spy()
    emitEntry({ type: 'wellbeing', at: at(9), payload: { score: 1.25 } }, { target })
    expect(got[0]).toEqual([EVENTS.WELLBEING_NOTED, { level: 2, difficult: true, source: 'note' }])
  })

  it('habitude : oui et non ; la méditation commence puis finit', () => {
    vi.useFakeTimers()
    const { target, got } = spy()
    emitEntry({ type: 'habit', at: at(12), payload: { habit: 'meditation', done: true } }, { target })
    expect(got.map(([t]) => t)).toEqual([EVENTS.HABIT_NOTED, EVENTS.ACTIVITY_START])
    vi.advanceTimersByTime(MEDITATION_MS)
    expect(got.at(-1)).toEqual([EVENTS.ACTIVITY_END, { kind: 'meditation' }])
    emitEntry({ type: 'habit', at: at(12), payload: { habit: 'reading', done: false } }, { target })
    expect(got.at(-1)).toEqual([EVENTS.HABIT_NOTED, { habitId: 'reading', answer: 'no' }])
  })

  it('digestion : aucune valeur ; annulation : le kind et l’id', () => {
    const { target, got } = spy()
    emitEntry({ type: 'gut', at: at(20), payload: { level: 'pain' } }, { target })
    emitEntry(null, { undone: { kind: 'meal', id: '7' }, target })
    expect(got).toEqual([[EVENTS.GUT_NOTED, {}], [EVENTS.ENTRY_UNDONE, { kind: 'meal', id: '7' }]])
  })
})
