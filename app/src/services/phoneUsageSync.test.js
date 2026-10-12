import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getPhoneUsageSettings,
  enablePhoneUsage,
  disablePhoneUsage,
  syncPhoneUsage,
  checkPhoneUsageAccess,
} from './phoneUsageSync'

function t(dateKey, h, min = 0) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d, h, min).getTime()
}
const use = (ms, mins) => [{ t: ms, e: 'on' }, { t: ms + mins * 60000, e: 'off' }]

function fakePlugin({ granted = true, events = [] } = {}) {
  return {
    checkAccess: vi.fn(async () => ({ granted, supported: true })),
    queryScreenEvents: vi.fn(async () => ({ events })),
  }
}

describe('phoneUsageSync', () => {
  beforeEach(() => localStorage.clear())

  it('désactivé par défaut : ne lit rien', async () => {
    const plugin = fakePlugin()
    expect(await syncPhoneUsage({ plugin })).toEqual({ ran: false })
    expect(plugin.checkAccess).not.toHaveBeenCalled()
  })

  it('sans accès accordé : message, aucune lecture', async () => {
    enablePhoneUsage()
    const plugin = fakePlugin({ granted: false })
    const res = await syncPhoneUsage({ plugin })
    expect(res.noAccess).toBe(true)
    expect(plugin.queryScreenEvents).not.toHaveBeenCalled()
    expect(getPhoneUsageSettings().lastError).toMatch(/pas encore accordé/)
  })

  it('enregistre les journées terminées et garde la journée en cours pour l’affichage', async () => {
    enablePhoneUsage()
    const events = [
      ...use(t('2026-10-10', 10), 30),
      ...use(t('2026-10-11', 8), 60),
      ...use(t('2026-10-11', 23), 20),
      ...use(t('2026-10-12', 7), 15),
    ]
    const write = vi.fn(async (entries) => ({ inserted: entries.length }))
    const now = new Date(t('2026-10-12', 9))
    const res = await syncPhoneUsage({ plugin: fakePlugin({ events }), write, now })
    expect(res).toEqual({ ran: true, inserted: 1 })
    expect(write.mock.calls[0][0][0].payload.date).toBe('2026-10-11')
    const s = getPhoneUsageSettings()
    expect(s.lastSyncAt).toBe(now.toISOString())
    expect(s.today).toMatchObject({ date: '2026-10-12', screenMinutes: 15, lateScreenMinutes: 20 })
    expect(s.today.sleepEstimate.minutes).toBe(7 * 60 + 40)
  })

  it('pas plus d’une lecture toutes les 30 min, sauf forcée', async () => {
    enablePhoneUsage()
    const plugin = fakePlugin()
    const write = vi.fn(async () => ({ inserted: 0 }))
    const now = new Date(t('2026-10-12', 9))
    await syncPhoneUsage({ plugin, write, now })
    await syncPhoneUsage({ plugin, write, now: new Date(t('2026-10-12', 9, 10)) })
    expect(plugin.queryScreenEvents).toHaveBeenCalledTimes(1)
    await syncPhoneUsage({ plugin, write, now: new Date(t('2026-10-12', 9, 10)), force: true })
    expect(plugin.queryScreenEvents).toHaveBeenCalledTimes(2)
  })

  it('erreur du plugin : notée, jamais levée', async () => {
    enablePhoneUsage()
    const plugin = { checkAccess: async () => ({ granted: true }), queryScreenEvents: async () => { throw new Error('boom') } }
    expect(await syncPhoneUsage({ plugin })).toEqual({ ran: false, error: 'boom' })
    expect(getPhoneUsageSettings().lastError).toBe('boom')
  })

  it('plugin absent (ancienne app) : non pris en charge', async () => {
    expect(await checkPhoneUsageAccess({ checkAccess: async () => { throw new Error('not implemented') } }))
      .toEqual({ granted: false, supported: false })
  })

  it('désactiver efface les réglages', () => {
    enablePhoneUsage()
    disablePhoneUsage()
    expect(getPhoneUsageSettings().enabled).toBe(false)
  })
})
