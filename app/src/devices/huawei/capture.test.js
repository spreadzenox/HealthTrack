import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dataFromCapture, isValidCapture } from './capture'
import { readWatchData, totalsEntries, watchEntries } from './sync'
import { READ_WINDOW, readWatchOptions } from './testing/sampleBlocks'
import { field, sleepSequenceFile, stressFile } from './testing/sampleFiles'
import { parseSleepSequence, parseStressFile, SLEEP_FIELD } from './files'

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
})
