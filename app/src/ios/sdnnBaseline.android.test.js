// FUSION-3, correctifs 17 à 64 (VFC SDNN de l'app Santé) : sur Android, rien ne change. Les variables et facteurs
// SDNN n'existent que dans la variante appstore, le radar et les normes restent sur la RMSSD, et sans mesure SDNN
// (jamais écrite par Android) la tuile de VFC d'Aujourd'hui reste celle de la RMSSD.
import { describe, it, expect } from 'vitest'
import { DISTRIBUTION } from '../config/distribution'
import { iosBaselineMetrics, radarHrvMetric } from './sdnnBaseline'
import { BASELINE_METRICS } from '../services/baselines'
import { VARIABLE_META, buildDailyDataset } from '../services/analysisEngine'
import { FACTORS } from '../services/analysisResults'
import { measureTiles } from '../services/today'

describe('VFC SDNN sur Android', () => {
  it('variante Android par défaut', () => {
    expect(DISTRIBUTION).not.toBe('appstore')
  })

  it('aucune norme SDNN, radar sur la RMSSD', () => {
    expect(iosBaselineMetrics()).toEqual([])
    expect(radarHrvMetric()).toBe(BASELINE_METRICS.heartRateVariability)
  })

  it('ni variable ni facteur SDNN dans les analyses', () => {
    expect(VARIABLE_META.hrv_sdnn_ms).toBeUndefined()
    expect(FACTORS.some((f) => f.key === 'hrv_sdnn_ms')).toBe(false)
  })

  it('la VFC RMSSD reste comptée comme avant', () => {
    const at = new Date(2026, 10, 20, 7, 0).toISOString()
    const rows = buildDailyDataset([
      { type: 'heart_rate', at, payload: { subtype: 'heartRateVariability', value: 42 } },
      { type: 'wellbeing', at, payload: { score: 3 } },
    ], { includeDaysWithoutWellbeing: true })
    expect(rows.find((r) => r.hrv_ms > 0)?.hrv_ms).toBe(42)
  })

  it('tuile VFC d’Aujourd’hui : la RMSSD, sans clé SDNN', () => {
    const now = new Date(2026, 10, 20, 12, 0)
    const at = new Date(2026, 10, 20, 7, 0).toISOString()
    const entries = [{ type: 'heart_rate', at, payload: { subtype: 'heartRateVariability', value: 42 } }]
    const tile = measureTiles({ hrv: 42 }, entries, now).find((t) => t.key === 'hrv')
    expect(tile.value).toBe('42 ms')
    expect(tile.measure).toBeUndefined()
  })
})
