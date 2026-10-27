import { describe, it, expect } from 'vitest'
import { simulateRealistic } from './gutWindows.sim'
import { GUT_LINKS_MIN_DAYS, comparableLabel, gutFactorLabel, summarizeGutLinks, togetherLabel } from './gutLinks'
import { LEGACY_FODMAP_FACTOR } from './gutWindows'

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
    expect(gutFactorLabel(LEGACY_FODMAP_FACTOR)).toBe('Repas riches en FODMAP')
    expect(gutFactorLabel('fodmap:fructans')).toBe('Repas riches en fructanes')
    expect(gutFactorLabel('fodmap:fructose')).toBe('Repas riches en fructose en excès')
    expect(gutFactorLabel('fodmap:gos')).toBe('Repas riches en GOS')
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

describe('summarizeGutLinks — aliments souvent mangés ensemble (I134 étape 3)', () => {
  it('la piste rappelle l’aliment qui l’accompagne et qui, comparé à part, ne ressort pas', () => {
    const meal = (iso, ingredient) => ({ type: 'food', at: iso, payload: { items: [{ ingredient, quantity_g: 100 }] } })
    let hits = 0
    for (let seed = 1; seed <= 12 && hits < 1; seed++) {
      let s = seed * 211
      const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32)
      const entries = []
      for (let d = 0; d < 91; d++) {
        const day = new Date(Date.UTC(2026, 6, 1 + d)).toISOString().slice(0, 10)
        const onion = rnd() < 0.4
        const garlic = rnd() < (onion ? 0.8 : 0.15)
        if (onion) entries.push(meal(`${day}T12:30:00`, 'Oignon'))
        if (garlic) entries.push(meal(`${day}T19:00:00`, 'Ail'))
        if (rnd() < 0.5) entries.push(meal(`${day}T13:00:00`, 'Riz'))
        const odds = 0.25 * (onion ? 6 : 1)
        entries.push({ type: 'gut', at: `${day}T21:00:00`, payload: { level: rnd() < odds / (1 + odds) ? 'discomfort' : 'calm', scope: 'day' } })
      }
      const link = summarizeGutLinks(entries).links.find((l) => l.factor === 'oignon')
      if (link?.oftenWith.includes('ail')) hits += 1
    }
    expect(hits).toBe(1)
  })
})

describe('pistes par sous-groupe FODMAP (N5)', () => {
  it('libellé d’aliments indiscernables, avec ou sans leur sous-groupe', () => {
    expect(togetherLabel(['oignon', 'ail', 'échalote'])).toBe('Oignon, ail ou échalote')
    expect(togetherLabel(['fodmap:gos', "lentille verte, bouillie/cuite à l'eau"])).toBe('Lentille verte (riche en GOS)')
    expect(togetherLabel(['fodmap:fructose', 'fodmap:sorbitol', 'pomme'])).toBe('Pomme (riche en fructose en excès et sorbitol)')
    expect(togetherLabel(['banane', 'fodmap:lactose', 'yaourt nature'])).toBe('Banane, yaourt nature ou le lactose')
    expect(togetherLabel(['fodmap:fructose', 'fodmap:sorbitol'])).toBe('Repas riches en fructose en excès ou sorbitol')
  })

  it('un effet du lait et du yaourt ressort comme « Repas riches en lactose », lié au test du lactose', () => {
    const entries = simulateRealistic({
      seed: 3, days: 90, timedNotes: false, dayNotes: true, realNames: true,
      dayEffect: { food: ['lait', 'yaourt'], day: 0, odds: 6 },
    })
    const s = summarizeGutLinks(entries)
    expect(s.status).toBe('links')
    const lactose = s.links.find((l) => l.factor === 'fodmap:lactose')
    expect(lactose).toMatchObject({ label: 'Repas riches en lactose', when: 'jour', together: [] })
    expect(s.links.every((l) => !l.factor.startsWith('fodmap:') || l.factor === 'fodmap:lactose')).toBe(true)
  })
})
