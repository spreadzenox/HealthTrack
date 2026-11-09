import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Trial from './Trial'
import { createTrial } from '../services/trials'

vi.mock('../services/trialsData', async (orig) => ({ ...(await orig()), saveTrial: vi.fn(async () => {}) }))
import { saveTrial } from '../services/trialsData'

const sleep = { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', outcome: 'wellbeing', effect: 0.4, center: 420, usualChange: { amount: 30 } }
const payload = { ...createTrial(sleep, { now: new Date(2026, 10, 1, 9) }), schedule: [...Array(14)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }

const renderTrial = (now, extra = {}, changes = null) => render(
  <MemoryRouter initialEntries={['/agir/essai/7']}>
    <Routes>
      <Route path="/agir/essai/:id" element={<Trial now={now} readTrialChanges={async () => changes} read={async () => ({
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
    // POLISH-AGIR-TITRES : la consigne est le titre ; la carte du jour ne la répète pas
    expect(await screen.findByRole('heading', { level: 1, name: 'Dormir au moins 7 h 30' })).toBeInTheDocument()
    expect(screen.getByText('Aujourd’hui, jour avec.')).toBeInTheDocument()
    expect(screen.getByLabelText(/1 novembre : avec, tenu/)).toHaveTextContent('✓')
    expect(screen.getByText('Nous n’avons pas reçu vos données de sommeil pour hier soir.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Oui' }))
    expect(saveTrial).toHaveBeenCalledWith(7, expect.objectContaining({ answers: { '2026-11-02': true } }))
    expect(screen.getByText('Résultat en cours')).toBeInTheDocument()
    expect(screen.getByText(/dès 3 lendemains de chaque sorte/)).toBeInTheDocument()
    expect(screen.getByText('Pourquoi des jours tirés au sort ?')).toBeInTheDocument()
  })

  it('POLISH-ESSAI-GRILLE : « Les 14 jours » en deux semaines de 7, numérotées', async () => {
    renderTrial(new Date(2026, 10, 3, 10))
    expect(await screen.findByRole('heading', { name: 'Les 14 jours' })).toBeInTheDocument()
    const weeks = screen.getAllByRole('list', { name: /^Semaine \d/ })
    expect(weeks).toHaveLength(2)
    expect(weeks.map((w) => w.querySelectorAll('li').length)).toEqual([7, 7])
    expect(screen.getByLabelText(/1 novembre : avec, tenu/)).toHaveTextContent('1✓')
    expect(screen.getByLabelText(/14 novembre : sans/)).toHaveTextContent('14')
  })

  it('à la fin : le verdict et « Garder cette habitude »', async () => {
    renderTrial(new Date(2026, 10, 20, 10))
    expect(await screen.findByRole('heading', { name: 'Pas d’effet net' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Garder cette habitude' }))
    expect(saveTrial).toHaveBeenCalledWith(7, expect.objectContaining({ kept: true }))
  })

  it('TS-2 : un changement durable pendant l’essai est signalé', async () => {
    renderTrial(new Date(2026, 10, 9, 10), {}, { wellbeing: [{ date: '2026-11-06', before: 3, after: 2 }] })
    expect(await screen.findByRole('note')).toHaveTextContent('Votre bien-être a changé de niveau pendant l’essai')
  })
})
