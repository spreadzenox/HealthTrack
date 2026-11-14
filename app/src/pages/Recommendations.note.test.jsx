import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Recommendations from './Recommendations'

vi.mock('../storage/localHealthStorage', () => ({
  createEntry: vi.fn(() => Promise.resolve(1)),
  updateEntry: vi.fn(() => Promise.resolve()),
  listEntries: vi.fn(() => Promise.resolve([])),
}))

const f = (key, label, { actionable = true } = {}) => ({
  key, label, theme: 'sleep', actionable, outcome: 'wellbeing', horizon: 'short', effect: 0.1, low: -0.2, high: 0.4, net: false,
  usualChange: { amount: 50, unit: 'min', text: '50 min de sommeil de plus' }, perUnit: 0.01, center: 400, days: 14,
})
const h = (id, label, window, status, factors, daysNeeded) => ({ id, label, window, status, daysHave: 14, daysNeeded, factors })
/** Le 14e jour noté de la persona : court terme prêt, rien de net, la méthode ne prévoit pas mieux que la veille. */
const day14 = (factors) => ({
  outcomes: {
    wellbeing: {
      status: 'partial', beatsPersistence: false, daysToFirst: 0,
      horizons: {
        short: h('short', 'Court terme', 'le jour même et la veille', 'ready', factors, 14),
        medium: h('medium', 'Moyen terme', 'de 2 à 6 jours avant', 'locked', [], 21),
        long: h('long', 'Long terme', 'de 7 à 27 jours avant', 'locked', [], 42),
      },
    },
  },
})
/** Digestion avant les premiers résultats : le compte à rebours. */
const gutLocked = () => ({
  outcomes: {
    digestion: {
      status: 'locked', beatsPersistence: false, daysToFirst: 14,
      horizons: {
        short: h('short', 'Court terme', 'le jour même et la veille', 'locked', [], 28),
        medium: h('medium', 'Moyen terme', 'de 2 à 6 jours avant', 'locked', [], 35),
        long: h('long', 'Long terme', 'de 7 à 27 jours avant', 'locked', [], 56),
      },
    },
  },
})
const gutNote = (at, level, scope) => ({ id: at, type: 'gut', at, payload: { level, ...(scope ? { scope } : {}) } })
const renderGut = (notes) => render(
  <MemoryRouter><Recommendations view="gut" read={async () => gutLocked()} readGut={async () => notes} /></MemoryRouter>,
)
const renderPage = (results) => render(
  <MemoryRouter><Recommendations read={async () => results} /></MemoryRouter>,
)

describe('POLISH-SIM-62 : Analyses au premier jour de résultats', () => {
  beforeEach(() => localStorage.clear())

  it('rien de net et aucune barre : une ligne dit ce qui a été comparé', async () => {
    renderPage(day14([f('sleepMinutes', 'Sommeil'), f('steps', 'Pas'), f('hrv_ms', 'VFC', { actionable: false })]))
    expect(await screen.findByTestId('reco-compared')).toHaveTextContent(/^3 facteurs comparés à votre bien-être, du jour même à la veille\.$/)
    expect(screen.getByText(/Aucun lien assez net/)).toBeInTheDocument()
  })

  it('un seul facteur : au singulier ; aucun facteur : pas de ligne', async () => {
    const { unmount } = renderPage(day14([f('sleepMinutes', 'Sommeil')]))
    expect(await screen.findByTestId('reco-compared')).toHaveTextContent(/^1 facteur comparé à votre bien-être, du jour même à la veille\.$/)
    unmount()
    renderPage(day14([]))
    await screen.findByText(/Aucun lien assez net/)
    expect(document.body.textContent).not.toMatch(/comparé/)
  })

  it('la note enregistrée depuis Analyses est confirmée', async () => {
    const locked = day14([])
    locked.outcomes.wellbeing.status = 'locked'
    locked.outcomes.wellbeing.daysToFirst = 1
    locked.outcomes.wellbeing.horizons.short.status = 'locked'
    renderPage(locked)
    fireEvent.click(await screen.findByRole('button', { name: 'Noter maintenant' }))
    fireEvent.click(screen.getByRole('button', { name: 'Note 4 sur 5' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByRole('status')).toHaveTextContent(/^Noté : 4\/5$/)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('POLISH-SIM-82 : Analyses › Digestion en attente, digestion du jour déjà notée', () => {
  beforeEach(() => localStorage.clear())
  const today = (h) => { const d = new Date(); d.setHours(h, 0, 0, 0); return d.toISOString() }
  const yesterday = () => new Date(Date.now() - 86_400_000).toISOString()

  it('aucune note aujourd’hui : « Noter maintenant »', async () => {
    renderGut([gutNote(yesterday(), 'discomfort')])
    expect(await screen.findByRole('button', { name: 'Noter maintenant' })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Noté aujourd/)
  })

  it('une note aujourd’hui : « Noté aujourd’hui » avec le niveau, et « Ajouter une note »', async () => {
    renderGut([gutNote(today(0), 'discomfort'), gutNote(yesterday(), 'pain')])
    expect(await screen.findByTestId('reco-noted-today')).toHaveTextContent(/^Noté aujourd’hui : Gêne$/)
    expect(screen.queryByRole('button', { name: 'Noter maintenant' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Ajouter une note' })).toBeInTheDocument()
  })

  it('plusieurs notes et le bilan du jour : chaque niveau une fois, dans l’ordre', async () => {
    renderGut([gutNote(today(0), 'calm', 'day'), gutNote(today(0), 'pain'), gutNote(today(0), 'pain')])
    expect(await screen.findByTestId('reco-noted-today')).toHaveTextContent(/^Noté aujourd’hui : Calme, Douleur$/)
  })

  it('lecture des notes impossible : le bouton habituel reste', async () => {
    render(<MemoryRouter><Recommendations view="gut" read={async () => gutLocked()} readGut={() => { throw new Error('x') }} /></MemoryRouter>)
    expect(await screen.findByRole('button', { name: 'Noter maintenant' })).toBeInTheDocument()
  })
})
