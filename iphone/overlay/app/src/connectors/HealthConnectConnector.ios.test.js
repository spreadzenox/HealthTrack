import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Version iOS (HealthTrack-iOS) : le même connecteur lit HealthKit (même plugin @capgo/capacitor-health, I4).
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

// CYCLE-iOS-1 : le cycle de l'app Santé, lu par le plugin natif (`ios/cycleSante.js`, testé à part)
vi.mock('../ios/cycleSante', () => ({ syncCycleFromSante: vi.fn(async () => 0), requestSanteAuthorization: vi.fn(async () => ({ asked: true })) }))

import { Health } from '@capgo/capacitor-health'
import { HealthConnectConnector, _resetHealthPluginCache } from './HealthConnectConnector'
import { syncCycleFromSante, requestSanteAuthorization } from '../ios/cycleSante'
import { READ_TYPES } from './HealthConnectConnector'

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

  // CYCLE-iOS-1 (décision du propriétaire du 10/11, « Ok cycle ») : chaque synchro de Santé lit aussi le cycle
  it('la synchro lit aussi le cycle noté dans l’app Santé, sur la même période, et compte ses entrées', async () => {
    syncCycleFromSante.mockResolvedValueOnce(3)
    const connector = new HealthConnectConnector()
    const since = new Date('2026-05-10T00:00:00Z')
    const until = new Date('2026-11-10T00:00:00Z')
    const writer = vi.fn()
    const result = await connector.sync({ since, until, writer })
    expect(syncCycleFromSante).toHaveBeenCalledWith(expect.objectContaining({ since, until, writer }))
    expect(result.synced).toBe(3)
  })

  it('une lecture du cycle en échec n’empêche pas le reste : l’erreur est notée, la synchro continue', async () => {
    syncCycleFromSante.mockRejectedValueOnce(new Error('HealthKit indisponible'))
    const connector = new HealthConnectConnector()
    const result = await connector.sync({ since: new Date('2026-11-01T00:00:00Z'), until: new Date('2026-11-02T00:00:00Z'), writer: vi.fn() })
    expect(result.errors).toContain('cycle: HealthKit indisponible')
  })

  it('sur Android, rien de l’iPhone : pas de lecture du cycle de Santé', async () => {
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android' }
    Health.isAvailable.mockResolvedValue({ available: true, platform: 'android' })
    const connector = new HealthConnectConnector()
    await connector.sync({ since: new Date('2026-11-01T00:00:00Z'), until: new Date('2026-11-02T00:00:00Z'), writer: vi.fn() })
    expect(syncCycleFromSante).not.toHaveBeenCalled()
  })

  // CYCLE-iOS-2 : « Mon cycle » coché à l'accueil → le cycle dans la même feuille d'Apple que les autres mesures
  it('avec « Mon cycle », la demande d’autorisation de Santé inclut le cycle, en une seule feuille, avant celle du module', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ goals: ['gut', 'cycle'] }))
    const order = []
    requestSanteAuthorization.mockImplementationOnce(async () => { order.push('cycle'); return { asked: true } })
    Health.requestAuthorization.mockImplementationOnce(async () => { order.push('module'); return {} })
    expect(await new HealthConnectConnector().requestPermissions()).toBe('granted')
    expect(requestSanteAuthorization).toHaveBeenCalledWith({ read: READ_TYPES, cycle: true })
    expect(order).toEqual(['cycle', 'module'])
  })

  it('sans « Mon cycle », jamais de demande pour le cycle', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ goals: ['gut'] }))
    expect(await new HealthConnectConnector().requestPermissions()).toBe('granted')
    expect(requestSanteAuthorization).not.toHaveBeenCalled()
  })

  it('une feuille du cycle en échec ne bloque pas Santé : la demande du module suit', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ goals: ['cycle'] }))
    requestSanteAuthorization.mockRejectedValueOnce(new Error('refus'))
    expect(await new HealthConnectConnector().requestPermissions()).toBe('granted')
    expect(Health.requestAuthorization).toHaveBeenCalled()
  })
})
