import { describe, it, expect } from 'vitest'
import { buildTrendSeries, periodDates, canAdd, unitsOf } from './trendsData'

const NOW = new Date(2026, 10, 7, 20)
const band = (mean) => ({ mean, low: mean - 0.5, high: mean + 0.5, sd: 0.4 })
const state = (date, { future = false, observed = false } = {}) => ({
  date, future, observed: { wellbeing: observed, digestion: false },
  wellbeing: band(3), digestion: band(3.5), digestionOwn: band(3.6),
})

describe('Tendances (ORG-3)', () => {
  it('Semaine : 7 jours jusqu’à aujourd’hui et 3 jours à venir ; Mois : 30 et 7', () => {
    const w = periodDates('week', NOW)
    expect(w.dates).toHaveLength(10)
    expect(w.dates[6]).toBe('2026-11-07')
    expect(periodDates('month', NOW).dates).toHaveLength(37)
  })

  it('bien-être : chaque jour sa fourchette, plein seulement les jours notés ; l’attendu seulement dans le futur', () => {
    const states = { showDigestiveCurve: false, days: [state('2026-11-05'), state('2026-11-06', { observed: true }), state('2026-11-07'), state('2026-11-08', { future: true })] }
    const r = buildTrendSeries({ states, period: 'week', now: NOW })
    const wb = r.series.wellbeing
    expect(wb.map((p) => p.date)).toEqual(['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
    expect(wb.map((p) => p.observed)).toEqual([false, true, false, false])
    expect(wb.filter((p) => p.future).map((p) => p.date)).toEqual(['2026-11-08'])
    expect(wb[0].low).toBeLessThan(wb[0].value)
    expect(r.available).toContain('wellbeing')
  })

  it('confort digestif : sans courbe validée, seulement les jours notés (information digestive seule)', () => {
    const days = [state('2026-11-06'), { ...state('2026-11-07'), observed: { wellbeing: false, digestion: true } }]
    const r = buildTrendSeries({ states: { showDigestiveCurve: false, days }, period: 'week', now: NOW })
    expect(r.series.digestion.map((p) => p.date)).toEqual(['2026-11-07'])
  })

  it('une mesure n’est proposée qu’à partir de 3 points', () => {
    const days = [5, 6, 7].map((d) => ({ dateKey: `2026-11-0${d}`, summary: { sleepMinutes: 420, steps: d === 7 ? 5000 : null } }))
    const r = buildTrendSeries({ days, period: 'week', now: NOW })
    expect(r.series.sleep.map((p) => p.value)).toEqual([7, 7, 7])
    expect(r.available).toEqual(['sleep'])
  })

  it('un axe par unité, deux au plus', () => {
    expect(unitsOf(['wellbeing', 'digestion'])).toEqual(['/5'])
    expect(canAdd(['wellbeing'], 'sleep')).toBe(true)
    expect(canAdd(['wellbeing', 'sleep'], 'screen')).toBe(true)
    expect(canAdd(['wellbeing', 'sleep'], 'steps')).toBe(false)
  })
})

describe('Vue par défaut de Tendances (correction T1 du 07/11)', () => {
  it('le bien-être d’abord : Semaine s’il a 3 jours, sinon Jour s’il a des lectures ou des notes', async () => {
    const { defaultTrendsView } = await import('./trendsData')
    expect(defaultTrendsView({ available: ['wellbeing', 'steps'], hasWellbeing: true })).toEqual({ period: 'week', keys: ['wellbeing'] })
    expect(defaultTrendsView({ available: ['steps'], hasWellbeing: true })).toEqual({ period: 'day', keys: ['wellbeing'] })
  })
  it('sans bien-être, la première mesure qui a une courbe ; rien : Semaine et aucune mesure', async () => {
    const { defaultTrendsView } = await import('./trendsData')
    expect(defaultTrendsView({ available: ['sleep', 'steps'], hasWellbeing: false })).toEqual({ period: 'week', keys: ['sleep'] })
    expect(defaultTrendsView({ available: [], hasWellbeing: false })).toEqual({ period: 'week', keys: [] })
  })
  it('une demande explicite (?mesure, ?vue=jour) prime', async () => {
    const { defaultTrendsView } = await import('./trendsData')
    expect(defaultTrendsView({ asked: 'digestion', available: ['wellbeing'], hasWellbeing: true })).toEqual({ period: 'week', keys: ['digestion'] })
    expect(defaultTrendsView({ askedDay: true, available: ['wellbeing'], hasWellbeing: true })).toEqual({ period: 'day', keys: ['wellbeing'] })
  })
})
