import { describe, it, expect, vi } from 'vitest'
import { radarHrvMetric, SDNN_BASELINE } from './sdnnBaseline'
import { BASELINE_METRICS } from '../services/baselines'

vi.mock('../config/distribution', async (importOriginal) => ({ ...(await importOriginal()), DISTRIBUTION: 'appstore' }))

const { computeRadar } = await import('../services/radar')

const NOW = new Date(2026, 9, 28, 14, 0)
const daysAgo = (n) => new Date(2026, 9, 28 - n, 7, 0).toISOString()
const sdnn = (n, value) => ({ type: 'heart_rate', at: daysAgo(n), payload: { value, subtype: 'heartRateVariabilitySdnn' } })
const rhr = (n, bpm) => ({ type: 'heart_rate', at: daysAgo(n), payload: { bpm, subtype: 'restingHeartRate' } })

// Sur iPhone, l'axe « VFC » du radar suit la VFC de l'app Santé (SDNN) : chaque valeur est comparée à la norme de
// la personne, la méthode vaut donc aussi pour la SDNN ; jamais mêlée à la RMSSD d'Android.
describe('radar sur iPhone : axe VFC sur la SDNN', () => {
  it('SDNN dans la variante appstore, RMSSD ailleurs', () => {
    expect(radarHrvMetric('appstore')).toBe(SDNN_BASELINE)
    expect(radarHrvMetric('play')).toBe(BASELINE_METRICS.heartRateVariability)
  })

  it('une SDNN nettement plus basse que d’habitude est relevée sur l’axe VFC (avec la FC repos, 2 mesures au moins)', () => {
    const history = Array.from({ length: 40 }, (_, i) => [sdnn(i + 3, 50 + (i % 2 ? -2 : 2)), rhr(i + 3, 60 + (i % 2 ? -1 : 1))]).flat()
    const recent = [0, 1, 2].flatMap((n) => [sdnn(n, 20), rhr(n, 70)])
    const radar = computeRadar([...history, ...recent], NOW)
    expect(radar.metricsChecked.map((m) => m.key)).toContain('heartRateVariability')
    expect(radar.signals.some((s) => s.metric.key === 'heartRateVariability' && s.direction === 'below')).toBe(true)
  })
})
