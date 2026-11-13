import { describe, it, expect, afterEach, vi } from 'vitest'
import { detectPhoneApps } from './phoneApps'

// La détection des apps santé repose sur des noms de paquets Android : impossible sur iPhone (canOpenURL les refuse)
describe('detectPhoneApps sur iOS', () => {
  afterEach(() => {
    delete window.Capacitor
  })

  it('sur iPhone : détection impossible (null), sans appeler le natif', async () => {
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios' }
    const appManager = { installedPackages: vi.fn() }
    const loadLauncher = vi.fn()
    expect(await detectPhoneApps({ appManager, loadLauncher })).toBeNull()
    expect(appManager.installedPackages).not.toHaveBeenCalled()
    expect(loadLauncher).not.toHaveBeenCalled()
  })

  it('sur Android : la détection native a lieu', async () => {
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android' }
    const appManager = { installedPackages: vi.fn(async () => ({ installed: [] })) }
    expect(await detectPhoneApps({ appManager })).toEqual([])
    expect(appManager.installedPackages).toHaveBeenCalled()
  })
})
