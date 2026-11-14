import { describe, it, expect } from 'vitest'
import { buildTrendSeries, trendMeasure, unitsOf } from './trendsData'

// Version iOS (HealthTrack-iOS), correctif 56 : la VFC de l'app Santé (SDNN) a sa propre courbe dans Journal ›
// Tendances ; sans elle, un iPhone avec une Apple Watch n'avait aucune courbe de VFC. Jamais mêlée à la RMSSD.
const now = new Date('2026-11-09T10:00:00')
const day = (dateKey, summary) => ({ dateKey, summary })

describe('Tendances : VFC en SDNN (iPhone)', () => {
  it('trois jours de SDNN font une courbe « Variabilité cardiaque (SDNN) », rose, en ms', () => {
    const days = [day('2026-11-06', { hrvSdnn: 48 }), day('2026-11-07', { hrvSdnn: 52 }), day('2026-11-08', { hrvSdnn: 50.6 })]
    const { series, available } = buildTrendSeries({ days, period: 'week', now })
    expect(available).toContain('hrvSdnn')
    expect(available).not.toContain('hrv')
    expect(series.hrvSdnn.map((p) => p.value)).toEqual([48, 52, 50.6])
    const m = trendMeasure('hrvSdnn')
    expect(m.label).toBe('Variabilité cardiaque (SDNN)')
    expect(m.tone).toBe(trendMeasure('hrv').tone)
    expect(m.fmt(50.6)).toBe('51 ms')
    expect(m.gloss).toMatch(/app Santé/)
    expect(unitsOf(['hrvSdnn', 'hrv'])).toEqual(['ms'])
  })

  it('sans SDNN, pas de courbe proposée', () => {
    const days = [day('2026-11-07', { hrv: 40 }), day('2026-11-08', { hrv: 42 })]
    expect(buildTrendSeries({ days, period: 'week', now }).available).not.toContain('hrvSdnn')
  })
})
