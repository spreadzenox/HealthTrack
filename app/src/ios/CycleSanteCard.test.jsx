import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Version iOS (HealthTrack-iOS), CYCLE-iOS-3 (décision du propriétaire du 10/11, « Ok cycle ») : dans Sources, « Suivi
// du cycle (Santé) » propose la lecture du cycle à qui a « Mon cycle » et a autorisé Santé avant que le cycle y soit.
vi.mock('./cycleSante', () => ({ shouldOfferCycleSante: vi.fn(() => true), askCycleAfterOnboarding: vi.fn(async () => 12) }))

import CycleSanteCard from './CycleSanteCard'
import { askCycleAfterOnboarding, shouldOfferCycleSante } from './cycleSante'

describe('Sources : « Suivi du cycle (Santé) » (iPhone)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shouldOfferCycleSante.mockReturnValue(true)
    localStorage.clear()
  })

  it('dit ce qui est lu et que rien ne quitte le téléphone ; le bouton demande le cycle à Santé', async () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['cycle'] }))
    render(<CycleSanteCard />)
    expect(screen.getByRole('heading', { name: 'Suivi du cycle (Santé)' })).toBeInTheDocument()
    expect(screen.getByText(/Lus sur ce téléphone, jamais envoyés/)).toBeInTheDocument()
    expect(shouldOfferCycleSante).toHaveBeenCalledWith({ goals: ['cycle'] })
    fireEvent.click(screen.getByRole('button', { name: 'Lire mon cycle dans Santé' }))
    expect(await screen.findByRole('status')).toHaveTextContent('12 notes de cycle ajoutées à votre journal.')
    expect(askCycleAfterOnboarding).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Lire mon cycle dans Santé' })).toBeNull()
  })

  it('une seule note : au singulier', async () => {
    askCycleAfterOnboarding.mockResolvedValueOnce(1)
    render(<CycleSanteCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Lire mon cycle dans Santé' }))
    expect(await screen.findByRole('status')).toHaveTextContent('1 note de cycle ajoutée à votre journal.')
  })

  it('rien de reçu : le dit sans parler d’erreur (Santé ne dit jamais ce qui est refusé)', async () => {
    askCycleAfterOnboarding.mockResolvedValueOnce(0)
    render(<CycleSanteCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Lire mon cycle dans Santé' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Rien de noté dans Santé pour l’instant')
  })

  it('rien à proposer (pas « Mon cycle », Santé pas encore autorisée, cycle déjà demandé, Android) : rien d’affiché', () => {
    shouldOfferCycleSante.mockReturnValue(false)
    const { container } = render(<CycleSanteCard />)
    expect(container).toBeEmptyDOMElement()
  })
})
