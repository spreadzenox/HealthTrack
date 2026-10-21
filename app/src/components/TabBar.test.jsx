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

  it('shows the four tabs of the validated mock-up (Aujourd’hui, Journal, Pistes, Sources)', () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Aujourd’hui', '/'],
      ['Journal', '/food'],
      ['Pistes', '/recommendations'],
      ['Sources', '/connectors'],
    ])
  })

  it('marks only the current tab as the current page', () => {
    renderAt('/food')
    expect(screen.getByRole('link', { name: 'Journal' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Aujourd’hui' })).not.toHaveAttribute('aria-current')
  })

  it('keeps « Journal » active on the Nutrition sub-page', () => {
    renderAt('/nutrition')
    expect(screen.getByRole('link', { name: 'Journal' })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps « Sources » active on the Withings callback', () => {
    renderAt('/connectors/withings/callback')
    expect(screen.getByRole('link', { name: 'Sources' })).toHaveAttribute('aria-current', 'page')
  })

  it.each(['/plus', '/data', '/settings', '/nouveautes'])('highlights no tab on settings page %s', (path) => {
    renderAt(path)
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    within(nav).getAllByRole('link').forEach((a) => expect(a).not.toHaveAttribute('aria-current'))
  })
})
