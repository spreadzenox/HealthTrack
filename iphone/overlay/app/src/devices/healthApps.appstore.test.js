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

  it('libellée « variabilité cardiaque (SDNN) », jamais réclamée à une montre (aucune montre Android n’en envoie)', () => {
    const now = new Date('2026-10-28T08:00:00Z')
    const cov = sourceCoverage([{ at: '2026-10-28T06:00:00Z', type: 'heart_rate', payload: { subtype: 'heartRateVariabilitySdnn', value: 48 } }], now)
    expect(cov).toHaveLength(1)
    expect(cov[0]).toMatchObject({ key: 'heartRateVariabilitySdnn', label: 'variabilité cardiaque (SDNN)' })
    expect(METRICS.find((m) => m.key === 'heartRateVariabilitySdnn').watch).toBeFalsy()
  })

  it('une Apple Watch qui envoie la Variabilité cardiaque (SDNN) : jamais « variabilité cardiaque » dans ce qui manque', () => {
    const watch = [{ key: 'heartRate' }, { key: 'restingHeartRate' }, { key: 'heartRateVariabilitySdnn' }, { key: 'sleep' }, { key: 'steps' }]
    expect(missingWatchMetrics(watch)).toEqual(['oxygène du sang'])
    expect(missingWatchMetrics([{ key: 'heartRate' }, { key: 'sleep' }, { key: 'steps' }])).toEqual(['cœur au repos', 'variabilité cardiaque', 'oxygène du sang'])
  })
})

// CYCLE-iOS-3 (décision du propriétaire du 10/11, « Ok cycle ») : le cycle lu dans l'app Santé (source `health_connect`,
// app qui l'a noté dans `sourceName`) compte parmi les mesures reçues de « Mes appareils », sans jamais passer pour une
// mesure « arrêtée » (rien n'arrive pendant les jours sans règles)
describe('« qui envoie quoi » avec le cycle de l’app Santé (iPhone)', () => {
  it('« cycle » parmi les mesures d’une source, pour les règles comme pour les symptômes', () => {
    expect(metricKey({ type: 'cycle', payload: { subtype: 'period', flow: 'medium' } })).toBe('cycle')
    expect(metricKey({ type: 'cycle', payload: { subtype: 'symptom', symptom: 'cramps' } })).toBe('cycle')
    expect(METRICS.find((m) => m.key === 'cycle')?.label).toBe('cycle')
    const now = new Date('2026-11-10T20:00:00Z')
    const days = [1, 2, 3, 4, 5, 6, 7, 8].map((d) => ({ type: 'cycle', at: new Date(now - (d + 30) * 86400000).toISOString(), payload: { subtype: 'period' } }))
    const [cycle] = sourceCoverage(days, now)
    expect(cycle.key).toBe('cycle')
    expect(cycle.stopped).toBeFalsy()
  })
})
