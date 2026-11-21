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

  it('après une longue absence, pas de compte qui fait peur (POLISH-SIM-135)', () => {
    const many = Array.from({ length: 99 }, (_, i) => ({
      id: `2026-11-${String(20 - Math.floor(i / 10)).padStart(2, '0')}-${String(2300 - i).padStart(4, '0')}-n${i}`,
      date: '2026-11-20',
      title: i === 0 ? 'Dernière note' : `Note ${i}`,
      items: [],
    }))
    localStorage.setItem('healthtrack-whats-new-last-seen', '2026-11-01-0000-vieille')
    render(
      <MemoryRouter>
        <WhatsNewBanner changelog={[...many, { id: '2026-11-01-0000-vieille', date: '2026-11-01', title: 'Vieille', items: [] }]} />
      </MemoryRouter>,
    )
    const banner = screen.getByRole('status')
    expect(banner).toHaveTextContent('Nouveau : Dernière note et d’autres nouveautés')
    expect(banner).not.toHaveTextContent(/\d+ autres/)
  })

  it('jusqu’à 3 autres changements, le compte reste exact', () => {
    const four = [
      { id: '2026-11-20-0400-d', date: '2026-11-20', title: 'Quatre', items: [] },
      { id: '2026-11-20-0300-c', date: '2026-11-20', title: 'Trois', items: [] },
      { id: '2026-11-20-0200-b', date: '2026-11-20', title: 'Deux', items: [] },
      { id: '2026-11-20-0100-a', date: '2026-11-20', title: 'Un', items: [] },
      { id: '2026-11-19-0000-vu', date: '2026-11-19', title: 'Vu', items: [] },
    ]
    localStorage.setItem('healthtrack-whats-new-last-seen', '2026-11-19-0000-vu')
    render(
      <MemoryRouter>
        <WhatsNewBanner changelog={four} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Nouveau : Quatre et 3 autres changements')
  })
})
