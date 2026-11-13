import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Version iOS (HealthTrack-iOS) : dans l'app iPhone, la sauvegarde va dans Documents puis la feuille de partage
// (le lien de téléchargement ne fait rien dans WKWebView)
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})
vi.mock('@capacitor/core', async (importOriginal) => ({
  ...(await importOriginal()),
  Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' },
}))
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: vi.fn().mockResolvedValue({ uri: 'file:///Documents/sauvegarde.json' }),
    readdir: vi.fn().mockResolvedValue({ files: [] }),
    readFile: vi.fn(),
  },
  Directory: { Documents: 'DOCUMENTS' },
  Encoding: { UTF8: 'utf8' },
}))
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn().mockResolvedValue({}) } }))
vi.mock('../storage/localHealthStorage', () => ({
  exportToJson: vi.fn().mockResolvedValue('{"entries":[]}'), importFromJson: vi.fn(), parseBackup: vi.fn(), countAllEntries: vi.fn(async () => 0),
}))
vi.mock('../components/DoctorReportCard', () => ({ default: () => null }))
vi.mock('../services/deleteAllData', () => ({ deleteAllMyData: vi.fn() }))

import { Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { parseBackup, countAllEntries } from '../storage/localHealthStorage'
import Data from './Data'

describe('Sauvegarde sur iPhone', () => {
  it('écrit le fichier dans Documents, ouvre la feuille de partage et dit où le retrouver', async () => {
    render(<MemoryRouter><Data /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Télécharger la sauvegarde/ }))
    expect(await screen.findByText(/est aussi dans l’app Fichiers › Sur mon iPhone › Halcya/)).toBeInTheDocument()
    expect(Filesystem.writeFile).toHaveBeenCalledWith(expect.objectContaining({ directory: 'DOCUMENTS' }))
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///Documents/sauvegarde.json'] }))
  })
})

describe('Restauration de la copie de secours sur iPhone', () => {
  it('la copie passe par le même aperçu que « Importer »', async () => {
    Filesystem.readdir.mockResolvedValue({ files: [{ name: 'Halcya-copie-de-secours.json', mtime: Date.now() - 2 * 3600 * 1000 }] })
    Filesystem.readFile.mockResolvedValue({ data: '{"copie":true}' })
    parseBackup.mockReturnValue({
      entries: [{}, {}], invalid: 0, exportedAt: null, firstAt: '2026-10-01T08:00:00Z', lastAt: '2026-10-27T08:00:00Z',
      byType: { food: 1, steps: 1 },
    })
    render(<MemoryRouter><Data /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Restaurer la copie de secours (il y a 2 h)' }))
    expect(await screen.findByText('Halcya-copie-de-secours.json')).toBeInTheDocument()
    expect(parseBackup).toHaveBeenCalledWith('{"copie":true}')
  })
})

// Android v999 (#920) disait « rangé dans Documents » sous le bouton (dossier absent de l'app Fichiers ; correctif 62).
// Android v1019 (#941) : « Un fichier JSON, à garder en lieu sûr. », l'endroit n'est dit qu'une fois, après l'export
// (sur iPhone : « … est aussi dans l'app Fichiers › Sur mon iPhone › Halcya. », correctif 09) ; correctif 62 retiré
describe('Où retrouver la sauvegarde sur iPhone', () => {
  it('la ligne sous le bouton ne nomme aucun dossier, jamais « Documents »', async () => {
    countAllEntries.mockResolvedValue(12)
    render(<MemoryRouter><Data /></MemoryRouter>)
    expect(await screen.findByText('Un fichier JSON, à garder en lieu sûr.')).toBeInTheDocument()
    expect(screen.queryByText(/rangé dans Documents/)).toBeNull()
  })
})
