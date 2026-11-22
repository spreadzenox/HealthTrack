import { describe, it, expect } from 'vitest'
import { phoneUsageEntriesFromSegments, summarizeSegmentsDay } from './phoneUsageIos'

// Version iOS (HealthTrack-iOS) : l'iPhone ne donne pas les allumages d'écran un à un (comme Android), mais des totaux
// par heure (`DeviceActivityData`, iOS 26.4+ dans l'UE). Ce module en tire les mêmes entrées `phone_usage`.
const H = 3600 * 1000
const at = (y, mo, d, h, min = 0) => new Date(y, mo - 1, d, h, min).getTime()

/** Heures du 19/10 18:00 au 22/10 10:00 : 10 min et 3 prises en main par heure de 08:00 à 22:00, 30 min de 22:00 à
 * 23:00, rien la nuit sauf un coup d'œil d'une minute à 03:00, reprise à 07:15 (20 min, 2 prises en main). */
function segments() {
  const out = []
  for (let t = at(2026, 10, 19, 18); t < at(2026, 10, 22, 10); t += H) {
    const h = new Date(t).getHours()
    let activeMs = 0
    let pickups = 0
    let firstPickup = null
    if (h >= 8 && h < 22) { activeMs = 10 * 60000; pickups = 3; firstPickup = t + 5 * 60000 }
    else if (h === 22) { activeMs = 30 * 60000; pickups = 3; firstPickup = t }
    else if (h === 3) { activeMs = 60000; pickups = 1; firstPickup = t + 10 * 60000 }
    else if (h === 7) { activeMs = 20 * 60000; pickups = 2; firstPickup = t + 15 * 60000 }
    out.push({ start: t, end: t + H, activeMs, pickups, firstPickup })
  }
  return out
}

describe('temps d’écran de l’iPhone (segments horaires)', () => {
  it('une entrée phone_usage par journée terminée et couverte, comme sur Android', () => {
    const entries = phoneUsageEntriesFromSegments(segments(), { now: at(2026, 10, 22, 10) })
    expect(entries.map((e) => e.payload.date)).toEqual(['2026-10-20', '2026-10-21'])
    expect(entries[1]).toMatchObject({ type: 'phone_usage', source: 'phone', at: new Date(at(2026, 10, 21, 12)).toISOString() })
  })

  it('minutes d’écran, écran tard (22:00 → 04:00) et déverrouillages de la journée', () => {
    const day = phoneUsageEntriesFromSegments(segments(), { now: at(2026, 10, 22, 10) })[1].payload
    expect(day).toMatchObject({ screenMinutes: 191, lateScreenMinutes: 31, unlocks: 48 })
  })

  it('nuit estimée : du dernier usage du soir à la première prise en main du matin, coup d’œil ignoré', () => {
    const { sleepEstimate } = phoneUsageEntriesFromSegments(segments(), { now: at(2026, 10, 22, 10) })[1].payload
    expect(sleepEstimate).toEqual({
      start: new Date(at(2026, 10, 20, 23)).toISOString(),
      end: new Date(at(2026, 10, 21, 7, 15)).toISOString(),
      minutes: 494,
      glances: 1,
    })
  })

  it('pas de nuit sans usage avant et après (journal trop court), ni journée non couverte', () => {
    const late = segments().filter((s) => s.start >= at(2026, 10, 21, 2))
    expect(phoneUsageEntriesFromSegments(late, { now: at(2026, 10, 22, 10) })).toEqual([])
    expect(summarizeSegmentsDay(late, '2026-10-21', { now: at(2026, 10, 22, 10) }).sleepEstimate).toBeNull()
  })

  it('la journée en cours se résume sans être enregistrée', () => {
    const today = summarizeSegmentsDay(segments(), '2026-10-22', { now: at(2026, 10, 22, 10) })
    expect(today).toMatchObject({ date: '2026-10-22', screenMinutes: 1 + 20 + 2 * 10, unlocks: 1 + 2 + 2 * 3 })
  })

  it('même heure sur deux iPhone du même compte : additionnée, la nuit finit à la première prise en main des deux', () => {
    // Second iPhone : 5 min et 1 prise en main de plus dans chacune des 16 heures d'usage (07:00 → 23:00), pris en main
    // 10 min plus tôt que le premier (07:05 le matin) ; rien la nuit
    const other = segments().map((s) => {
      const active = s.activeMs >= 10 * 60000
      return { ...s, activeMs: active ? 5 * 60000 : 0, pickups: active ? 1 : 0, firstPickup: active ? s.firstPickup - 10 * 60000 : null }
    })
    const [, day] = phoneUsageEntriesFromSegments([...segments(), ...other], { now: at(2026, 10, 22, 10) })
    expect(day.payload).toMatchObject({ screenMinutes: 191 + 16 * 5, unlocks: 48 + 16 })
    const [, alone] = phoneUsageEntriesFromSegments(segments(), { now: at(2026, 10, 22, 10) })
    expect(day.payload.sleepEstimate).toMatchObject({
      start: alone.payload.sleepEstimate.start,
      end: new Date(at(2026, 10, 21, 7, 5)).toISOString(),
      minutes: alone.payload.sleepEstimate.minutes - 10,
    })
  })
})
