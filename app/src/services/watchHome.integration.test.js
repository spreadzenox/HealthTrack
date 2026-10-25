/**
 * Montre Huawei → Accueil et export (cahier des charges du 21/10, point e) : une nuit synthétique lue par la
 * montre arrive dans les tuiles Sommeil et VFC nuit avec la source « Montre Huawei », la VFC de journée ne
 * remplace pas celle de la nuit, et l'export JSON rend toutes les entrées de la montre.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { watchEntries } from '../devices/huawei/sync'
import { upsertEntries, exportToJson, importFromJson, listEntries } from '../storage/localHealthStorage'
import { loadJournalEntries } from './journalEntries'
import { buildDailyJournal } from './dailyJournal'
import { localDateKey } from './analysisEngine'
import { measureTiles } from './today'

// Seule l'horloge est figée : les minuteries restent réelles pour IndexedDB
const NOW = new Date(2026, 9, 21, 12, 0)

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

function syntheticWatchData() {
  const bed = new Date(2026, 9, 20, 23, 0).getTime()
  const night = {
    start: bed,
    end: bed + 7 * 3600_000 + 30 * 60_000, // réveil à 6 h 30
    score: 82,
    hrvMs: 47,
    wakeups: 2,
    stages: [
      { start: bed, minutes: 180, stage: 'light' },
      { start: bed + 180 * 60_000, minutes: 90, stage: 'deep' },
      { start: bed + 270 * 60_000, minutes: 180, stage: 'rem' },
    ],
  }
  const hrvDay = [{ start: new Date(2026, 9, 21, 10, 5).getTime(), value: 29 }]
  return { nights: [night], hrvDay }
}

describe('montre Huawei → tuiles de l’Accueil et export', () => {
  it('affiche le sommeil et la VFC de la nuit avec la source « Montre Huawei »', async () => {
    const entries = watchEntries(syntheticWatchData(), { until: NOW.getTime(), sourceName: 'HUAWEI WATCH GT 6 Pro-1A2' })
    await upsertEntries(entries)

    const { entries: read } = await loadJournalEntries(false)
    const today = buildDailyJournal(read).find((d) => d.dateKey === localDateKey(NOW.toISOString()))
    const [sleep, hrv] = measureTiles(today?.summary ?? null, read, NOW)

    expect(sleep).toMatchObject({ label: 'Sommeil', value: '7 h 30', sources: ['Montre Huawei'] })
    // 47 ms (nuit), pas 29 ms (journée)
    expect(hrv).toMatchObject({ label: 'VFC nuit', value: '47 ms', sources: ['Montre Huawei'] })
  })

  it('exporte et réimporte toutes les entrées de la montre', async () => {
    const entries = watchEntries(syntheticWatchData(), { until: NOW.getTime() })
    await upsertEntries(entries)
    const json = await exportToJson()
    const exported = JSON.parse(json).entries.filter((e) => e.source === 'huawei_watch')
    expect(exported).toHaveLength(entries.length)
    expect(exported.some((e) => e.payload?.during === 'sleep' && e.payload?.subtype === 'heartRateVariability')).toBe(true)

    globalThis.indexedDB = new IDBFactory()
    await importFromJson(json)
    const back = await listEntries({ source: 'huawei_watch', limit: Infinity })
    expect(back).toHaveLength(entries.length)
  })
})
