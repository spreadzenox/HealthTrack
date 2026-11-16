import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WhatsNewBanner from './WhatsNewBanner'

const LOG = [
  { id: '2026-11-16-1030-police', date: '2026-11-16', title: 'Nouvelle police et fond crème', items: [] },
  { id: '2026-11-15-0435-refonte', date: '2026-11-15', title: 'Nouveaux onglets', items: [], aLaUne: true },
  { id: '2026-11-14-0000-ancienne', date: '2026-11-14', title: 'Ancienne note', items: [] },
]

const show = () =>
  render(
    <MemoryRouter>
      <WhatsNewBanner changelog={LOG} />
    </MemoryRouter>,
  )

describe('WhatsNewBanner (REFONTE-UPG-2)', () => {
  beforeEach(() => localStorage.clear())

  it('un testeur qui arrive d’avant la refonte lit d’abord la note à la une', () => {
    localStorage.setItem('healthtrack-whats-new-last-seen', '2026-11-14-0000-ancienne')
    show()
    expect(screen.getByRole('status')).toHaveTextContent('Nouveau : Nouveaux onglets et 1 autre changement')
  })

  it('la note à la une déjà lue : le bandeau reprend la plus récente', () => {
    localStorage.setItem('healthtrack-whats-new-last-seen', '2026-11-15-0435-refonte')
    show()
    expect(screen.getByRole('status')).toHaveTextContent('Nouveau : Nouvelle police et fond crème')
  })
})
