/**
 * End-to-end connector pipeline with synthetic Withings Body Scan data.
 */
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WithingsConnector, withingsGroupToEntries } from './WithingsConnector'
import { buildMockWithingsMeasuresBody } from '../fixtures/withingsMockMeasures'
import { connectWithingsMockAccount } from '../services/withingsMockApi'
import { getBodyProfile, getLatestBodyComposition } from '../services/bodyProfile'
import { clearWithingsAuth } from '../settings/withingsSettings'
import { upsertEntries, listEntries } from '../storage/localHealthStorage'

vi.mock('../settings/withingsConnectConfig', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    isWithingsMockMode: () => true,
    isWithingsDirectConnectAvailable: () => true,
  }
})

describe('WithingsConnector integration (mock API)', () => {
  const connector = new WithingsConnector()
  const written = []

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
    written.length = 0
    clearWithingsAuth()
    localStorage.clear()
  })

  it('connects mock account in one step', async () => {
    expect(await connector.isAvailable()).toBe(true)
    const perm = await connector.requestPermissions()
    expect(perm).toBe('granted')
    expect(await connector.checkPermissions()).toBe('granted')
  })

  it('imports full Body Scan biomarkers into storage', async () => {
    connectWithingsMockAccount()
    const since = new Date('2026-01-01T00:00:00Z')
    const until = new Date('2026-12-31T00:00:00Z')

    const result = await connector.sync({
      since,
      until,
      writer: async (entries) => {
        written.push(...entries)
        await upsertEntries(entries)
      },
    })

    expect(result.errors).toEqual([])
    expect(result.synced).toBeGreaterThan(0)

    const comp = written.find((e) => e.type === 'body_composition')
    expect(comp?.payload?.vascularAgeYears).toBe(38)
    expect(comp?.payload?.pwvMps).toBe(6.5)
    expect(comp?.payload?.muscleMassKg).toBe(35.8)
    expect(comp?.payload?.visceralFatIndex).toBe(42)

    const stored = await listEntries({ limit: 100 })
    const profile = await getBodyProfile(stored)
    expect(profile.weightKg).toBe(73.5)
    expect(profile.heightCm).toBe(178)
    expect(profile.source).toBe('withings')

    const latestComp = getLatestBodyComposition(stored)
    expect(latestComp?.fatRatioPct).toBe(19.2)
    expect(latestComp?.bmrKcal).toBe(1685)
  })

  it('fixture maps all advanced measure types', () => {
    const body = buildMockWithingsMeasuresBody()
    const entries = withingsGroupToEntries(body.measuregrps[0])
    const comp = entries.find((e) => e.type === 'body_composition')
    expect(comp.payload).toMatchObject({
      fatRatioPct: 19.2,
      muscleMassKg: 35.8,
      vascularAgeYears: 38,
      pwvMps: 6.5,
      visceralFatIndex: 42,
      bmrKcal: 1685,
    })
  })
})
