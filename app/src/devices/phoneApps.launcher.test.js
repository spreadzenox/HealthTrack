import { describe, it, expect, vi } from 'vitest'

// Le vrai chargement de @capacitor/app-launcher, avec un plugin qui se comporte comme un Proxy Capacitor
// (répond à `then`) : avant le correctif du 18/10/2026, `await` sur ce chargement ne se réglait jamais.
const { proxy } = vi.hoisted(() => {
  const methods = {
    canOpenUrl: ({ url }) => ({ value: url === 'com.huawei.health' }),
    openUrl: () => ({ completed: true }),
  }
  const proxy = new Proxy(
    {},
    { get: (_, prop) => (...args) => (methods[prop] ? Promise.resolve(methods[prop](...args)) : Promise.reject(new Error('non implémentée')).catch(() => {})) },
  )
  return { proxy }
})
vi.mock('@capacitor/app-launcher', () => ({ AppLauncher: proxy }))

import { detectPhoneApps, openPhoneApp } from './phoneApps'

const within = (p, ms) => Promise.race([p.then(() => 'ok', () => 'ok'), new Promise((r) => setTimeout(() => r('bloqué'), ms))])

describe('chargement d’AppLauncher sans blocage (Proxy Capacitor)', () => {
  it('repli paquet par paquet : se termine', async () => {
    const p = detectPhoneApps({ native: true, appManager: { installedPackages: async () => ({}) } })
    expect(await within(p, 1000)).toBe('ok')
    expect((await p).map((a) => a.id)).toEqual(['huawei_health'])
  })
  it('ouverture d’une app : se termine', async () => {
    expect(await within(openPhoneApp('com.huawei.health'), 1000)).toBe('ok')
  })
})
