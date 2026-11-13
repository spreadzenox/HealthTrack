import { describe, it, expect, vi } from 'vitest'

// Version iOS (HealthTrack-iOS) : la VFC de l'app Santé est en SDNN (`heartRateVariabilitySdnn`). Les Analyses la
// prennent comme une variable à part, « Variabilité cardiaque (SDNN) », jamais mêlée à la RMSSD d'Android : une
// personne passée d'Android à l'iPhone aurait sinon un saut de niveau dans sa série, pris pour un lien (correctif 32)
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

import { VARIABLE_META, MEASURED_KEYS, buildDailyDataset, buildTodayRow } from './analysisEngine'

const hrv = (day, value, subtype) => ({
  type: 'heart_rate', source: 'health_connect', at: `2026-10-${day}T03:00:00.000Z`,
  payload: { value, unit: 'ms', subtype, sourceName: 'Apple Watch' },
})

describe('Analyses sur iPhone : la VFC de l’app Santé (SDNN)', () => {
  it('est une variable à part, mesurée (inconnue un jour sans valeur, pas 0)', () => {
    expect(VARIABLE_META.hrv_sdnn_ms).toMatchObject({ label: 'Variabilité cardiaque (SDNN)', unit: 'ms', direction: 'higher_better' })
    expect(MEASURED_KEYS).toContain('hrv_sdnn_ms')
  })

  it('la moyenne du jour en SDNN ; la RMSSD reste dans « Variabilité cardiaque », sans mélange', () => {
    const rows = buildDailyDataset([
      hrv(20, 40, 'heartRateVariabilitySdnn'), hrv(20, 50, 'heartRateVariabilitySdnn'),
      hrv(21, 33, 'heartRateVariability'),
    ], { includeDaysWithoutWellbeing: true })
    const byDay = Object.fromEntries(rows.map((r) => [r.dateKey, r]))
    expect(byDay['2026-10-20'].hrv_sdnn_ms).toBe(45)
    expect(byDay['2026-10-20'].hrv_ms).toBeFalsy()
    expect(byDay['2026-10-21'].hrv_ms).toBe(33)
    expect(byDay['2026-10-21'].hrv_sdnn_ms).toBeFalsy()
  })

  it('la journée en cours compte aussi sa SDNN', () => {
    const today = new Date().toISOString().slice(0, 10)
    const row = buildTodayRow([{ ...hrv(1, 52, 'heartRateVariabilitySdnn'), at: `${today}T03:00:00.000Z` }], [])
    expect(row?.hrv_sdnn_ms ?? row?.values?.hrv_sdnn_ms).toBe(52)
  })
})
