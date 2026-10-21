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

describe('JournalTabs (Jours | Repas | Nutrition sous l’onglet Journal)', () => {
  it('links to the days, meals and nutrition', () => {
    renderAt('/food')
    const nav = screen.getByRole('navigation', { name: 'Journal' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Jours' })).toHaveAttribute('href', '/journal')
    expect(screen.getByRole('link', { name: 'Repas' })).toHaveAttribute('href', '/food')
    expect(screen.getByRole('link', { name: 'Nutrition' })).toHaveAttribute('href', '/nutrition')
  })

  it.each([
    ['/journal', 'Jours', 'Repas'],
    ['/food', 'Repas', 'Nutrition'],
    ['/nutrition', 'Nutrition', 'Jours'],
  ])('on %s, « %s » is current', (path, current, other) => {
    renderAt(path)
    expect(screen.getByRole('link', { name: current })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: other })).not.toHaveAttribute('aria-current')
  })
})
