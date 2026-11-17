import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { exportToJson, importFromJson, parseBackup, listEntries } from '../../storage/localHealthStorage'
import { loadFiche, saveFiche, __resetFicheCacheForTests } from './fiche'
import { tirer } from './traits'

const entry = { type: 'food', source: 'manual', at: '2026-11-10T12:00:00.000Z', payload: { name: 'Soupe' } }

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  __resetFicheCacheForTests()
  localStorage.clear()
})

describe('fiche de Pilou dans la sauvegarde JSON (étape 14)', () => {
  it('pas de fiche : pas de champ « pilou » dans l’export', async () => {
    expect(JSON.parse(await exportToJson())).not.toHaveProperty('pilou')
  })

  it('exporte la fiche et la restaure à l’import (remplacer)', async () => {
    const f = tirer(11)
    await saveFiche(f)
    const json = await exportToJson()
    expect(JSON.parse(json).pilou).toEqual(f)
    globalThis.indexedDB = new IDBFactory()
    __resetFicheCacheForTests()
    await importFromJson(JSON.stringify({ ...JSON.parse(json), entries: [entry] }))
    __resetFicheCacheForTests()
    expect(await loadFiche()).toEqual(f)
  })

  it('un ancien fichier sans fiche ne change pas la fiche de l’appareil', async () => {
    const f = tirer(12)
    await saveFiche(f)
    await importFromJson(JSON.stringify({ version: 1, entries: [entry] }))
    expect(await listEntries({ type: 'food' })).toHaveLength(1)
    __resetFicheCacheForTests()
    expect(await loadFiche()).toEqual(f)
    expect(parseBackup(JSON.stringify([entry])).pilou).toBeNull()
  })

  it('à l’ajout, la fiche de l’appareil prime ; sans fiche, celle du fichier est prise', async () => {
    const mienne = tirer(13), autre = tirer(14)
    await saveFiche(mienne)
    await importFromJson(JSON.stringify({ version: 1, entries: [entry], pilou: autre }), { merge: true })
    expect(await loadFiche()).toEqual(mienne)
    globalThis.indexedDB = new IDBFactory()
    __resetFicheCacheForTests()
    await importFromJson(JSON.stringify({ version: 1, entries: [entry], pilou: autre }), { merge: true })
    expect(await loadFiche()).toEqual(autre)
  })

  it('une fiche de sauvegarde trafiquée est nettoyée (aucun champ hors schéma)', async () => {
    const { pilou } = parseBackup(JSON.stringify({ version: 1, entries: [entry], pilou: { ...tirer(15), age: 30, genre: 'x' } }))
    expect(pilou.age).toBeUndefined()
    expect(pilou.genre).toBeUndefined()
  })
})
