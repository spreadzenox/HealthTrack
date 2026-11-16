import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JournalTabs from './JournalTabs'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <JournalTabs />
    </MemoryRouter>
  )
}

describe('JournalTabs (Données = Tendances · Nutrition, refonte « Compagnon », étape 7b)', () => {
  it('links to trends then nutrition, and nothing else', () => {
    renderAt('/tendances')
    const nav = screen.getByRole('navigation', { name: 'Données' })
    const links = Array.from(nav.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')])
    expect(links).toEqual([['Tendances', '/tendances'], ['Nutrition', '/nutrition']])
    expect(screen.queryByRole('link', { name: 'Jours' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Repas' })).not.toBeInTheDocument()
  })

  it.each([
    ['/tendances', 'Tendances', 'Nutrition'],
    ['/nutrition', 'Nutrition', 'Tendances'],
    ['/food', 'Nutrition', 'Tendances'],
  ])('on %s, « %s » is current', (path, current, other) => {
    renderAt(path)
    expect(screen.getByRole('link', { name: current })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: other })).not.toHaveAttribute('aria-current')
  })
})
