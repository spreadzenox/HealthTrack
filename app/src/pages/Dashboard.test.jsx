import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

describe('Dashboard', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('renders dashboard title and intro', () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
    expect(screen.getByRole('heading', { name: /Tableau de bord/i })).toBeInTheDocument()
    expect(screen.getByText(/HealthTrack centralise/i)).toBeInTheDocument()
    expect(screen.getByText(/montre Samsung/i)).toBeInTheDocument()
    expect(screen.getByText(/balance connectée/i)).toBeInTheDocument()
  })

  it('fetches health entries on mount', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
    await screen.findByText(/Dernières entrées/i)
    expect(globalThis.fetch).toHaveBeenCalled()
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/api/health/entries')
  })

  it('shows empty hint when no entries', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
    await screen.findByText(/Dernières entrées/i)
    expect(screen.getByText(/Aucune donnée/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Enregistrez un repas/i })).toHaveAttribute('href', '/food')
  })

  it('shows food entries when returned', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          type: 'food',
          source: 'app_food',
          at: '2025-03-01T12:00:00Z',
          payload: { items: [{ ingredient: 'rice', quantity: '1 cup' }] },
          created_at: '',
        },
      ],
    })
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
    await screen.findByText(/rice/)
    expect(screen.getByText(/1 cup/)).toBeInTheDocument()
  })
})
