import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// iPhone : le même connecteur lit HealthKit (même plugin @capgo/capacitor-health, I4).
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

describe('HealthConnectConnector sur iPhone : cycle de l’app Santé (CYCLE-iOS)', () => {
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
