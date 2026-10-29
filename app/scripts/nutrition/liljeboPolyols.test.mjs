import { describe, it, expect } from 'vitest'
import { ROWS, buildLiljeboPolyolEntries } from './liljeboPolyols.mjs'
import { fodmapPer100g, estimateMealFodmap } from '../../src/services/fodmapGroups.js'
import measurements from '../../src/data/fodmapMeasurements.json'
import table from '../../src/data/ingredientsNutrition.json'

describe('sorbitol et mannitol Liljebo 2020 (N3g)', () => {
  const built = buildLiljeboPolyolEntries(table, measurements)
  const per100 = (name) => fodmapPer100g(table[name], measurements.foods[name])

  it('le générateur redonne exactement les entrées livrées', () => {
    expect(Object.keys(built).length).toBeGreaterThan(10)
    for (const [name, groups] of Object.entries(built)) {
      for (const [g, e] of Object.entries(groups)) expect(measurements.foods[name]?.[g], `${name} ${g}`).toEqual(e)
    }
  })
  it('Ciqual d’abord : une part du total Ciqual quand il est mesuré, une teneur citée sinon ; confiance basse', () => {
    for (const row of ROWS) expect(row.ref).toMatch(/suppl\. tableau 6, .+\((d’après|valeur) /)
    for (const [name, groups] of Object.entries(built)) {
      for (const e of Object.values(groups)) {
        expect(['citée', 'analogie'], name).toContain(e.confidence)
        if ('share' in e) expect(table[name].polyols_g, name).toBeGreaterThan(0)
        else {
          expect(table[name].polyols_g ?? null, name).toBeNull()
          expect(e.g, name).toBeLessThanOrEqual(table[name].carbohydrates_g)
        }
      }
    }
  })
  it('prune et pois mange-tout ne sont plus inconnus ; abricot sec et mirabelle : sorbitol = total Ciqual', () => {
    expect(per100('Prune, sans noyau, crue').sorbitol).toMatchObject({ g: 2.4, status: 'approché', confidence: 'basse' })
    expect(per100('Pois mange-tout ou pois gourmand, cru').mannitol).toMatchObject({ g: 1.16, status: 'approché' })
    expect(per100('Abricot, dénoyauté, sec').sorbitol.g).toBe(22.6)
    expect(per100('Prune mirabelle, sans noyau, crue').sorbitol.g).toBe(2.7)
    expect(per100('Champignon de Paris ou champignon de couche, sauté/poêlé, sans matière grasse').mannitol.g).toBe(3)
    const meal = estimateMealFodmap([{ ingredient: 'Prune, sans noyau, crue', quantity_g: 100 }], table, measurements)
    expect(meal.sorbitol.level).toBe('élevé')
  })
  it('contradictions avec un « < 0,5 » Ciqual : rien d’ajouté (mûre, chou-fleur, avocat, nectarine)', () => {
    for (const name of ['Mûre (de ronce), crue', 'Chou-fleur, cru', 'Avocat, chair sans peau, sans noyau, cru',
      'Nectarine ou brugnon, chair et peau, sans noyau, crue (aliment moyen)']) {
      expect(built[name], name).toBeUndefined()
      expect(measurements.foods[name]?.sorbitol, name).toBeUndefined()
      expect(measurements.foods[name]?.mannitol, name).toBeUndefined()
    }
  })
})
