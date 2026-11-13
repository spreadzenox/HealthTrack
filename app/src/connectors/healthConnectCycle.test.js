import { describe, it, expect, vi } from 'vitest'
import { cycleEntriesFromHealthConnect, readCycleEntries, HC_CYCLE_SOURCE } from './healthConnectCycle'
import { cycleByDay } from '../services/cycle'
import { localDateKey } from '../services/analysisEngine'

// Enregistrements synthétiques, au format du pont natif `HealthCycle` (aucune donnée réelle).
const local = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min).toISOString()

const days = (entries) => entries.map((e) => `${localDateKey(e.at)}:${e.payload.flow}`)

describe('cycleEntriesFromHealthConnect', () => {
  it('une période donne un jour de règles par jour local, fin comprise', () => {
    const entries = cycleEntriesFromHealthConnect({
      periods: [{ startTime: local(2026, 11, 3, 8), endTime: local(2026, 11, 6, 20), sourceName: 'Flo' }],
    })
    expect(days(entries)).toEqual(['2026-11-03:unknown', '2026-11-04:unknown', '2026-11-05:unknown', '2026-11-06:unknown'])
    expect(entries[0]).toMatchObject({
      type: 'cycle',
      source: HC_CYCLE_SOURCE,
      payload: { subtype: 'period', flow: 'unknown', connector: 'health_connect', sourceName: 'Flo' },
    })
  })

  it('une période qui finit à minuit pile ne compte pas le jour suivant', () => {
    const entries = cycleEntriesFromHealthConnect({
      periods: [{ startTime: local(2026, 11, 3), endTime: local(2026, 11, 5) }],
    })
    expect(days(entries)).toEqual(['2026-11-03:unknown', '2026-11-04:unknown'])
  })

  it('le flux du jour vient de l’enregistrement de flux (0 inconnu, 1 léger, 2 moyen, 3 abondant)', () => {
    const entries = cycleEntriesFromHealthConnect({
      periods: [{ startTime: local(2026, 11, 3, 8), endTime: local(2026, 11, 5, 20) }],
      flows: [
        { time: local(2026, 11, 3, 9), flow: 2 },
        { time: local(2026, 11, 4, 9), flow: 3 },
        { time: local(2026, 11, 5, 9), flow: 0 },
      ],
    })
    expect(days(entries)).toEqual(['2026-11-03:medium', '2026-11-04:heavy', '2026-11-05:unknown'])
  })

  it('un flux noté sans période est un jour de règles ; plusieurs flux le même jour : le dernier connu', () => {
    const entries = cycleEntriesFromHealthConnect({
      flows: [
        { time: local(2026, 11, 8, 8), flow: 1, sourceName: 'Samsung Health' },
        { time: local(2026, 11, 8, 19), flow: 3, sourceName: 'Samsung Health' },
        { time: local(2026, 11, 8, 22), flow: 0 },
      ],
    })
    expect(days(entries)).toEqual(['2026-11-08:heavy'])
    expect(entries[0].payload.sourceName).toBe('Samsung Health')
  })

  it('une période démesurée ou incohérente est écartée, les autres gardées', () => {
    const entries = cycleEntriesFromHealthConnect({
      periods: [
        { startTime: local(2026, 9, 1), endTime: local(2026, 10, 20) },
        { startTime: local(2026, 11, 6), endTime: local(2026, 11, 3) },
        { startTime: 'pas une date', endTime: local(2026, 11, 3) },
        { startTime: local(2026, 11, 10, 7), endTime: local(2026, 11, 10, 21) },
      ],
      flows: [{ time: 'n’importe quoi', flow: 2 }, { time: local(2026, 11, 12, 9), flow: 9 }],
    })
    expect(days(entries)).toEqual(['2026-11-10:unknown', '2026-11-12:unknown'])
  })

  it('rien à lire : aucune entrée', () => {
    expect(cycleEntriesFromHealthConnect({})).toEqual([])
    expect(cycleEntriesFromHealthConnect(null)).toEqual([])
  })

  it('deux lectures de suite donnent les mêmes dates : l’import ne double rien', () => {
    const raw = { periods: [{ startTime: local(2026, 11, 3, 8), endTime: local(2026, 11, 4, 20) }] }
    expect(cycleEntriesFromHealthConnect(raw).map((e) => e.at)).toEqual(cycleEntriesFromHealthConnect(raw).map((e) => e.at))
  })

  it('le Journal compte les jours de règles importés comme les jours saisis', () => {
    const entries = cycleEntriesFromHealthConnect({
      periods: [{ startTime: local(2026, 11, 3, 8), endTime: local(2026, 11, 5, 20) }],
      flows: [{ time: local(2026, 11, 4, 9), flow: 2 }],
    })
    expect(cycleByDay(entries).get('2026-11-04')).toMatchObject({ period: true, periodDay: 2, cycleDay: 2, flow: 'medium' })
  })
})

describe('readCycleEntries', () => {
  const range = { startDate: '2026-10-14T00:00:00.000Z', endDate: '2026-11-13T00:00:00.000Z' }

  it('sans pont natif (web, iPhone, variante play) : null, rien n’est appelé', async () => {
    expect(await readCycleEntries(null, range)).toBeNull()
    expect(await readCycleEntries({}, range)).toBeNull()
  })

  it('autorisation absente : null, aucune lecture', async () => {
    const bridge = { checkPermission: vi.fn().mockResolvedValue({ granted: false }), read: vi.fn() }
    expect(await readCycleEntries(bridge, range)).toBeNull()
    expect(bridge.read).not.toHaveBeenCalled()
  })

  it('autorisation donnée : lit la fenêtre demandée et rend les entrées', async () => {
    const bridge = {
      checkPermission: vi.fn().mockResolvedValue({ granted: true }),
      read: vi.fn().mockResolvedValue({ periods: [{ startTime: local(2026, 11, 3, 8), endTime: local(2026, 11, 3, 20) }], flows: [] }),
    }
    const entries = await readCycleEntries(bridge, range)
    expect(bridge.read).toHaveBeenCalledWith(range)
    expect(days(entries)).toEqual(['2026-11-03:unknown'])
  })
})
