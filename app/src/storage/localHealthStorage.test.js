/**
 * Tests for localHealthStorage utility functions.
 * IndexedDB is provided by fake-indexeddb in the jsdom environment.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Provide fake-indexeddb before importing the module under test
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'

// Give each test suite a fresh IDB instance
beforeEach(() => {
  // Replace globalThis.indexedDB with a fresh factory for isolation
  globalThis.indexedDB = new IDBFactory()
})

// Import after IDB is set up
import { getBodySettings, setBodySettings } from '../settings/bodySettings'
import {
  createEntry,
  listEntries,
  listEntriesForAnalysis,
  ANALYSIS_LIMITS,
  countAllEntries,
  countEntries,
  upsertEntries,
  getLatestEntryAt,
  exportToJson,
  importFromJson,
  parseBackup,
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

  it('dedups per source within the batch range, other sources and dates untouched (perf D2)', async () => {
    await createEntry({ type: 'steps', source: 'huawei_watch', payload: {}, at: '2026-01-05T10:00:00Z' })
    await createEntry({ type: 'steps', source: 'health_connect', payload: {}, at: '2026-01-05T11:00:00Z' })
    await createEntry({ type: 'steps', source: 'huawei_watch', payload: {}, at: '2026-01-07T10:00:00Z' })
    const r = await upsertEntries([
      { type: 'steps', source: 'huawei_watch', payload: {}, at: '2026-01-05T10:00:00Z' }, // doublon
      { type: 'steps', source: 'huawei_watch', payload: {}, at: '2026-01-05T11:00:00Z' }, // autre source à cette heure
      { type: 'steps', source: 'huawei_watch', payload: {}, at: '2026-01-07T10:00:00Z' }, // doublon en borne haute
      { type: 'steps', source: 'health_connect', payload: {}, at: '2026-01-05T11:00:00Z' }, // doublon
      { type: 'steps', source: 'health_connect', payload: {}, at: '2026-01-05T11:00:00Z' }, // doublon dans le lot
    ])
    expect(r).toEqual({ inserted: 1, skipped: 4 })
    expect(await countAllEntries()).toBe(4)
  })

  it('reads only the batch sources and date range, never the whole store (perf D2)', async () => {
    const old = Array.from({ length: 50 }, (_, i) => ({
      type: 'heart_rate',
      source: 'huawei_watch',
      payload: {},
      at: new Date(Date.UTC(2025, 0, 1, i)).toISOString(),
    }))
    await upsertEntries(old)
    await createEntry({ type: 'steps', source: 'other', payload: {}, at: '2026-01-05T10:00:00Z' })
    const storeGetAll = vi.spyOn(IDBObjectStore.prototype, 'getAll')
    const indexGetAll = vi.spyOn(IDBIndex.prototype, 'getAll')
    try {
      const r = await upsertEntries([{ type: 'steps', source: 'huawei_watch', payload: {}, at: '2026-01-05T10:00:00Z' }])
      expect(r.inserted).toBe(1)
      expect(storeGetAll).not.toHaveBeenCalled()
      // la requête est terminée : seuls les enregistrements de la source et de la plage du lot ont été lus
      const read = indexGetAll.mock.results.reduce((n, res) => n + res.value.result.length, 0)
      expect(read).toBe(0)
    } finally {
      storeGetAll.mockRestore()
      indexGetAll.mockRestore()
    }
  })

  it('still dedups entries without a date or a source', async () => {
    const r1 = await upsertEntries([{ type: 'note', payload: {}, at: '2026-01-05T10:00:00Z' }])
    const r2 = await upsertEntries([{ type: 'note', payload: {}, at: '2026-01-05T10:00:00Z' }])
    expect(r1.inserted).toBe(1)
    expect(r2).toEqual({ inserted: 0, skipped: 1 })
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
    await createEntry({ type: 'heart_rate', source: 'test', payload: { value: 70, subtype: 'heartRate' }, at: '2026-01-01T08:00:00Z' })
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
        payload: { value: 70 + i, subtype: 'heartRate' },
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

describe('parseBackup', () => {
  it('summarizes a backup: counts, date range, export date, types', () => {
    const json = JSON.stringify({
      version: 1,
      exportedAt: '2026-10-01T10:00:00.000Z',
      entries: [
        { type: 'food', source: 'food_photo', payload: { items: [] }, at: '2026-09-30T12:00:00Z' },
        { type: 'steps', source: 'health_connect', payload: { value: 1 }, at: '2026-01-02T08:00:00Z' },
        { type: 'steps', source: 'health_connect', payload: { value: 2 }, at: '2026-05-02T08:00:00Z' },
      ],
    })
    const b = parseBackup(json)
    expect(b.entries).toHaveLength(3)
    expect(b.invalid).toBe(0)
    expect(b.exportedAt).toBe('2026-10-01T10:00:00.000Z')
    expect(b.firstAt).toBe('2026-01-02T08:00:00Z')
    expect(b.lastAt).toBe('2026-09-30T12:00:00Z')
    expect(b.byType).toEqual({ food: 1, steps: 2 })
  })

  it('rejects invalid JSON', () => {
    expect(() => parseBackup('{oops')).toThrow(/JSON invalide/)
  })

  it('rejects a JSON file that is not a HealthTrack backup', () => {
    expect(() => parseBackup(JSON.stringify({ name: 'autre appli' }))).toThrow(/pas une sauvegarde HealthTrack/)
    expect(() => parseBackup(JSON.stringify([{ foo: 1 }, { bar: 2 }]))).toThrow(/pas une sauvegarde HealthTrack/)
  })

  it('accepts an empty backup', () => {
    const b = parseBackup(JSON.stringify({ version: 1, entries: [] }))
    expect(b.entries).toHaveLength(0)
  })

  it('skips unreadable entries (no type, no source, no valid date) and counts them', () => {
    const json = JSON.stringify([
      { type: 'food', source: 'food_photo', payload: {}, at: '2026-01-01T12:00:00Z' },
      { source: 'food_photo', at: '2026-01-01T12:00:00Z' },
      { type: 'food', at: '2026-01-01T12:00:00Z' },
      { type: 'food', source: 'x', at: 'pas une date' },
      { type: 'food', source: 'x' },
      null,
      'texte',
    ])
    const b = parseBackup(json)
    expect(b.entries).toHaveLength(1)
    expect(b.invalid).toBe(6)
  })

  it('decodes a payload stored as a JSON string', () => {
    const b = parseBackup(JSON.stringify([{ type: 'steps', source: 's', at: '2026-01-01T00:00:00Z', payload: '{"value":42}' }]))
    expect(b.entries[0].payload).toEqual({ value: 42 })
  })
})

describe('importFromJson — safety', () => {
  it('never wipes existing data when the file is not a HealthTrack backup', async () => {
    await createEntry({ type: 'food', source: 'food_photo', payload: {}, at: '2026-01-01T12:00:00Z' })
    await expect(importFromJson(JSON.stringify([{ foo: 1 }]))).rejects.toThrow(/pas une sauvegarde/)
    expect(await countAllEntries()).toBe(1)
  })

  it('does not wipe existing data with an empty backup', async () => {
    await createEntry({ type: 'food', source: 'food_photo', payload: {}, at: '2026-01-01T12:00:00Z' })
    const res = await importFromJson(JSON.stringify({ version: 1, entries: [] }))
    expect(res.imported).toBe(0)
    expect(await countAllEntries()).toBe(1)
  })

  it('merge adds only entries that are not already present', async () => {
    await createEntry({ type: 'steps', source: 'hc', payload: { value: 1 }, at: '2026-01-01T00:00:00Z' })
    const json = JSON.stringify([
      { type: 'steps', source: 'hc', payload: { value: 1 }, at: '2026-01-01T00:00:00Z' },
      { type: 'steps', source: 'hc', payload: { value: 2 }, at: '2026-01-02T00:00:00Z' },
    ])
    const res = await importFromJson(json, { merge: true })
    expect(res).toMatchObject({ imported: 1, skipped: 1 })
    expect(await countAllEntries()).toBe(2)
    // Importing the same file again adds nothing
    const again = await importFromJson(json, { merge: true })
    expect(again).toMatchObject({ imported: 0, skipped: 2 })
    expect(await countAllEntries()).toBe(2)
  })

  it('replace imports valid entries and reports skipped invalid ones', async () => {
    await createEntry({ type: 'food', source: 'food_photo', payload: {}, at: '2026-01-01T12:00:00Z' })
    const json = JSON.stringify([
      { type: 'steps', source: 'hc', payload: { value: 2 }, at: '2026-01-02T00:00:00Z' },
      { type: 'steps' },
    ])
    const res = await importFromJson(json)
    expect(res).toMatchObject({ imported: 1, invalid: 1 })
    const all = await listEntries({})
    expect(all.map((e) => e.type)).toEqual(['steps'])
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

describe('sauvegarde — profil (sexe, année, taille, activité)', () => {
  beforeEach(() => localStorage.clear())
  const entry = { type: 'steps', source: 'hc', payload: { value: 1 }, at: '2026-01-01T00:00:00Z' }

  it('exporte le profil saisi dans l\'app avec les entrées', async () => {
    setBodySettings({ sex: 'F', birthYear: 1990, heightCm: 163, activity: 'active' })
    await createEntry(entry)
    const parsed = JSON.parse(await exportToJson())
    expect(parsed.version).toBe(1)
    expect(parsed.profile).toEqual({ sex: 'F', birthYear: 1990, heightCm: 163, activity: 'active' })
  })

  it('n\'ajoute pas de profil vide à la sauvegarde', async () => {
    await createEntry(entry)
    expect(JSON.parse(await exportToJson())).not.toHaveProperty('profile')
  })

  it('l\'aperçu lit le profil (nettoyé) ; un ancien fichier sans profil reste accepté', () => {
    const b = parseBackup(JSON.stringify({ version: 1, entries: [entry], profile: { sex: 'M', heightCm: 999, foo: 1 } }))
    expect(b.profile).toEqual({ sex: 'M' })
    expect(parseBackup(JSON.stringify({ version: 1, entries: [entry] })).profile).toBeNull()
    expect(parseBackup(JSON.stringify([entry])).profile).toBeNull()
    expect(parseBackup(JSON.stringify({ version: 1, entries: [entry], profile: 'oops' })).profile).toBeNull()
  })

  it('remplacer restaure le profil de la sauvegarde', async () => {
    setBodySettings({ sex: 'M', heightCm: 180 })
    const json = JSON.stringify({ version: 1, entries: [entry], profile: { sex: 'F', birthYear: 1990 } })
    const res = await importFromJson(json)
    expect(res.profileRestored).toBe(true)
    expect(getBodySettings()).toEqual({ sex: 'F', birthYear: 1990 })
  })

  it('remplacer avec un ancien fichier sans profil garde le profil actuel', async () => {
    setBodySettings({ sex: 'M', heightCm: 180 })
    const res = await importFromJson(JSON.stringify([entry]))
    expect(res.profileRestored).toBe(false)
    expect(getBodySettings()).toEqual({ sex: 'M', heightCm: 180 })
  })

  it('ajouter complète seulement ce qui manque (le profil actuel prime)', async () => {
    setBodySettings({ sex: 'M' })
    const json = JSON.stringify({ version: 1, entries: [entry], profile: { sex: 'F', birthYear: 1990, heightCm: 163 } })
    const res = await importFromJson(json, { merge: true })
    expect(res.profileRestored).toBe(true)
    expect(getBodySettings()).toEqual({ sex: 'M', birthYear: 1990, heightCm: 163 })
  })

  it('ajouter ne signale rien si le profil actuel est déjà complet', async () => {
    setBodySettings({ sex: 'M', birthYear: 1985, heightCm: 180 })
    const json = JSON.stringify({ version: 1, entries: [entry], profile: { sex: 'F', birthYear: 1990 } })
    const res = await importFromJson(json, { merge: true })
    expect(res.profileRestored).toBe(false)
    expect(getBodySettings()).toEqual({ sex: 'M', birthYear: 1985, heightCm: 180 })
  })
})

describe('lectures par index (D2 performance)', () => {
  // Jeu varié : types, sources, dates (dont égalités) — le résultat indexé doit être celui du filtre complet
  const sample = () => {
    const out = []
    const types = ['heart_rate', 'sleep', 'wellbeing', 'steps']
    const sources = ['health_connect', 'app_wellbeing', 'huawei_watch']
    for (let i = 0; i < 120; i++) {
      const day = String(1 + (i % 28)).padStart(2, '0')
      const hour = String((i * 7) % 24).padStart(2, '0')
      out.push({ type: types[i % 4], source: sources[i % 3], at: `2026-0${1 + (i % 3)}-${day}T${hour}:00:00.000Z`, payload: { i } })
    }
    return out
  }
  const naive = (all, o) => {
    let e = all
    if (o.type) e = e.filter((x) => x.type === o.type)
    if (o.source) e = e.filter((x) => x.source === o.source)
    if (o.since) e = e.filter((x) => x.at >= o.since)
    if (o.until) e = e.filter((x) => x.at <= o.until)
    return e.map((x) => x.at).sort().reverse().slice(0, o.limit ?? 100)
  }
  const cases = [
    { type: 'heart_rate', since: '2026-02-10T00:00:00.000Z', limit: Infinity },
    { type: 'sleep', since: '2026-01-05T00:00:00.000Z', until: '2026-02-20T00:00:00.000Z', limit: Infinity },
    { type: 'wellbeing', limit: 5 },
    { source: 'health_connect', since: '2026-02-01T00:00:00.000Z', limit: Number.MAX_SAFE_INTEGER },
    { since: '2026-03-01T00:00:00.000Z', limit: 5000 },
    { since: '2026-01-15T00:00:00.000Z', until: '2026-01-20T00:00:00.000Z' },
    { type: 'steps', source: 'huawei_watch', since: '2026-01-01T00:00:00.000Z', limit: Infinity },
    { limit: 30 },
    {},
  ]

  it.each(cases)('même résultat que le filtre complet : %o', async (opts) => {
    const all = sample()
    await upsertEntries(all)
    const got = await listEntries(opts)
    expect(got.map((e) => e.at)).toEqual(naive(all, opts))
    for (const e of got) {
      if (opts.type) expect(e.type).toBe(opts.type)
      if (opts.source) expect(e.source).toBe(opts.source)
    }
  })

  it('ne relit pas toute la base quand un type, une source ou une date est donné', async () => {
    await upsertEntries(sample())
    const proto = globalThis.IDBObjectStore.prototype
    const orig = proto.getAll
    let fullReads = 0
    proto.getAll = function (...a) {
      fullReads++
      return orig.apply(this, a)
    }
    try {
      await listEntries({ type: 'heart_rate', since: '2026-02-01T00:00:00.000Z', limit: Infinity })
      await listEntries({ type: 'food', limit: 100 })
      await listEntries({ source: 'health_connect', since: '2026-02-01T00:00:00.000Z' })
      await listEntries({ since: '2026-03-01T00:00:00.000Z', limit: 5000 })
      await getLatestEntryAt('health_connect')
    } finally {
      proto.getAll = orig
    }
    expect(fullReads).toBe(0)
  })

  it('getLatestEntryAt lit la plus récente de la source via l\'index', async () => {
    const all = sample()
    await upsertEntries(all)
    const want = all.filter((e) => e.source === 'huawei_watch').map((e) => e.at).sort().at(-1)
    expect(await getLatestEntryAt('huawei_watch')).toBe(want)
  })

  it('migration v2 → v3 : les données restent, l\'index [type, at] est ajouté', async () => {
    // Base telle que l'écrivait la version 2
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('HealthTrack', 2)
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore('health_entries', { keyPath: 'id', autoIncrement: true })
        store.createIndex('at', 'at', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('source', 'source', { unique: false })
        store.createIndex('source_at', ['source', 'at'], { unique: false })
        store.add({ type: 'sleep', source: 'old', payload: { h: 7 }, at: '2025-12-01T07:00:00.000Z', created_at: '2025-12-01T07:00:00.000Z' })
        store.add({ type: 'sleep', source: 'old', payload: { h: 6 }, at: '2025-12-02T07:00:00.000Z', created_at: '2025-12-02T07:00:00.000Z' })
      }
      req.onsuccess = () => {
        req.result.close()
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
    const got = await listEntries({ type: 'sleep', since: '2025-12-02T00:00:00.000Z', limit: Infinity })
    expect(got.map((e) => e.payload.h)).toEqual([6])
    expect(await countAllEntries()).toBe(2)
    const db = await new Promise((resolve) => {
      const req = indexedDB.open('HealthTrack')
      req.onsuccess = () => resolve(req.result)
    })
    expect(db.version).toBeGreaterThanOrEqual(3)
    expect([...db.transaction('health_entries').objectStore('health_entries').indexNames]).toContain('type_at')
    db.close()
  })
})

describe('lecture par sous-type (D2 performance)', () => {
  // 10 jours : FC toutes les 10 min, SpO₂ en tranches, une FC repos et une VFC par jour, une entrée sans sous-type
  const rows = () => {
    const out = []
    for (let d = 0; d < 10; d++) {
      const day = Date.UTC(2026, 9, 1 + d)
      for (let m = 0; m < 1440; m += 10) {
        const at = new Date(day + m * 60000).toISOString()
        out.push({ type: 'heart_rate', source: 'huawei_watch', at, payload: { subtype: 'heartRate', value: 70 } })
        const at5 = new Date(day + (m + 5) * 60000).toISOString()
        out.push({ type: 'heart_rate', source: 'huawei_watch', at: at5, payload: { subtype: 'oxygenSaturation', value: 97 } })
      }
      const morning = new Date(day + 7 * 3600000 + 3 * 60000).toISOString()
      out.push({ type: 'heart_rate', source: 'huawei_watch', at: morning, payload: { subtype: 'restingHeartRate', value: 55 + d } })
      out.push({ type: 'heart_rate', source: 'health_connect', at: morning, payload: { subtype: 'heartRateVariability', value: 40 + d } })
      out.push({ type: 'heart_rate', source: 'old', at: morning, payload: { bpm: 60 } })
      out.push({ type: 'sleep', source: 'huawei_watch', at: morning, payload: { subtype: 'restingHeartRate' } })
    }
    return out
  }

  it('ne renvoie que les sous-types demandés, du type demandé, dans la plage, du plus récent au plus ancien', async () => {
    await upsertEntries(rows())
    const since = '2026-10-04T00:00:00.000Z'
    const got = await listEntries({ type: 'heart_rate', subtypes: ['restingHeartRate', 'heartRateVariability'], since, limit: Infinity })
    expect(got).toHaveLength(14)
    expect(got.every((e) => e.type === 'heart_rate' && e.at >= since)).toBe(true)
    expect(new Set(got.map((e) => e.payload.subtype))).toEqual(new Set(['restingHeartRate', 'heartRateVariability']))
    const ats = got.map((e) => e.at)
    expect(ats).toEqual([...ats].sort().reverse())
  })

  it('lit seulement les entrées des sous-types demandés (pas toute la FC)', async () => {
    await upsertEntries(rows())
    const proto = globalThis.IDBIndex.prototype
    const orig = proto.getAll
    let records = 0
    proto.getAll = function (...a) {
      const req = orig.apply(this, a)
      req.addEventListener('success', () => { records += req.result.length })
      return req
    }
    try {
      await listEntries({ type: 'heart_rate', subtypes: ['restingHeartRate', 'heartRateVariability'], since: '2026-10-01T00:00:00.000Z', limit: Infinity })
    } finally {
      proto.getAll = orig
    }
    expect(records).toBe(20)
  })

  it('sans sous-types : comportement inchangé (toutes les entrées du type)', async () => {
    await upsertEntries(rows())
    const got = await listEntries({ type: 'heart_rate', since: '2026-10-10T00:00:00.000Z', limit: Infinity })
    expect(got).toHaveLength(144 * 2 + 3)
  })

  it('migration v3 → v4 : les données restent, l\'index [type, sous-type, at] est ajouté', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('HealthTrack', 3)
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore('health_entries', { keyPath: 'id', autoIncrement: true })
        store.createIndex('at', 'at', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('source', 'source', { unique: false })
        store.createIndex('source_at', ['source', 'at'], { unique: false })
        store.createIndex('type_at', ['type', 'at'], { unique: false })
        store.add({ type: 'heart_rate', source: 'old', payload: { subtype: 'restingHeartRate', value: 52 }, at: '2025-12-01T07:00:00.000Z', created_at: '2025-12-01T07:00:00.000Z' })
        store.add({ type: 'heart_rate', source: 'old', payload: { subtype: 'heartRate', value: 80 }, at: '2025-12-01T08:00:00.000Z', created_at: '2025-12-01T08:00:00.000Z' })
        store.add({ type: 'heart_rate', source: 'old', payload: null, at: '2025-12-01T09:00:00.000Z', created_at: '2025-12-01T09:00:00.000Z' })
      }
      req.onsuccess = () => {
        req.result.close()
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
    const got = await listEntries({ type: 'heart_rate', subtypes: ['restingHeartRate'], since: '2025-11-01T00:00:00.000Z', limit: Infinity })
    expect(got.map((e) => e.payload.value)).toEqual([52])
    expect(await countAllEntries()).toBe(3)
    const db = await new Promise((resolve) => {
      const req = indexedDB.open('HealthTrack')
      req.onsuccess = () => resolve(req.result)
    })
    expect(db.version).toBe(5)
    expect([...db.transaction('health_entries').objectStore('health_entries').indexNames]).toContain('type_subtype_at')
    expect([...db.objectStoreNames]).toContain('daily_aggregates')
    db.close()
  })
})

describe('countEntries (D2 performance)', () => {
  it("compte les entrées d'une plage sans lire leurs valeurs", async () => {
    await upsertEntries([
      { type: 'heart_rate', source: 'w', at: '2026-10-01T08:00:00.000Z', payload: { value: 60 } },
      { type: 'food', source: 'app', at: '2026-10-02T12:00:00.000Z', payload: {} },
      { type: 'steps', source: 'w', at: '2026-10-05T12:00:00.000Z', payload: { value: 10 } },
    ])
    const proto = globalThis.IDBIndex.prototype
    const orig = proto.getAll
    let reads = 0
    proto.getAll = function (...a) {
      reads++
      return orig.apply(this, a)
    }
    try {
      expect(await countEntries({ since: '2026-10-01T00:00:00.000Z', until: '2026-10-04T00:00:00.000Z' })).toBe(2)
      expect(await countEntries({ until: '2026-10-01T08:00:00.000Z' })).toBe(1)
      expect(await countEntries({ since: '2026-10-06T00:00:00.000Z' })).toBe(0)
      expect(await countEntries()).toBe(3)
    } finally {
      proto.getAll = orig
    }
    expect(reads).toBe(0)
  })

  it("compte un seul type par l'index [type, at], sans lire les valeurs", async () => {
    await upsertEntries([
      { type: 'wellbeing', source: 'app', at: '2026-09-01T20:00:00.000Z', payload: { score: 3 } },
      { type: 'wellbeing', source: 'app', at: '2026-10-03T20:00:00.000Z', payload: { score: 4 } },
      { type: 'heart_rate', source: 'w', at: '2026-09-01T08:00:00.000Z', payload: { value: 60 } },
    ])
    const proto = globalThis.IDBIndex.prototype
    const orig = proto.getAll
    let reads = 0
    proto.getAll = function (...a) {
      reads++
      return orig.apply(this, a)
    }
    try {
      expect(await countEntries({ type: 'wellbeing', until: '2026-10-01T00:00:00.000Z' })).toBe(1)
      expect(await countEntries({ type: 'wellbeing' })).toBe(2)
      expect(await countEntries({ type: 'food' })).toBe(0)
    } finally {
      proto.getAll = orig
    }
    expect(reads).toBe(0)
  })
})

describe('listEntriesForAnalysis par index (D2 performance)', () => {
  it('garde les N plus récents par type sans relire toute la base', async () => {
    // 'sleep' est plafonné à 500 : 530 nuits, dont des doublons d'heure à la limite
    const rows = []
    for (let i = 0; i < 530; i++) {
      const d = new Date(Date.UTC(2024, 0, 1) + Math.floor(i / 2) * 86400000).toISOString()
      rows.push({ type: 'sleep', source: i % 2 ? 'a' : 'b', at: d, payload: { i } })
    }
    rows.push({ type: 'wellbeing', source: 'app', at: '2025-01-01T08:00:00.000Z', payload: {} })
    rows.push({ type: 'nouveau_type', source: 'x', at: '2025-01-02T08:00:00.000Z', payload: {} })
    await upsertEntries(rows)

    const proto = globalThis.IDBObjectStore.prototype
    const orig = proto.getAll
    let fullReads = 0
    proto.getAll = function (...a) {
      if (this.name === 'health_entries') fullReads++ // le petit magasin d'agrégats, lui, se lit en entier
      return orig.apply(this, a)
    }
    let got
    try {
      got = await listEntriesForAnalysis()
    } finally {
      proto.getAll = orig
    }
    expect(fullReads).toBe(0)

    const sleep = got.filter((e) => e.type === 'sleep')
    expect(sleep).toHaveLength(500)
    const want = rows.filter((e) => e.type === 'sleep').map((e) => e.at).sort().reverse().slice(0, 500)
    expect(sleep.map((e) => e.at)).toEqual(want)
    expect(got.filter((e) => e.type === 'wellbeing')).toHaveLength(1)
    expect(got.filter((e) => e.type === 'nouveau_type')).toHaveLength(1)
  })
})

describe('listEntriesForAnalysis : fréquence cardiaque par sous-type', () => {
  // Insertion directe en une transaction (upsertEntries est trop lent sous fake-indexeddb pour ~6 000 lignes)
  const addRaw = async (rows) => {
    await countAllEntries() // crée la base au bon schéma
    const db = await new Promise((res, rej) => {
      const req = indexedDB.open('HealthTrack')
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
    await new Promise((res, rej) => {
      const tx = db.transaction('health_entries', 'readwrite')
      for (const r of rows) tx.objectStore('health_entries').add({ ...r, created_at: r.at })
      tx.oncomplete = res
      tx.onerror = () => rej(tx.error)
    })
    db.close()
  }

  it("les tranches denses de la montre n'évincent pas la FC au repos ni la VFC", async () => {
    // Avant : un plafond commun de 5 000 par type ; 40 jours de tranches de 10 min (5 760) gardaient
    // 34 FC repos sur 40. Limites réduites ici (fake-indexeddb parcourt les curseurs en temps quadratique).
    const saved = ANALYSIS_LIMITS.subtypes.heart_rate
    ANALYSIS_LIMITS.subtypes.heart_rate = { heartRate: 300, '*': 100 }
    try {
      // Une tranche de FC toutes les 10 min (144 / jour) sur 4 jours, une FC repos et une VFC par jour sur 40 jours
      const rows = []
      const t0 = Date.UTC(2026, 8, 1)
      const tz = Date.UTC(2026, 9, 7)
      for (let i = 0; i < 4 * 144; i++) {
        rows.push({ type: 'heart_rate', source: 'watch', at: new Date(tz + i * 600000).toISOString(), payload: { bpm: 70, subtype: 'heartRate' } })
      }
      for (let d = 0; d < 40; d++) {
        rows.push({ type: 'heart_rate', source: 'watch', at: new Date(t0 + d * 86400000 + 45000).toISOString(), payload: { bpm: 55, subtype: 'restingHeartRate' } })
        rows.push({ type: 'heart_rate', source: 'watch', at: new Date(t0 + d * 86400000 + 15000).toISOString(), payload: { value: 40, subtype: 'heartRateVariability' } })
      }
      await addRaw(rows)

      const got = await listEntriesForAnalysis()
      const count = (sub) => got.filter((e) => e.payload.subtype === sub).length
      expect(count('restingHeartRate')).toBe(40)
      expect(count('heartRateVariability')).toBe(40)
      // Les tranches de FC arrivent en moyennes horaires (agrégats journaliers) : 4 jours × 24 h, aucune perdue
      const hr = got.filter((e) => e.payload.subtype === 'heartRate')
      expect(hr).toHaveLength(96)
      expect(hr.every((e) => e.payload.bpm === 70 && e.payload.weight === 6)).toBe(true)
    } finally {
      ANALYSIS_LIMITS.subtypes.heart_rate = saved
    }
  })

  it("une FC sans sous-type (ignorée par le moteur d'analyse) n'est pas relue", async () => {
    await upsertEntries([
      { type: 'heart_rate', source: 'old', at: '2025-01-01T08:00:00.000Z', payload: { value: 72 } },
      { type: 'heart_rate', source: 'hc', at: '2026-01-01T08:00:00.000Z', payload: { bpm: 60, subtype: 'restingHeartRate' } },
    ])
    const got = await listEntriesForAnalysis()
    expect(got.map((e) => e.source)).toEqual(['hc'])
  })
})

describe('rewriteSourceEntries', () => {
  it('retire et ajoute en une transaction, sans toucher aux autres sources ni aux identifiants non listés', async () => {
    const { rewriteSourceEntries } = await import('./localHealthStorage')
    await upsertEntries([1, 2, 3, 4, 5].map((m) => ({ type: 'heart_rate', source: 'w', at: `2026-10-14T02:0${m}:30.000Z`, payload: { value: 90 + m } })))
    await upsertEntries([{ type: 'steps', source: 'other', at: '2026-10-14T02:03:00.000Z', payload: { value: 1 } }])
    const r = await rewriteSourceEntries('w', (entries) => ({
      remove: entries.filter((e) => e.payload.value !== 93).map((e) => e.id),
      add: [{ type: 'heart_rate', at: '2026-10-14T02:00:20.000Z', payload: { value: 92 } }, { type: 'heart_rate', at: '2026-10-14T02:03:30.000Z', payload: { value: 0 } }],
    }))
    // la 2e entrée ajoutée a la clé d'une entrée gardée : ignorée
    expect(r).toEqual({ removed: 4, added: 1 })
    const all = await listEntries({ limit: 100 })
    expect(all.map((e) => [e.source, e.at.slice(11, 19), e.payload.value]).sort()).toEqual([
      ['other', '02:03:00', 1],
      ['w', '02:00:20', 92],
      ['w', '02:03:30', 93],
    ])
  })
})

describe('listEntries avec limite : seuls les N plus récents sont lus (D2 performance)', () => {
  /** Compte les enregistrements désérialisés (getAll + curseurs), comme `npm run perf`. */
  async function countRead(fn) {
    let records = 0
    const restores = []
    for (const P of [globalThis.IDBObjectStore.prototype, globalThis.IDBIndex.prototype]) {
      const getAll = P.getAll
      P.getAll = function (...a) {
        const req = getAll.apply(this, a)
        req.addEventListener('success', () => { records += req.result.length })
        return req
      }
      restores.push(() => { P.getAll = getAll })
    }
    const cont = globalThis.IDBCursor.prototype.continue
    const open = globalThis.IDBIndex.prototype.openCursor
    globalThis.IDBIndex.prototype.openCursor = function (...a) {
      const req = open.apply(this, a)
      req.addEventListener('success', () => { if (req.result && !req._counted) { req._counted = true; records++ } })
      return req
    }
    globalThis.IDBCursor.prototype.continue = function (...a) {
      records++
      return cont.apply(this, a)
    }
    restores.push(() => {
      globalThis.IDBCursor.prototype.continue = cont
      globalThis.IDBIndex.prototype.openCursor = open
    })
    try {
      const result = await fn()
      return { result, records }
    } finally {
      restores.forEach((r) => r())
    }
  }

  const day = (i, h = 12) => new Date(Date.UTC(2025, 0, 1 + i, h)).toISOString()

  beforeEach(async () => {
    const rows = []
    for (let i = 0; i < 60; i++) {
      rows.push({ type: 'food', source: 'app', at: day(i), payload: { i } })
      rows.push({ type: 'steps', source: 'watch', at: day(i, 8), payload: { i } })
    }
    await upsertEntries(rows)
  })

  it('par type : les 5 plus récents, du plus récent au plus ancien, sans lire les 55 autres', async () => {
    const { result, records } = await countRead(() => listEntries({ type: 'food', limit: 5 }))
    expect(result.map((e) => e.payload.i)).toEqual([59, 58, 57, 56, 55])
    expect(records).toBeLessThanOrEqual(6)
  })

  it('par type et plage', async () => {
    const { result, records } = await countRead(() => listEntries({ type: 'food', until: day(30, 23), limit: 3 }))
    expect(result.map((e) => e.payload.i)).toEqual([30, 29, 28])
    expect(records).toBeLessThanOrEqual(4)
  })

  it('par source, et sans aucun filtre', async () => {
    const bySource = await countRead(() => listEntries({ source: 'watch', limit: 2 }))
    expect(bySource.result.map((e) => e.type + e.payload.i)).toEqual(['steps59', 'steps58'])
    expect(bySource.records).toBeLessThanOrEqual(3)
    const all = await countRead(() => listEntries({ limit: 3 }))
    expect(all.result.map((e) => e.type + e.payload.i)).toEqual(['food59', 'steps59', 'food58'])
    expect(all.records).toBeLessThanOrEqual(4)
  })

  it('type + source (non couvert par un index) : résultat inchangé', async () => {
    const r = await listEntries({ type: 'food', source: 'app', limit: 2 })
    expect(r.map((e) => e.payload.i)).toEqual([59, 58])
    expect(await listEntries({ type: 'food', source: 'watch', limit: 2 })).toEqual([])
  })

  it('limite infinie ou plus grande que les données : tout est rendu', async () => {
    expect((await listEntries({ type: 'food', limit: Infinity })).length).toBe(60)
    expect((await listEntries({ type: 'food', limit: 500 })).length).toBe(60)
  })
})
