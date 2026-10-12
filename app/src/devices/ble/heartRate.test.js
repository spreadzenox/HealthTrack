import { describe, it, expect } from 'vitest'
import { parseHeartRateMeasurement, cleanRrIntervals, rmssd, summarizeHeartRateSession, sessionToEntries } from './heartRate'

const dv = (bytes) => new DataView(Uint8Array.from(bytes).buffer)

describe('parseHeartRateMeasurement (0x2A37)', () => {
  it('lit une FC sur 8 bits sans RR', () => {
    expect(parseHeartRateMeasurement(dv([0x00, 72]))).toEqual({ bpm: 72, contact: null, energyKj: null, rrMs: [] })
  })

  it('lit une FC sur 16 bits', () => {
    expect(parseHeartRateMeasurement(dv([0x01, 0x2c, 0x01])).bpm).toBe(300)
  })

  it('lit le contact capteur quand il est géré', () => {
    expect(parseHeartRateMeasurement(dv([0x06, 60])).contact).toBe(true)
    expect(parseHeartRateMeasurement(dv([0x04, 60])).contact).toBe(false)
  })

  it('saute l’énergie dépensée et convertit les RR (1/1024 s) en ms', () => {
    // flags : énergie (bit 3) + RR (bit 4) ; FC 64 ; énergie 0x0010 ; RR 1024 (= 1000 ms) et 512 (= 500 ms)
    const m = parseHeartRateMeasurement(dv([0x18, 64, 0x10, 0x00, 0x00, 0x04, 0x00, 0x02]))
    expect(m.bpm).toBe(64)
    expect(m.energyKj).toBe(16)
    expect(m.rrMs).toEqual([1000, 500])
  })

  it('ignore un octet RR tronqué et une trame vide', () => {
    expect(parseHeartRateMeasurement(dv([0x10, 60, 0x00, 0x04, 0x01])).rrMs).toEqual([1000])
    expect(parseHeartRateMeasurement(dv([]))).toBeNull()
  })
})

describe('VFC', () => {
  it('écarte les RR impossibles et les sauts > 20 % (battement manqué ou en trop)', () => {
    const { kept, rejected } = cleanRrIntervals([1000, 250, 1010, 2100, 990, 1500, 1000])
    expect(kept).toEqual([1000, 1010, 990, 1000])
    expect(rejected).toBe(3)
  })

  it('calcule le RMSSD sur les différences successives', () => {
    // différences : 20, -20, 20 → RMSSD 20
    expect(rmssd([1000, 1020, 1000, 1020])).toBeCloseTo(20, 6)
    expect(rmssd([1000])).toBeNull()
  })
})

describe('summarizeHeartRateSession', () => {
  const start = Date.parse('2026-10-12T06:00:00Z')
  const steady = (n, at0 = start) => {
    const samples = []
    let t = at0
    for (let i = 0; i < n; i++) {
      const rr = i % 2 ? 1030 : 1000
      t += rr
      samples.push({ at: t, bpm: 59, rrMs: [rr] })
    }
    return samples
  }

  it('donne FC moyenne / min / max et une VFC fiable après ≥ 1 min propre', () => {
    const s = summarizeHeartRateSession(steady(120))
    expect(s.meanBpm).toBe(59)
    expect(s.rrCount).toBe(120)
    expect(s.rmssdMs).toBeCloseTo(30, 0)
    expect(s.quality).toBe('good')
    expect(s.durationSec).toBeGreaterThan(110)
  })

  it('refuse la VFC sur une mesure trop courte ou sans RR', () => {
    expect(summarizeHeartRateSession(steady(30)).rmssdMs).toBeNull()
    expect(summarizeHeartRateSession(steady(30)).quality).toBe('short')
    const noRr = [{ at: start, bpm: 60, rrMs: [] }, { at: start + 90000, bpm: 62, rrMs: [] }]
    const s = summarizeHeartRateSession(noRr)
    expect(s.rmssdMs).toBeNull()
    expect(s.quality).toBe('no_rr')
    expect(s.meanBpm).toBe(61)
  })

  it('refuse la VFC quand plus de 20 % des battements sont des artefacts', () => {
    const samples = steady(120).map((x, i) => (i % 4 === 0 ? { ...x, rrMs: [400] } : x))
    expect(summarizeHeartRateSession(samples).quality).toBe('noisy')
    expect(summarizeHeartRateSession(samples).rmssdMs).toBeNull()
  })

  it('ignore les FC à 0 (capteur pas encore au contact)', () => {
    const s = summarizeHeartRateSession([{ at: start, bpm: 0, rrMs: [] }, { at: start + 1000, bpm: 70, rrMs: [] }])
    expect(s.meanBpm).toBe(70)
    expect(s.minBpm).toBe(70)
  })

  it('renvoie null sans aucune FC', () => {
    expect(summarizeHeartRateSession([])).toBeNull()
  })
})

describe('sessionToEntries', () => {
  const start = Date.parse('2026-10-12T06:00:00Z')
  const samples = Array.from({ length: 60 }, (_, i) => ({ at: start + i * 1000, bpm: 60 + (i % 2) * 2, rrMs: [] }))

  it('moyenne la FC par tranches de 10 s (source « ble ») et ajoute la VFC à la fin', () => {
    const entries = sessionToEntries(samples, { rmssdMs: 41.6, rrCount: 300, quality: 'good', durationSec: 300 }, { deviceName: 'Polar H10 1234' })
    const hr = entries.filter((e) => e.payload.subtype === 'heartRate')
    expect(hr).toHaveLength(6)
    expect(hr[0]).toMatchObject({ type: 'heart_rate', source: 'ble', at: new Date(start).toISOString() })
    expect(hr[0].payload).toMatchObject({ bpm: 61, sourceName: 'Polar H10 1234', connector: 'ble' })
    const hrv = entries.find((e) => e.payload.subtype === 'heartRateVariability')
    expect(hrv.payload).toMatchObject({ value: 41.6, unit: 'ms', method: 'rmssd', rrCount: 300, durationSec: 300 })
    // horodatage distinct des FC (clé de dédoublonnage source|at|type)
    expect(hr.map((e) => e.at)).not.toContain(hrv.at)
  })

  it('n’ajoute pas de VFC quand elle n’est pas fiable', () => {
    const entries = sessionToEntries(samples, { rmssdMs: null, quality: 'short' }, { deviceName: 'X' })
    expect(entries.every((e) => e.payload.subtype === 'heartRate')).toBe(true)
  })
})
