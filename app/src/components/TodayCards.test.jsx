import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { GutCard, MeasureTiles, PistesTeaser } from './TodayCards'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
  createEntry: vi.fn(),
}))

const wrap = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>)

describe('MeasureTiles', () => {
  const tiles = [
    { key: 'sleep', label: 'Sommeil', value: '7 h 32', sources: ['Health Connect · Garmin'] },
    { key: 'hrv', label: 'VFC', value: null, sources: [] },
    { key: 'steps', label: 'Pas', value: '3 456', sources: ['Montre Huawei'] },
  ]

  it('montre les chiffres, et leur source en mode détails', () => {
    const { rerender } = wrap(<MeasureTiles tiles={tiles} />)
    expect(screen.getByText('7 h 32')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('Health Connect · Garmin')).not.toBeInTheDocument()
    rerender(<BrowserRouter><MeasureTiles tiles={tiles} details /></BrowserRouter>)
    expect(screen.getByText('Health Connect · Garmin')).toBeInTheDocument()
    expect(screen.getByText('aucune source')).toBeInTheDocument()
  })

  it('propose d’ajouter une source quand rien n’est mesuré', () => {
    wrap(<MeasureTiles tiles={tiles.map((t) => ({ ...t, value: null }))} />)
    expect(screen.getByRole('link', { name: 'Ajouter une source' })).toHaveAttribute('href', '/connectors')
  })
})

describe('GutCard', () => {
  beforeEach(async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    createEntry.mockReset()
    createEntry.mockResolvedValue(1)
  })

  it('note Calme / Gêne / Douleur en un geste, horodaté, et prévient les autres écrans', async () => {
    const { createEntry } = await import('../storage/localHealthStorage')
    const updated = vi.fn()
    window.addEventListener('health-entries-updated', updated)
    wrap(<GutCard read={async () => []} />)
    expect(await screen.findByText(/Un geste suffit/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gêne' }))
    await waitFor(() => expect(createEntry).toHaveBeenCalledWith({ type: 'gut', source: 'app_gut', payload: { level: 'discomfort' } }))
    await waitFor(() => expect(updated).toHaveBeenCalled())
    window.removeEventListener('health-entries-updated', updated)
  })

  it('montre la dernière note du jour, et le bilan de 7 jours en mode détails', async () => {
    const at = new Date()
    at.setHours(8, 15, 0, 0)
    const read = async () => [{ type: 'gut', source: 'app_gut', at: at.toISOString(), payload: { level: 'calm' } }]
    wrap(<GutCard read={read} details onToggleDetails={() => {}} />)
    expect(await screen.findByText('Dernière note : Calme, à 08:15.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Calme' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('7 jours · 1 note : 1 calme · 6 jours sans note')).toBeInTheDocument()
  })
})

describe('PistesTeaser', () => {
  const day = (back) => {
    const d = new Date()
    d.setDate(d.getDate() - back)
    return { type: 'food', at: d.toISOString() }
  }

  it('compte les jours avant les pistes et préfère attendre', async () => {
    wrap(<PistesTeaser read={async () => [day(0), day(1), day(1), day(3)]} />)
    expect(await screen.findByText('Vos pistes arrivent dans 18 jours')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Jours suivis' })).toHaveAttribute('aria-valuenow', '3')
    expect(screen.getByText('3/21 jours avec un repas ou une note du ventre (6 dernières semaines)')).toBeInTheDocument()
    expect(screen.getByText('On préfère attendre plutôt que de vous montrer de faux suspects.')).toBeInTheDocument()
  })

  it('dit les délais et la correction en mode détails, sans promettre plus que l’existant une fois prêt', async () => {
    wrap(<PistesTeaser read={async () => Array.from({ length: 25 }, (_, i) => day(i))} details onToggleDetails={() => {}} />)
    expect(await screen.findByText('Assez de jours pour chercher des pistes')).toBeInTheDocument()
    expect(screen.getByText(/arrivent dans une prochaine version/)).toBeInTheDocument()
    expect(screen.getByText(/Délais qui seront testés : 0–4 h, 4–24 h, 24–48 h/)).toBeInTheDocument()
  })
})
