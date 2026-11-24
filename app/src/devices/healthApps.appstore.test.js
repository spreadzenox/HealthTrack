import { describe, it, expect } from 'vitest'
import { METRICS, metricKey, missingWatchMetrics, sourceCoverage } from './healthApps'

// Sur iPhone, la VFC de l'app Santé (SDNN) est rangée à part de la RMSSD d'Android (heartRateVariabilitySdnn,
// correctif 08) : « Mes appareils » doit la compter parmi les mesures d'une source, sous son propre nom.
describe('« qui envoie quoi » avec la VFC de l’app Santé (SDNN, iPhone)', () => {
  it('VFC SDNN suivie à part, juste après la VFC', () => {
    const keys = METRICS.map((m) => m.key)
    expect(keys.indexOf('heartRateVariabilitySdnn')).toBe(keys.indexOf('heartRateVariability') + 1)
    expect(metricKey({ type: 'heart_rate', payload: { subtype: 'heartRateVariabilitySdnn' } })).toBe('heartRateVariabilitySdnn')
  })

  it('libellée « variabilité cardiaque », sans sigle,, jamais réclamée à une montre (aucune montre Android n’en envoie)', () => {
    const now = new Date('2026-10-28T08:00:00Z')
    const cov = sourceCoverage([{ at: '2026-10-28T06:00:00Z', type: 'heart_rate', payload: { subtype: 'heartRateVariabilitySdnn', value: 48 } }], now)
    expect(cov).toHaveLength(1)
    expect(cov[0]).toMatchObject({ key: 'heartRateVariabilitySdnn', label: 'variabilité cardiaque' })
    expect(METRICS.find((m) => m.key === 'heartRateVariabilitySdnn').watch).toBeFalsy()
  })

  it('une Apple Watch qui envoie la Variabilité cardiaque (SDNN) : jamais « variabilité cardiaque » dans ce qui manque', () => {
    const watch = [{ key: 'heartRate' }, { key: 'restingHeartRate' }, { key: 'heartRateVariabilitySdnn' }, { key: 'sleep' }, { key: 'steps' }]
    expect(missingWatchMetrics(watch)).toEqual(['oxygène du sang'])
    expect(missingWatchMetrics([{ key: 'heartRate' }, { key: 'sleep' }, { key: 'steps' }])).toEqual(['cœur au repos', 'variabilité cardiaque', 'oxygène du sang'])
  })
})

