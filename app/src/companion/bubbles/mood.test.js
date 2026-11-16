import { describe, it, expect } from 'vitest'
import { moodLevel, dayMood, MOOD_WORDS, moodFill } from './mood'

const mem = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
}
const D = (h, day = 16) => new Date(2026, 10, day, h)

describe('humeur du jour', () => {
  it('plancher Tranquille, le premier geste fait monter, tout noté = Rayonnant', () => {
    expect(MOOD_WORDS[moodLevel(0, 5)]).toBe('Tranquille')
    expect(moodLevel(1, 6)).toBe(1)
    expect(MOOD_WORDS[moodLevel(5, 5)]).toBe('Rayonnant')
    expect(moodLevel(3, 0)).toBe(0)
  })

  it('ne redescend jamais dans la journée, repart de Tranquille le lendemain', () => {
    const storage = mem()
    expect(dayMood(3, 5, { now: D(10), storage }).level).toBe(3)
    // une saisie annulée, ou une habitude de plus : la jauge garde son cran
    expect(dayMood(2, 5, { now: D(11), storage }).level).toBe(3)
    expect(dayMood(3, 8, { now: D(12), storage }).word).toBe('Ravi')
    expect(dayMood(0, 5, { now: D(9, 17), storage }).word).toBe('Tranquille')
  })

  it('dit quand elle vient de monter', () => {
    const storage = mem()
    expect(dayMood(0, 4, { now: D(8), storage }).rose).toBe(false)
    expect(dayMood(1, 4, { now: D(9), storage }).rose).toBe(true)
    expect(dayMood(1, 4, { now: D(9), storage }).rose).toBe(false)
  })

  it('la jauge garde un peu de couleur au plancher', () => {
    expect(moodFill(0)).toBeGreaterThan(0)
    expect(moodFill(4)).toBe(1)
  })
})
