import { describe, it, expect } from 'vitest'
import { oneSourcePerWorkout } from './workoutSources'
import { buildDailyJournal } from './dailyJournal'
import { buildDailyDataset } from './analysisEngine'

const watch = (start, minutes, extra = {}) => ({
  type: 'activity',
  source: 'huawei_watch',
  at: start,
  payload: {
    workoutType: 'running',
    durationSeconds: minutes * 60,
    totalCalories: 300,
    endDate: new Date(Date.parse(start) + minutes * 60_000).toISOString(),
    ...extra,
  },
})
const hc = (start, minutes, sourceName = 'com.sec.android.app.shealth', extra = {}) => ({
  type: 'activity',
  source: 'health_connect',
  at: start,
  payload: {
    workoutType: 'running',
    durationSeconds: minutes * 60,
    totalCalories: 310,
    endDate: new Date(Date.parse(start) + minutes * 60_000).toISOString(),
    sourceName,
    connector: 'health_connect',
    ...extra,
  },
})

describe('oneSourcePerWorkout', () => {
  it('une séance vue par la montre et par Health Connect ne compte qu’une fois', () => {
    const out = oneSourcePerWorkout([watch('2026-10-20T17:00:00Z', 45), hc('2026-10-20T17:01:00Z', 44)])
    expect(out).toHaveLength(1)
  })

  it('garde la source qui a la fréquence cardiaque, puis la montre à égalité', () => {
    const withHr = hc('2026-10-20T17:00:00Z', 45, 'com.garmin', { avgHeartRate: 142 })
    expect(oneSourcePerWorkout([watch('2026-10-20T17:00:00Z', 45), withHr])).toEqual([withHr])
    const w = watch('2026-10-20T17:00:00Z', 45)
    expect(oneSourcePerWorkout([hc('2026-10-20T17:00:00Z', 45), w])).toEqual([w])
  })

  it('deux séances qui ne se chevauchent pas, ou à peine, restent deux séances', () => {
    const morning = watch('2026-10-20T07:00:00Z', 30)
    const evening = hc('2026-10-20T18:00:00Z', 30)
    expect(oneSourcePerWorkout([morning, evening])).toHaveLength(2)
    // 5 min de chevauchement sur 40 : deux séances qui se suivent
    expect(oneSourcePerWorkout([watch('2026-10-20T17:00:00Z', 40), hc('2026-10-20T17:35:00Z', 40)])).toHaveLength(2)
  })

  it('deux apps de Health Connect sont deux sources ; une même source n’est jamais dédoublonnée', () => {
    expect(oneSourcePerWorkout([hc('2026-10-20T17:00:00Z', 45, 'a'), hc('2026-10-20T17:00:00Z', 45, 'b')])).toHaveLength(1)
    expect(oneSourcePerWorkout([watch('2026-10-20T17:00:00Z', 45), watch('2026-10-20T17:10:00Z', 45)])).toHaveLength(2)
  })

  it('ne touche à rien d’autre (autres types, séances sans durée)', () => {
    const steps = { type: 'steps', source: 'huawei_watch', at: '2026-10-20T17:00:00Z', payload: { value: 100 } }
    const noDuration = { type: 'activity', source: 'health_connect', at: '2026-10-20T17:00:00Z', payload: {} }
    const list = [steps, noDuration, watch('2026-10-20T17:00:00Z', 45)]
    expect(oneSourcePerWorkout(list)).toEqual(list)
  })

  it('Journal et analyses : une séance et ses calories comptées une fois', () => {
    const entries = [
      watch('2026-10-20T17:00:00Z', 45),
      hc('2026-10-20T17:00:00Z', 45),
      { type: 'wellbeing', source: 'manual', at: '2026-10-20T20:00:00Z', payload: { score: 4 } },
    ]
    const [day] = buildDailyJournal(entries)
    expect(day.items.filter((e) => e.type === 'activity')).toHaveLength(1)
    const [row] = buildDailyDataset(entries)
    expect(row.activityCalories).toBe(300)
  })
})
