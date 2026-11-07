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
    const list = vi.fn(async (opts) => (opts.type === 'face_burst' ? bursts : [{ type: opts.type }]))
    const out = await loadFaceMoodEntries({ list })
    // Notes de bien-être et digestives, lues depuis le même jour (observations de TS-1).
    expect(out.notes.map((e) => e.type)).toEqual(['wellbeing', 'gut'])
    expect(list.mock.calls[2][0].since).toBe(list.mock.calls[1][0].since)
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
    // TS-1 : l'estimation du jour du modèle à espace d'états, calculée sur les entrées déjà lues
    expect(Number.isFinite(r.state.mean)).toBe(true)
    expect(r.state.low).toBeLessThanOrEqual(r.state.mean)
  })

  it('lit aussi les selles (TS-1) depuis la première lecture du visage', async () => {
    const bursts = [{ type: 'face_burst', at: '2026-10-10T15:00:00.000Z' }]
    const list = vi.fn(async (opts) => (opts.type === 'face_burst' ? bursts : []))
    await loadFaceMoodEntries({ list, withStool: true })
    expect(list.mock.calls.map((c) => c[0].type)).toEqual(['face_burst', 'wellbeing', 'gut', 'stool'])
  })
})

describe('todayWellbeingState (TS-1 sur l’Accueil)', () => {
  const now = new Date(2026, 9, 21, 12)
  const day = (date, extra = {}) => ({ date, future: false, observed: { wellbeing: true }, wellbeing: { mean: 3.2, low: 2.6, high: 3.8 }, ...extra })
  it('prend le calcul complet de Tendances s’il est en cache', async () => {
    const { todayWellbeingState } = await import('./faceMoodData')
    const cached = { hit: true, result: { days: [day('2026-10-20'), day('2026-10-21')] } }
    expect(todayWellbeingState([], now, cached)).toEqual({ mean: 3.2, low: 2.6, high: 3.8 })
  })
  it('rien si le bien-être n’est pas observé aujourd’hui (jamais l’attendu)', async () => {
    const { todayWellbeingState } = await import('./faceMoodData')
    const cached = { hit: true, result: { days: [day('2026-10-21', { observed: { wellbeing: false } })] } }
    expect(todayWellbeingState([], now, cached)).toBeNull()
    expect(todayWellbeingState([], now, { hit: false })).toBeNull()
  })
})

describe('loadWellbeingHistory', () => {
  it('lit les notes du mois même sans aucune rafale du visage', async () => {
    const { loadWellbeingHistory } = await import('./faceMoodData')
    const now = new Date(2026, 9, 24, 20)
    const note = { type: 'wellbeing', at: new Date(2026, 9, 24, 9).toISOString(), payload: { score: 4 } }
    const list = vi.fn(async ({ type }) => (type === 'wellbeing' ? [note] : []))
    const h = await loadWellbeingHistory({ list, period: 'day', now })
    expect(h.notes).toEqual([{ at: note.at, score: 4 }])
    expect(h.points).toEqual([])
  })
})
