import { describe, it, expect } from 'vitest'
import { localDateKey, localHour, seriesByDay, seriesByHourToday } from './wellbeingSeries'

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

  it('seriesByDay averages scores per day and caps length', () => {
    const entries = [
      { at: '2026-04-08T10:00:00', payload: { score: 4 } },
      { at: '2026-04-08T18:00:00', payload: { score: 2 } },
      { at: '2026-04-09T12:00:00', payload: { score: 5 } },
      { at: '2026-04-09T12:00:00', payload: { score: 1 } },
    ]
    const s = seriesByDay(entries, 14)
    expect(s.length).toBe(2)
    const d8 = s.find((x) => x.dateKey.endsWith('04-08'))
    const d9 = s.find((x) => x.dateKey.endsWith('04-09'))
    expect(d8.average).toBe(3)
    expect(d8.count).toBe(2)
    expect(d9.average).toBe(3)
    expect(d9.count).toBe(2)
  })

  it('seriesByDay ignores invalid scores', () => {
    const s = seriesByDay([{ at: '2026-04-01T12:00:00', payload: { score: 99 } }], 14)
    expect(s).toEqual([])
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
