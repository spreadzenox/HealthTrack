import { describe, it, expect } from 'vitest'
import { CAPABILITIES, MEASURES, measureStatuses, measuresOf } from './deviceCapabilities'
import { HEALTH_APPS } from './healthApps'

const e = (type, payload = {}) => ({ type, at: '2026-11-01T08:00:00Z', payload: { sourceName: 'com.sec.android.app.shealth', ...payload } })
const statusOf = (res, id) => res.groups.flatMap((g) => g.items).find((i) => i.id === id)

describe('catalogue des mesures par app (ACC-5)', () => {
  it('chaque app du catalogue existe dans healthApps.js, chaque mesure dans MEASURES, chaque raison tient en une ligne', () => {
    const apps = new Set(HEALTH_APPS.map((a) => a.id))
    const ids = new Set(MEASURES.map((m) => m.id))
    for (const [app, measures] of Object.entries(CAPABILITIES)) {
      expect(apps.has(app), app).toBe(true)
      for (const [m, [status, reason]] of Object.entries(measures)) {
        expect(ids.has(m), `${app}.${m}`).toBe(true)
        expect(['x', 'p']).toContain(status)
        expect(reason.length).toBeLessThan(80)
        expect(reason).not.toMatch(/\n/)
      }
    }
  })

  it('measuresOf : pas, sommeil avec phases, sous-types du cœur', () => {
    expect(measuresOf(e('steps'))).toEqual(['steps'])
    expect(measuresOf(e('sleep', { sleepState: 'deep' }))).toEqual(['sleep', 'stages'])
    expect(measuresOf(e('sleep', { sleepState: 'asleep' }))).toEqual(['sleep'])
    expect(measuresOf(e('heart_rate', { subtype: 'heartRateVariability' }))).toEqual(['hrv'])
    expect(measuresOf(e('heart_rate'))).toEqual(['heartRate'])
    expect(measuresOf(e('calories'))).toEqual([])
  })
})

describe('measureStatuses : ce qui est arrivé d’abord, la raison ensuite', () => {
  it('Samsung + Galaxy Watch (maquette) : reçu, pas partagée avec la raison, pas mesuré en une ligne', () => {
    const res = measureStatuses({
      entries: [e('steps'), e('sleep', { sleepState: 'rem' }), e('heart_rate'), e('heart_rate', { subtype: 'oxygenSaturation' })],
    })
    expect(res.groups.map((g) => g.label)).toEqual(['Activité', 'Sommeil', 'Corps'])
    expect(statusOf(res, 'steps').status).toBe('received')
    expect(statusOf(res, 'stages').status).toBe('received')
    expect(statusOf(res, 'hrv')).toMatchObject({ status: 'not_shared', reason: 'votre montre la mesure, Samsung ne la partage avec aucune app' })
    expect(statusOf(res, 'restingHeartRate').status).toBe('not_shared')
    expect(res.notMeasured).toEqual(['Poids', 'Cycle'])
  })

  it('une mesure arrivée l’emporte sur le catalogue (VFC reçue d’une autre app)', () => {
    const res = measureStatuses({ entries: [e('heart_rate', { subtype: 'heartRateVariability', sourceName: 'Oura' })], appIds: ['samsung_health'] })
    expect(statusOf(res, 'hrv').status).toBe('received')
  })

  it('reçu avec une limite connue : « en partie » (Xiaomi, cœur seulement pendant l’effort)', () => {
    const res = measureStatuses({ entries: [e('heart_rate', { sourceName: 'Mi Fitness' })] })
    expect(statusOf(res, 'heartRate')).toMatchObject({ status: 'partial', reason: 'seulement pendant l’effort' })
  })

  it('téléphone seul : seulement les pas, tout le reste en une ligne', () => {
    const res = measureStatuses({ entries: [e('steps', { sourceName: 'Google Fit' })] })
    expect(res.groups).toHaveLength(1)
    expect(res.notMeasured).toHaveLength(MEASURES.length - 1)
  })

  it('montre Huawei à relier : « en partie », en cours chez Halcya', () => {
    const res = measureStatuses({ entries: [], appIds: ['huawei_health'] })
    expect(statusOf(res, 'hrv')).toMatchObject({ status: 'partial', reason: 'en cours chez Halcya' })
  })
})
