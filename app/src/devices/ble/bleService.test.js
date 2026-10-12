import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scanDevices, startHeartRateSession, listUnknownDevices, sortDevices, receiveMeasurements } from './bleService'

const dv = (bytes) => new DataView(Uint8Array.from(bytes).buffer)

function fakeClient({ bonded = [], scans = [] } = {}) {
  return {
    initialize: vi.fn(async () => {}),
    isEnabled: vi.fn(async () => true),
    getBondedDevices: vi.fn(async () => bonded),
    requestLEScan: vi.fn(async (_opts, cb) => scans.forEach(cb)),
    stopLEScan: vi.fn(async () => {}),
    connect: vi.fn(async () => {}),
    disconnect: vi.fn(async () => {}),
    startNotifications: vi.fn(async (_id, _s, _c, cb) => {
      cb(dv([0x10, 62, 0x00, 0x04]))
    }),
    stopNotifications: vi.fn(async () => {}),
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('scanDevices', () => {
  it('fusionne appareils appairés et annonces, capteur cardio en tête', async () => {
    const client = fakeClient({
      bonded: [{ deviceId: 'W', name: 'HUAWEI WATCH GT 6 Pro-A1B' }, { deviceId: 'C', name: 'Ma voiture' }],
      scans: [
        { device: { deviceId: 'U', name: 'Mystery' }, rssi: -40, manufacturerData: { 4660: dv([1]) } },
        { device: { deviceId: 'H', name: 'Polar H10 1A2B3C4D' }, rssi: -70, uuids: ['0000180d-0000-1000-8000-00805f9b34fb'] },
      ],
    })
    const updates = []
    const list = await scanDevices({ durationMs: 0, client, onUpdate: (l) => updates.push(l.length) })
    expect(client.initialize).toHaveBeenCalledWith({ androidNeverForLocation: true })
    expect(list.map((d) => d.deviceId)).toEqual(['H', 'W', 'U'])
    expect(list[1]).toMatchObject({ bonded: true, vendor: { id: 'huawei' } })
    expect(updates).toEqual([1, 2, 3])
    expect(client.stopLEScan).toHaveBeenCalled()
  })

  it('garde en local l’empreinte des appareils inconnus, sans adresse', async () => {
    const scans = [{ device: { deviceId: 'AA:BB:CC:00:11:22', name: 'Mystery 9F3A' }, manufacturerData: { 4660: dv([1]) } }]
    await scanDevices({ durationMs: 0, client: fakeClient({ scans }) })
    await scanDevices({ durationMs: 0, client: fakeClient({ scans }) })
    const stored = listUnknownDevices()
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ name: 'Mystery 9F3A', companyIds: [4660], count: 2 })
    expect(JSON.stringify(stored)).not.toContain('AA:BB')
  })

  it('continue si la liste des appareils appairés échoue', async () => {
    const client = fakeClient()
    client.getBondedDevices.mockRejectedValue(new Error('permission'))
    await expect(scanDevices({ durationMs: 0, client })).resolves.toEqual([])
  })
})

describe('startHeartRateSession', () => {
  it('s’abonne à 0x2A37, décode les trames et se déconnecte à l’arrêt', async () => {
    const client = fakeClient()
    const onSample = vi.fn()
    const stop = await startHeartRateSession('H', { client, onSample })
    expect(client.startNotifications.mock.calls[0][2]).toBe('00002a37-0000-1000-8000-00805f9b34fb')
    expect(onSample).toHaveBeenCalledWith(expect.objectContaining({ bpm: 62, rrMs: [1000] }))
    await stop()
    expect(client.disconnect).toHaveBeenCalledWith('H')
  })

  it('abonnement refusé : se déconnecte avant de signaler l’erreur', async () => {
    const client = fakeClient()
    client.startNotifications.mockRejectedValue(new Error('Insufficient authentication'))
    await expect(startHeartRateSession('H', { client })).rejects.toThrow('Insufficient authentication')
    expect(client.disconnect).toHaveBeenCalledWith('H')
  })
})

describe('receiveMeasurements', () => {
  const u16 = (v) => [v & 0xff, (v >> 8) & 0xff]

  it('écoute les indications du tensiomètre et s’arrête quand l’appareil se déconnecte', async () => {
    const client = fakeClient()
    let disconnect
    client.connect.mockImplementation(async (_id, onDisc) => {
      disconnect = onDisc
    })
    client.startNotifications.mockImplementation(async (_id, _s, _c, cb) => {
      cb(dv([0x00, ...u16(125), ...u16(78), ...u16(94)]))
      cb(dv([0x00, ...u16(131), ...u16(84), ...u16(100)]))
      setTimeout(() => disconnect(), 0)
    })
    const onMeasurement = vi.fn()
    const { done } = await receiveMeasurements('BP', 'ble_blood_pressure', { client, onMeasurement })
    const list = await done
    expect(client.startNotifications.mock.calls[0].slice(1, 3)).toEqual([
      '00001810-0000-1000-8000-00805f9b34fb',
      '00002a35-0000-1000-8000-00805f9b34fb',
    ])
    expect(list.map((m) => m.systolic)).toEqual([125, 131])
    expect(onMeasurement).toHaveBeenCalledTimes(2)
  })

  it('s’arrête après un silence une fois une mesure reçue, et se déconnecte', async () => {
    const client = fakeClient()
    client.startNotifications.mockImplementation(async (_id, _s, _c, cb) => cb(dv([0x00, ...u16(14000)])))
    const { done } = await receiveMeasurements('S', 'ble_weight_scale', { client, idleMs: 10 })
    expect((await done).map((m) => m.weightKg)).toEqual([70])
    expect(client.disconnect).toHaveBeenCalledWith('S')
  })

  it('ignore une caractéristique facultative absente', async () => {
    const client = fakeClient()
    client.startNotifications.mockImplementation(async (_id, _s, c, cb) => {
      if (c.startsWith('00002a5e')) throw new Error('not found')
      cb(dv([0x00, ...u16(97), ...u16(70)]))
    })
    const { done } = await receiveMeasurements('O', 'ble_pulse_oximeter', { client, idleMs: 10 })
    expect((await done).map((m) => m.spo2)).toEqual([97])
  })

  it('échoue si aucune caractéristique n’est disponible', async () => {
    const client = fakeClient()
    client.startNotifications.mockRejectedValue(new Error('not found'))
    await expect(receiveMeasurements('T', 'ble_thermometer', { client })).rejects.toThrow()
    expect(client.disconnect).toHaveBeenCalledWith('T')
  })

  it('annuler termine l’attente sans attendre le délai', async () => {
    const client = fakeClient()
    client.startNotifications.mockImplementation(async () => {})
    const { done, cancel } = await receiveMeasurements('S', 'ble_weight_scale', { client, timeoutMs: 60_000 })
    await cancel()
    await expect(done).resolves.toEqual([])
  })
})

describe('sortDevices', () => {
  it('à statut égal, le plus proche d’abord', () => {
    const d = (id, rssi) => ({ deviceId: id, rssi, driver: { id: 'unknown', supported: false } })
    expect(sortDevices([d('a', -80), d('b', -50)]).map((x) => x.deviceId)).toEqual(['b', 'a'])
  })
})
