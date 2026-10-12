import { describe, it, expect } from 'vitest'
import { uuid16, shortUuid, buildFingerprint, fingerprintKey, identifyDevice, DRIVERS } from './drivers'

const dv = (bytes) => new DataView(Uint8Array.from(bytes).buffer)
const HR = '0000180d-0000-1000-8000-00805f9b34fb'

describe('UUID', () => {
  it('passe d’un UUID 16 bits au format 128 bits et inversement', () => {
    expect(uuid16(0x180d)).toBe(HR)
    expect(shortUuid(HR.toUpperCase())).toBe(0x180d)
    expect(shortUuid('6e400001-b5a3-f393-e0a9-e50e24dcca9e')).toBeNull()
  })
})

describe('buildFingerprint', () => {
  it('garde nom, services, fabricant et clés de service data — jamais l’adresse MAC', () => {
    const fp = buildFingerprint({
      device: { deviceId: 'AA:BB:CC:DD:EE:FF', name: 'Polar H10 9A1B2C3D' },
      localName: 'Polar H10 9A1B2C3D',
      rssi: -60,
      uuids: [HR, '0000feee-0000-1000-8000-00805f9b34fb'],
      manufacturerData: { 107: dv([1, 2]) },
      serviceData: { '0000feee-0000-1000-8000-00805f9b34fb': dv([1]) },
    })
    expect(fp).toEqual({ name: 'Polar H10 9A1B2C3D', services: ['180d', 'feee'], companyIds: [107], serviceData: ['feee'] })
    expect(JSON.stringify(fp)).not.toContain('AA:BB')
    expect(fingerprintKey(fp)).toBe(fingerprintKey({ ...fp, name: 'Polar H10 11111111' }))
  })

  it('tolère un résultat sans nom ni données', () => {
    expect(buildFingerprint({ device: { deviceId: 'x' } })).toEqual({ name: '', services: [], companyIds: [], serviceData: [] })
  })
})

describe('identifyDevice', () => {
  it('reconnaît une ceinture cardio par le service standard 0x180D, quelle que soit la marque', () => {
    const r = identifyDevice({ name: 'Polar H10 9A1B2C3D', services: ['180d'], companyIds: [107], serviceData: [] })
    expect(r.driver.id).toBe('ble_heart_rate')
    expect(r.driver.supported).toBe(true)
    expect(r.vendor?.name).toBe('Polar')
  })

  it('reconnaît une montre Huawei qui diffuse sa FC comme capteur cardio', () => {
    const r = identifyDevice({ name: 'HUAWEI WATCH GT 6 Pro-A1B', services: ['180d'], companyIds: [], serviceData: [] })
    expect(r.driver.id).toBe('ble_heart_rate')
    expect(r.vendor?.name).toBe('Huawei / Honor')
  })

  it('oriente une montre propriétaire vers son app et son guide', () => {
    const r = identifyDevice({ name: 'HUAWEI WATCH GT 6 Pro-A1B', services: ['fe86'], companyIds: [0x027d], serviceData: [] })
    expect(r.driver.id).toBe('vendor_watch')
    expect(r.driver.supported).toBe(false)
    expect(r.vendor).toMatchObject({ name: 'Huawei / Honor', guideId: 'huawei' })
  })

  it('reconnaît la famille par le seul identifiant fabricant', () => {
    expect(identifyDevice({ name: '', services: [], companyIds: [0x0157], serviceData: [] }).vendor?.name).toBe('Amazfit / Zepp')
    expect(identifyDevice({ name: 'Galaxy Watch7 (A1B2)', services: [], companyIds: [], serviceData: [] }).vendor?.guideId).toBe('samsung')
  })

  it('ne prend pas une TV, un téléphone ou des écouteurs de la même marque pour une montre', () => {
    for (const f of [
      { name: '[TV] Salon', companyIds: [0x0075] },
      { name: 'HUAWEI P40 Pro', companyIds: [0x027d] },
      { name: 'HUAWEI FreeBuds 6i', companyIds: [] },
      { name: '', companyIds: [0x038f] },
    ]) {
      const r = identifyDevice({ services: [], serviceData: [], ...f })
      expect(r.driver.id).toBe('unknown')
    }
    expect(identifyDevice({ name: '[TV] Salon', services: [], companyIds: [0x0075], serviceData: [] }).vendor?.name).toBe('Samsung')
  })

  it('reconnaît les profils santé standard pas encore gérés (tensiomètre, balance…)', () => {
    const bp = identifyDevice({ name: 'BP7000', services: ['1810'], companyIds: [], serviceData: [] })
    expect(bp.driver.id).toBe('ble_blood_pressure')
    expect(bp.driver.supported).toBe(false)
    expect(identifyDevice({ name: '', services: ['181d'], companyIds: [], serviceData: [] }).driver.id).toBe('ble_weight_scale')
  })

  it('classe un appareil sans indice comme inconnu', () => {
    const r = identifyDevice({ name: 'XYZ-123', services: ['abcd'], companyIds: [0x1234], serviceData: [] })
    expect(r.driver.id).toBe('unknown')
    expect(r.vendor).toBeNull()
  })

  it('a des identifiants de pilotes uniques', () => {
    const ids = DRIVERS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
