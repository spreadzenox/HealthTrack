import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WellbeingPrompt from './WellbeingPrompt'

vi.mock('../storage/localHealthStorage', () => ({
  createEntry: vi.fn(() => Promise.resolve(1)),
}))

describe('WellbeingPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.removeItem('healthtrack-wellbeing-prompt-session')
  })

  it('shows dialog on first load in session', async () => {
    render(<WellbeingPrompt />)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Comment vous sentez-vous/i)).toBeInTheDocument()
  })

  it('does not show dialog if already answered this session', () => {
    sessionStorage.setItem('healthtrack-wellbeing-prompt-session', '1')
    const { container } = render(<WellbeingPrompt />)
    expect(container.querySelector('.wellbeing-modal')).not.toBeInTheDocument()
  })

  it('saves score and closes when user selects and confirms', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    render(<WellbeingPrompt />)
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: /Note 3 sur 5/i }))
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
    expect(createEntry).toHaveBeenCalledWith({
      type: 'wellbeing',
      source: 'app_wellbeing',
      payload: { score: 3 },
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('Plus tard closes without saving', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    render(<WellbeingPrompt />)
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: /Plus tard/i }))
    expect(createEntry).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
