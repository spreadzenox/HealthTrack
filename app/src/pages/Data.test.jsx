import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Data from './Data'

vi.mock('../storage/localHealthStorage', () => ({
  exportToJson: vi.fn(),
  importFromJson: vi.fn(),
  parseBackup: vi.fn(),
  countAllEntries: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => 'web'),
  },
}))

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: vi.fn().mockResolvedValue({}) },
  Directory: { Documents: 'DOCUMENTS' },
}))

function renderData() {
  return render(
    <BrowserRouter>
      <Data />
    </BrowserRouter>
  )
}

describe('Data page — export (web)', () => {
  let createObjectURLSpy, revokeObjectURLSpy, anchorClickSpy, capturedAnchor

  beforeEach(async () => {
    const { exportToJson } = await import('../storage/localHealthStorage')
    exportToJson.mockResolvedValue('{"version":1,"entries":[]}')

    // Ensure Capacitor reports web
    const { Capacitor } = await import('@capacitor/core')
    Capacitor.isNativePlatform.mockReturnValue(false)
    Capacitor.getPlatform.mockReturnValue('web')

    // Intercept anchor creation so we can spy on .click() without breaking RTL
    anchorClickSpy = vi.fn()
    capturedAnchor = null
    const origCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreate(tag)
      if (tag === 'a') {
        capturedAnchor = el
        vi.spyOn(el, 'click').mockImplementation(anchorClickSpy)
      }
      return el
    })

    createObjectURLSpy = vi.fn(() => 'blob:fake-url')
    revokeObjectURLSpy = vi.fn()
    globalThis.URL.createObjectURL = createObjectURLSpy
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the export section and button', () => {
    renderData()
    expect(screen.getByText(/Exporter/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Télécharger la sauvegarde/i })).toBeInTheDocument()
  })

  it('clicking export creates a blob URL and triggers download via anchor click', async () => {
    renderData()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Télécharger la sauvegarde/i }))
    })
    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(anchorClickSpy).toHaveBeenCalled()
  })

  it('anchor has correct download filename', async () => {
    renderData()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Télécharger la sauvegarde/i }))
    })
    expect(capturedAnchor).not.toBeNull()
    expect(capturedAnchor.download).toMatch(/^healthtrack-export-\d{4}-\d{2}-\d{2}\.json$/)
    expect(capturedAnchor.href).toBe('blob:fake-url')
  })

  it('shows success status after export', async () => {
    renderData()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Télécharger la sauvegarde/i }))
    })
    expect(screen.getByText(/Téléchargement démarré/i)).toBeInTheDocument()
  })

  it('shows error status when exportToJson rejects', async () => {
    const { exportToJson } = await import('../storage/localHealthStorage')
    exportToJson.mockRejectedValueOnce(new Error('IDB failure'))
    renderData()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Télécharger la sauvegarde/i }))
    })
    expect(screen.getByText(/Erreur.*IDB failure/i)).toBeInTheDocument()
  })
})

describe('Data page — export (Android native)', () => {
  beforeEach(async () => {
    const { exportToJson } = await import('../storage/localHealthStorage')
    exportToJson.mockResolvedValue('{"version":1,"entries":[]}')

    const { Capacitor } = await import('@capacitor/core')
    Capacitor.isNativePlatform.mockReturnValue(true)
    Capacitor.getPlatform.mockReturnValue('android')

    const { Filesystem } = await import('@capacitor/filesystem')
    Filesystem.writeFile.mockClear()
    Filesystem.writeFile.mockResolvedValue({})
  })

  afterEach(async () => {
    const { Capacitor } = await import('@capacitor/core')
    Capacitor.isNativePlatform.mockReturnValue(false)
    Capacitor.getPlatform.mockReturnValue('web')
  })

  it('writes file to Documents directory on Android', async () => {
    renderData()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Télécharger la sauvegarde/i }))
    })
    const { Filesystem } = await import('@capacitor/filesystem')
    expect(Filesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        directory: 'DOCUMENTS',
      })
    )
  })

  it('saves file with a dated filename on Android', async () => {
    renderData()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Télécharger la sauvegarde/i }))
    })
    const { Filesystem } = await import('@capacitor/filesystem')
    expect(Filesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(/^healthtrack-export-\d{4}-\d{2}-\d{2}\.json$/),
      })
    )
  })

  it('shows Android-specific success message', async () => {
    renderData()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Télécharger la sauvegarde/i }))
    })
    expect(screen.getByText(/Documents de votre appareil/i)).toBeInTheDocument()
  })
})

describe('Data page — import (aperçu puis choix)', () => {
  const summary = {
    entries: new Array(3).fill({}),
    invalid: 0,
    exportedAt: '2026-10-01T10:00:00.000Z',
    firstAt: '2026-01-02T08:00:00Z',
    lastAt: '2026-09-30T12:00:00Z',
    byType: { food: 1, steps: 2 },
  }

  beforeEach(async () => {
    const storage = await import('../storage/localHealthStorage')
    storage.importFromJson.mockReset()
    storage.parseBackup.mockReset()
    storage.countAllEntries.mockReset()
    storage.parseBackup.mockReturnValue(summary)
    storage.countAllEntries.mockResolvedValue(10)
    storage.importFromJson.mockResolvedValue({ imported: 3, skipped: 0, invalid: 0 })
  })

  async function chooseFile() {
    renderData()
    const input = screen.getByLabelText(/Choisir un fichier de sauvegarde/i)
    const file = { name: 'healthtrack-export-2026-10-01.json', text: () => Promise.resolve('{"entries":[]}') }
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
    })
  }

  it('shows a preview of the backup without importing anything yet', async () => {
    const { importFromJson } = await import('../storage/localHealthStorage')
    await chooseFile()
    expect(screen.getByText(/3 entrées/)).toBeInTheDocument()
    expect(screen.getByText(/2 janv\. 2026/)).toBeInTheDocument()
    expect(screen.getByText(/30 sept\. 2026/)).toBeInTheDocument()
    expect(screen.getByText(/1 repas/)).toBeInTheDocument()
    expect(importFromJson).not.toHaveBeenCalled()
  })

  it('« Ajouter » merges with the current data', async () => {
    const { importFromJson } = await import('../storage/localHealthStorage')
    importFromJson.mockResolvedValue({ imported: 2, skipped: 1, invalid: 0 })
    await chooseFile()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ajouter à mes données/i }))
    })
    expect(importFromJson).toHaveBeenCalledWith('{"entries":[]}', { merge: true })
    expect(screen.getByText(/2 entrées ajoutées/)).toBeInTheDocument()
    expect(screen.getByText(/1 déjà présente/)).toBeInTheDocument()
  })

  it('« Remplacer » asks for a second confirmation mentioning current data', async () => {
    const { importFromJson } = await import('../storage/localHealthStorage')
    await chooseFile()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Remplacer mes données/i }))
    })
    expect(importFromJson).not.toHaveBeenCalled()
    expect(screen.getByText(/10 entrées actuelles seront supprimées/)).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Confirmer le remplacement/i }))
    })
    expect(importFromJson).toHaveBeenCalledWith('{"entries":[]}', { merge: false })
    expect(screen.getByText(/3 entrées importées/)).toBeInTheDocument()
  })

  it('« Annuler » closes the preview without importing', async () => {
    const { importFromJson } = await import('../storage/localHealthStorage')
    await chooseFile()
    fireEvent.click(screen.getByRole('button', { name: /^Annuler$/ }))
    expect(screen.queryByRole('button', { name: /Ajouter à mes données/i })).not.toBeInTheDocument()
    expect(importFromJson).not.toHaveBeenCalled()
  })

  it('shows an error and imports nothing when the file is not a backup', async () => {
    const { importFromJson, parseBackup } = await import('../storage/localHealthStorage')
    parseBackup.mockImplementation(() => {
      throw new Error("Ce fichier n'est pas une sauvegarde HealthTrack (aucune entrée reconnue).")
    })
    await chooseFile()
    expect(screen.getByText(/pas une sauvegarde HealthTrack/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ajouter à mes données/i })).not.toBeInTheDocument()
    expect(importFromJson).not.toHaveBeenCalled()
  })

  it('says when nothing new was added', async () => {
    const { importFromJson } = await import('../storage/localHealthStorage')
    importFromJson.mockResolvedValue({ imported: 0, skipped: 3, invalid: 0 })
    await chooseFile()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ajouter à mes données/i }))
    })
    expect(screen.getByText(/Aucune nouvelle entrée \(3 déjà présentes/)).toBeInTheDocument()
  })

  it('mentions unreadable entries that will be ignored', async () => {
    const { parseBackup } = await import('../storage/localHealthStorage')
    parseBackup.mockReturnValue({ ...summary, invalid: 2 })
    await chooseFile()
    expect(screen.getByText(/2 entrées illisibles seront ignorées/)).toBeInTheDocument()
  })
})
