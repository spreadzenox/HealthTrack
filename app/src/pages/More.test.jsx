import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import More from './More'

function renderMore(props = {}) {
  return render(
    <MemoryRouter initialEntries={['/plus']}>
      <More changelog={[]} {...props} />
    </MemoryRouter>
  )
}

describe('More page', () => {
  beforeEach(() => localStorage.clear())

  it('links to every secondary page', () => {
    renderMore()
    expect(screen.getByRole('heading', { name: 'Réglages' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Sauvegarde/ })).toHaveAttribute('href', '/data')
    // refonte « Compagnon », étape 1 : Sources vit dans Réglages, en premier
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/connectors')
    expect(screen.getByRole('link', { name: /Sources/ })).toHaveTextContent('Montres, apps de santé, météo, lecture du visage')
    expect(screen.getByRole('link', { name: /Paramètres/ })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('link', { name: /Nouveautés/ })).toHaveAttribute('href', '/nouveautes')
  })

  it('lists the sources once, which have left the tab bar (refonte « Compagnon », étape 1)', () => {
    renderMore()
    expect(screen.getAllByRole('link', { name: /Connecteurs|Sources/ })).toHaveLength(1)
  })

  it('draws each chevron as the line icon, not a text glyph that shrinks with the font (7d-2)', () => {
    renderMore()
    const link = screen.getByRole('link', { name: /Sources/ })
    expect(link.querySelector('svg.more-chevron')).not.toBeNull()
    expect(link.textContent).not.toContain('›')
  })

  it('tells how many news are unread', () => {
    const log = [
      { id: 'b', date: '2026-10-10', kind: 'nouveau', title: 'B', items: [] },
      { id: 'a', date: '2026-10-09', kind: 'nouveau', title: 'A', items: [] },
    ]
    renderMore({ changelog: log })
    expect(screen.getByText('2 non lues')).toBeInTheDocument()
  })

  it('describes Settings by what it holds (appearance, meal analysis, cigarettes, diagnostic)', () => {
    renderMore()
    const link = screen.getByRole('link', { name: /Paramètres/ })
    expect(link).toHaveTextContent(/repas/)
    expect(link).toHaveTextContent(/Cigarettes|cigarettes/)
    expect(link).toHaveTextContent(/diagnostic/i)
    expect(link).toHaveTextContent(/Apparence/)
  })

  it('describes Données by what it holds (backup and restore, no history any more)', () => {
    renderMore()
    const link = screen.getByRole('link', { name: /Sauvegarde/ })
    expect(link).toHaveTextContent(/Exporter et restaurer vos données/)
    expect(link).not.toHaveTextContent(/historique/)
  })

  it('opens the privacy policy bundled with the app (required by Google Play and Health Connect)', () => {
    renderMore()
    const link = screen.getByRole('link', { name: /Confidentialité/ })
    expect(link).toHaveAttribute('href', '/privacypolicy.html')
    expect(link).toHaveTextContent(/Ce qui reste sur le téléphone/)
  })

  it('VC-18 : ouvre les conditions d’utilisation et de vente embarquées dans l’app', () => {
    renderMore()
    const link = screen.getByRole('link', { name: /Conditions/ })
    expect(link).toHaveAttribute('href', '/conditions.html')
    expect(link).toHaveTextContent(/abonnement/)
  })
})
