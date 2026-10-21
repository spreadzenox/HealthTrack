import { describe, it, expect, vi } from 'vitest'
import { loadFaceMoodEntries } from './faceMoodData'

describe('loadFaceMoodEntries', () => {
  it('reads no note at all without any face reading', async () => {
    const list = vi.fn(async () => [])
    expect(await loadFaceMoodEntries({ list })).toEqual({ bursts: [], notes: [] })
    expect(list).toHaveBeenCalledTimes(1)
  })

  it('reads notes only from the day of the first face reading', async () => {
    const bursts = [{ type: 'face_burst', at: '2026-10-18T09:00:00.000Z' }, { type: 'face_burst', at: '2026-10-10T15:00:00.000Z' }]
    const list = vi.fn(async (opts) => (opts.type === 'face_burst' ? bursts : [{ type: 'wellbeing' }]))
    const out = await loadFaceMoodEntries({ list })
    expect(out.notes).toHaveLength(1)
    const since = list.mock.calls[1][0].since
    const d = new Date(since)
    expect(since <= '2026-10-10T15:00:00.000Z').toBe(true)
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0])
    expect(d.getDate()).toBe(new Date('2026-10-10T15:00:00.000Z').getDate())
  })
})

describe('loadWellbeingToday', () => {
  it('rend null sans rafale du visage', async () => {
    const { loadWellbeingToday } = await import('./faceMoodData')
    expect(await loadWellbeingToday({ list: async () => [] })).toBeNull()
  })

  it('rend l’estimation du jour et les jours estimés', async () => {
    const { loadWellbeingToday } = await import('./faceMoodData')
    const now = new Date(2026, 9, 21, 12)
    const burst = (d, h) => ({
      type: 'face_burst', source: 'face_sense', at: new Date(2026, 9, d, h).toISOString(),
      payload: { trigger: 'unlock', frames: 3, valid: 3, values: { smile: 0.4, valence: 0.2, arousal: 0 } },
    })
    const bursts = [20, 21].flatMap((d) => [8, 9, 10].map((h) => burst(d, h)))
    const r = await loadWellbeingToday({ list: async ({ type }) => (type === 'face_burst' ? bursts : []), now })
    expect(r.est.day.readings).toBe(3)
    expect(r.days.map((d) => d.date)).toEqual(['2026-10-20', '2026-10-21'])
  })
})
