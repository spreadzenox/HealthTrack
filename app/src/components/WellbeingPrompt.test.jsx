import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WellbeingPrompt from './WellbeingPrompt'

vi.mock('../storage/localHealthStorage', () => ({
  createEntry: vi.fn(() => Promise.resolve(1)),
}))

describe('WellbeingPrompt (uncontrolled)', () => {
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

describe('WellbeingPrompt (controlled)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows dialog when open=true', () => {
    const onClose = vi.fn()
    render(<WellbeingPrompt open={true} onClose={onClose} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Comment vous sentez-vous/i)).toBeInTheDocument()
  })

  it('does not show dialog when open=false', () => {
    const onClose = vi.fn()
    const { container } = render(<WellbeingPrompt open={false} onClose={onClose} />)
    expect(container.querySelector('.wellbeing-modal')).not.toBeInTheDocument()
  })

  it('calls onClose when Annuler is clicked', () => {
    const onClose = vi.fn()
    render(<WellbeingPrompt open={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Annuler/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('saves score and calls onClose when confirmed', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    const onClose = vi.fn()
    render(<WellbeingPrompt open={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Note 4 sur 5/i }))
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
    expect(createEntry).toHaveBeenCalledWith({
      type: 'wellbeing',
      source: 'app_wellbeing',
      payload: { score: 4 },
    })
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('shows Annuler (not Plus tard) in controlled mode', () => {
    render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Plus tard/i })).not.toBeInTheDocument()
  })
})
