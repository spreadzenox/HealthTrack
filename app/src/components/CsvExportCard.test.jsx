import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CsvExportCard from './CsvExportCard'

const exportToJson = vi.fn()
const saveTextFile = vi.fn()
vi.mock('../storage/localHealthStorage', () => ({ exportToJson: (...a) => exportToJson(...a) }))
vi.mock('../services/saveTextFile', () => ({ saveTextFile: (...a) => saveTextFile(...a) }))

const backup = JSON.stringify({
  version: 1,
  entries: [{ type: 'gut', source: 'app_gut', at: new Date(2026, 10, 21, 19, 5).toISOString(), payload: { level: 'calme' } }],
})

describe('CsvExportCard (EXPORT-CSV)', () => {
  beforeEach(() => {
    exportToJson.mockReset().mockResolvedValue(backup)
    saveTextFile.mockReset().mockResolvedValue({ saved: 'download', platform: 'web', shared: false })
  })

  it('dit ce que contient le fichier et que la sauvegarde JSON sert à restaurer', () => {
    render(<CsvExportCard />)
    expect(screen.getByRole('heading', { name: 'Exporter pour un tableur' })).toBeInTheDocument()
    expect(screen.getByText(/une ligne par saisie/)).toBeInTheDocument()
    expect(screen.getByText(/Pour restaurer vos données, gardez la sauvegarde/)).toBeInTheDocument()
  })

  it('enregistre un CSV de toutes les saisies et dit où le trouver', async () => {
    render(<CsvExportCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger en CSV' }))
    expect(await screen.findByText(/halcya-donnees-\d{4}-\d{2}-\d{2}\.csv téléchargé\./)).toBeInTheDocument()
    const [{ fileName, text, mime }] = saveTextFile.mock.calls[0]
    expect(fileName).toMatch(/^halcya-donnees-.*\.csv$/)
    expect(mime).toBe('text/csv')
    expect(text).toContain('2026-11-21;19:05;Digestion;gut;app_gut;;calme')
  })

  it('Android : « dans Documents » ; iPhone : « dans l’app Fichiers »', async () => {
    saveTextFile.mockResolvedValueOnce({ saved: 'documents', platform: 'android', shared: true })
    const { unmount } = render(<CsvExportCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger en CSV' }))
    expect(await screen.findByText(/\.csv est dans Documents \(app Fichiers › Documents\)\./)).toBeInTheDocument()
    unmount()
    saveTextFile.mockResolvedValueOnce({ saved: 'documents', platform: 'ios', shared: false })
    render(<CsvExportCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger en CSV' }))
    expect(await screen.findByText(/\.csv est aussi dans l’app Fichiers › Sur mon iPhone › Halcya\./)).toBeInTheDocument()
  })

  it('bouton grisé quand il n’y a rien à exporter', () => {
    render(<CsvExportCard disabled />)
    expect(screen.getByRole('button', { name: 'Télécharger en CSV' })).toBeDisabled()
  })

  it('une erreur s’affiche sans rien casser', async () => {
    exportToJson.mockRejectedValueOnce(new Error('base fermée'))
    render(<CsvExportCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger en CSV' }))
    expect(await screen.findByText('Erreur : base fermée')).toBeInTheDocument()
  })
})
