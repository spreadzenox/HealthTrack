import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { fixWatchKcalOnce, planWatchKcalFix } from './watchKcalFix'
import { importFromJson, listEntries, upsertEntries } from '../storage/localHealthStorage'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  localStorage.clear()
})

const h0 = Date.UTC(2026, 9, 26, 8)
const iso = (h) => new Date(h0 + h * 3600_000).toISOString()
const legacy = (h, value) => ({ type: 'calories', source: 'huawei_watch', at: iso(h), payload: { value, unit: 'kcal', endDate: iso(h + 1), connector: 'huawei_watch', sourceName: 'GT 6 Pro' } })

describe('planWatchKcalFix', () => {
  it('convertit les anciennes tranches en kcal et garde la valeur brute', () => {
    const { remove, add } = planWatchKcalFix([{ id: 1, ...legacy(0, 41_164) }])
    expect(remove).toEqual([1])
    expect(add[0]).toMatchObject({ type: 'calories', at: iso(0), payload: { value: 41.2, unit: 'kcal', rawCal: 41_164, sourceName: 'GT 6 Pro', endDate: iso(1) } })
  })

  it('ne touche ni aux tranches converties, ni au total du jour, ni aux pas', () => {
    const entries = [
      { id: 1, ...legacy(0, 41.2), payload: { value: 41.2, rawCal: 41_164 } },
      { id: 2, ...legacy(0, 650), payload: { value: 650, period: 'day' } },
      { id: 3, type: 'steps', source: 'huawei_watch', at: iso(0), payload: { value: 4000 } },
    ]
    expect(planWatchKcalFix(entries)).toEqual({ remove: [], add: [] })
  })
})

describe('fixWatchKcalOnce', () => {
  it('réécrit la base une fois, sans rien perdre ni doubler ; relancé après un import d’un ancien fichier', async () => {
    await upsertEntries([legacy(0, 41_164), legacy(1, 30_000), { type: 'calories', source: 'health_connect', at: iso(0), payload: { value: 120 } }])
    const r = await fixWatchKcalOnce()
    expect(r).toEqual({ removed: 2, added: 2 })
    const cal = (await listEntries({ type: 'calories' })).sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.source < b.source ? -1 : 1))
    expect(cal.map((e) => [e.source, e.payload.value, e.payload.rawCal])).toEqual([
      ['health_connect', 120, undefined],
      ['huawei_watch', 41.2, 41_164],
      ['huawei_watch', 30, 30_000],
    ])
    expect(await fixWatchKcalOnce()).toBeNull()
    // Ancien export réimporté (remplace tout) : les tranches reviennent en petites calories, l'import force la conversion
    await importFromJson(JSON.stringify({ version: 1, entries: [legacy(2, 12_000)] }))
    expect(await fixWatchKcalOnce({ force: true })).toEqual({ removed: 1, added: 1 })
    expect((await listEntries({ type: 'calories' })).map((e) => e.payload.value)).toEqual([12])
  })
})
