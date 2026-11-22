import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { deleteDeviceSnapshot, readDeviceSnapshot } from './snapshot.js'
import SnapshotRestore from './SnapshotRestore'
import SnapshotWelcome from './SnapshotWelcome'

// FUSION-3 (correctifs 11, 12, 22 et 23 fondus) : la copie de secours vit dans le code commun ; Sauvegarde, l'accueil
// et « Supprimer toutes mes données » l'appellent partout. Hors de l'app iPhone, aucune copie n'est lue ni effacée,
// et rien ne s'affiche.
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true, getPlatform: () => 'android' } }))
const readdir = vi.fn()
const deleteFile = vi.fn()
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { readdir: (...a) => readdir(...a), deleteFile: (...a) => deleteFile(...a), readFile: vi.fn() },
  Directory: { Documents: 'DOCUMENTS' },
  Encoding: { UTF8: 'utf8' },
}))

afterEach(() => vi.clearAllMocks())

describe('copie de secours hors iPhone (Android)', () => {
  it('lecture : null, sans toucher au système de fichiers', async () => {
    expect(await readDeviceSnapshot()).toBeNull()
    expect(readdir).not.toHaveBeenCalled()
  })

  it('effacement : rien d’effacé', async () => {
    expect(await deleteDeviceSnapshot()).toBe(false)
    expect(deleteFile).not.toHaveBeenCalled()
  })

  it('Sauvegarde et accueil : aucun bouton ni encart', async () => {
    const restore = render(<SnapshotRestore onChoose={vi.fn()} />)
    const welcome = render(<SnapshotWelcome />)
    await new Promise((r) => setTimeout(r, 0))
    expect(restore.container).toBeEmptyDOMElement()
    expect(welcome.container).toBeEmptyDOMElement()
  })
})
