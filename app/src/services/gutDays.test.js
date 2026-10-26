import { describe, it, expect } from 'vitest'
import { NULL_SCENARIOS, simulateRealistic } from './gutWindows.sim'
import { GUT_DAY_WINDOWS, TTS_SHIFT_DAYS, analyzeGutDays } from './gutDays'
import { MAX_TESTED_FOODS, analyzeGutWindows, selectTestedFactors } from './gutWindows'

const DAY_ONLY = { timedNotes: false, dayNotes: true }
const find = (res, factor, window) => res.results.find((r) => r.factor === factor && r.window === window)
const meal = (iso, ingredient) => ({ type: 'food', at: iso, payload: { items: [{ ingredient, quantity_g: 100 }] } })
const bilan = (iso, level) => ({ type: 'gut', at: iso, payload: { level, scope: 'day' } })

describe('GUT_DAY_WINDOWS', () => {
  it('deux expositions fixées d’avance : le jour même et la veille', () => {
    expect(GUT_DAY_WINDOWS.map((w) => [w.id, w.lagDays])).toEqual([['jour', 0], ['veille', 1]])
  })
})

describe('analyzeGutDays (I170 étape 3)', () => {
  it('un effet net le jour même est repéré dans « le jour même » en 13 semaines, presque jamais ailleurs', () => {
    let found = 0
    let elsewhere = 0
    for (let seed = 1; seed <= 10; seed++) {
      const res = analyzeGutDays(simulateRealistic({ seed: seed * 31, days: 90, ...DAY_ONLY, dayEffect: { food: 'oignon', day: 0, odds: 8 } }))
      if (find(res, 'oignon', 'jour').status === 'link') found += 1
      elsewhere += res.results.filter((r) => r.status === 'link' && !(r.factor === 'oignon' && r.window === 'jour')).length
    }
    expect(found).toBeGreaterThanOrEqual(5)
    // Correction de Benjamini-Hochberg à 10 % : une fausse piste à côté d'une vraie reste possible, rarement.
    expect(elsewhere).toBeLessThanOrEqual(1)
  })

  it('un effet de la veille est repéré dans « la veille »', () => {
    let found = 0
    for (let seed = 1; seed <= 10; seed++) {
      const res = analyzeGutDays(simulateRealistic({ seed: seed * 31, days: 90, ...DAY_ONLY, dayEffect: { food: 'oignon', day: 1, odds: 8 } }))
      if (find(res, 'oignon', 'veille').status === 'link') found += 1
    }
    expect(found).toBeGreaterThanOrEqual(5)
  })

  it('les quatre difficultés réalistes ensemble, sans effet : moins d’un jeu sur dix avec une piste', () => {
    let kept = 0
    const n = 40
    for (let seed = 1; seed <= n; seed++) {
      const res = analyzeGutDays(simulateRealistic({ seed: seed * 7919 + 63, days: 63, ...NULL_SCENARIOS.tous, ...DAY_ONLY }))
      if (res.results.some((r) => r.status === 'link')) kept += 1
    }
    expect(kept / n).toBeLessThan(0.1)
  })

  it('le jour même ne compte que les repas pris AVANT le bilan ; la veille, toute la journée d’avant', () => {
    const entries = []
    for (let d = 1; d <= 9; d++) {
      const day = `2026-09-${String(d).padStart(2, '0')}`
      entries.push(meal(`${day}T22:30:00`, 'Oignon')) // après le bilan : pas « le jour même », mais « la veille » du lendemain
      entries.push(bilan(`${day}T21:00:00`, 'calm'))
    }
    const res = analyzeGutDays(entries)
    expect(find(res, 'oignon', 'jour')).toBeUndefined()
    expect(find(res, 'oignon', 'veille').exposed.days).toBe(8)
    expect(find(res, 'oignon', 'veille').unexposed.days).toBe(1)
  })

  it('un seul bilan par jour, le plus récent ; ignore les notes horodatées', () => {
    const res = analyzeGutDays([
      meal('2026-09-02T12:00:00', 'Riz'),
      bilan('2026-09-02T20:00:00', 'pain'),
      bilan('2026-09-02T21:00:00', 'calm'),
      { type: 'gut', at: '2026-09-02T15:00:00', payload: { level: 'pain' } },
    ])
    expect(res.days).toBe(1)
    expect(find(res, 'riz', 'jour').exposed).toEqual({ days: 1, symptoms: 0 })
  })

  it('les notes horodatées n’influencent pas l’analyse par jour, et les bilans pas l’analyse par fenêtres', () => {
    const days = simulateRealistic({ seed: 5, days: 63, ...DAY_ONLY })
    const timed = simulateRealistic({ seed: 6, days: 63 }).filter((e) => e.type === 'gut')
    expect(analyzeGutDays([...days, ...timed])).toEqual(analyzeGutDays(days))
    expect(analyzeGutWindows(days).notes).toBe(0)
  })

  it('moins de 2 × r + 10 jours de bilans : même un effet net reste « trop tôt pour dire »', () => {
    const res = analyzeGutDays(simulateRealistic({ seed: 3, days: 2 * TTS_SHIFT_DAYS + 6, ...DAY_ONLY, dayEffect: { food: 'oignon', day: 0, odds: 40 } }))
    expect(res.results.filter((r) => r.status === 'link')).toEqual([])
  })

  it('avec peu de bilans, tout est « trop tôt pour dire »', () => {
    const res = analyzeGutDays(simulateRealistic({ seed: 9, days: 5, ...DAY_ONLY }))
    expect(res.results.length).toBeGreaterThan(0)
    expect(res.results.every((r) => r.status === 'too_early')).toBe(true)
    expect(res.tested).toBe(0)
  })

  it('rien à analyser : réponse vide', () => {
    expect(analyzeGutDays([])).toEqual({ days: 0, tested: 0, results: [] })
    expect(analyzeGutDays([bilan('2026-09-02T21:00:00', 'bizarre'), { type: 'food', at: '2026-09-02T10:00:00', payload: {} }]))
      .toEqual({ days: 0, tested: 0, results: [] })
  })
})

describe('moins de comparaisons (I173)', () => {
  const days = (n, from = 1) => Array.from({ length: n }, (_, i) => `2026-09-${String(from + i).padStart(2, '0')}`)

  it('selectTestedFactors : FODMAP toujours, puis les aliments les mieux répartis', () => {
    const meals = [
      ...days(20).map((day) => ({ day, factors: ['pain'] })), // tous les jours : peu informatif
      ...days(10).map((day) => ({ day, factors: ['riz'] })), // un jour sur deux : le mieux réparti
      ...days(4).map((day) => ({ day, factors: ['pomme', 'fodmap_eleve'] })),
      { day: '2026-09-05', factors: ['kiwi'] },
    ]
    expect(selectTestedFactors(meals, 2)).toEqual(['fodmap_eleve', 'pomme', 'riz'])
    expect(selectTestedFactors(meals, 3)).toEqual(['fodmap_eleve', 'kiwi', 'pomme', 'riz'])
    expect(selectTestedFactors(meals, 10)).toEqual(['fodmap_eleve', 'kiwi', 'pain', 'pomme', 'riz'])
  })

  it(`au plus ${MAX_TESTED_FOODS} aliments testés par fenêtre, quelle que soit la longueur de la liste`, () => {
    const entries = simulateRealistic({ seed: 5, days: 63, ...DAY_ONLY, extraFoods: 30 })
    const factors = new Set(analyzeGutDays(entries).results.map((r) => r.factor))
    expect(factors.size).toBeLessThanOrEqual(MAX_TESTED_FOODS + 1)
  })

  it('deux aliments toujours mangés ensemble ne comptent qu’une comparaison et reçoivent le même verdict', () => {
    const entries = simulateRealistic({ seed: 11, days: 63, ...DAY_ONLY }).map((e) => (e.type !== 'food' ? e : {
      ...e,
      payload: { items: e.payload.items.flatMap((it) => (it.ingredient === 'Oignon' ? [it, { ingredient: 'Échalote', quantity_g: 10 }] : [it])) },
    }))
    const res = analyzeGutDays(entries)
    const solo = analyzeGutDays(simulateRealistic({ seed: 11, days: 63, ...DAY_ONLY }))
    expect(res.tested).toBe(solo.tested)
    for (const w of ['jour', 'veille']) {
      const [a, b] = [find(res, 'oignon', w), find(res, 'échalote', w)]
      expect(b).toMatchObject({ q: a.q, u: a.u, status: a.status, p: a.p })
      expect(b).not.toHaveProperty('twinOf')
    }
  })
})
