import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Sur iPhone, le même connecteur lit HealthKit (anciens correctifs iPhone 08 et 43, fondus le 22/11, FUSION-3) (même plugin @capgo/capacitor-health, I4).
// HealthKit ne dit jamais si la lecture est accordée : « accordé » dès que la demande a été faite sur cet appareil.
// VFC : SDNN sur iOS contre RMSSD sur Android → lue sur iPhone, mais rangée à part (`heartRateVariabilitySdnn`),
// jamais mêlée à la RMSSD (`heartRateVariability`) des analyses, des normes et du radar.
vi.mock('@capgo/capacitor-health', () => ({
  Health: {
    isAvailable: vi.fn(),
    checkAuthorization: vi.fn(),
    requestAuthorization: vi.fn(),
    readSamples: vi.fn(),
    queryAggregated: vi.fn(),
    queryWorkouts: vi.fn(),
  },
}))

import { Health } from '@capgo/capacitor-health'
import { HealthConnectConnector, _resetHealthPluginCache } from './HealthConnectConnector'

beforeEach(() => {
  vi.clearAllMocks()
  _resetHealthPluginCache()
  localStorage.clear()
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios' }
  Health.isAvailable.mockResolvedValue({ available: true, platform: 'ios' })
  Health.checkAuthorization.mockResolvedValue({ readAuthorized: [], readDenied: ['steps', 'sleep'], writeAuthorized: [], writeDenied: [] })
  Health.requestAuthorization.mockResolvedValue({ readAuthorized: [], readDenied: [], writeAuthorized: [], writeDenied: [] })
  Health.readSamples.mockResolvedValue({ samples: [] })
  Health.queryAggregated.mockResolvedValue({ samples: [] })
  Health.queryWorkouts.mockResolvedValue({ workouts: [] })
})
afterEach(() => {
  delete window.Capacitor
})

describe('HealthConnectConnector sur iPhone (HealthKit)', () => {
  it('pas de fenêtre de 30 jours sur iPhone : l’app Santé laisse lire tout l’historique (retours du testeur, 06/11)', () => {
    // Health Connect ne lit que les 30 jours avant la première autorisation (sans READ_HEALTH_DATA_HISTORY) ; HealthKit
    // n'a pas cette limite. Avec la fenêtre d'Android, l'iPhone n'importait qu'un mois et Sources affichait
    // « Android laisse lire les 30 jours… »
    expect(new HealthConnectConnector().readWindowDays).toBeNull()
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android' }
    expect(new HealthConnectConnector().readWindowDays).toBe(29)
  })

  it('disponible quand HealthKit l’est, indisponible (raison « ios ») sinon', async () => {
    const connector = new HealthConnectConnector()
    expect(await connector.availabilityDetails()).toMatchObject({ available: true, platform: 'ios' })
    expect(await connector.isAvailable()).toBe(true)
    Health.isAvailable.mockResolvedValue({ available: false, platform: 'ios' })
    expect(await new HealthConnectConnector().availabilityDetails()).toMatchObject({ available: false, reason: 'ios' })
  })

  it('pas encore demandé → « not_asked » ; après la demande → « granted », même si HealthKit dit tout refusé', async () => {
    const connector = new HealthConnectConnector()
    expect(await connector.checkPermissions()).toBe('not_asked')
    expect(await connector.requestPermissions()).toBe('granted')
    expect(await new HealthConnectConnector().checkPermissions()).toBe('granted')
    expect(connector.missingReadTypes).toEqual([])
  })

  it('demande la VFC et la range à part, en SDNN (pas comparable à la RMSSD d’Android)', async () => {
    const connector = new HealthConnectConnector()
    await connector.requestPermissions()
    expect(Health.requestAuthorization.mock.calls[0][0].read).toContain('heartRateVariability')
    Health.readSamples.mockImplementation(async ({ dataType }) => ({
      samples: dataType === 'heartRateVariability'
        ? [{ value: 52, unit: 'millisecond', startDate: '2026-10-01T03:00:00Z', endDate: '2026-10-01T03:01:00Z', sourceName: 'Apple Watch' }]
        : [],
    }))
    const written = []
    await connector.sync({ since: new Date('2026-10-01T00:00:00Z'), until: new Date('2026-10-02T00:00:00Z'), writer: async (e) => written.push(...e) })
    const hrv = written.filter((e) => e.type === 'heart_rate')
    expect(hrv).toHaveLength(1)
    expect(hrv[0].payload).toMatchObject({ value: 52, subtype: 'heartRateVariabilitySdnn', sourceName: 'Apple Watch' })
    expect(written.some((e) => e.payload?.subtype === 'heartRateVariability')).toBe(false)
  })

  it('carte de Sources : nom et description de l’app Santé, sans Health Connect', () => {
    const connector = new HealthConnectConnector()
    // Titre court comme sur Android depuis v565 (POL-PLAY-28) ; description courte comme sur Android depuis v673 (SLOP-1b-3)
    expect(connector.name).toBe('App Santé')
    expect(connector.description).toBe('Sommeil, cœur, pas, poids… écrits par l’Apple Watch et vos apps santé : Garmin, Withings, Oura.')
    expect(`${connector.name} ${connector.description}`).not.toMatch(/Health Connect/)
  })

})
