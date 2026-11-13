import { describe, it, expect } from 'vitest'
import { iosAppCategory, phoneAppsEntriesFromSegments, summarizeSegmentsApps } from './phoneAppsIos'

const H = 3600 * 1000
const MIN = 60000
const at = (y, mo, d, h, min = 0) => new Date(y, mo - 1, d, h, min).getTime()

describe('catégorie d’une app de l’iPhone (iosAppCategory)', () => {
  it('messageries et apps connues par leur identifiant, avant la catégorie de Temps d’écran', () => {
    expect(iosAppCategory({ id: 'net.whatsapp.WhatsApp', category: 'Réseaux sociaux' })).toBe('messaging')
    expect(iosAppCategory({ id: 'com.apple.MobileSMS', category: 'Social' })).toBe('messaging')
    expect(iosAppCategory({ id: 'com.burbn.instagram', category: 'Photo et vidéo' })).toBe('social')
    expect(iosAppCategory({ id: 'com.google.ios.youtube', category: 'Divertissement' })).toBe('video')
    expect(iosAppCategory({ id: 'com.spotify.client' })).toBe('audio')
  })

  it('sinon la catégorie de Temps d’écran, en français ou en anglais', () => {
    expect(iosAppCategory({ id: 'x.y', category: 'Réseaux sociaux' })).toBe('social')
    expect(iosAppCategory({ id: 'x.y', category: 'Social' })).toBe('social')
    expect(iosAppCategory({ id: 'x.y', category: 'Jeux' })).toBe('game')
    expect(iosAppCategory({ id: 'x.y', category: 'Games' })).toBe('game')
    expect(iosAppCategory({ id: 'x.y', category: 'Information et lecture' })).toBe('news')
    expect(iosAppCategory({ id: 'x.y', category: 'Information & Reading' })).toBe('news')
  })

  it('le reste, ou rien de connu (Apple peut taire l’app) : autres apps', () => {
    expect(iosAppCategory({ id: 'x.y', category: 'Productivité et finance' })).toBe('other')
    expect(iosAppCategory({ id: 'x.y', category: 'Divertissement' })).toBe('other')
    expect(iosAppCategory({})).toBe('other')
    expect(iosAppCategory(null)).toBe('other')
  })
})

/** Du 19/10 18:00 au 21/10 10:00 : chaque heure de 08:00 à 22:00, 10 min d'Instagram et 5 min de WhatsApp. */
function segments() {
  const out = []
  for (let t = at(2026, 10, 19, 18); t < at(2026, 10, 21, 10); t += H) {
    const h = new Date(t).getHours()
    const active = h >= 8 && h < 22
    out.push({
      start: t,
      end: t + H,
      activeMs: active ? 15 * MIN : 0,
      pickups: active ? 2 : 0,
      apps: active
        ? [
            { id: 'com.burbn.instagram', label: 'Instagram', category: 'Réseaux sociaux', ms: 10 * MIN },
            { id: 'net.whatsapp.WhatsApp', label: 'WhatsApp', category: 'Réseaux sociaux', ms: 5 * MIN },
          ]
        : [],
    })
  }
  return out
}

describe('temps par catégorie d’app sur iPhone (segments horaires)', () => {
  it('une entrée phone_apps par journée terminée et couverte depuis minuit, comme sur Android', () => {
    const entries = phoneAppsEntriesFromSegments(segments(), { now: at(2026, 10, 21, 10) })
    expect(entries.map((e) => e.payload.date)).toEqual(['2026-10-20'])
    expect(entries[0]).toMatchObject({ type: 'phone_apps', source: 'phone', at: new Date(at(2026, 10, 20, 12)).toISOString() })
  })

  it('minutes par catégorie, par heure, et les apps les plus utilisées', () => {
    const [day] = phoneAppsEntriesFromSegments(segments(), { now: at(2026, 10, 21, 10) })
    expect(day.payload.minutes).toEqual({ social: 140, messaging: 70 })
    expect(day.payload.byHour.social[8]).toBe(10)
    expect(day.payload.byHour.social[3]).toBe(0)
    expect(day.payload.byHour.messaging).toHaveLength(24)
    expect(day.payload.topApps).toEqual([
      { label: 'Instagram', category: 'social', minutes: 140 },
      { label: 'WhatsApp', category: 'messaging', minutes: 70 },
    ])
  })

  it('même app sur deux iPhone du même compte : additionnée ; app sans nom : son identifiant', () => {
    const extra = { start: at(2026, 10, 20, 9), end: at(2026, 10, 20, 10), activeMs: 7 * MIN, pickups: 1,
      apps: [{ id: 'com.burbn.instagram', category: 'Réseaux sociaux', ms: 5 * MIN }, { id: 'org.example.notes', ms: 2 * MIN }] }
    const [day] = phoneAppsEntriesFromSegments([...segments(), extra], { now: at(2026, 10, 21, 10) })
    expect(day.payload.minutes).toEqual({ social: 145, messaging: 70, other: 2 })
    expect(day.payload.topApps.map((a) => a.label)).toEqual(['Instagram', 'WhatsApp', 'org.example.notes'])
  })

  it('journée en cours pour l’affichage ; rien sans apps', () => {
    const today = summarizeSegmentsApps(segments(), '2026-10-21')
    expect(today.minutes).toEqual({ social: 20, messaging: 10 })
    expect(summarizeSegmentsApps([{ start: at(2026, 10, 21, 8), end: at(2026, 10, 21, 9), activeMs: 0 }], '2026-10-21').minutes).toEqual({})
    expect(phoneAppsEntriesFromSegments([], { now: at(2026, 10, 21, 10) })).toEqual([])
  })
})
