import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nutrition from './Nutrition'

vi.mock('../storage/localHealthStorage', () => ({
  listEntriesForAnalysis: vi.fn().mockResolvedValue([]),
}))

import { listEntriesForAnalysis } from '../storage/localHealthStorage'

const yesterdayNoon = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

describe('Nutrition page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and profile section', async () => {
    render(
      <MemoryRouter>
        <Nutrition />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /nutrition/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/^Poids :/)).toBeInTheDocument()
    expect(screen.getByText(/^Taille :/)).toBeInTheDocument()
  })

  it('shows per-day averages vs daily targets, sodium as a limit', async () => {
    listEntriesForAnalysis.mockResolvedValueOnce([
      {
        type: 'food',
        at: yesterdayNoon(),
        payload: { items: [{ ingredient: 'Abat, cuit (aliment moyen)', quantity_g: 200 }] },
      },
    ])
    render(
      <MemoryRouter>
        <Nutrition />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/1 jour saisi/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'À limiter' })).toBeInTheDocument()
    expect(screen.getByText(/max 2 000 mg/)).toBeInTheDocument()
    expect(screen.getByText(/obj\. 30 g/)).toBeInTheDocument()
    expect(screen.getByText(/pas un diagnostic/i)).toBeInTheDocument()
  })

  it('shows empty state when no meals this week', async () => {
    render(
      <MemoryRouter>
        <Nutrition />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText(/aucun repas/i)).toBeInTheDocument()
    })
  })
})
