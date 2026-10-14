import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { generateDemoEntries } from '../../scripts/visual/demoData.mjs'
import { listEntriesForAnalysis, upsertEntries, countAllEntries } from '../storage/localHealthStorage'
import { loadNutritionEntries } from './nutritionData'
import { compareRecentIntake } from './nutritionIntakeCompare'
import { getBodyProfile, getLatestBodyComposition } from './bodyProfile'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  localStorage.clear()
})

describe('loadNutritionEntries', () => {
  it('gives the Nutrition page the same result as reading everything, from a fraction of the base', async () => {
    const now = new Date()
    await upsertEntries(generateDemoEntries({ days: 120, now }))
    const all = await listEntriesForAnalysis()
    const some = await loadNutritionEntries(now)

    const profileAll = await getBodyProfile(all, now)
    const profileSome = await getBodyProfile(some, now)
    expect(profileSome).toEqual(profileAll)
    expect(compareRecentIntake(some, profileSome)).toEqual(compareRecentIntake(all, profileAll))
    expect(getLatestBodyComposition(some)).toEqual(getLatestBodyComposition(all))
    expect(compareRecentIntake(some, profileSome).mealCount).toBeGreaterThan(0)
    expect(some.length).toBeLessThan((await countAllEntries()) / 4)
  })

  it('keeps an old weight and height but skips old meals and steps', async () => {
    const now = new Date('2026-10-14T12:00:00')
    await upsertEntries([
      { type: 'weight', source: 'manual', at: '2024-01-01T08:00:00.000Z', payload: { valueKg: 80 } },
      { type: 'height', source: 'manual', at: '2023-01-01T08:00:00.000Z', payload: { valueCm: 180 } },
      { type: 'food', source: 'manual', at: '2026-09-01T12:00:00.000Z', payload: { items: [] } },
      { type: 'food', source: 'manual', at: '2026-10-13T12:00:00.000Z', payload: { items: [] } },
      { type: 'steps', source: 'w', at: '2026-09-01T12:00:00.000Z', payload: { value: 10 } },
      { type: 'steps', source: 'w', at: '2026-10-10T12:00:00.000Z', payload: { value: 10 } },
      { type: 'heart_rate', source: 'w', at: '2026-10-13T12:00:00.000Z', payload: { bpm: 60 } },
    ])
    const got = (await loadNutritionEntries(now)).map((e) => `${e.type} ${e.at.slice(0, 10)}`).sort()
    expect(got).toEqual(['food 2026-10-13', 'height 2023-01-01', 'steps 2026-10-10', 'weight 2024-01-01'])
  })
})
