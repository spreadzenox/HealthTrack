import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const hc = vi.hoisted(() => ({
  id: 'health_connect',
  readWindowDays: 29,
  availabilityDetails: vi.fn(),
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  sync: vi.fn(),
}))
vi.mock('../connectors/connectorRegistry', () => ({ getConnector: () => hc, CONNECTORS: [hc] }))

const stored = vi.hoisted(() => ({ entries: [] }))
vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(async () => stored.entries),
  upsertEntries: vi.fn(async () => {}),
  countAllEntries: vi.fn(async () => 0),
  createEntry: vi.fn(async () => 1),
  updateEntry: vi.fn(async () => {}),
}))
const geo = vi.hoisted(() => ({ getApproxPosition: vi.fn() }))
vi.mock('../services/approxPosition', () => geo)
const weather = vi.hoisted(() => ({ syncWeather: vi.fn() }))
vi.mock('../services/weatherSync', async (orig) => ({ ...(await orig()), ...weather }))

import Onboarding from './Onboarding'
import { foundDevices, resetImportForTests } from '../services/onboardingFlow'
import { FLOW_VERSION, loadOnboarding, saveOnboarding } from '../settings/onboarding'
import { getWeatherSettings } from '../services/weatherSync'
import { HEALTH_APPS } from '../devices/healthApps'

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/bienvenue']}>
      <Routes>
        <Route path="/bienvenue" element={<Onboarding />} />
        <Route path="/" element={<p>Page Aujourd’hui</p>} />
        <Route path="/connectors" element={<p>Page Sources</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const btn = (name) => screen.getByRole('button', { name })
const night = (day) => ({
  type: 'sleep',
  source: 'health_connect',
  at: new Date(Date.now() - day * 86400000 - 8 * 3600000).toISOString(),
  payload: { endDate: new Date(Date.now() - day * 86400000).toISOString(), sourceName: 'com.garmin.android.apps.connectmobile' },
})

describe('Nouvel accueil (ACC-4) : « Branchez vos sources »', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    resetImportForTests()
    delete window.__healthtrackFakeInstalledPackages
    stored.entries = []
    hc.availabilityDetails.mockResolvedValue({ available: true })
    hc.checkPermissions.mockResolvedValue('not_asked')
    hc.requestPermissions.mockResolvedValue('granted')
    hc.sync.mockResolvedValue({ synced: 3, skipped: 0, errors: [] })
    geo.getApproxPosition.mockResolvedValue({ lat: 45.76, lon: 4.84 })
    weather.syncWeather.mockResolvedValue({})
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'sources' })
  })

  it('la divulgation est au-dessus du bouton ; « Connecter Health Connect » demande l’accès d’un geste, puis l’import part', async () => {
    renderAt()
    expect(screen.getByRole('heading', { name: 'Branchez vos sources' })).toBeInTheDocument()
    expect(screen.getByText(/Elle n’écrit rien et n’envoie rien/)).toBeInTheDocument()
    expect(btn('Continuer')).toBeEnabled()
    fireEvent.click(btn('Connecter Health Connect'))
    await waitFor(() => expect(screen.getByText('Connecté.')).toBeInTheDocument())
    expect(hc.requestPermissions).toHaveBeenCalledOnce()
    await waitFor(() => expect(hc.sync).toHaveBeenCalledOnce())
    expect(loadOnboarding().health).toBe('granted')
  })

  it('refus : la phrase prévue, « Réessayer », et « Continuer » reste libre', async () => {
    hc.requestPermissions.mockResolvedValue('denied')
    renderAt()
    fireEvent.click(btn('Connecter Health Connect'))
    expect(await screen.findByText(/Sans cet accès, Halcya vivra de vos notes et de votre visage/)).toBeInTheDocument()
    expect(btn('Réessayer')).toBeInTheDocument()
    fireEvent.click(btn('Continuer'))
    expect(screen.getByRole('heading', { name: 'Votre téléphone suffit pour commencer' })).toBeInTheDocument()
    fireEvent.click(btn('Connecter Health Connect'))
    expect(screen.getByRole('heading', { name: 'Branchez vos sources' })).toBeInTheDocument()
  })

  it('Health Connect absent : une ligne discrète, pas de carte', async () => {
    hc.availabilityDetails.mockResolvedValue({ available: false })
    renderAt()
    expect(await screen.findByText(/Health Connect n’est pas sur ce téléphone/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Connecter Health Connect' })).not.toBeInTheDocument()
  })

  it('carte Huawei seulement si Huawei Santé est installée ; « Relier ma montre » mène à Sources à la fin', async () => {
    const { unmount } = renderAt()
    await waitFor(() => expect(hc.availabilityDetails).toHaveBeenCalled())
    expect(screen.queryByText('Montre Huawei trouvée')).not.toBeInTheDocument()
    unmount()
    window.__healthtrackFakeInstalledPackages = ['com.huawei.health']
    renderAt()
    expect(await screen.findByText('Montre Huawei trouvée')).toBeInTheDocument()
    fireEvent.click(btn('Relier ma montre'))
    expect(loadOnboarding().huawei).toBe('pair')
    saveOnboarding({ lastScreen: 'first', step: 4 })
    unmount()
  })

  it('météo par un interrupteur : position approximative, météo activée ; on peut la couper', async () => {
    renderAt()
    const sw = screen.getByRole('switch', { name: 'Météo' })
    expect(sw).not.toBeChecked()
    fireEvent.click(sw)
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Météo' })).toBeChecked())
    expect(getWeatherSettings().enabled).toBe(true)
    fireEvent.click(screen.getByRole('switch', { name: 'Météo' }))
    expect(getWeatherSettings().enabled).toBe(false)
  })

  it('temps d’écran : seulement quand Android le permet', () => {
    renderAt()
    expect(screen.queryByRole('switch', { name: 'Temps d’écran' })).not.toBeInTheDocument()
  })
})

describe('Nouvel accueil (ACC-5) : « Voici ce que Halcya recevra »', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    resetImportForTests()
    hc.availabilityDetails.mockResolvedValue({ available: true })
    hc.checkPermissions.mockResolvedValue('granted')
    hc.sync.mockResolvedValue({ synced: 3, skipped: 0, errors: [] })
    stored.entries = [night(1), night(2), night(3)]
  })

  it('appareils et tuiles des 30 derniers jours, après l’import', async () => {
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'found', health: 'granted' })
    renderAt()
    expect(screen.getByRole('heading', { name: 'Voici ce que Halcya recevra' })).toBeInTheDocument()
    expect(await screen.findByText('Garmin Connect')).toBeInTheDocument()
    expect(screen.getByText(/de sommeil en moyenne/)).toBeInTheDocument()
    expect(btn('Continuer')).toBeEnabled()
    expect(loadOnboarding().imported).toBe(true)
  })

  it('« Continuer » ne bloque jamais, même pendant l’import', () => {
    hc.sync.mockReturnValue(new Promise(() => {}))
    saveOnboarding({ flow: FLOW_VERSION, lastScreen: 'found', health: 'granted' })
    renderAt()
    expect(screen.getByRole('progressbar', { name: 'Import de vos 30 derniers jours' })).toBeInTheDocument()
    fireEvent.click(btn('Continuer'))
    expect(screen.getByRole('heading', { name: 'Comment vous sentez-vous maintenant ?' })).toBeInTheDocument()
  })

  it('foundDevices : les apps qui envoient, puis celles installées qui n’envoient encore rien, avec leur réglage', () => {
    const garmin = HEALTH_APPS.find((a) => a.id === 'garmin')
    const samsung = HEALTH_APPS.find((a) => a.id === 'samsung_health')
    const list = foundDevices([night(1), night(2)], [garmin, samsung])
    expect(list).toEqual([
      { id: 'garmin', name: 'Garmin Connect', sending: true },
      { id: 'samsung_health', name: 'Samsung Health', sending: false, hint: samsung.enableHint },
    ])
  })
})
