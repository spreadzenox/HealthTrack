import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WatchSetup from './WatchSetup'

const HUAWEI = { id: 'huawei_health', name: 'Huawei Health', package: 'com.huawei.health' }
const WATCH = { deviceId: 'w1', name: 'HUAWEI WATCH GT 6 Pro-A1B' }

function deps({ apps = [HUAWEI], bonded = [WATCH] } = {}) {
  const state = { apps, bonded }
  return {
    state,
    detectApps: vi.fn(async () => state.apps),
    classic: {
      listBonded: vi.fn(async () => ({ devices: state.bonded })),
      discover: vi.fn(async () => ({ devices: [WATCH] })),
      pair: vi.fn(async () => {
        state.bonded = [WATCH]
        return { state: 'bonded' }
      }),
      openBluetoothSettings: vi.fn(async () => {}),
    },
    appManager: { uninstall: vi.fn(async () => {}), openSettings: vi.fn(async () => {}) },
  }
}

describe('WatchSetup', () => {
  beforeEach(() => localStorage.clear())

  it('Huawei Santé installée : ouvre la boîte de désinstallation ou ses réglages', async () => {
    const d = deps()
    render(<WatchSetup {...d} verdict="no_answer" now={() => '2026-10-13T00:00:00.000Z'} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Désinstaller Huawei Health' }))
    await waitFor(() => expect(d.appManager.uninstall).toHaveBeenCalledWith({ package: 'com.huawei.health' }))
    fireEvent.click(screen.getByRole('button', { name: 'Réglages de Huawei Health' }))
    await waitFor(() => expect(d.appManager.openSettings).toHaveBeenCalledWith({ package: 'com.huawei.health' }))
    expect(screen.queryByText(/dissocier la montre dans Huawei/i)).toBeNull()
    // pas de boucle de rendu : on ne relit les apps qu'au montage et au retour dans l'app
    await new Promise((r) => setTimeout(r, 50))
    expect(d.detectApps.mock.calls.length).toBe(1)
  })

  it('parcours complet : app désinstallée → réinitialisation → ancien appairage oublié → appairage → test', async () => {
    const d = deps()
    const onRunTest = vi.fn()
    render(<WatchSetup {...d} verdict="no_answer" onRunTest={onRunTest} />)
    await screen.findByRole('button', { name: 'Désinstaller Huawei Health' })

    // retour de la boîte de désinstallation : l'app a disparu
    d.state.apps = []
    document.dispatchEvent(new Event('visibilitychange'))
    fireEvent.click(await screen.findByRole('button', { name: /C’est fait : la montre affiche/ }))
    expect(JSON.parse(localStorage.getItem('healthtrack_watch_setup')).resetAt).toBeTruthy()

    // Android garde l'ancien appairage → réglages Bluetooth d'abord
    expect(await screen.findByText(/se souvient de l’ancien appairage/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Réglages Bluetooth' }))
    await waitFor(() => expect(d.classic.openBluetoothSettings).toHaveBeenCalled())
    d.state.bonded = []
    document.dispatchEvent(new Event('visibilitychange'))

    fireEvent.click(await screen.findByRole('button', { name: 'Appairer la montre' }))
    expect(await screen.findByText(/est appairée à ce téléphone/)).toBeInTheDocument()
    expect(d.classic.pair).toHaveBeenCalledWith({ deviceId: 'w1', timeoutMs: 60_000 })

    fireEvent.click(await screen.findByRole('button', { name: 'Relancer le test' }))
    expect(onRunTest).toHaveBeenCalled()
  })

  it('plan B : garder Huawei Santé, identifiant de compte gardé en local', async () => {
    const d = deps()
    render(<WatchSetup {...d} verdict="no_answer" />)
    fireEvent.click(await screen.findByRole('radio', { name: 'Garder Huawei Santé' }))
    const input = screen.getByLabelText('Identifiant de compte Huawei')
    fireEvent.change(input, { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Identifiant attendu : 15 à 20 chiffres.')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '1234 5678 9012 34567' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await screen.findByText('Identifiant gardé sur ce téléphone.')
    expect(JSON.parse(localStorage.getItem('healthtrack_watch_setup'))).toMatchObject({ choice: 'keep', accountId: '12345678901234567' })
  })
})

describe('WatchSetup — état réel de la montre (capture du 18/10/2026)', () => {
  beforeEach(() => localStorage.clear())

  it('montre appairée et synchronisée : étapes faites, aucun bouton « Appairer »', async () => {
    const d = deps({ apps: [] })
    render(<WatchSetup {...d} verdict={null} autoState={{ outcome: 'connected', at: new Date().toISOString(), lastConnectedAt: new Date().toISOString() }} />)
    expect(await screen.findByText(/Rien à faire ici : la montre est appairée et HealthTrack la synchronise/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Appairer la montre' })).toBeNull()
    expect(screen.queryByText(/Montre allumée sur son écran d’appairage/)).toBeNull()
  })

  it('détection des apps qui ne répond jamais : l’état d’appairage s’affiche quand même', async () => {
    const d = deps({ apps: [] })
    d.detectApps = vi.fn(() => new Promise(() => {}))
    render(<WatchSetup {...d} verdict={null} autoState={{}} />)
    // montre appairée à Android, jamais synchronisée : l'étape suivante est le test, pas l'appairage
    expect(await screen.findByText(/Relancez le test : la montre doit répondre/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Appairer la montre' })).toBeNull()
  })
})

