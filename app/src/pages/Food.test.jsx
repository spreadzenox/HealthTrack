import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Food from './Food'

describe('Food', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('renders food page title and upload zone', () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    expect(screen.getByRole('heading', { name: /Alimentation/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Choisir une photo/i)).toBeInTheDocument()
    expect(screen.getByText(/Prendre une photo ou choisir une image/i)).toBeInTheDocument()
  })

  it('fetches recent meals on mount', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    await screen.findByText(/Derniers repas enregistrés/i)
    expect(globalThis.fetch).toHaveBeenCalled()
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/api/health/entries')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('type=food')
  })

  it('shows empty hint when no meals', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    await screen.findByText(/Aucun repas enregistré/i)
  })

  it('analyze button is not visible until image selected', () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(
      <BrowserRouter>
        <Food />
      </BrowserRouter>
    )
    expect(screen.queryByRole('button', { name: /Analyser les ingrédients/i })).not.toBeInTheDocument()
  })
})
