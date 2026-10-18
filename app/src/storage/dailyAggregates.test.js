/**
 * Agrégats journaliers des séries denses (perf D2) : mêmes jours, mêmes valeurs pour le moteur d'analyse
 * que les entrées brutes, tout l'historique, et tenus à jour par chaque écriture.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { buildRecord, recordEntries, seriesOf, DENSE_SERIES } from './dailyAggregates'
import {
  listEntriesForAnalysis,
  countAllEntries,
  createEntry,
  upsertEntries,
  deleteEntry,
  updateEntry,
  listEntries,
  rewriteSourceEntries,
  exportToJson,
  importFromJson,
} from './localHealthStorage'
import { buildDailyDataset } from '../services/analysisEngine'
import { generateDemoEntries } from '../../scripts/visual/demoData.mjs'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

const HOUR = 3600_000
const series = (key) => DENSE_SERIES.find((s) => s.key === key)

// Insertion directe en une transaction (upsertEntries est lent sous fake-indexeddb), sans marquer les
// agrégats : comme une base d'avant la v5, ils doivent être reconstruits à la première analyse
async function addRaw(rows) {
  await countAllEntries()
  const db = await new Promise((res, rej) => {
    const req = indexedDB.open('HealthTrack')
    req.onsuccess = () => res(req.result)
    req.onerror = () => rej(req.error)
  })
  await new Promise((res, rej) => {
    const tx = db.transaction('health_entries', 'readwrite')
    for (const r of rows) tx.objectStore('health_entries').add({ created_at: r.at, ...r })
    tx.oncomplete = res
    tx.onerror = () => rej(tx.error)
  })
  db.close()
}

/** Ce que la montre écrit : pas et calories par heure, FC et SpO₂ par tranche de 10 min. */
function watchDays(days, end = Date.UTC(2026, 9, 17)) {
  const rows = []
  for (let d = 0; d < days; d++) {
    const day = end - (d + 1) * 86400_000
    for (let h = 7; h < 23; h++) {
      const at = day + h * HOUR
      const endDate = new Date(at + HOUR).toISOString()
      rows.push({ type: 'steps', source: 'huawei_watch', at: new Date(at).toISOString(), payload: { value: 100 + h + d, unit: 'count', endDate } })
      rows.push({ type: 'calories', source: 'huawei_watch', at: new Date(at).toISOString(), payload: { value: 20 + h, unit: 'kcal', endDate } })
    }
    for (let s = 0; s < 144; s += 3) {
      const at = new Date(day + s * 600_000).toISOString()
      rows.push({ type: 'heart_rate', source: 'huawei_watch', at, payload: { bpm: 60 + (s % 17) + (d % 5), subtype: 'heartRate', samples: 10 } })
      rows.push({ type: 'heart_rate', source: 'huawei_watch', at: new Date(day + s * 600_000 + 20_000).toISOString(), payload: { value: 94 + (s % 5), subtype: 'oxygenSaturation', samples: 10 } })
    }
  }
  return rows
}

const PICK = ['dateKey', 'steps', 'dailyCaloriesHC', 'avgHR', 'spo2_pct']
const pick = (rows) => rows.map((r) => Object.fromEntries(PICK.map((k) => [k, typeof r[k] === 'number' ? Math.round(r[k] * 1e6) / 1e6 : r[k]])))

describe('buildRecord / recordEntries', () => {
  it('somme les pas par heure et garde les totaux du jour à part', () => {
    const rec = buildRecord(series('steps'), '2026-10-14', [
      { type: 'steps', at: '2026-10-14T08:05:00.000Z', payload: { value: 30 } },
      { type: 'steps', at: '2026-10-14T08:40:00.000Z', payload: { value: 70, endDate: '2026-10-14T08:50:00.000Z' } },
      { type: 'steps', at: '2026-10-14T09:00:00.000Z', payload: { value: 0 } },
      { type: 'steps', at: '2026-10-14T00:00:50.000Z', payload: { value: 5000, period: 'day', endDate: '2026-10-14T20:00:00.000Z' } },
    ])
    const out = recordEntries(rec)
    expect(out).toEqual([
      { type: 'steps', source: 'aggregate', at: '2026-10-14T08:05:00.000Z', payload: { value: 100, endDate: '2026-10-14T08:50:00.000Z' } },
      { type: 'steps', source: 'aggregate', at: '2026-10-14T00:00:50.000Z', payload: { value: 5000, period: 'day', endDate: '2026-10-14T20:00:00.000Z' } },
    ])
  })

  it('FC : moyenne horaire pondérée par le nombre de tranches', () => {
    const rec = buildRecord(series('heart_rate:heartRate'), '2026-10-14', [
      { type: 'heart_rate', at: '2026-10-14T08:00:00.000Z', payload: { bpm: 60, subtype: 'heartRate' } },
      { type: 'heart_rate', at: '2026-10-14T08:10:00.000Z', payload: { value: 90, subtype: 'heartRate' } },
    ])
    const [e] = recordEntries(rec)
    expect(e.payload).toMatchObject({ subtype: 'heartRate', bpm: 75, value: 75, weight: 2 })
  })

  it('seules les séries denses sont agrégées', () => {
    expect(seriesOf({ type: 'steps' })?.key).toBe('steps')
    expect(seriesOf({ type: 'heart_rate', payload: { subtype: 'oxygenSaturation' } })?.key).toBe('heart_rate:oxygenSaturation')
    expect(seriesOf({ type: 'heart_rate', payload: { subtype: 'restingHeartRate' } })).toBeNull()
    expect(seriesOf({ type: 'sleep' })).toBeNull()
  })
})

describe('listEntriesForAnalysis : séries denses depuis les agrégats', () => {
  it("tout l'historique de la montre, mêmes valeurs par jour que les entrées brutes", async () => {
    // Avant : 500 calories (≈ 1 mois de tranches horaires), 2 000 pas, 3 000 FC, 1 500 SpO₂ les plus récentes
    const demo = generateDemoEntries({ days: 60, now: new Date(Date.UTC(2026, 9, 17)) })
    const raw = demo.concat(watchDays(45))
    await addRaw(raw)
    const got = await listEntriesForAnalysis()
    expect(got.length).toBeLessThan(raw.length)
    const opts = { includeDaysWithoutWellbeing: true }
    expect(pick(buildDailyDataset(got, opts))).toEqual(pick(buildDailyDataset(raw, opts)))
  })

  it("avant la note du jour (X avant Y) : une heure finie après la note est écartée, rien de ce qui suit n'entre", async () => {
    const day = '2026-10-14'
    await addRaw([
      { type: 'wellbeing', source: 'app', at: `${day}T12:30:00.000Z`, payload: { score: 4 } },
      { type: 'steps', source: 'w', at: `${day}T11:00:00.000Z`, payload: { value: 300, endDate: `${day}T12:00:00.000Z` } },
      { type: 'steps', source: 'w', at: `${day}T12:10:00.000Z`, payload: { value: 50, endDate: `${day}T12:20:00.000Z` } },
      { type: 'steps', source: 'w', at: `${day}T12:40:00.000Z`, payload: { value: 900, endDate: `${day}T12:50:00.000Z` } },
      { type: 'steps', source: 'w', at: `${day}T15:00:00.000Z`, payload: { value: 2000, endDate: `${day}T16:00:00.000Z` } },
    ])
    const [row] = buildDailyDataset(await listEntriesForAnalysis(), { beforeRating: true })
    expect(row.steps).toBe(300) // l'heure de 12 h, à cheval sur la note, est écartée en entier
  })
})

describe('agrégats tenus à jour par chaque écriture', () => {
  const stepsOn = async (day) =>
    (await listEntriesForAnalysis()).filter((e) => e.type === 'steps' && e.at.startsWith(day)).reduce((a, e) => a + e.payload.value, 0)

  it('création, ajout en lot, modification, suppression, réécriture d\'une source', async () => {
    await createEntry({ type: 'steps', source: 'hc', at: '2026-10-14T08:00:00.000Z', payload: { value: 100 } })
    expect(await stepsOn('2026-10-14')).toBe(100)

    await upsertEntries([{ type: 'steps', source: 'w', at: '2026-10-14T09:00:00.000Z', payload: { value: 50 } }])
    expect(await stepsOn('2026-10-14')).toBe(150)

    const [hc] = await listEntries({ type: 'steps', source: 'hc' })
    await updateEntry(hc.id, { at: '2026-10-15T08:00:00.000Z', payload: { value: 10 } })
    expect(await stepsOn('2026-10-14')).toBe(50)
    expect(await stepsOn('2026-10-15')).toBe(10)

    await deleteEntry(hc.id)
    expect(await stepsOn('2026-10-15')).toBe(0)

    await rewriteSourceEntries('w', (entries) => ({
      remove: entries.map((e) => e.id),
      add: [{ type: 'steps', at: '2026-10-16T09:00:00.000Z', payload: { value: 7 } }],
    }))
    expect(await stepsOn('2026-10-14')).toBe(0)
    expect(await stepsOn('2026-10-16')).toBe(7)
  })

  it('import : remplacement complet puis fusion', async () => {
    await createEntry({ type: 'steps', source: 'hc', at: '2026-10-14T08:00:00.000Z', payload: { value: 100 } })
    const backup = await exportToJson()
    await createEntry({ type: 'steps', source: 'hc', at: '2026-10-14T10:00:00.000Z', payload: { value: 1 } })
    expect(await stepsOn('2026-10-14')).toBe(101)

    await importFromJson(backup)
    expect(await stepsOn('2026-10-14')).toBe(100)

    const other = JSON.stringify({ version: 1, entries: [{ type: 'steps', source: 'old', at: '2026-10-14T11:00:00.000Z', payload: { value: 5 } }] })
    await importFromJson(other, { merge: true })
    expect(await stepsOn('2026-10-14')).toBe(105)
  })
})

describe('migration v4 → v5', () => {
  it('les entrées restent, les agrégats sont construits à la première analyse', async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('HealthTrack', 4)
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore('health_entries', { keyPath: 'id', autoIncrement: true })
        store.createIndex('at', 'at', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('source', 'source', { unique: false })
        store.createIndex('source_at', ['source', 'at'], { unique: false })
        store.createIndex('type_at', ['type', 'at'], { unique: false })
        store.createIndex('type_subtype_at', ['type', 'payload.subtype', 'at'], { unique: false })
        store.add({ type: 'steps', source: 'w', payload: { value: 1200 }, at: '2026-10-01T08:00:00.000Z', created_at: '2026-10-01T08:00:00.000Z' })
        store.add({ type: 'heart_rate', source: 'w', payload: { bpm: 64, subtype: 'heartRate' }, at: '2026-10-01T08:10:00.000Z', created_at: '2026-10-01T08:10:00.000Z' })
      }
      req.onsuccess = () => {
        req.result.close()
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
    const got = await listEntriesForAnalysis()
    expect(got.find((e) => e.type === 'steps').payload.value).toBe(1200)
    expect(got.find((e) => e.type === 'heart_rate').payload.bpm).toBe(64)
    expect(await countAllEntries()).toBe(2)
    expect(JSON.parse(await exportToJson()).entries).toHaveLength(2) // l'export ne contient que les entrées
  })
})
