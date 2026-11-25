import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TabBar from './TabBar'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TabBar />
    </MemoryRouter>
  )
}

describe('TabBar', () => {
  beforeEach(() => localStorage.clear())

  it('shows the four tabs of the refonte « Compagnon » (étape 2)', () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Accueil', '/'],
      ['Ma journée', '/ma-journee'],
      ['Objectifs', '/recommendations'],
      ['Données', '/tendances'],
    ])
  })

  it.each([[['gut']], [['cycle', 'sport']], [['stress']]])('opens Objectifs on the overview whatever the goals %j (REFONTE-6a)', (goals) => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals }))
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Objectifs' })).toHaveAttribute('href', '/recommendations')
  })

  it.each([
    ['/', 'Accueil'],
    ['/agir', 'Accueil'],
    ['/ma-journee', 'Ma journée'],
    ['/recommendations', 'Objectifs'],
    ['/recommendations/bien-etre', 'Objectifs'],
    ['/recommendations/ventre', 'Objectifs'],
    ['/reintroduction', 'Objectifs'],
    ['/agir/essai/sleep', 'Objectifs'],
    ['/tendances', 'Données'],
    ['/nutrition', 'Données'],
    ['/food', 'Données'],
    ['/bien-etre', 'Données'],
  ])('marks only the tab of %s as the current page: %s', (path, tab) => {
    renderAt(path)
    expect(screen.getByRole('link', { name: tab })).toHaveAttribute('aria-current', 'page')
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(nav).getAllByRole('link').filter((a) => a.getAttribute('aria-current'))).toHaveLength(1)
  })

  // POLISH-SIM-162 : un repas noté depuis Ma journée (ou l'Accueil) garde l'onglet d'où il vient.
  it.each([
    ['/ma-journee', 'Ma journée'],
    ['/', 'Accueil'],
    ['/inconnu', 'Données'],
  ])('on the meals page opened from %s, marks %s', (tab, label) => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/food', state: { tab } }]}>
        <TabBar />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(nav).getAllByRole('link').filter((a) => a.getAttribute('aria-current'))).toHaveLength(1)
  })

  it.each(['/premium', '/plus', '/data', '/settings', '/nouveautes', '/connectors', '/connectors/withings/callback', '/montre'])('highlights no tab on settings page %s', (path) => {
    renderAt(path)
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    within(nav).getAllByRole('link').forEach((a) => expect(a).not.toHaveAttribute('aria-current'))
  })
})
