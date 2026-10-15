import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { importPendingCaptures } from './watchCaptures'
import { getWatchSyncState, importWatchCapture, SYNC_STATE_VERSION } from './watchSync'
import { syncWatchIfStale } from './watchAutoSync'
import { READ_WINDOW } from '../devices/huawei/testing/sampleBlocks'

const VECTORS = resolve(dirname(fileURLToPath(import.meta.url)), '../../android/app/src/test/resources/huawei/link-vectors.json')
const ADDRESS = 'AA:BB:CC:DD:EE:FF'
const javaCapture = (extra = {}) => ({ ...JSON.parse(readFileSync(VECTORS, 'utf8')).read.capture, address: ADDRESS, name: 'HUAWEI WATCH GT 6 Pro-1A2', ...extra })

const memoryStorage = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
}
const deps = () => ({ write: vi.fn(async (entries) => ({ inserted: entries.length })), clear: vi.fn(async () => 0), clearTotals: vi.fn(async () => 0) })

describe('importWatchCapture', () => {
  it('écrit les mesures de la capture et fait avancer la reprise', async () => {
    const storage = memoryStorage()
    const d = deps()
    const r = await importWatchCapture(javaCapture(), { watchKey: ADDRESS, storage, ...d })
    const written = d.write.mock.calls[0][0]
    expect(written.every((e) => e.source === 'huawei_watch')).toBe(true)
    expect(written.filter((e) => e.payload.period === 'day').map((e) => e.type)).toEqual(['steps', 'calories'])
    expect(r).toMatchObject({ background: true, battery: 64, minutes: 4, nights: 1 })
    expect(r.inserted).toBe(written.length)
    expect(getWatchSyncState(ADDRESS, storage)).toMatchObject({ v: SYNC_STATE_VERSION, until: READ_WINDOW.until, at: new Date(READ_WINDOW.at).toISOString() })
  })

  it('une capture plus ancienne que la dernière synchro ne recule rien et ne remplace pas le total du jour', async () => {
    const later = new Date(READ_WINDOW.at + 3600_000).toISOString()
    const storage = memoryStorage({ healthtrack_watch_sync: JSON.stringify({ [ADDRESS]: { v: SYNC_STATE_VERSION, until: READ_WINDOW.until + 3600_000, at: later } }) })
    const d = deps()
    await importWatchCapture(javaCapture(), { watchKey: ADDRESS, storage, ...d })
    expect(d.write.mock.calls[0][0].some((e) => e.payload.period === 'day')).toBe(false)
    expect(d.clearTotals).not.toHaveBeenCalled()
    expect(getWatchSyncState(ADDRESS, storage)).toMatchObject({ until: READ_WINDOW.until + 3600_000, at: later })
  })

  it('rien reçu : la reprise reste où elle était', async () => {
    const storage = memoryStorage()
    await importWatchCapture(javaCapture({ replies: [] }), { watchKey: ADDRESS, storage, ...deps() })
    expect(getWatchSyncState(ADDRESS, storage).until).toBeNull()
  })
})

describe('importPendingCaptures', () => {
  const plugin = (items) => ({ list: vi.fn(async () => ({ captures: items })), remove: vi.fn(async ({ names }) => ({ removed: names.length })) })

  it('importe, puis retire les captures importées et les illisibles', async () => {
    const p = plugin([
      { name: 'capture-1-000.json', json: JSON.stringify(javaCapture()) },
      { name: 'capture-2-000.json', json: '{pas du json' },
      { name: 'capture-3-000.json', json: JSON.stringify(javaCapture({ address: undefined })) },
    ])
    const importCapture = vi.fn(async () => ({ inserted: 7 }))
    const r = await importPendingCaptures({ plugin: p, storage: memoryStorage(), importCapture })
    expect(r).toMatchObject({ imported: 1, inserted: 7, dropped: 2, kept: 0 })
    expect(importCapture.mock.calls[0][1]).toMatchObject({ watchKey: ADDRESS, watchName: 'HUAWEI WATCH GT 6 Pro-1A2' })
    expect(p.remove).toHaveBeenCalledWith({ names: ['capture-1-000.json', 'capture-2-000.json', 'capture-3-000.json'] })
  })

  it('garde une capture dont l’écriture échoue, et reprend la casse de l’adresse déjà connue', async () => {
    const p = plugin([{ name: 'capture-1-000.json', json: JSON.stringify(javaCapture({ address: ADDRESS.toLowerCase() })) }])
    const storage = memoryStorage({ healthtrack_watch_sync: JSON.stringify({ [ADDRESS]: { v: SYNC_STATE_VERSION } }) })
    const importCapture = vi.fn(async () => {
      throw new Error('base pleine')
    })
    const r = await importPendingCaptures({ plugin: p, storage, importCapture })
    expect(r).toMatchObject({ imported: 0, kept: 1 })
    expect(importCapture.mock.calls[0][1].watchKey).toBe(ADDRESS)
    expect(p.remove).not.toHaveBeenCalled()
  })

  it('sans plugin (web, ancienne version) ou plugin en erreur : rien, sans lever', async () => {
    expect(await importPendingCaptures({ plugin: null })).toMatchObject({ imported: 0 })
    expect(await importPendingCaptures({ plugin: { list: async () => Promise.reject(new Error('x')) } })).toMatchObject({ imported: 0 })
  })

  it('syncWatchIfStale importe les captures avant tout, même hors de l’app Android', async () => {
    const importCaptures = vi.fn(async () => ({ imported: 1 }))
    expect(await syncWatchIfStale({ classic: null, storage: memoryStorage(), importCaptures })).toEqual({ ran: false, reason: 'unavailable' })
    expect(importCaptures).toHaveBeenCalledTimes(1)
  })
})
