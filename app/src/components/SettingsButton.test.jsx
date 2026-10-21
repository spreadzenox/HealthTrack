import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsButton from './SettingsButton'

const LOG = [{ id: 'b', date: '2026-10-10', kind: 'nouveau', title: 'Barre d’onglets', items: [] }]

function renderAt(path, props = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SettingsButton changelog={[]} {...props} />
    </MemoryRouter>
  )
}

describe('SettingsButton (réglages en haut à droite)', () => {
  beforeEach(() => localStorage.clear())

  it('opens the settings hub', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Réglages' })).toHaveAttribute('href', '/plus')
  })

  it.each(['/plus', '/data', '/settings', '/nouveautes'])('is the current page on %s', (path) => {
    renderAt(path)
    expect(screen.getByRole('link', { name: 'Réglages' })).toHaveAttribute('aria-current', 'page')
  })

  it('is not current elsewhere', () => {
    renderAt('/food')
    expect(screen.getByRole('link', { name: 'Réglages' })).not.toHaveAttribute('aria-current')
  })

  it('flags unread news', () => {
    renderAt('/', { changelog: LOG })
    expect(screen.getByRole('link', { name: 'Réglages (nouveautés non lues)' })).toBeInTheDocument()
  })

  it('is a touch target of at least 44 px', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Réglages' })).toHaveClass('settings-button')
  })
})
