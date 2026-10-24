import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { createEntry, countAllEntries } from '../storage/localHealthStorage'
import { getDataRevision } from '../storage/dataRevision'
import { deleteAllMyData, DELETED_KEYS, KEPT_KEYS } from './deleteAllData'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  localStorage.clear()
  sessionStorage.clear()
})

describe('deleteAllMyData (VC-10)', () => {
  it('efface les entrées, le profil et les caches qui contiennent des données de santé', async () => {
    await createEntry({ type: 'food', source: 'app', payload: { name: 'pâtes' }, at: '2026-10-01T12:00:00Z' })
    for (const k of DELETED_KEYS) localStorage.setItem(k, '{"x":1}')
    sessionStorage.setItem('healthtrack-wellbeing-prompt-session', '1')
    const before = getDataRevision()

    const { entries } = await deleteAllMyData()

    expect(entries).toBe(1)
    expect(await countAllEntries()).toBe(0)
    for (const k of DELETED_KEYS) expect(localStorage.getItem(k)).toBeNull()
    expect(sessionStorage.getItem('healthtrack-wellbeing-prompt-session')).toBeNull()
    expect(getDataRevision()).not.toBe(before)
  })

  it('garde les réglages qui reflètent un état d’Android, l’abonnement et l’appairage de la montre', async () => {
    for (const k of KEPT_KEYS) localStorage.setItem(k, 'garde')
    await deleteAllMyData()
    for (const k of KEPT_KEYS) expect(localStorage.getItem(k)).toBe('garde')
  })

  it('aucune clé n’est à la fois effacée et gardée ; le profil fait partie des effacées', () => {
    expect(DELETED_KEYS.filter((k) => KEPT_KEYS.includes(k))).toEqual([])
    expect(DELETED_KEYS).toContain('healthtrack_body_profile')
    expect(DELETED_KEYS).toContain('healthtrack-analysis-cache-v1')
  })

  it('prévient les pages ouvertes', async () => {
    const spy = vi.fn()
    window.addEventListener('health-entries-updated', spy)
    await deleteAllMyData()
    window.removeEventListener('health-entries-updated', spy)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
