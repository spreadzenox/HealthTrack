import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import BleDevices from './BleDevices'
import WatchGuides from './WatchGuides'
import { identifyDevice } from '../devices/ble/drivers'

const fp = (name, services = [], companyIds = []) => ({ name, services, companyIds, serviceData: [] })
const dev = (deviceId, f, extra = {}) => ({ deviceId, name: f.name, rssi: -60, bonded: false, fingerprint: f, ...identifyDevice(f), ...extra })

const H10 = dev('H', fp('Polar H10 1A2B3C4D', ['180d'], [107]))
const WATCH = dev('W', fp('HUAWEI WATCH GT 6 Pro-A1B', [], [0x027d]), { bonded: true })
const BP = dev('B', fp('BP7000', ['1810']))
const UNK = dev('U', fp('Mystery', [], [4660]))

describe('BleDevices', () => {
  it('hors de l’app Android : explique sans proposer de recherche', () => {
    render(<BleDevices available={false} />)
    expect(screen.getByText(/Dans l’app Android/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rechercher/ })).toBeNull()
  })

  it('liste les appareils trouvés avec ce que HealthTrack en fait', async () => {
    const scan = vi.fn(async ({ onUpdate }) => {
      onUpdate([H10, WATCH, BP, UNK])
      return [H10, WATCH, BP, UNK]
    })
    render(
      <>
        <BleDevices available scan={scan} />
        <WatchGuides />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher autour de moi' }))
    expect(await screen.findByText('Polar H10 1A2B3C4D')).toBeInTheDocument()
    expect(screen.getByText('Compatible')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mesurer ma VFC/ })).toBeInTheDocument()
    // montre propriétaire → son app + guide
    expect(screen.getByText('Via son app')).toBeInTheDocument()
    expect(screen.getByText(/Appairée à ce téléphone/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voir le guide' }))
    expect(document.getElementById('guide-huawei').open).toBe(true)
    // profil standard reconnu, pas encore lu
    expect(screen.getByText('Bientôt')).toBeInTheDocument()
    expect(screen.getByText(/Tensiomètre reconnu/)).toBeInTheDocument()
    // inconnus regroupés
    expect(screen.getByText(/1 autre appareil non reconnu/)).toBeInTheDocument()
    expect(screen.queryByText('Mystery')).toBeNull()
  })

  it('aucun appareil : conseils pour allumer le capteur', async () => {
    render(<BleDevices available scan={async () => []} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher autour de moi' }))
    expect(await screen.findByText(/Aucun appareil trouvé/)).toBeInTheDocument()
  })

  it('erreur (Bluetooth refusé) : message clair', async () => {
    render(<BleDevices available scan={async () => { throw new Error('denied') }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher autour de moi' }))
    expect(await screen.findByText(/Bluetooth indisponible/)).toBeInTheDocument()
  })

  it('mesure en direct puis enregistre FC et VFC', async () => {
    let emit
    const stop = vi.fn(async () => {})
    const startSession = vi.fn(async (_id, { onSample }) => {
      emit = onSample
      return stop
    })
    const save = vi.fn(async () => {})
    render(<BleDevices available scan={async ({ onUpdate }) => (onUpdate([H10]), [H10])} startSession={startSession} save={save} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher autour de moi' }))
    fireEvent.click(await screen.findByRole('button', { name: /Mesurer ma VFC/ }))
    expect(await screen.findByText(/Mesure en cours/)).toBeInTheDocument()

    const t0 = Date.parse('2026-10-12T06:00:00Z')
    act(() => {
      let t = t0
      for (let i = 0; i < 120; i++) {
        const rr = i % 2 ? 1030 : 1000
        t += rr
        emit({ at: t, bpm: 59, rrMs: [rr] })
      }
    })
    expect(screen.getByText('59')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Terminer et enregistrer' }))
    expect(await screen.findByText(/VFC \(RMSSD\) 30 ms/)).toBeInTheDocument()
    expect(stop).toHaveBeenCalled()
    const saved = save.mock.calls[0][0]
    expect(saved.some((e) => e.payload.subtype === 'heartRateVariability' && e.source === 'ble')).toBe(true)
  })

  it('mesure trop courte : FC enregistrée, VFC expliquée', async () => {
    let emit
    const save = vi.fn(async () => {})
    render(
      <BleDevices
        available
        scan={async ({ onUpdate }) => (onUpdate([H10]), [H10])}
        startSession={async (_id, { onSample }) => ((emit = onSample), async () => {})}
        save={save}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher autour de moi' }))
    fireEvent.click(await screen.findByRole('button', { name: /Mesurer ma VFC/ }))
    await screen.findByText(/Mesure en cours/)
    act(() => {
      emit({ at: 1000, bpm: 70, rrMs: [860] })
      emit({ at: 2000, bpm: 72, rrMs: [840] })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Terminer et enregistrer' }))
    expect(await screen.findByText(/au moins 1 minute/)).toBeInTheDocument()
    expect(save).toHaveBeenCalled()
  })
})
