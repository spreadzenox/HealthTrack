import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nutrition from './Nutrition'

vi.mock('../storage/localHealthStorage', () => ({
  listEntriesForAnalysis: vi.fn().mockResolvedValue([]),
}))

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
