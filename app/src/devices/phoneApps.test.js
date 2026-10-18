import { describe, it, expect } from 'vitest'
import { detectWithLauncher } from './phoneApps'

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
