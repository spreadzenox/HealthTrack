import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WellbeingPrompt from './WellbeingPrompt'

vi.mock('../storage/localHealthStorage', () => ({
  createEntry: vi.fn(() => Promise.resolve(1)),
  updateEntry: vi.fn(() => Promise.resolve()),
  listEntries: vi.fn(() => Promise.resolve([])),
  upsertEntries: vi.fn(() => Promise.resolve({ inserted: 1, skipped: 0 })),
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

  it('does not open by itself when a note was saved less than 3 h ago', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    listEntries.mockImplementation(async ({ type }) => (type === 'wellbeing' ? [{ id: 1, type: 'wellbeing', at: recent, payload: { score: 3 } }] : []))
    try {
      const { container } = render(<WellbeingPrompt />)
      await waitFor(() => expect(listEntries).toHaveBeenCalledWith(expect.objectContaining({ type: 'wellbeing' })))
      expect(container.querySelector('.wellbeing-modal')).not.toBeInTheDocument()
    } finally {
      listEntries.mockImplementation(async () => [])
    }
  })

  it('says the scale in one line, without the privacy sentence', async () => {
    render(<WellbeingPrompt />)
    expect(await screen.findByText('0 = très bas, 5 = très bien.')).toBeInTheDocument()
    expect(screen.queryByText(/restent sur cet appareil/i)).not.toBeInTheDocument()
  })

  it('has no tag explanation when nothing is captured automatically', async () => {
    render(<WellbeingPrompt />)
    await screen.findByRole('dialog')
    expect(screen.queryByText(/Ces tags permettent/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Repéré sans vous/i)).not.toBeInTheDocument()
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
  beforeEach(async () => {
    vi.clearAllMocks()
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockImplementation(() => Promise.resolve([]))
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

  it('no longer asks for « Écran tard » when the phone measures it', () => {
    localStorage.setItem('healthtrack_phone_usage', JSON.stringify({ enabled: true }))
    try {
      render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /Écran tard/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Alcool/i })).toBeInTheDocument()
      expect(screen.getByText(/Repéré sans vous : Écran tard \(≥ 30 min après 22 h\)/i)).toBeInTheDocument()
    } finally {
      localStorage.removeItem('healthtrack_phone_usage')
    }
  })

  it('no longer asks for « Sport le soir » when workouts are recorded (watch / Health Connect)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValueOnce([
      { id: 9, type: 'activity', source: 'huawei_watch', at: new Date().toISOString(), payload: { workoutType: 'running', durationSeconds: 2400 } },
    ])
    render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    expect(await screen.findByText(/Sport le soir \(séance après 18 h\)/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sport le soir/i })).not.toBeInTheDocument()
    expect(listEntries).toHaveBeenCalledWith(expect.objectContaining({ type: 'activity' }))
  })

  it('no longer asks for « Repas tardif » when meals are noted regularly (≥ 2 a day, 7 of 14 days)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const meals = []
    for (let d = 1; d <= 7; d++) {
      for (const h of [12, 19]) {
        const at = new Date()
        at.setDate(at.getDate() - d)
        at.setHours(h, 0, 0, 0)
        meals.push({ id: `${d}-${h}`, type: 'food', at: at.toISOString(), payload: { items: [] } })
      }
    }
    listEntries.mockImplementation(async ({ type }) => (type === 'food' ? meals : []))
    render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    expect(await screen.findByText(/Repas tardif \(repas noté après 21 h\)/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Repas tardif/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sport le soir/i })).toBeInTheDocument()
  })

  it('no longer asks for « Voyage » on a day the time zone changed, and asks again otherwise', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const today = new Date()
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12)
    const ctx = (d, tz) => ({ id: tz, type: 'context', at: d.toISOString(), payload: { date: key(d), tz, tzOffset: 0 } })
    listEntries.mockImplementation(async ({ type }) => (type === 'context' ? [ctx(yesterday, 'Europe/Paris'), ctx(today, 'Asia/Tokyo')] : []))
    const { unmount } = render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    expect(await screen.findByText(/Voyage \(fuseau horaire changé aujourd’hui\)/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Voyage/i })).not.toBeInTheDocument()
    unmount()

    listEntries.mockImplementation(async ({ type }) => (type === 'context' ? [ctx(yesterday, 'Europe/Paris'), ctx(today, 'Europe/Paris')] : []))
    render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    await waitFor(() => expect(listEntries).toHaveBeenCalledWith(expect.objectContaining({ type: 'context' })))
    expect(screen.getByRole('button', { name: /Voyage/i })).toBeInTheDocument()
  })

  it('still asks for « Repas tardif » when meals are rarely noted', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockImplementation(async ({ type }) => (type === 'food' ? [{ id: 1, type: 'food', at: new Date().toISOString(), payload: {} }] : []))
    render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    await waitFor(() => expect(listEntries).toHaveBeenCalledWith(expect.objectContaining({ type: 'food' })))
    expect(screen.getByRole('button', { name: /Repas tardif/i })).toBeInTheDocument()
  })

  it('still asks for « Sport le soir » when no workout is recorded', async () => {
    render(<WellbeingPrompt open={true} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Sport le soir/i })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /Sport le soir/i })).toBeInTheDocument())
  })

  it('keeps showing « Écran tard » on an old note that has it, so it can be removed', () => {
    localStorage.setItem('healthtrack_phone_usage', JSON.stringify({ enabled: true }))
    try {
      const entry = { id: 3, type: 'wellbeing', at: new Date().toISOString(), payload: { score: 3, tags: ['late_screen'] } }
      render(<WellbeingPrompt open={true} onClose={vi.fn()} entry={entry} />)
      expect(screen.getByRole('button', { name: /Écran tard/i })).toHaveAttribute('aria-pressed', 'true')
    } finally {
      localStorage.removeItem('healthtrack_phone_usage')
    }
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
