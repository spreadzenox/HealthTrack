import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import App from './App'

// Pas d'appel réseau réel vers GitHub : sa réponse arrivait parfois après la fin du fichier de test
// (« window is not defined » dans UpdateBanner, CI rouge au hasard).
vi.mock('./services/updateCheck', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchLatestRelease: vi.fn(async () => null),
}))

describe('App', () => {
  it('renders and shows navigation', () => {
    const { container } = render(<App />)
    expect(container.querySelector('img.header-logo')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /HealthTrack/i })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(nav).getByRole('link', { name: /Aujourd’hui/ })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: /Journal/ })).toHaveAttribute('href', '/journal')
    expect(within(nav).getByRole('link', { name: /Pistes/ })).toHaveAttribute('href', '/recommendations')
    expect(within(nav).getByRole('link', { name: /Sources/ })).toHaveAttribute('href', '/connectors')
  })

  it('reaches secondary pages through the « Réglages » button at the top right', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: /^Réglages/ }))
    expect(await screen.findByRole('link', { name: /Données/ })).toHaveAttribute('href', '/data')
    expect(screen.getByRole('link', { name: /Paramètres/ })).toHaveAttribute('href', '/settings')
  })

  it('changer de page remonte en haut (on ne reste pas au milieu de la page précédente)', async () => {
    render(<App />)
    document.documentElement.scrollTop = 1200
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: /Journal/ }))
    await screen.findByRole('heading', { name: 'Vos derniers jours' })
    expect(document.documentElement.scrollTop).toBe(0)
  })
})
