import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WhatsNewBanner from '../components/WhatsNewBanner'
import SettingsButton from '../components/SettingsButton'

vi.mock('../data/changelog', () => ({
  CHANGELOG: [{ id: '2026-11-04-1935-x', date: '2026-11-04', kind: 'amélioration', title: 'Démarrage plus léger', items: [] }],
}))

const wrap = (ui) => render(<MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>)

describe('useChangelog (PERF-CHANGELOG : Nouveautés hors du démarrage)', () => {
  beforeEach(() => localStorage.clear())

  it('la bannière montre la nouveauté une fois le journal chargé', async () => {
    wrap(<WhatsNewBanner />)
    expect(await screen.findByText('Démarrage plus léger')).toBeInTheDocument()
  })

  it('la pastille des réglages suit le journal chargé', async () => {
    wrap(<SettingsButton />)
    expect(await screen.findByRole('link', { name: 'Réglages (nouveautés non lues)' })).toBeInTheDocument()
  })

  it('un journal donné est utilisé tel quel', () => {
    wrap(<WhatsNewBanner changelog={[]} />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it.each(['components/SettingsButton.jsx', 'components/WhatsNewBanner.jsx', 'Layout.jsx'])(
    '%s (chargé au démarrage) n’importe pas le journal directement',
    (file) => {
      const src = readFileSync(resolve('src', file), 'utf8')
      expect(src).not.toMatch(/from ['"][./]*data\/changelog['"]/)
    },
  )
})
