import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TabBar from './TabBar'

const LOG = [{ id: 'b', date: '2026-10-10', kind: 'nouveau', title: 'Barre d’onglets', items: [] }]

function renderAt(path, props = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TabBar changelog={[]} {...props} />
    </MemoryRouter>
  )
}

describe('TabBar', () => {
  beforeEach(() => localStorage.clear())

  it('shows five tabs pointing to the main pages', () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Accueil', '/'],
      ['Repas', '/food'],
      ['Nutrition', '/nutrition'],
      ['Analyses', '/recommendations'],
      ['Plus', '/plus'],
    ])
  })

  it('marks only the current tab as the current page', () => {
    renderAt('/food')
    expect(screen.getByRole('link', { name: 'Repas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Accueil' })).not.toHaveAttribute('aria-current')
  })

  it.each(['/plus', '/data', '/connectors', '/settings', '/nouveautes'])(
    'highlights « Plus » on secondary page %s',
    (path) => {
      renderAt(path)
      expect(screen.getByRole('link', { name: 'Plus' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: 'Accueil' })).not.toHaveAttribute('aria-current')
    }
  )

  it('flags unread news on the « Plus » tab', () => {
    renderAt('/', { changelog: LOG })
    expect(screen.getByRole('link', { name: /Plus/ })).toHaveAccessibleName('Plus (nouveautés non lues)')
  })
})
