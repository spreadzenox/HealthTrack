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

const face = vi.hoisted(() => ({ available: true, enabled: false }))
vi.mock('../services/faceSense', async (orig) => ({
  ...(await orig()),
  isFaceSenseAvailable: () => face.available,
  isFaceSenseEnabled: () => face.enabled,
}))
const trial = vi.hoisted(() => ({ runFaceTrial: vi.fn() }))
vi.mock('../services/faceTrial', async (orig) => ({ ...(await orig()), ...trial }))

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
const heading = () => screen.getByRole('heading', { name: 'Votre bien-être, estimé tout seul' })

describe('Onboarding (jalon 4c-2) : lecture du visage facultative', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    variant.name = 'sideload'
    face.available = true
    face.enabled = false
    billing.loadPlans.mockResolvedValue([])
    trial.runFaceTrial.mockResolvedValue({ outcome: 'read', estimate: { label: 'plutôt bien', note: 3.4, low: 2.9, high: 3.9 } })
  })

  it('placée après la montre et avant le premier geste ; facultative', () => {
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    renderAt()
    expect(heading()).toBeInTheDocument()
    expect(screen.getByText('04/05')).toBeInTheDocument()
    expect(screen.getByText(/pas un diagnostic/)).toBeInTheDocument()
    expect(screen.getByText(/quand vous déverrouillez le téléphone/)).toBeInTheDocument()
    expect(cont()).toBeEnabled()
    fireEvent.click(cont())
    expect(screen.getByRole('heading', { name: 'Comment va votre ventre ?' })).toBeInTheDocument()
  })

  it('absente quand le téléphone ne sait pas lire le visage', () => {
    face.available = false
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    renderAt()
    expect(screen.getByRole('heading', { name: 'Comment va votre ventre ?' })).toBeInTheDocument()
    expect(screen.getByText('04/04')).toBeInTheDocument()
  })

  it('« Plus tard » ne demande rien', () => {
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }))
    expect(trial.runFaceTrial).not.toHaveBeenCalled()
    expect(screen.queryByText('Avant d’autoriser la caméra')).not.toBeInTheDocument()
    expect(loadOnboarding().face).toBe('later')
    expect(screen.getByText(/depuis l’onglet Sources/)).toBeInTheDocument()
  })

  it('« Essayer maintenant » : divulgation puis lecture d’essai et son estimation', async () => {
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Essayer maintenant' }))
    expect(screen.getByText('Avant d’autoriser la caméra')).toBeInTheDocument()
    expect(trial.runFaceTrial).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'J’accepte, autoriser la caméra' }))
    await waitFor(() => expect(screen.getByText(/Lecture faite : plutôt bien/)).toBeInTheDocument())
    expect(screen.getByText('3,4 / 5')).toBeInTheDocument()
    expect(trial.runFaceTrial).toHaveBeenCalledOnce()
    expect(loadOnboarding().face).toBe('on')
    expect(screen.queryByRole('button', { name: 'Essayer maintenant' })).not.toBeInTheDocument()
  })

  it('« Pas maintenant » dans la divulgation : rien n’est demandé à Android', async () => {
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Essayer maintenant' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pas maintenant' }))
    await waitFor(() => expect(loadOnboarding().face).toBe('later'))
    expect(trial.runFaceTrial).not.toHaveBeenCalled()
  })

  it('caméra refusée : le dit, rien d’activé, on peut réessayer', async () => {
    trial.runFaceTrial.mockResolvedValue({ outcome: 'denied', estimate: null })
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Essayer maintenant' }))
    fireEvent.click(screen.getByRole('button', { name: 'J’accepte, autoriser la caméra' }))
    await waitFor(() => expect(screen.getByText(/Accès à la caméra refusé/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Essayer maintenant' })).toBeInTheDocument()
  })

  it('variante play : divulgation « à l’ouverture de l’app »', async () => {
    variant.name = 'play'
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    renderAt()
    expect(screen.getByText(/quand vous ouvrez l’app/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Essayer maintenant' }))
    expect(screen.getByText(/Quand vous ouvrez/)).toBeInTheDocument()
  })

  it('déjà activée : le dit sans redemander', () => {
    face.enabled = true
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    renderAt()
    expect(screen.getByText('La lecture du visage est déjà activée.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Essayer maintenant' })).not.toBeInTheDocument()
  })
})
