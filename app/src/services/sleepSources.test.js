import { describe, it, expect } from 'vitest'
import { oneSleepSourcePerNight } from './sleepSources'
import { nightlySleep } from './radar'
import { buildDailyJournal } from './dailyJournal'

const MIN = 60000
// Nuit synthétique : phases de `stages` (minutes) à partir de `start`, une entrée par phase.
function night(start, stages, source, sourceName) {
  let t = new Date(start).getTime()
  return stages.map(([state, mins]) => {
    const at = new Date(t).toISOString()
    t += mins * MIN
    return { type: 'sleep', source, at, payload: { durationMinutes: mins, sleepState: state, endDate: new Date(t).toISOString(), ...(sourceName ? { sourceName } : {}) } }
  })
}
const WATCH = (start) => night(start, [['light', 120], ['deep', 90], ['rem', 60], ['awake', 10], ['light', 150]], 'huawei_watch')
const HC = (start, name = 'Samsung Health') => night(start, [['light', 130], ['deep', 80], ['rem', 70], ['light', 140]], 'health_connect', name)

describe('oneSleepSourcePerNight (POL-PLAY-59)', () => {
  it('une nuit lue par la montre et par Health Connect compte une fois : 7 h, pas 14 h', () => {
    const entries = [...WATCH('2026-10-07T23:00:00'), ...HC('2026-10-07T23:05:00')]
    expect(nightlySleep(entries).get('2026-10-08')).toBe(420)
    const [day] = buildDailyJournal(entries)
    expect(day.summary.sleepMinutes).toBe(420)
  })

  it('à égalité de durée et de phases, la montre Huawei est gardée', () => {
    const watch = night('2026-10-07T23:00:00', [['light', 200], ['deep', 100]], 'huawei_watch')
    const hc = night('2026-10-07T23:00:00', [['light', 200], ['deep', 100]], 'health_connect', 'Health Sync')
    const kept = oneSleepSourcePerNight([...hc, ...watch])
    expect(kept.every((e) => e.source === 'huawei_watch')).toBe(true)
  })

  it('une source avec des phases l’emporte sur une durée « endormi » plus longue', () => {
    const plain = [{ type: 'sleep', source: 'health_connect', at: '2026-10-07T22:00:00', payload: { durationMinutes: 540, sleepState: 'asleep', endDate: '2026-10-08T07:00:00', sourceName: 'Sleep as Android' } }]
    const entries = [...plain, ...HC('2026-10-07T23:00:00')]
    expect(nightlySleep(entries).get('2026-10-08')).toBe(420)
  })

  it('deux apps Health Connect sur la même nuit sont deux sources', () => {
    const entries = [...HC('2026-10-07T23:00:00', 'Samsung Health'), ...HC('2026-10-07T23:00:00', 'Fitbit')]
    expect(nightlySleep(entries).get('2026-10-08')).toBe(420)
  })

  it('une seule source : inchangé ; deux sources sur deux nuits : deux nuits', () => {
    const single = WATCH('2026-10-07T23:00:00')
    expect(oneSleepSourcePerNight(single)).toBe(single)
    const two = [...WATCH('2026-10-07T23:00:00'), ...HC('2026-10-08T23:00:00')]
    expect([...nightlySleep(two)]).toEqual([['2026-10-08', 420], ['2026-10-09', 420]])
  })

  it('la sieste reste exclue et n’entre pas dans le choix ; les autres entrées passent', () => {
    const nap = { type: 'sleep', source: 'health_connect', at: '2026-10-08T14:00:00', payload: { durationMinutes: 30, sleepState: 'light', nap: true, endDate: '2026-10-08T14:30:00' } }
    const steps = { type: 'steps', source: 'health_connect', at: '2026-10-08T10:00:00', payload: { value: 500 } }
    const entries = [...WATCH('2026-10-07T23:00:00'), nap, steps]
    expect(oneSleepSourcePerNight(entries)).toBe(entries)
    expect(nightlySleep(entries).get('2026-10-08')).toBe(420)
  })

  it('n’efface rien : les entrées d’origine restent intactes', () => {
    const entries = [...WATCH('2026-10-07T23:00:00'), ...HC('2026-10-07T23:05:00')]
    const n = entries.length
    oneSleepSourcePerNight(entries)
    expect(entries).toHaveLength(n)
  })
})
