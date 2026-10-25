import { describe, it, expect } from 'vitest'
import { GUT_WINDOWS, analyzeGutWindows, mealExposures } from './gutWindows'

/** Générateur pseudo-aléatoire reproductible (mulberry32) : trames synthétiques, jamais de vraies données. */
function rng(seed) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const H = 3_600_000
const START = Date.parse('2026-09-01T00:00:00Z')
const at = (day, hour) => new Date(START + day * 24 * H + hour * H).toISOString()

/**
 * 42 jours, trois repas par jour (8 h, 12 h 30, 19 h 30), « oignon » dans un repas sur trois au hasard,
 * trois notes du ventre par jour (13 h, 18 h, 23 h). `effect(note, meals)` donne la probabilité de gêne.
 */
function simulate({ seed, effect, days = 42 }) {
  const rand = rng(seed)
  const entries = []
  const meals = []
  for (let d = 0; d < days; d++) {
    for (const h of [8, 12.5, 19.5]) {
      const onion = rand() < 0.35
      const meal = { type: 'food', at: at(d, h), payload: { items: [{ ingredient: onion ? 'Oignon' : 'Riz', quantity_g: 100 }] } }
      meals.push(meal)
      entries.push(meal)
    }
    for (const h of [13, 18, 23]) {
      const t = START + d * 24 * H + h * H
      const p = effect(t, meals)
      entries.push({ type: 'gut', at: at(d, h), payload: { level: rand() < p ? 'discomfort' : 'calm' } })
    }
  }
  return entries
}

const onionBetween = (t, meals, fromH, toH) =>
  meals.some((m) => m.payload.items[0].ingredient === 'Oignon' && t - Date.parse(m.at) >= fromH * H && t - Date.parse(m.at) < toH * H)

const byWindow = (result, factor) => Object.fromEntries(
  result.results.filter((r) => r.factor === factor).map((r) => [r.window, r]),
)

describe('GUT_WINDOWS', () => {
  it('trois fenêtres fixées d’avance, sans trou ni chevauchement, chacune avec son hypothèse de départ', () => {
    expect(GUT_WINDOWS.map((w) => [w.fromH, w.toH])).toEqual([[0, 4], [4, 24], [24, 48]])
    for (const w of GUT_WINDOWS) expect(w.hypothesis).toMatch(/repère général/)
    expect(GUT_WINDOWS[0].hypothesis).toMatch(/réflexe/)
  })
})

describe('mealExposures', () => {
  it('ne compte que les repas pris AVANT la note, dans la bonne fenêtre', () => {
    const note = { at: '2026-09-02T12:00:00Z' }
    const meals = [
      { at: '2026-09-02T10:00:00Z', factors: ['a'] }, // 2 h avant → 0–4 h
      { at: '2026-09-02T02:00:00Z', factors: ['b'] }, // 10 h avant → 4–24 h
      { at: '2026-09-01T00:00:00Z', factors: ['c'] }, // 36 h avant → 24–48 h
      { at: '2026-09-02T13:00:00Z', factors: ['d'] }, // après la note : jamais
      { at: '2026-08-30T00:00:00Z', factors: ['e'] }, // 84 h avant : hors fenêtres
    ]
    const ex = mealExposures(note, meals)
    expect([...ex['0-4']]).toEqual(['a'])
    expect([...ex['4-24']]).toEqual(['b'])
    expect([...ex['24-48']]).toEqual(['c'])
  })
})

describe('analyzeGutWindows', () => {
  it('un effet simulé à environ 6 h donne une piste dans 4–24 h, et rien ailleurs', () => {
    const entries = simulate({ seed: 7, effect: (t, meals) => (onionBetween(t, meals, 4, 8) ? 0.75 : 0.15) })
    const res = analyzeGutWindows(entries)
    const onion = byWindow(res, 'oignon')
    expect(onion['4-24'].status).toBe('link')
    expect(onion['4-24'].rr).toBeGreaterThan(1.5)
    expect(onion['0-4'].status).toBe('no_link')
    expect(onion['24-48'].status).toBe('no_link')
  })

  it('sur 10 jeux simulés de 9 semaines, l’effet à 6 h est repéré au moins 7 fois, jamais dans une autre fenêtre', () => {
    let found = 0
    for (let seed = 1; seed <= 10; seed++) {
      const res = analyzeGutWindows(simulate({ seed, days: 63, effect: (t, meals) => (onionBetween(t, meals, 4, 8) ? 0.75 : 0.15) }))
      const links = res.results.filter((r) => r.factor === 'oignon' && r.status === 'link').map((r) => r.window)
      if (links.includes('4-24')) found += 1
      expect(links.filter((w) => w !== '4-24')).toEqual([])
    }
    expect(found).toBeGreaterThanOrEqual(7)
  })

  it('sans aucun effet, aucune piste (sur plusieurs jeux simulés)', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const res = analyzeGutWindows(simulate({ seed, effect: () => 0.3 }))
      expect(res.results.filter((r) => r.status === 'link')).toEqual([])
    }
  })

  it('avec peu de notes, « trop tôt pour dire » plutôt qu’une fausse piste', () => {
    const res = analyzeGutWindows(simulate({ seed: 9, days: 3, effect: (t, meals) => (onionBetween(t, meals, 4, 8) ? 1 : 0) }))
    expect(res.results.length).toBeGreaterThan(0)
    expect(res.results.every((r) => r.status === 'too_early')).toBe(true)
  })

  it('compte les combinaisons réellement testées (pour le mode détails) et les notes utilisées', () => {
    const res = analyzeGutWindows(simulate({ seed: 7, effect: () => 0.3 }))
    expect(res.notes).toBe(42 * 3)
    expect(res.tested).toBe(res.results.filter((r) => r.status !== 'too_early').length)
  })

  it('ignore les notes sans niveau connu et les repas sans aliment', () => {
    const res = analyzeGutWindows([
      { type: 'gut', at: '2026-09-02T12:00:00Z', payload: { level: 'bizarre' } },
      { type: 'food', at: '2026-09-02T10:00:00Z', payload: {} },
    ])
    expect(res).toEqual({ notes: 0, tested: 0, results: [] })
  })
})
