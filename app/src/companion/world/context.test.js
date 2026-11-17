import { describe, expect, it } from 'vitest'
import { habitualSleep, loadWorldContext, usageDaysFromEntries } from './context.js'
import { lightAt } from './index.js'

const e = (source, at, type = 'x', payload = {}) => ({ source, at, type, payload })

/** Nuits régulières : coucher 23 h 30, lever 7 h 15. */
function nights(n, now) {
  const out = []
  for (let i = 1; i <= n; i += 1) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 30)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1, 7, 15)
    out.push({
      type: 'sleep',
      source: 'health_connect',
      at: start.toISOString(),
      payload: { startDate: start.toISOString(), endDate: end.toISOString(), durationMinutes: (end - start) / 60000 },
    })
  }
  return out
}

describe('contexte du monde', () => {
  it('compte seulement les jours où quelque chose a été noté à la main', () => {
    const days = usageDaysFromEntries([
      e('app_food', '2026-11-10T12:00:00'),
      e('app_food', '2026-11-10T19:00:00'),
      e('app_habit', '2026-11-11T21:00:00'),
      e('health_connect', '2026-11-12T08:00:00'),
      e('open_meteo', '2026-11-13T00:00:00'),
      e('face_sense', '2026-11-14T09:00:00'),
    ])
    expect(days).toBe(2)
  })

  it('lit le lever et le coucher habituels dans le sommeil', () => {
    const now = new Date(2026, 10, 16, 12)
    const s = habitualSleep(nights(10, now), now)
    expect(s.wake).toBeGreaterThanOrEqual(7 * 60 + 10)
    expect(s.wake).toBeLessThanOrEqual(7 * 60 + 20)
    expect(s.bedtime).toBeGreaterThanOrEqual(23 * 60 + 25)
    expect(habitualSleep([], now)).toEqual({ wake: null, bedtime: null })
  })

  it('rassemble tout sans jamais lever', async () => {
    const now = new Date(2026, 10, 16, 12)
    const sleep = nights(10, now)
    const list = async ({ source, type }) => {
      if (type === 'sleep') return sleep
      if (source === 'app_wellbeing') return [e('app_wellbeing', '2026-11-01T20:00:00'), e('app_wellbeing', '2026-11-02T20:00:00')]
      return []
    }
    const current = { tempC: 11, precipMmH: 0.4, windKmH: 10, code: 61, at: now.toISOString() }
    const ctx = await loadWorldContext({ now, list, weatherSettings: () => ({ enabled: true, location: { lat: -33.9 }, current }) })
    expect(ctx).toMatchObject({ daysOfUse: 2, hemisphere: 'sud', weather: current })
    expect(ctx.bedtime).toBeGreaterThan(23 * 60)
    // une nuit à 23 h 30 : à 23 h Pilou veille encore à la lanterne
    expect(lightAt(new Date(2026, 10, 16, 23), { wake: ctx.wake, bedtime: ctx.bedtime }).phase).toBe('soir')

    const broken = await loadWorldContext({ now, list: async () => { throw new Error('x') }, weatherSettings: () => ({ enabled: false, current }) })
    expect(broken).toEqual({ daysOfUse: 0, wake: null, bedtime: null, hemisphere: 'nord', weather: null })
  })
})
