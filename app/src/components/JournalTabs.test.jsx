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

describe('JournalTabs (Repas | Nutrition sous l’onglet Journal)', () => {
  it('links to meals and nutrition', () => {
    renderAt('/food')
    const nav = screen.getByRole('navigation', { name: 'Journal' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Repas' })).toHaveAttribute('href', '/food')
    expect(screen.getByRole('link', { name: 'Nutrition' })).toHaveAttribute('href', '/nutrition')
  })

  it.each([
    ['/food', 'Repas', 'Nutrition'],
    ['/nutrition', 'Nutrition', 'Repas'],
  ])('on %s, « %s » is current', (path, current, other) => {
    renderAt(path)
    expect(screen.getByRole('link', { name: current })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: other })).not.toHaveAttribute('aria-current')
  })
})
