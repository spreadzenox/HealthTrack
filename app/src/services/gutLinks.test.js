import { describe, it, expect } from 'vitest'
import { simulateRealistic } from './gutWindows.sim'
import { GUT_LINKS_MIN_DAYS, comparableLabel, gutFactorLabel, summarizeGutLinks } from './gutLinks'
import { FODMAP_FACTOR } from './gutWindows'

const DAY_ONLY = { timedNotes: false, dayNotes: true }
const note = (iso, level) => ({ type: 'gut', at: iso, payload: { level } })

describe('summarizeGutLinks', () => {
  it('sans note du ventre : rien à montrer', () => {
    expect(summarizeGutLinks([]).status).toBe('no_notes')
    expect(summarizeGutLinks(null).noteDays).toBe(0)
  })

  it('quelques jours de notes : « trop tôt », avec le nombre de jours et le seuil', () => {
    const s = summarizeGutLinks([note('2026-09-01T10:00:00', 'calm'), note('2026-09-02T10:00:00', 'pain')])
    expect(s.status).toBe('too_early')
    expect(s.noteDays).toBe(2)
    expect(s.minDays).toBe(GUT_LINKS_MIN_DAYS)
    expect(GUT_LINKS_MIN_DAYS).toBe(28)
  })

  it('un effet net jour par jour devient une piste « aliment → ventre », une seule par aliment', () => {
    let hits = 0
    for (let seed = 1; seed <= 6; seed++) {
      const s = summarizeGutLinks(simulateRealistic({ seed: seed * 31, days: 90, ...DAY_ONLY, dayEffect: { food: 'oignon', day: 0, odds: 8 } }))
      const link = s.links.find((l) => l.factor === 'oignon')
      if (!link) continue
      hits += 1
      expect(s.status).toBe('links')
      expect(s.links.filter((l) => l.factor === 'oignon')).toHaveLength(1)
      expect(link.label).toBe('Oignon')
      expect(link.kind).toBe('day')
      expect(link.exposed.n).toBeGreaterThanOrEqual(8)
      expect(link.exposed.symptoms / link.exposed.n).toBeGreaterThan(link.unexposed.symptoms / link.unexposed.n)
      expect(link.q).toBeLessThan(0.1)
      // I171 (a) : seulement pour les notes horodatées
      expect(link.nearMeal).toBeNull()
      expect(link.sameNight).toBe(false)
    }
    expect(hits).toBeGreaterThanOrEqual(3)
  })

  it('avec les nuits connues, une piste « jour » dit qu’elle est comparée à nuit comparable (I134)', () => {
    let seen = 0
    for (let seed = 1; seed <= 12 && !seen; seed++) {
      const entries = simulateRealistic({ seed: seed * 31, days: 90, ...DAY_ONLY, dayEffect: { food: 'oignon', day: 0, odds: 8 } })
      // Nuits plus souvent courtes avant les jours gênés : la nuit va avec le ventre, elle est donc retenue (I134 étape 2).
      const nights = entries.filter((e) => e.type === 'gut').map((e, i) => {
        const short = e.payload.level === 'calm' ? i % 4 === 0 : i % 4 !== 0
        return { type: 'sleep', at: `${e.at.slice(0, 10)}T00:30:00`, payload: { durationMinutes: (short ? 330 : 450) + ((i * 37) % 40), endDate: `${e.at.slice(0, 10)}T07:00:00` } }
      })
      const link = summarizeGutLinks([...entries, ...nights]).links.find((l) => l.factor === 'oignon' && l.kind === 'day')
      if (!link) continue
      seen += 1
      expect(link.sameNight).toBe(true)
      expect(link.comparable).toEqual(['sleep'])
    }
    expect(seen).toBe(1)
  })

  it('comparableLabel : une phrase courte, accordée', () => {
    expect(comparableLabel([])).toBe('')
    expect(comparableLabel(['sleep'])).toBe('à nuit comparable')
    expect(comparableLabel(['sleep', 'stress'])).toBe('à nuit et stress de la veille comparables')
    expect(comparableLabel(['screen'])).toBe('à temps d’écran de la veille comparable')
  })

  it('un effet dans une fenêtre horaire donne la part des notes prises juste après le repas (I171 a)', () => {
    let seen = 0
    for (let seed = 1; seed <= 8 && !seen; seed++) {
      const s = summarizeGutLinks(simulateRealistic({ seed: seed * 17, days: 90, effect: { food: 'oignon', fromH: 4, toH: 24, odds: 8 } }))
      const link = s.links.find((l) => l.factor === 'oignon' && l.kind === 'window')
      if (!link) continue
      seen += 1
      expect(link.whenLabel).toMatch(/h après$/)
      expect(link.nearMeal).toBeGreaterThanOrEqual(0)
      expect(link.nearMeal).toBeLessThanOrEqual(1)
    }
    expect(seen).toBe(1)
  })

  it('le résultat passe par le cache sans changer (JSON)', () => {
    const s = summarizeGutLinks(simulateRealistic({ seed: 31, days: 90, ...DAY_ONLY, dayEffect: { food: 'oignon', day: 0, odds: 8 } }))
    expect(JSON.parse(JSON.stringify(s))).toStrictEqual(s)
  })
})

describe('gutFactorLabel', () => {
  it('nom court avec une majuscule ; FODMAP en clair', () => {
    expect(gutFactorLabel('oignon')).toBe('Oignon')
    expect(gutFactorLabel(FODMAP_FACTOR)).toBe('Repas riches en FODMAP')
  })
})

describe('summarizeGutLinks — aliments toujours mangés ensemble', () => {
  it('une seule piste « a, b ou c » quand les données ne peuvent pas les départager', () => {
    const entries = simulateRealistic({ seed: 31, days: 90, timedNotes: false, dayNotes: true, dayEffect: { food: 'oignon', day: 0, odds: 8 } })
      .map((e) => (e.type === 'food' && e.payload.items.some((it) => /oignon/i.test(it.ingredient))
        ? { ...e, payload: { items: [...e.payload.items, { ingredient: 'Échalote', quantity_g: 10 }] } }
        : e))
    const s = summarizeGutLinks(entries)
    const link = s.links.find((l) => l.together.includes('oignon'))
    expect(link).toBeDefined()
    expect(link.together).toEqual(expect.arrayContaining(['oignon', 'échalote']))
    expect(link.label).toMatch(/ ou /)
    expect(s.links.filter((l) => l.when === link.when && (l.factor === 'échalote' || l.together.includes('échalote')))).toHaveLength(1)
  })
})
