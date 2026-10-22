import { describe, it, expect } from 'vitest'
import { isDaytimeHrv } from './hrv'
import { buildDailyJournal } from './dailyJournal'
import { BASELINE_METRICS, dailyValues } from './baselines'
import { measureTiles } from './today'
import { buildDailyDataset } from './analysisEngine'

const night = { type: 'heart_rate', source: 'huawei_watch', at: '2026-10-22T05:30:15.000Z', payload: { value: 44, unit: 'ms', subtype: 'heartRateVariability', during: 'sleep' } }
const day1 = { type: 'heart_rate', source: 'huawei_watch', at: '2026-10-22T09:03:35.000Z', payload: { value: 30, unit: 'ms', subtype: 'heartRateVariability', during: 'day' } }
const day2 = { ...day1, at: '2026-10-22T15:03:35.000Z', payload: { ...day1.payload, value: 41 } }

describe('VFC de journée (M2) : jamais mêlée à la VFC de la nuit', () => {
  it('reconnaît la VFC de journée', () => {
    expect(isDaytimeHrv(day1.payload)).toBe(true)
    expect(isDaytimeHrv(night.payload)).toBe(false)
    expect(isDaytimeHrv({ subtype: 'heartRateVariability' })).toBe(false) // Health Connect : sans moment précisé
  })
  it('journal : « VFC » reste celle de la nuit, la journée a sa moyenne à part', () => {
    const [d] = buildDailyJournal([night, day1, day2])
    expect(d.summary.hrv).toBe(44)
    expect(d.summary.hrvDay).toBe(36)
    expect(d.summary.hrvDayCount).toBe(2)
  })
  it('normes et Radar : seulement la VFC de la nuit', () => {
    expect([...dailyValues([night, day1, day2], BASELINE_METRICS.heartRateVariability).values()]).toEqual([44])
  })
  it('tuile VFC de l’accueil : la source vient de la nuit seulement', () => {
    const tiles = measureTiles({ hrv: 44 }, [day1], new Date('2026-10-22T16:00:00Z'))
    expect(tiles.find((t) => t.key === 'hrv').sources).toEqual([])
  })
  it('analyses : la VFC du jour (facteur) ne compte que la nuit', () => {
    const rows = buildDailyDataset([night, day1, day2], { includeDaysWithoutWellbeing: true })
    expect(rows.find((r) => r.hrv_ms > 0)?.hrv_ms).toBe(44)
  })
})
