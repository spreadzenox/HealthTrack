import { describe, it, expect, vi } from 'vitest'
import {
  FACE_BURST_TYPE,
  FACE_SOURCE,
  parseFaceBurst,
  importPendingFaceBursts,
  moodFaceBursts,
  faceHistorySummary,
  getLastFaceImport,
} from './faceBursts'

const AT = Date.UTC(2026, 9, 19, 7, 12, 3, 250)

/** Ce que FaceRecord.json (Java) écrit pour une rafale. */
const record = (extra = {}) => ({
  v: 1,
  at: AT,
  trigger: 'unlock',
  frames: 3,
  valid: 2,
  values: { smile: 0.4213, duchenne: 0.12, browDown: 0.05, eyeOpen: 0.81, yaw: -4.2 },
  rejected: { too_dark: 1 },
  ms: { camera: 1310, inference: 118 },
  ...extra,
})
const item = (name, rec) => ({ name, json: typeof rec === 'string' ? rec : JSON.stringify(rec) })

const memoryStorage = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
}

describe('parseFaceBurst', () => {
  it('fait une entrée face_burst : heure de la rafale, déclencheur, indices, rejets, temps', () => {
    expect(parseFaceBurst(JSON.stringify(record()))).toEqual({
      type: FACE_BURST_TYPE,
      source: FACE_SOURCE,
      at: new Date(AT).toISOString(),
      payload: {
        v: 1,
        trigger: 'unlock',
        frames: 3,
        valid: 2,
        values: { smile: 0.4213, duchenne: 0.12, browDown: 0.05, eyeOpen: 0.81, yaw: -4.2 },
        rejected: { too_dark: 1 },
        ms: { camera: 1310, inference: 118 },
      },
    })
  })

  it('garde une rafale sans visage (rejets seuls, pour le diagnostic), sans indices', () => {
    const e = parseFaceBurst(JSON.stringify(record({ valid: 0, values: undefined, rejected: { no_face: 3 } })))
    expect(e.payload.valid).toBe(0)
    expect(e.payload.values).toBeUndefined()
    expect(e.payload.rejected).toEqual({ no_face: 3 })
  })

  it('écarte les valeurs non numériques et les champs inconnus', () => {
    const e = parseFaceBurst(JSON.stringify(record({ values: { smile: 0.3, bad: 'x', nul: null }, image: 'AAAA' })))
    expect(e.payload.values).toEqual({ smile: 0.3 })
    expect(e.payload).not.toHaveProperty('image')
  })

  it('refuse ce qui n’est pas une rafale lisible', () => {
    expect(parseFaceBurst('{pas du json')).toBeNull()
    expect(parseFaceBurst(JSON.stringify(record({ v: 2 })))).toBeNull()
    expect(parseFaceBurst(JSON.stringify(record({ at: 'hier' })))).toBeNull()
    expect(parseFaceBurst(JSON.stringify(record({ trigger: '' })))).toBeNull()
    expect(parseFaceBurst(JSON.stringify(record({ valid: -1 })))).toBeNull()
    expect(parseFaceBurst(JSON.stringify(record({ valid: 4 })))).toBeNull()
    expect(parseFaceBurst('null')).toBeNull()
  })
})

describe('importPendingFaceBursts', () => {
  const plugin = (items) => ({
    list: vi.fn(async () => ({ bursts: items })),
    remove: vi.fn(async ({ names }) => ({ removed: names.length })),
  })

  it('écrit les rafales en une fois, puis retire de la boîte les importées et les illisibles', async () => {
    const p = plugin([
      item('capture-1-000.json', record()),
      item('capture-2-000.json', '{abîmé'),
      item('capture-3-000.json', record({ at: AT + 120_000, trigger: 'manual' })),
    ])
    const write = vi.fn(async (entries) => ({ inserted: entries.length, skipped: 0 }))
    const storage = memoryStorage()
    const r = await importPendingFaceBursts({ plugin: p, write, storage, now: new Date(AT + 600_000) })
    expect(write).toHaveBeenCalledTimes(1)
    expect(write.mock.calls[0][0].map((e) => e.payload.trigger)).toEqual(['unlock', 'manual'])
    expect(p.remove).toHaveBeenCalledWith({ names: ['capture-1-000.json', 'capture-2-000.json', 'capture-3-000.json'] })
    expect(r).toEqual({ imported: 2, inserted: 2, dropped: 1, kept: 0 })
    expect(getLastFaceImport(storage)).toMatchObject({ imported: 2, dropped: 1, at: new Date(AT + 600_000).toISOString() })
  })

  it('écriture impossible : tout reste dans la boîte pour la prochaine ouverture (sauf les illisibles)', async () => {
    const p = plugin([item('capture-1-000.json', record()), item('capture-2-000.json', 'x')])
    const write = vi.fn(async () => {
      throw new Error('quota')
    })
    const r = await importPendingFaceBursts({ plugin: p, write, storage: memoryStorage() })
    expect(p.remove).toHaveBeenCalledWith({ names: ['capture-2-000.json'] })
    expect(r).toEqual({ imported: 0, inserted: 0, dropped: 1, kept: 1 })
  })

  it('déjà importée (doublon) : comptée importée et retirée', async () => {
    const p = plugin([item('capture-1-000.json', record())])
    const write = vi.fn(async () => ({ inserted: 0, skipped: 1 }))
    const r = await importPendingFaceBursts({ plugin: p, write, storage: memoryStorage() })
    expect(r).toMatchObject({ imported: 1, inserted: 0 })
    expect(p.remove).toHaveBeenCalled()
  })

  it('hors de l’app, boîte vide ou ancienne version : ne fait rien, ne lève jamais', async () => {
    const write = vi.fn()
    expect(await importPendingFaceBursts({ plugin: null, write })).toEqual({ imported: 0, inserted: 0, dropped: 0, kept: 0 })
    expect(await importPendingFaceBursts({ plugin: plugin([]), write })).toEqual({ imported: 0, inserted: 0, dropped: 0, kept: 0 })
    const broken = { list: vi.fn(async () => { throw new Error('not implemented') }) }
    expect(await importPendingFaceBursts({ plugin: broken, write })).toEqual({ imported: 0, inserted: 0, dropped: 0, kept: 0 })
    expect(write).not.toHaveBeenCalled()
  })

  it('le retrait qui échoue ne fait pas échouer l’import (sans doublon à la prochaine ouverture)', async () => {
    const p = { list: async () => ({ bursts: [item('capture-1-000.json', record())] }), remove: async () => { throw new Error('io') } }
    const r = await importPendingFaceBursts({ plugin: p, write: async (e) => ({ inserted: e.length }), storage: memoryStorage() })
    expect(r.imported).toBe(1)
  })
})

describe('moodFaceBursts (entrées Y de l’humeur, I114)', () => {
  const entry = (trigger, valid = 2, values = { smile: 0.3 }) => ({ type: FACE_BURST_TYPE, at: new Date(AT).toISOString(), payload: { trigger, valid, values } })

  it('ne garde que les rafales du déverrouillage avec au moins une image valide', () => {
    const kept = moodFaceBursts([
      entry('unlock'),
      entry('manual'),
      entry('inUse'),
      entry('unlock', 0, undefined),
      { type: 'wellbeing', at: new Date(AT).toISOString(), payload: { score: 4 } },
    ])
    expect(kept).toHaveLength(1)
    expect(kept[0].payload.trigger).toBe('unlock')
  })
})

describe('faceHistorySummary', () => {
  it('compte les lectures gardées, celles qui comptent pour l’humeur et la première date', () => {
    const at = (h) => new Date(AT + h * 3600_000).toISOString()
    const s = faceHistorySummary([
      { type: FACE_BURST_TYPE, at: at(2), payload: { trigger: 'unlock', valid: 3, values: { smile: 0.1 } } },
      { type: FACE_BURST_TYPE, at: at(0), payload: { trigger: 'unlock', valid: 0 } },
      { type: FACE_BURST_TYPE, at: at(1), payload: { trigger: 'manual', valid: 3, values: { smile: 0.1 } } },
    ])
    expect(s).toEqual({ stored: 3, forMood: 1, firstAt: at(0) })
    expect(faceHistorySummary([])).toEqual({ stored: 0, forMood: 0, firstAt: null })
  })
})
