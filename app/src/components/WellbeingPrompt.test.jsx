import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WellbeingPrompt from './WellbeingPrompt'

vi.mock('../storage/localHealthStorage', () => ({
  createEntry: vi.fn(() => Promise.resolve(1)),
  updateEntry: vi.fn(() => Promise.resolve()),
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

describe('WellbeingPrompt — behaviour tags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows optional behaviour tags as toggle buttons', () => {
    render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    const alcohol = screen.getByRole('button', { name: /Alcool/i })
    expect(alcohol).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(alcohol)
    expect(alcohol).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(alcohol)
    expect(alcohol).toHaveAttribute('aria-pressed', 'false')
  })

  it('saves selected tags with the score', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Note 2 sur 5/i }))
    fireEvent.click(screen.getByRole('button', { name: /Stress/i }))
    fireEvent.click(screen.getByRole('button', { name: /Écran tard/i }))
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
    expect(createEntry).toHaveBeenCalledWith({
      type: 'wellbeing',
      source: 'app_wellbeing',
      payload: { score: 2, tags: ['late_screen', 'stress'] },
    })
  })

  it('resets tags when the dialog is reopened', () => {
    const { rerender } = render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Alcool/i }))
    rerender(<WellbeingPrompt open={false} onClose={vi.fn()} />)
    rerender(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Alcool/i })).toHaveAttribute('aria-pressed', 'false')
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

describe('WellbeingPrompt — modifier une note enregistrée', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const entry = {
    id: 7,
    type: 'wellbeing',
    source: 'app_wellbeing',
    at: new Date().toISOString(),
    payload: { score: 2, tags: ['stress'], extra: 'gardé' },
  }

  it('pré-remplit la note et les tags', () => {
    render(<WellbeingPrompt open={true} onClose={vi.fn()} entry={entry} />)
    expect(screen.getByRole('heading', { name: /Modifier votre note/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Note 2 sur 5/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Stress/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Alcool/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('met à jour la même entrée (heure inchangée) au lieu d’en créer une nouvelle', async () => {
    const { createEntry, updateEntry } = await import('../storage/localHealthStorage')
    const onClose = vi.fn()
    render(<WellbeingPrompt open={true} onClose={onClose} entry={entry} />)
    fireEvent.click(screen.getByRole('button', { name: /Note 4 sur 5/i }))
    fireEvent.click(screen.getByRole('button', { name: /Stress/i }))
    fireEvent.click(screen.getByRole('button', { name: /Alcool/i }))
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(createEntry).not.toHaveBeenCalled()
    expect(updateEntry).toHaveBeenCalledWith(7, { payload: { score: 4, tags: ['alcohol'], extra: 'gardé' } })
  })

  it('retire la clé tags quand plus aucun tag n’est coché', async () => {
    const { updateEntry } = await import('../storage/localHealthStorage')
    render(<WellbeingPrompt open={true} onClose={vi.fn()} entry={entry} />)
    fireEvent.click(screen.getByRole('button', { name: /Stress/i }))
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
    await waitFor(() => expect(updateEntry).toHaveBeenCalled())
    expect(updateEntry).toHaveBeenCalledWith(7, { payload: { score: 2, extra: 'gardé' } })
  })

  it('pré-remplit une autre note quand on en modifie une autre', () => {
    const other = { ...entry, id: 8, payload: { score: 5 } }
    const { rerender } = render(<WellbeingPrompt open={true} onClose={vi.fn()} entry={entry} />)
    rerender(<WellbeingPrompt open={true} onClose={vi.fn()} entry={other} />)
    expect(screen.getByRole('button', { name: /Note 5 sur 5/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Stress/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('parle de « ce jour-là » pour une note d’un jour passé', () => {
    const old = { ...entry, at: new Date(Date.now() - 3 * 86400000).toISOString() }
    render(<WellbeingPrompt open={true} onClose={vi.fn()} entry={old} />)
    expect(screen.getByText(/Ce jour-là/)).toBeInTheDocument()
    expect(screen.queryByText(/^Aujourd/)).not.toBeInTheDocument()
  })

  it('affiche une erreur si la modification échoue', async () => {
    const { updateEntry } = await import('../storage/localHealthStorage')
    updateEntry.mockRejectedValueOnce(new Error('Entrée introuvable'))
    const onClose = vi.fn()
    render(<WellbeingPrompt open={true} onClose={onClose} entry={entry} />)
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Entrée introuvable/)
    expect(onClose).not.toHaveBeenCalled()
  })
})
