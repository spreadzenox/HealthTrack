import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Outlet, Link } from 'react-router-dom'
import WhatsNew from './WhatsNew'
import WhatsNewBanner from '../components/WhatsNewBanner'
import { getLastSeenId } from '../services/whatsNew'
import { CHANGELOG } from '../data/changelog'

const LOG = [
  { id: 'b', date: '2026-10-10', kind: 'correctif', title: 'Graphique corrigé', items: ['Les dates ne se chevauchent plus.'] },
  { id: 'a', date: '2026-10-08', kind: 'nouveau', title: 'Page Nouveautés', items: [] },
]

function renderAt(path, ui) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>
  )
}

describe('WhatsNew page', () => {
  beforeEach(() => localStorage.clear())

  it('lists every changelog entry with its kind and items', () => {
    renderAt('/nouveautes', <WhatsNew changelog={LOG} />)
    expect(screen.getByRole('heading', { name: 'Nouveautés' })).toBeInTheDocument()
    expect(screen.getByText('Graphique corrigé')).toBeInTheDocument()
    expect(screen.getByText('Page Nouveautés')).toBeInTheDocument()
    expect(screen.getByText('Correctif')).toBeInTheDocument()
    expect(screen.getByText('Les dates ne se chevauchent plus.')).toBeInTheDocument()
  })

  it('marks entries as seen once opened, while still highlighting them', () => {
    renderAt('/nouveautes', <WhatsNew changelog={LOG} />)
    expect(getLastSeenId()).toBe('b')
    expect(screen.getAllByLabelText('non lu')).toHaveLength(2)
  })

  it('ships a valid changelog (file naming, newest first, known kinds)', () => {
    expect(CHANGELOG.length).toBeGreaterThan(0)
    const ids = CHANGELOG.map((e) => e.id)
    expect([...ids].sort().reverse()).toEqual(ids)
    for (const e of CHANGELOG) {
      expect(e.id).toMatch(/^\d{4}-\d{2}-\d{2}-\d{4}-[a-z0-9-]+$/)
      expect(e.id.startsWith(e.date)).toBe(true)
      expect(['nouveau', 'amélioration', 'correctif']).toContain(e.kind)
      expect(e.title).toBeTruthy()
      expect(Array.isArray(e.items)).toBe(true)
    }
  })
})

describe('WhatsNewBanner', () => {
  beforeEach(() => localStorage.clear())

  it('summarises unseen entries and links to the page', () => {
    renderAt('/', <WhatsNewBanner changelog={LOG} />)
    expect(screen.getByRole('status')).toHaveTextContent('Graphique corrigé et 1 autre changement')
    expect(screen.getByRole('link', { name: 'Voir' })).toHaveAttribute('href', '/nouveautes')
  })

  it('is hidden after dismissal and stays hidden', () => {
    const { unmount } = renderAt('/', <WhatsNewBanner changelog={LOG} />)
    fireEvent.click(screen.getByRole('button', { name: /Masquer/ }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    unmount()
    renderAt('/', <WhatsNewBanner changelog={LOG} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('reappears only for entries added after the last visit', () => {
    localStorage.setItem('healthtrack-whats-new-last-seen', 'a')
    renderAt('/', <WhatsNewBanner changelog={LOG} />)
    expect(screen.getByRole('status')).toHaveTextContent('Graphique corrigé')
    expect(screen.getByRole('status')).not.toHaveTextContent('autre')
  })

  it('stays hidden after reading the Nouveautés page and coming back', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <WhatsNewBanner changelog={LOG} />
                <Link to="/">Accueil</Link>
                <Outlet />
              </>
            }
          >
            <Route index element={<p>Tableau de bord</p>} />
            <Route path="nouveautes" element={<WhatsNew changelog={LOG} />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('link', { name: 'Voir' }))
    expect(screen.getByRole('heading', { name: 'Nouveautés' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Accueil' }))
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('is not shown on the Nouveautés page itself', () => {
    renderAt('/nouveautes', <WhatsNewBanner changelog={LOG} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
