import { describe, it, expect } from 'vitest'
import { computeRadar, nightlySleep, RADAR_DAYS } from './radar'
import { localDateKey } from './wellbeingSeries'

const NOW = new Date(2026, 4, 21, 14, 0)
const dayAt = (n, h = 7, m = 0) => new Date(2026, 4, 21 - n, h, m).toISOString()

const rhr = (n, bpm) => ({ type: 'heart_rate', at: dayAt(n), payload: { bpm, subtype: 'restingHeartRate' } })
const hrv = (n, value) => ({ type: 'heart_rate', at: dayAt(n, 6, 30), payload: { value, subtype: 'heartRateVariability' } })
// Nuit qui se termine le jour J-n à 7 h
const sleep = (n, minutes, sleepState = 'asleep') => {
  const end = new Date(2026, 4, 21 - n, 7, 0)
  const start = new Date(end.getTime() - minutes * 60000)
  return { type: 'sleep', at: start.toISOString(), payload: { durationMinutes: minutes, endDate: end.toISOString(), sleepState } }
}

/** 60 jours de norme stable (J-3 … J-62) : FC 60 ± 1, VFC 50 ± 2, sommeil 450 ± 20 min */
function normalHistory() {
  const out = []
  for (let n = RADAR_DAYS; n < RADAR_DAYS + 60; n++) {
    const odd = n % 2 === 0 ? -1 : 1
    out.push(rhr(n, 60 + odd), hrv(n, 50 + 2 * odd), sleep(n, 450 + 20 * odd))
  }
  return out
}

function recent(days) {
  // days : [{ n, rhr, hrv, sleep }]
  return days.flatMap((d) => [
    d.rhr != null && rhr(d.n, d.rhr),
    d.hrv != null && hrv(d.n, d.hrv),
    d.sleep != null && sleep(d.n, d.sleep),
  ].filter(Boolean))
}

describe('nightlySleep', () => {
  it('attributes a night to the local day it ends on', () => {
    const nights = nightlySleep([sleep(1, 420)])
    expect([...nights.entries()]).toEqual([[localDateKey(new Date(2026, 4, 20, 12).toISOString()), 420]])
  })

  it('sums the stages of one night and ignores awake time', () => {
    const end = new Date(2026, 4, 20, 7, 0)
    const seg = (startMin, minutes, sleepState) => ({
      type: 'sleep',
      at: new Date(end.getTime() - startMin * 60000).toISOString(),
      payload: { durationMinutes: minutes, sleepState, endDate: new Date(end.getTime() - (startMin - minutes) * 60000).toISOString() },
    })
    const nights = nightlySleep([seg(480, 200, 'light'), seg(280, 20, 'awake'), seg(260, 120, 'deep'), seg(140, 140, 'rem')])
    expect([...nights.values()]).toEqual([460])
  })

  it('does not double-count an "in bed" session when stages are present', () => {
    const nights = nightlySleep([sleep(1, 480, 'inBed'), sleep(1, 300, 'light'), sleep(1, 120, 'deep')])
    expect([...nights.values()]).toEqual([420])
  })

  it('falls back to the "in bed" time when it is the only record of the night', () => {
    expect([...nightlySleep([sleep(1, 480, 'inBed')]).values()]).toEqual([480])
  })
})

describe('computeRadar', () => {
  it('is insufficient without enough history', () => {
    const r = computeRadar(recent([{ n: 0, rhr: 70, hrv: 30, sleep: 300 }]), NOW)
    expect(r.level).toBe('insufficient')
  })

  it('stays calm when the last days are within the norm', () => {
    const r = computeRadar([...normalHistory(), ...recent([
      { n: 0, rhr: 61, hrv: 49, sleep: 440 },
      { n: 1, rhr: 60, hrv: 51, sleep: 460 },
      { n: 2, rhr: 59, hrv: 50, sleep: 450 },
    ])], NOW)
    expect(r.level).toBe('calm')
    expect(r.metricsChecked.map((m) => m.key)).toEqual(['restingHeartRate', 'heartRateVariability', 'sleepMinutes'])
  })

  it('stays calm with a single unusual metric (one bad night is common)', () => {
    const r = computeRadar([...normalHistory(), ...recent([
      { n: 0, rhr: 60, hrv: 50, sleep: 300 },
      { n: 1, rhr: 60, hrv: 50, sleep: 450 },
    ])], NOW)
    expect(r.level).toBe('calm')
  })

  it('watches when two metrics are off on the latest day only', () => {
    const r = computeRadar([...normalHistory(), ...recent([
      { n: 0, rhr: 66, hrv: 40, sleep: 450 },
      { n: 1, rhr: 60, hrv: 50, sleep: 450 },
    ])], NOW)
    expect(r.level).toBe('watch')
    expect(r.streak).toBe(1)
    expect(r.signals.map((s) => s.metric.key)).toEqual(['restingHeartRate', 'heartRateVariability'])
    const hr = r.signals[0]
    expect(hr.value).toBe(66)
    expect(hr.typical).toBeCloseTo(60, 0)
  })

  it('raises an alert when several metrics are off for 2 days in a row', () => {
    const r = computeRadar([...normalHistory(), ...recent([
      { n: 0, rhr: 67, hrv: 38, sleep: 380 },
      { n: 1, rhr: 66, hrv: 40, sleep: 450 },
    ])], NOW)
    expect(r.level).toBe('alert')
    expect(r.streak).toBe(2)
    expect(r.signals.map((s) => s.metric.key)).toEqual(['restingHeartRate', 'heartRateVariability', 'sleepMinutes'])
  })

  it('does not alert on favourable deviations (lower HR, higher HRV, longer sleep)', () => {
    const r = computeRadar([...normalHistory(), ...recent([
      { n: 0, rhr: 54, hrv: 65, sleep: 560 },
      { n: 1, rhr: 54, hrv: 65, sleep: 560 },
    ])], NOW)
    expect(r.level).toBe('calm')
  })

  it('judges the most recent day with at least two measured metrics (today may not be synced yet)', () => {
    const r = computeRadar([...normalHistory(), ...recent([
      { n: 0, sleep: 450 },
      { n: 1, rhr: 67, hrv: 38, sleep: 450 },
      { n: 2, rhr: 66, hrv: 40, sleep: 450 },
    ])], NOW)
    expect(r.level).toBe('alert')
    expect(r.dateKey).toBe(localDateKey(new Date(2026, 4, 20, 12).toISOString()))
  })

  it('returns to calm once the latest day is back to normal', () => {
    const r = computeRadar([...normalHistory(), ...recent([
      { n: 0, rhr: 60, hrv: 50, sleep: 450 },
      { n: 1, rhr: 67, hrv: 38, sleep: 450 },
      { n: 2, rhr: 66, hrv: 40, sleep: 450 },
    ])], NOW)
    expect(r.level).toBe('calm')
  })

  it('reports stale data when nothing was measured in the last days', () => {
    const r = computeRadar(normalHistory(), NOW)
    expect(r.level).toBe('stale')
  })

  it('works with heart data only when sleep is not tracked', () => {
    const hist = normalHistory().filter((e) => e.type !== 'sleep')
    const r = computeRadar([...hist, ...recent([{ n: 0, rhr: 67, hrv: 38 }])], NOW)
    expect(r.level).toBe('watch')
    expect(r.metricsChecked.map((m) => m.key)).toEqual(['restingHeartRate', 'heartRateVariability'])
  })

  it('ignores a high resting HR when only one metric has a norm', () => {
    const hist = normalHistory().filter((e) => e.payload.subtype === 'restingHeartRate')
    const r = computeRadar([...hist, ...recent([{ n: 0, rhr: 75 }])], NOW)
    expect(r.level).toBe('insufficient')
  })
})
