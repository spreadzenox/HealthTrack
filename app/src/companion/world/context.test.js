import { describe, expect, it, vi } from 'vitest'
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

describe('worldContextForDay (MONDE-1 : un seul cache pour la scène et le widget)', async () => {
  const { worldContextForDay, resetWorldContextCache } = await import('./context.js')
  it('lit une fois par jour de Pilou et relit après 4 h', async () => {
    resetWorldContextCache()
    let n = 0
    const load = vi.fn(async () => ({ wake: 480 + n++, bedtime: 1380 }))
    const a = await worldContextForDay({ now: new Date(2026, 10, 17, 23, 0), load })
    const b = await worldContextForDay({ now: new Date(2026, 10, 18, 3, 30), load })
    expect(b).toBe(a)
    expect(load).toHaveBeenCalledTimes(1)
    const c = await worldContextForDay({ now: new Date(2026, 10, 18, 4, 5), load })
    expect(c.wake).toBe(481)
    expect(load).toHaveBeenCalledTimes(2)
    resetWorldContextCache()
  })

  it('une lecture qui échoue rend un contexte vide (heures par défaut)', async () => {
    resetWorldContextCache()
    const v = await worldContextForDay({ now: new Date(2026, 10, 17, 12, 0), load: async () => { throw new Error('x') } })
    expect(v).toEqual({})
    resetWorldContextCache()
  })
})

describe('travail de nuit (MONDE-1)', () => {
  it('couché à 8 h, levé à 15 h : Pilou dort le matin et veille le soir', () => {
    const opts = { wake: 15 * 60, bedtime: 8 * 60 }
    expect(lightAt(new Date(2026, 10, 17, 10, 0), opts).asleep).toBe(true)
    expect(lightAt(new Date(2026, 10, 17, 20, 0), opts).asleep).toBe(false)
    expect(lightAt(new Date(2026, 10, 17, 2, 0), opts).asleep).toBe(false)
  })
})

describe('sleepHabitsForDay (budget de lectures de l’Accueil)', async () => {
  const { sleepHabitsForDay, loadSleepHabits, resetWorldContextCache } = await import('./context.js')
  it('ne lit que le sommeil des 35 dernières nuits, jamais les notes', async () => {
    const calls = []
    const list = async (q) => {
      calls.push(q)
      return []
    }
    expect(await loadSleepHabits({ now: new Date(2026, 10, 17, 12, 0), list })).toEqual({ wake: null, bedtime: null })
    expect(calls).toHaveLength(1)
    expect(calls[0].type).toBe('sleep')
    expect(calls[0].source).toBeUndefined()
  })

  it('lit une fois par jour de Pilou ; une erreur rend les heures par défaut', async () => {
    resetWorldContextCache()
    const load = vi.fn(async () => ({ wake: 480, bedtime: 1380 }))
    await sleepHabitsForDay({ now: new Date(2026, 10, 17, 23, 0), load })
    await sleepHabitsForDay({ now: new Date(2026, 10, 18, 3, 0), load })
    expect(load).toHaveBeenCalledTimes(1)
    resetWorldContextCache()
    const v = await sleepHabitsForDay({ now: new Date(2026, 10, 17, 12, 0), load: async () => { throw new Error('x') } })
    expect(v).toEqual({ wake: null, bedtime: null })
    resetWorldContextCache()
  })
})

describe('jours d’usage gardés pour la croissance (MONDE-3)', async () => {
  const { usageDaysForDay, storedUsageDays, USAGE_DAYS_KEY } = await import('./context.js')
  const { worldDayKey } = await import('./daylight.js')
  const day1 = new Date(2026, 10, 17, 12, 0)
  const day2 = new Date(2026, 10, 18, 12, 0)

  it('le même jour, le décompte gardé suffit : aucune relecture des notes', async () => {
    localStorage.setItem(USAGE_DAYS_KEY, JSON.stringify({ day: worldDayKey(day1), days: 12 }))
    let calls = 0
    const days = await usageDaysForDay({ now: day1, load: async () => { calls++; return { daysOfUse: 40 } } })
    expect(days).toBe(12)
    expect(calls).toBe(0)
    localStorage.removeItem(USAGE_DAYS_KEY)
  })

  it('un nouveau jour, recompte une fois et garde le résultat', async () => {
    localStorage.setItem(USAGE_DAYS_KEY, JSON.stringify({ day: worldDayKey(day1), days: 12 }))
    const days = await usageDaysForDay({ now: day2, load: async () => ({ daysOfUse: 13 }) })
    expect(days).toBe(13)
    expect(storedUsageDays()).toEqual({ day: worldDayKey(day2), days: 13 })
    localStorage.removeItem(USAGE_DAYS_KEY)
  })

  it('ne recule jamais : une lecture ratée ou des notes supprimées gardent l’îlot', async () => {
    localStorage.setItem(USAGE_DAYS_KEY, JSON.stringify({ day: worldDayKey(day1), days: 30 }))
    expect(await usageDaysForDay({ now: day2, load: async () => ({ daysOfUse: 3 }) })).toBe(30)
    localStorage.setItem(USAGE_DAYS_KEY, JSON.stringify({ day: worldDayKey(day1), days: 30 }))
    expect(await usageDaysForDay({ now: day2, load: async () => { throw new Error('x') } })).toBe(30)
    expect(storedUsageDays().day).toBe(worldDayKey(day1))
    localStorage.removeItem(USAGE_DAYS_KEY)
  })

  it('sans décompte gardé ni lecture possible : îlot de départ', async () => {
    localStorage.removeItem(USAGE_DAYS_KEY)
    expect(storedUsageDays()).toBe(null)
    expect(await usageDaysForDay({ now: day1, load: async () => ({}) })).toBe(0)
  })
})

describe('loadIslandUsageDays (lecture légère, budget de l’Accueil)', async () => {
  const { loadIslandUsageDays, MANUAL_SOURCES } = await import('./context.js')

  it('compte les jours notés, toutes sources notées confondues', async () => {
    let asked = null
    const r = await loadIslandUsageDays({ listDays: async (o) => { asked = o; return ['2026-11-17', '2026-11-16', '2026-11-16'] } })
    expect(r).toEqual({ daysOfUse: 2 })
    expect(asked.sources).toEqual(MANUAL_SOURCES)
    expect(asked.max).toBe(90)
  })

  it('plafonne à 90 jours : au-delà, l’îlot ne change plus', async () => {
    const many = Array.from({ length: 200 }, (_, i) => new Date(2026, 0, 1 + i).toISOString().slice(0, 10))
    expect(await loadIslandUsageDays({ listDays: async () => many })).toEqual({ daysOfUse: 90 })
  })
})
