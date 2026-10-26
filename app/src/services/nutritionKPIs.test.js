import { describe, it, expect } from 'vitest'
import { computeTotalsFromItems } from './nutritionKPIs'

// « Agneau, collier braisé ou bouilli » : sodium non mesuré par Ciqual (null) ; l'abat moyen l'a.
const AGNEAU = 'Agneau, collier braisé ou bouilli'
const ABAT = 'Abat, cuit (aliment moyen)'

describe('computeTotalsFromItems — teneurs inconnues (N2b)', () => {
  it('ne compte que les teneurs mesurées et dit quelle part du poids est inconnue', () => {
    const totals = computeTotalsFromItems([
      { ingredient: ABAT, quantity_g: 100 },
      { ingredient: AGNEAU, quantity_g: 300 },
    ])
    expect(totals.sodium_mg).toBe(396)
    expect(totals.unknown_share.sodium_mg).toBe(0.75)
    expect(totals.unknown_share.energy_kcal).toBeUndefined()
  })

  it("aucune part inconnue quand tout est mesuré, et l'ancien score FODMAP reste", () => {
    const totals = computeTotalsFromItems([{ ingredient: ABAT, quantity_g: 100 }])
    expect(totals.unknown_share).toEqual({})
    expect(totals.fodmap_score).toBe(0)
  })

  it('un aliment absent de la table ne fausse pas la part inconnue', () => {
    const totals = computeTotalsFromItems([
      { ingredient: ABAT, quantity_g: 100 },
      { ingredient: 'Plat inventé', quantity_g: 500 },
    ])
    expect(totals.unknown_share).toEqual({})
  })
})
