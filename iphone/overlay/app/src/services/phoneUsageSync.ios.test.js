/**
 * Version iOS (HealthTrack-iOS) — temps d'écran : sur iPhone, `syncPhoneUsage` lit les segments horaires du plugin
 * (`queryUsageSegments`) au lieu des événements d'Android, et en tire les mêmes entrées `phone_usage`.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getPhoneUsageSettings, enablePhoneUsage, syncPhoneUsage } from './phoneUsageSync'

const HOUR = 3600000
const MIN = 60000

function at(dateKey, h, min = 0) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d, h, min).getTime()
}

/** Segments horaires de `from` à `to` : 20 min d'écran par heure de 07:00 à 23:00, rien la nuit. */
function hourlySegments(from, to) {
  const out = []
  for (let start = from; start < to; start += HOUR) {
    const h = new Date(start).getHours()
    const active = h >= 7 && h < 23
    out.push({
      start,
      end: start + HOUR,
      activeMs: active ? 20 * MIN : 0,
      pickups: active ? 3 : 0,
      ...(active ? { firstPickup: start + 10 * MIN } : {}),
    })
  }
  return out
}

/** Comme le plugin de l'iPhone : `queryUsageSegments`, pas de `queryScreenEvents`. */
function iphonePlugin({ granted = true, supported = true, segments = [] } = {}) {
  return {
    checkAccess: vi.fn(async () => ({ granted, supported })),
    queryUsageSegments: vi.fn(async () => ({ segments })),
  }
}

describe('phoneUsageSync (iPhone : segments horaires)', () => {
  beforeEach(() => localStorage.clear())

  it('enregistre les journées terminées et garde la journée en cours pour l’affichage', async () => {
    enablePhoneUsage()
    const now = new Date(at('2026-10-31', 15))
    const plugin = iphonePlugin({ segments: hourlySegments(at('2026-10-29', 18), at('2026-10-31', 15)) })
    const write = vi.fn(async (entries) => ({ inserted: entries.length }))
    const res = await syncPhoneUsage({ now, plugin, write })

    expect(res).toEqual({ ran: true, inserted: 1 })
    expect(plugin.queryUsageSegments).toHaveBeenCalledWith({ start: now.getTime() - 10 * 24 * HOUR, end: now.getTime() })
    const [entry] = write.mock.calls[0][0]
    expect(entry.type).toBe('phone_usage')
    expect(entry.payload.date).toBe('2026-10-30')
    expect(entry.payload.screenMinutes).toBe(16 * 20)
    expect(entry.payload.unlocks).toBe(16 * 3)
    expect(entry.payload.sleepEstimate.minutes).toBe(8 * 60 + 10)

    const settings = getPhoneUsageSettings()
    expect(settings.lastError).toBeNull()
    expect(settings.today.date).toBe('2026-10-31')
    expect(settings.today.screenMinutes).toBe(8 * 20)
    expect(settings.todayApps).toBeNull()
  })

  it('avec les apps de chaque heure : aussi les minutes par catégorie (phone_apps) et celles du jour', async () => {
    enablePhoneUsage()
    const now = new Date(at('2026-10-31', 15))
    const segments = hourlySegments(at('2026-10-29', 18), at('2026-10-31', 15)).map((s) => ({
      ...s,
      apps: s.activeMs ? [{ id: 'com.burbn.instagram', label: 'Instagram', category: 'Réseaux sociaux', ms: s.activeMs }] : [],
    }))
    const write = vi.fn(async (entries) => ({ inserted: entries.length }))
    const res = await syncPhoneUsage({ now, plugin: iphonePlugin({ segments }), write })

    expect(res).toEqual({ ran: true, inserted: 2 })
    const apps = write.mock.calls[0][0].filter((e) => e.type === 'phone_apps')
    expect(apps.map((e) => e.payload.date)).toEqual(['2026-10-30'])
    expect(apps[0].payload.minutes).toEqual({ social: 16 * 20 })
    expect(getPhoneUsageSettings().todayApps).toMatchObject({ date: '2026-10-31', minutes: { social: 8 * 20 } })
  })

  it('sans autorisation Temps d’écran : message propre à l’iPhone, aucune lecture', async () => {
    enablePhoneUsage()
    const plugin = iphonePlugin({ granted: false })
    const res = await syncPhoneUsage({ plugin, write: vi.fn() })
    expect(res.noAccess).toBe(true)
    expect(plugin.queryUsageSegments).not.toHaveBeenCalled()
    expect(getPhoneUsageSettings().lastError).toMatch(/temps d’écran/i)
    expect(getPhoneUsageSettings().lastError).not.toMatch(/Android|données d’utilisation/)
  })

  it('avant iOS 26.4 : dit la version qu’il faut', async () => {
    enablePhoneUsage()
    await syncPhoneUsage({ plugin: iphonePlugin({ granted: false, supported: false }), write: vi.fn() })
    expect(getPhoneUsageSettings().lastError).toMatch(/iOS 26\.4/)
  })

  it('erreur du plugin : rattrapée, message gardé', async () => {
    enablePhoneUsage()
    const plugin = iphonePlugin()
    plugin.queryUsageSegments.mockRejectedValueOnce(new Error('Lecture du temps d’écran impossible : refus'))
    const res = await syncPhoneUsage({ plugin, write: vi.fn() })
    expect(res.ran).toBe(false)
    expect(getPhoneUsageSettings().lastError).toMatch(/refus/)
  })
})
