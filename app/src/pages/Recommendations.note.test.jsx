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
