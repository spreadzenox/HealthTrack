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
  upsertEntries,
  getLatestEntryAt,
  exportToJson,
  importFromJson,
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
})
