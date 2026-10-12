import { describe, it, expect } from 'vitest'
import { computeMoodEstimate, MOOD_NORM_DAYS, MIN_NORM_DAYS, MIN_CALIBRATION_DAYS } from './moodEstimate'
import { localDateKey } from './wellbeingSeries'

const NOW = new Date(2026, 4, 21, 14, 0)
const dayAt = (n, h = 7, m = 0) => new Date(2026, 4, 21 - n, h, m).toISOString()
const keyOf = (n) => localDateKey(dayAt(n, 12))

const rhr = (n, bpm) => ({ type: 'heart_rate', at: dayAt(n), payload: { bpm, subtype: 'restingHeartRate' } })
const hrv = (n, value) => ({ type: 'heart_rate', at: dayAt(n, 6, 30), payload: { value, subtype: 'heartRateVariability' } })
const steps = (n, value) => ({ type: 'steps', at: dayAt(n, 18), payload: { value } })
const wellbeing = (n, score) => ({ type: 'wellbeing', at: dayAt(n, 20), payload: { score } })
const sleep = (n, minutes) => {
  const end = new Date(2026, 4, 21 - n, 7, 0)
  const start = new Date(end.getTime() - minutes * 60000)
  return { type: 'sleep', at: start.toISOString(), payload: { durationMinutes: minutes, endDate: end.toISOString(), sleepState: 'asleep' } }
}

/** Journées habituelles de J-from à J-to : FC 60 ± 1, VFC 50 ± 2, sommeil 450 ± 20 min, pas 8 000 ± 1 000. */
function usualDays(from, to) {
  const out = []
  for (let n = from; n <= to; n++) {
    const odd = n % 2 === 0 ? -1 : 1
    out.push(rhr(n, 60 + odd), hrv(n, 50 + 2 * odd), sleep(n, 450 + 20 * odd), steps(n, 8000 + 1000 * odd))
  }
  return out
}

/** Générateur pseudo-aléatoire déterministe (LCG) dans [-1, 1]. */
function noise(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return (s / 2147483648) * 2 - 1
  }
}

describe('computeMoodEstimate', () => {
  it('needs a few weeks of measurements before estimating', () => {
    const r = computeMoodEstimate(usualDays(0, 4), NOW)
    expect(r.status).toBe('insufficient')
    expect(r.measuredDays).toBe(5)
    expect(r.neededDays).toBe(MIN_NORM_DAYS + 1)
  })

  it('says nothing without any measurement', () => {
    expect(computeMoodEstimate([], NOW).status).toBe('empty')
    expect(computeMoodEstimate([wellbeing(0, 3)], NOW).status).toBe('empty')
  })

  it('is within the usual range on a usual day', () => {
    const r = computeMoodEstimate(usualDays(0, MOOD_NORM_DAYS + 5), NOW)
    expect(r.status).toBe('ok')
    expect(r.dateKey).toBe(keyOf(0))
    expect(r.band).toBe('within')
    expect(Math.abs(r.index)).toBeLessThan(0.5)
    expect(r.signals.map((s) => s.key).sort()).toEqual(['heartRateVariability', 'restingHeartRate', 'sleepMinutes', 'steps'].sort())
  })

  it('is below the usual range when sleep, HRV and resting HR all deviate unfavourably', () => {
    const entries = [...usualDays(1, MOOD_NORM_DAYS + 5), rhr(0, 68), hrv(0, 35), sleep(0, 330)]
    const r = computeMoodEstimate(entries, NOW)
    expect(r.band).toBe('below')
    const bySignal = Object.fromEntries(r.signals.map((s) => [s.key, s]))
    expect(bySignal.sleepMinutes.score).toBeLessThan(-1)
    expect(bySignal.restingHeartRate.score).toBeLessThan(-1) // une FC haute est défavorable
    expect(bySignal.sleepMinutes.value).toBe(330)
    expect(bySignal.sleepMinutes.typical).toBeCloseTo(450, -1)
  })

  it('uses the steps of the previous (complete) day, not the partial count of today', () => {
    const base = usualDays(2, MOOD_NORM_DAYS + 5)
    const today = [rhr(0, 60), hrv(0, 50), sleep(0, 450), steps(0, 300)]
    const lazyYesterday = computeMoodEstimate([...base, rhr(1, 60), hrv(1, 50), sleep(1, 450), steps(1, 1500), ...today], NOW)
    const s = lazyYesterday.signals.find((x) => x.key === 'steps')
    expect(s.value).toBe(1500)
    expect(s.score).toBeLessThan(-1)
  })

  it('treats a day without the watch as unknown, not as a bad day', () => {
    const entries = [...usualDays(1, MOOD_NORM_DAYS + 5), sleep(0, 450)] // ni FC ni VFC aujourd'hui
    const r = computeMoodEstimate(entries, NOW)
    // un seul signal aujourd'hui (le sommeil ; les pas d'hier comptent aussi) → estimation sur 2 signaux
    expect(r.status).toBe('ok')
    expect(r.signals.map((s) => s.key).sort()).toEqual(['sleepMinutes', 'steps'])
    expect(r.band).toBe('within')
  })

  it('falls back to yesterday when today has fewer than two signals, and becomes stale after that', () => {
    const entries = usualDays(1, MOOD_NORM_DAYS + 5)
    const r = computeMoodEstimate(entries, NOW)
    // aujourd'hui : seulement les pas d'hier → pas assez ; on montre hier
    expect(r.dateKey).toBe(keyOf(1))
    const old = computeMoodEstimate(usualDays(4, MOOD_NORM_DAYS + 8), NOW)
    expect(old.status).toBe('stale')
  })

  it('stays uncalibrated with fewer than 14 check-ins', () => {
    const entries = [...usualDays(0, MOOD_NORM_DAYS + 20)]
    for (let n = 0; n < MIN_CALIBRATION_DAYS - 1; n++) entries.push(wellbeing(n, 3))
    const r = computeMoodEstimate(entries, NOW)
    expect(r.calibrated).toBe(false)
    expect(r.checkInDays).toBe(MIN_CALIBRATION_DAYS - 1)
    expect(r.estimate).toBeUndefined()
  })

  it('learns from check-ins which signal follows the mood and gives a range', () => {
    const rnd = noise(7)
    const entries = []
    const total = MOOD_NORM_DAYS + 45
    for (let n = 0; n <= total; n++) {
      const sleepMin = 450 + 60 * rnd()
      entries.push(rhr(n, 60 + rnd()), hrv(n, 50 + 3 * rnd()), sleep(n, sleepMin), steps(n, 8000 + 1500 * rnd()))
      // Le bien-être suit le sommeil de la nuit (+1 point par heure), plus un peu de bruit
      if (n < 45) entries.push(wellbeing(n, Math.min(5, Math.max(0, 3 + (sleepMin - 450) / 60 + 0.2 * rnd()))))
    }
    const r = computeMoodEstimate(entries, NOW)
    expect(r.calibrated).toBe(true)
    expect(r.checkInDays).toBeGreaterThanOrEqual(MIN_CALIBRATION_DAYS)
    expect(r.topSignals[0]).toBe('sleepMinutes')
    expect(r.low).toBeLessThan(r.estimate)
    expect(r.high).toBeGreaterThan(r.estimate)
    expect(r.estimate).toBeGreaterThanOrEqual(0)
    expect(r.estimate).toBeLessThanOrEqual(5)
    expect(r.high - r.low).toBeLessThan(1.5)
  })

  it('refuses the calibration when check-ins do not follow the signals', () => {
    const rnd = noise(3)
    const rnd2 = noise(99)
    const entries = []
    for (let n = 0; n <= MOOD_NORM_DAYS + 45; n++) {
      entries.push(rhr(n, 60 + rnd()), hrv(n, 50 + 3 * rnd()), sleep(n, 450 + 60 * rnd()), steps(n, 8000 + 1500 * rnd()))
      if (n < 45) entries.push(wellbeing(n, 2.5 + 2 * rnd2()))
    }
    const r = computeMoodEstimate(entries, NOW)
    expect(r.checkInDays).toBeGreaterThanOrEqual(MIN_CALIBRATION_DAYS)
    expect(r.calibrated).toBe(false)
  })

  it('flags a persistently low estimate (about two weeks) for a gentle suggestion', () => {
    const entries = usualDays(16, MOOD_NORM_DAYS + 40)
    for (let n = 0; n < 16; n++) entries.push(rhr(n, 67), hrv(n, 38), sleep(n, 340), steps(n, 3000))
    const r = computeMoodEstimate(entries, NOW)
    expect(r.band).toBe('below')
    expect(r.persistentLow).toBe(true)

    const short = usualDays(3, MOOD_NORM_DAYS + 40)
    for (let n = 0; n < 3; n++) short.push(rhr(n, 67), hrv(n, 38), sleep(n, 340), steps(n, 3000))
    expect(computeMoodEstimate(short, NOW).persistentLow).toBe(false)
  })

  it('includes late screen time from the phone as a signal', () => {
    const entries = usualDays(0, MOOD_NORM_DAYS + 5)
    for (let n = 0; n <= MOOD_NORM_DAYS + 5; n++) {
      entries.push({ type: 'phone_usage', at: dayAt(n, 23, 59), payload: { date: keyOf(n), lateScreenMinutes: n === 0 ? 150 : 20 + (n % 3) * 5 } })
    }
    const r = computeMoodEstimate(entries, NOW)
    const late = r.signals.find((s) => s.key === 'screenLateMinutes')
    expect(late.value).toBe(150)
    expect(late.score).toBeLessThan(-1)
  })
})
