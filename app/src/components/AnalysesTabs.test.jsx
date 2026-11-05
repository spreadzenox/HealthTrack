import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AnalysesTabs from './AnalysesTabs'
import { saveOnboarding } from '../settings/onboarding'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AnalysesTabs />
    </MemoryRouter>
  )
}

describe('AnalysesTabs (Bien-être | Ventre | FODMAP | Tendances, retours du 04/11 (4))', () => {
  beforeEach(() => localStorage.clear())

  it('links to wellbeing, gut, FODMAP and trends for someone who follows their gut', () => {
    saveOnboarding({ goal: 'gut' })
    renderAt('/recommendations')
    expect(screen.getByRole('navigation', { name: 'Analyses' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Bien-être' })).toHaveAttribute('href', '/recommendations')
    expect(screen.getByRole('link', { name: 'Ventre' })).toHaveAttribute('href', '/recommendations/ventre')
    expect(screen.getByRole('link', { name: 'FODMAP' })).toHaveAttribute('href', '/reintroduction')
    expect(screen.getByRole('link', { name: 'Tendances' })).toHaveAttribute('href', '/tendances')
  })

  it('shows no gut nor FODMAP tab with another goal (POL-4, nothing deleted)', () => {
    saveOnboarding({ goal: 'energy' })
    renderAt('/recommendations')
    expect(screen.getByRole('link', { name: 'Bien-être' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tendances' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ventre' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'FODMAP' })).toBeNull()
  })

  it.each([
    ['/recommendations', 'Bien-être', 'Ventre'],
    ['/recommendations/ventre', 'Ventre', 'Bien-être'],
    ['/reintroduction', 'FODMAP', 'Bien-être'],
    ['/tendances', 'Tendances', 'Bien-être'],
  ])('on %s, « %s » is current', (path, current, other) => {
    saveOnboarding({ goal: 'gut' })
    renderAt(path)
    expect(screen.getByRole('link', { name: current })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: other })).not.toHaveAttribute('aria-current')
  })
})
