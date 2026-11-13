import { describe, it, expect } from 'vitest'
import { iosBaselineMetrics, SDNN_BASELINE } from './sdnnBaseline'
import { BASELINE_METRICS, computeBaseline } from '../services/baselines'

const NOW = new Date(2026, 9, 28, 14, 0)
const daysAgo = (n) => new Date(2026, 9, 28 - n, 7, 0).toISOString()
const sdnn = (n, value) => ({ type: 'heart_rate', at: daysAgo(n), payload: { value, subtype: 'heartRateVariabilitySdnn' } })
const rmssd = (n, value) => ({ type: 'heart_rate', at: daysAgo(n), payload: { value, subtype: 'heartRateVariability' } })
const history = (make, base) => Array.from({ length: 60 }, (_, i) => make(i + 7, base + (i % 2 ? -2 : 2)))

// Sur iPhone, la VFC de l'app Santé est une SDNN : sa norme personnelle se calcule à part de la RMSSD d'Android,
// avec la même méthode (échelle log), seulement dans la variante appstore.
describe('norme personnelle de la VFC SDNN (iPhone)', () => {
  it('seulement dans la variante appstore', () => {
    expect(iosBaselineMetrics('play')).toEqual([])
    expect(iosBaselineMetrics('sideload')).toEqual([])
    expect(iosBaselineMetrics('appstore')).toEqual([SDNN_BASELINE])
  })

  it('même méthode que la VFC d’Android, sous son propre nom', () => {
    expect(SDNN_BASELINE).toMatchObject({ key: 'heartRateVariabilitySdnn', label: 'VFC (SDNN)', unit: 'ms', log: true })
    expect(SDNN_BASELINE.generalHigherIsBetter).toBe(BASELINE_METRICS.heartRateVariability.generalHigherIsBetter)
    expect(SDNN_BASELINE.plausible).toEqual(BASELINE_METRICS.heartRateVariability.plausible)
  })

  it('norme calculée sur la SDNN seulement, jamais mêlée à la RMSSD', () => {
    const entries = [...history(sdnn, 45), sdnn(0, 45), sdnn(1, 44), sdnn(2, 46), ...history(rmssd, 80), rmssd(0, 80)]
    const b = computeBaseline(entries, SDNN_BASELINE, NOW)
    expect(b.status).toBe('within')
    expect(b.recentDays).toBe(3)
    expect(b.baselineMean).toBeGreaterThan(40)
    expect(b.baselineMean).toBeLessThan(50)
    const onlyRmssd = computeBaseline([...history(rmssd, 80), rmssd(0, 80)], SDNN_BASELINE, NOW)
    expect(onlyRmssd.recentDays + onlyRmssd.baselineDays).toBe(0)
  })
})
