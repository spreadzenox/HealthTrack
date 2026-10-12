import { describe, it, expect } from 'vitest'
import {
  screenSessions,
  dayScreenStats,
  estimatePhoneSleep,
  phoneUsageEntries,
  summarizePhoneDay,
  formatScreenMinutes,
  MAX_SESSION_MS,
} from './phoneUsage'

/** Heure locale : t('2026-10-11', 23, 30) */
function t(dateKey, h, min = 0) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d, h, min).getTime()
}
const on = (ms) => ({ t: ms, e: 'on' })
const off = (ms) => ({ t: ms, e: 'off' })
const unlock = (ms) => ({ t: ms, e: 'unlock' })
/** Session écran allumé de `mins` minutes. */
const use = (ms, mins) => [on(ms), off(ms + mins * 60000)]

describe('screenSessions', () => {
  it('apparie allumé / éteint et trie', () => {
    const s = screenSessions([off(t('2026-10-12', 9, 10)), on(t('2026-10-12', 9, 0)), unlock(t('2026-10-12', 9, 1))])
    expect(s).toEqual([{ start: t('2026-10-12', 9, 0), end: t('2026-10-12', 9, 10) }])
  })

  it('ferme un « allumé » sans « éteint » au prochain allumé, et ignore un « éteint » orphelin', () => {
    const s = screenSessions([off(t('2026-10-12', 8)), on(t('2026-10-12', 9)), on(t('2026-10-12', 9, 30)), off(t('2026-10-12', 9, 40))])
    expect(s).toEqual([
      { start: t('2026-10-12', 9), end: t('2026-10-12', 9, 30) },
      { start: t('2026-10-12', 9, 30), end: t('2026-10-12', 9, 40) },
    ])
  })

  it('écran encore allumé : session jusqu’à `until`, tronquée à 6 h', () => {
    expect(screenSessions([on(t('2026-10-12', 9))], { until: t('2026-10-12', 9, 20) })).toEqual([
      { start: t('2026-10-12', 9), end: t('2026-10-12', 9, 20) },
    ])
    const [long] = screenSessions([on(t('2026-10-12', 1)), off(t('2026-10-12', 20))])
    expect(long.end - long.start).toBe(MAX_SESSION_MS)
  })
})

describe('dayScreenStats', () => {
  it('additionne le temps du jour civil, l’écran tard de la veille au soir et les déverrouillages', () => {
    const events = [
      ...use(t('2026-10-11', 23, 0), 40), // tard (veille) : 40 min, hors jour civil
      ...use(t('2026-10-11', 23, 50), 20), // 10 min la veille + 10 min après minuit
      ...use(t('2026-10-12', 8, 0), 30),
      ...use(t('2026-10-12', 22, 30), 15), // tard mais pour le lendemain
      unlock(t('2026-10-12', 8, 0)), unlock(t('2026-10-12', 22, 30)), unlock(t('2026-10-11', 23, 0)),
    ]
    const stats = dayScreenStats(screenSessions(events), events, '2026-10-12')
    expect(stats).toEqual({ screenMinutes: 10 + 30 + 15, lateScreenMinutes: 40 + 20, unlocks: 2 })
  })
})

describe('estimatePhoneSleep', () => {
  const night = [
    ...use(t('2026-10-11', 21, 0), 60),
    ...use(t('2026-10-11', 23, 10), 20), // dernier usage → 23:30
    ...use(t('2026-10-12', 3, 15), 1), // coup d'œil à l'heure : ignoré
    ...use(t('2026-10-12', 7, 0), 15), // réveil
    ...use(t('2026-10-12', 9, 0), 5),
  ]

  it('plus longue période sans écran, coups d’œil nocturnes ignorés (et déduits)', () => {
    const est = estimatePhoneSleep(screenSessions(night), '2026-10-12')
    expect(est).toEqual({
      start: new Date(t('2026-10-11', 23, 30)).toISOString(),
      end: new Date(t('2026-10-12', 7, 0)).toISOString(),
      minutes: 7 * 60 + 30 - 1,
      glances: 1,
    })
  })

  it('un usage court en soirée (avant 00:30) n’est pas un coup d’œil : il repousse l’endormissement', () => {
    const events = [...use(t('2026-10-11', 21, 0), 30), ...use(t('2026-10-11', 23, 58), 1), ...use(t('2026-10-12', 7, 0), 5)]
    const est = estimatePhoneSleep(screenSessions(events), '2026-10-12')
    expect(est.start).toBe(new Date(t('2026-10-11', 23, 59)).toISOString())
  })

  it('un long usage la nuit coupe la nuit : la plus longue partie est gardée', () => {
    const events = [...use(t('2026-10-11', 23, 0), 10), ...use(t('2026-10-12', 2, 0), 20), ...use(t('2026-10-12', 8, 0), 5)]
    const est = estimatePhoneSleep(screenSessions(events), '2026-10-12')
    expect(est.start).toBe(new Date(t('2026-10-12', 2, 20)).toISOString())
    expect(est.minutes).toBe(5 * 60 + 40)
  })

  it('sans usage avant (endormissement inconnu) ou après (réveil pas encore vu) : null', () => {
    expect(estimatePhoneSleep(screenSessions(use(t('2026-10-12', 7, 0), 15)), '2026-10-12')).toBeNull()
    const s = screenSessions(use(t('2026-10-11', 23, 0), 15))
    expect(estimatePhoneSleep(s, '2026-10-12', { now: t('2026-10-12', 6, 0) })).toBeNull()
  })

  it('trop court (< 3 h) : pas une nuit', () => {
    const events = [...use(t('2026-10-12', 1, 0), 10), ...use(t('2026-10-12', 3, 0), 10)]
    expect(estimatePhoneSleep(screenSessions(events), '2026-10-12')).toBeNull()
  })
})

describe('phoneUsageEntries', () => {
  it('une entrée par journée terminée et entièrement couverte par le journal Android', () => {
    const events = [
      ...use(t('2026-10-10', 10, 0), 30), // couvre le 11 (avant 20:00 le 10) mais pas le 10
      ...use(t('2026-10-10', 23, 0), 30),
      ...use(t('2026-10-11', 7, 0), 60),
      ...use(t('2026-10-11', 23, 0), 20),
      ...use(t('2026-10-12', 7, 30), 10),
    ]
    const entries = phoneUsageEntries(events, { now: t('2026-10-12', 15, 0) })
    expect(entries.map((e) => e.payload.date)).toEqual(['2026-10-11'])
    const [e] = entries
    expect(e.type).toBe('phone_usage')
    expect(e.source).toBe('phone')
    expect(e.at).toBe(new Date(t('2026-10-11', 12)).toISOString())
    expect(e.payload).toMatchObject({ screenMinutes: 80, lateScreenMinutes: 30, unlocks: 0 })
    expect(e.payload.sleepEstimate.minutes).toBe(7.5 * 60)
  })

  it('aucun événement : aucune entrée', () => {
    expect(phoneUsageEntries([], { now: t('2026-10-12', 15) })).toEqual([])
  })
})

describe('summarizePhoneDay', () => {
  it('journée en cours : écran jusqu’à maintenant et nuit écoulée', () => {
    const events = [...use(t('2026-10-11', 23, 0), 20), on(t('2026-10-12', 7, 0))]
    const day = summarizePhoneDay(events, '2026-10-12', { now: t('2026-10-12', 7, 30) })
    expect(day.screenMinutes).toBe(30)
    expect(day.sleepEstimate.minutes).toBe(7 * 60 + 40)
  })
})

describe('formatScreenMinutes', () => {
  it('formate en français', () => {
    expect(formatScreenMinutes(45)).toBe('45 min')
    expect(formatScreenMinutes(125)).toBe('2 h 05')
  })
})
