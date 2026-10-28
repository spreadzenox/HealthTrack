import { describe, it, expect } from 'vitest'
import { checkRestore, MARKER_KEY, DEVICE_BOUND_KEYS } from './restoreGuard'

function memoryStorage(init = {}) {
  const m = new Map(Object.entries(init))
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    keys: () => [...m.keys()],
  }
}
const plugin = (id) => ({ marker: async () => ({ id }) })

const SECRETS = {
  healthtrack_gemini_api_key: 'cle',
  healthtrack_watch_keys: '{"AA":{"authId":"x","authToken":"y"}}',
  healthtrack_withings_tokens: '{"access_token":"t"}',
  healthtrack_withings_credentials: '{"clientId":"c"}',
  halcya_purchase_token: 'jeton',
}
const KEPT = { halcya_install_id: 'abcdefabcdefabcdef', healthtrack_theme: 'dark', healthtrack_huawei_secrets: '{}' }

describe('checkRestore', () => {
  it('liste les secrets propres au téléphone, sans l’identifiant d’installation ni les réglages', () => {
    expect(DEVICE_BOUND_KEYS).toEqual(expect.arrayContaining(Object.keys(SECRETS)))
    expect(DEVICE_BOUND_KEYS).not.toContain('halcya_install_id')
    expect(DEVICE_BOUND_KEYS).not.toContain('healthtrack_huawei_secrets')
  })

  it('première ouverture de cette version (aucun repère) : garde tout et pose le repère', async () => {
    const storage = memoryStorage({ ...SECRETS, ...KEPT })
    const res = await checkRestore({ plugin: plugin('n1'), storage })
    expect(res).toEqual({ restored: false })
    expect(storage.getItem(MARKER_KEY)).toBe('n1')
    for (const k of Object.keys(SECRETS)) expect(storage.getItem(k)).not.toBeNull()
  })

  it('même téléphone (repères identiques) : rien ne change', async () => {
    const storage = memoryStorage({ ...SECRETS, ...KEPT, [MARKER_KEY]: 'n1' })
    expect(await checkRestore({ plugin: plugin('n1'), storage })).toEqual({ restored: false })
    expect(storage.getItem('healthtrack_gemini_api_key')).toBe('cle')
  })

  it('données restaurées par la sauvegarde Android (repère différent) : retire les secrets, garde le reste', async () => {
    const storage = memoryStorage({ ...SECRETS, ...KEPT, [MARKER_KEY]: 'ancien' })
    const res = await checkRestore({ plugin: plugin('neuf'), storage })
    expect(res.restored).toBe(true)
    expect(res.removed.sort()).toEqual(Object.keys(SECRETS).sort())
    for (const k of Object.keys(SECRETS)) expect(storage.getItem(k)).toBeNull()
    for (const [k, v] of Object.entries(KEPT)) expect(storage.getItem(k)).toBe(v)
    expect(storage.getItem(MARKER_KEY)).toBe('neuf')
    expect(await checkRestore({ plugin: plugin('neuf'), storage })).toEqual({ restored: false })
  })

  it('hors de l’app ou natif muet : ne touche à rien et ne lève jamais', async () => {
    const storage = memoryStorage({ ...SECRETS, [MARKER_KEY]: 'ancien' })
    expect(await checkRestore({ plugin: null, storage })).toEqual({ restored: false, unavailable: true })
    const broken = { marker: async () => { throw new Error('not implemented') } }
    expect(await checkRestore({ plugin: broken, storage })).toEqual({ restored: false, unavailable: true })
    const bad = { marker: async () => ({ id: '' }) }
    expect(await checkRestore({ plugin: bad, storage })).toEqual({ restored: false, unavailable: true })
    expect(storage.getItem('healthtrack_gemini_api_key')).toBe('cle')
  })
})

describe('checkRestore — montre (SAUV : réappairage explicite)', () => {
  it('clé de la montre retirée : la carte montre passe « À reconnecter » au lieu de « Connectée »', async () => {
    const storage = memoryStorage({
      ...SECRETS,
      [MARKER_KEY]: 'ancien',
      healthtrack_watch_autosync: JSON.stringify({ at: '2026-10-20T08:00:00.000Z', outcome: 'connected', everConnected: true }),
    })
    await checkRestore({ plugin: plugin('neuf'), storage })
    expect(JSON.parse(storage.getItem('healthtrack_watch_autosync'))).toMatchObject({ outcome: 'restored', everConnected: true })
  })
  it('pas de clé de montre dans les données restaurées : l’état de la montre n’est pas touché', async () => {
    const before = JSON.stringify({ at: '2026-10-20T08:00:00.000Z', outcome: 'connected', everConnected: true })
    const storage = memoryStorage({ healthtrack_gemini_api_key: 'cle', [MARKER_KEY]: 'ancien', healthtrack_watch_autosync: before })
    await checkRestore({ plugin: plugin('neuf'), storage })
    expect(storage.getItem('healthtrack_watch_autosync')).toBe(before)
  })
})
