import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nutrition from './Nutrition'

vi.mock('../storage/localHealthStorage', () => ({
  listEntriesForAnalysis: vi.fn().mockResolvedValue([]),
  createEntry: vi.fn().mockResolvedValue(1),
}))

import { listEntriesForAnalysis, createEntry } from '../storage/localHealthStorage'

const yesterdayNoon = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

describe('Nutrition page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
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

  it('shows per-day averages vs daily targets, sodium as a limit', async () => {
    listEntriesForAnalysis.mockResolvedValueOnce([
      {
        type: 'food',
        at: yesterdayNoon(),
        payload: { items: [{ ingredient: 'Abat, cuit (aliment moyen)', quantity_g: 200 }] },
      },
    ])
    render(
      <MemoryRouter>
        <Nutrition />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/1 jour saisi/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'À limiter' })).toBeInTheDocument()
    expect(screen.getByText(/max 2 000 mg/)).toBeInTheDocument()
    expect(screen.getByText(/obj\. 30 g/)).toBeInTheDocument()
    expect(screen.getByText(/pas un diagnostic/i)).toBeInTheDocument()
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

  it('signale les valeurs par défaut et invite à compléter le profil', async () => {
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
    expect(await screen.findByText(/70 kg/)).toBeInTheDocument()
    expect(screen.getAllByText(/par défaut/).length).toBeGreaterThanOrEqual(4)
    expect(screen.getByRole('button', { name: /compléter mon profil/i })).toBeInTheDocument()
  })

  it('enregistre le profil saisi et une pesée, puis recalcule les repères', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /compléter mon profil/i }))
    fireEvent.click(screen.getByRole('radio', { name: 'Femme' }))
    fireEvent.change(screen.getByLabelText(/année de naissance/i), { target: { value: '1990' } })
    fireEvent.change(screen.getByLabelText(/taille/i), { target: { value: '165' } })
    fireEvent.change(screen.getByLabelText(/poids/i), { target: { value: '60,5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(createEntry).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'weight', source: 'app_weight', payload: { valueKg: 60.5 } }),
    ))
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'health-entries-updated' }))
    expect(JSON.parse(localStorage.getItem('healthtrack_body_profile'))).toEqual({ sex: 'F', birthYear: 1990, heightCm: 165 })
    expect(await screen.findByText('Femme')).toBeInTheDocument()
    expect(screen.getByText(/165 cm/)).toBeInTheDocument()
  })

  it('n\'ajoute pas de pesée si le poids n\'a pas changé', async () => {
    listEntriesForAnalysis.mockResolvedValue([
      { type: 'weight', source: 'withings', at: yesterdayNoon(), payload: { valueKg: 77.2 } },
    ])
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /modifier/i }))
    expect(screen.getByLabelText(/poids/i)).toHaveValue('77,2')
    fireEvent.click(screen.getByRole('radio', { name: 'Homme' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Homme')).toBeInTheDocument()
    expect(createEntry).not.toHaveBeenCalled()
    listEntriesForAnalysis.mockResolvedValue([])
  })

  it('refuse un poids invalide sans rien enregistrer', async () => {
    render(<MemoryRouter><Nutrition /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /compléter mon profil/i }))
    fireEvent.change(screen.getByLabelText(/poids/i), { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/poids/i)
    expect(createEntry).not.toHaveBeenCalled()
  })
})
