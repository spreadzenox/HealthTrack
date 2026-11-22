import { describe, it, expect, vi } from 'vitest'
import { SNAPSHOT_FILE, SNAPSHOT_DIR, SNAPSHOT_PATH, saveSnapshot, installSnapshots } from './snapshot.js'

// Version iOS (HealthTrack-iOS) : IndexedDB n'est pas durable dans WKWebView (iOS peut le reprendre quand le
// téléphone manque de place) ; une copie de secours, le même JSON que l'export, est tenue à jour dans le dossier
// « Copie de secours » de Documents, exclu de la sauvegarde iCloud (directive 5.1.3 (ii), décision du 1/11)
function deps(overrides = {}) {
  return {
    countAllEntries: vi.fn(async () => 12),
    exportToJson: vi.fn(async () => '{"entries":[1]}'),
    writeFile: vi.fn(async () => ({})),
    ...overrides,
  }
}

describe('copie de secours de la base sur iPhone', () => {
  it('écrit le même JSON que l’export dans le dossier « Copie de secours », exclu de la sauvegarde iCloud', async () => {
    const d = deps()
    expect(await saveSnapshot(d)).toBe(true)
    expect(d.writeFile).toHaveBeenCalledWith(SNAPSHOT_PATH, '{"entries":[1]}')
    expect(SNAPSHOT_PATH).toBe('Copie de secours/Halcya-copie-de-secours.json')
  })

  it('l’ancienne copie de la racine (dans la sauvegarde iCloud) n’est retirée qu’après l’écriture de la nouvelle', async () => {
    const order = []
    const d = deps({
      writeFile: vi.fn(async () => order.push('écrite')),
      removeLegacy: vi.fn(async () => order.push('ancienne retirée')),
    })
    expect(await saveSnapshot(d)).toBe(true)
    expect(order).toEqual(['écrite', 'ancienne retirée'])
  })

  // Visite guidée d'Android (ACC-8, v918) : pendant « Voir un exemple », les lectures de la base rendent des données
  // fictives (`countAllEntries` compte l'exemple) mais l'export lit la vraie base : sans garde, une installation
  // restaurée (base vide, copie trouvée) passée en arrière-plan pendant l'exemple écraserait sa copie par une base vide
  it('jamais pendant l’exemple de la visite guidée : la copie existante reste intacte', async () => {
    const d = deps({ isExampleMode: () => true, removeLegacy: vi.fn() })
    expect(await saveSnapshot(d)).toBe(false)
    expect(d.exportToJson).not.toHaveBeenCalled()
    expect(d.writeFile).not.toHaveBeenCalled()
    expect(d.removeLegacy).not.toHaveBeenCalled()
  })

  it('nouvelle copie non écrite : l’ancienne reste (jamais aucune copie)', async () => {
    const d = deps({ writeFile: vi.fn(async () => { throw new Error('disque plein') }), removeLegacy: vi.fn() })
    expect(await saveSnapshot(d)).toBe(false)
    expect(d.removeLegacy).not.toHaveBeenCalled()
  })

  it('l’ancienne copie ne se retire pas : la nouvelle compte quand même, l’essai suivant la retirera', async () => {
    const d = deps({ removeLegacy: vi.fn(async () => { throw new Error('verrouillé') }) })
    expect(await saveSnapshot(d)).toBe(true)
  })

  it('base vide : n’écrase jamais une copie existante (la base a peut-être été effacée par iOS)', async () => {
    const d = deps({ countAllEntries: vi.fn(async () => 0) })
    expect(await saveSnapshot(d)).toBe(false)
    expect(d.exportToJson).not.toHaveBeenCalled()
    expect(d.writeFile).not.toHaveBeenCalled()
  })

  it('une erreur ne remonte jamais', async () => {
    const d = deps({ writeFile: vi.fn(async () => { throw new Error('disque plein') }) })
    expect(await saveSnapshot(d)).toBe(false)
  })

  it('dans l’app iPhone : demande le stockage persistant, copie au démarrage et à chaque passage en arrière-plan', async () => {
    const listeners = {}
    const d = deps({
      platform: 'ios',
      persist: vi.fn(async () => false),
      addAppStateListener: vi.fn((fn) => { listeners.state = fn }),
      wait: async () => {},
    })
    await installSnapshots(d)
    expect(d.persist).toHaveBeenCalled()
    expect(d.writeFile).toHaveBeenCalledTimes(1)
    await listeners.state({ isActive: true })
    expect(d.writeFile).toHaveBeenCalledTimes(1)
    await listeners.state({ isActive: false })
    expect(d.writeFile).toHaveBeenCalledTimes(2)
  })

  it('ailleurs que dans l’app iPhone : rien', async () => {
    const d = deps({ platform: 'android', persist: vi.fn(), addAppStateListener: vi.fn(), wait: async () => {} })
    await installSnapshots(d)
    expect(d.persist).not.toHaveBeenCalled()
    expect(d.addAppStateListener).not.toHaveBeenCalled()
    expect(d.writeFile).not.toHaveBeenCalled()
  })
})

/** Documents simulé : `{ dossier: [{ name, mtime }] }` ; un dossier absent fait échouer `list`, comme Capacitor. */
function documents(tree) {
  return {
    list: vi.fn(async (dir) => {
      if (!(dir in tree)) throw new Error('dossier absent')
      return tree[dir]
    }),
    readFile: vi.fn(async (path) => ({ data: `contenu de ${path}` })),
    deleteFile: vi.fn(async () => {}),
  }
}

describe('lecture de la copie de secours', () => {
  it('rend son contenu et sa date, trouvés dans le dossier « Copie de secours »', async () => {
    const { readSnapshot } = await import('./snapshot.js')
    const fs = documents({ '': [{ name: 'autre.json', mtime: 1 }, { name: SNAPSHOT_DIR, mtime: 1 }], [SNAPSHOT_DIR]: [{ name: SNAPSHOT_FILE, mtime: Date.parse('2026-11-01T10:00:00Z') }] })
    expect(await readSnapshot(fs)).toEqual({ text: `contenu de ${SNAPSHOT_PATH}`, savedAt: '2026-11-01T10:00:00.000Z' })
  })

  it('iPhone mis à jour depuis une version d’avant le 1/11 : l’ancienne copie de la racine est lue', async () => {
    const { readSnapshot } = await import('./snapshot.js')
    const fs = documents({ '': [{ name: SNAPSHOT_FILE, mtime: Date.parse('2026-10-27T10:00:00Z') }] })
    expect(await readSnapshot(fs)).toEqual({ text: `contenu de ${SNAPSHOT_FILE}`, savedAt: '2026-10-27T10:00:00.000Z' })
  })

  it('les deux : la copie du dossier exclu, la plus récente, passe d’abord', async () => {
    const { readSnapshot } = await import('./snapshot.js')
    const fs = documents({ '': [{ name: SNAPSHOT_FILE, mtime: 1 }], [SNAPSHOT_DIR]: [{ name: SNAPSHOT_FILE, mtime: 2 }] })
    expect((await readSnapshot(fs)).text).toBe(`contenu de ${SNAPSHOT_PATH}`)
  })

  it('pas de copie : null, sans lire de fichier absent (Capacitor l’écrirait en erreur dans la console)', async () => {
    const { readSnapshot } = await import('./snapshot.js')
    const fs = documents({ '': [{ name: 'capture', mtime: 1 }], [SNAPSHOT_DIR]: [] })
    expect(await readSnapshot(fs)).toBeNull()
    expect(fs.readFile).not.toHaveBeenCalled()
  })

  it('l’ancienne copie se retire de la racine, et elle seule', async () => {
    const { removeLegacySnapshot } = await import('./snapshot.js')
    const fs = documents({ '': [{ name: 'Halcya-sauvegarde-2026-10-28.json', mtime: 1 }, { name: SNAPSHOT_FILE, mtime: 2 }] })
    expect(await removeLegacySnapshot(fs)).toBe(true)
    expect(fs.deleteFile).toHaveBeenCalledTimes(1)
    expect(fs.deleteFile).toHaveBeenCalledWith(SNAPSHOT_FILE)
    expect(await removeLegacySnapshot(documents({ '': [] }))).toBe(false)
  })
})

describe('« Supprimer toutes mes données » efface aussi la copie de secours', () => {
  it('efface la copie du dossier exclu et l’ancienne de la racine, et elles seules (une sauvegarde exportée reste à la personne)', async () => {
    const { deleteSnapshot } = await import('./snapshot.js')
    const fs = documents({
      '': [{ name: 'Halcya-sauvegarde-2026-10-28.json', mtime: 1 }, { name: SNAPSHOT_FILE, mtime: 2 }],
      [SNAPSHOT_DIR]: [{ name: SNAPSHOT_FILE, mtime: 3 }],
    })
    expect(await deleteSnapshot(fs)).toBe(true)
    expect(fs.deleteFile.mock.calls.map((c) => c[0])).toEqual([SNAPSHOT_PATH, SNAPSHOT_FILE])
  })

  it('pas de copie : rien à effacer, sans toucher à un fichier absent', async () => {
    const { deleteSnapshot } = await import('./snapshot.js')
    const fs = documents({ '': [] })
    expect(await deleteSnapshot(fs)).toBe(false)
    expect(fs.deleteFile).not.toHaveBeenCalled()
  })

  it('une erreur ne remonte jamais, et l’autre emplacement est quand même effacé', async () => {
    const { deleteSnapshot } = await import('./snapshot.js')
    const fs = documents({ '': [{ name: SNAPSHOT_FILE, mtime: 1 }], [SNAPSHOT_DIR]: [{ name: SNAPSHOT_FILE, mtime: 1 }] })
    fs.deleteFile.mockImplementationOnce(async () => { throw new Error('verrouillé') })
    expect(await deleteSnapshot(fs)).toBe(true)
    expect(fs.deleteFile).toHaveBeenCalledTimes(2)
    const locked = documents({ [SNAPSHOT_DIR]: [{ name: SNAPSHOT_FILE, mtime: 1 }] })
    locked.deleteFile.mockImplementation(async () => { throw new Error('verrouillé') })
    expect(await deleteSnapshot(locked)).toBe(false)
  })

  it('ailleurs que dans l’app iPhone : rien', async () => {
    const { deleteDeviceSnapshot } = await import('./snapshot.js')
    expect(await deleteDeviceSnapshot()).toBe(false)
  })
})

function memory(initial = {}) {
  const data = { ...initial }
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => (data[k] = String(v)), data }
}

describe('réglages dans la copie de secours (ce que la sauvegarde Android ramène et iCloud non)', () => {
  it('la copie garde les réglages de la liste, jamais un secret ni un état propre au téléphone', async () => {
    const storage = memory({
      healthtrack_theme: 'dark',
      healthtrack_evening_note: '{"enabled":true,"minute":1260}',
      healthtrack_withings_tokens: '{"access":"secret"}',
      halcya_purchase_token: 'jeton',
      halcya_device_marker: 'repère',
    })
    const d = deps({ storage })
    expect(await saveSnapshot(d)).toBe(true)
    const written = JSON.parse(d.writeFile.mock.calls[0][1])
    expect(written.entries).toEqual([1])
    expect(written.iosSettings).toEqual({ healthtrack_theme: 'dark', healthtrack_evening_note: '{"enabled":true,"minute":1260}' })
  })

  it('sans réglage, la copie reste exactement le JSON de l’export', async () => {
    const d = deps({ storage: memory({ healthtrack_withings_tokens: 'secret' }) })
    await saveSnapshot(d)
    expect(d.writeFile).toHaveBeenCalledWith(SNAPSHOT_PATH, '{"entries":[1]}')
  })

  it('à la reprise, seuls les réglages de la liste sont rétablis, même si le fichier en contient d’autres', async () => {
    const { restoreSnapshotSettings, SNAPSHOT_SETTINGS } = await import('./snapshot.js')
    const storage = memory({ healthtrack_theme: 'light' })
    const text = JSON.stringify({
      entries: [],
      iosSettings: { healthtrack_theme: 'dark', healthtrack_weather: '{"city":"Lyon"}', healthtrack_withings_tokens: 'volé' },
    })
    expect(restoreSnapshotSettings(text, storage)).toEqual(['healthtrack_theme', 'healthtrack_weather'])
    expect(storage.data).toEqual({ healthtrack_theme: 'dark', healthtrack_weather: '{"city":"Lyon"}' })
    expect(SNAPSHOT_SETTINGS).not.toContain('halcya_install_id')
  })

  it('l’heure choisie pour le rappel du soir suit la copie (Android v855)', async () => {
    const { restoreSnapshotSettings } = await import('./snapshot.js')
    const storage = memory({})
    const text = JSON.stringify({ entries: [], iosSettings: { healthtrack_evening_note_minute: '1230' } })
    expect(restoreSnapshotSettings(text, storage)).toEqual(['healthtrack_evening_note_minute'])
    expect(storage.data).toEqual({ healthtrack_evening_note_minute: '1230' })
  })

  it('un export ordinaire ou un fichier illisible : rien n’est touché', async () => {
    const { restoreSnapshotSettings } = await import('./snapshot.js')
    const storage = memory({ healthtrack_theme: 'light' })
    expect(restoreSnapshotSettings('{"entries":[]}', storage)).toEqual([])
    expect(restoreSnapshotSettings('pas du json', storage)).toEqual([])
    expect(storage.data).toEqual({ healthtrack_theme: 'light' })
  })
})

describe('la copie avec ses réglages reste une sauvegarde valide', () => {
  it('l’import (le même sur Android) ignore le champ iosSettings', async () => {
    const { parseBackup } = await import('../storage/localHealthStorage')
    const text = JSON.stringify({
      version: 1,
      entries: [{ type: 'food', source: 'app', at: '2026-10-01T12:00:00Z', payload: { name: 'pâtes' } }],
      iosSettings: { healthtrack_theme: 'dark' },
    })
    expect(parseBackup(text)).toMatchObject({ entries: [expect.objectContaining({ type: 'food' })], invalid: 0 })
  })
})
