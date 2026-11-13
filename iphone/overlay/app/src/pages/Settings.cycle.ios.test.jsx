import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Version iOS (HealthTrack-iOS), CYCLE-iOS-2 (décision du propriétaire du 10/11, « Ok cycle ») : « Mon cycle » coché
// dans les Paramètres après l'accueil → la feuille d'Apple pour le cycle seul, puis les 6 derniers mois relus
// (`askCycleAfterOnboarding`, qui ne fait rien hors de l'iPhone ni avant que Santé ait été autorisée).
vi.mock('../ios/cycleSante', () => ({ askCycleAfterOnboarding: vi.fn(async () => 0) }))

import Settings from './Settings'
import { DebugProvider } from '../contexts/DebugContext'
import { askCycleAfterOnboarding } from '../ios/cycleSante'

const renderSettings = () => render(<DebugProvider><BrowserRouter><Settings /></BrowserRouter></DebugProvider>)

describe('Paramètres : « Mon cycle » et l’app Santé (iPhone)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }))
  })

  it('cocher « Mon cycle » demande le cycle à Santé', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['gut'] }))
    renderSettings()
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Mon cycle' }))
    await waitFor(() => expect(askCycleAfterOnboarding).toHaveBeenCalledTimes(1))
  })

  it('décocher « Mon cycle » ou cocher un autre objectif : rien n’est demandé', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['cycle'] }))
    renderSettings()
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Mon cycle' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Ma digestion' }))
    expect(askCycleAfterOnboarding).not.toHaveBeenCalled()
  })
})
