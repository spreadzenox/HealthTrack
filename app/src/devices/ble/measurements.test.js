import { describe, it, expect } from 'vitest'
import {
  readSfloat,
  readFloat,
  parseBloodPressure,
  parseWeight,
  parseBodyComposition,
  parseTemperature,
  parsePlxSpotCheck,
  parsePlxContinuous,
  measurementsToEntries,
  READERS,
  describeMeasurement,
} from './measurements'

const dv = (bytes) => new DataView(Uint8Array.from(bytes).buffer)
const u16 = (v) => [v & 0xff, (v >> 8) & 0xff]
// SFLOAT : exposant 4 bits signé, mantisse 12 bits signée
const sf = (mantissa, exp = 0) => u16(((exp & 0x0f) << 12) | (mantissa & 0x0fff))
const ts = (y, mo, d, h, mi, s) => [...u16(y), mo, d, h, mi, s]

describe('nombres IEEE-11073', () => {
  it('lit un SFLOAT (exposant négatif, valeurs spéciales)', () => {
    expect(readSfloat(dv(sf(120)), 0)).toBe(120)
    expect(readSfloat(dv(sf(365, -1)), 0)).toBeCloseTo(36.5)
    expect(readSfloat(dv(sf(-5)), 0)).toBe(-5)
    expect(readSfloat(dv(u16(0x07ff)), 0)).toBeNull() // NaN
    expect(readSfloat(dv(u16(0x0800)), 0)).toBeNull() // NRes
  })

  it('lit un FLOAT 32 bits', () => {
    // 3685 × 10^-2 = 36.85
    expect(readFloat(dv([0x65, 0x0e, 0x00, 0xfe]), 0)).toBeCloseTo(36.85)
    expect(readFloat(dv([0xff, 0xff, 0x7f, 0x00]), 0)).toBeNull() // NaN
  })
})

describe('tensiomètre 0x2A35', () => {
  it('décode tension, horodatage et pouls en mmHg', () => {
    const m = parseBloodPressure(dv([0x06, ...sf(128), ...sf(82), ...sf(97), ...ts(2026, 10, 11, 7, 45, 0), ...sf(64)]))
    expect(m).toMatchObject({ kind: 'blood_pressure', systolic: 128, diastolic: 82, pulseBpm: 64 })
    expect(m.at).toEqual(new Date(2026, 9, 11, 7, 45, 0))
  })

  it('convertit les kPa en mmHg et accepte l’absence d’horodatage', () => {
    const m = parseBloodPressure(dv([0x01, ...sf(160, -1), ...sf(107, -1), ...sf(125, -1)]))
    expect(m).toMatchObject({ systolic: 120, diastolic: 80, pulseBpm: null, at: null })
  })

  it('rejette une trame tronquée ou des valeurs absurdes', () => {
    expect(parseBloodPressure(dv([0x00, 1]))).toBeNull()
    expect(parseBloodPressure(dv([0x00, ...sf(80), ...sf(120), ...sf(90)]))).toBeNull()
  })
})

describe('balance 0x2A9D / 0x2A9C', () => {
  it('décode un poids en kg (résolution 5 g) avec horodatage', () => {
    // 72,36 kg / 0,005 = 14472
    const m = parseWeight(dv([0x02, ...u16(14472), ...ts(2026, 10, 12, 6, 30, 5)]))
    expect(m).toMatchObject({ kind: 'weight', weightKg: 72.36 })
    expect(m.at).toEqual(new Date(2026, 9, 12, 6, 30, 5))
  })

  it('convertit les livres en kg et ignore la valeur « mesure impossible »', () => {
    expect(parseWeight(dv([0x01, ...u16(16000)])).weightKg).toBeCloseTo(72.57, 2)
    expect(parseWeight(dv([0x00, ...u16(0xffff)]))).toBeNull()
  })

  it('décode la composition corporelle : masse grasse et poids', () => {
    // flags : poids (bit 10) ; masse grasse 23,4 % ; poids 70 kg
    const m = parseBodyComposition(dv([...u16(0x0400), ...u16(234), ...u16(14000)]))
    expect(m).toMatchObject({ kind: 'body_composition', fatRatioPct: 23.4, weightKg: 70 })
  })

  it('saute les champs optionnels jusqu’au poids', () => {
    // horodatage + utilisateur + métabolisme + % muscle + impédance + poids
    const flags = 0x0002 | 0x0004 | 0x0008 | 0x0010 | 0x0200 | 0x0400
    const m = parseBodyComposition(dv([
      ...u16(flags), ...u16(201), ...ts(2026, 10, 12, 6, 0, 0), 1, ...u16(6500), ...u16(400), ...u16(5000), ...u16(15000),
    ]))
    expect(m).toMatchObject({ fatRatioPct: 20.1, weightKg: 75 })
    expect(m.at).toEqual(new Date(2026, 9, 12, 6, 0, 0))
  })
})

describe('thermomètre 0x2A1C', () => {
  it('décode des °C et convertit des °F', () => {
    expect(parseTemperature(dv([0x00, 0x65, 0x0e, 0x00, 0xfe]))).toMatchObject({ kind: 'body_temperature', valueC: 36.9 })
    // 98,6 °F = 986 × 10^-1
    expect(parseTemperature(dv([0x01, 0xda, 0x03, 0x00, 0xff])).valueC).toBeCloseTo(37, 1)
  })

  it('rejette une température non corporelle', () => {
    expect(parseTemperature(dv([0x00, 0x16, 0x00, 0x00, 0x00]))).toBeNull() // 22 °C : thermomètre d'ambiance
  })
})

describe('oxymètre 0x2A5E / 0x2A5F', () => {
  it('décode une mesure ponctuelle avec horodatage', () => {
    const m = parsePlxSpotCheck(dv([0x01, ...sf(97), ...sf(66), ...ts(2026, 10, 12, 8, 0, 0)]))
    expect(m).toMatchObject({ kind: 'spo2', spo2: 97, pulseBpm: 66 })
    expect(m.at).toEqual(new Date(2026, 9, 12, 8, 0, 0))
  })

  it('décode une mesure continue', () => {
    expect(parsePlxContinuous(dv([0x00, ...sf(95), ...sf(72)]))).toMatchObject({ kind: 'spo2', spo2: 95, pulseBpm: 72, at: null })
    expect(parsePlxContinuous(dv([0x00, ...sf(20), ...sf(72)]))).toBeNull()
  })
})

describe('horodatage de l’appareil', () => {
  it('ignore une horloge non réglée (année 0) ou dans le futur', () => {
    expect(parseWeight(dv([0x02, ...u16(14000), ...ts(0, 0, 0, 0, 0, 0)])).at).toBeNull()
    expect(parseWeight(dv([0x02, ...u16(14000), ...ts(2099, 1, 1, 0, 0, 0)]), { now: new Date(2026, 9, 12) }).at).toBeNull()
  })
})

describe('measurementsToEntries', () => {
  const now = new Date('2026-10-12T05:00:00.000Z')

  it('produit les mêmes types d’entrée que Health Connect, source « ble »', () => {
    const entries = measurementsToEntries([
      { kind: 'blood_pressure', systolic: 128, diastolic: 82, pulseBpm: 64, at: new Date('2026-10-11T05:45:00.000Z') },
      { kind: 'weight', weightKg: 72.36, at: null },
      { kind: 'body_composition', fatRatioPct: 23.4, weightKg: 70, at: new Date('2026-10-12T04:00:00.000Z') },
      { kind: 'body_temperature', valueC: 36.9, at: null },
      { kind: 'spo2', spo2: 97, pulseBpm: 66, at: null },
    ], { deviceName: 'BP7000', now })
    const base = { sourceName: 'BP7000', connector: 'ble' }
    expect(entries).toEqual([
      { type: 'blood_pressure', source: 'ble', at: '2026-10-11T05:45:00.000Z', payload: { systolic: 128, diastolic: 82, unit: 'mmHg', pulseBpm: 64, ...base } },
      { type: 'weight', source: 'ble', at: now.toISOString(), payload: { valueKg: 72.4, ...base } },
      { type: 'body_composition', source: 'ble', at: '2026-10-12T04:00:00.000Z', payload: { fatRatioPct: 23.4, ...base } },
      { type: 'weight', source: 'ble', at: '2026-10-12T04:00:00.000Z', payload: { valueKg: 70, ...base } },
      { type: 'body_temperature', source: 'ble', at: now.toISOString(), payload: { valueC: 36.9, ...base } },
      { type: 'heart_rate', source: 'ble', at: now.toISOString(), payload: { value: 97, unit: '%', subtype: 'oxygenSaturation', ...base } },
    ])
  })

  it('ne garde qu’une mesure par type et par instant (oxymètre continu)', () => {
    const entries = measurementsToEntries([
      { kind: 'spo2', spo2: 96, pulseBpm: 70, at: null },
      { kind: 'spo2', spo2: 98, pulseBpm: 70, at: null },
    ], { now })
    expect(entries).toHaveLength(1)
    expect(entries[0].payload.value).toBe(98)
  })
})

describe('READERS', () => {
  it('associe chaque profil de mesure à sa caractéristique', () => {
    expect(Object.keys(READERS).sort()).toEqual(['ble_blood_pressure', 'ble_body_composition', 'ble_pulse_oximeter', 'ble_thermometer', 'ble_weight_scale'])
    expect(READERS.ble_blood_pressure.characteristics).toEqual([{ uuid: 0x2a35, parse: parseBloodPressure }])
  })
})

describe('describeMeasurement', () => {
  it('formate chaque mesure à la française', () => {
    expect(describeMeasurement({ kind: 'blood_pressure', systolic: 128, diastolic: 82, pulseBpm: null })).toBe('Tension 128/82 mmHg')
    expect(describeMeasurement({ kind: 'weight', weightKg: 72.36 })).toBe('Poids 72,4 kg')
    expect(describeMeasurement({ kind: 'body_composition', weightKg: 70, fatRatioPct: 23.4 })).toBe('Poids 70 kg · masse grasse 23,4 %')
    expect(describeMeasurement({ kind: 'body_temperature', valueC: 36.9 })).toBe('Température 36,9 °C')
    expect(describeMeasurement({ kind: 'spo2', spo2: 97, pulseBpm: 66 })).toBe('SpO₂ 97 % · pouls 66')
  })
})
