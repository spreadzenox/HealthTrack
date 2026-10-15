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
  totalsEntries,
  countEntryKinds,
  RESUME_MAX_DAYS,
  describeMinutes,
  describeTypes,
  watchEntries,
  CAPABILITY_QUERY,
  canDo,
  commandsTlvs,
  describeCapabilities,
  hasExpand,
  parseCommands,
  parseServices,
  parseWorkoutList,
  parseWorkoutTotals,
  workoutListTlvs,
  outcomeOf,
  readWatchData,
  describeServices,
  syncHints,
  stalledServices,
} from './sync'
import { SLEEP_FIELD } from './files'
import { field, sleepSequenceFile } from './testing/sampleFiles'
import { clearWatchNights } from '../../services/watchSync'
import { connectAndAuthenticate, createKeyStore } from './pairing'
import { createFakeWatch, TEST_SECRETS } from './testing/fakeWatch'
import { clearWatchDayTotals, createWatchSync, getWatchSyncState, SYNC_STATE_VERSION } from '../../services/watchSync'

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
      { start: 1760300000000, minutes: 95, stage: 'light', type: 6 },
      { start: 1760305700000, minutes: 40, stage: 'deep', type: 7 },
      { start: 1760308100000, minutes: 5, stage: 'unknown', type: 9 },
    ])
    expect(describeTypes(parseSleepBlock(tlvs))).toBe('6×1, 7×1, 9×1')
    expect(describeMinutes([{ steps: 5, hr: 70 }, { hr: 71, spo2: 97 }, {}])).toBe('pas 1, FC 2, SpO₂ 1')
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

  it('entrées : pas et calories par heure, FC et SpO₂ par 10 min, FC repos par jour terminé, sommeil — tranches finies seulement', () => {
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
    // SpO₂ par tranche de 10 min (I82), à la tranche + 20 s
    expect(pick('heart_rate', 'oxygenSaturation')).toEqual([expect.objectContaining({ at: new Date(h0 + 20_000).toISOString(), payload: expect.objectContaining({ value: 97, min: 97, max: 97, samples: 1 }) })])
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

  it('fenêtre : depuis le 1/1/2000 la première fois, puis depuis la précédente moins 6 h (30 jours au plus), jusqu’à l’heure pleine', () => {
    const now = Date.UTC(2026, 9, 13, 2, 47)
    const first = syncWindow(null, now)
    expect(first.until).toBe(Date.UTC(2026, 9, 13, 2))
    expect(first.since).toBe(MIN_START_SEC * 1000)
    expect(syncWindow(Date.UTC(2026, 9, 12, 20), now).since).toBe(Date.UTC(2026, 9, 12, 14))
    expect(syncWindow(Date.UTC(2026, 6, 1), now).since).toBe(first.until - RESUME_MAX_DAYS * 24 * 3600_000)
  })

  it('journal v124 : resynchro dans la même heure → la fenêtre n’est plus vide (10:00 → 10:00 avant)', () => {
    const now = Date.parse('2026-10-14T10:22:00Z')
    const w = syncWindow(Date.parse('2026-10-14T10:00:00Z'), now)
    expect(new Date(w.until).toISOString()).toBe('2026-10-14T10:00:00.000Z')
    expect(new Date(w.since).toISOString()).toBe('2026-10-14T04:00:00.000Z')
    expect(w.since).toBeLessThan(w.until)
  })

  it('totaux du jour (journal v124 : 603 pas, 20 kcal, 529 m) → entrées « total du jour » à minuit + 50 s', () => {
    const now = Date.parse('2026-10-14T10:22:00Z')
    const out = totalsEntries({ steps: 603, kcal: 20, distanceM: 529 }, now, { sourceName: 'HUAWEI WATCH GT 6 Pro-1A2' })
    const midnight = new Date(now)
    midnight.setHours(0, 0, 50, 0)
    expect(out).toEqual([
      { type: 'steps', source: WATCH_SOURCE, at: midnight.toISOString(), payload: expect.objectContaining({ value: 603, distanceM: 529, period: 'day', endDate: '2026-10-14T10:22:00.000Z', sourceName: 'HUAWEI WATCH GT 6 Pro-1A2' }) },
      { type: 'calories', source: WATCH_SOURCE, at: midnight.toISOString(), payload: expect.objectContaining({ value: 20, unit: 'kcal', period: 'day' }) },
    ])
    expect(totalsEntries({ steps: 0, kcal: 0, distanceM: 0 }, now)).toEqual([])
    expect(totalsEntries(null, now)).toEqual([])
    expect(countEntryKinds(out)).toEqual({ steps_jour: 1, calories_jour: 1 })
  })

  it('le total du jour précédent est retiré avant d’écrire le nouveau (et seulement lui)', async () => {
    const at = '2026-10-13T22:00:50.000Z'
    const stored = [
      { id: 1, type: 'steps', source: WATCH_SOURCE, at, payload: { value: 603, period: 'day' } },
      { id: 2, type: 'steps', source: WATCH_SOURCE, at, payload: { value: 40 } },
    ]
    const removed = []
    const n = await clearWatchDayTotals([{ type: 'steps', at }], { list: async () => stored, remove: async (id) => removed.push(id) })
    expect(n).toBe(1)
    expect(removed).toEqual([1])
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
    expect(report.sync.label).toMatch(/^3 minutes, 1 nuit, 5\u202f400 pas aujourd'hui → \d+ mesures$/)
    expect(report.sync.firstSync).toBe(true)
    expect(report.sync.kinds).toMatchObject({ steps: 1, steps_jour: 1, heartRate: 2 })
    // tout ce qui suit l'authentification part chiffré
    expect(watch.seen.slice(watch.seen.indexOf('1/8*'))).toEqual([
      '1/8*', '1/5*', '1/2*', '1/3*', '1/49*',
      // fin d'association (§6.12)
      '1/7*', '26/5*', '1/48*', '1/62*', '1/61*', '1/53*', '7/2*', '7/14*', '1/50*', '12/1*', '1/4*', '7/23*', '7/36*',
      '7/12*', '7/13*', '7/10*', '7/11*', '7/11*', '7/3*', '23/7*', '44/1*', '44/6*'])
    expect(written.filter((e) => e.type === 'steps' && !e.payload.period).map((e) => e.payload.value)).toEqual([200])
    expect(written.filter((e) => e.type === 'sleep').map((e) => e.payload.sleepState)).toEqual(['light', 'deep'])
    expect(written.find((e) => e.payload.period === 'day')).toMatchObject({ type: 'steps', payload: { value: 5400 } })
    expect(getWatchSyncState('AA:BB', storage)).toMatchObject({ v: SYNC_STATE_VERSION, until: Date.UTC(2026, 9, 13, 2) })
  })

  it('journal v124 : état ancien (sans version, fenêtre vide) → première synchro ; une synchro sans rien ne fait pas avancer la reprise', async () => {
    const now = Date.parse('2026-10-14T10:22:00Z')
    const storage = memoryStorage()
    storage.setItem('healthtrack_watch_sync', JSON.stringify({ W: { until: Date.parse('2026-10-14T10:00:00Z'), inserted: 0 } }))
    const logs = []
    const asked = []
    const session = {
      request: async (service, command, tlvs) => {
        asked.push(`${service}/${command}`)
        if (command === 0x0a || command === 0x0c) {
          asked.push(`début ${new Date(tlvs.find((t) => t.tag === 3) && parseInt(tlvs.find((t) => t.tag === 3).value.map((b) => b.toString(16).padStart(2, '0')).join(''), 16) * 1000).toISOString()}`)
          return { tlvs: [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: [0, 0] }]) }] }
        }
        if (command === 0x03) return { tlvs: [{ tag: 0x81, value: encodeTlvs([{ tag: 0x83, value: encodeTlvs([{ tag: 5, value: be(603, 2) }, { tag: 6, value: [20] }, { tag: 7, value: be(529, 2) }]) }]) }] }
        throw new Error('non pris en charge')
      },
    }
    const written = []
    const sync = createWatchSync({ watchKey: 'W', storage, now: () => now, write: async (e) => (written.push(...e), { inserted: e.length }), clearTotals: async () => 0 })
    const out = await sync(session, { log: (m) => logs.push(m), caps: { services: new Map([[0x17, false], [0x2c, false]]), commands: null } })
    expect(out.firstSync).toBe(true)
    expect(out.since).toBe('2000-01-01T00:00:00.000Z')
    expect(asked).toContain('début 2000-01-01T00:00:00.000Z')
    expect(out.totals).toEqual({ steps: 603, kcal: 20, distanceM: 529 })
    expect(written.map((e) => [e.type, e.payload.value, e.payload.period])).toEqual([['steps', 603, 'day'], ['calories', 20, 'day']])
    // rien d'autre reçu : la reprise reste « première synchro »
    expect(getWatchSyncState('W', storage)).toMatchObject({ v: SYNC_STATE_VERSION, until: null })
    expect(logs.some((m) => /première synchro/.test(m))).toBe(true)
  })

  it('I69 : sommeil sans réponse → les minutes sont quand même lues, l’étape dit où la montre a calé', async () => {
    const now = Date.UTC(2026, 9, 13, 2, 47)
    const start = Math.floor(Date.UTC(2026, 9, 12, 20) / 1000)
    const watch = createFakeWatch({ silentOn: 0x0c, minuteBlocks: [minuteBlock(0, start, [{ offset: 0, bytes: minute(120, 6, 90, 72) }])] })
    const sync = createWatchSync({ watchKey: 'X', storage: memoryStorage(), now: () => now, write: async (e) => ({ inserted: e.length }) })
    const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'X', timeoutMs: 300, bindTimeoutMs: 300, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(report.outcome.code).toBe('connected')
    expect(report.steps.find((s) => s.id === 'sync')).toMatchObject({ status: 'warn', detail: expect.stringMatching(/^1 minute → \d+ mesures? · sans réponse : sommeil$/) })
    expect(report.sync.stalled).toEqual(['sommeil'])
    expect(report.sync.services.map((r) => [r.id, r.outcome, r.count])).toEqual([
      ['sleep', 'timeout', 0], ['minutes', 'ok', 1], ['totals', 'empty', 0], ['workouts', 'empty', 0], ['sleepFile', 'empty', 0],
    ])
    expect(report.sync.services[1]).toMatchObject({ command: '7/0x0A', units: 1 })
    expect(report.log.some((l) => /lectures : sommeil : sans réponse, minutes : reçu \(1\)/.test(l.msg))).toBe(true)
  })

  it('I69 : un bloc minute sans réponse arrête ce service, ce qui est déjà lu est gardé', async () => {
    const now = Date.UTC(2026, 9, 13, 2, 47)
    const start = Math.floor(Date.UTC(2026, 9, 12, 20) / 1000)
    const blocks = [0, 1, 2].map((i) => minuteBlock(i, start + i * 3600, [{ offset: 0, bytes: minute(100, 5, 80, 70) }]))
    const watch = createFakeWatch({ minuteBlocks: blocks, silentBlock: 1 })
    const written = []
    const sync = createWatchSync({ watchKey: 'Z', storage: memoryStorage(), now: () => now, write: async (e) => (written.push(...e), { inserted: e.length }) })
    const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'Z', timeoutMs: 300, bindTimeoutMs: 300, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(report.sync.minutes).toBe(1)
    expect(report.sync.services.find((r) => r.id === 'minutes')).toMatchObject({ outcome: 'ok', count: 1, units: 3, failed: 2 })
    // un seul bloc tenté après le silence : pas 2 délais d'attente de plus
    expect(watch.seen.filter((x) => x === '7/11*')).toHaveLength(2)
    expect(written.filter((e) => e.type === 'steps' && !e.payload.period).map((e) => e.payload.value)).toEqual([100])
    expect(report.sync.stalled).toEqual([])
  })

  it('séances et sommeil détaillé : capacités lues, fichier téléchargé par blocs, nuit détaillée à la place des périodes simples', async () => {
    const now = Date.UTC(2026, 9, 13, 8, 10)
    const bed = Math.floor(Date.UTC(2026, 9, 12, 22) / 1000)
    const run = Math.floor(Date.UTC(2026, 9, 12, 17) / 1000)
    const file = sleepSequenceFile([
      { startSec: bed, endSec: bed + 9 * 3600, fields: [field(SLEEP_FIELD.BED, bed), field(SLEEP_FIELD.VALID, 1), field(SLEEP_FIELD.SCORE, 78), field(SLEEP_FIELD.HRV, 38.2)], stages: [[10, 4], [200, 1], [90, 3], [80, 2], [20, 4]] },
    ])
    for (const filePlain of [false, true]) {
      const watch = createFakeWatch({
        sleepBlocks: [sleepBlock(0, [{ type: 6, startSec: bed + 600, minutes: 200 }])],
        workouts: [{ number: 7, body: [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: be(7, 2) }, { tag: 4, value: be(run, 4) }, { tag: 5, value: be(run + 1800, 4) }, { tag: 6, value: be(310, 4) }, { tag: 7, value: be(5200, 4) }, { tag: 8, value: be(4800, 4) }, { tag: 0x0c, value: [96, 171] }, { tag: 0x12, value: be(1750, 4) }, { tag: 0x14, value: [1] }]) }] }],
        files: { sequence_data: file },
        expand: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x80], // capacité 143
        filePlain,
      })
      const written = []
      const cleared = []
      const sync = createWatchSync({ watchKey: 'W', storage: memoryStorage(), now: () => now, write: async (e) => (written.push(...e), { inserted: e.length }), clear: async (n) => cleared.push(...n) })
      const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'W', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
      expect(report.outcome.code).toBe('connected')
      expect(report.sync).toMatchObject({ nights: 1, detailedNights: 1, workouts: 1 })
      expect(report.sync.capabilities).toMatch(/séances oui.*sommeil dictionnaire oui/)
      expect(report.sync.label).toMatch(/1 nuit, 1 séance → \d+ mesures$/)
      expect(watch.seen).toContain('1/55*')
      expect(watch.seen.filter((x) => x.startsWith('44/4')).length).toBe(Math.ceil(file.length / 64))
      expect(watch.seen.filter((x) => x === '44/4').length).toBe(filePlain ? Math.ceil(file.length / 64) : 0)
      const sleep = written.filter((e) => e.type === 'sleep')
      expect(sleep.map((e) => [e.payload.sleepState, e.payload.durationMinutes])).toEqual([['awake', 10], ['light', 200], ['deep', 90], ['rem', 80], ['awake', 20]])
      expect(sleep.every((e) => e.payload.detail && e.payload.sleepScore === 78)).toBe(true)
      expect(written.find((e) => e.payload.subtype === 'heartRateVariability')).toMatchObject({ at: '2026-10-13T04:40:15.000Z', payload: { value: 38.2, unit: 'ms', during: 'sleep' } })
      expect(written.find((e) => e.type === 'activity').payload).toMatchObject({ workoutType: 'running', durationSeconds: 1750, totalCalories: 310, totalDistanceMeters: 5200, steps: 4800, minHeartRate: 96, maxHeartRate: 171, endDate: '2026-10-12T17:30:00.000Z' })
      expect(cleared).toHaveLength(1)
    }
  })

  it('montre sans séances ni fichiers : ni 0x17 ni 0x2C demandés, la synchro de base passe', async () => {
    const watch = createFakeWatch({ unsupported: [0x17, 0x2c] })
    const sync = createWatchSync({ watchKey: 'Y', storage: memoryStorage(), write: async () => ({ inserted: 0 }) })
    const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'Y', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(report.outcome.code).toBe('connected')
    expect(watch.seen.some((x) => x.startsWith('23/') || x.startsWith('44/'))).toBe(false)
    expect(report.sync.capabilities).toMatch(/séances non, fichiers 0x2C non/)
  })
})

describe('montre Huawei : issue de chaque lecture (I69, §7.10)', () => {
  it('une minute plus courte que son masque est sautée, pas tout le bloc', () => {
    const tlvs = minuteBlock(0, 1727040000, [
      { offset: 0, bytes: minute(80, 4, 60, 72) },
      { offset: 1, bytes: [0x02, 0x00] }, // pas annoncés sur 2 octets, 1 seul reçu
      { offset: 2, bytes: minute(100, 5, 75, 80) },
    ])
    expect(parseMinuteBlock(decodeTlvs(encodeTlvs(tlvs))).map((m) => m.steps)).toEqual([80, 100])
  })

  it('outcomeOf : délai dépassé, refus, erreur', () => {
    expect(outcomeOf(new Error('Pas de réponse de la montre (7/12) en 8 s'))).toBe('timeout')
    expect(outcomeOf(new Error('fichier sequence_data : bloc 0 incomplet'))).toBe('timeout')
    expect(outcomeOf(new Error('fichier sequence_data refusé (code 100009)'))).toBe('refused')
    expect(outcomeOf(new Error('TLV 3 tronqué'))).toBe('error')
  })

  it('séances : une séance illisible n’empêche pas de lire les autres', async () => {
    const run = Math.floor(Date.UTC(2026, 9, 12, 17) / 1000)
    const good = [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: be(8, 2) }, { tag: 4, value: be(run, 4) }, { tag: 5, value: be(run + 1800, 4) }, { tag: 0x14, value: [1] }]) }]
    const session = {
      request: async (service, command, tlvs) => {
        if (service === 7 && (command === 0x0a || command === 0x0c)) return { tlvs: [{ tag: 0x81, value: [2, 2, 0, 0] }] }
        if (service === 7) return { tlvs: [{ tag: 0x81, value: [] }] }
        if (service === 0x17 && command === 0x07) return { tlvs: [{ tag: 0x81, value: encodeTlvs([7, 8].map((n) => ({ tag: 0x85, value: encodeTlvs([{ tag: 6, value: be(n, 2) }]) }))) }] }
        if (service === 0x17 && command === 0x08) {
          const n = tlvs[0].value[3]
          // séance 7 : corps plus court que la longueur annoncée (séance automatique, #5784)
          return n === 7 ? { tlvs: [{ tag: 0x81, value: Uint8Array.from([0x04, 0x04, 0x01]) }] } : { tlvs: good }
        }
        throw new Error('non pris en charge')
      },
    }
    const caps = { services: new Map([[0x2c, false]]), commands: null }
    const data = await readWatchData(session, { since: Date.UTC(2026, 9, 12), until: Date.UTC(2026, 9, 13), caps })
    expect(data.workouts.map((w) => w.number)).toEqual([8])
    expect(data.services.find((r) => r.id === 'workouts')).toMatchObject({ outcome: 'ok', count: 1, units: 2, failed: 1 })
    expect(data.services.find((r) => r.id === 'sleepFile')).toMatchObject({ outcome: 'unsupported' })
    expect(describeServices(data.services)).toBe('sommeil : vide, minutes : vide, totaux du jour : vide, séances : reçu (1), 1 bloc perdu, sommeil détaillé : non pris en charge')
  })

  it('pistes : fichiers déclarés mais muets → canal auxiliaire ; pas du jour sans historique ; rien n’aboutit', () => {
    const caps = { services: new Map([[0x2c, true]]) }
    const reads = (outcomes) => Object.entries(outcomes).map(([id, outcome]) => ({ id, outcome }))
    expect(syncHints(reads({ minutes: 'ok', sleepFile: 'timeout' }), { caps })).toEqual([expect.stringMatching(/canal RFCOMM auxiliaire/)])
    expect(syncHints(reads({ minutes: 'ok', sleepFile: 'timeout' }), { caps: { services: new Map([[0x2c, null]]) } })).toEqual([])
    expect(syncHints(reads({ minutes: 'empty', totals: 'ok' }), { totals: { steps: 603 } })).toEqual([expect.stringMatching(/aucun bloc minute/)])
    expect(syncHints(reads({ sleep: 'timeout', minutes: 'timeout', totals: 'error', workouts: 'unsupported' }))).toEqual([expect.stringMatching(/aucune lecture/)])
    expect(stalledServices(reads({ sleep: 'timeout', minutes: 'empty', totals: 'refused' })).map((r) => r.id)).toEqual(['sleep', 'totals'])
  })
})

describe('montre Huawei : capacités et séances (§7.5, 7.8)', () => {
  it('services : un octet par service demandé ; commandes : tableau aligné sur la demande', () => {
    const services = parseServices([{ tag: 2, value: [1, 0, 1] }], [7, 0x17, 0x2c])
    expect([...services]).toEqual([[7, true], [0x17, false], [0x2c, true]])
    const query = [[7, [0x0a, 0x16]], [0x20, [9]]]
    const req = decodeTlvs(Uint8Array.from(commandsTlvs(query)[0].value))
    expect(req.map((t) => [t.tag, Array.from(t.value)])).toEqual([[2, [7]], [3, [0x0a, 0x16]], [2, [0x20]], [3, [9]]])
    const reply = [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: [7] }, { tag: 4, value: [1, 0] }, { tag: 2, value: [0x20] }, { tag: 4, value: [1] }]) }]
    const cmds = parseCommands(reply, query)
    expect(cmds.get('7/10')).toBe(true)
    expect(cmds.get('7/22')).toBe(false)
    expect(cmds.get('32/9')).toBe(true)
    expect(CAPABILITY_QUERY.every(([, c]) => c.length > 0)).toBe(true)
  })

  it('capacités étendues : bit N, poids faible d’abord ; « non » seulement si la montre l’a dit', () => {
    const bytes = new Array(30).fill(0)
    bytes[17] = 0x80 // 143
    bytes[29] = 0x08 // 235
    expect(hasExpand(bytes, 143)).toBe(true)
    expect(hasExpand(bytes, 235)).toBe(true)
    expect(hasExpand(bytes, 142)).toBe(false)
    expect(hasExpand(null, 143)).toBe(false)
    expect(canDo(null, 0x17, 7)).toBe(true)
    expect(canDo({ services: new Map([[0x17, false]]) }, 0x17)).toBe(false)
    expect(canDo({ services: new Map([[0x17, true]]), commands: new Map([['23/7', false]]) }, 0x17, 7)).toBe(false)
    expect(describeCapabilities(null)).toBe('capacités inconnues')
  })

  it('séances : liste (numéros de la montre) et totaux ; type inconnu → « other »', () => {
    expect(decodeTlvs(Uint8Array.from(workoutListTlvs(0, 1760306400000)[0].value)).map((t) => t.tag)).toEqual([3, 4])
    const list = [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: [0, 2] }, { tag: 0x85, value: encodeTlvs([{ tag: 6, value: [0, 12] }]) }, { tag: 0x85, value: encodeTlvs([{ tag: 6, value: [1, 2] }]) }]) }]
    expect(parseWorkoutList(list)).toEqual([12, 258])
    const totals = (extra) => [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: [0, 12] }, { tag: 4, value: be(1000, 4) }, { tag: 5, value: be(1600, 4) }, ...extra]) }]
    expect(parseWorkoutTotals(totals([{ tag: 0x14, value: [99] }]))).toEqual({ number: 12, start: 1_000_000, end: 1_600_000, kcal: 0, distanceM: 0, steps: 0, durationSec: 600, sport: 'other' })
    expect(parseWorkoutTotals(totals([{ tag: 0x14, value: [137] }, { tag: 0x0c, value: [0, 255] }])).sport).toBe('yoga')
    expect(parseWorkoutTotals(totals([{ tag: 0x0c, value: [0, 255] }]))).not.toHaveProperty('hrMax')
    expect(parseWorkoutTotals([{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: [0, 1] }]) }])).toBeNull()
  })

  it('entrées : une nuit détaillée remplace les périodes simples qui la recoupent ; nuit non terminée attendue', () => {
    const s = Date.UTC(2026, 9, 12, 22)
    const night = { start: s, end: s + 8 * 3600_000, score: 80, hrvMs: 40, stages: [{ start: s, minutes: 480, stage: 'light' }] }
    const simple = [{ start: s + 3600_000, minutes: 60, stage: 'deep' }, { start: s - 6 * 3600_000, minutes: 30, stage: 'light' }]
    const out = watchEntries({ sleep: simple, nights: [night] }, { until: s + 9 * 3600_000 })
    expect(out.filter((e) => e.type === 'sleep').map((e) => [e.at, e.payload.detail || false])).toEqual([
      [new Date(s - 6 * 3600_000).toISOString(), false],
      [new Date(s).toISOString(), true],
    ])
    expect(watchEntries({ nights: [night] }, { until: s + 3600_000 }).filter((e) => e.payload.detail)).toEqual([])
  })

  it('clearWatchNights efface les entrées sommeil de la montre dans la nuit', async () => {
    const calls = []
    const n = await clearWatchNights([{ start: 0, end: 3600_000 }], {
      list: async (q) => (calls.push(q), [{ id: 4 }, { id: 9 }]),
      remove: async (id) => calls.push(id),
    })
    expect(n).toBe(2)
    expect(calls[0]).toMatchObject({ type: 'sleep', source: 'huawei_watch', since: '1970-01-01T00:00:00.000Z', until: '1970-01-01T00:59:59.999Z' })
    expect(calls.slice(1)).toEqual([4, 9])
  })
})
