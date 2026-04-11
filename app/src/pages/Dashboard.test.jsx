import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
}))

vi.mock('../components/WellbeingCharts', () => ({
  default: () => <div data-testid="wellbeing-charts" />,
}))

// Stub WellbeingPrompt to make controlled-mode testing simple
vi.mock('../components/WellbeingPrompt', () => ({
  default: ({ open, onClose }) =>
    open ? (
      <div role="dialog" aria-label="wellbeing-prompt-stub">
        <button type="button" onClick={onClose}>Fermer</button>
      </div>
    ) : null,
}))

function renderDashboard() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  beforeEach(async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
  })

  it('renders dashboard title and intro', () => {
    renderDashboard()
    expect(screen.getByRole('heading', { name: /Tableau de bord/i })).toBeInTheDocument()
    expect(screen.getByText(/HealthTrack centralise/i)).toBeInTheDocument()
    expect(screen.getByText(/montre Samsung Fit 3/i)).toBeInTheDocument()
    expect(screen.getByText(/Connecteurs/i)).toBeInTheDocument()
  })

  it('loads health entries from local storage on mount', async () => {
    renderDashboard()
    await screen.findByText(/Dernières entrées/i)
    const { listEntries } = await import('../storage/localHealthStorage')
    expect(listEntries).toHaveBeenCalledWith({ limit: 30 })
  })

  it('shows empty hint when no entries', async () => {
    renderDashboard()
    await screen.findByText(/Dernières entrées/i)
    expect(screen.getByText(/Aucune donnée/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Enregistrez un repas/i })).toHaveAttribute('href', '/food')
  })

  it('shows food entries when returned', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValueOnce([
      {
        id: 1,
        type: 'food',
        source: 'app_food',
        at: '2025-03-01T12:00:00Z',
        payload: { items: [{ ingredient: 'rice', quantity: '1 cup' }] },
        created_at: '',
      },
    ])
    renderDashboard()
    await screen.findByText(/rice/)
    expect(screen.getByText(/1 cup/)).toBeInTheDocument()
  })

  it('shows wellbeing score in recent entries', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValueOnce([
      {
        id: 2,
        type: 'wellbeing',
        source: 'app_wellbeing',
        at: '2026-04-10T09:00:00',
        payload: { score: 4 },
        created_at: '',
      },
    ])
    renderDashboard()
    await screen.findByText(/Note :/)
    const card = screen.getByRole('listitem')
    expect(card).toHaveTextContent('Bien-être')
    expect(card).toHaveTextContent('4')
  })

  it('renders the "Ajouter un bien-être" button', async () => {
    renderDashboard()
    const btn = screen.getByRole('button', { name: /Ajouter un bien-être/i })
    expect(btn).toBeInTheDocument()
  })

  it('opens the wellbeing modal when the button is clicked', async () => {
    renderDashboard()
    const btn = screen.getByRole('button', { name: /Ajouter un bien-être/i })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(btn)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the wellbeing modal when onClose is called', async () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un bien-être/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Fermer/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('reloads entries when health-entries-updated event fires', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    renderDashboard()
    await screen.findByText(/Dernières entrées/i)
    const callsBefore = listEntries.mock.calls.length

    listEntries.mockResolvedValueOnce([
      {
        id: 3,
        type: 'wellbeing',
        source: 'app_wellbeing',
        at: '2026-04-11T10:00:00',
        payload: { score: 5 },
        created_at: '',
      },
    ])
    window.dispatchEvent(new CustomEvent('health-entries-updated'))

    await waitFor(() => {
      expect(listEntries.mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })
})
