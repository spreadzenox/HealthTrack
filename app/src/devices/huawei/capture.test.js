import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dataFromCapture, isValidCapture } from './capture'
import { readWatchData, totalsEntries, watchEntries } from './sync'
import { READ_WINDOW, readWatchOptions } from './testing/sampleBlocks'
import { field, sleepSequenceFile, stressFile } from './testing/sampleFiles'
import { parseSleepSequence, parseStressFile, SLEEP_FIELD } from './files'
import { dictionaryPage, real4, real8 } from './testing/sampleDictionary'
import { DICT_CLASS, DICT_FIELD } from './p2p'
import { encodeTlvs } from './protocol'
import { paceBlock, runTotals, samplesBlock } from './testing/sampleWorkouts'

const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

const VECTORS = resolve(dirname(fileURLToPath(import.meta.url)), '../../../android/app/src/test/resources/huawei/link-vectors.json')
/** La capture que WatchReader.java produit face à la fausse GT 6 Pro (vérifié par WatchReaderTest). */
const javaCapture = () => JSON.parse(readFileSync(VECTORS, 'utf8')).read.capture

/** Session en clair qui répond aux lectures santé comme la fausse montre (séances vides, pas de fichiers). */
function fakeSession({ sleepBlocks = [], minuteBlocks = [], totals }) {
  return {
    async request(service, command, tlvs) {
      const index = () => tlvs[0].value[2] * 256 + tlvs[0].value[3]
      if (service === 1) return { tlvs: [] }
      if (service === 7 && (command === 0x0a || command === 0x0c)) {
        const n = (command === 0x0a ? minuteBlocks : sleepBlocks).length
        return { tlvs: [{ tag: 0x81, value: [2, 2, 0, n] }] }
      }
      if (service === 7 && command === 0x0b) return { tlvs: minuteBlocks[index()] }
      if (service === 7 && command === 0x0d) return { tlvs: sleepBlocks[index()] }
      if (service === 7 && command === 0x03) return { tlvs: totals }
      if (service === 0x17) return { tlvs: [{ tag: 0x81, value: [] }] }
      throw new Error('non pris en charge')
    },
  }
}

describe('captures du client Java « synchro seule »', () => {
  it('la capture du Java donne exactement les mesures de la synchro en direct', async () => {
    const { since, until, at } = READ_WINDOW
    const caps = { services: new Map([[0x2c, false]]), commands: null }
    const live = await readWatchData(fakeSession(readWatchOptions()), { since, until, now: at, caps })
    const fromJava = dataFromCapture(javaCapture())
    expect(fromJava.minutes).toEqual(live.minutes)
    expect(fromJava.sleep).toEqual(live.sleep)
    expect(fromJava.totals).toEqual({ steps: 5400, kcal: 210, distanceM: 3900 })
    expect(fromJava.totals).toEqual(live.totals)
    expect(watchEntries(fromJava, { until })).toEqual(watchEntries(live, { until }))
    expect(totalsEntries(fromJava.totals, at)).toEqual(totalsEntries(live.totals, at))
    expect(fromJava.services.map((s) => [s.id, s.outcome, s.count])).toEqual([
      ['sleep', 'ok', 2],
      ['minutes', 'ok', 4],
      ['totals', 'ok', 1],
    ])
    expect(fromJava.battery).toBe(64)
  })

  it('une réponse illisible est comptée perdue, sans arrêter les autres', () => {
    const c = javaCapture()
    c.replies = c.replies.map((r) => (r.c === 0x0d ? { ...r, hex: '8105FF' } : r))
    const data = dataFromCapture(c)
    expect(data.sleep).toEqual([])
    expect(data.services.find((s) => s.id === 'sleep')).toMatchObject({ outcome: 'error', failed: 1 })
    expect(data.minutes.length).toBe(4)
  })

  it('reprend les issues du Java quand rien n’est arrivé', () => {
    const c = { ...javaCapture(), replies: [], reads: [{ id: 'sleep', outcome: 'timeout', units: 0, failed: 0 }, { id: 'minutes', outcome: 'ok', units: 3, failed: 3 }, { id: 'totals', outcome: 'refused' }] }
    const data = dataFromCapture(c)
    expect(data.services.map((s) => s.outcome)).toEqual(['timeout', 'ok', 'refused'])
    expect(data.services[1]).toMatchObject({ units: 3, failed: 3, count: 0 })
    expect(data.totals).toBeNull()
    expect(data.hints).toEqual([])
  })

  it('refuse une capture qui n’est pas au format v1', () => {
    const ok = javaCapture()
    expect(isValidCapture(ok)).toBe(true)
    for (const bad of [null, { ...ok, v: 2 }, { ...ok, since: ok.until }, { ...ok, at: 'x' }, { ...ok, replies: [{ s: 7, c: 11, i: 0, hex: 'zz' }] }, { ...ok, replies: null }]) {
      expect(isValidCapture(bad)).toBe(false)
    }
    expect(() => dataFromCapture({ v: 1 })).toThrow(/illisible/)
  })

  describe('fichiers 0x2C lus en arrière-plan (M6)', () => {
    const { until } = READ_WINDOW
    const T = Math.floor(until / 1000) - 20 * 3600
    const sleepBytes = sleepSequenceFile([
      { startSec: T, endSec: T + 8 * 3600, fields: [field(SLEEP_FIELD.BED, T + 30), field(SLEEP_FIELD.VALID, 1), field(SLEEP_FIELD.SCORE, 80), field(SLEEP_FIELD.HRV, 44)], stages: [[20, 4], [200, 1], [60, 3], [80, 2]] },
    ])
    const stressBytes = stressFile([{ startSec: T + 9 * 3600, endSec: T + 9 * 3600 + 300, score: 31, level: 1 }])
    const withFiles = (extra = {}) => ({
      ...javaCapture(),
      files: [
        { id: 'sleepFile', since: (T - 3600) * 1000, hex: hex(sleepBytes) },
        { id: 'stress', since: (T - 3600) * 1000, hex: hex(stressBytes) },
      ],
      reads: [...javaCapture().reads, { id: 'sleepFile', outcome: 'ok', units: sleepBytes.length, failed: 0 }, { id: 'stress', outcome: 'ok', units: stressBytes.length, failed: 0 }],
      ...extra,
    })

    it('nuits détaillées et stress décodés comme la synchro en direct', () => {
      const data = dataFromCapture(withFiles())
      expect(data.nights).toEqual(parseSleepSequence(sleepBytes))
      expect(data.nights[0]).toMatchObject({ score: 80, hrvMs: 44 })
      expect(data.stress).toEqual(parseStressFile(stressBytes))
      expect(data.services.find((s) => s.id === 'sleepFile')).toMatchObject({ outcome: 'ok', count: 1 })
      expect(data.services.find((s) => s.id === 'stress')).toMatchObject({ outcome: 'ok', count: 1 })
      expect(data.capabilities).toMatch(/fichiers/)
      const entries = watchEntries(data, { until })
      expect(entries.some((e) => e.type === 'watch_stress' && e.payload.value === 31)).toBe(true)
      expect(entries.some((e) => e.type === 'sleep' && e.payload.sleepScore === 80)).toBe(true)
      expect(entries.some((e) => e.payload.subtype === 'heartRateVariability' && e.payload.during === 'sleep' && e.payload.value === 44)).toBe(true)
    })

    it('coucher non annoncé (bedTime faux) : départ à l’endormissement, comme readWatchData', () => {
      expect(dataFromCapture(withFiles({ bedTime: false })).nights).toEqual(parseSleepSequence(sleepBytes, { bedTime: false }))
    })

    it('fichier vide, sans réponse ou illisible : consigné, sans bloquer le reste', () => {
      const c = withFiles({
        files: [{ id: 'sleepFile', since: (T - 3600) * 1000, hex: 'ff' }],
        reads: [...javaCapture().reads, { id: 'sleepFile', outcome: 'ok' }, { id: 'stress', outcome: 'timeout' }],
      })
      const data = dataFromCapture(c)
      expect(data.nights).toEqual([])
      expect(data.services.find((s) => s.id === 'sleepFile').outcome).toMatch(/^(empty|error)$/)
      expect(data.services.find((s) => s.id === 'stress')).toMatchObject({ outcome: 'timeout', count: 0 })
      expect(data.minutes.length).toBe(4)
      // sans lecture de fichier demandée : aucune ligne en plus
      expect(dataFromCapture(javaCapture()).services.map((s) => s.id)).toEqual(['sleep', 'minutes', 'totals'])
      expect(isValidCapture({ ...javaCapture(), files: [{ id: 'stress', since: 1, hex: 'zz' }] })).toBe(false)
    })
  })

  describe('dictionnaire P2P lu en arrière-plan (M6b)', () => {
    const t0 = READ_WINDOW.since + 3600_000
    const hrvPage = dictionaryPage(DICT_CLASS.HRV, [
      { start: t0, end: t0 + 60_000, values: [[DICT_FIELD.HRV, real8(41.6)]] },
      { start: t0 + 3600_000, end: t0 + 3660_000, values: [[DICT_FIELD.HRV, real8(250)]] }, // hors bornes
    ])
    const tempPage = dictionaryPage(DICT_CLASS.SKIN_TEMP, [{ start: t0, end: t0 + 60_000, values: [[DICT_FIELD.SKIN_TEMP, real4(33.25)]] }])
    const withDict = (extra = {}) => ({
      ...javaCapture(),
      dict: [
        { id: 'hrvDay', cls: DICT_CLASS.HRV, since: 1000, max: t0 + 3660_000, pages: [hex(hrvPage)] },
        { id: 'skinTemp', cls: DICT_CLASS.SKIN_TEMP, since: 1000, max: t0 + 60_000, pages: [hex(tempPage)] },
      ],
      reads: [...javaCapture().reads, { id: 'hrvDay', outcome: 'ok', units: 1, failed: 0 }, { id: 'skinTemp', outcome: 'ok', units: 1, failed: 0 }],
      ...extra,
    })

    it('VFC de journée et température décodées comme la synchro en direct, reprise par classe', () => {
      const data = dataFromCapture(withDict())
      expect(data.hrvDay).toEqual([{ start: t0, value: 42 }])
      expect(data.skinTemp).toEqual([{ start: t0, value: 33.25 }])
      // reprise : la page entière compte, y compris la valeur écartée (comme readClass)
      expect(data.dictionary).toEqual({ [DICT_CLASS.HRV]: t0 + 3660_000, [DICT_CLASS.SKIN_TEMP]: t0 + 60_000 })
      expect(data.services.find((s) => s.id === 'hrvDay')).toMatchObject({ outcome: 'ok', count: 1, units: 1 })
      expect(data.capabilities).toMatch(/dictionnaire/)
      const entries = watchEntries(data, { until: READ_WINDOW.until })
      expect(entries.some((e) => e.payload.subtype === 'heartRateVariability' && e.payload.during === 'day' && e.payload.value === 42)).toBe(true)
      expect(entries.some((e) => e.type === 'body_temperature' && e.payload.subtype === 'skin')).toBe(true)
    })

    it('ping refusé, silence ou page illisible : consigné sans bloquer ; capture sans dictionnaire inchangée', () => {
      const data = dataFromCapture(
        withDict({
          dict: [{ id: 'hrvDay', cls: DICT_CLASS.HRV, since: 1000, max: 0, pages: ['01ff'] }],
          reads: [...javaCapture().reads, { id: 'hrvDay', outcome: 'ok', units: 1 }, { id: 'skinTemp', outcome: 'unsupported' }],
        }),
      )
      expect(data.hrvDay).toEqual([])
      expect(data.services.find((s) => s.id === 'hrvDay')).toMatchObject({ outcome: 'error', failed: 1 })
      expect(data.services.find((s) => s.id === 'skinTemp')).toMatchObject({ outcome: 'unsupported', count: 0 })
      expect(data.minutes.length).toBe(4)
      const plain = dataFromCapture(javaCapture())
      expect(plain.hrvDay).toEqual([])
      expect(plain.dictionary).toEqual({})
      expect(plain.services.map((s) => s.id)).toEqual(['sleep', 'minutes', 'totals'])
      expect(isValidCapture({ ...javaCapture(), dict: [{ id: 'hrvDay', cls: DICT_CLASS.HRV, pages: ['zz'] }] })).toBe(false)
    })
  })

  describe('séances lues en arrière-plan (M7b)', () => {
    const run = Math.floor((READ_WINDOW.since + 3600_000) / 1000)
    const old = Math.floor((READ_WINDOW.since - 3 * 24 * 3600_000) / 1000)
    const reply = (c, i, tlvs) => ({ s: 0x17, c, i, hex: hex(encodeTlvs(tlvs)) })
    // même ordre que WatchReader.workouts : liste, totaux, échantillons et allures de la séance (index = son numéro)
    const withWorkouts = (replies, read = { id: 'workouts', outcome: 'ok', units: 2, failed: 0 }) => ({
      ...javaCapture(),
      replies: [...javaCapture().replies, ...replies],
      reads: [...javaCapture().reads, read],
    })

    it('FC moyenne, courbe et allures assemblées comme la synchro en direct ; séance hors période écartée', () => {
      const data = dataFromCapture(
        withWorkouts([
          reply(0x07, -1, [{ tag: 0x81, value: [] }]),
          reply(0x08, 7, runTotals(7, run)),
          reply(0x0a, 7, samplesBlock(7, 0, run, 30, [[120, 30], [130, 31], [140, 32]])),
          reply(0x0a, 7, samplesBlock(7, 1, run + 90, 30, [[150, 33]])),
          reply(0x0c, 7, paceBlock(7, 0, [[2, 0, 318], [1, 0, 330], [3, 0, 300, 5000]])),
          reply(0x08, 9, runTotals(9, old)),
        ]),
      )
      expect(data.workouts).toHaveLength(1)
      expect(data.workouts[0]).toMatchObject({ number: 7, sport: 'running', kcal: 310, hrMin: 96, hrMax: 171, hrAvg: 135, hrCurve: { stepSeconds: 60, bpm: [125, 145] }, paceSplits: [330, 318] })
      expect(data.services.find((s) => s.id === 'workouts')).toMatchObject({ outcome: 'ok', count: 1, units: 2 })
      expect(data.capabilities).toMatch(/séances/)
      const activity = watchEntries(data, { until: READ_WINDOW.until }).find((e) => e.type === 'activity')
      expect(activity.payload).toMatchObject({ avgHeartRate: 135, paceSplitsSecPerKm: [330, 318], totalDistanceMeters: 5200 })
    })

    it('bloc illisible compté perdu, séance gardée ; capture sans séances inchangée', () => {
      const data = dataFromCapture(withWorkouts([reply(0x08, 7, runTotals(7, run)), { s: 0x17, c: 0x0a, i: 7, hex: '81ff' }]))
      expect(data.workouts).toHaveLength(1)
      expect(data.workouts[0].hrAvg).toBeUndefined()
      expect(data.services.find((s) => s.id === 'workouts')).toMatchObject({ outcome: 'ok', count: 1, failed: 1 })
      const none = dataFromCapture(withWorkouts([], { id: 'workouts', outcome: 'timeout', units: 0, failed: 0 }))
      expect(none.services.find((s) => s.id === 'workouts')).toMatchObject({ outcome: 'timeout', count: 0 })
      expect(dataFromCapture(javaCapture()).workouts).toEqual([])
    })
  })
})
