import { describe, it, expect } from 'vitest'
import { ROWS, buildLiljeboEntries } from './liljeboFructans.mjs'
import measurements from '../../src/data/fodmapMeasurements.json'
import table from '../../src/data/ingredientsNutrition.json'

describe('fructanes Liljebo 2020 (N3f)', () => {
  const built = buildLiljeboEntries(table, measurements)

  it('le générateur redonne exactement les entrées livrées', () => {
    expect(Object.keys(built).length).toBeGreaterThan(20)
    for (const [name, e] of Object.entries(built)) expect(measurements.foods[name]?.fructans, name).toEqual(e)
  })
  it('noms Ciqual existants, jamais des alias ; confiance basse (citée ou analogie), jamais « mesure »', () => {
    for (const [name, e] of Object.entries(built)) {
      expect(table[name], name).toBeTruthy()
      expect(table[name].alias_of, name).toBeUndefined()
      expect(['citée', 'analogie'], name).toContain(e.confidence)
      if (e.analogy_of) expect(table[e.analogy_of], name).toBeTruthy()
    }
  })
  it('chaque ligne cite sa référence primaire ; teneur ≤ glucides + fibres Ciqual', () => {
    for (const row of ROWS) expect(row.ref, row.ref).toMatch(/suppl\. tableau \d, .+\((d’après|valeur|moyenne) /)
    for (const [name, e] of Object.entries(built)) {
      const f = table[name]
      expect(e.g_high ?? e.g, name).toBeLessThanOrEqual(f.carbohydrates_g + (f.fiber_g ?? 0))
    }
  })
  it('sec → cuit par le rapport des glucides Ciqual (couscous, boulgour)', () => {
    const r = table['Semoule ou graine de couscous, cuite, sans sel ajouté'].carbohydrates_g / table['Semoule de blé dur, crue'].carbohydrates_g
    expect(built['Semoule ou graine de couscous, cuite, sans sel ajouté'].g).toBeCloseTo(2.25 * r, 2)
    expect(built['Boulgour de blé, cuit, sans sel ajouté'].g).toBeLessThan(built['Boulgour de blé, cru'].g)
  })
  it('l’ail cite Liljebo (Muir 2007) au lieu d’une revue de seconde main ; le pain bis garde la fourchette du pain blanc', () => {
    expect(built['Ail, cru']).toMatchObject({ g: 17.4, source: 'liljebo2020', confidence: 'citée' })
    expect(built['Pain bis (à la farine T80 ou T110)']).toMatchObject({ g: 0.14, g_high: 1.02, source: 'ferjancic2024', source_high: 'liljebo2020' })
    expect(built['Pain bis (à la farine T80 ou T110)'].g_high).toBeGreaterThan(built['Pain complet ou intégral (à la farine T150)'].g)
  })
})
