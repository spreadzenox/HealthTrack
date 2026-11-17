import { describe, it, expect, beforeEach } from 'vitest'
import { takeWorldNews, WORLD_SEEN_KEY } from './context.js'
import { growthAt } from './growth.js'

const at = (days, date = new Date(2026, 10, 17, 12)) => ({ growth: growthAt(days, date), season: growthAt(days, date).season })

beforeEach(() => localStorage.removeItem(WORLD_SEEN_KEY))

describe("la nouvelle de l'îlot, dite une fois (MONDE-4b)", () => {
  it('première visite : rien à annoncer, l’état est gardé', () => {
    expect(takeWorldNews(at(90))).toBeNull()
    expect(JSON.parse(localStorage.getItem(WORLD_SEEN_KEY))).toMatchObject({ pond: true, neighbour: true, tree: true, season: 'automne' })
  })

  it('le petit arbre est annoncé une seule fois', () => {
    takeWorldNews(at(44))
    expect(takeWorldNews(at(45))).toBe("L'arbuste est devenu un petit arbre")
    expect(takeWorldNews(at(45))).toBeNull()
    expect(takeWorldNews(at(46))).toBeNull()
  })

  it('la plus marquante quand plusieurs arrivent ensemble (mare avant îlot voisin)', () => {
    takeWorldNews(at(10))
    expect(takeWorldNews(at(90))).toBe("Une mare est apparue sur l'îlot")
    expect(takeWorldNews(at(90))).toBeNull()
  })

  it('la saison qui change est annoncée', () => {
    takeWorldNews(at(10))
    expect(takeWorldNews(at(10, new Date(2026, 11, 22, 12)))).toBe("L'hiver est arrivé sur l'îlot")
  })

  it('un état gardé illisible ne casse rien', () => {
    localStorage.setItem(WORLD_SEEN_KEY, '{oups')
    expect(takeWorldNews(at(45))).toBeNull()
    expect(takeWorldNews(at(45))).toBeNull()
  })

  it('sans croissance connue : rien, et rien de gardé', () => {
    expect(takeWorldNews({ growth: null, season: 'automne' })).toBeNull()
    expect(localStorage.getItem(WORLD_SEEN_KEY)).toBeNull()
  })
})
