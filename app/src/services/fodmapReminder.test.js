import { describe, it, expect, vi } from 'vitest'
import { FODMAP_CHALLENGE_SOURCE, FODMAP_CHALLENGE_TYPE, answerTolerable, currentChallenge, recordDose, startChallenge } from './fodmapChallenge'
import {
  PORTION_DEFAULT_MINUTE, challengeSummary, minuteToTime, portionReminderPlan, portionReminderPrefs, setPortionReminder,
  syncPortionReminder, takePortionOpen, timeToMinute,
} from './fodmapReminder'

const at = (d, h = 12, m = 0) => new Date(2026, 9, 26 + d, h, m)
const gut = (d, level, h = 21) => ({ type: 'gut', source: 'app_gut', at: at(d, h).toISOString(), payload: { level, scope: 'day' } })
const entry = (payload, id = 1) => ({ id, type: FODMAP_CHALLENGE_TYPE, source: FODMAP_CHALLENGE_SOURCE, at: payload.startedAt, payload })
const milk = (now = at(0, 9)) => startChallenge({ group: 'lactose', food: 'milk' }, now)

function memoryStorage(init = {}) {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}

const listFrom = (challenges, notes = []) => async ({ type }) => (type === FODMAP_CHALLENGE_TYPE ? challenges : notes)

describe('currentChallenge', () => {
  it('ignore les tests abandonnés et prend le plus récent', () => {
    const old = { ...milk(at(-10, 9)), abandonedAt: at(-9).toISOString() }
    const cur = currentChallenge([entry(old, 1), entry(milk(), 2)], [], at(0, 10))
    expect(cur.entry.id).toBe(2)
    expect(cur.status.state).toBe('day1')
    expect(currentChallenge([entry(old, 1)], [], at(0, 10))).toBeNull()
  })
})

describe('portionReminderPlan', () => {
  it('portion pas encore prise, heure à venir : aujourd’hui puis les deux jours suivants', () => {
    const now = at(0, 9)
    const plan = portionReminderPlan(currentChallenge([entry(milk())], [], now), PORTION_DEFAULT_MINUTE, now)
    expect(plan.map((p) => p.at)).toEqual([at(0, 12).getTime(), at(1, 12).getTime(), at(2, 12).getTime()])
    expect(plan[0]).toMatchObject({ title: 'Votre portion du jour', body: 'Lait · jour 1 : 125 ml. Touchez pour la noter.' })
    expect(plan[2].body).toContain('jour 3 : 375 ml')
  })

  it('heure passée sans portion : on ne rattrape pas, rappel dès demain', () => {
    const now = at(0, 15)
    const plan = portionReminderPlan(currentChallenge([entry(milk())], [], now), PORTION_DEFAULT_MINUTE, now)
    expect(plan[0].at).toBe(at(1, 12).getTime())
    expect(plan[0].body).toContain('jour 1')
  })

  it('portion du jour notée : rappels des portions restantes seulement, dès demain', () => {
    const ch = recordDose(milk(), [], at(0, 11))
    const now = at(0, 11, 30)
    const plan = portionReminderPlan(currentChallenge([entry(ch)], [], now), 8 * 60, now)
    expect(plan.map((p) => p.at)).toEqual([at(1, 8).getTime(), at(2, 8).getTime()])
    expect(plan[0].body).toContain('jour 2 : 250 ml')
  })

  it('rien après la dernière portion, pendant une question ou une pause', () => {
    let ch = milk()
    ch = recordDose(ch, [], at(0, 12))
    ch = recordDose(ch, [], at(1, 12))
    ch = recordDose(ch, [], at(2, 12))
    expect(portionReminderPlan(currentChallenge([entry(ch)], [], at(2, 13)), 720, at(2, 13))).toEqual([])

    const q = recordDose(milk(), [], at(0, 12))
    const notes = [gut(0, 'discomfort')]
    expect(currentChallenge([entry(q)], notes, at(0, 22)).status.state).toBe('question')
    expect(portionReminderPlan(currentChallenge([entry(q)], notes, at(0, 22)), 720, at(0, 22))).toEqual([])
    expect(portionReminderPlan(currentChallenge([entry(answerTolerable(q, notes, true, at(0, 22)))], notes, at(1, 8)), 720, at(1, 8))).toHaveLength(2)

    const paused = currentChallenge([entry(milk())], [], at(3, 9))
    expect(paused.status.state).toBe('paused')
    expect(portionReminderPlan(paused, 720, at(3, 9))).toEqual([])
    expect(portionReminderPlan(null)).toEqual([])
  })
})

describe('challengeSummary', () => {
  it('dit l’état du test en quelques mots', () => {
    expect(challengeSummary(null)).toBeNull()
    expect(challengeSummary(currentChallenge([entry(milk())], [], at(0, 10)))).toBe('Lait · jour 1 · portion à prendre')
    const ch = recordDose(milk(), [], at(0, 11))
    expect(challengeSummary(currentChallenge([entry(ch)], [], at(0, 12)))).toBe('Lait · jour 1 · portion notée')
    expect(challengeSummary(currentChallenge([entry(ch)], [gut(0, 'pain')], at(0, 22)))).toBe('Lait · une question vous attend')
    expect(challengeSummary(currentChallenge([entry(milk())], [], at(3, 9)))).toBe('Lait · test en pause')
  })

  it('pause de fin : jours calmes restants, pas « N/3 » (POL-PLAY-71)', () => {
    const doses = [0, 1, 2].reduce((c, d) => recordDose(c, [], at(d, 12)), milk())
    const s = challengeSummary(currentChallenge([entry(doses)], [0, 1, 2].map((d) => gut(d, 'calm')), at(3, 22)))
    expect(s).toMatch(/^Lait · résultat prêt · pause : encore \d jours? calmes?$/)
  })
})

describe('préférences et heure', () => {
  it('midi par défaut, valeurs illisibles ignorées', () => {
    expect(portionReminderPrefs(memoryStorage())).toEqual({ enabled: false, minute: 720 })
    expect(portionReminderPrefs(memoryStorage({ halcya_portion_reminder: '{"enabled":true,"minute":9999}' }))).toEqual({ enabled: true, minute: 720 })
    expect(portionReminderPrefs(memoryStorage({ halcya_portion_reminder: 'pas du json' }))).toEqual({ enabled: false, minute: 720 })
  })

  it('convertit l’heure dans les deux sens', () => {
    expect(minuteToTime(485)).toBe('08:05')
    expect(timeToMinute('08:05')).toBe(485)
    expect(timeToMinute('25:00')).toBeNull()
    expect(timeToMinute('')).toBeNull()
  })
})

describe('sync et interrupteur', () => {
  it('sans choix de la personne : liste vide envoyée (tout est annulé)', async () => {
    const plugin = { schedule: vi.fn(async (o) => ({ count: o.items.length, notifications: true })) }
    await syncPortionReminder({ plugin, list: listFrom([entry(milk())]), now: at(0, 9), storage: memoryStorage() })
    expect(plugin.schedule).toHaveBeenCalledWith({ items: [] })
  })

  it('allumer demande les notifications une fois, puis programme ; déplacer l’heure reprogramme', async () => {
    const storage = memoryStorage()
    const plugin = {
      schedule: vi.fn(async (o) => ({ count: o.items.length, notifications: true })),
      requestNotifications: vi.fn(async () => ({ asked: true, notifications: true })),
    }
    const list = listFrom([entry(milk())])
    const r = await setPortionReminder({ enabled: true }, { plugin, list, now: at(0, 9), storage })
    expect(r).toEqual({ enabled: true, notifications: true, blocked: false })
    expect(plugin.schedule.mock.calls[0][0].items).toHaveLength(3)
    await setPortionReminder({ enabled: true, minute: 8 * 60 }, { plugin, list, now: at(0, 9), storage })
    expect(plugin.requestNotifications).toHaveBeenCalledTimes(1)
    // 8 h est passé : premier rappel demain
    expect(plugin.schedule.mock.calls[1][0].items[0].at).toBe(at(1, 8).getTime())
    await setPortionReminder({ enabled: false }, { plugin, list, now: at(0, 9), storage })
    expect(plugin.schedule.mock.calls[2][0]).toEqual({ items: [] })
    expect(portionReminderPrefs(storage)).toEqual({ enabled: false, minute: 480 })
  })

  it('notifications refusées pour de bon : signalé', async () => {
    const plugin = {
      schedule: vi.fn(async () => ({ notifications: false })),
      requestNotifications: vi.fn(async () => ({ asked: false, notifications: false })),
    }
    const r = await setPortionReminder({ enabled: true }, { plugin, list: listFrom([]), now: at(0, 9), storage: memoryStorage() })
    expect(r.blocked).toBe(true)
  })

  it('hors de l’app Android : rien, sans erreur', async () => {
    expect(await syncPortionReminder({ plugin: null })).toBeNull()
    expect(await setPortionReminder({ enabled: true }, { plugin: null })).toEqual({ enabled: false, notifications: false, blocked: false })
    expect(await takePortionOpen(null)).toBe(false)
    expect(await takePortionOpen({ takeOpen: async () => ({ open: true }) })).toBe(true)
    expect(await takePortionOpen({ takeOpen: async () => { throw new Error('x') } })).toBe(false)
  })
})
