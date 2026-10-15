import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { compactWatchSpo2, compactWatchSpo2Once, planSpo2Compaction } from './spo2Slots'
import { exportToJson, importFromJson, listEntries, upsertEntries } from '../storage/localHealthStorage'
import { watchEntries } from '../devices/huawei/sync'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  localStorage.clear()
})

const h0 = Date.UTC(2026, 9, 14, 2) // 02:00 UTC
const minute = (m, value, extra = {}) => ({
  type: 'heart_rate',
  source: 'huawei_watch',
  at: new Date(h0 + m * 60_000 + 30_000).toISOString(),
  payload: { value, unit: '%', subtype: 'oxygenSaturation', connector: 'huawei_watch', sourceName: 'GT 6 Pro', ...extra },
})

describe('planSpo2Compaction', () => {
  it('une tranche par 10 min : moyenne arrondie, min, max, nombre de minutes ; les minutes sont retirées', () => {
    const entries = [minute(0, 97), minute(1, 95), minute(9, 90), minute(10, 98)].map((e, i) => ({ ...e, id: i + 1 }))
    const { remove, add } = planSpo2Compaction(entries)
    expect(remove.sort()).toEqual([1, 2, 3, 4])
    expect(add.map((e) => [e.at, e.payload.value, e.payload.min, e.payload.max, e.payload.samples])).toEqual([
      [new Date(h0 + 20_000).toISOString(), 94, 90, 97, 3],
      [new Date(h0 + 600_000 + 20_000).toISOString(), 98, 98, 98, 1],
    ])
    expect(add[0].payload).toMatchObject({ subtype: 'oxygenSaturation', unit: '%', sourceName: 'GT 6 Pro' })
  })

  it('ne touche ni aux tranches déjà regroupées, ni à la FC, ni aux autres sources', () => {
    const entries = [
      { id: 1, ...minute(0, 97, { samples: 4, min: 95, max: 98 }) },
      { id: 2, type: 'heart_rate', source: 'huawei_watch', at: new Date(h0).toISOString(), payload: { bpm: 60, subtype: 'heartRate' } },
      { id: 3, type: 'steps', source: 'huawei_watch', at: new Date(h0).toISOString(), payload: { value: 10 } },
    ]
    expect(planSpo2Compaction(entries)).toEqual({ remove: [], add: [] })
  })
})

describe('compactWatchSpo2 (base IndexedDB)', () => {
  it('regroupe les anciennes minutes, garde le reste, et rend le même résultat que la synchro actuelle', async () => {
    const values = [97, 96, 95, 93, 96, 97, 98, 97, 96, 95, 99]
    await upsertEntries(values.map((v, m) => minute(m, v)))
    await upsertEntries([
      { type: 'heart_rate', source: 'huawei_watch', at: new Date(h0).toISOString(), payload: { bpm: 58, subtype: 'heartRate' } },
      { type: 'heart_rate', source: 'health_connect', at: new Date(h0 + 30_000).toISOString(), payload: { value: 94, subtype: 'oxygenSaturation' } },
    ])
    expect(await compactWatchSpo2()).toEqual({ removed: 11, added: 2 })
    const all = await listEntries({ limit: 1000 })
    const watchSpo2 = all.filter((e) => e.source === 'huawei_watch' && e.payload.subtype === 'oxygenSaturation')
    // Même découpage que watchEntries sur les minutes brutes
    const fresh = watchEntries({ minutes: values.map((spo2, m) => ({ t: h0 + m * 60_000, spo2 })) }, { until: h0 + 3600_000, sourceName: 'GT 6 Pro' })
    expect(watchSpo2.map((e) => [e.at, e.payload]).sort()).toEqual(fresh.map((e) => [e.at, e.payload]).sort())
    expect(all.filter((e) => e.payload.subtype === 'heartRate')).toHaveLength(1)
    expect(all.filter((e) => e.source === 'health_connect')).toHaveLength(1)
    // Idempotent
    expect(await compactWatchSpo2()).toEqual({ removed: 0, added: 0 })
  })

  it('une tranche déjà présente (nouvelle synchro) n’est pas dédoublée : les minutes sont seulement retirées', async () => {
    await upsertEntries(watchEntries({ minutes: [{ t: h0, spo2: 96 }] }, { until: h0 + 3600_000, sourceName: 'GT 6 Pro' }))
    await upsertEntries([minute(0, 96)])
    expect(await compactWatchSpo2()).toEqual({ removed: 1, added: 0 })
    expect((await listEntries({ limit: 10 })).length).toBe(1)
  })

  it('une seule fois par téléphone, sauf après un import (ancien fichier de sauvegarde)', async () => {
    await upsertEntries([minute(0, 97), minute(1, 95)])
    const backup = await exportToJson()
    expect(await compactWatchSpo2Once()).toEqual({ removed: 2, added: 1 })
    await importFromJson(backup, { merge: true })
    expect(await compactWatchSpo2Once()).toBeNull()
    expect((await listEntries({ limit: 10 })).length).toBe(3)
    expect(await compactWatchSpo2Once({ force: true })).toEqual({ removed: 2, added: 0 })
    expect((await listEntries({ limit: 10 })).map((e) => e.payload.samples)).toEqual([2])
  })
})
