import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { createEntry, exportToJson, importFromJson, countAllEntries } from '../storage/localHealthStorage'
import { getHiddenLinks, hideLink } from '../settings/hiddenLinks'
import { saveSnapshot } from './snapshot.js'

// Version iOS (HealthTrack-iOS, Android v752, I86 « Masquer ce lien ») : les liens masqués suivent l'export ; sur
// iPhone, la copie de secours (le même JSON que l'export, écrite au démarrage et à chaque passage en arrière-plan) les
// garde donc, et l'accueil qui la restaure (SnapshotWelcome, import « ajouter ») les remet, si iOS a repris la base
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  localStorage.clear()
})

describe('liens masqués et copie de secours de l’iPhone', () => {
  it('copie écrite, base et réglages repris par iOS, copie restaurée : les liens masqués reviennent', async () => {
    await createEntry({ type: 'food', source: 'app', payload: { name: 'pâtes' }, at: '2026-11-01T12:00:00Z' })
    hideLink('factor:cafe')
    const written = []
    const ok = await saveSnapshot({ countAllEntries, exportToJson, writeFile: vi.fn(async (_p, data) => written.push(data)) })
    expect(ok).toBe(true)
    expect(JSON.parse(written[0]).hiddenLinks).toEqual(['factor:cafe'])

    // iOS reprend le stockage de la WebView : base et localStorage vides
    globalThis.indexedDB = new IDBFactory()
    localStorage.clear()
    expect(getHiddenLinks()).toEqual([])

    const { imported } = await importFromJson(written[0], { merge: true })
    expect(imported).toBe(1)
    expect(getHiddenLinks()).toEqual(['factor:cafe'])
  })

  it('copie d’avant v752 (sans liens masqués) : restaurée sans rien masquer', async () => {
    const old = JSON.stringify({ version: 1, exportedAt: '2026-11-01T00:00:00Z', entries: [{ id: 'a', type: 'food', source: 'app', payload: { name: 'riz' }, at: '2026-11-01T12:00:00Z' }] })
    const { imported } = await importFromJson(old, { merge: true })
    expect(imported).toBe(1)
    expect(getHiddenLinks()).toEqual([])
  })
})
