import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const variant = vi.hoisted(() => ({ name: 'sideload' }))
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    get DISTRIBUTION() {
      return variant.name
    },
    get FEATURES() {
      return actual.featuresFor(variant.name)
    },
  }
})

const store = vi.hoisted(() => ({ createEntry: vi.fn(), updateEntry: vi.fn() }))
vi.mock('../storage/localHealthStorage', async (orig) => ({ ...(await orig()), ...store }))

const billing = vi.hoisted(() => ({ loadPlans: vi.fn() }))
vi.mock('../services/playBilling', async (importOriginal) => ({ ...(await importOriginal()), ...billing }))

import Onboarding from './Onboarding'
import { loadOnboarding, saveOnboarding } from '../settings/onboarding'

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/bienvenue']}>
      <Routes>
        <Route path="/bienvenue" element={<Onboarding />} />
        <Route path="/" element={<p>Page Aujourd’hui</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const cont = () => screen.getByRole('button', { name: 'Continuer' })

describe('Onboarding (jalon 4c) : premier geste et paywall passable', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    variant.name = 'sideload'
    store.createEntry.mockResolvedValue(42)
    store.updateEntry.mockResolvedValue({})
    billing.loadPlans.mockResolvedValue([])
  })

  it('objectif ventre : Calme / Gêne / Douleur, horodaté, premier jour de suivi', async () => {
    saveOnboarding({ goal: 'gut', watch: 'none', step: 4 })
    renderAt()
    expect(screen.getByRole('heading', { name: 'Comment va votre digestion ?' })).toBeInTheDocument()
    expect(screen.getByText('05/05')).toBeInTheDocument()
    // Facultatif : on peut continuer sans répondre
    expect(cont()).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Gêne' }))
    await waitFor(() =>
      expect(store.createEntry).toHaveBeenCalledWith({ type: 'gut', source: 'app_gut', payload: { level: 'discomfort' } }),
    )
    expect(await screen.findByText(/premier jour de suivi/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gêne' })).toHaveAttribute('aria-pressed', 'true')
    expect(loadOnboarding()).toMatchObject({ gesture: { type: 'gut', id: 42, value: 'discomfort' } })
    // Changer d'avis modifie la même note, sans en créer une deuxième
    fireEvent.click(screen.getByRole('button', { name: 'Calme' }))
    await waitFor(() => expect(store.updateEntry).toHaveBeenCalledWith(42, { payload: { level: 'calm' } }))
    expect(store.createEntry).toHaveBeenCalledTimes(1)
    fireEvent.click(cont())
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
  })

  it('objectif énergie : « Comment vous sentez-vous ? » de 1 à 5, stockée comme une note saisie (TESTEUR-2a)', async () => {
    saveOnboarding({ goal: 'energy', watch: 'none', step: 4 })
    renderAt()
    expect(screen.getByRole('heading', { name: 'Comment vous sentez-vous ?' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '0 sur 5' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /sur 5$/ })).toHaveLength(5)
    expect(screen.getByText('1 = très mal, 5 = très bien')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '4 sur 5' }))
    // 4 affiché = 3,75 interne, comme la fenêtre de note (wellbeingScale.choiceToScore)
    await waitFor(() =>
      expect(store.createEntry).toHaveBeenCalledWith({ type: 'wellbeing', source: 'app_wellbeing', payload: { score: 3.75 } }),
    )
    // L'état « choisi » suit l'enregistrement asynchrone : attendu, pas lu tout de suite (instable sous charge en CI)
    await waitFor(() => expect(screen.getByRole('button', { name: '4 sur 5' })).toHaveAttribute('aria-pressed', 'true'))
    expect(await screen.findByText(/C’est noté/)).toBeInTheDocument()
  })

  it('variante sideload : pas d’écran d’abonnement, l’onboarding finit sur le premier geste', async () => {
    saveOnboarding({ goal: 'gut', watch: 'none', step: 4 })
    renderAt()
    fireEvent.click(cont())
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(billing.loadPlans).not.toHaveBeenCalled()
  })

  it('variante play : paywall soft en dernier, « Continuer gratuitement » termine l’onboarding', async () => {
    variant.name = 'play'
    saveOnboarding({ goal: 'gut', watch: 'none', step: 4 })
    renderAt()
    expect(screen.getByText('05/06')).toBeInTheDocument()
    fireEvent.click(cont())
    expect(await screen.findByRole('heading', { name: /bons et mauvais jours/ })).toBeInTheDocument()
    expect(screen.getByText('06/06')).toBeInTheDocument()
    expect(screen.getByText(/Vos pistes arriveront vers le/)).toBeInTheDocument()
    // Le bouton « Continuer » de l'onboarding laisse la place à celui du paywall
    expect(screen.queryByRole('button', { name: 'Continuer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Plus tard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Passer' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continuer gratuitement' }))
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(loadOnboarding()).toMatchObject({ done: true, endedBy: 'completed' })
  })

  it('variante play : la croix du paywall termine aussi l’onboarding', async () => {
    variant.name = 'play'
    saveOnboarding({ goal: 'gut', watch: 'none', step: 5 })
    renderAt()
    fireEvent.click(await screen.findByRole('button', { name: 'Fermer' }))
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(loadOnboarding().done).toBe(true)
  })
})
