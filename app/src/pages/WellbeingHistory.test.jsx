import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

const loadWellbeingHistory = vi.fn()
vi.mock('../services/mood/faceMoodData', () => ({ loadWellbeingHistory: (...a) => loadWellbeingHistory(...a) }))
vi.mock('../components/WellbeingPrompt', () => ({ default: ({ open }) => (open ? <div>note manuelle ouverte</div> : null) }))

import WellbeingHistory from './WellbeingHistory'

const NOW = new Date(2026, 9, 24, 20)
const history = (over = {}) => ({
  period: 'week',
  from: new Date(2026, 9, 18).toISOString(),
  points: [
    { at: new Date(2026, 9, 22, 19).toISOString(), date: '2026-10-22', note: 3.1, readings: 5, few: false },
    { at: new Date(2026, 9, 23, 9).toISOString(), date: '2026-10-23', note: 3.6, readings: 2, few: true },
  ],
  notes: [{ at: new Date(2026, 9, 23, 21).toISOString(), score: 4 }],
  readings: 7, days: 2, mean: 3.35, valence: 0.21, arousal: -0.12,
  expressions: { readings: 3, items: [
    { key: 'exHappiness', label: 'Joie', p: 0.42 }, { key: 'exNeutral', label: 'Neutre', p: 0.38 },
    { key: 'exSurprise', label: 'Surprise', p: 0.06 }, { key: 'exSadness', label: 'Tristesse', p: 0.05 },
    { key: 'exAnger', label: 'Colère', p: 0.03 }, { key: 'exFear', label: 'Peur', p: 0.02 },
    { key: 'exDisgust', label: 'Dégoût', p: 0.02 }, { key: 'exContempt', label: 'Mépris', p: 0.02 },
  ] },
  ...over,
})

const renderPage = () => render(<BrowserRouter><WellbeingHistory now={NOW} /></BrowserRouter>)

describe('WellbeingHistory — historique du bien-être (POL-2)', () => {
  beforeEach(() => {
    loadWellbeingHistory.mockReset()
    loadWellbeingHistory.mockImplementation(({ period }) => Promise.resolve(history({ period })))
  })

  it('montre la moyenne, la courbe, la légende et le détail des modèles comme des estimations', async () => {
    renderPage()
    expect(await screen.findByText('3,4')).toBeInTheDocument()
    expect(screen.getByText(/7 lectures · 2 jours · 1 note à la main/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Bien-être estimé ces 7 jours : 2 jours/ })).toBeInTheDocument()
    expect(screen.getByText('peu de lectures')).toBeInTheDocument()
    expect(screen.getByText('noté à la main')).toBeInTheDocument()
    expect(screen.getByText('Valence')).toBeInTheDocument()
    expect(screen.getByText('+0,21')).toBeInTheDocument()
    expect(screen.getByText('−0,12')).toBeInTheDocument()
    expect(screen.getByText('Joie')).toBeInTheDocument()
    expect(screen.getByText('42 %')).toBeInTheDocument()
    expect(screen.getByText(/pas de ce que vous ressentez, ni un diagnostic/)).toBeInTheDocument()
    expect(screen.getByText(/aucune image/)).toBeInTheDocument()
  })

  it('étiquette les 7 jours de la semaine sans ambiguïté (deux lettres, aucun doublon) (POL-PLAY-18)', async () => {
    const { container } = renderPage()
    await screen.findByText('3,4')
    const labels = [...container.querySelectorAll('svg.wbh-chart text.wbh-axis')]
      .map((t) => t.textContent).filter((t) => !/^\d/.test(t))
    expect(labels).toEqual(['di', 'lu', 'ma', 'me', 'je', 've', 'sa'])
  })

  it('change de période : jour, semaine, mois', async () => {
    renderPage()
    await screen.findByText('3,4')
    expect(loadWellbeingHistory).toHaveBeenLastCalledWith({ period: 'week', now: NOW })
    fireEvent.click(screen.getByRole('button', { name: 'Mois' }))
    await waitFor(() => expect(loadWellbeingHistory).toHaveBeenLastCalledWith({ period: 'month', now: NOW }))
    expect(screen.getByRole('button', { name: 'Mois' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Jour' }))
    await waitFor(() => expect(loadWellbeingHistory).toHaveBeenLastCalledWith({ period: 'day', now: NOW }))
  })

  it('sans lecture : un état vide qui renvoie vers Sources, et « Noter moi-même » reste là', async () => {
    loadWellbeingHistory.mockResolvedValue(history({ points: [], notes: [], readings: 0, days: 0, mean: null, valence: null, arousal: null, expressions: null }))
    renderPage()
    expect(await screen.findByText(/Aucune lecture ces 7 jours/)).toBeInTheDocument()
    expect(screen.queryByText('Ce que lisent les modèles')).not.toBeInTheDocument()
    expect(screen.queryByText(/0 lecture/)).not.toBeInTheDocument()
    expect(screen.queryByText('estimé (visage)')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Noter moi-même' }))
    expect(screen.getByText('note manuelle ouverte')).toBeInTheDocument()
  })

  it('lectures sans expressions (anciennes) : le dit simplement', async () => {
    loadWellbeingHistory.mockResolvedValue(history({ expressions: null }))
    renderPage()
    expect(await screen.findByText(/apparaîtront avec les prochaines lectures/)).toBeInTheDocument()
  })
})
