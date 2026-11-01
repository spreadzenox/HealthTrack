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

const face = vi.hoisted(() => ({ available: true, enabled: false, status: null, startFaceUnlock: vi.fn() }))
vi.mock('../services/faceSense', async (orig) => ({
  ...(await orig()),
  isFaceSenseAvailable: () => face.available,
  isFaceSenseEnabled: () => face.enabled,
  getFaceSenseStatus: async () => face.status,
  startFaceUnlock: (...a) => face.startFaceUnlock(...a),
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
    face.status = null
    billing.loadPlans.mockResolvedValue([])
    trial.runFaceTrial.mockResolvedValue({ outcome: 'read', estimate: { label: 'plutôt bien', note: 3.4, low: 2.9, high: 3.9 } })
  })

  it('placée après la montre et avant le premier geste ; facultative', () => {
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    renderAt()
    expect(heading()).toBeInTheDocument()
    expect(screen.getByText('04/05')).toBeInTheDocument()
    expect(screen.getByText(/Il ne remplace pas l’avis d’un médecin/)).toBeInTheDocument()
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
    expect(screen.getByText('Vous pourrez l’activer plus tard depuis l’onglet Sources.')).toBeInTheDocument()
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
    fireEvent.click(await screen.findByRole('button', { name: 'Essayer maintenant' }))
    expect(screen.getByText(/Quand vous ouvrez/)).toBeInTheDocument()
  })

  it('déjà activée : le dit sans redemander', () => {
    face.enabled = true
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    renderAt()
    expect(screen.getByText('La lecture du visage est déjà activée.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Essayer maintenant' })).not.toBeInTheDocument()
  })

  describe('variante play avec la lecture au déverrouillage (demande du 31/10)', () => {
    beforeEach(() => {
      variant.name = 'play'
      face.status = { mode: 'app_open', unlockAvailable: true, unlock: false }
      saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
    })

    it('met le déverrouillage en avant : « Activer » principal, « Plus tard » bien visible, rien de précoché', async () => {
      renderAt()
      const activate = await screen.findByRole('button', { name: 'Activer' })
      expect(activate).toHaveClass('btn-primary')
      expect(screen.getByRole('button', { name: 'Plus tard' })).toHaveClass('btn')
      expect(screen.getByText('À chaque déverrouillage')).toBeInTheDocument()
      expect(screen.getByText(/une estimation plus solide/)).toBeInTheDocument()
      expect(screen.getByText(/à chaque déverrouillage du téléphone/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Essayer maintenant' })).not.toBeInTheDocument()
      expect(screen.queryByText(/%/)).not.toBeInTheDocument()
      expect(loadOnboarding().face).toBeUndefined()
      expect(face.startFaceUnlock).not.toHaveBeenCalled()
      // un seul bouton plein à l'écran tant qu'aucun choix n'est fait
      expect(screen.queryByRole('button', { name: 'Continuer' })).not.toBeInTheDocument()
    })

    it('« Plus tard » passe à l’écran suivant sans rien demander', async () => {
      renderAt()
      await screen.findByRole('button', { name: 'Activer' })
      fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }))
      expect(screen.getByRole('heading', { name: 'Comment va votre ventre ?' })).toBeInTheDocument()
      expect(loadOnboarding().face).toBe('later')
      // seul ce « Plus tard » ouvre droit au rappel de l'Accueil (POL-PLAY-84)
      expect(loadOnboarding().unlockLater).toBe(true)
      expect(trial.runFaceTrial).not.toHaveBeenCalled()
      expect(face.startFaceUnlock).not.toHaveBeenCalled()
    })

    it('« Activer » : divulgation complète d’abord, puis lecture d’essai par le déverrouillage', async () => {
      renderAt()
      fireEvent.click(await screen.findByRole('button', { name: 'Activer' }))
      expect(screen.getByText('Avant d’activer la lecture du visage')).toBeInTheDocument()
      expect(screen.getByText(/Aucune image n’est conservée/)).toBeInTheDocument()
      expect(screen.getByText(/bouton « Arrêter »/)).toBeInTheDocument()
      expect(trial.runFaceTrial).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'J’accepte, activer' }))
      await waitFor(() => expect(loadOnboarding().face).toBe('on'))
      expect(cont()).toBeEnabled()
      const opts = trial.runFaceTrial.mock.calls[0][0]
      await opts.start('plugin')
      expect(face.startFaceUnlock).toHaveBeenCalledWith('plugin')
    })

    it('refus respecté : « Plus tard » et « Pas maintenant » ne demandent rien', async () => {
      renderAt()
      fireEvent.click(await screen.findByRole('button', { name: 'Activer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Pas maintenant' }))
      await waitFor(() => expect(loadOnboarding().face).toBe('later'))
      expect(trial.runFaceTrial).not.toHaveBeenCalled()
      expect(loadOnboarding().unlockLater).toBeUndefined()
    })

    it('version play sans l’interrupteur : l’écran habituel, sans mise en avant', async () => {
      face.status = { mode: 'app_open', unlockAvailable: false }
      renderAt()
      expect(await screen.findByRole('button', { name: 'Essayer maintenant' })).toBeInTheDocument()
      expect(screen.queryByText('À chaque déverrouillage')).not.toBeInTheDocument()
    })
  })
})
