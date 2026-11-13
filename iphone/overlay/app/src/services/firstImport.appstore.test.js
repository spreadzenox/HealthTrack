import { describe, it, expect, vi } from 'vitest'

// Version iOS (HealthTrack-iOS) : le résumé du premier import (onboarding) nomme l'app Santé, pas Health Connect
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

import { summarizeImport, runFirstImport } from './firstImport'

const now = new Date('2026-10-20T12:00:00Z')
const steps = (day, value, sourceName) => ({
  type: 'steps',
  source: 'health_connect',
  at: `2026-10-${day}T10:00:00Z`,
  payload: { value, ...(sourceName ? { sourceName } : {}) },
})

describe('Résumé du premier import sur iPhone', () => {
  it('« via l’app Santé » avec l’app d’origine, « App Santé » sans elle', () => {
    const withOrigin = summarizeImport([steps('18', 6000, 'Garmin Connect'), steps('19', 8000, 'Garmin Connect')], now)
    expect(withOrigin.map((f) => f.source)).toContain('Garmin Connect via l’app Santé')
    const without = summarizeImport([steps('18', 6000), steps('19', 8000)], now)
    expect(without.map((f) => f.source)).toContain('App Santé')
    expect(JSON.stringify([withOrigin, without])).not.toMatch(/Health Connect/)
  })
})

// La VFC de l'app Santé est en SDNN : le résumé la donne sous son nom quand il n'y a pas de RMSSD (correctif 32)
describe('VFC du premier import sur iPhone', () => {
  const hrv = (day, value, subtype) => ({
    type: 'heart_rate', source: 'health_connect', at: `2026-10-${day}T03:00:00Z`,
    payload: { value, unit: 'ms', subtype, sourceName: 'Apple Watch' },
  })

  it('« de VFC (SDNN) en moyenne », avec sa source', () => {
    const facts = summarizeImport([hrv('18', 40, 'heartRateVariabilitySdnn'), hrv('19', 50, 'heartRateVariabilitySdnn')], now)
    expect(facts.find((f) => f.key === 'hrv')).toMatchObject({ value: '45 ms', label: 'de VFC (SDNN) en moyenne, sur 2 mesures', source: 'Apple Watch via l’app Santé' })
  })

  it('une RMSSD (fichier d’Android) garde « de VFC en moyenne », sans mêler la SDNN', () => {
    const facts = summarizeImport([hrv('18', 30, 'heartRateVariability'), hrv('19', 50, 'heartRateVariabilitySdnn')], now)
    expect(facts.find((f) => f.key === 'hrv')).toMatchObject({ value: '30 ms', label: 'de VFC en moyenne, sur 1 mesure' })
  })
})

// Retours du premier testeur (06/11, point 5) : « l'app Santé avec son historique » pendant l'accueil. HealthKit n'a pas
// la fenêtre de 30 jours de Health Connect : le premier import de l'iPhone remonte 6 mois (180 jours, comme le choix
// par défaut de Sources), le « aha » résume toujours les 30 derniers jours
describe('Premier import sur iPhone : l’historique', () => {
  it('remonte 180 jours quand la source n’a pas de fenêtre de lecture', async () => {
    localStorage.clear()
    const sync = vi.fn(async () => ({ synced: 0, skipped: 0, errors: [] }))
    await runFirstImport({ connector: { id: 'health_connect', readWindowDays: null, sync }, now, writer: vi.fn() })
    const { since, until } = sync.mock.calls[0][0]
    expect(until).toEqual(now)
    expect(Math.round((now - since) / 86400000)).toBe(180)
  })
})
