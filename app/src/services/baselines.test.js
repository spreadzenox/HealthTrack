import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { dailyValues, computeBaseline, computeHeartBaselines, BASELINE_METRICS } from './baselines'

// Jeudi 21 mai 2026, 14 h locale
const NOW = new Date(2026, 4, 21, 14, 0)
const daysAgo = (n, hour = 7) => new Date(2026, 4, 21 - n, hour, 0).toISOString()
const rhr = (n, bpm, hour) => ({
  type: 'heart_rate', at: daysAgo(n, hour), payload: { bpm, unit: 'bpm', subtype: 'restingHeartRate' },
})
const hrv = (n, value) => ({
  type: 'heart_rate', at: daysAgo(n), payload: { value, unit: 'ms', subtype: 'heartRateVariability' },
})

/** 60 jours d'historique alternant base-1 / base+1 (moyenne = base, ET ≈ 1). */
function history(make, base, { from = 7, to = 66 } = {}) {
  const out = []
  for (let n = from; n <= to; n++) out.push(make(n, base + (n % 2 === 0 ? -1 : 1)))
  return out
}

describe('baselines', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  describe('dailyValues', () => {
    it('averages several readings of the same local day and ignores other subtypes', () => {
      const days = dailyValues([
        rhr(0, 60, 6), rhr(0, 64, 22),
        { type: 'heart_rate', at: daysAgo(0), payload: { bpm: 120, subtype: 'heartRate' } },
        { type: 'steps', at: daysAgo(0), payload: { value: 5000 } },
      ], BASELINE_METRICS.restingHeartRate)
      expect(days.size).toBe(1)
      expect([...days.values()][0]).toBe(62)
    })

    it('reads HRV from value or bpm and drops non-positive or absurd readings', () => {
      const days = dailyValues([
        hrv(1, 45),
        { type: 'heart_rate', at: daysAgo(2), payload: { bpm: 50, subtype: 'heartRateVariability' } },
        hrv(3, 0),
        hrv(4, 5000),
      ], BASELINE_METRICS.heartRateVariability)
      expect([...days.values()].sort()).toEqual([45, 50])
    })
  })

  describe('computeBaseline', () => {
    it('is insufficient with less than 14 baseline days', () => {
      const entries = [...history(rhr, 60, { from: 7, to: 15 }), rhr(0, 61), rhr(1, 61), rhr(2, 61)]
      const b = computeBaseline(entries, BASELINE_METRICS.restingHeartRate)
      expect(b.status).toBe('insufficient')
      expect(b.baselineDays).toBe(9)
      expect(b.missingDays).toBe(5)
    })

    it('is insufficient with less than 3 recent days', () => {
      const entries = [...history(rhr, 60), rhr(0, 61), rhr(1, 61)]
      const b = computeBaseline(entries, BASELINE_METRICS.restingHeartRate)
      expect(b.status).toBe('insufficient')
      expect(b.recentDays).toBe(2)
    })

    it('compares the last 7 days to the 60 previous days (recent days excluded from the norm)', () => {
      const entries = [...history(rhr, 60), rhr(0, 60), rhr(1, 61), rhr(2, 59), rhr(3, 60)]
      const b = computeBaseline(entries, BASELINE_METRICS.restingHeartRate)
      expect(b.status).toBe('within')
      expect(b.baselineDays).toBe(60)
      expect(b.recentDays).toBe(4)
      expect(b.recentMean).toBeCloseTo(60, 5)
      expect(b.baselineMean).toBeCloseTo(60, 5)
      expect(b.low).toBeLessThan(60)
      expect(b.high).toBeGreaterThan(60)
      expect(b.latest).toEqual({ value: 60, dateKey: '2026-05-21' })
    })

    it('flags a resting heart rate above the norm as unfavourable', () => {
      const entries = [...history(rhr, 60), rhr(0, 66), rhr(1, 65), rhr(2, 67)]
      const b = computeBaseline(entries, BASELINE_METRICS.restingHeartRate)
      expect(b.status).toBe('above')
      expect(b.favourable).toBe(false)
      expect(b.z).toBeGreaterThan(3)
    })

    it('flags an HRV below the norm as unfavourable and above as favourable', () => {
      const low = computeBaseline(
        [...history(hrv, 50), hrv(0, 35), hrv(1, 36), hrv(2, 34)],
        BASELINE_METRICS.heartRateVariability,
      )
      expect(low.status).toBe('below')
      expect(low.favourable).toBe(false)
      const high = computeBaseline(
        [...history(hrv, 50), hrv(0, 65), hrv(1, 66), hrv(2, 64)],
        BASELINE_METRICS.heartRateVariability,
      )
      expect(high.status).toBe('above')
      expect(high.favourable).toBe(true)
    })

    it('computes the HRV norm on a log scale (asymmetric range around the geometric mean)', () => {
      const b = computeBaseline(
        [...history(hrv, 50), hrv(0, 50), hrv(1, 50), hrv(2, 50)],
        BASELINE_METRICS.heartRateVariability,
      )
      expect(b.status).toBe('within')
      expect(b.high - b.baselineMean).toBeGreaterThan(b.baselineMean - b.low)
    })

    it('keeps a minimum width for a perfectly flat history', () => {
      const flat = []
      for (let n = 7; n <= 40; n++) flat.push(rhr(n, 60))
      const b = computeBaseline([...flat, rhr(0, 61), rhr(1, 61), rhr(2, 61)], BASELINE_METRICS.restingHeartRate)
      expect(b.high - b.low).toBeGreaterThanOrEqual(2)
      expect(b.status).toBe('within')
    })

    it('ignores data older than the 60-day window', () => {
      const entries = [...history(rhr, 60), rhr(80, 200), rhr(0, 60), rhr(1, 60), rhr(2, 60)]
      const b = computeBaseline(entries, BASELINE_METRICS.restingHeartRate)
      expect(b.baselineMean).toBeCloseTo(60, 5)
    })
  })

  it('computeHeartBaselines returns both metrics', () => {
    const res = computeHeartBaselines([...history(rhr, 60), rhr(0, 60), rhr(1, 60), rhr(2, 60)])
    expect(res.map((b) => b.metric.key)).toEqual(['restingHeartRate', 'heartRateVariability'])
    expect(res[0].status).toBe('within')
    expect(res[1].status).toBe('insufficient')
    expect(res[1].baselineDays).toBe(0)
  })
})
