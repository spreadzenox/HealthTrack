import { describe, it, expect, beforeEach, vi } from 'vitest'
import { runFirstImport, summarizeImport } from './firstImport'
import { getConnectorSettings } from '../settings/connectorSettings'

const NOW = new Date('2026-10-23T10:00:00')
const hc = (type, at, payload) => ({ type, source: 'health_connect', at, payload })

/** Nuit du jour J (réveil le matin de J), 7 h de sommeil, depuis Garmin. */
const night = (day, hours = 7) => {
  const end = new Date(`2026-10-${day}T07:00:00`)
  const start = new Date(end.getTime() - hours * 3600000)
  return hc('sleep', start.toISOString(), { endDate: end.toISOString(), sleepState: 'light', sourceName: 'com.garmin.android.apps.connectmobile' })
}

describe('summarizeImport — le « aha » des 30 derniers jours', () => {
  it('rien d’importé → aucune tuile (jamais de zéro trompeur)', () => {
    expect(summarizeImport([], NOW)).toEqual([])
  })

  it('sommeil : moyenne des nuits principales, nombre de nuits et source lisible', () => {
    const facts = summarizeImport([night(20, 7), night(21, 7.5), night(22, 6.5)], NOW)
    expect(facts).toHaveLength(1)
    expect(facts[0]).toMatchObject({ key: 'sleep', value: '7 h', label: 'de sommeil en moyenne, sur 3 nuits' })
    expect(facts[0].source).toMatch(/via Health Connect$/)
    expect(facts[0].source).toMatch(/Garmin/)
  })

  it('pas : moyenne par jour, seulement sur les jours où il y en a', () => {
    const facts = summarizeImport([
      hc('steps', '2026-10-21T09:00:00', { value: 4000 }),
      hc('steps', '2026-10-21T18:00:00', { value: 2000 }),
      hc('steps', '2026-10-22T09:00:00', { value: 8000 }),
    ], NOW)
    expect(facts).toEqual([{ key: 'steps', value: (7000).toLocaleString('fr-FR'), label: 'pas par jour en moyenne, sur 2 jours', source: 'Health Connect' }])
  })

  it('VFC de nuit seulement ; au plus 4 chiffres ; ignore ce qui a plus de 30 jours ou une autre source', () => {
    const facts = summarizeImport([
      night(22),
      hc('steps', '2026-10-22T09:00:00', { value: 5000 }),
      hc('heart_rate', '2026-10-22T03:00:00', { subtype: 'heartRateVariability', value: 40 }),
      hc('heart_rate', '2026-10-22T15:00:00', { subtype: 'heartRateVariability', value: 90, during: 'day' }),
      hc('heart_rate', '2026-10-22T05:00:00', { subtype: 'restingHeartRate', bpm: 58 }),
      hc('activity', '2026-10-21T18:00:00', { workoutType: 'running' }),
      hc('steps', '2026-09-01T09:00:00', { value: 99999 }),
      { type: 'steps', source: 'huawei_watch', at: '2026-10-22T10:00:00', payload: { value: 99999 } },
    ], NOW)
    expect(facts.map((f) => f.key)).toEqual(['sleep', 'steps', 'hrv', 'resting'])
    expect(facts[1].value).toBe((5000).toLocaleString('fr-FR'))
    expect(facts[2]).toMatchObject({ value: '40 ms', label: 'de VFC en moyenne, sur 1 mesure' })
  })

  it('séances de sport quand il reste de la place', () => {
    const facts = summarizeImport([hc('activity', '2026-10-21T18:00:00', { workoutType: 'running' })], NOW)
    expect(facts).toEqual([{ key: 'workouts', value: '1', label: 'séance de sport', source: 'Health Connect' }])
  })
})

describe('runFirstImport', () => {
  beforeEach(() => localStorage.clear())

  const fakeConnector = (result) => ({
    id: 'health_connect',
    readWindowDays: 29,
    sync: vi.fn(async ({ onProgress }) => {
      onProgress?.({ done: 0, total: 1, label: 'pas' })
      return result
    }),
  })

  it('active le connecteur, lit les 30 jours avant l’autorisation et note la synchro réussie', async () => {
    const c = fakeConnector({ synced: 12, skipped: 0, errors: [] })
    const progress = vi.fn()
    const result = await runFirstImport({ connector: c, onProgress: progress, now: NOW, writer: async () => {} })
    expect(result.synced).toBe(12)
    const { since, until } = c.sync.mock.calls[0][0]
    expect(until).toBe(NOW)
    expect((NOW - since) / 86400000).toBeCloseTo(29)
    expect(progress).toHaveBeenCalledWith({ done: 0, total: 1, label: 'pas' })
    const s = getConnectorSettings('health_connect')
    expect(s.enabled).toBe(true)
    expect(s.firstGrantAt).toBe(NOW.toISOString())
    expect(s.lastSyncAt).toBe(NOW.toISOString())
  })

  it('tout a échoué → lastSyncAt n’avance pas (on réessaiera depuis le même point)', async () => {
    const c = fakeConnector({ synced: 0, skipped: 0, errors: ['steps: refus'] })
    await runFirstImport({ connector: c, now: NOW, writer: async () => {} })
    const s = getConnectorSettings('health_connect')
    expect(s.lastSyncAt).toBeFalsy()
    expect(s.lastAttemptAt).toBe(NOW.toISOString())
  })
})
