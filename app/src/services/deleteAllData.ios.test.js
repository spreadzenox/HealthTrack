import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { createEntry, countAllEntries } from '../storage/localHealthStorage'

// Version iOS (HealthTrack-iOS) : la copie de secours (overlay/app/src/ios/snapshot.js) contient toutes les entrées et
// le profil ; « Supprimer toutes mes données » l'efface aussi
const order = []
vi.mock('../ios/snapshot.js', () => ({
  deleteDeviceSnapshot: vi.fn(async () => {
    order.push(['copie', await countAllEntries()])
    return true
  }),
}))

const { deleteAllMyData } = await import('./deleteAllData')
const { deleteDeviceSnapshot } = await import('../ios/snapshot.js')

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  localStorage.clear()
  order.length = 0
})

describe('deleteAllMyData sur iPhone', () => {
  it('efface la copie de secours, après la base (une copie faite entre-temps ne trouverait rien à écrire)', async () => {
    await createEntry({ type: 'food', source: 'app', payload: { name: 'pâtes' }, at: '2026-10-01T12:00:00Z' })
    const { entries } = await deleteAllMyData()
    expect(entries).toBe(1)
    expect(deleteDeviceSnapshot).toHaveBeenCalledTimes(1)
    expect(order).toEqual([['copie', 0]])
  })
})
