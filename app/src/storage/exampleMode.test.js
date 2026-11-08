import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { createEntry, countAllEntries, exportToJson, listEntries, listEntriesForAnalysis, upsertEntries } from './localHealthStorage'
import { enterExampleMode, exitExampleMode, isExampleMode } from './exampleMode'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
afterEach(() => exitExampleMode())

const fake = [
  { type: 'wellbeing', source: 'app_wellbeing', at: '2026-11-07T10:00:00.000Z', payload: { score: 7 } },
  { type: 'steps', source: 'health_connect', at: '2026-11-07T12:00:00.000Z', payload: { count: 9000 } },
]
const snapshot = async () => JSON.parse(await exportToJson()).entries

describe('mode exemple de la visite guidée (ACC-8)', () => {
  it('les écrans lisent les données fictives ; la base de la personne est identique avant et après', async () => {
    await createEntry({ type: 'wellbeing', source: 'app_wellbeing', at: '2026-11-01T10:00:00.000Z', payload: { score: 4 } })
    const before = await snapshot()
    enterExampleMode(fake)
    expect(isExampleMode()).toBe(true)
    expect((await listEntries({ type: 'wellbeing' })).map((e) => e.payload.score)).toEqual([7])
    expect(await countAllEntries()).toBe(2)
    expect((await listEntriesForAnalysis()).every((e) => String(e.id).startsWith('exemple-'))).toBe(true)
    exitExampleMode()
    expect(await snapshot()).toEqual(before)
    expect((await listEntries({ type: 'wellbeing' })).map((e) => e.payload.score)).toEqual([4])
  })

  it('une écriture pendant l’exemple attend la sortie, puis part dans la vraie base', async () => {
    enterExampleMode(fake)
    let done = false
    const write = upsertEntries([{ type: 'steps', source: 'health_connect', at: '2026-11-08T09:00:00.000Z', payload: { count: 120 } }]).then(() => {
      done = true
    })
    await new Promise((r) => setTimeout(r, 20))
    expect(done).toBe(false)
    exitExampleMode()
    await write
    expect((await listEntries({ type: 'steps' })).map((e) => e.payload.count)).toEqual([120])
  })

  it('sortir deux fois ou sans être entré ne casse rien', async () => {
    exitExampleMode()
    exitExampleMode()
    expect(isExampleMode()).toBe(false)
    expect(await countAllEntries()).toBe(0)
  })
})
