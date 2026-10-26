import { describe, it, expect, vi } from 'vitest'
import {
  GUT_DEFAULT_MINUTE,
  gutEveningMinute,
  latestGutDayNote,
  parseGutEvening,
  importPendingGutEvenings,
  syncGutEvening,
  setGutEveningEnabled,
  isGutEveningWanted,
  gutEveningAllowed,
} from './gutEvening'

const memoryStorage = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
}

const NOW = new Date(2026, 9, 26, 9, 0)

/** Note du ventre à l'heure locale donnée, `daysAgo` jours avant NOW ; `day` = bilan du jour. */
const gut = (daysAgo, h, mi = 0, day = true) => {
  const d = new Date(NOW)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, mi, 0, 0)
  return { type: 'gut', source: 'app_gut', at: d.toISOString(), payload: day ? { level: 'calm', scope: 'day' } : { level: 'pain' } }
}

const GUT_GOAL = { goal: 'gut' }

const fakePlugin = (extra = {}) => ({
  configure: vi.fn(async (o) => ({ enabled: !!o.enabled, notifications: true, minuteOfDay: o.minuteOfDay })),
  requestNotifications: vi.fn(async () => ({ asked: true, notifications: true })),
  ...extra,
})

describe('gutEveningMinute', () => {
  it('20 h sans assez de bilans du soir', () => {
    expect(gutEveningMinute([], NOW)).toBe(GUT_DEFAULT_MINUTE)
    expect(gutEveningMinute([gut(1, 22), gut(2, 22)], NOW)).toBe(GUT_DEFAULT_MINUTE)
  })

  it('médiane des bilans ; les notes horodatées ne comptent pas', () => {
    const entries = [gut(1, 21, 30), gut(2, 21, 50), gut(3, 22, 10), gut(1, 23, 0, false), gut(2, 23, 0, false)]
    expect(gutEveningMinute(entries, NOW)).toBe(21 * 60 + 50)
  })
})

describe('latestGutDayNote', () => {
  it('jour du bilan le plus récent, pas de la dernière note horodatée', () => {
    expect(latestGutDayNote([gut(2, 21), gut(0, 8, 0, false)])).toBe('2026-10-24')
    expect(latestGutDayNote([gut(0, 8, 0, false)])).toBeNull()
  })
})

describe('parseGutEvening', () => {
  it('un bilan du jour de même forme que le geste de la carte', () => {
    const at = new Date(2026, 9, 25, 20, 5).getTime()
    expect(parseGutEvening(JSON.stringify({ v: 1, level: 'discomfort', at }))).toEqual({
      type: 'gut',
      source: 'app_gut',
      at: new Date(at).toISOString(),
      payload: { level: 'discomfort', scope: 'day' },
    })
  })

  it('refuse un JSON abîmé, une version inconnue ou un niveau hors liste', () => {
    expect(parseGutEvening('{')).toBeNull()
    expect(parseGutEvening(JSON.stringify({ v: 2, level: 'calm', at: 1 }))).toBeNull()
    expect(parseGutEvening(JSON.stringify({ v: 1, level: 'terrible', at: 1 }))).toBeNull()
    expect(parseGutEvening(JSON.stringify({ v: 1, level: 'calm', at: -5 }))).toBeNull()
  })
})

describe('importPendingGutEvenings', () => {
  it('écrit les bilans lisibles et vide la boîte (illisibles comprises)', async () => {
    const at = new Date(2026, 9, 25, 20, 5).getTime()
    const plugin = {
      list: async () => ({ notes: [{ name: 'a', json: JSON.stringify({ v: 1, level: 'pain', at }) }, { name: 'b', json: 'x' }] }),
      remove: vi.fn(async () => ({ removed: 2 })),
    }
    const write = vi.fn(async (e) => ({ inserted: e.length }))
    const onInserted = vi.fn()
    const out = await importPendingGutEvenings({ plugin, write, onInserted })
    expect(write.mock.calls[0][0][0].payload).toEqual({ level: 'pain', scope: 'day' })
    expect(plugin.remove).toHaveBeenCalledWith({ names: ['a', 'b'] })
    expect(out).toMatchObject({ imported: 1, inserted: 1, dropped: 1 })
    expect(onInserted).toHaveBeenCalled()
  })

  it('garde les bilans si l\'écriture échoue', async () => {
    const plugin = { list: async () => ({ notes: [{ name: 'a', json: JSON.stringify({ v: 1, level: 'calm', at: 5 }) }] }), remove: vi.fn() }
    const out = await importPendingGutEvenings({ plugin, write: async () => { throw new Error('idb') } })
    expect(out.kept).toBe(1)
    expect(plugin.remove).not.toHaveBeenCalled()
  })
})

describe('syncGutEvening / setGutEveningEnabled', () => {
  it('éteint par défaut : rien n\'est programmé sans le choix de la personne', async () => {
    const plugin = fakePlugin()
    await syncGutEvening({ plugin, list: async () => [], now: NOW, storage: memoryStorage(), onboarding: GUT_GOAL })
    expect(plugin.configure).toHaveBeenCalledWith({ enabled: false })
  })

  it('allumer demande les notifications et transmet heure et dernier bilan', async () => {
    const plugin = fakePlugin()
    const storage = memoryStorage()
    const list = async () => [gut(1, 21), gut(2, 21), gut(3, 21)]
    const res = await setGutEveningEnabled(true, { plugin, list, now: NOW, storage, onboarding: GUT_GOAL })
    expect(plugin.requestNotifications).toHaveBeenCalled()
    expect(plugin.configure).toHaveBeenLastCalledWith({ enabled: true, minuteOfDay: 21 * 60, noteDay: '2026-10-25' })
    expect(res).toEqual({ enabled: true, notifications: true, blocked: false })
    expect(isGutEveningWanted(storage)).toBe(true)
  })

  it('sans carte ventre (autre objectif) : éteint côté natif, le choix est gardé', async () => {
    const plugin = fakePlugin()
    const storage = memoryStorage()
    await setGutEveningEnabled(true, { plugin, list: async () => [], now: NOW, storage, onboarding: GUT_GOAL })
    await syncGutEvening({ plugin, list: async () => [], now: NOW, storage, onboarding: { goal: 'energy' } })
    expect(plugin.configure).toHaveBeenLastCalledWith({ enabled: false })
    expect(isGutEveningWanted(storage)).toBe(true)
    expect(gutEveningAllowed({ goal: 'energy' })).toBe(false)
    expect(gutEveningAllowed({ goal: 'gut' })).toBe(true)
  })

  it('notifications refusées pour de bon : signalé', async () => {
    const plugin = fakePlugin({
      configure: vi.fn(async (o) => ({ enabled: !!o.enabled, notifications: false })),
      requestNotifications: vi.fn(async () => ({ asked: false, notifications: false })),
    })
    const res = await setGutEveningEnabled(true, { plugin, list: async () => [], now: NOW, storage: memoryStorage(), onboarding: GUT_GOAL })
    expect(res.blocked).toBe(true)
  })

  it('hors de l\'app Android : rien', async () => {
    expect(await syncGutEvening({ plugin: null })).toBeNull()
    expect(await setGutEveningEnabled(true, { plugin: null })).toEqual({ enabled: false, notifications: false, blocked: false })
  })
})
