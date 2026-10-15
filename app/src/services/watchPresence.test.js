import { describe, it, expect, vi, beforeEach } from 'vitest'
import { describePresence, enableWatchPresence, getWatchPresence, listenWatchPresence, resetPresenceListener } from './watchPresence'

const WATCH = { deviceId: 'AA:BB:CC:DD:EE:01', name: 'HUAWEI WATCH GT 6 Pro-A1B' }

function fakeCompanion({ supported = true, associations = [], last = null } = {}) {
  const listeners = {}
  return {
    listeners,
    status: vi.fn(async () => ({ supported, associations, ...(last ? { last } : {}) })),
    associate: vi.fn(async () => ({ associated: true, id: 7 })),
    addListener: vi.fn(async (event, cb) => {
      listeners[event] = cb
      return { remove: async () => {} }
    }),
  }
}

const ago = (iso, now) => `il y a ${Math.round((now - new Date(iso)) / 60000)} min`

describe('getWatchPresence', () => {
  it('sans plugin (navigateur, ancienne app) : non pris en charge', async () => {
    expect(await getWatchPresence({ plugin: null, watch: WATCH })).toEqual({ supported: false, association: null, last: null })
  })

  it('Android 12 ou moins : non pris en charge', async () => {
    const p = await getWatchPresence({ plugin: fakeCompanion({ supported: false }), watch: WATCH })
    expect(p.supported).toBe(false)
  })

  it('retrouve l’association de la montre appairée, sans tenir compte de la casse de l’adresse', async () => {
    const plugin = fakeCompanion({
      associations: [
        { id: 3, deviceId: '11:22:33:44:55:66', name: 'Balance' },
        { id: 7, deviceId: 'aa:bb:cc:dd:ee:01', name: 'HUAWEI WATCH GT 6 Pro-A1B' },
      ],
      last: { at: 1_700_000_000_000, event: 'appeared', appearedCount: 4 },
    })
    const p = await getWatchPresence({ plugin, watch: WATCH })
    expect(p.supported).toBe(true)
    expect(p.association.id).toBe(7)
    expect(p.last).toEqual({ at: new Date(1_700_000_000_000).toISOString(), event: 'appeared', appearedCount: 4 })
  })

  it('une autre montre associée ne compte pas', async () => {
    const plugin = fakeCompanion({ associations: [{ id: 3, deviceId: '11:22:33:44:55:66' }] })
    expect((await getWatchPresence({ plugin, watch: WATCH })).association).toBeNull()
  })

  it('plugin qui échoue : non pris en charge, ne lève pas', async () => {
    const plugin = { status: async () => Promise.reject(new Error('absent')) }
    expect((await getWatchPresence({ plugin, watch: WATCH })).supported).toBe(false)
  })
})

describe('enableWatchPresence', () => {
  it('demande l’association de la montre appairée (adresse et nom)', async () => {
    const plugin = fakeCompanion()
    const notify = vi.fn(async () => true)
    expect(await enableWatchPresence({ plugin, watch: WATCH, notify })).toEqual({ associated: true, id: 7 })
    expect(plugin.associate).toHaveBeenCalledWith({ deviceId: WATCH.deviceId, name: WATCH.name })
    // seule notification de l'app : « synchro en pause » si la montre refuse la clé app fermée
    expect(notify).toHaveBeenCalledTimes(1)
  })

  it('association refusée : pas de demande de notifications', async () => {
    const plugin = fakeCompanion()
    plugin.associate.mockRejectedValueOnce(new Error('annulé'))
    const notify = vi.fn(async () => true)
    await expect(enableWatchPresence({ plugin, watch: WATCH, notify })).rejects.toThrow(/annulé/)
    expect(notify).not.toHaveBeenCalled()
  })

  it('sans montre ni plugin : message clair', async () => {
    await expect(enableWatchPresence({ plugin: fakeCompanion(), watch: null })).rejects.toThrow(/Aucune montre/)
    await expect(enableWatchPresence({ plugin: null, watch: WATCH })).rejects.toThrow(/Android 13/)
  })
})

describe('describePresence', () => {
  const now = Date.parse('2026-10-15T08:00:00Z')

  it('rien à dire si Android ne le permet pas', () => {
    expect(describePresence({ supported: false }, { now, formatAgo: ago })).toBeNull()
  })

  it('pas encore activé : propose de l’activer', () => {
    const d = describePresence({ supported: true, association: null, last: null }, { now, formatAgo: ago })
    expect(d.enabled).toBe(false)
    expect(d.text).toMatch(/se reconnecte/)
  })

  it('activé : dit quand la montre a été vue', () => {
    const d = describePresence(
      { supported: true, association: { id: 7 }, last: { at: '2026-10-15T07:55:00.000Z', event: 'appeared' } },
      { now, formatAgo: ago },
    )
    expect(d.enabled).toBe(true)
    expect(d.text).toMatch(/même app fermée/)
    expect(d.text).toMatch(/déverrouillage/)
    expect(d.text).toMatch(/reconnectée il y a 5 min/)
  })

  it('activé, montre partie : le dit sans alarmer', () => {
    const d = describePresence(
      { supported: true, association: { id: 7 }, last: { at: '2026-10-15T07:30:00.000Z', event: 'disappeared' } },
      { now, formatAgo: ago },
    )
    expect(d.text).toMatch(/déconnectée il y a 30 min/)
  })
})

describe('listenWatchPresence', () => {
  beforeEach(() => resetPresenceListener())

  it('montre reconnectée → resynchro (soumise aux règles habituelles : 30 min, clé, pause)', async () => {
    const plugin = fakeCompanion()
    const sync = vi.fn(async () => ({ ran: true }))
    await listenWatchPresence({ plugin, sync })
    await plugin.listeners.watchPresence({ event: 'appeared', at: 1 })
    expect(sync).toHaveBeenCalledTimes(1)
  })

  it('montre partie : aucune synchro', async () => {
    const plugin = fakeCompanion()
    const sync = vi.fn(async () => ({ ran: true }))
    await listenWatchPresence({ plugin, sync })
    await plugin.listeners.watchPresence({ event: 'disappeared', at: 1 })
    expect(sync).not.toHaveBeenCalled()
  })

  it('une seule écoute, même appelée par plusieurs pages', async () => {
    const plugin = fakeCompanion()
    await listenWatchPresence({ plugin, sync: vi.fn() })
    await listenWatchPresence({ plugin, sync: vi.fn() })
    expect(plugin.addListener.mock.calls.filter(([e]) => e === 'watchPresence')).toHaveLength(1)
  })

  it('prévient la carte à chaque événement', async () => {
    const plugin = fakeCompanion()
    const seen = vi.fn()
    window.addEventListener('watch-presence-updated', seen)
    await listenWatchPresence({ plugin, sync: vi.fn() })
    await plugin.listeners.watchPresence({ event: 'disappeared', at: 1 })
    await plugin.listeners.companionAssociated({ id: 7 })
    window.removeEventListener('watch-presence-updated', seen)
    expect(seen).toHaveBeenCalledTimes(2)
  })

  it('sans plugin : rien, ne lève pas', async () => {
    expect(await listenWatchPresence({ plugin: null, sync: vi.fn() })).toBe(false)
  })
})

describe('relecture app fermée sur la ligne de présence', () => {
  it('la ligne dit quand la montre a été relue app fermée', async () => {
    const now = 1_700_000_000_000
    const plugin = fakeCompanion({ associations: [{ id: 7, deviceId: WATCH.deviceId }], last: { at: now - 5 * 60000, event: 'appeared', appearedCount: 2 } })
    const background = vi.fn(async () => ({ lastSuccessAt: now - 4 * 60000, battery: 71 }))
    const p = await getWatchPresence({ plugin, watch: WATCH, background })
    expect(background).toHaveBeenCalledWith({ deviceId: WATCH.deviceId })
    expect(p.background).toEqual({ at: new Date(now - 4 * 60000).toISOString(), battery: 71 })
    expect(describePresence(p, { now, formatAgo: ago }).text).toBe('Synchro auto même app fermée (reconnexion, déverrouillage, ~2 h) · reconnectée il y a 5 min · relue app fermée il y a 4 min')
  })

  it('jamais relue app fermée (ou pas d’association) : rien de plus', async () => {
    const background = vi.fn(async () => ({ lastSuccessAt: 0 }))
    expect((await getWatchPresence({ plugin: fakeCompanion({ associations: [{ id: 7, deviceId: WATCH.deviceId }] }), watch: WATCH, background })).background).toBeNull()
    await getWatchPresence({ plugin: fakeCompanion(), watch: WATCH, background })
    expect(background).toHaveBeenCalledTimes(1)
  })
})
