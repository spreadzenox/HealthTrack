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
import { FLOW_VERSION, loadOnboarding, saveOnboarding } from '../settings/onboarding'

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
const heading = () => screen.getByRole('heading', { name: 'Votre bien-être, sans rien noter' })
const atFace = (extra = {}) => saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'face', goals: ['gut'], ...extra })

describe('Nouvel accueil (ACC-6) : lecture du visage facultative', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    variant.name = 'sideload'
    face.available = true
    face.enabled = false
    face.status = null
    billing.loadPlans.mockResolvedValue([])
    trial.runFaceTrial.mockResolvedValue({ outcome: 'read', estimate: { label: 'plutôt bien', note: 3.4, low: 2.9, hi: 3.9 } })
  })

  it('après « ce qui a été trouvé », avant la première note ; divulgation en cinq lignes ; compteur 05/06', () => {
    atFace()
    renderAt()
    expect(heading()).toBeInTheDocument()
    expect(screen.getByText('05/06')).toBeInTheDocument()
    for (const t of ['Ce qui est lu', 'Ce qui est gardé', 'Où', 'Ce que c’est', 'Comment l’arrêter']) expect(screen.getByText(t)).toBeInTheDocument()
    expect(screen.getByText(/pas un avis médical/)).toBeInTheDocument()
    expect(screen.getByText('À chaque déverrouillage')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activer' })).toHaveClass('btn-primary')
    // un seul bouton plein tant qu'aucun choix n'est fait
    expect(screen.queryByRole('button', { name: 'Continuer' })).not.toBeInTheDocument()
  })

  it('absente quand le téléphone ne sait pas lire le visage (compteur 05/05)', () => {
    face.available = false
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'first' })
    renderAt()
    expect(screen.getByRole('heading', { name: 'Comment vous sentez-vous maintenant ?' })).toBeInTheDocument()
    expect(screen.getByText('05/05')).toBeInTheDocument()
  })

  it('« Plus tard » passe à la suite sans rien demander', () => {
    atFace()
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }))
    expect(trial.runFaceTrial).not.toHaveBeenCalled()
    expect(loadOnboarding()).toMatchObject({ face: 'later', unlockLater: true })
    expect(screen.getByRole('heading', { name: 'Comment vous sentez-vous maintenant ?' })).toBeInTheDocument()
  })

  it('« Activer » lance la lecture d’un geste (la divulgation est sur l’écran) ; puis « Continuer »', async () => {
    atFace()
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Activer' }))
    await waitFor(() => expect(loadOnboarding().face).toBe('on'))
    expect(trial.runFaceTrial).toHaveBeenCalledOnce()
    expect(screen.getByText('C’est activé.')).toBeInTheDocument()
    expect(cont()).toBeEnabled()
  })

  it('caméra refusée : le dit, rien d’activé, on peut réessayer', async () => {
    trial.runFaceTrial.mockResolvedValue({ outcome: 'denied', estimate: null })
    atFace()
    renderAt()
    fireEvent.click(screen.getByRole('button', { name: 'Activer' }))
    await waitFor(() => expect(screen.getByText(/Accès à la caméra refusé/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Activer' })).toBeInTheDocument()
    expect(cont()).toBeEnabled()
  })

  it('déjà activée : le dit sans redemander', () => {
    face.enabled = true
    atFace()
    renderAt()
    expect(screen.getByText('C’est activé.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Activer' })).not.toBeInTheDocument()
  })

  describe('variante play', () => {
    beforeEach(() => {
      variant.name = 'play'
    })

    it('avec la lecture au déverrouillage : deux tuiles, le déverrouillage choisi d’avance, la notification annoncée', async () => {
      face.status = { mode: 'app_open', unlockAvailable: true, unlock: false }
      atFace()
      renderAt()
      expect(await screen.findByText('À chaque déverrouillage')).toBeInTheDocument()
      expect(screen.getByText('Quand vous ouvrez Halcya')).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /À chaque déverrouillage/ })).toBeChecked()
      expect(screen.getByText(/Android vous demandera ensuite les notifications/)).toBeInTheDocument()
      expect(loadOnboarding().face).toBeUndefined()
      fireEvent.click(screen.getByRole('button', { name: 'Activer' }))
      await waitFor(() => expect(loadOnboarding().face).toBe('on'))
      const opts = trial.runFaceTrial.mock.calls[0][0]
      await opts.start('plugin')
      expect(face.startFaceUnlock).toHaveBeenCalledWith('plugin')
    })

    it('« Quand vous ouvrez Halcya » choisi : lecture à l’ouverture, sans annonce de notification', async () => {
      face.status = { mode: 'app_open', unlockAvailable: true, unlock: false }
      atFace()
      renderAt()
      fireEvent.click(await screen.findByRole('radio', { name: /Quand vous ouvrez Halcya/ }))
      expect(screen.queryByText(/Android vous demandera ensuite les notifications/)).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Activer' }))
      await waitFor(() => expect(loadOnboarding().face).toBe('on'))
      expect(trial.runFaceTrial.mock.calls[0][0]).toBeUndefined()
    })

    it('sans l’interrupteur faceUnlockPlay : seulement « Quand vous ouvrez Halcya »', async () => {
      face.status = { mode: 'app_open', unlockAvailable: false }
      atFace()
      renderAt()
      expect(await screen.findByText('Quand vous ouvrez Halcya')).toBeInTheDocument()
      expect(screen.queryByText('À chaque déverrouillage')).not.toBeInTheDocument()
    })
  })
})

describe('Nouvel accueil (ACC-9) : Gold pendant le test, abonnement sinon', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    variant.name = 'play'
    face.available = false
    billing.loadPlans.mockResolvedValue([])
  })

  it('période de lancement : un écran court « Gold est offert pendant le test », date du relais, puis Aujourd’hui', async () => {
    localStorage.setItem('halcya_entitlement', JSON.stringify({ premium: true, source: 'launch', launchUntil: '2026-12-02T23:00:00Z' }))
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'premium' })
    renderAt()
    expect(screen.getByText('06/06')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Gold est offert pendant le test' })).toBeInTheDocument()
    expect(screen.getByText(/jusqu’au .*déc.* inclus\. Aucune carte bancaire n’est demandée\./)).toBeInTheDocument()
    // POLISH-SIM-18 : une persona peu technique ne savait pas ce qu'est « Gold » ni de quel « test » on parle.
    expect(screen.getByText(/Gold est la formule payante de Halcya/)).toBeInTheDocument()
    expect(screen.getByText(/l’app est encore en test/)).toBeInTheDocument()
    fireEvent.click(cont())
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(loadOnboarding().done).toBe(true)
  })

  it('hors période : l’écran d’abonnement, sans croix qui double « Continuer gratuitement »', async () => {
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'premium' })
    renderAt()
    expect(screen.queryByRole('button', { name: 'Fermer' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continuer gratuitement' }))
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
  })
})
