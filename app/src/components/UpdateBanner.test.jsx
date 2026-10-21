import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

vi.mock('../services/updateCheck', () => ({
  CURRENT_VERSION: '187',
  isNewerVersion: (tag, cur) => parseInt(tag.slice(1), 10) > parseInt(cur, 10),
  fetchLatestRelease: vi.fn(async () => ({
    tag_name: 'v188',
    html_url: 'https://github.com/spreadzenox/HealthTrack/releases/tag/v188',
    assets: [
      {
        name: 'HealthTrack-v188.apk',
        size: 33_562_556,
        digest: 'sha256:' + 'a'.repeat(64),
        browser_download_url: 'https://github.com/spreadzenox/HealthTrack/releases/download/v188/HealthTrack-v188.apk',
      },
    ],
  })),
}))

const openUrl = vi.fn()
vi.mock('@capacitor/app-launcher', () => ({ AppLauncher: { openUrl } }))

import UpdateBanner from './UpdateBanner'
import { fetchLatestRelease } from '../services/updateCheck'

function fakePlugin(statuses) {
  const queue = [...statuses]
  return {
    canInstall: vi.fn(async () => ({ granted: true })),
    openInstallSettings: vi.fn(async () => {}),
    start: vi.fn(async () => ({ id: 1 })),
    status: vi.fn(async () => (queue.length > 1 ? queue.shift() : queue[0])),
    install: vi.fn(async () => ({ ok: true })),
    cancel: vi.fn(async () => {}),
  }
}

describe('UpdateBanner', () => {
  beforeEach(() => {
    window.open = vi.fn()
  })
  afterEach(() => {
    delete window.__HT_APP_UPDATE__
  })

  it('variante play : aucun bandeau et aucune requête vers GitHub', async () => {
    fetchLatestRelease.mockClear()
    window.__HT_APP_UPDATE__ = fakePlugin([{ state: 'none' }])
    const { container } = render(<UpdateBanner enabled={false} />)
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
    expect(fetchLatestRelease).not.toHaveBeenCalled()
  })

  it('affiche la version installée, la nouvelle et sa taille', async () => {
    window.__HT_APP_UPDATE__ = fakePlugin([{ state: 'none' }])
    render(<UpdateBanner />)
    expect(await screen.findByText('Mise à jour disponible : version 188')).toBeInTheDocument()
    expect(screen.getByText(/Installée : version 187 · Taille : 33,6\sMo/)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Mettre à jour \(33,6\sMo\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Télécharger depuis le navigateur' })).toBeInTheDocument()
  })

  it('montre la progression en Mo et en %, puis ouvre l’installateur', async () => {
    const plugin = fakePlugin([
      { state: 'none' },
      { state: 'running', downloaded: 12_300_000, total: 33_562_556, version: '188' },
      { state: 'successful', downloaded: 33_562_556, total: 33_562_556, version: '188' },
    ])
    window.__HT_APP_UPDATE__ = plugin
    render(<UpdateBanner />)
    fireEvent.click(await screen.findByRole('button', { name: /Mettre à jour \(33,6\sMo\)/ }))
    const bar = await screen.findByRole('progressbar')
    await waitFor(() => expect(bar).toHaveAttribute('aria-valuenow', '36'))
    expect(screen.getByText(/12,3\sMo \/ 33,6\sMo · 36 %/)).toBeInTheDocument()
    expect(screen.getByText(/le téléchargement continue/)).toBeInTheDocument()
    await waitFor(() => expect(plugin.install).toHaveBeenCalled(), { timeout: 3000 })
    expect(await screen.findByText(/L'installateur Android est ouvert/)).toBeInTheDocument()
  })

  it('échec : message exact, « Réessayer » et le navigateur en secours', async () => {
    const plugin = fakePlugin([{ state: 'failed', reason: 404, version: '188' }])
    window.__HT_APP_UPDATE__ = plugin
    render(<UpdateBanner />)
    expect(await screen.findByText(/Échec : Le serveur GitHub a répondu « erreur 404 »/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger depuis le navigateur' }))
    await waitFor(() =>
      expect(window.open).toHaveBeenCalledWith(
        'https://github.com/spreadzenox/HealthTrack/releases/download/v188/HealthTrack-v188.apk',
        '_blank',
        'noopener,noreferrer',
      ),
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    })
    expect(plugin.start).toHaveBeenCalled()
  })

  it('hors app Android : ouvre le lien dans le navigateur', async () => {
    render(<UpdateBanner />)
    fireEvent.click(await screen.findByRole('button', { name: 'Voir la mise à jour' }))
    await waitFor(() => expect(window.open).toHaveBeenCalled())
  })
})
