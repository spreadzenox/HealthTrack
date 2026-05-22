import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CigaretteQuickAdd from './CigaretteQuickAdd'

vi.mock('../storage/localHealthStorage', () => ({
  createEntry: vi.fn(),
}))

describe('CigaretteQuickAdd', () => {
  beforeEach(async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    createEntry.mockResolvedValue({ id: 1 })
  })

  it('renders the add-cigarette button', () => {
    render(<CigaretteQuickAdd />)
    expect(screen.getByRole('button', { name: /Ajouter une cigarette/i })).toBeInTheDocument()
    expect(screen.getByText(/\+ 1 cigarette/i)).toBeInTheDocument()
  })

  it('creates one cigarette entry per click', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    render(<CigaretteQuickAdd />)
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une cigarette/i }))

    await waitFor(() => {
      expect(createEntry).toHaveBeenCalledWith({
        type: 'cigarette',
        source: 'app_cigarette',
        payload: { count: 1 },
      })
    })
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'health-entries-updated' }))
    dispatchSpy.mockRestore()
  })

  it('shows confirmation after save', async () => {
    render(<CigaretteQuickAdd />)
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une cigarette/i }))
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Enregistré/i)
    })
  })
})
