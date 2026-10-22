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
    expect(screen.getByRole('link', { name: /Données/ })).toHaveAttribute('href', '/data')
    expect(screen.getByRole('link', { name: /Paramètres/ })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('link', { name: /Nouveautés/ })).toHaveAttribute('href', '/nouveautes')
  })

  it('no longer lists the sources, which have their own tab', () => {
    renderMore()
    expect(screen.queryByRole('link', { name: /Connecteurs|Sources/ })).not.toBeInTheDocument()
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
    const link = screen.getByRole('link', { name: /Données/ })
    expect(link).toHaveTextContent(/Sauvegarde et restauration/)
    expect(link).not.toHaveTextContent(/historique/)
  })

  it('opens the privacy policy bundled with the app (required by Google Play and Health Connect)', () => {
    renderMore()
    const link = screen.getByRole('link', { name: /Confidentialité/ })
    expect(link).toHaveAttribute('href', '/privacypolicy.html')
    expect(link).toHaveTextContent(/Ce qui reste sur le téléphone/)
  })
})
