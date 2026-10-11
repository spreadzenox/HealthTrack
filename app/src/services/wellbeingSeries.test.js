import { describe, it, expect } from 'vitest'
import { localDateKey, localHour, seriesByCalendarDay, seriesByHourToday } from './wellbeingSeries'

describe('wellbeingSeries', () => {
  it('localDateKey returns YYYY-MM-DD', () => {
    const k = localDateKey('2026-04-10T12:00:00')
    expect(k).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('localHour returns hour 0-23', () => {
    const h = localHour('2026-04-10T14:30:00')
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThanOrEqual(23)
  })

  it('seriesByCalendarDay averages scores per day', () => {
    const now = new Date(2026, 3, 10, 15, 0, 0)
    const entries = [
      { at: '2026-04-08T10:00:00', payload: { score: 4 } },
      { at: '2026-04-08T18:00:00', payload: { score: 2 } },
      { at: '2026-04-09T12:00:00', payload: { score: 5 } },
      { at: '2026-04-09T12:00:00', payload: { score: 1 } },
    ]
    const s = seriesByCalendarDay(entries, 14, now)
    const d8 = s.find((x) => x.dateKey === '2026-04-08')
    const d9 = s.find((x) => x.dateKey === '2026-04-09')
    expect(d8.average).toBe(3)
    expect(d8.count).toBe(2)
    expect(d9.average).toBe(3)
    expect(d9.count).toBe(2)
  })

  it('seriesByCalendarDay couvre les N jours du calendrier finissant aujourd\'hui, trous compris', () => {
    const now = new Date(2026, 3, 10, 15, 0, 0)
    const entries = [
      { at: '2026-04-01T12:00:00', payload: { score: 4 } },
      { at: '2026-04-09T12:00:00', payload: { score: 2 } },
    ]
    const s = seriesByCalendarDay(entries, 14, now)
    expect(s).toHaveLength(14)
    expect(s[0].dateKey).toBe('2026-03-28')
    expect(s[13].dateKey).toBe('2026-04-10')
    expect(s.map((d) => d.offset)).toEqual([...Array(14).keys()])
    // Jours sans note : null, pas 0 ni absents
    expect(s.find((d) => d.dateKey === '2026-04-05')).toMatchObject({ average: null, count: 0 })
    expect(s.find((d) => d.dateKey === '2026-04-01').average).toBe(4)
    expect(s.find((d) => d.dateKey === '2026-04-09').average).toBe(2)
  })

  it('seriesByCalendarDay ignore les notes plus anciennes que la fenêtre (pas de vieilles notes présentées comme récentes)', () => {
    const now = new Date(2026, 3, 30, 9, 0, 0)
    const entries = [
      { at: '2026-04-01T12:00:00', payload: { score: 4 } },
      { at: '2026-04-02T12:00:00', payload: { score: 2 } },
    ]
    const s = seriesByCalendarDay(entries, 14, now)
    expect(s).toHaveLength(14)
    expect(s.every((d) => d.average === null)).toBe(true)
  })

  it('seriesByCalendarDay ignores invalid scores', () => {
    const now = new Date(2026, 3, 1, 15, 0, 0)
    const s = seriesByCalendarDay([{ at: '2026-04-01T12:00:00', payload: { score: 99 } }], 14, now)
    expect(s.every((d) => d.average === null)).toBe(true)
  })

  it('seriesByHourToday only includes today', () => {
    const now = new Date(2026, 3, 10, 15, 0, 0)
    const todayKey = localDateKey(now.toISOString())
    const entries = [
      { at: `${todayKey}T08:00:00`, payload: { score: 3 } },
      { at: `${todayKey}T08:30:00`, payload: { score: 1 } },
      { at: '2020-01-01T08:00:00', payload: { score: 5 } },
    ]
    const s = seriesByHourToday(entries, now)
    expect(s.length).toBe(1)
    expect(s[0].hour).toBe(8)
    expect(s[0].average).toBe(2)
    expect(s[0].count).toBe(2)
  })
})
