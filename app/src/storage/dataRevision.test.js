import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { getDataRevision, bumpDataRevision, isDataRevisionPersistent } from './dataRevision'
import { createEntry, upsertEntries, updateEntry, deleteEntry, importFromJson, exportToJson, listEntries } from './localHealthStorage'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  localStorage.clear()
})

describe('dataRevision', () => {
  it('part de 0 et augmente à chaque bump, en survivant dans localStorage', () => {
    expect(getDataRevision()).toBe(0)
    expect(bumpDataRevision()).toBe(1)
    expect(getDataRevision()).toBe(1)
    expect(localStorage.getItem('healthtrack-data-revision')).toBe('1')
    expect(isDataRevisionPersistent()).toBe(true)
  })

  it('chaque écriture dans la base change la révision', async () => {
    let r = getDataRevision()
    const changed = () => {
      const now = getDataRevision()
      const moved = now !== r
      r = now
      return moved
    }
    const id = await createEntry({ type: 'wellbeing', source: 'app_wellbeing', payload: { score: 3 } })
    expect(changed()).toBe(true)
    await upsertEntries([{ type: 'steps', source: 'x', at: '2026-10-01T10:00:00.000Z', payload: { count: 10 } }])
    expect(changed()).toBe(true)
    await updateEntry(id, { payload: { score: 4 } })
    expect(changed()).toBe(true)
    const json = await exportToJson()
    await deleteEntry(id)
    expect(changed()).toBe(true)
    await importFromJson(json)
    expect(changed()).toBe(true)
  })

  it("ne bouge pas quand rien n'est écrit (doublons, lecture)", async () => {
    const e = { type: 'steps', source: 'x', at: '2026-10-01T10:00:00.000Z', payload: { count: 10 } }
    await upsertEntries([e])
    const r = getDataRevision()
    await upsertEntries([e])
    await listEntries({ type: 'steps' })
    expect(getDataRevision()).toBe(r)
  })
})
