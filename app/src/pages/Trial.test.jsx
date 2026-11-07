import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Trial from './Trial'
import { createTrial } from '../services/trials'

vi.mock('../services/trialsData', async (orig) => ({ ...(await orig()), saveTrial: vi.fn(async () => {}) }))
import { saveTrial } from '../services/trialsData'

const sleep = { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', outcome: 'wellbeing', effect: 0.4, center: 420, usualChange: { amount: 30 } }
const payload = { ...createTrial(sleep, { now: new Date(2026, 10, 1, 9) }), schedule: [...Array(14)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }

const renderTrial = (now, extra = {}) => render(
  <MemoryRouter initialEntries={['/agir/essai/7']}>
    <Routes>
      <Route path="/agir/essai/:id" element={<Trial now={now} read={async () => ({
        trials: [{ id: 7, type: 'trial', payload: { ...payload, ...extra } }],
        summaries: new Map([['2026-11-01', { sleepMinutes: 470 }]]),
        outcomes: { wellbeing: new Map([['2026-11-02', 3.5], ['2026-11-03', 2]]), digestion: new Map() },
      })} />} />
    </Routes>
  </MemoryRouter>,
)

describe('Un essai (ORG-8)', () => {
  it('la consigne du jour, le calendrier, la question seulement si les données manquent', async () => {
    renderTrial(new Date(2026, 10, 3, 10))
    expect(await screen.findByText(/Aujourd’hui, jour avec : dormir au moins 7 h 30/)).toBeInTheDocument()
    expect(screen.getByLabelText(/1 novembre : avec, tenu/)).toHaveTextContent('✓')
    expect(screen.getByText('Nous n’avons pas reçu vos données de sommeil pour hier soir.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Oui' }))
    expect(saveTrial).toHaveBeenCalledWith(7, expect.objectContaining({ answers: { '2026-11-02': true } }))
    expect(screen.getByText('Résultat en cours')).toBeInTheDocument()
    expect(screen.getByText(/dès 3 lendemains de chaque sorte/)).toBeInTheDocument()
    expect(screen.getByText('Pourquoi des jours tirés au sort ?')).toBeInTheDocument()
  })

  it('à la fin : le verdict et « Garder cette habitude »', async () => {
    renderTrial(new Date(2026, 10, 20, 10))
    expect(await screen.findByRole('heading', { name: 'Pas d’effet net' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Garder cette habitude' }))
    expect(saveTrial).toHaveBeenCalledWith(7, expect.objectContaining({ kept: true }))
  })
})
