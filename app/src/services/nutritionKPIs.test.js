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

  it('aucune part inconnue quand tout est mesuré', () => {
    const totals = computeTotalsFromItems([{ ingredient: ABAT, quantity_g: 100 }])
    expect(totals.unknown_share).toEqual({})
    expect(totals.fodmap_score).toBe(0)
    expect(totals.fodmap_groups).toEqual([])
  })

  it('un aliment absent de la table ne fausse pas la part inconnue', () => {
    const totals = computeTotalsFromItems([
      { ingredient: ABAT, quantity_g: 100 },
      { ingredient: 'Plat inventé', quantity_g: 500 },
    ])
    expect(totals.unknown_share).toEqual({})
  })
})

describe('computeTotalsFromItems — FODMAP par sous-groupe (au lieu de l\'ancien score inventé)', () => {
  it('compte les sous-groupes au-dessus du repère de départ : lait → lactose', () => {
    const totals = computeTotalsFromItems([{ ingredient: 'Lait demi-écrémé, UHT', quantity_g: 250 }])
    expect(totals.fodmap_groups).toEqual(['lactose'])
    expect(totals.fodmap_score).toBe(1)
  })

  it('oignon et lait dans le même repas : deux groupes (fructanes et lactose)', () => {
    const totals = computeTotalsFromItems([
      { ingredient: 'Oignon, cru', quantity_g: 70 },
      { ingredient: 'Lait demi-écrémé, UHT', quantity_g: 250 },
    ])
    expect(totals.fodmap_groups).toEqual(expect.arrayContaining(['fructans', 'lactose']))
    expect(totals.fodmap_score).toBe(totals.fodmap_groups.length)
  })

  it('une petite portion reste sous le repère : 15 ml de lait → 0', () => {
    const totals = computeTotalsFromItems([{ ingredient: 'Lait demi-écrémé, UHT', quantity_g: 15 }])
    expect(totals.fodmap_score).toBe(0)
  })

  it("n'utilise plus le champ fodmap_score de la table (valeur inventée en avril 2026)", () => {
    // Abat : ancien score 0 ; rien au-dessus d'un repère.
    const totals = computeTotalsFromItems([{ ingredient: ABAT, quantity_g: 100 }])
    expect(totals.fodmap_score).toBe(0)
  })
})
