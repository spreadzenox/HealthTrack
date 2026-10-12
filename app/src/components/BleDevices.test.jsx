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
const GLU = dev('G', fp('Meter', ['1808']))
const UNK = dev('U', fp('Mystery', [], [4660]))

describe('BleDevices', () => {
  it('hors de l’app Android : explique sans proposer de recherche', () => {
    render(<BleDevices available={false} />)
    expect(screen.getByText(/Dans l’app Android/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rechercher/ })).toBeNull()
  })

  it('liste les appareils trouvés avec ce que HealthTrack en fait', async () => {
    const scan = vi.fn(async ({ onUpdate }) => {
      onUpdate([H10, BP, WATCH, GLU, UNK])
      return [H10, BP, WATCH, GLU, UNK]
    })
    render(
      <>
        <BleDevices available scan={scan} />
        <WatchGuides />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher autour de moi' }))
    expect(await screen.findByText('Polar H10 1A2B3C4D')).toBeInTheDocument()
    expect(screen.getAllByText('Compatible')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /Mesurer ma VFC/ })).toBeInTheDocument()
    // appareil de mesure standard : réception directe
    expect(screen.getByRole('button', { name: 'Recevoir la mesure' })).toBeInTheDocument()
    // montre propriétaire → son app + guide
    expect(screen.getByText('Via son app')).toBeInTheDocument()
    expect(screen.getByText(/Appairée à ce téléphone/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voir le guide' }))
    expect(document.getElementById('guide-huawei').open).toBe(true)
    // profil standard reconnu, pas encore lu
    expect(screen.getByText('Bientôt')).toBeInTheDocument()
    expect(screen.getByText(/Lecteur de glycémie reconnu/)).toBeInTheDocument()
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

  it('reçoit la mesure du tensiomètre et l’enregistre', async () => {
    let emit
    let finish
    const receive = vi.fn(async (_id, driverId, { onMeasurement }) => {
      emit = onMeasurement
      return { done: new Promise((r) => (finish = r)), cancel: vi.fn() }
    })
    const save = vi.fn(async () => {})
    render(<BleDevices available scan={async ({ onUpdate }) => (onUpdate([BP]), [BP])} receive={receive} save={save} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher autour de moi' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Recevoir la mesure' }))
    expect(receive.mock.calls[0][1]).toBe('ble_blood_pressure')
    expect(await screen.findByText(/Lancez une mesure sur le tensiomètre/)).toBeInTheDocument()
    const m = { kind: 'blood_pressure', systolic: 128, diastolic: 82, pulseBpm: 64, at: null }
    act(() => emit(m))
    expect(screen.getByText('Tension 128/82 mmHg · pouls 64')).toBeInTheDocument()
    await act(async () => finish([m]))
    expect(await screen.findByText(/1 mesure enregistrée/)).toBeInTheDocument()
    const saved = save.mock.calls[0][0]
    expect(saved).toEqual([expect.objectContaining({ type: 'blood_pressure', source: 'ble', payload: expect.objectContaining({ systolic: 128, sourceName: 'BP7000' }) })])
    expect(screen.getByText(/pas un diagnostic/)).toBeInTheDocument()
  })

  it('aucune mesure reçue : explique quoi faire (appairage, symbole Bluetooth)', async () => {
    const receive = vi.fn(async () => ({ done: Promise.resolve([]), cancel: vi.fn() }))
    const save = vi.fn()
    render(<BleDevices available scan={async ({ onUpdate }) => (onUpdate([BP]), [BP])} receive={receive} save={save} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher autour de moi' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Recevoir la mesure' }))
    expect(await screen.findByText(/Aucune mesure reçue/)).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })

  it('connexion impossible : message et retour à la liste', async () => {
    const receive = vi.fn(async () => {
      throw new Error('gatt')
    })
    render(<BleDevices available scan={async ({ onUpdate }) => (onUpdate([BP]), [BP])} receive={receive} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher autour de moi' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Recevoir la mesure' }))
    expect(await screen.findByText(/Connexion impossible à BP7000/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recevoir la mesure' })).toBeInTheDocument()
  })
})
