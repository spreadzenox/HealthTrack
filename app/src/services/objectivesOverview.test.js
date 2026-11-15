import { describe, expect, it } from 'vitest'
import { objectiveCard, objectivesOverview, TREND_WORDS } from './objectivesOverview'
import { fromDisplay } from './mood/wellbeingScale'

const NOW = new Date(2026, 10, 15, 12)
const DAY = 86_400_000
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const band = (v) => ({ mean: fromDisplay(v), low: fromDisplay(v - 0.3), high: fromDisplay(v + 0.3), sd: 0.1 })

/** `values` : du plus ancien à aujourd'hui ; null = jour sans note (le modèle l'estime quand même). */
function states(values, { digestion = values, curve = true } = {}) {
  const n = values.length
  const days = values.map((v, i) => ({
    date: key(new Date(NOW.getTime() - (n - 1 - i) * DAY)),
    future: false,
    observed: { wellbeing: v != null, digestion: digestion[i] != null },
    wellbeing: band(v ?? 3),
    digestion: band(digestion[i] ?? 3),
    digestionOwn: band(digestion[i] ?? 3),
  }))
  days.push({ date: key(new Date(NOW.getTime() + DAY)), future: true, observed: { wellbeing: false, digestion: false }, wellbeing: band(5), digestion: band(5), digestionOwn: band(5) })
  return { days, showDigestiveCurve: curve }
}

describe('objectiveCard (refonte « Compagnon », étape 6a)', () => {
  it('sans aucune donnée : en attente, 0 jour noté sur 7', () => {
    expect(objectiveCard('wellbeing', null, NOW)).toMatchObject({ state: 'waiting', noted: 0, need: 7, daysLeft: 7 })
  })

  it('avant 7 jours notés : pas de score, le compte des jours notés et ce qu’il reste', () => {
    const c = objectiveCard('wellbeing', states([4, null, 4, 4]), NOW)
    expect(c).toMatchObject({ state: 'waiting', noted: 3, need: 7, daysLeft: 4, score: null, trend: null })
  })

  it('à 7 jours notés : la moyenne des 7 derniers jours et 7 barres, les jours futurs écartés', () => {
    const c = objectiveCard('wellbeing', states([3, 3, 3, 4, 4, 4, 4]), NOW)
    expect(c.state).toBe('score')
    expect(c.score).toBeCloseTo(25 / 7, 5)
    expect(c.bars).toHaveLength(7)
    expect(c.bars.every((b) => b.value != null)).toBe(true)
  })

  it('la tendance compare les 3 derniers jours aux 4 précédents, en mots', () => {
    expect(objectiveCard('wellbeing', states([3, 3, 3, 3, 4, 4, 4]), NOW).trend).toBe('up')
    expect(objectiveCard('wellbeing', states([4, 4, 4, 4, 3, 3, 3]), NOW).trend).toBe('down')
    expect(objectiveCard('wellbeing', states([4, 4, 4, 4, 4.1, 4, 3.9]), NOW).trend).toBe('flat')
    expect(TREND_WORDS.up).toBe('Plutôt en hausse cette semaine')
    expect(TREND_WORDS.down).toBe('Un peu en baisse cette semaine')
    expect(TREND_WORDS.flat).toBe('Plutôt stable cette semaine')
  })

  it('les jours notés se comptent sur tout l’historique, le score sur la semaine', () => {
    const c = objectiveCard('wellbeing', states([5, 5, 5, 5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2]), NOW)
    expect(c.noted).toBe(14)
    expect(c.score).toBeCloseTo(2, 5)
  })

  it('le confort digestif attend 14 jours notés', () => {
    const thirteen = new Array(13).fill(3)
    expect(objectiveCard('digestion', states(thirteen), NOW)).toMatchObject({ state: 'waiting', noted: 13, need: 14, daysLeft: 1 })
    expect(objectiveCard('digestion', states([...thirteen, 5]), NOW).state).toBe('score')
  })

  it('digestion sans courbe estimée : seuls les jours notés comptent, comme dans Tendances', () => {
    const digestion = [...new Array(12).fill(3), 5, null, 5, null, null, null, 5]
    const c = objectiveCard('digestion', states(new Array(19).fill(4), { digestion, curve: false }), NOW)
    expect(c.noted).toBe(15)
    expect(c.bars.filter((b) => b.value != null)).toHaveLength(3)
    expect(c.score).toBeCloseTo(5, 5)
  })

  it('seuil passé mais moins de 3 points cette semaine : pas de score, sans compte à rebours', () => {
    const digestion = [...new Array(14).fill(3), null, null, null, null, null, null, 4]
    const c = objectiveCard('digestion', states(new Array(21).fill(4), { digestion, curve: false }), NOW)
    expect(c).toMatchObject({ state: 'quiet', score: null, trend: null, weekNoted: 1 })
  })
})

describe('objectivesOverview', () => {
  it('le bien-être toujours ; le confort digestif seulement avec l’objectif', () => {
    expect(objectivesOverview(null, { gut: false, now: NOW }).map((c) => c.key)).toEqual(['wellbeing'])
    expect(objectivesOverview(null, { gut: true, now: NOW }).map((c) => c.key)).toEqual(['wellbeing', 'digestion'])
  })
})
