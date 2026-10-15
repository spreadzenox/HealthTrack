import { describe, it, expect, vi } from 'vitest'
import {
  autoSyncInterval,
  connectBondedWatch,
  describeWatchStatus,
  getWatchAutoSyncState,
  recordWatchConnection,
  syncWatchIfStale,
  WATCH_AUTO_SYNC_MS,
  withWatchLock,
} from './watchAutoSync'
import { connectAndAuthenticate, createKeyStore } from '../devices/huawei/pairing'
import { createFakeWatch, TEST_SECRETS } from '../devices/huawei/testing/fakeWatch'
import { formatAgo } from '../utils/timeAgo'

const memoryStorage = () => {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }
}

const WATCH = { name: 'HUAWEI WATCH GT 6 Pro-1A2', deviceId: 'AA:BB:CC:DD:EE:FF', uuids: [] }
const fakeClassic = (devices = [WATCH]) => ({ listBonded: vi.fn(async () => ({ devices })) })
const report = (code, extra = {}) => ({ outcome: { code, title: `titre ${code}` }, ...extra })
const T0 = Date.UTC(2026, 9, 13, 6, 0)

function paired(storage) {
  const keyStore = createKeyStore(storage)
  keyStore.set(WATCH.deviceId, { authId: 'x', authToken: 'ab'.repeat(32) })
  return keyStore
}

describe('syncWatchIfStale', () => {
  it('ne fait rien hors de l’app Android, sans montre appairée ou sans clé HealthTrack', async () => {
    const storage = memoryStorage()
    const connect = vi.fn()
    expect(await syncWatchIfStale({ classic: null, storage, connect })).toEqual({ ran: false, reason: 'unavailable' })
    expect(await syncWatchIfStale({ classic: fakeClassic([{ name: 'Galaxy Buds', deviceId: '1' }]), storage, connect })).toEqual({ ran: false, reason: 'no_watch' })
    expect(await syncWatchIfStale({ classic: fakeClassic(), storage, connect })).toEqual({ ran: false, reason: 'not_paired' })
    expect(connect).not.toHaveBeenCalled()
  })

  it('Bluetooth coupé (listBonded lève) : aucune exception, nouvel essai plus tard', async () => {
    const classic = { listBonded: async () => Promise.reject(new Error('Bluetooth désactivé')) }
    expect(await syncWatchIfStale({ classic, storage: memoryStorage() })).toEqual({ ran: false, reason: 'error' })
  })

  it('se connecte sans constantes ni réappairage, puis attend 30 min avant de recommencer', async () => {
    const storage = memoryStorage()
    const keyStore = paired(storage)
    let t = T0
    const connect = vi.fn(async (opts) => report('connected', { sync: { label: '12 minutes → 3 mesures', inserted: 3 }, opts }))
    const res = await syncWatchIfStale({ classic: fakeClassic(), storage, keyStore, connect, now: () => t })
    expect(res).toEqual({ ran: true, outcome: 'connected' })
    expect(connect).toHaveBeenCalledTimes(1)
    expect(connect.mock.calls[0][0]).toMatchObject({ watchKey: WATCH.deviceId, secrets: null, rebind: false })
    expect(getWatchAutoSyncState(storage)).toMatchObject({ outcome: 'connected', auto: true, failures: 0, inserted: 3, everConnected: true })

    t = T0 + 29 * 60_000
    expect(await syncWatchIfStale({ classic: fakeClassic(), storage, keyStore, connect, now: () => t })).toEqual({ ran: false, reason: 'recent' })
    t = T0 + 31 * 60_000
    expect((await syncWatchIfStale({ classic: fakeClassic(), storage, keyStore, connect, now: () => t })).ran).toBe(true)
    expect(connect).toHaveBeenCalledTimes(2)
  })

  it('montre hors de portée : les essais s’espacent (30 min → 1 h → 2 h → 4 h au plus)', async () => {
    const storage = memoryStorage()
    const keyStore = paired(storage)
    const connect = vi.fn(async () => report('connect_failed'))
    let t = T0
    const run = () => syncWatchIfStale({ classic: fakeClassic(), storage, keyStore, connect, now: () => t })
    await run()
    expect(getWatchAutoSyncState(storage).failures).toBe(1)
    expect(autoSyncInterval(getWatchAutoSyncState(storage))).toBe(2 * WATCH_AUTO_SYNC_MS)
    t += 45 * 60_000
    expect((await run()).reason).toBe('recent')
    t += 20 * 60_000
    expect((await run()).ran).toBe(true)
    expect(autoSyncInterval({ failures: 9 })).toBe(8 * WATCH_AUTO_SYNC_MS)
  })

  it('clé refusée : pause jusqu’à une connexion manuelle réussie', async () => {
    const storage = memoryStorage()
    const keyStore = paired(storage)
    recordWatchConnection(report('key_rejected'), { auto: true, storage, now: () => T0 })
    const connect = vi.fn(async () => report('connected'))
    expect(await syncWatchIfStale({ classic: fakeClassic(), storage, keyStore, connect, now: () => T0 + 10 * 3600_000 })).toEqual({ ran: false, reason: 'paused' })
    await connectBondedWatch({ classic: fakeClassic(), storage, keyStore, connect })
    expect(getWatchAutoSyncState(storage)).toMatchObject({ outcome: 'connected', auto: false, failures: 0 })
  })

  it('connexion réussie : clé confiée au coffre natif (synchro app fermée) ; clé refusée : retirée', async () => {
    const storage = memoryStorage()
    const keyStore = paired(storage)
    const vault = { store: vi.fn(async () => ({ stored: true })), clear: vi.fn(async () => {}) }
    const ok = await connectBondedWatch({ classic: fakeClassic(), storage, keyStore, vault, connect: vi.fn(async () => report('connected')) })
    expect(ok.nativeKey).toBe('stored')
    expect(vault.store).toHaveBeenCalledWith({ deviceId: WATCH.deviceId, name: WATCH.name, authId: 'x', authToken: 'ab'.repeat(32) })
    const ko = await connectBondedWatch({ classic: fakeClassic(), storage, keyStore, vault, connect: vi.fn(async () => report('key_rejected')) })
    expect(ko.nativeKey).toBe('cleared')
    expect(vault.clear).toHaveBeenCalledWith({ deviceId: WATCH.deviceId })
    // hors de l'app (pas de coffre) : rien de consigné, la connexion n'en souffre pas
    const web = await connectBondedWatch({ classic: fakeClassic(), storage, keyStore, vault: null, connect: vi.fn(async () => report('connected')) })
    expect(web.nativeKey).toBe('unavailable')
  })

  it('une connexion manuelle en cours bloque l’automatique (une seule connexion à la fois)', async () => {
    const storage = memoryStorage()
    const keyStore = paired(storage)
    let release
    const manual = withWatchLock(() => new Promise((r) => (release = r)))
    expect(await syncWatchIfStale({ classic: fakeClassic(), storage, keyStore, connect: vi.fn() })).toEqual({ ran: false, reason: 'busy' })
    release()
    await manual
  })

  it('withWatchLock enchaîne les connexions au lieu de les superposer', async () => {
    const order = []
    let release
    const a = withWatchLock(async () => {
      order.push('a+')
      await new Promise((r) => (release = r))
      order.push('a-')
    })
    const b = withWatchLock(async () => order.push('b'))
    await Promise.resolve()
    release()
    await Promise.all([a, b])
    expect(order).toEqual(['a+', 'a-', 'b'])
  })

  it('de bout en bout avec la fausse montre : la clé du premier appairage suffit ensuite', async () => {
    const storage = memoryStorage()
    const keyStore = createKeyStore(storage)
    const watch = createFakeWatch()
    const sync = vi.fn(async () => ({ label: '0 minute → 0 mesure', inserted: 0 }))
    const viaFake = (opts) => connectAndAuthenticate({ ...opts, transport: watch.transport, timeoutMs: 500, bindTimeoutMs: 500, sync })
    // premier appairage, manuel, avec les constantes
    const first = await connectBondedWatch({ classic: fakeClassic(), storage, keyStore, connect: viaFake, secrets: TEST_SECRETS })
    expect(first.outcome.code).toBe('connected')
    // à l'ouverture suivante de l'app, 1 h plus tard : automatique, sans constantes
    const res = await syncWatchIfStale({ classic: fakeClassic(), storage, keyStore, connect: viaFake, now: () => Date.now() + 3600_000 })
    expect(res).toEqual({ ran: true, outcome: 'connected' })
    expect(sync).toHaveBeenCalledTimes(2)
  })
})

describe('describeWatchStatus', () => {
  const now = T0 + 20 * 60_000
  const at = new Date(T0).toISOString()
  it('rien tant que la montre n’a jamais été connectée', () => {
    expect(describeWatchStatus({}, { now, formatAgo })).toBeNull()
    expect(describeWatchStatus({ at, outcome: 'connect_failed', failures: 1 }, { now, formatAgo })).toBeNull()
  })
  it('connectée (batterie, synchro, mesures), échec avec prochain essai, pause', () => {
    expect(describeWatchStatus({ at, outcome: 'connected', inserted: 12, battery: 84, everConnected: true }, { now, formatAgo })).toEqual({
      tone: 'ok',
      title: 'Connectée',
      text: 'batterie 84 % · synchro il y a moins d’une heure · 12 nouvelles mesures',
    })
    expect(describeWatchStatus({ at, outcome: 'connected', inserted: 0, everConnected: true }, { now, formatAgo }).text).toMatch(/rien de nouveau$/)
    // I69 : la montre a calé sur une lecture → dit à l'écran, ton d'avertissement
    expect(describeWatchStatus({ at, outcome: 'connected', inserted: 0, stalled: ['sommeil', 'minutes'], everConnected: true }, { now, formatAgo })).toMatchObject({
      tone: 'warn',
      title: 'Connectée',
      text: expect.stringMatching(/rien de nouveau · sans réponse de la montre pour : sommeil, minutes$/),
    })
    expect(describeWatchStatus({ at, auto: true, outcome: 'connect_failed', title: 'Connexion à la montre impossible', failures: 2, everConnected: true }, { now, formatAgo })).toMatchObject({
      tone: 'warn',
      text: expect.stringMatching(/^Connexion à la montre impossible .*dans 2 h au plus tôt\.$/),
    })
    expect(describeWatchStatus({ at, outcome: 'key_rejected', title: 'Clé refusée', everConnected: true }, { now, formatAgo }).title).toBe('Synchro en pause')
  })
  it('la batterie lue à la connexion est gardée', () => {
    const storage = memoryStorage()
    expect(recordWatchConnection({ outcome: { code: 'connected' }, battery: 84, sync: { inserted: 3 } }, { storage, now: () => T0 })).toMatchObject({ battery: 84, inserted: 3, stalled: null })
    expect(recordWatchConnection({ outcome: { code: 'connected' }, sync: { inserted: 0, stalled: ['sommeil'] } }, { storage, now: () => T0 }).stalled).toEqual(['sommeil'])
  })
})

describe('syncWatchIfStale — appels simultanés', () => {
  it('deux appels en même temps ne lancent qu’une connexion', async () => {
    const storage = memoryStorage()
    const keyStore = paired(storage)
    const connect = vi.fn(async () => report('connected'))
    const opts = { classic: fakeClassic(), storage, keyStore, connect, now: () => T0 }
    const [a, b] = await Promise.all([syncWatchIfStale(opts), syncWatchIfStale(opts)])
    expect(a).toEqual(b)
    expect(connect).toHaveBeenCalledTimes(1)
  })
})
