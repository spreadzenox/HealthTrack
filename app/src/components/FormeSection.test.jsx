import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import FormeSection from './FormeSection'
import { listEntries } from '../storage/localHealthStorage'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn().mockResolvedValue([]),
}))

const daysAgo = (n, h = 7) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(h, 0, 0, 0)
  return d.toISOString()
}

describe('FormeSection', () => {
  beforeEach(() => {
    listEntries.mockReset()
    listEntries.mockResolvedValue([])
  })

  it('un seul titre « Votre forme » et une seule explication de méthode pour radar, cœur et sommeil', async () => {
    render(<BrowserRouter><FormeSection /></BrowserRouter>)
    expect(screen.getByRole('heading', { name: 'Votre forme' })).toBeInTheDocument()
    // Le bloc cœur s'affiche (état vide) une fois chargé.
    expect(await screen.findByRole('link', { name: /Ajouter une montre/ })).toBeInTheDocument()
    expect(screen.queryByText('Votre cœur vs votre norme')).not.toBeInTheDocument()
    expect(screen.queryByText('Régularité du sommeil')).not.toBeInTheDocument()
  })

  it('regroupe les blocs pas encore actifs en une ligne « Bientôt » au lieu de cartes presque vides (POL-6)', async () => {
    // 5 matins de FC au repos et 3 nuits : ni norme cardiaque, ni radar, ni régularité du sommeil.
    const heart = [0, 1, 2, 3, 4].map((n, i) => ({
      id: `hr${i}`, type: 'heart_rate', source: 'health_connect', at: daysAgo(n),
      payload: { bpm: 60, unit: 'bpm', subtype: 'restingHeartRate' },
    }))
    const sleep = [1, 2, 3].map((n, i) => ({
      id: `s${i}`, type: 'sleep', source: 'health_connect', at: daysAgo(n, 0),
      payload: { durationMinutes: 420, sleepState: 'asleep' },
    }))
    listEntries.mockImplementation(async ({ type }) => (type === 'heart_rate' ? heart : type === 'sleep' ? sleep : []))
    render(<BrowserRouter><FormeSection /></BrowserRouter>)
    const soon = await screen.findByTestId('forme-soon')
    expect(within(soon).getByText('Bientôt')).toBeInTheDocument()
    expect(await within(soon).findByText('FC au repos')).toBeInTheDocument()
    expect(within(soon).getByText(/encore \d+ j/)).toBeInTheDocument()
    expect(await within(soon).findByText('Radar forme')).toBeInTheDocument()
    expect(await within(soon).findByText('Horaires de sommeil')).toBeInTheDocument()
    expect(within(soon).getByText(/encore \d+ nuits/)).toBeInTheDocument()
    // Aucune carte « en attente » ni note de méthode tant que rien n'est actif
    expect(document.querySelector('.baseline-card.is-insufficient')).toBeNull()
    expect(screen.queryByText(/Le radar s’active/)).not.toBeInTheDocument()
    expect(screen.queryByText('Comment c’est calculé')).not.toBeInTheDocument()
  })
})
