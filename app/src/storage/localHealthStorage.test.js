/**
 * Tests for localHealthStorage utility functions.
 * IndexedDB is provided by fake-indexeddb in the jsdom environment.
 */
import { describe, it, expect, beforeEach } from 'vitest'

// Provide fake-indexeddb before importing the module under test
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'

// Give each test suite a fresh IDB instance
beforeEach(() => {
  // Replace globalThis.indexedDB with a fresh factory for isolation
  globalThis.indexedDB = new IDBFactory()
})

// Import after IDB is set up
import {
  createEntry,
  listEntries,
  listEntriesForAnalysis,
  countAllEntries,
  upsertEntries,
  getLatestEntryAt,
  exportToJson,
  importFromJson,
  deleteEntry,
  updateEntry,
} from './localHealthStorage'

describe('createEntry / listEntries', () => {
  it('stores an entry and retrieves it', async () => {
    await createEntry({ type: 'steps', source: 'test', payload: { value: 500 }, at: '2026-01-01T10:00:00Z' })
    const entries = await listEntries({ type: 'steps' })
    expect(entries.length).toBe(1)
    expect(entries[0].payload.value).toBe(500)
  })

  it('filters by type', async () => {
    await createEntry({ type: 'steps', source: 'test', payload: {}, at: '2026-01-01T10:00:00Z' })
    await createEntry({ type: 'sleep', source: 'test', payload: {}, at: '2026-01-01T22:00:00Z' })
    const steps = await listEntries({ type: 'steps' })
    expect(steps.length).toBe(1)
    expect(steps[0].type).toBe('steps')
  })

  it('filters by source', async () => {
    await createEntry({ type: 'steps', source: 'health_connect', payload: {}, at: '2026-01-01T10:00:00Z' })
    await createEntry({ type: 'steps', source: 'manual', payload: {}, at: '2026-01-01T11:00:00Z' })
    const hc = await listEntries({ source: 'health_connect' })
    expect(hc.length).toBe(1)
    expect(hc[0].source).toBe('health_connect')
  })

  it('filters by since/until', async () => {
    await createEntry({ type: 'steps', source: 'test', payload: {}, at: '2026-01-01T08:00:00Z' })
    await createEntry({ type: 'steps', source: 'test', payload: {}, at: '2026-01-02T08:00:00Z' })
    await createEntry({ type: 'steps', source: 'test', payload: {}, at: '2026-01-03T08:00:00Z' })
    const filtered = await listEntries({ since: '2026-01-02T00:00:00Z', until: '2026-01-02T23:59:59Z' })
    expect(filtered.length).toBe(1)
    expect(filtered[0].at).toBe('2026-01-02T08:00:00Z')
  })
})

describe('upsertEntries', () => {
  it('inserts entries and skips exact duplicates', async () => {
    const entry = { type: 'steps', source: 'health_connect', payload: { value: 800 }, at: '2026-01-05T10:00:00Z' }
    const r1 = await upsertEntries([entry])
    expect(r1.inserted).toBe(1)
    expect(r1.skipped).toBe(0)

    const r2 = await upsertEntries([entry])
    expect(r2.inserted).toBe(0)
    expect(r2.skipped).toBe(1)
  })

  it('handles empty array gracefully', async () => {
    const r = await upsertEntries([])
    expect(r.inserted).toBe(0)
    expect(r.skipped).toBe(0)
  })

  it('differentiates entries by type even with same source/at', async () => {
    const base = { source: 'health_connect', at: '2026-01-05T10:00:00Z', payload: {} }
    const r = await upsertEntries([{ ...base, type: 'steps' }, { ...base, type: 'heart_rate' }])
    expect(r.inserted).toBe(2)
  })
})

describe('getLatestEntryAt', () => {
  it('returns null when no entries for source', async () => {
    const result = await getLatestEntryAt('nonexistent_source')
    expect(result).toBeNull()
  })

  it('returns the most recent at for a given source', async () => {
    await createEntry({ type: 'steps', source: 'hc', payload: {}, at: '2026-01-01T10:00:00Z' })
    await createEntry({ type: 'steps', source: 'hc', payload: {}, at: '2026-03-01T10:00:00Z' })
    await createEntry({ type: 'steps', source: 'hc', payload: {}, at: '2026-02-01T10:00:00Z' })
    const latest = await getLatestEntryAt('hc')
    expect(latest).toBe('2026-03-01T10:00:00Z')
  })

  it('does not return entries from a different source', async () => {
    await createEntry({ type: 'steps', source: 'other', payload: {}, at: '2026-12-31T10:00:00Z' })
    const result = await getLatestEntryAt('hc_only')
    expect(result).toBeNull()
  })
})

describe('countAllEntries', () => {
  it('returns 0 when DB is empty', async () => {
    const count = await countAllEntries()
    expect(count).toBe(0)
  })

  it('returns correct count after inserts', async () => {
    await createEntry({ type: 'steps', source: 'test', payload: {}, at: '2026-01-01T10:00:00Z' })
    await createEntry({ type: 'wellbeing', source: 'test', payload: { score: 3 }, at: '2026-01-02T10:00:00Z' })
    const count = await countAllEntries()
    expect(count).toBe(2)
  })
})

describe('listEntriesForAnalysis', () => {
  it('returns all entries when below per-type limits', async () => {
    await createEntry({ type: 'wellbeing', source: 'test', payload: { score: 3 }, at: '2026-01-01T12:00:00Z' })
    await createEntry({ type: 'steps', source: 'test', payload: { value: 5000 }, at: '2026-01-01T22:00:00Z' })
    await createEntry({ type: 'heart_rate', source: 'test', payload: { value: 70 }, at: '2026-01-01T08:00:00Z' })
    const entries = await listEntriesForAnalysis()
    expect(entries.length).toBe(3)
    const types = new Set(entries.map((e) => e.type))
    expect(types.has('wellbeing')).toBe(true)
    expect(types.has('steps')).toBe(true)
    expect(types.has('heart_rate')).toBe(true)
  })

  it('ensures all types are represented even when heart_rate dominates', async () => {
    // Insert many heart_rate entries
    for (let i = 0; i < 10; i++) {
      await createEntry({
        type: 'heart_rate',
        source: 'test',
        payload: { value: 70 + i },
        at: `2026-01-01T${String(i).padStart(2, '0')}:00:00Z`,
      })
    }
    // Insert wellbeing entries
    for (let i = 1; i <= 3; i++) {
      await createEntry({
        type: 'wellbeing',
        source: 'test',
        payload: { score: i },
        at: `2026-01-0${i}T12:00:00Z`,
      })
    }
    const entries = await listEntriesForAnalysis()
    const byType = {}
    for (const e of entries) byType[e.type] = (byType[e.type] || 0) + 1
    // Both types must be present
    expect(byType.heart_rate).toBe(10)
    expect(byType.wellbeing).toBe(3)
  })
})

describe('exportToJson / importFromJson', () => {
  it('exports and re-imports entries round-trip', async () => {
    await createEntry({ type: 'steps', source: 'test', payload: { value: 1000 }, at: '2026-01-10T08:00:00Z' })
    const json = await exportToJson()
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(parsed.entries.length).toBe(1)

    // Fresh DB, reimport
    globalThis.indexedDB = new IDBFactory()
    const { imported } = await importFromJson(json)
    expect(imported).toBe(1)
    const entries = await listEntries({})
    expect(entries.length).toBe(1)
    expect(entries[0].payload.value).toBe(1000)
  })

  it('exports every entry, beyond the per-type analysis limits (no silent data loss)', async () => {
    const many = Array.from({ length: 1205 }, (_, i) => ({
      type: 'hrv',
      source: 'health_connect',
      payload: { value: 40 + (i % 10) },
      at: new Date(Date.UTC(2023, 0, 1) + i * 86400000).toISOString(),
    }))
    many.push({ type: 'sleep', source: 'health_connect', payload: {}, at: '2022-06-01T22:00:00Z' })
    await upsertEntries(many)

    const parsed = JSON.parse(await exportToJson())
    expect(parsed.entries.length).toBe(1206)
    expect(parsed.entries.some((e) => e.at === '2023-01-01T00:00:00.000Z')).toBe(true)

    globalThis.indexedDB = new IDBFactory()
    const { imported } = await importFromJson(JSON.stringify(parsed))
    expect(imported).toBe(1206)
    expect(await countAllEntries()).toBe(1206)
  })

  it('imports an old-style file (bare array, entries without created_at)', async () => {
    const old = JSON.stringify([{ type: 'food', source: 'food_photo', payload: { items: [] }, at: '2025-03-01T12:00:00Z' }])
    const { imported } = await importFromJson(old)
    expect(imported).toBe(1)
    const [e] = await listEntries({})
    expect(e.type).toBe('food')
    expect(e.created_at).toBeTruthy()
  })
})

describe('deleteEntry', () => {
  it('removes only the entry with the given id', async () => {
    const keep = await createEntry({ type: 'cigarette', source: 'cigarette_app', payload: { count: 1 }, at: '2026-01-01T09:00:00Z' })
    const drop = await createEntry({ type: 'cigarette', source: 'cigarette_app', payload: { count: 1 }, at: '2026-01-01T10:00:00Z' })
    await deleteEntry(drop)
    const entries = await listEntries({})
    expect(entries.map((e) => e.id)).toEqual([keep])
  })

  it('is a no-op for an unknown id', async () => {
    await createEntry({ type: 'steps', source: 'test', payload: {}, at: '2026-01-01T10:00:00Z' })
    await deleteEntry(9999)
    expect(await countAllEntries()).toBe(1)
  })
})

describe('updateEntry', () => {
  it('replaces payload and at, keeps id/type/source/created_at and stamps updated_at', async () => {
    const id = await createEntry({ type: 'food', source: 'app_food', payload: { items: [{ ingredient: 'Riz', quantity_g: 100 }] }, at: '2026-01-01T12:00:00Z' })
    const [before] = await listEntries({})
    await updateEntry(id, { payload: { items: [{ ingredient: 'Riz', quantity_g: 150 }] }, at: '2026-01-01T11:30:00.000Z' })
    const [after] = await listEntries({})
    expect(after.id).toBe(id)
    expect(after.type).toBe('food')
    expect(after.source).toBe('app_food')
    expect(after.created_at).toBe(before.created_at)
    expect(after.at).toBe('2026-01-01T11:30:00.000Z')
    expect(after.payload.items[0].quantity_g).toBe(150)
    expect(after.updated_at).toBeTruthy()
    expect(await countAllEntries()).toBe(1)
  })

  it('ignores fields other than payload and at', async () => {
    const id = await createEntry({ type: 'food', source: 'app_food', payload: { a: 1 }, at: '2026-01-01T12:00:00Z' })
    await updateEntry(id, { payload: { a: 2 }, type: 'steps', source: 'hack', id: 42 })
    const [after] = await listEntries({})
    expect(after).toMatchObject({ id, type: 'food', source: 'app_food', at: '2026-01-01T12:00:00Z', payload: { a: 2 } })
  })

  it('rejects for an unknown id without creating anything', async () => {
    await expect(updateEntry(9999, { payload: {} })).rejects.toThrow(/introuvable/)
    expect(await countAllEntries()).toBe(0)
  })

  it('keeps updated_at through export / import', async () => {
    const id = await createEntry({ type: 'food', source: 'app_food', payload: {}, at: '2026-01-01T12:00:00Z' })
    await updateEntry(id, { payload: { dish: 'Soupe' } })
    const json = await exportToJson()
    await importFromJson(json)
    const [e] = await listEntries({})
    expect(e.payload.dish).toBe('Soupe')
    expect(e.updated_at).toBeTruthy()
  })
})
