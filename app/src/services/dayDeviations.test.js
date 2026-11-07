import { describe, it, expect } from 'vitest'
import { dayDeviations, DEVIATION_MIN_PAST_DAYS } from './dayDeviations'

// Mercredi 21 octobre 2026, 12 h (heure locale)
const NOW = new Date(2026, 9, 21, 12, 0)
const key = (d) => `2026-10-${String(d).padStart(2, '0')}`

/** 14 jours passés (7 → 20 octobre) avec des valeurs proches, puis aujourd'hui. */
function history(past, today, days = 14) {
  const out = []
  for (let i = 0; i < days; i++) {
    const d = 20 - i
    out.push({ dateKey: key(d), summary: typeof past === 'function' ? past(i) : { ...past } })
  }
  if (today) out.unshift({ dateKey: key(21), summary: today })
  return out
}

const usual = (i) => ({ sleepMinutes: 420 + (i % 3) * 10, hrv: 40 + (i % 3), restingHr: 58 + (i % 2), steps: 8000 + (i % 4) * 200, screenMinutes: 180 + (i % 3) * 10 })

describe('dayDeviations', () => {
  it('reste masqué avec moins de 7 jours passés pour chaque mesure', () => {
    const r = dayDeviations(history(usual, { sleepMinutes: 300 }, DEVIATION_MIN_PAST_DAYS - 1), NOW)
    expect(r.ready).toBe(false)
    expect(r.items).toEqual([])
  })

  it('ne dit rien quand tout est dans l’habituel', () => {
    const r = dayDeviations(history(usual, { sleepMinutes: 425, hrv: 41, restingHr: 58 }), NOW)
    expect(r.ready).toBe(true)
    expect(r.items).toEqual([])
  })

  it('montre une nuit plus courte, avec la valeur et « d’habitude » d’après la médiane', () => {
    const r = dayDeviations(history(usual, { sleepMinutes: 330, hrv: 41 }), NOW)
    expect(r.items).toHaveLength(1)
    expect(r.items[0]).toMatchObject({ key: 'sleep', text: 'Nuit plus courte', value: '5 h 30', usual: 'd’habitude 7 h 10', direction: 'down' })
  })

  it('garde au plus trois écarts, les plus nets d’abord', () => {
    const r = dayDeviations(history(usual, { sleepMinutes: 300, hrv: 25, restingHr: 70, steps: 20000, screenMinutes: 420 }), NOW)
    expect(r.items).toHaveLength(3)
    const z = r.items.map((i) => i.score)
    expect([...z].sort((a, b) => b - a)).toEqual(z)
  })

  it('ne compte pas les pas ni l’écran « en moins » avant le soir : la journée n’est pas finie', () => {
    const r = dayDeviations(history(usual, { steps: 1200, screenMinutes: 20 }), NOW)
    expect(r.items).toEqual([])
    const evening = dayDeviations(history(usual, { steps: 1200 }), new Date(2026, 9, 21, 21, 30))
    expect(evening.items.map((i) => i.text)).toEqual(['Moins de pas'])
  })

  it('compte les pas « en plus » à toute heure', () => {
    const r = dayDeviations(history(usual, { steps: 16000 }), NOW)
    expect(r.items[0]).toMatchObject({ key: 'steps', text: 'Plus de pas', direction: 'up' })
  })

  it('ignore un petit écart même sur des jours très réguliers (seuil minimal)', () => {
    const flat = () => ({ restingHr: 60 })
    const r = dayDeviations(history(flat, { restingHr: 61 }), NOW)
    expect(r.items).toEqual([])
  })

  it('ne compare qu’aux 14 jours avant aujourd’hui (les jours plus anciens et futurs sont ignorés)', () => {
    const days = history(usual, { sleepMinutes: 330 })
    days.push({ dateKey: '2026-09-01', summary: { sleepMinutes: 100 } })
    days.unshift({ dateKey: key(22), summary: { sleepMinutes: 100 } })
    const r = dayDeviations(days, NOW)
    expect(r.items[0].usual).toBe('d’habitude 7 h 10')
  })

  it('règle 6 : aucun écart n’est jugé (pas de « bon », « mauvais », « trop » ni « attention »)', () => {
    const r = dayDeviations(history(usual, { sleepMinutes: 300, hrv: 25, restingHr: 70 }), new Date(2026, 9, 21, 22))
    for (const i of r.items) {
      expect(i.text).not.toMatch(/bon|mauvais|trop|attention|insuffisant|mieux|pire/i)
      expect(i).not.toHaveProperty('tone')
    }
  })
})
