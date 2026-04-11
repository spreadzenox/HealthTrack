import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Data from './Data'

vi.mock('../storage/localHealthStorage', () => ({
  exportToJson: vi.fn(),
  importFromJson: vi.fn(),
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
