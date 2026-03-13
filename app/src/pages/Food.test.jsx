import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Food from './Food'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
  createEntry: vi.fn(),
}))

describe('Food', () => {
  beforeEach(async () => {
    globalThis.fetch = vi.fn()
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
  })

  it('renders food page title and upload zone', () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    expect(screen.getByRole('heading', { name: /Alimentation/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Choisir une photo/i)).toBeInTheDocument()
    expect(screen.getByText(/Prendre une photo ou choisir une image/i)).toBeInTheDocument()
  })

  it('loads recent meals from local storage on mount', async () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    await screen.findByText(/Derniers repas enregistrés/i)
    const { listEntries } = await import('../storage/localHealthStorage')
    expect(listEntries).toHaveBeenCalledWith({ type: 'food', limit: 20 })
  })

  it('shows empty hint when no meals', async () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    await screen.findByText(/Aucun repas enregistré/i)
  })

  it('analyze button is not visible until image selected', () => {
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    expect(screen.queryByRole('button', { name: /Analyser les ingrédients/i })).not.toBeInTheDocument()
  })
})
