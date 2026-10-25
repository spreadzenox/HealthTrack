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
  describeUnknownBits,
  describeTypes,
  watchEntries,
  CAPABILITY_QUERY,
  canDo,
  commandsTlvs,
  describeCapabilities,
  hasExpand,
  parseCommands,
  parseServices,
  heartRateCurve,
  MAX_WORKOUT_BLOCKS,
  parseWorkoutIndex,
  parseWorkoutList,
  parseWorkoutPace,
  parseWorkoutSamples,
  workoutPaceTlvs,
  workoutSamplesTlvs,
  parseWorkoutTotals,
  workoutListTlvs,
  outcomeOf,
  readWatchData,
  describeServices,
  syncHints,
  stalledServices,
  stepsCheck,
} from './sync'
import { SLEEP_FIELD } from './files'
import { field, sleepSequenceFile, stressFile } from './testing/sampleFiles'
import { clearWatchNights } from '../../services/watchSync'
import { connectAndAuthenticate, createKeyStore } from './pairing'
import { createFakeWatch, TEST_SECRETS } from './testing/fakeWatch'
import { dictionaryPage, real4, real8 } from './testing/sampleDictionary'
import { DICT_CLASS, DICT_FIELD } from './p2p'
import { clearWatchDayTotals, createWatchSync, getSkinTempContinuous, getWatchSyncState, setSkinTempContinuous, sleepFileSince, SYNC_STATE_VERSION } from '../../services/watchSync'

const hex = (s) => Uint8Array.from(s.trim().split(/\s+/), (h) => parseInt(h, 16))
const be = (n, size) => Array.from({ length: size }, (_, i) => Math.floor(n / 2 ** (8 * (size - 1 - i))) & 0xff)
/** Bloc 0x17/0x0A synthétique : points [FC, vitesse en dm/s] avec un champ de 2 octets en plus (bit 7, calories) pour vérifier le saut. */
const samplesBlock = (number, block, startSec, stepSec, points, { mask = 0b10000011, size = 5 } = {}) => [
  {
    tag: 0x81,
    value: encodeTlvs([
      { tag: 2, value: be(number, 2) },
      { tag: 3, value: be(block, 2) },
      { tag: 4, value: [...be(number, 2), ...be(block, 2), ...be(startSec, 4), stepSec, ...be(points.length, 2), size, ...be(mask, 2)] },
      { tag: 5, value: points.flatMap(([hr, speed]) => [hr, ...be(speed, 2), 0, 9].slice(0, size)) },
    ]),
  },
]
/** Bloc 0x17/0x0C synthétique : [km, unité, secondes, correction?]. */
const paceBlock = (number, block, rows) => [
  { tag: 0x81, value: encodeTlvs([{ tag: 2, value: be(number, 2) }, { tag: 8, value: be(block, 2) }, ...rows.map(([km, unit, sec, corr]) => ({ tag: 0x83, value: encodeTlvs([{ tag: 4, value: be(km, 2) }, { tag: 5, value: [unit] }, { tag: 6, value: be(sec, 4) }, ...(corr ? [{ tag: 9, value: be(corr, 2) }] : [])]) }))]) },
]

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

  it('octets d’une minute : bits inconnus gardés à part (M4 bis), valeurs nulles ignorées, minute tronquée refusée', () => {
    // masque 1 = 0x01 (inconnu, 2) + 0x02 (pas) + 0x10 (inconnu, 2) + 0x20 (inconnu, 1) + 0x40 (FC) + 0x80
    // masque 2 = 0x04 (inconnu) + 0x01 (SpO₂ = 0 → ignorée)
    expect(parseMinuteBytes([0xf3, 0x05, 0xaa, 0xbb, 0x00, 0x0c, 0x11, 0x22, 0x33, 0x41, 0x00, 0x99])).toEqual({
      steps: 12,
      hr: 0x41,
      unknown: { '1/0x01': 0xaabb, '1/0x10': 0x1122, '1/0x20': 0x33, '2/0x04': 0x99 },
    })
    // bit inconnu à 0 ou 0xFF : pas de mesure, rien de gardé
    expect(parseMinuteBytes([0x30, 0x00, 0x00, 0xff])).toEqual({})
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

  it('bits inconnus des minutes (M4 bis, étages ?) : par jour local, minutes et somme, en nombres seulement', () => {
    const day1 = new Date(2026, 9, 24, 9, 0).getTime()
    const day2 = new Date(2026, 9, 25, 14, 0).getTime()
    const minutes = [
      { t: day1, steps: 40, unknown: { '1/0x10': 3, '1/0x20': 1 } },
      { t: day1 + 60_000, unknown: { '1/0x10': 2 } },
      { t: day1 + 120_000, steps: 10 },
      { t: day2, unknown: { '2/0x04': 7 } },
    ]
    expect(describeUnknownBits(minutes)).toEqual(['24/10 : 1/0x10 2 min Σ 5, 1/0x20 1 min Σ 1', '25/10 : 2/0x04 1 min Σ 7'])
    expect(describeUnknownBits([{ t: day1, steps: 3 }])).toEqual([])
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

  it('journée entière (consigne du 18/10, A.3) : des synchros espacées de 4 h ne laissent aucun trou, la dernière heure vient du total du jour', () => {
    // veille 22:40, puis 11:06, 15:03, 19:30 : chaque fenêtre repart avant la fin de la précédente
    const times = ['2026-10-17T22:40:00Z', '2026-10-18T11:06:00Z', '2026-10-18T15:03:00Z', '2026-10-18T19:30:00Z'].map(Date.parse)
    let lastUntil = Date.parse('2026-10-17T18:00:00Z')
    for (const t of times) {
      const w = syncWindow(lastUntil, t)
      expect(w.since).toBeLessThan(lastUntil) // recouvrement : rien entre deux synchros n'est sauté
      expect(t - w.until).toBeLessThan(3600_000) // seule l'heure entamée attend la synchro suivante…
      lastUntil = w.until
    }
    // … et ses pas sont déjà comptés par le total du jour (depuis minuit), relu à chaque synchro
    const out = totalsEntries({ steps: 5400, kcal: 210 }, times[2])
    expect(out.map((e) => e.payload.value)).toEqual([5400, 210])
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
    expect(report.sync.label).toMatch(/^3 minutes, 1 nuit, 5\u202f400 pas aujourd’hui → (\d+ nouvelles? mesures?|déjà à jour)$/)
    expect(report.sync.firstSync).toBe(true)
    expect(report.sync.kinds).toMatchObject({ steps: 1, steps_jour: 1, heartRate: 2 })
    // tout ce qui suit l'authentification part chiffré
    expect(watch.seen.slice(watch.seen.indexOf('1/8*'))).toEqual([
      '1/8*', '1/5*', '1/2*', '1/3*', '1/49*',
      // fin d'association (§6.12)
      '1/7*', '26/5*', '1/48*', '1/62*', '1/61*', '1/53*', '7/2*', '7/14*', '1/50*', '12/1*', '1/4*', '7/23*', '7/36*',
      '7/12*', '7/13*', '7/10*', '7/11*', '7/11*', '7/3*', '23/7*', '44/1*', '44/6*',
      // stress (M4) : fichier rrisqi vide → ouvert puis refermé
      '44/1*', '44/6*'])
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

  it('M4 bis : les bits inconnus des minutes sont comptés par jour dans le journal, jamais écrits', async () => {
    const now = Date.UTC(2026, 9, 13, 14, 0)
    const start = Math.floor(Date.UTC(2026, 9, 13, 10) / 1000)
    const session = {
      request: async (service, command) => {
        if (command === 0x0a) return { tlvs: [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: [0, 1] }]) }] }
        if (command === 0x0c) return { tlvs: [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: [0, 0] }]) }] }
        // masque 0x12 = pas + inconnu 0x10 (2 octets)
        if (command === 0x0b) return { tlvs: minuteBlock(0, start, [{ offset: 0, bytes: [0x12, 0x00, 0x0a, 0x00, 0x03] }, { offset: 1, bytes: [0x12, 0x00, 0x05, 0x00, 0x04] }]) }
        throw new Error('non pris en charge')
      },
    }
    const logs = []
    const written = []
    const sync = createWatchSync({ watchKey: 'U', storage: memoryStorage(), now: () => now, write: async (e) => (written.push(...e), { inserted: e.length }), clearTotals: async () => 0 })
    await sync(session, { log: (m) => logs.push(m), caps: { services: new Map([[0x17, false], [0x2c, false]]), commands: null } })
    const day = new Date(start * 1000)
    const label = `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`
    expect(logs).toContain(`bits inconnus des minutes (étages ?) ${label} : 1/0x10 2 min Σ 7`)
    expect(JSON.stringify(written)).not.toMatch(/unknown/)
  })

  it('I69 : sommeil sans réponse → les minutes sont quand même lues, l’étape dit où la montre a calé', async () => {
    const now = Date.UTC(2026, 9, 13, 2, 47)
    const start = Math.floor(Date.UTC(2026, 9, 12, 20) / 1000)
    const watch = createFakeWatch({ silentOn: 0x0c, minuteBlocks: [minuteBlock(0, start, [{ offset: 0, bytes: minute(120, 6, 90, 72) }])] })
    const sync = createWatchSync({ watchKey: 'X', storage: memoryStorage(), now: () => now, write: async (e) => ({ inserted: e.length }) })
    const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'X', timeoutMs: 300, bindTimeoutMs: 300, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(report.outcome.code).toBe('connected')
    expect(report.steps.find((s) => s.id === 'sync')).toMatchObject({ status: 'warn', detail: expect.stringMatching(/^1 minute → (\d+ nouvelles? mesures?|déjà à jour) · sans réponse : sommeil$/) })
    expect(report.sync.stalled).toEqual(['sommeil'])
    expect(report.sync.services.map((r) => [r.id, r.outcome, r.count])).toEqual([
      ['sleep', 'timeout', 0], ['minutes', 'ok', 1], ['totals', 'empty', 0], ['workouts', 'empty', 0], ['sleepFile', 'empty', 0], ['stress', 'empty', 0], ['hrvDay', 'unsupported', 0], ['skinTemp', 'unsupported', 0],
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
        workouts: [{ number: 7, body: [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: be(7, 2) }, { tag: 4, value: be(run, 4) }, { tag: 5, value: be(run + 1800, 4) }, { tag: 6, value: be(310, 4) }, { tag: 7, value: be(5200, 4) }, { tag: 8, value: be(4800, 4) }, { tag: 0x0c, value: [96, 171] }, { tag: 0x12, value: be(1750, 4) }, { tag: 0x14, value: [1] }]) }], samples: [samplesBlock(7, 0, run, 30, [[120, 30], [130, 31], [140, 32]]), samplesBlock(7, 1, run + 90, 30, [[150, 33]])], paces: [paceBlock(7, 0, [[1, 0, 330], [2, 0, 318], [3, 0, 300, 5000]])] }],
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
      expect(report.sync.label).toMatch(/1 nuit, 1 séance → (\d+ nouvelles? mesures?|déjà à jour)$/)
      expect(watch.seen).toContain('1/55*')
      expect(watch.seen.filter((x) => x.startsWith('44/4')).length).toBe(Math.ceil(file.length / 64))
      expect(watch.seen.filter((x) => x === '44/4').length).toBe(filePlain ? Math.ceil(file.length / 64) : 0)
      const sleep = written.filter((e) => e.type === 'sleep')
      expect(sleep.map((e) => [e.payload.sleepState, e.payload.durationMinutes])).toEqual([['awake', 10], ['light', 200], ['deep', 90], ['rem', 80], ['awake', 20]])
      expect(sleep.every((e) => e.payload.detail && e.payload.sleepScore === 78)).toBe(true)
      expect(written.find((e) => e.payload.subtype === 'heartRateVariability')).toMatchObject({ at: '2026-10-13T04:40:15.000Z', payload: { value: 38.2, unit: 'ms', during: 'sleep' } })
      expect(written.find((e) => e.type === 'activity').payload).toMatchObject({ workoutType: 'running', durationSeconds: 1750, totalCalories: 310, totalDistanceMeters: 5200, steps: 4800, minHeartRate: 96, maxHeartRate: 171, avgHeartRate: 135, heartRateCurve: { stepSeconds: 60, bpm: [125, 145] }, paceSplitsSecPerKm: [330, 318], endDate: '2026-10-12T17:30:00.000Z' })
      expect(watch.seen.filter((x) => x === '23/10*' || x === '23/12*')).toEqual(['23/10*', '23/10*', '23/12*'])
      expect(cleared).toHaveLength(1)
    }
  })

  it('montre sans séances : 0x17 jamais demandé ; 0x2C jamais interrogé en 1/0x02 mais lu quand même (§10.2)', async () => {
    const watch = createFakeWatch({ unsupported: [0x17, 0x2c] })
    const sync = createWatchSync({ watchKey: 'Y', storage: memoryStorage(), write: async () => ({ inserted: 0 }) })
    const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'Y', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(report.outcome.code).toBe('connected')
    expect(watch.seen.some((x) => x.startsWith('23/'))).toBe(false)
    expect(watch.seen.some((x) => x.startsWith('44/1'))).toBe(true)
    expect(report.sync.capabilities).toMatch(/séances non, fichiers 0x2C non interrogé/)
    expect(report.sync.services.find((r) => r.id === 'sleepFile')).toMatchObject({ outcome: 'empty' })
  })

  it('M2 — VFC de journée par le P2P : ping 0xCA, 2 pages puis page vide, écrite « journée », reprise par classe', async () => {
    const now = Date.UTC(2026, 9, 22, 10, 10)
    const t0 = Date.UTC(2026, 9, 22, 7, 3, 12)
    const rec = (ms, bytes) => ({ start: ms, end: ms + 60_000, values: [[DICT_FIELD.HRV, bytes]] })
    const expand = new Array(30).fill(0)
    expand[29] = 0x08 // 235
    const storage = memoryStorage()
    const run = async (classes, at = now) => {
      const watch = createFakeWatch({ expand, p2p: { classes } })
      const written = []
      const logs = []
      const sync = createWatchSync({ watchKey: 'H', storage, now: () => at, write: async (e) => (written.push(...e), { inserted: e.length }), clear: async () => 0 })
      const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'H', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync, log: (m) => logs.push(m) })
      return { report, written, watch, logs }
    }
    const { report, written, watch } = await run({
      [DICT_CLASS.HRV]: [
        dictionaryPage(DICT_CLASS.HRV, [rec(t0, real8(38.4)), rec(t0 + 3600_000, real4(250))]),
        dictionaryPage(DICT_CLASS.HRV, [rec(t0 + 7200_000, real4(52))]),
      ],
    })
    expect(report.sync.capabilities).toMatch(/P2P oui/)
    expect(report.sync.services.find((r) => r.id === 'hrvDay')).toMatchObject({ outcome: 'ok', count: 2 })
    expect(watch.p2pRequests).toEqual([
      { cls: 500044, start: 0 },
      { cls: 500044, start: t0 + 3600_000 + 60_000 + 1000 },
      { cls: 500044, start: t0 + 7200_000 + 60_000 + 1000 },
    ])
    const hrv = written.filter((e) => e.payload?.subtype === 'heartRateVariability')
    expect(hrv.map((e) => [e.at, e.payload.value, e.payload.during])).toEqual([
      [new Date(Date.UTC(2026, 9, 22, 7, 3, 35)).toISOString(), 38, 'day'],
      [new Date(Date.UTC(2026, 9, 22, 9, 3, 35)).toISOString(), 52, 'day'],
    ])
    expect(report.sync.label).toMatch(/2 VFC de journée/)
    expect(getWatchSyncState('H', storage).dictUntil).toEqual({ 500044: t0 + 7200_000 + 60_000 })
    // synchro suivante : repart 1 s après la dernière lue
    const second = await run({}, now + 3600_000)
    expect(second.watch.p2pRequests).toEqual([{ cls: 500044, start: t0 + 7200_000 + 61_000 }])
    expect(second.report.sync.services.find((r) => r.id === 'hrvDay')).toMatchObject({ outcome: 'empty' })
    expect(getWatchSyncState('H', storage).dictUntil).toEqual({ 500044: t0 + 7200_000 + 60_000 })
  })

  it('M2 — ping refusé : aucune demande de dictionnaire, « non pris en charge » ; sans capacité 235 : pas de ping', async () => {
    const expand = new Array(30).fill(0)
    expand[29] = 0x08
    const watch = createFakeWatch({ expand, p2p: { code: 0xcc, classes: { [DICT_CLASS.HRV]: [dictionaryPage(DICT_CLASS.HRV, [])] } } })
    const sync = createWatchSync({ watchKey: 'P', storage: memoryStorage(), write: async () => ({ inserted: 0 }) })
    const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'P', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(report.sync.services.find((r) => r.id === 'hrvDay')).toMatchObject({ outcome: 'unsupported' })
    expect(watch.p2pRequests).toEqual([])
    const noCap = createFakeWatch({ expand: new Array(30).fill(0), p2p: { classes: {} } })
    const sync2 = createWatchSync({ watchKey: 'Q', storage: memoryStorage(), write: async () => ({ inserted: 0 }) })
    const r2 = await connectAndAuthenticate({ transport: noCap.transport, watchKey: 'Q', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync: sync2 })
    expect(r2.sync.services.find((r) => r.id === 'hrvDay')).toMatchObject({ outcome: 'unsupported' })
    expect(noCap.seen.some((x) => x.startsWith('52/'))).toBe(false)
  })

  it('M3 — température de la peau après la VFC : même ping, classe 400012, hors bornes écartée, entrée « peau » et reprise', async () => {
    const now = Date.UTC(2026, 9, 22, 12, 10)
    const t0 = Date.UTC(2026, 9, 22, 1, 20, 40)
    const expand = new Array(30).fill(0)
    expand[29] = 0x08 // 235
    expand[3] = 0x20 // 29
    const storage = memoryStorage()
    const watch = createFakeWatch({
      expand,
      p2p: {
        classes: {
          [DICT_CLASS.HRV]: [dictionaryPage(DICT_CLASS.HRV, [{ start: t0, values: [[DICT_FIELD.HRV, real4(41)]] }])],
          [DICT_CLASS.SKIN_TEMP]: [
            dictionaryPage(DICT_CLASS.SKIN_TEMP, [
              { start: t0, end: t0 + 600_000, values: [[DICT_FIELD.SKIN_TEMP, real8(33.456)]] },
              { start: t0 + 600_000, end: t0 + 1200_000, values: [[DICT_FIELD.SKIN_TEMP, real4(12)]] },
              { start: t0 + 1200_000, end: t0 + 1800_000, values: [[DICT_FIELD.SKIN_TEMP, real4(34.5)]] },
            ]),
          ],
        },
      },
    })
    const written = []
    const sync = createWatchSync({ watchKey: 'T', storage, now: () => now, write: async (e) => (written.push(...e), { inserted: e.length }), clear: async () => 0 })
    const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'T', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(watch.p2pRequests.map((r) => r.cls)).toEqual([500044, 500044, 400012, 400012])
    expect(report.sync.services.find((r) => r.id === 'skinTemp')).toMatchObject({ outcome: 'ok', count: 2, command: '0x34 · 400012' })
    const temps = written.filter((e) => e.type === 'body_temperature')
    expect(temps.map((e) => [e.at, e.payload.valueC, e.payload.subtype, e.payload.site])).toEqual([
      [new Date(Date.UTC(2026, 9, 22, 1, 20)).toISOString(), 33.46, 'skin', 'wrist'],
      [new Date(Date.UTC(2026, 9, 22, 1, 40)).toISOString(), 34.5, 'skin', 'wrist'],
    ])
    expect(temps[0].payload).toMatchObject({ connector: 'huawei_watch', watchClass: 400012 })
    expect(report.log.some((l) => /température de la peau : 2 mesures en 2 pages, 1 écartée \(hors 20–42 °C ou vide\)/.test(l.msg))).toBe(true)
    expect(report.sync.label).toMatch(/2 températures de la peau/)
    expect(getWatchSyncState('T', storage).dictUntil).toEqual({ 500044: t0, 400012: t0 + 1800_000 })
  })

  it('M3 — sans capacité 29 : la température n’est pas demandée, la VFC l’est toujours', async () => {
    const expand = new Array(30).fill(0)
    expand[29] = 0x08
    const watch = createFakeWatch({ expand, p2p: { classes: {} } })
    const sync = createWatchSync({ watchKey: 'U', storage: memoryStorage(), write: async () => ({ inserted: 0 }) })
    const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'U', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(watch.p2pRequests.map((r) => r.cls)).toEqual([500044])
    expect(report.sync.services.find((r) => r.id === 'skinTemp')).toMatchObject({ outcome: 'unsupported' })
  })

  it('M3 — réglage « mesure continue » choisi : envoyé une fois (7/0x2A), puis plus rien tant qu’il ne change pas', async () => {
    const expand = new Array(30).fill(0)
    expand[3] = 0x20
    const storage = memoryStorage()
    setSkinTempContinuous(true, storage)
    expect(getSkinTempContinuous(storage)).toMatchObject({ wanted: true, applied: null })
    const run = async () => {
      const watch = createFakeWatch({ expand })
      const sync = createWatchSync({ watchKey: 'S', storage, write: async () => ({ inserted: 0 }) })
      await connectAndAuthenticate({ transport: watch.transport, watchKey: 'S', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
      return watch
    }
    const first = await run()
    expect(first.seen.filter((x) => x.startsWith('7/42'))).toHaveLength(1)
    expect(first.skinTempSetting).toEqual([1])
    expect(getSkinTempContinuous(storage)).toMatchObject({ wanted: true, applied: true })
    const second = await run()
    expect(second.seen.some((x) => x.startsWith('7/42'))).toBe(false)
    setSkinTempContinuous(false, storage)
    const third = await run()
    expect(third.skinTempSetting).toEqual([0])
    expect(getSkinTempContinuous(storage)).toMatchObject({ wanted: false, applied: false })
  })

  it('M3 — réglage sur une montre sans capacité 29 : rien n’est envoyé, l’état le dit', async () => {
    const storage = memoryStorage()
    setSkinTempContinuous(true, storage)
    const watch = createFakeWatch({ expand: new Array(30).fill(0) })
    const sync = createWatchSync({ watchKey: 'N', storage, write: async () => ({ inserted: 0 }) })
    await connectAndAuthenticate({ transport: watch.transport, watchKey: 'N', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(watch.seen.some((x) => x.startsWith('7/42'))).toBe(false)
    expect(getSkinTempContinuous(storage)).toMatchObject({ wanted: true, applied: null, outcome: 'unsupported' })
  })

  it('M1 — GT 6 Pro (« fichiers 0x2C non », 143 oui) : nuits rattrapées sur 60 jours, respiration et SpO₂ de la nuit écrites, puis reprise', async () => {
    const now = Date.UTC(2026, 9, 22, 8, 10)
    const night = (daysAgo, extra = []) => {
      const bed = Math.floor((Date.UTC(2026, 9, 21, 22) - daysAgo * 86400_000) / 1000)
      return { startSec: bed, endSec: bed + 8 * 3600, fields: [field(SLEEP_FIELD.BED, bed), field(SLEEP_FIELD.VALID, 1), field(SLEEP_FIELD.SCORE, 80), field(SLEEP_FIELD.HRV, 44.5), ...extra], stages: [[240, 1], [120, 3], [100, 2]] }
    }
    const file = sleepSequenceFile([
      night(40),
      night(0, [field(SLEEP_FIELD.RESP_AVG, 13.5), field(SLEEP_FIELD.RESP_MIN, 11), field(SLEEP_FIELD.RESP_MAX, 17), field(SLEEP_FIELD.SPO2_AVG, 96), field(SLEEP_FIELD.SPO2_MIN, 91), field(SLEEP_FIELD.WAKEUPS, 3)]),
      { startSec: Math.floor(Date.UTC(2026, 9, 21, 13) / 1000), endSec: Math.floor(Date.UTC(2026, 9, 21, 14) / 1000), fields: [field(SLEEP_FIELD.VALID, -1)], stages: [[30, 5]] },
    ])
    const expand = new Array(25).fill(0)
    expand[17] = 0x80 // 143
    expand[24] = 0x80 // 199
    const storage = memoryStorage()
    const run = async (at) => {
      const watch = createFakeWatch({ unsupported: [0x2c], files: { sequence_data: file }, expand })
      const written = []
      const sync = createWatchSync({ watchKey: 'G', storage, now: () => at, write: async (e) => (written.push(...e), { inserted: e.length }), clear: async () => 0 })
      const keyStore = createKeyStore(memoryStorage())
      const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'G', timeoutMs: 500, bindTimeoutMs: 500, keyStore, secrets: TEST_SECRETS, sync })
      return { report, written }
    }
    const { report, written } = await run(now)
    expect(report.sync.capabilities).toMatch(/étendues 29 non \/ 56 non \/ 143 oui \/ 199 oui \/ 235 non/)
    expect(report.sync.detailedNights).toBe(3)
    const resp = written.filter((e) => e.type === 'respiratory_rate')
    expect(resp).toHaveLength(1)
    expect(resp[0].payload).toMatchObject({ value: 13.5, unit: 'rpm', during: 'sleep', min: 11, max: 17, connector: 'huawei_watch' })
    const spo2 = written.filter((e) => e.payload.subtype === 'oxygenSaturation' && e.payload.during === 'sleep')
    expect(spo2.map((e) => [e.payload.value, e.payload.min])).toEqual([[96, 91]])
    expect(written.filter((e) => e.payload.subtype === 'heartRateVariability')).toHaveLength(2) // pas la sieste
    const napStages = written.filter((e) => e.type === 'sleep' && e.payload.nap)
    expect(napStages.map((e) => e.payload.sleepState)).toEqual(['asleep'])
    expect(written.find((e) => e.type === 'sleep' && e.payload.wakeups === 3)).toBeTruthy()
    expect(getWatchSyncState('G', storage).sleepFileUntil).toBe(Date.UTC(2026, 9, 22, 8))
    // 1re lecture : 60 jours en arrière ; la suivante, depuis la dernière lecture moins un jour
    expect(sleepFileSince(null, Date.UTC(2026, 9, 21), now)).toBe(now - 60 * 86400_000)
    expect(sleepFileSince({ sleepFileUntil: Date.UTC(2026, 9, 22, 8) }, Date.UTC(2026, 9, 22, 2), now + 3600_000)).toBe(Date.UTC(2026, 9, 21, 2))
  })
})

describe('montre Huawei : stress (M4, fichier rrisqi_data.bin)', () => {
  const memoryStorage = () => {
    const m = new Map()
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
  }

  it('fichier lu par 0x2C type 0x10, écrit en « watch_stress » (pas le stress déclaré), reprise par sa propre date', async () => {
    const now = Date.UTC(2026, 9, 24, 10, 10)
    const s0 = Math.floor(Date.UTC(2026, 9, 24, 8, 2, 30) / 1000)
    const file = stressFile([
      { startSec: s0, endSec: s0 + 300, score: 33, level: 2 },
      { startSec: s0 + 3600, endSec: s0 + 3900, score: 71, level: 3 },
    ])
    const storage = memoryStorage()
    const watch = createFakeWatch({ files: { 'rrisqi_data.bin': file } })
    const written = []
    const sync = createWatchSync({ watchKey: 'S', storage, now: () => now, write: async (e) => (written.push(...e), { inserted: e.length }), clear: async () => 0 })
    const report = await connectAndAuthenticate({ transport: watch.transport, watchKey: 'S', timeoutMs: 500, bindTimeoutMs: 500, keyStore: createKeyStore(memoryStorage()), secrets: TEST_SECRETS, sync })
    expect(report.outcome.code).toBe('connected')
    expect(report.sync.services.find((r) => r.id === 'stress')).toMatchObject({ outcome: 'ok', count: 2, command: '0x2C · 0x10' })
    expect(report.sync.label).toMatch(/2 mesures de stress/)
    const stress = written.filter((e) => e.type === 'watch_stress')
    expect(stress.map((e) => [e.at, e.payload.value, e.payload.level])).toEqual([
      ['2026-10-24T08:02:00.000Z', 33, 2],
      ['2026-10-24T09:02:00.000Z', 71, 3],
    ])
    expect(stress[0].payload).toMatchObject({ unit: 'score', connector: WATCH_SOURCE, endDate: '2026-10-24T08:07:30.000Z' })
    expect(written.some((e) => e.type === 'wellbeing')).toBe(false)
    expect(getWatchSyncState('S', storage).stressFileUntil).toBe(Date.UTC(2026, 9, 24, 10))
  })

  it('stress sauté si la montre n’annonce pas le stress automatique ou si le bit 0x04 de 1/0x31 est baissé', async () => {
    const session = { request: async () => ({ tlvs: [] }), send: async () => {} }
    const until = Date.UTC(2026, 9, 24, 10)
    const off = { services: new Map(), commands: new Map([['32/9', false]]), settings: 0x06 }
    const noBit = { services: new Map(), commands: new Map(), settings: 0x02 }
    for (const caps of [off, noBit]) {
      const data = await readWatchData(session, { since: until - 3600_000, until, caps })
      expect(data.services.find((r) => r.id === 'stress')).toMatchObject({ outcome: 'unsupported' })
      expect(data.stress).toEqual([])
    }
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
    const caps = { services: null, commands: new Map([['7/22', false], ['32/9', false]]) } // pas de TruSleep ni de stress auto : aucun fichier
    const data = await readWatchData(session, { since: Date.UTC(2026, 9, 12), until: Date.UTC(2026, 9, 13), caps })
    expect(data.workouts.map((w) => w.number)).toEqual([8])
    expect(data.services.find((r) => r.id === 'workouts')).toMatchObject({ outcome: 'ok', count: 1, units: 2, failed: 1 })
    expect(data.services.find((r) => r.id === 'sleepFile')).toMatchObject({ outcome: 'unsupported' })
    expect(describeServices(data.services)).toBe('sommeil : vide, minutes : vide, totaux du jour : vide, séances : reçu (1), 1 bloc perdu, sommeil détaillé : non pris en charge, stress : non pris en charge, VFC de journée : non pris en charge, température de la peau : non pris en charge')
  })

  it('pistes : fichiers déclarés mais muets → canal auxiliaire ; pas du jour sans historique ; rien n’aboutit', () => {
    const caps = { services: new Map([[0x2c, true]]) }
    const reads = (outcomes) => Object.entries(outcomes).map(([id, outcome]) => ({ id, outcome }))
    expect(syncHints(reads({ minutes: 'ok', sleepFile: 'timeout' }), { caps })).toEqual([expect.stringMatching(/canal RFCOMM auxiliaire/)])
    expect(syncHints(reads({ minutes: 'ok', sleepFile: 'timeout' }), { caps: null })).toEqual([expect.stringMatching(/canal RFCOMM auxiliaire/)])
    expect(syncHints(reads({ minutes: 'ok', sleepFile: 'timeout' }), { caps: { commands: new Map([['7/22', false]]) } })).toEqual([])
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

  it('séances (M7) : index, demandes, échantillons de FC et vitesse, allures au km', () => {
    const list = [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: [0, 1] }, { tag: 0x85, value: encodeTlvs([{ tag: 6, value: [0, 12] }, { tag: 7, value: [0, 3] }, { tag: 8, value: [0, 1] }]) }]) }]
    expect(parseWorkoutIndex(list)).toEqual([{ number: 12, samples: 3, paces: 1 }])
    expect(decodeTlvs(Uint8Array.from(workoutSamplesTlvs(12, 2)[0].value)).map((t) => [t.tag, Array.from(t.value)])).toEqual([[2, [0, 12]], [3, [0, 2]], [7, []]])
    expect(decodeTlvs(Uint8Array.from(workoutPaceTlvs(12, 1)[0].value)).map((t) => [t.tag, Array.from(t.value)])).toEqual([[2, [0, 12]], [8, [0, 1]]])
    const pts = parseWorkoutSamples(samplesBlock(12, 0, 1000, 5, [[120, 28], [0, 30], [255, 0xffff]]))
    expect(pts).toEqual([{ t: 1_000_000, hr: 120, speed: 2.8 }, { t: 1_005_000, speed: 3 }, { t: 1_010_000 }])
    // FC seule (masque 1, 1 octet par point) ; dernier point incomplet ignoré
    const short = samplesBlock(12, 0, 1000, 5, [[100], [101]], { mask: 1, size: 1 })
    const c = decodeTlvs(Uint8Array.from(short[0].value)).map((t) => (t.tag === 4 ? { ...t, value: Uint8Array.from([...t.value.slice(0, 9), 0, 3, ...t.value.slice(11)]) } : t))
    expect(parseWorkoutSamples([{ tag: 0x81, value: encodeTlvs(c) }]).map((p) => p.hr)).toEqual([100, 101])
    expect(parseWorkoutSamples([{ tag: 0x7f, value: [0, 1, 0x86, 0xa1] }])).toEqual([])
    expect(parseWorkoutPace(paceBlock(12, 0, [[1, 0, 330], [1, 1, 530], [2, 0, 318], [3, 0, 300, 4200]]))).toEqual([{ km: 1, seconds: 330 }, { km: 2, seconds: 318 }])
    expect(heartRateCurve([{ t: 0, hr: 100 }, { t: 30_000, hr: 110 }, { t: 130_000, hr: 130 }], 0)).toEqual({ avg: 113, curve: { stepSeconds: 60, bpm: [105, null, 130] } })
    expect(heartRateCurve([{ t: 0, speed: 3 }], 0)).toBeNull()
    expect(MAX_WORKOUT_BLOCKS).toBeGreaterThan(10)
  })

  it('séances (M7) : un bloc d’échantillons refusé garde la séance et ses totaux', async () => {
    const run = Math.floor(Date.UTC(2026, 9, 12, 17) / 1000)
    const body = [{ tag: 0x81, value: encodeTlvs([{ tag: 2, value: be(8, 2) }, { tag: 4, value: be(run, 4) }, { tag: 5, value: be(run + 1800, 4) }, { tag: 0x14, value: [1] }]) }]
    const session = {
      request: async (service, command) => {
        if (service === 0x17 && command === 0x07) return { tlvs: [{ tag: 0x81, value: encodeTlvs([{ tag: 0x85, value: encodeTlvs([{ tag: 6, value: be(8, 2) }, { tag: 7, value: be(2, 2) }, { tag: 8, value: be(0, 2) }]) }]) }] }
        if (service === 0x17 && command === 0x08) return { tlvs: body }
        if (service === 0x17 && command === 0x0a) throw new Error('Pas de réponse de la montre (23/10) en 8 s')
        if (service === 7) return { tlvs: [{ tag: 0x81, value: [] }] }
        throw new Error('non pris en charge')
      },
    }
    const caps = { services: null, commands: new Map([['7/22', false], ['32/9', false]]) }
    const data = await readWatchData(session, { since: Date.UTC(2026, 9, 12), until: Date.UTC(2026, 9, 13), caps })
    expect(data.workouts).toHaveLength(1)
    expect(data.workouts[0]).not.toHaveProperty('hrAvg')
    expect(data.services.find((r) => r.id === 'workouts')).toMatchObject({ outcome: 'ok', count: 1 })
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

describe('contrôle des pas du jour (capture du 18/10/2026)', () => {
  const now = new Date(2026, 9, 18, 11, 6).getTime()
  const min = (h, m, steps) => ({ t: new Date(2026, 9, 18, h, m).getTime(), steps })
  it('total de la montre ≥ minutes lues depuis minuit : cohérent', () => {
    expect(stepsCheck({ minutes: [min(9, 0, 10), min(10, 0, 4), { t: now - 86_400_000, steps: 500 }], totals: { steps: 14 } }, now)).toEqual({ total: 14, minuteSteps: 14, consistent: true })
  })
  it('total plus petit que les minutes : signalé', () => {
    expect(stepsCheck({ minutes: [min(9, 0, 800)], totals: { steps: 14 } }, now).consistent).toBe(false)
  })
  it('sans total : rien à comparer', () => {
    expect(stepsCheck({ minutes: [], totals: null }, now)).toEqual({ total: null, minuteSteps: 0, consistent: true })
  })
})

