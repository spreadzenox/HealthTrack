import { describe, it, expect } from 'vitest'
import { decodeTlvs, encodeTlvs } from './protocol'
import {
  MIN_START_SEC,
  WATCH_SOURCE,
  blockTlvs,
  countTlvs,
  parseCount,
  parseMinuteBlock,
  parseMinuteBytes,
  parseSleepBlock,
  parseTotals,
  setTimeTlvs,
  syncWindow,
  watchEntries,
} from './sync'
import { connectAndAuthenticate, createKeyStore } from './pairing'
import { createFakeWatch, TEST_SECRETS } from './testing/fakeWatch'
import { createWatchSync, getWatchSyncState } from '../../services/watchSync'

const hex = (s) => Uint8Array.from(s.trim().split(/\s+/), (h) => parseInt(h, 16))
const be = (n, size) => Array.from({ length: size }, (_, i) => Math.floor(n / 2 ** (8 * (size - 1 - i))) & 0xff)

/** Corps TLV d'une réponse 7/0x0B : début (s) et minutes [{ offset, bytes }]. */
const minuteBlock = (index, startSec, minutes) => [
  {
    tag: 0x81,
    value: encodeTlvs([
      { tag: 2, value: be(index, 2) },
      { tag: 3, value: be(startSec, 4) },
      ...minutes.map((m) => ({ tag: 0x84, value: encodeTlvs([{ tag: 5, value: [m.offset & 0xff] }, { tag: 6, value: m.bytes }]) })),
    ]),
  },
]
/** Corps TLV d'une réponse 7/0x0D : [{ type, startSec, minutes }]. */
const sleepBlock = (index, periods) => [
  {
    tag: 0x81,
    value: encodeTlvs([
      { tag: 2, value: be(index, 2) },
      ...periods.map((p) => ({ tag: 0x83, value: encodeTlvs([{ tag: 4, value: [p.type] }, { tag: 5, value: [...be(p.startSec, 4), ...be(p.minutes, 2)] }]) })),
    ]),
  },
]
/** Minute : pas, calories, distance, FC (masque 0x4E). */
const minute = (steps, kcal, dist, hr) => [0x4e, ...be(steps, 2), ...be(kcal, 2), ...be(dist, 2), hr]

describe('montre Huawei : lecture des mesures (§7)', () => {
  it('bloc minute par minute de la spécification (§7.2)', () => {
    const tlvs = decodeTlvs(
      hex(`81 2B 02 02 00 00 03 04 66 F0 8A 00
           84 0D 05 01 00 06 08 4E 00 50 00 04 00 3C 48
           84 10 05 01 01 06 0B CE 03 00 64 00 05 00 4B 50 62 3A`),
    )
    expect(parseMinuteBlock(tlvs)).toEqual([
      { t: 1727040000000, steps: 80, kcal: 4, distanceM: 60, hr: 72 },
      { t: 1727040060000, steps: 100, kcal: 5, distanceM: 75, hr: 80, spo2: 98, restingHr: 58 },
    ])
  })

  it('octets d’une minute : bits inconnus sautés, valeurs nulles ignorées, minute tronquée refusée', () => {
    // masque 1 = 0x01 (inconnu, 2) + 0x02 (pas) + 0x10 (inconnu, 2) + 0x20 (inconnu, 1) + 0x40 (FC) + 0x80
    // masque 2 = 0x04 (inconnu) + 0x01 (SpO₂ = 0 → ignorée)
    expect(parseMinuteBytes([0xf3, 0x05, 0xaa, 0xbb, 0x00, 0x0c, 0x11, 0x22, 0x33, 0x41, 0x00, 0x99])).toEqual({ steps: 12, hr: 0x41 })
    expect(parseMinuteBytes([0x40, 0xff])).toEqual({})
    expect(() => parseMinuteBytes([0x02, 0x00])).toThrow(/tronquée/)
  })

  it('sommeil simple (§7.3) : 6 = léger, 7 = profond, type inconnu signalé', () => {
    const tlvs = sleepBlock(0, [
      { type: 6, startSec: 1760300000, minutes: 95 },
      { type: 7, startSec: 1760305700, minutes: 40 },
      { type: 9, startSec: 1760308100, minutes: 5 },
      { type: 6, startSec: 1760308400, minutes: 0 },
    ])
    expect(parseSleepBlock(tlvs)).toEqual([
      { start: 1760300000000, minutes: 95, stage: 'light' },
      { start: 1760305700000, minutes: 40, stage: 'deep' },
      { start: 1760308100000, minutes: 5, stage: 'unknown' },
    ])
  })

  it('demandes : heure + fuseau, nombre de blocs (jamais avant 2000), numéro de bloc', () => {
    expect(setTimeTlvs(1760320000000, 120)).toEqual([{ tag: 1, value: be(1760320000, 4) }, { tag: 2, value: [0x02, 0x00] }])
    expect(setTimeTlvs(0, -300)[1].value).toEqual([0x85, 0x00])
    expect(setTimeTlvs(0, 330)[1].value).toEqual([0x05, 0x1e])
    expect(countTlvs(0, 1760320000000)).toEqual([{ tag: 0x81 }, { tag: 3, value: be(MIN_START_SEC, 4) }, { tag: 4, value: be(1760320000, 4) }])
    expect(blockTlvs(258)).toEqual([{ tag: 0x81, value: [2, 2, 1, 2] }])
    expect(parseCount(decodeTlvs(hex('81 04 02 02 00 03')))).toBe(3)
  })

  it('totaux du jour (§7.4) : somme des éléments, entiers de 1 à 4 octets', () => {
    const body = encodeTlvs([
      { tag: 0x83, value: encodeTlvs([{ tag: 5, value: be(4200, 4) }, { tag: 6, value: be(150, 2) }, { tag: 7, value: be(3100, 4) }]) },
      { tag: 0x83, value: encodeTlvs([{ tag: 5, value: [100] }]) },
    ])
    expect(parseTotals([{ tag: 0x81, value: body }])).toEqual({ steps: 4300, kcal: 150, distanceM: 3100 })
  })

  it('entrées : pas et calories par heure, FC par 10 min, SpO₂, FC repos par jour terminé, sommeil — tranches finies seulement', () => {
    const h0 = Date.UTC(2026, 9, 12, 8) // 08:00 UTC
    const minutes = [
      { t: h0, steps: 100, kcal: 5, hr: 70 },
      { t: h0 + 5 * 60_000, steps: 50, kcal: 2, hr: 80, spo2: 97 },
      { t: h0 + 12 * 60_000, hr: 90 },
      { t: h0 + 3600_000 + 60_000, steps: 999, hr: 100 }, // heure suivante : pas finie
    ]
    const until = h0 + 3600_000 + 5 * 60_000
    const entries = watchEntries({ minutes, sleep: [{ start: h0 - 8 * 3600_000, minutes: 90, stage: 'deep' }, { start: h0, minutes: 3, stage: 'unknown' }] }, { until, sourceName: 'HUAWEI WATCH GT 6 Pro-1A2' })
    const pick = (type, sub) => entries.filter((e) => e.type === type && (!sub || e.payload.subtype === sub))
    expect(entries.every((e) => e.source === WATCH_SOURCE && e.payload.sourceName === 'HUAWEI WATCH GT 6 Pro-1A2')).toBe(true)
    expect(pick('steps')).toEqual([expect.objectContaining({ at: new Date(h0).toISOString(), payload: expect.objectContaining({ value: 150, endDate: new Date(h0 + 3600_000).toISOString() }) })])
    expect(pick('calories').map((e) => e.payload.value)).toEqual([7])
    expect(pick('heart_rate', 'heartRate').map((e) => [e.at.slice(11, 16), e.payload.bpm])).toEqual([
      ['08:00', 75],
      ['08:10', 90],
    ])
    expect(pick('heart_rate', 'oxygenSaturation')).toEqual([expect.objectContaining({ at: new Date(h0 + 5 * 60_000 + 30_000).toISOString(), payload: expect.objectContaining({ value: 97 }) })])
    expect(pick('sleep')).toEqual([expect.objectContaining({ payload: expect.objectContaining({ durationMinutes: 90, sleepState: 'deep' }) })])
    // aucune collision sur la clé de dédoublonnage (source, at, type)
    const keys = entries.map((e) => `${e.source}|${e.at}|${e.type}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('FC de repos : dernière valeur d’un jour terminé, jamais du jour en cours', () => {
    const day = new Date(2026, 9, 11, 0, 0, 0).getTime()
    const minutes = [
      { t: day + 3600_000, restingHr: 60 },
      { t: day + 20 * 3600_000, restingHr: 57 },
      { t: day + 25 * 3600_000, restingHr: 55 },
    ]
    const entries = watchEntries({ minutes }, { until: day + 30 * 3600_000 })
    expect(entries.map((e) => [e.payload.subtype, e.payload.bpm, e.at])).toEqual([['restingHeartRate', 57, new Date(day + 45_000).toISOString()]])
  })

  it('fenêtre : 7 jours la première fois, puis depuis la fin de la précédente, jusqu’à l’heure pleine', () => {
    const now = Date.UTC(2026, 9, 13, 2, 47)
    const first = syncWindow(null, now)
    expect(first.until).toBe(Date.UTC(2026, 9, 13, 2))
    expect(first.until - first.since).toBe(7 * 24 * 3600_000)
    expect(syncWindow(Date.UTC(2026, 9, 12, 20), now).since).toBe(Date.UTC(2026, 9, 12, 20))
  })
})

describe('montre Huawei : synchro de bout en bout (fausse montre)', () => {
  const memoryStorage = () => {
    const m = new Map()
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
  }

  it('connexion → heure → sommeil → minutes → totaux, chiffrés, écrits sans doublon ; la suivante repart de la fin', async () => {
    const now = Date.UTC(2026, 9, 13, 2, 47)
    const start = Math.floor(Date.UTC(2026, 9, 12, 20) / 1000)
    const watch = createFakeWatch({
      minuteBlocks: [
        minuteBlock(0, start, [
          { offset: 0, bytes: minute(120, 6, 90, 72) },
          { offset: 1, bytes: minute(80, 4, 60, 76) },
        ]),
        minuteBlock(1, start + 3 * 3600, [{ offset: 0, bytes: minute(0, 1, 0, 58) }]),
      ],
      sleepBlocks: [sleepBlock(0, [{ type: 6, startSec: start + 3 * 3600, minutes: 120 }, { type: 7, startSec: start + 5 * 3600, minutes: 45 }])],
      totals: [{ tag: 0x81, value: encodeTlvs([{ tag: 0x83, value: encodeTlvs([{ tag: 5, value: be(5400, 4) }]) }]) }],
    })
    const written = []
    const storage = memoryStorage()
    const sync = createWatchSync({ watchKey: 'AA:BB', watchName: 'HUAWEI WATCH GT 6 Pro-1A2', storage, now: () => now, write: async (e) => (written.push(...e), { inserted: e.length }) })
    const keyStore = createKeyStore(memoryStorage())
    const opts = { transport: watch.transport, watchKey: 'AA:BB', timeoutMs: 500, bindTimeoutMs: 500, keyStore, secrets: TEST_SECRETS, sync }
    const report = await connectAndAuthenticate(opts)
    expect(report.outcome.code).toBe('connected')
    expect(report.steps.find((s) => s.id === 'sync')).toMatchObject({ status: 'ok' })
    expect(report.sync).toMatchObject({ minutes: 3, nights: 1, totals: { steps: 5400, kcal: 0, distanceM: 0 } })
    expect(report.sync.label).toMatch(/^3 minutes, 1 nuit → \d+ mesures$/)
    // tout ce qui suit l'authentification part chiffré
    expect(watch.seen.slice(watch.seen.indexOf('1/8*'))).toEqual(['1/8*', '1/5*', '7/12*', '7/13*', '7/10*', '7/11*', '7/11*', '7/3*'])
    expect(written.filter((e) => e.type === 'steps').map((e) => e.payload.value)).toEqual([200])
    expect(written.filter((e) => e.type === 'sleep').map((e) => e.payload.sleepState)).toEqual(['light', 'deep'])
    expect(getWatchSyncState('AA:BB', storage).until).toBe(Date.UTC(2026, 9, 13, 2))
  })

  it('montre qui ne répond pas aux mesures : connexion gardée, étape « Lecture des mesures » en avertissement', async () => {
    const watch = createFakeWatch({ silentOn: 0x0c })
    const sync = createWatchSync({ watchKey: 'X', storage: memoryStorage(), write: async () => ({ inserted: 0 }) })
    const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'X', timeoutMs: 300, bindTimeoutMs: 300, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(report.outcome.code).toBe('connected')
    expect(report.steps.find((s) => s.id === 'sync')).toMatchObject({ status: 'warn', detail: expect.stringMatching(/Pas de réponse/) })
  })
})
