import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Onboarding from './Onboarding'
import { loadOnboarding, saveOnboarding } from '../settings/onboarding'

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
}))

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

const cont = () => screen.getByRole('button', { name: 'Continuer' })
const night = (day) => ({
  type: 'sleep',
  source: 'health_connect',
  at: new Date(Date.now() - day * 86400000 - 8 * 3600000).toISOString(),
  payload: { endDate: new Date(Date.now() - day * 86400000).toISOString(), sourceName: 'com.garmin.android.apps.connectmobile' },
})

describe('Onboarding (jalon 4b) : Health Connect, import et « aha »', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    stored.entries = []
    hc.availabilityDetails.mockResolvedValue({ available: true })
    hc.checkPermissions.mockResolvedValue('not_asked')
    hc.requestPermissions.mockResolvedValue('granted')
    hc.sync.mockImplementation(async ({ onProgress }) => {
      onProgress({ done: 0, total: 2, label: 'pas' })
      onProgress({ done: 1, total: 2, label: 'sommeil' })
      onProgress({ done: 2, total: 2, label: null })
      return { synced: 3, skipped: 0, errors: [] }
    })
  })

  it('divulgation puis autorisation, import avec progression, et le « aha » avec sa source', async () => {
    stored.entries = [night(1), night(2), night(3)]
    saveOnboarding({ goal: 'energy', step: 2 })
    renderAt()
    fireEvent.click(screen.getByRole('radio', { name: /Health Connect/ }))
    fireEvent.click(cont())
    expect(screen.getByRole('heading', { name: 'Vos données Health Connect' })).toBeInTheDocument()
    expect(cont()).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Autoriser Health Connect' }))
    // Divulgation avant la boîte d'Android
    expect(await screen.findByText('Avant d’autoriser Health Connect')).toBeInTheDocument()
    expect(hc.requestPermissions).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /J’accepte, ouvrir Health Connect/ }))
    await waitFor(() => expect(hc.requestPermissions).toHaveBeenCalled())
    expect(await screen.findByText(/C’est autorisé/)).toBeInTheDocument()
    expect(screen.getByText('04/06')).toBeInTheDocument()
    fireEvent.click(cont())
    expect(await screen.findByRole('heading', { name: 'Vos 30 derniers jours' })).toBeInTheDocument()
    expect(screen.getByText(/sur 3 nuits/)).toBeInTheDocument()
    expect(screen.getByText(/Garmin Connect via Health Connect/)).toBeInTheDocument()
    expect(hc.sync).toHaveBeenCalledTimes(1)
    expect(loadOnboarding()).toMatchObject({ health: 'granted', imported: true })
    await waitFor(() => expect(cont()).toBeEnabled())
    fireEvent.click(cont())
    expect(screen.getByRole('heading', { name: 'Comment vous sentez-vous ?' })).toBeInTheDocument()
    fireEvent.click(cont())
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
  })

  it('« aha » : une seule ligne de source quand tous les chiffres viennent de la même app (POL-PLAY-40)', async () => {
    const step = (day) => ({
      type: 'steps',
      source: 'health_connect',
      at: new Date(Date.now() - day * 86400000 - 3 * 3600000).toISOString(),
      payload: { value: 6000, sourceName: 'com.garmin.android.apps.connectmobile' },
    })
    stored.entries = [night(1), night(2), step(1), step(2)]
    saveOnboarding({ goal: 'energy', watch: 'health_connect', health: 'granted', imported: true, step: 4 })
    renderAt()
    expect(await screen.findByText(/sur 2 nuits/)).toBeInTheDocument()
    expect(screen.getAllByText(/Garmin Connect via Health Connect/)).toHaveLength(1)
    expect(screen.getByText('D’après Garmin Connect via Health Connect')).toBeInTheDocument()
  })

  it('rien d’importé → phrase honnête, aucun zéro', async () => {
    saveOnboarding({ goal: 'gut', watch: 'health_connect', health: 'granted', step: 4 })
    renderAt()
    expect(await screen.findByText(/Rien à importer pour l’instant/)).toBeInTheDocument()
    expect(screen.getByRole('main').textContent).not.toMatch(/\b0\b/)
  })

  it('« Pas maintenant » : aucune demande à Android, on continue sans reproche vers Aujourd’hui', async () => {
    saveOnboarding({ goal: 'gut', watch: 'health_connect', step: 3 })
    renderAt()
    fireEvent.click(await screen.findByRole('button', { name: 'Autoriser Health Connect' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Pas maintenant' }))
    expect(await screen.findByText(/vous pourrez l’autoriser plus tard/)).toBeInTheDocument()
    expect(hc.requestPermissions).not.toHaveBeenCalled()
    expect(screen.getByText('04/05')).toBeInTheDocument()
    fireEvent.click(cont())
    fireEvent.click(cont())
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(hc.sync).not.toHaveBeenCalled()
  })

  it('Health Connect absent du téléphone → on le dit et on continue', async () => {
    hc.availabilityDetails.mockResolvedValue({ available: false, reason: 'unavailable' })
    saveOnboarding({ goal: 'gut', watch: 'health_connect', step: 3 })
    renderAt()
    expect(await screen.findByText(/n’est pas disponible sur ce téléphone/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Autoriser Health Connect' })).not.toBeInTheDocument()
    expect(cont()).toBeEnabled()
  })

  it('déjà autorisé (réinstallation) → rien à redemander', async () => {
    hc.checkPermissions.mockResolvedValue('granted')
    saveOnboarding({ goal: 'gut', watch: 'health_connect', step: 3 })
    renderAt()
    expect(await screen.findByText(/C’est autorisé/)).toBeInTheDocument()
    expect(hc.requestPermissions).not.toHaveBeenCalled()
  })

  it('reprise après l’import : on ne relit pas Health Connect', async () => {
    stored.entries = [night(1)]
    saveOnboarding({ goal: 'gut', watch: 'health_connect', health: 'granted', imported: true, step: 4 })
    renderAt()
    expect(await screen.findByText(/sur 1 nuit$/)).toBeInTheDocument()
    expect(hc.sync).not.toHaveBeenCalled()
  })
})
