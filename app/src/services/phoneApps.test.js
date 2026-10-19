import { describe, it, expect } from 'vitest'
import {
  appCategory,
  appSessions,
  summarizeAppsDay,
  phoneAppsEntries,
  MAX_APP_SESSION_MS,
  APP_CATEGORIES,
} from './phoneApps'

const MIN = 60000
/** Heure locale du 10 septembre 2026 (ou d'un autre jour). */
const t = (h, m = 0, day = 10) => new Date(2026, 8, day, h, m).getTime()
const apps = {
  'com.instagram.android': { label: 'Instagram', category: -1 },
  'com.google.android.youtube': { label: 'YouTube', category: 2 },
  'com.whatsapp': { label: 'WhatsApp', category: 4 },
  'com.example.notes': { label: 'Notes', category: 7 },
  'com.example.game': { label: 'Jeu', category: 0 },
}

describe('appCategory', () => {
  it('prend la catégorie déclarée par l’app', () => {
    expect(appCategory('com.example.game', apps['com.example.game'])).toBe('game')
    expect(appCategory('com.google.android.youtube', apps['com.google.android.youtube'])).toBe('video')
    expect(appCategory('com.example.notes', apps['com.example.notes'])).toBe('other')
  })

  it('complète les apps sans catégorie par une table de repli', () => {
    expect(appCategory('com.instagram.android', { category: -1 })).toBe('social')
    expect(appCategory('com.zhiliaoapp.musically', undefined)).toBe('social')
  })

  it('range les messageries à part, même si elles se déclarent « réseau social »', () => {
    expect(appCategory('com.whatsapp', { category: 4 })).toBe('messaging')
    expect(appCategory('org.thoughtcrime.securesms', { category: -1 })).toBe('messaging')
  })

  it('ne connaît que des catégories déclarées', () => {
    for (const p of Object.keys(apps)) expect(APP_CATEGORIES).toContain(appCategory(p, apps[p]))
  })
})

describe('appSessions', () => {
  it('ouvre au premier plan, ferme au passage en arrière-plan', () => {
    const s = appSessions([
      { t: t(9), e: 'fg', p: 'com.instagram.android' },
      { t: t(9, 10), e: 'bg', p: 'com.instagram.android' },
    ])
    expect(s).toEqual([{ p: 'com.instagram.android', start: t(9), end: t(9, 10) }])
  })

  it('ferme une app quand une autre passe au premier plan, ou quand l’écran s’éteint', () => {
    const s = appSessions([
      { t: t(9), e: 'fg', p: 'com.instagram.android' },
      { t: t(9, 5), e: 'fg', p: 'com.whatsapp' },
      { t: t(9, 8), e: 'off' },
      { t: t(9, 30), e: 'bg', p: 'com.whatsapp' },
    ])
    expect(s).toEqual([
      { p: 'com.instagram.android', start: t(9), end: t(9, 5) },
      { p: 'com.whatsapp', start: t(9, 5), end: t(9, 8) },
    ])
  })

  it('ignore le passage en arrière-plan d’une autre app', () => {
    const s = appSessions([
      { t: t(9), e: 'fg', p: 'com.instagram.android' },
      { t: t(9, 1), e: 'bg', p: 'com.whatsapp' },
      { t: t(9, 4), e: 'bg', p: 'com.instagram.android' },
    ])
    expect(s).toEqual([{ p: 'com.instagram.android', start: t(9), end: t(9, 4) }])
  })

  it('plafonne une session dont la fin a été perdue', () => {
    const s = appSessions([
      { t: t(9), e: 'fg', p: 'com.example.game' },
      { t: t(15), e: 'fg', p: 'com.whatsapp' },
      { t: t(15, 1), e: 'bg', p: 'com.whatsapp' },
    ])
    expect(s[0].end - s[0].start).toBe(MAX_APP_SESSION_MS)
  })

  it('ferme l’app encore ouverte à `until`', () => {
    const s = appSessions([{ t: t(9), e: 'fg', p: 'com.whatsapp' }], { until: t(9, 3) })
    expect(s).toEqual([{ p: 'com.whatsapp', start: t(9), end: t(9, 3) }])
  })
})

describe('summarizeAppsDay', () => {
  const events = [
    { t: t(8), e: 'fg', p: 'com.instagram.android' },
    { t: t(8, 20), e: 'bg', p: 'com.instagram.android' },
    { t: t(20, 50), e: 'fg', p: 'com.google.android.youtube' },
    { t: t(21, 30), e: 'bg', p: 'com.google.android.youtube' },
    { t: t(21, 30), e: 'fg', p: 'com.instagram.android' },
    { t: t(21, 40), e: 'off' },
  ]

  it('minutes par catégorie, par heure, et les apps les plus utilisées', () => {
    const d = summarizeAppsDay(events, apps, '2026-09-10')
    expect(d.date).toBe('2026-09-10')
    expect(d.minutes).toEqual({ social: 30, video: 40 })
    expect(d.byHour.video[20]).toBe(10)
    expect(d.byHour.video[21]).toBe(30)
    expect(d.byHour.social[8]).toBe(20)
    expect(d.byHour.social[21]).toBe(10)
    expect(d.byHour.social).toHaveLength(24)
    expect(d.topApps).toEqual([
      { label: 'YouTube', category: 'video', minutes: 40 },
      { label: 'Instagram', category: 'social', minutes: 30 },
    ])
  })

  it('coupe une session à minuit', () => {
    const d = summarizeAppsDay(
      [
        { t: t(23, 50, 9), e: 'fg', p: 'com.instagram.android' },
        { t: t(0, 15), e: 'bg', p: 'com.instagram.android' },
      ],
      apps,
      '2026-09-10',
    )
    expect(d.minutes).toEqual({ social: 15 })
  })

  it('n’a aucune notion de « bonne » ou « mauvaise » app : seulement des minutes', () => {
    const d = summarizeAppsDay(events, apps, '2026-09-10')
    expect(Object.keys(d).sort()).toEqual(['byHour', 'date', 'minutes', 'topApps'])
  })
})

describe('phoneAppsEntries', () => {
  const events = [
    { t: t(23, 0, 8), e: 'fg', p: 'com.whatsapp' },
    { t: t(23, 5, 8), e: 'bg', p: 'com.whatsapp' },
    { t: t(9, 0, 9), e: 'fg', p: 'com.instagram.android' },
    { t: t(9, 30, 9), e: 'bg', p: 'com.instagram.android' },
    { t: t(10, 0, 10), e: 'fg', p: 'com.instagram.android' },
    { t: t(10, 5, 10), e: 'bg', p: 'com.instagram.android' },
  ]

  it('une entrée par journée terminée et entièrement couverte, jamais pour aujourd’hui', () => {
    const out = phoneAppsEntries(events, apps, { now: t(12, 0, 10) })
    // Le 8 commence avant le premier événement : journée incomplète, ignorée.
    expect(out.map((e) => e.payload.date)).toEqual(['2026-09-09'])
    expect(out[0]).toMatchObject({ type: 'phone_apps', source: 'phone' })
    expect(out[0].payload.minutes).toEqual({ social: 30 })
    expect(new Date(out[0].at).getHours()).toBe(12)
  })

  it('une journée sans aucune app au premier plan reste une vraie journée (0 min)', () => {
    const out = phoneAppsEntries(
      [{ t: t(23, 0, 8), e: 'off' }, { t: t(10, 0, 10), e: 'fg', p: 'com.whatsapp' }],
      apps,
      { now: t(12, 0, 10) },
    )
    expect(out.map((e) => e.payload.date)).toEqual(['2026-09-09'])
    expect(out[0].payload.minutes).toEqual({})
  })

  it('rien sans événement', () => {
    expect(phoneAppsEntries([], apps, { now: t(12) })).toEqual([])
  })

  it('arrondit sans perdre les minutes', () => {
    const out = phoneAppsEntries(
      [
        { t: t(23, 0, 8), e: 'off' },
        { t: t(9, 0, 9), e: 'fg', p: 'com.whatsapp' },
        { t: t(9, 0, 9) + 2.6 * MIN, e: 'bg', p: 'com.whatsapp' },
      ],
      apps,
      { now: t(12, 0, 10) },
    )
    expect(out[0].payload.minutes).toEqual({ messaging: 3 })
  })
})
