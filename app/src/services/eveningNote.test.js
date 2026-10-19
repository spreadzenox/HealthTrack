import { describe, it, expect, vi } from 'vitest'
import {
  DEFAULT_MINUTE,
  eveningNoteMinute,
  latestNoteDay,
  parseEveningNote,
  importPendingEveningNotes,
  syncEveningNote,
  setEveningNoteEnabled,
  isEveningNoteEnabled,
  formatMinute,
  eveningNoteDiagnostic,
} from './eveningNote'

const memoryStorage = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
}

/** Note saisie à l'heure locale donnée, `daysAgo` jours avant `now`. */
const note = (now, daysAgo, h, mi = 0) => {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, mi, 0, 0)
  return { type: 'wellbeing', source: 'app_wellbeing', at: d.toISOString(), payload: { score: 3 } }
}

const NOW = new Date(2026, 9, 19, 6, 30)

describe('eveningNoteMinute', () => {
  it('21 h sans assez de notes du soir', () => {
    expect(eveningNoteMinute([], NOW)).toBe(DEFAULT_MINUTE)
    expect(eveningNoteMinute([note(NOW, 1, 22), note(NOW, 2, 22)], NOW)).toBe(DEFAULT_MINUTE)
  })

  it('heure médiane des notes du soir des 14 derniers jours', () => {
    const notes = [note(NOW, 1, 22, 10), note(NOW, 2, 21, 40), note(NOW, 3, 22, 30), note(NOW, 4, 9)]
    expect(eveningNoteMinute(notes, NOW)).toBe(22 * 60 + 10)
  })

  it('les notes du matin et les vieilles notes ne déplacent pas le soir', () => {
    const notes = [note(NOW, 1, 8), note(NOW, 2, 8), note(NOW, 3, 8), note(NOW, 20, 23), note(NOW, 21, 23), note(NOW, 22, 23)]
    expect(eveningNoteMinute(notes, NOW)).toBe(DEFAULT_MINUTE)
  })

  it('reste entre 18 h et 23 h', () => {
    const late = [note(NOW, 1, 23, 50), note(NOW, 2, 23, 55), note(NOW, 3, 23, 45)]
    expect(eveningNoteMinute(late, NOW)).toBe(23 * 60)
    const early = [note(NOW, 1, 17, 5), note(NOW, 2, 17, 10), note(NOW, 3, 17, 15)]
    expect(eveningNoteMinute(early, NOW)).toBe(18 * 60)
  })
})

describe('latestNoteDay', () => {
  it('jour local de la note la plus récente', () => {
    expect(latestNoteDay([note(NOW, 3, 21), note(NOW, 0, 0, 10), note(NOW, 1, 22)])).toBe('2026-10-19')
    expect(latestNoteDay([])).toBeNull()
  })
})

describe('parseEveningNote', () => {
  const AT = Date.UTC(2026, 9, 18, 19, 41)
  it('même forme qu’une note saisie, à l’heure du geste', () => {
    expect(parseEveningNote(JSON.stringify({ v: 1, score: 4, at: AT }))).toEqual({
      type: 'wellbeing',
      source: 'app_wellbeing',
      at: new Date(AT).toISOString(),
      payload: { score: 4 },
    })
    expect(parseEveningNote(JSON.stringify({ v: 1, score: 0, at: AT }))?.payload).toEqual({ score: 0 })
  })

  it('refuse ce qui n’est pas une note de l’échelle', () => {
    for (const bad of ['{', '{"v":2,"score":3,"at":1}', '{"v":1,"score":6,"at":1}', '{"v":1,"score":2.5,"at":1}',
      '{"v":1,"score":3}', '{"v":1,"score":3,"at":-5}', 'null']) {
      expect(parseEveningNote(bad)).toBeNull()
    }
  })
})

const item = (name, rec) => ({ name, json: typeof rec === 'string' ? rec : JSON.stringify(rec) })

describe('importPendingEveningNotes', () => {
  it('range les notes sans doublon puis les retire de la boîte native', async () => {
    const plugin = {
      list: vi.fn(async () => ({ notes: [item('capture-1-001.json', { v: 1, score: 4, at: 1760816460000 }), item('capture-2-001.json', 'oops')] })),
      remove: vi.fn(async () => ({ removed: 2 })),
    }
    const write = vi.fn(async (entries) => ({ inserted: entries.length }))
    const onInserted = vi.fn()
    const out = await importPendingEveningNotes({ plugin, write, onInserted })
    expect(write).toHaveBeenCalledWith([expect.objectContaining({ type: 'wellbeing', payload: { score: 4 } })])
    expect(plugin.remove).toHaveBeenCalledWith({ names: ['capture-1-001.json', 'capture-2-001.json'] })
    expect(out).toEqual({ imported: 1, inserted: 1, dropped: 1, kept: 0 })
    expect(onInserted).toHaveBeenCalledTimes(1)
  })

  it('une écriture qui échoue garde les notes pour la prochaine ouverture', async () => {
    const plugin = { list: async () => ({ notes: [item('capture-1-001.json', { v: 1, score: 2, at: 1 })] }), remove: vi.fn() }
    const out = await importPendingEveningNotes({ plugin, write: async () => { throw new Error('idb') } })
    expect(out.kept).toBe(1)
    expect(plugin.remove).not.toHaveBeenCalled()
  })

  it('rien hors de l’app Android ; ne lève jamais', async () => {
    expect(await importPendingEveningNotes({ plugin: null })).toEqual({ imported: 0, inserted: 0, dropped: 0, kept: 0 })
    const out = await importPendingEveningNotes({ plugin: { list: async () => { throw new Error('x') } } })
    expect(out.imported).toBe(0)
  })
})

describe('syncEveningNote', () => {
  it('transmet l’heure apprise et le jour de la dernière note, sans toucher à l’interrupteur', async () => {
    const notes = [note(NOW, 1, 22, 10), note(NOW, 2, 21, 40), note(NOW, 3, 22, 30)]
    const plugin = { configure: vi.fn(async (o) => ({ enabled: true, ...o })) }
    const storage = memoryStorage()
    const list = vi.fn(async () => notes)
    const status = await syncEveningNote({ plugin, list, now: NOW, storage })
    expect(plugin.configure).toHaveBeenCalledWith({ minuteOfDay: 22 * 60 + 10, noteDay: '2026-10-18' })
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ type: 'wellbeing' }))
    expect(status.enabled).toBe(true)
    expect(isEveningNoteEnabled(storage)).toBe(true)
  })

  it('rien hors de l’app Android', async () => {
    expect(await syncEveningNote({ plugin: null })).toBeNull()
  })
})

describe('setEveningNoteEnabled', () => {
  it('allumer demande d’abord l’autorisation des notifications', async () => {
    const calls = []
    const plugin = {
      requestNotifications: vi.fn(async () => { calls.push('ask'); return { asked: true, notifications: false } }),
      configure: vi.fn(async (o) => { calls.push('configure'); return { enabled: o.enabled, notifications: false } }),
    }
    const storage = memoryStorage()
    const res = await setEveningNoteEnabled(true, { plugin, storage, list: async () => [] , now: NOW })
    expect(calls).toEqual(['ask', 'configure'])
    expect(plugin.configure).toHaveBeenCalledWith(expect.objectContaining({ enabled: true, minuteOfDay: DEFAULT_MINUTE }))
    expect(res).toEqual({ enabled: true, notifications: false, blocked: false })
    expect(isEveningNoteEnabled(storage)).toBe(true)
  })

  it('notifications refusées pour de bon : on le dit', async () => {
    const plugin = {
      requestNotifications: async () => ({ asked: false, notifications: false }),
      configure: async (o) => ({ enabled: o.enabled, notifications: false }),
    }
    expect((await setEveningNoteEnabled(true, { plugin, storage: memoryStorage(), list: async () => [] })).blocked).toBe(true)
  })

  it('éteindre ne demande rien', async () => {
    const plugin = { requestNotifications: vi.fn(), configure: vi.fn(async (o) => ({ enabled: o.enabled })) }
    const storage = memoryStorage()
    await setEveningNoteEnabled(false, { plugin, storage })
    expect(plugin.requestNotifications).not.toHaveBeenCalled()
    expect(plugin.configure).toHaveBeenCalledWith({ enabled: false })
    expect(isEveningNoteEnabled(storage)).toBe(false)
  })
})

describe('affichage et diagnostic', () => {
  it('heure en français', () => {
    expect(formatMinute(21 * 60)).toBe('21 h')
    expect(formatMinute(22 * 60 + 5)).toBe('22 h 05')
  })

  it('diagnostic : compteurs et raisons, jamais une note', () => {
    const d = eveningNoteDiagnostic({ enabled: true, minuteOfDay: 1270, nextAt: Date.UTC(2026, 9, 19, 19, 10), notifications: true,
      pending: 1, asked: 3, answers: 2, askedDay: '2026-10-18', noteDay: '2026-10-18', check: 'asked', checkAt: Date.UTC(2026, 9, 18, 19, 12) })
    expect(d).toEqual({
      enabled: true, time: '21 h 10', nextAt: '2026-10-19T19:10:00.000Z', notifications: true, pending: 1,
      asked: 3, answers: 2, lastAskedDay: '2026-10-18', lastCheck: 'asked', lastCheckAt: '2026-10-18T19:12:00.000Z',
      lastError: null,
    })
    expect(JSON.stringify(d)).not.toMatch(/score/)
    expect(eveningNoteDiagnostic(null)).toBeNull()
  })
})
