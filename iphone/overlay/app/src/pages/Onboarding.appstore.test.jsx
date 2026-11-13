import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'

// Version iOS (HealthTrack-iOS) : nouvel accueil d'Android (ACC-1 à ACC-10, décision du propriétaire du 08/11) joué sur
// iPhone. La carte principale dit « Santé » (healthStoreName, code d'Android), l'iPhone importe 6 mois (correctif 45),
// le temps d'écran parle de l'iPhone (correctif 52), et la lecture du visage n'est proposée qu'à l'ouverture d'Halcya.
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})
const hc = vi.hoisted(() => ({
  id: 'health_connect',
  availabilityDetails: vi.fn(),
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  sync: vi.fn(),
}))
vi.mock('../connectors/connectorRegistry', () => ({ getConnector: () => hc, CONNECTORS: [hc] }))
vi.mock('../storage/localHealthStorage', async (orig) => ({
  ...(await orig()),
  listEntries: vi.fn(async () => []),
  upsertEntries: vi.fn(async () => {}),
  countAllEntries: vi.fn(async () => 0),
}))
const usage = vi.hoisted(() => ({ access: { granted: false, supported: true } }))
vi.mock('../services/phoneUsageSync', async (orig) => ({
  ...(await orig()),
  checkPhoneUsageAccess: vi.fn(async () => usage.access),
}))
const face = vi.hoisted(() => ({ status: { enabled: false } }))
vi.mock('../services/faceSense', async (orig) => ({
  ...(await orig()),
  isFaceSenseAvailable: () => true,
  isFaceSenseEnabled: () => false,
  getFaceSenseStatus: async () => face.status,
}))

import Onboarding from './Onboarding'
import { FLOW_VERSION, saveOnboarding } from '../settings/onboarding'
import { resetImportForTests } from '../services/onboardingFlow'

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

describe('nouvel accueil sur iPhone (variante appstore)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    resetImportForTests()
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios')
    hc.availabilityDetails.mockResolvedValue({ available: true })
    hc.checkPermissions.mockResolvedValue('not_asked')
    hc.sync.mockResolvedValue({ synced: 0, skipped: 0, errors: [] })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    delete window.__healthtrackFakePhoneUsage
  })

  it('« Branchez vos sources » : la carte dit Santé, l’iPhone et 6 mois ; jamais Health Connect ni Huawei', async () => {
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'sources' })
    renderAt()
    expect(await screen.findByRole('button', { name: 'Connecter Santé' })).toBeInTheDocument()
    expect(screen.getByText('votre iPhone et votre montre')).toBeInTheDocument()
    expect(screen.getByText(/vos 6 derniers mois\. Elle n’écrit rien/)).toBeInTheDocument()
    expect(screen.queryByText(/30 derniers jours/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Health Connect/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Huawei/)).not.toBeInTheDocument()
  })

  it('temps d’écran : l’iPhone demande l’accord, aucun réglage d’Android', async () => {
    window.__healthtrackFakePhoneUsage = true
    usage.access = { granted: false, supported: true }
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'sources' })
    renderAt()
    expect(await screen.findByText(/L’iPhone demande votre accord \(Face ID ou code\)/)).toBeInTheDocument()
    expect(screen.queryByText(/Android/)).not.toBeInTheDocument()
  })

  it('visage : seulement « Quand vous ouvrez Halcya », jamais au déverrouillage (l’iPhone ne le permet pas)', async () => {
    face.status = { enabled: false }
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'face', goals: ['gut'] })
    renderAt()
    await waitFor(() => expect(screen.getByRole('radio', { name: /Quand vous ouvrez Halcya/ })).toBeInTheDocument())
    expect(screen.queryByRole('radio', { name: /déverrouillage/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/À chaque déverrouillage/)).not.toBeInTheDocument()
  })

  // Correctif 55 : avant iOS 26.4, l'iPhone ne donne pas le temps d'écran aux apps ; comme la carte de Sources
  // (correctif 44, retours du premier testeur du 06/11), la ligne de l'accueil n'est pas proposée
  it('temps d’écran sous iOS 26.4 : pas de ligne à l’accueil', async () => {
    window.__healthtrackFakePhoneUsage = true
    usage.access = { granted: false, supported: false }
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'sources' })
    renderAt()
    expect(await screen.findByRole('button', { name: 'Connecter Santé' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Temps d’écran')).not.toBeInTheDocument())
    expect(screen.getAllByText('Météo').length).toBeGreaterThan(0)
  })
})
