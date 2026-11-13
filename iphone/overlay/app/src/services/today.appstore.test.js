import { describe, it, expect, vi } from 'vitest'

// Version iOS (HealthTrack-iOS) : le connecteur « health_connect » lit l'app Santé d'Apple ; ses entrées disent
// d'où elles viennent sur iPhone (Journal, tuiles de l'Accueil, rapport)
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

import { SOURCE_LABELS, entrySourceLabel, measureTiles } from './today'

describe('Source des entrées importées sur iPhone', () => {
  it('« App Santé », avec l’app d’origine quand Santé la donne', () => {
    expect(SOURCE_LABELS.health_connect).toBe('App Santé')
    expect(entrySourceLabel({ source: 'health_connect', payload: { sourceName: 'Garmin Connect' } })).toBe('App Santé · Garmin Connect')
    expect(Object.values(SOURCE_LABELS).join(' ')).not.toMatch(/Health Connect/)
  })
})

// La VFC de l'app Santé est en SDNN, rangée à part (`heartRateVariabilitySdnn`) : la tuile VFC de l'Accueil la
// montre sous son nom, « VFC (SDNN) », au lieu d'un « — » (correctif 30) ; une VFC RMSSD (fichier d'Android) garde
// « VFC nuit »
describe('Tuile VFC de l’Accueil sur iPhone', () => {
  const NOW = new Date(2026, 9, 21, 12, 0)
  const at = (d, h = 9) => new Date(2026, 9, d, h, 0).toISOString()
  const sdnn = (d, value) => ({ type: 'heart_rate', source: 'health_connect', at: at(d, 3), payload: { value, unit: 'millisecond', subtype: 'heartRateVariabilitySdnn', sourceName: 'Apple Watch' } })

  it('« VFC (SDNN) » de l’app Santé, avec sa source', () => {
    const tiles = measureTiles({ hrv: null, hrvSdnn: 52.4 }, [sdnn(21, 52.4)], NOW)
    expect(tiles[1]).toMatchObject({ key: 'hrv', label: 'VFC (SDNN)', value: '52 ms', when: null, sources: ['App Santé · Apple Watch'] })
  })

  it('celle de la veille, marquée « hier », plutôt qu’un « — »', () => {
    const tiles = measureTiles({ hrv: null, hrvSdnn: null }, [sdnn(20, 47)], NOW, { hrv: null, hrvSdnn: 47 })
    expect(tiles[1]).toMatchObject({ label: 'VFC (SDNN)', value: '47 ms', when: 'hier' })
  })

  it('une VFC RMSSD (fichier d’Android) garde « VFC nuit » ; rien du tout, la tuile reste « VFC nuit » vide', () => {
    expect(measureTiles({ hrv: 41, hrvSdnn: 52 }, [], NOW)[1]).toMatchObject({ label: 'VFC nuit', value: '41 ms' })
    expect(measureTiles({}, [], NOW)[1]).toMatchObject({ label: 'VFC nuit', value: null })
  })
})
