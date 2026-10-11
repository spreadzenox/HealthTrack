import { describe, it, expect } from 'vitest'
import { computeSleepRegularity, mainSleepPeriods, MIN_NIGHTS, REGULARITY_DAYS } from './sleepRegularity'

// Mercredi 20 mai 2026, 14 h
const NOW = new Date(2026, 4, 20, 14, 0)

/** Nuit qui se termine le jour J-n : coucher à bedH:bedM la veille, lever à wakeH:wakeM. */
function night(n, [bedH, bedM], [wakeH, wakeM], sleepState = 'asleep') {
  const end = new Date(2026, 4, 20 - n, wakeH, wakeM)
  const start = bedH >= 12
    ? new Date(2026, 4, 20 - n - 1, bedH, bedM)
    : new Date(2026, 4, 20 - n, bedH, bedM)
  const minutes = Math.round((end - start) / 60000)
  return { type: 'sleep', at: start.toISOString(), payload: { durationMinutes: minutes, endDate: end.toISOString(), sleepState } }
}

const regularNights = (count = REGULARITY_DAYS) =>
  Array.from({ length: count }, (_, n) => night(n, [23, 0], [7, 0]))

describe('mainSleepPeriods', () => {
  it('keeps one main sleep per wake day, ignoring a shorter afternoon nap', () => {
    const nap = { type: 'sleep', at: new Date(2026, 4, 20, 14, 0).toISOString(), payload: { durationMinutes: 40, endDate: new Date(2026, 4, 20, 14, 40).toISOString() } }
    const periods = mainSleepPeriods([night(0, [23, 30], [7, 0]), nap])
    expect(periods.size).toBe(1)
    const p = periods.get('2026-05-20')
    expect(new Date(p.start).getHours()).toBe(23)
    expect(new Date(p.end).getHours()).toBe(7)
  })

  it('merges sleep stages of the same night, even those ending before midnight', () => {
    const seg = (h1, m1, h2, m2, state, dayOffset1 = -1, dayOffset2 = -1) => ({
      type: 'sleep',
      at: new Date(2026, 4, 20 + dayOffset1, h1, m1).toISOString(),
      payload: {
        durationMinutes: 1, // non utilisé : on se fie aux bornes
        endDate: new Date(2026, 4, 20 + dayOffset2, h2, m2).toISOString(),
        sleepState: state,
      },
    })
    const periods = mainSleepPeriods([
      seg(23, 10, 23, 50, 'light'),
      seg(23, 50, 0, 20, 'awake', -1, 0),
      seg(0, 20, 6, 45, 'deep', 0, 0),
    ])
    expect(periods.size).toBe(1)
    const p = periods.get('2026-05-20')
    expect(new Date(p.start).getHours()).toBe(23)
    expect(new Date(p.start).getMinutes()).toBe(10)
    expect(new Date(p.end).getMinutes()).toBe(45)
  })

  it('ignores out-of-bed and implausible records', () => {
    const outOfBed = { ...night(0, [23, 0], [7, 0]), payload: { ...night(0, [23, 0], [7, 0]).payload, sleepState: 'outOfBed' } }
    const tooShort = night(1, [6, 50], [7, 0])
    expect(mainSleepPeriods([outOfBed, tooShort]).size).toBe(0)
  })
})

describe('computeSleepRegularity', () => {
  it('returns null without any sleep record', () => {
    expect(computeSleepRegularity([], NOW)).toBeNull()
  })

  it('needs at least MIN_NIGHTS nights in the last 14 days', () => {
    const r = computeSleepRegularity(regularNights(MIN_NIGHTS - 2), NOW)
    expect(r.status).toBe('insufficient')
    expect(r.missingNights).toBe(2)
  })

  it('ignores nights older than the 14-day window', () => {
    const old = Array.from({ length: 10 }, (_, i) => night(REGULARITY_DAYS + i, [23, 0], [7, 0]))
    const r = computeSleepRegularity(old, NOW)
    expect(r.status).toBe('insufficient')
    expect(r.nights).toBe(0)
  })

  it('gives typical bedtime / wake time and a near-perfect index for fixed hours', () => {
    const r = computeSleepRegularity(regularNights(), NOW)
    expect(r.status).toBe('ok')
    expect(r.nights).toBe(REGULARITY_DAYS)
    expect(r.bedtime.mean).toBe(23 * 60)
    expect(r.bedtime.sd).toBe(0)
    expect(r.wake.mean).toBe(7 * 60)
    expect(r.sri).toBe(100)
    expect(r.level).toBe('regular')
    expect(r.weekendShift).toBe(0)
  })

  it('averages bedtimes across midnight correctly (23:30 and 00:30 → 00:00)', () => {
    const nights = Array.from({ length: 10 }, (_, n) =>
      n % 2 === 0 ? night(n, [23, 30], [7, 0]) : night(n, [0, 30], [7, 0]),
    )
    const r = computeSleepRegularity(nights, NOW)
    expect(r.bedtime.mean).toBe(0)
    expect(r.bedtime.sd).toBeGreaterThan(25)
    expect(r.bedtime.sd).toBeLessThan(35)
  })

  it('flags variable hours and a lower index when bedtimes swing by 2 h', () => {
    const nights = Array.from({ length: REGULARITY_DAYS }, (_, n) =>
      n % 2 === 0 ? night(n, [22, 0], [6, 0]) : night(n, [0, 30], [8, 30]),
    )
    const r = computeSleepRegularity(nights, NOW)
    expect(r.level).toBe('variable')
    expect(r.sri).toBeLessThan(85)
    expect(r.sri).toBeGreaterThan(0)
  })

  it('computes the index only on consecutive recorded nights', () => {
    // Une nuit sur deux seulement : aucune paire de jours consécutifs → pas d'indice
    const nights = [0, 2, 4, 6, 8, 10, 12].map((n) => night(n, [23, 0], [7, 0]))
    const r = computeSleepRegularity(nights, NOW)
    expect(r.status).toBe('ok')
    expect(r.sri).toBeNull()
  })

  it('measures the weekend shift of mid-sleep (social jet lag)', () => {
    // Week-end (réveil samedi / dimanche) : coucher 1 h plus tard et lever 2 h plus tard → milieu +1 h 30
    const nights = Array.from({ length: REGULARITY_DAYS }, (_, n) => {
      const wakeDay = new Date(2026, 4, 20 - n).getDay()
      const weekend = wakeDay === 0 || wakeDay === 6
      return weekend ? night(n, [0, 0], [9, 0]) : night(n, [23, 0], [7, 0])
    })
    const r = computeSleepRegularity(nights, NOW)
    expect(r.weekendShift).toBe(90)
  })

  it('leaves the weekend shift unknown without at least 2 weekend nights', () => {
    // J-0..J-2 : mercredi, mardi, lundi ; J-3 dimanche ; J-4 samedi → on prend 0..3 + 5..8
    const nights = [0, 1, 2, 3, 5, 6, 7, 8].map((n) => night(n, [23, 0], [7, 0]))
    const r = computeSleepRegularity(nights, NOW)
    expect(r.status).toBe('ok')
    expect(r.weekendShift).toBeNull()
  })
})
