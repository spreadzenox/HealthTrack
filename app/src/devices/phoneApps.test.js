import { describe, it, expect } from 'vitest'
import { detectPhoneApps, detectWithAppManager, detectWithLauncher } from './phoneApps'
import { allCatalogPackages } from './healthApps'

describe('détection des apps du téléphone, bornée (régression du 18/10/2026)', () => {
  it('apps installées reconnues', async () => {
    const launcher = { canOpenUrl: async ({ url }) => ({ value: url === 'com.huawei.health' }) }
    const apps = await detectWithLauncher(launcher)
    expect(apps.map((a) => a.id)).toEqual(['huawei_health'])
  })
  it('un paquet qui ne répond jamais compte comme absent', async () => {
    const launcher = { canOpenUrl: ({ url }) => (url === 'com.huawei.health' ? new Promise(() => {}) : Promise.resolve({ value: url === 'nodomain.freeyourgadget.gadgetbridge' })) }
    const apps = await detectWithLauncher(launcher, { checkMs: 20, totalMs: 1000 })
    expect(apps.map((a) => a.id)).toEqual(['gadgetbridge'])
  })
  it('détection trop longue : null (inconnu), jamais d’attente sans fin', async () => {
    const launcher = { canOpenUrl: () => new Promise(() => {}) }
    expect(await detectWithLauncher(launcher, { checkMs: 1000, totalMs: 20 })).toBeNull()
  })
})

/**
 * Imite un plugin Capacitor natif : un Proxy qui rend une fonction pour **toute** propriété (`then` comprise) ; une
 * méthode inconnue rend une promesse rejetée sans jamais appeler ses arguments (comme @capacitor/core).
 */
function capacitorProxy(methods) {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === '$$typeof') return undefined
        return (...args) => (methods[prop] ? Promise.resolve(methods[prop](...args)) : Promise.reject(new Error(`${String(prop)}() non implémentée`)).catch(() => {}))
      },
    },
  )
}

const settlesWithin = (p, ms) => Promise.race([p.then(() => true, () => true), new Promise((r) => setTimeout(() => r(false), ms))])

describe('détection des apps du téléphone dans l’app (capture du 18/10/2026, 15:03 : « délai dépassé (8 s) »)', () => {
  it('le piège reproduit : un plugin rendu tel quel par une fonction async ne se règle jamais', async () => {
    const plugin = capacitorProxy({})
    expect(await settlesWithin((async () => plugin)(), 50)).toBe(false)
  })

  it('un seul appel natif groupé, rapide', async () => {
    const calls = []
    const appManager = capacitorProxy({ installedPackages: ({ packages }) => (calls.push(packages), { installed: ['com.huawei.health', 'com.strava'] }) })
    const apps = await detectPhoneApps({ native: true, appManager, loadLauncher: async () => ({ launcher: null }) })
    expect(apps.map((a) => a.id).sort()).toEqual(['huawei_health', 'strava'])
    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual(allCatalogPackages())
    expect(calls[0]).toContain('com.huawei.health')
  })

  it('APK plus ancien (méthode native absente) : repli sur AppLauncher, chargé sans blocage', async () => {
    const launcher = capacitorProxy({ canOpenUrl: ({ url }) => ({ value: url === 'nodomain.freeyourgadget.gadgetbridge' }) })
    const loadLauncher = async () => ({ launcher })
    const appManager = capacitorProxy({ installedPackages: () => Promise.reject(new Error('installedPackages() non implémentée')) })
    const p = detectPhoneApps({ native: true, appManager, loadLauncher })
    expect(await settlesWithin(p, 500)).toBe(true)
    expect((await p).map((a) => a.id)).toEqual(['gadgetbridge'])
  })

  it('appel natif qui ne répond pas : borné, puis repli', async () => {
    const appManager = { installedPackages: () => new Promise(() => {}) }
    const launcher = { canOpenUrl: async ({ url }) => ({ value: url === 'com.huawei.health' }) }
    const apps = await detectWithAppManager(appManager, { timeoutMs: 20 }).catch((e) => e)
    expect(apps.message).toMatch(/délai dépassé/)
    const viaFallback = await detectPhoneApps({ native: true, appManager: { installedPackages: async () => ({}) }, loadLauncher: async () => ({ launcher }) })
    expect(viaFallback.map((a) => a.id)).toEqual(['huawei_health'])
  })

  it('tout échoue : erreur qui dit pourquoi (affichée par le diagnostic)', async () => {
    const appManager = { installedPackages: async () => ({}) }
    await expect(detectPhoneApps({ native: true, appManager, loadLauncher: async () => ({ launcher: null }) })).rejects.toThrow(/réponse native illisible.*AppLauncher absent/)
  })

  it('navigateur : null (détection impossible), sans appel natif', async () => {
    expect(await detectPhoneApps({ native: false, appManager: {} })).toBeNull()
  })
})
