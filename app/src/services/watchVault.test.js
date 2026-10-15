import { describe, it, expect, vi } from 'vitest'
import { forgetWatchKey, shareWatchKey, syncVaultAfterConnection } from './watchVault'

const WATCH = { name: 'HUAWEI WATCH GT 6 Pro-1A2', deviceId: 'AA:BB:CC:DD:EE:FF' }
const KEYS = { authId: '0123456789abcdef', authToken: 'ab'.repeat(32), boundAt: '2026-10-14T09:00:00Z' }
const fakeVault = () => ({ store: vi.fn(async () => ({ stored: true })), clear: vi.fn(async () => {}) })

describe('shareWatchKey', () => {
  it('dépose seulement l’adresse, le nom, l’identifiant et la clé', async () => {
    const plugin = fakeVault()
    expect(await shareWatchKey({ watch: WATCH, keys: KEYS, plugin })).toBe('stored')
    expect(plugin.store).toHaveBeenCalledWith({ deviceId: WATCH.deviceId, name: WATCH.name, authId: KEYS.authId, authToken: KEYS.authToken })
  })

  it('rien à déposer sans clé longue durée (premier appairage pas fait)', async () => {
    const plugin = fakeVault()
    expect(await shareWatchKey({ watch: WATCH, keys: { authId: 'x' }, plugin })).toBe('no_key')
    expect(await shareWatchKey({ watch: WATCH, keys: null, plugin })).toBe('no_key')
    expect(plugin.store).not.toHaveBeenCalled()
  })

  it('hors de l’app ou sur une ancienne version sans coffre : « unavailable », jamais d’exception', async () => {
    expect(await shareWatchKey({ watch: WATCH, keys: KEYS, plugin: null })).toBe('unavailable')
    const old = { store: vi.fn(async () => Promise.reject(new Error('"WatchVault" plugin is not implemented on android'))) }
    expect(await shareWatchKey({ watch: WATCH, keys: KEYS, plugin: old })).toBe('unavailable')
    const broken = { store: vi.fn(async () => Promise.reject(new Error('Keystore indisponible'))) }
    expect(await shareWatchKey({ watch: WATCH, keys: KEYS, plugin: broken })).toBe('error')
  })
})

describe('forgetWatchKey', () => {
  it('retire la clé du coffre, sans lever si le natif échoue', async () => {
    const plugin = fakeVault()
    expect(await forgetWatchKey({ deviceId: WATCH.deviceId, plugin })).toBe(true)
    expect(plugin.clear).toHaveBeenCalledWith({ deviceId: WATCH.deviceId })
    expect(await forgetWatchKey({ deviceId: WATCH.deviceId, plugin: { clear: async () => Promise.reject(new Error('x')) } })).toBe(false)
    expect(await forgetWatchKey({ deviceId: WATCH.deviceId, plugin: null })).toBe(false)
  })
})

describe('syncVaultAfterConnection', () => {
  const keyStore = { get: (k) => (k === WATCH.deviceId ? KEYS : null) }

  it('connexion réussie → clé déposée', async () => {
    const plugin = fakeVault()
    expect(await syncVaultAfterConnection({ report: { outcome: { code: 'connected' } }, watch: WATCH, keyStore, plugin })).toBe('stored')
    expect(plugin.store).toHaveBeenCalledTimes(1)
  })

  it('clé refusée par la montre → retirée du coffre (jamais de réappairage en arrière-plan avec une clé morte)', async () => {
    const plugin = fakeVault()
    expect(await syncVaultAfterConnection({ report: { outcome: { code: 'key_rejected' } }, watch: WATCH, keyStore, plugin })).toBe('cleared')
    expect(plugin.clear).toHaveBeenCalledWith({ deviceId: WATCH.deviceId })
    expect(plugin.store).not.toHaveBeenCalled()
  })

  it('montre absente, délai dépassé… → le coffre ne bouge pas', async () => {
    const plugin = fakeVault()
    for (const code of ['failed', 'timeout', 'need_secrets', undefined]) {
      expect(await syncVaultAfterConnection({ report: { outcome: { code } }, watch: WATCH, keyStore, plugin })).toBe(null)
    }
    expect(plugin.store).not.toHaveBeenCalled()
    expect(plugin.clear).not.toHaveBeenCalled()
  })
})
