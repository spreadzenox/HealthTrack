import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { loadFiche, saveFiche, resetFiche, onFicheChange, getFicheCache, __resetFicheCacheForTests } from './fiche'
import { tirer } from './traits'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  __resetFicheCacheForTests()
})

describe('fiche de Pilou gardée sur le téléphone', () => {
  it('sans fiche : Pilou d’origine (null)', async () => {
    expect(await loadFiche()).toBeNull()
    expect(getFicheCache()).toBeNull()
  })

  it('garde, relit et efface la fiche', async () => {
    const f = tirer(7)
    const seen = []
    onFicheChange((x) => seen.push(x))
    await saveFiche({ ...f, age: 40 })
    __resetFicheCacheForTests()
    const relue = await loadFiche()
    expect(relue).toEqual(f)
    expect(relue.age).toBeUndefined()
    await resetFiche()
    __resetFicheCacheForTests()
    expect(await loadFiche()).toBeNull()
  })

  it('prévient les abonnés', async () => {
    const seen = []
    onFicheChange((x) => seen.push(x))
    await saveFiche(tirer(3))
    await resetFiche()
    expect(seen).toHaveLength(2)
    expect(seen[1]).toBeNull()
  })

  it('une base d’avant la refonte reste intacte (base des saisies v5, pas de base compagnon)', async () => {
    // une installation d'avant la refonte : la base des saisies existe, en v5, avec une saisie
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('HealthTrack', 5)
      req.onupgradeneeded = (e) => {
        const s = e.target.result.createObjectStore('health_entries', { keyPath: 'id', autoIncrement: true })
        s.add({ type: 'food', source: 'manual', at: '2026-11-01T12:00:00.000Z', payload: {} })
      }
      req.onsuccess = () => { req.result.close(); resolve() }
      req.onerror = () => reject(req.error)
    })
    expect(await loadFiche()).toBeNull()
    await saveFiche(tirer(1))
    const { version, count } = await new Promise((resolve, reject) => {
      const req = indexedDB.open('HealthTrack')
      req.onsuccess = () => {
        const db = req.result
        const c = db.transaction('health_entries').objectStore('health_entries').count()
        c.onsuccess = () => { resolve({ version: db.version, count: c.result }); db.close() }
      }
      req.onerror = () => reject(req.error)
    })
    expect(version).toBe(5)
    expect(count).toBe(1)
  })
})

describe('fiche de traits sur le bus du compagnon (contrat § 4)', () => {
  it('émet « traits:changed » à l’enregistrement, à la remise à zéro et à la première lecture', async () => {
    const { bus, EVENTS } = await import('../bus')
    bus.clear()
    const seen = []
    bus.on(EVENTS.TRAITS_CHANGED, (p) => seen.push(p.fiche))
    const f = await saveFiche(tirer(5))
    __resetFicheCacheForTests()
    await loadFiche()
    await resetFiche()
    expect(seen).toEqual([f, f, null])
    bus.clear()
  })
})
