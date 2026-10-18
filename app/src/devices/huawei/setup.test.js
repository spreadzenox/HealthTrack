import { describe, it, expect, vi } from 'vitest'
import { setupPlan, lastConnectedAt, observeBond, pairWatch, isWatchBonded, isHuaweiWatchName, normalizeAccountId, loadSetup, saveSetup, RESET_STEPS, RESET_WARNINGS } from './setup'

const HUAWEI = { id: 'huawei_health', name: 'Huawei Health', package: 'com.huawei.health' }
const GARMIN = { id: 'garmin', name: 'Garmin Connect' }
const statuses = (plan) => Object.fromEntries(plan.steps.map((s) => [s.id, s.status]))

describe('assistant de libération de la montre', () => {
  it('Huawei Santé installée → libérer d’abord, puis réinitialiser, appairer, tester', () => {
    const plan = setupPlan({ installed: [HUAWEI, GARMIN], bonded: true, verdict: 'no_answer' })
    expect(plan.path).toBe('free')
    expect(plan.holders.map((a) => a.id)).toEqual(['huawei_health'])
    expect(plan.current).toBe('release')
    expect(statuses(plan)).toEqual({ release: 'current', reset: 'todo', pair: 'todo', test: 'todo' })
  })

  it('app désinstallée mais montre restée liée (diagnostic muet) → réinitialisation demandée', () => {
    const plan = setupPlan({ installed: [GARMIN], bonded: true, verdict: 'no_answer' })
    expect(statuses(plan)).toMatchObject({ release: 'done', reset: 'current' })
  })

  it('« jamais liée à une autre app » : la réinitialisation est sautée', () => {
    const plan = setupPlan({ installed: [], bonded: false, verdict: 'connect_failed', state: { neverLinked: true } })
    expect(statuses(plan)).toEqual({ release: 'done', reset: 'skip', pair: 'current', test: 'todo' })
    // … mais pas tant qu'une app qui peut la tenir est installée
    expect(setupPlan({ installed: [HUAWEI], bonded: false, verdict: 'connect_failed', state: { neverLinked: true } }).steps[1].status).toBe('todo')
  })

  it('après réinitialisation, l’ancien appairage Android ne compte plus', () => {
    const state = { resetAt: '2026-10-13T00:10:00Z' }
    const plan = setupPlan({ installed: [], bonded: true, verdict: 'no_answer', state })
    expect(plan.current).toBe('pair')
    expect(plan.stalePairing).toBe(true)
    const repaired = setupPlan({ installed: [], bonded: true, verdict: 'no_answer', state: { ...state, pairedAt: '2026-10-13T00:15:00Z' } })
    expect(repaired.current).toBe('test')
    expect(repaired.stalePairing).toBe(false)
  })

  it('montre jamais liée à une autre app : pas de réinitialisation, appairage puis test', () => {
    const plan = setupPlan({ installed: [], bonded: false, verdict: 'connect_failed_unpaired' })
    expect(statuses(plan)).toEqual({ release: 'done', reset: 'skip', pair: 'current', test: 'todo' })
    const done = setupPlan({ installed: [], bonded: true, verdict: 'link_ok' })
    expect(done.current).toBeNull()
  })

  it('plan B « garder Huawei Santé » : identifiant de compte, pas de libération ni de réinitialisation', () => {
    const plan = setupPlan({ installed: [HUAWEI], bonded: true, verdict: 'no_answer', state: { choice: 'keep' } })
    expect(plan.path).toBe('keep')
    expect(statuses(plan)).toEqual({ account: 'current', pair: 'done', test: 'todo' })
    const withId = setupPlan({ installed: [HUAWEI], bonded: true, verdict: 'no_answer', state: { choice: 'keep', accountId: '12345678901234567' } })
    expect(withId.current).toBe('test')
  })

  it('Health Sync ne tient pas la montre (elle lit Huawei Santé)', () => {
    const plan = setupPlan({ installed: [{ id: 'health_sync', name: 'Health Sync' }], bonded: false, verdict: null })
    expect(plan.holders).toEqual([])
  })

  it('les textes ne proposent jamais de dissocier la montre dans Huawei Santé', () => {
    const all = [...RESET_STEPS, ...RESET_WARNINGS].join(' ')
    expect(all).toMatch(/Ne dissociez pas/)
    expect(all.replace(/Ne dissociez pas[^.]*\./g, '')).not.toMatch(/dissoci/i)
  })

  it('identifiant de compte Huawei : chiffres seulement', () => {
    expect(normalizeAccountId(' 1234 5678-9012 34567 ')).toBe('12345678901234567')
    expect(normalizeAccountId('abc')).toBeNull()
    expect(normalizeAccountId('123')).toBeNull()
  })

  it('reconnaît les noms de montres Huawei / Honor', () => {
    expect(isHuaweiWatchName('HUAWEI WATCH GT 6 Pro-A1B')).toBe(true)
    expect(isHuaweiWatchName('HONOR Band 9-1C2')).toBe(true)
    expect(isHuaweiWatchName('HUAWEI FreeBuds 5i')).toBe(false)
    expect(isHuaweiWatchName('Voiture')).toBe(false)
  })

  it('appairage refait à la main dans Android après la réinitialisation : reconnu', () => {
    const reset = { resetAt: '2026-10-13T00:10:00Z' }
    expect(observeBond(reset, true, '2026-10-13T00:11:00Z')).toBe(reset)
    const unbonded = observeBond(reset, false)
    expect(unbonded.unbondedSinceReset).toBe(true)
    const repaired = observeBond(unbonded, true, '2026-10-13T00:20:00Z')
    expect(repaired.pairedAt).toBe('2026-10-13T00:20:00Z')
    expect(setupPlan({ installed: [], bonded: true, verdict: 'no_answer', state: repaired }).current).toBe('test')
    expect(observeBond({}, false)).toEqual({})
  })

  it('état gardé en local, illisible → vide', () => {
    const mem = new Map()
    const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) }
    saveSetup({ choice: 'keep' }, storage)
    expect(loadSetup(storage)).toEqual({ choice: 'keep' })
    mem.set('healthtrack_watch_setup', '{oops')
    expect(loadSetup(storage)).toEqual({})
  })
})

describe('appairage Android de la montre', () => {
  const plugin = (over = {}) => ({
    listBonded: vi.fn(async () => ({ devices: [{ deviceId: 'car', name: 'Voiture' }] })),
    discover: vi.fn(async () => ({ devices: [{ deviceId: 'w1', name: 'HUAWEI WATCH GT 6 Pro-A1B', rssi: -60 }, { deviceId: 'b', name: 'HUAWEI FreeBuds', rssi: -40 }] })),
    pair: vi.fn(async () => ({ state: 'bonded' })),
    ...over,
  })

  it('recherche puis demande la liaison de la montre trouvée', async () => {
    const p = plugin()
    const steps = []
    const res = await pairWatch(p, { onProgress: (s) => steps.push(s) })
    expect(res).toEqual({ status: 'bonded', name: 'HUAWEI WATCH GT 6 Pro-A1B' })
    expect(p.pair).toHaveBeenCalledWith({ deviceId: 'w1', timeoutMs: 60_000 })
    expect(steps).toEqual(['search', 'pair'])
  })

  it('déjà appairée → rien à faire ; introuvable ; refusée ; plugin absent', async () => {
    const already = plugin({ listBonded: async () => ({ devices: [{ deviceId: 'w', name: 'HUAWEI WATCH GT 6 Pro-A1B' }] }) })
    expect((await pairWatch(already)).status).toBe('already')
    expect(already.pair).not.toHaveBeenCalled()
    expect((await pairWatch(plugin({ discover: async () => ({ devices: [] }) }))).status).toBe('not_found')
    expect((await pairWatch(plugin({ pair: async () => ({ state: 'none' }) }))).status).toBe('refused')
    expect((await pairWatch(null)).status).toBe('unavailable')
  })

  it('état d’appairage : vrai, faux, ou inconnu', async () => {
    expect(await isWatchBonded({ listBonded: async () => ({ devices: [{ name: 'HUAWEI WATCH GT 6 Pro-A1B' }] }) })).toBe(true)
    expect(await isWatchBonded({ listBonded: async () => ({ devices: [] }) })).toBe(false)
    expect(await isWatchBonded({ listBonded: async () => { throw new Error('x') } })).toBeNull()
    expect(await isWatchBonded(null)).toBeNull()
  })
})

describe('assistant : montre déjà synchronisée par HealthTrack (capture du 18/10/2026)', () => {
  const at = '2026-10-18T09:00:00.000Z'
  it('appairée et synchronisée : toutes les étapes faites, plus d’« Appairer » proposé', () => {
    const plan = setupPlan({ installed: [], bonded: true, verdict: null, state: {}, connectedAt: at })
    expect(plan.connected).toBe(true)
    expect(plan.current).toBeNull()
    expect(plan.steps).toEqual([
      { id: 'release', status: 'done' },
      { id: 'reset', status: 'skip' },
      { id: 'pair', status: 'done' },
      { id: 'test', status: 'done' },
    ])
  })
  it('état d’appairage Android inconnu (lecture lente) : la synchro réussie suffit', () => {
    const plan = setupPlan({ installed: null, bonded: null, verdict: 'timeout', state: {}, connectedAt: at })
    expect(plan.current).toBeNull()
  })
  it('Huawei Santé encore installée mais HealthTrack synchronise : rien à libérer', () => {
    const plan = setupPlan({ installed: [{ id: 'huawei_health', name: 'Huawei Health' }], bonded: true, verdict: null, state: {}, connectedAt: at })
    expect(plan.current).toBeNull()
  })
  it('montre réinitialisée après la dernière synchro : l’assistant reprend', () => {
    const plan = setupPlan({ installed: [], bonded: true, verdict: null, state: { resetAt: '2026-10-18T10:00:00.000Z' }, connectedAt: at })
    expect(plan.connected).toBe(false)
    expect(plan.current).toBe('pair')
  })
  it('montre désappairée d’Android : plus considérée comme prête', () => {
    expect(setupPlan({ installed: [], bonded: false, verdict: null, state: {}, connectedAt: at }).current).toBe('pair')
  })
  it('dernière connexion réussie lue dans l’état de la synchro, anciens états compris', () => {
    expect(lastConnectedAt({ lastConnectedAt: at, outcome: 'failed', at: '2026-10-18T10:00:00.000Z' })).toBe(at)
    expect(lastConnectedAt({ outcome: 'connected', at })).toBe(at)
    expect(lastConnectedAt({ outcome: 'failed', at })).toBeNull()
    expect(lastConnectedAt(null)).toBeNull()
  })
})
