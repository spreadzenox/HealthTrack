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
    expect(screen.getByRole('heading', { name: 'Plus' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Données/ })).toHaveAttribute('href', '/data')
    expect(screen.getByRole('link', { name: /Connecteurs/ })).toHaveAttribute('href', '/connectors')
    expect(screen.getByRole('link', { name: /Paramètres/ })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('link', { name: /Nouveautés/ })).toHaveAttribute('href', '/nouveautes')
  })

  it('tells how many news are unread', () => {
    const log = [
      { id: 'b', date: '2026-10-10', kind: 'nouveau', title: 'B', items: [] },
      { id: 'a', date: '2026-10-09', kind: 'nouveau', title: 'A', items: [] },
    ]
    renderMore({ changelog: log })
    expect(screen.getByText('2 non lues')).toBeInTheDocument()
  })
})
