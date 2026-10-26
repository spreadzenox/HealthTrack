import { describe, it, expect } from 'vitest'
import { FODMAP_SUBGROUPS, SERVING_CUTOFFS_G, fodmapPer100g, estimateMealFodmap, highFodmapGroups } from './fodmapGroups'
import { FODMAP_GROUPS } from './fodmapChallenge'
import table from '../data/ingredientsNutrition.json'
import measurements from '../data/fodmapMeasurements.json'

// Aliments synthétiques (valeurs pour 100 g)
const T = {
  Lait: { lactose_g: 4.8, fructose_g: 0.05, glucose_g: 0.1, polyols_g: 0, _q: { fructose_g: '<0.11' } },
  Miel: { lactose_g: null, fructose_g: 40, glucose_g: 35, polyols_g: null },
  Oignon: { lactose_g: 0.05, fructose_g: 0.9, glucose_g: 0.9, polyols_g: 0, _q: { lactose_g: '<0.1' } },
  Poire: { lactose_g: 0, fructose_g: 6.4, glucose_g: 2.6, polyols_g: 2 },
  Riz: { lactose_g: 0, fructose_g: 0, glucose_g: 0, polyols_g: 0 },
  Glucose: { fructose_g: 2, glucose_g: 0.1, _q: { glucose_g: '<0.2' } },
  'Riz (alias)': { alias_of: 'Riz', lactose_g: 0, fructose_g: 0, glucose_g: 0, polyols_g: 0 },
}

describe('fodmapPer100g', () => {
  it('reprend le lactose de Ciqual', () => {
    expect(fodmapPer100g(T.Lait).lactose).toEqual({ g: 4.8, status: 'mesuré', source: 'Ciqual' })
  })
  it('compte 0 (traces) une teneur sous la limite de détection, jamais la moitié de la limite', () => {
    expect(fodmapPer100g(T.Oignon).lactose).toMatchObject({ g: 0, status: 'traces' })
    expect(fodmapPer100g(T.Lait).fructose).toMatchObject({ g: 0, status: 'traces' })
  })
  it('calcule le fructose en excès du glucose, jamais négatif', () => {
    expect(fodmapPer100g(T.Miel).fructose).toMatchObject({ g: 5, status: 'mesuré' })
    expect(fodmapPer100g(T.Oignon).fructose.g).toBe(0)
    expect(fodmapPer100g(T.Poire).fructose.g).toBeCloseTo(3.8)
  })
  it('marque « approché » un excès calculé sur un glucose sous la limite de détection', () => {
    expect(fodmapPer100g(T.Glucose).fructose).toMatchObject({ g: 2, status: 'approché' })
  })
  it('déduit sorbitol et mannitol nuls de polyols totaux nuls, inconnus sinon', () => {
    expect(fodmapPer100g(T.Riz).sorbitol).toMatchObject({ g: 0, source: 'Ciqual' })
    expect(fodmapPer100g(T.Poire).sorbitol).toEqual({ g: null, status: 'inconnu', source: null })
    expect(fodmapPer100g(T.Poire).polyolsTotal).toBe(2)
  })
  it('laisse fructanes et GOS inconnus sans mesure publiée', () => {
    const r = fodmapPer100g(T.Oignon)
    expect(r.fructans.status).toBe('inconnu')
    expect(r.gos.status).toBe('inconnu')
  })
  it('reprend une mesure publiée avec sa source, et une analogie en confiance basse', () => {
    const r = fodmapPer100g(T.Poire, { sorbitol_g: 1.5, fructans_g: 0.1, source: 'art1', confidence: 'mesure' })
    expect(r.sorbitol).toEqual({ g: 1.5, status: 'mesuré', source: 'art1', confidence: 'mesure' })
    expect(r.fructans.g).toBe(0.1)
    const a = fodmapPer100g(T.Oignon, { fructans_g: 2, source: 'art2', confidence: 'analogie' })
    expect(a.fructans).toMatchObject({ status: 'approché', confidence: 'basse' })
  })
  it('ne remplace jamais une valeur Ciqual par une mesure publiée', () => {
    expect(fodmapPer100g(T.Riz, { sorbitol_g: 3, source: 'x' }).sorbitol.g).toBe(0)
  })
  it('aliment absent de la table : tout inconnu', () => {
    const r = fodmapPer100g(undefined)
    for (const g of FODMAP_SUBGROUPS) expect(r[g].status).toBe('inconnu')
  })
})

describe('estimateMealFodmap', () => {
  it('lait 250 g : lactose élevé, porté par le lait', () => {
    const r = estimateMealFodmap([{ ingredient: 'Lait', quantity_g: 250 }], T)
    expect(r.lactose).toMatchObject({ g: 12, level: 'élevé', cutoff: 1 })
    expect(r.lactose.contributors).toEqual([{ ingredient: 'Lait', g: 12, status: 'mesuré', source: 'Ciqual' }])
    expect(highFodmapGroups(r)).toEqual(['lactose'])
  })
  it('« bas » seulement si tous les aliments du repas sont connus pour ce groupe', () => {
    const r = estimateMealFodmap([{ ingredient: 'Riz', quantity_g: 150 }, { ingredient: 'Miel', quantity_g: 1 }], T)
    expect(r.fructose.level).toBe('bas') // 0,05 g < 0,15
    expect(r.lactose.level).toBe('inconnu') // lactose du miel inconnu
    expect(r.lactose.unknownFoods).toEqual(['Miel'])
  })
  it('« élevé » même si un autre aliment est inconnu', () => {
    const r = estimateMealFodmap([{ ingredient: 'Miel', quantity_g: 20 }, { ingredient: 'Inconnu', quantity_g: 50 }], T)
    expect(r.fructose.level).toBe('élevé')
  })
  it('polyols totaux connus sous le repère : sorbitol et mannitol bas', () => {
    const r = estimateMealFodmap([{ ingredient: 'Poire', quantity_g: 10 }, { ingredient: 'Riz', quantity_g: 100 }], T)
    expect(r.polyols.g).toBe(0.2)
    expect(r.sorbitol.level).toBe('bas')
    const big = estimateMealFodmap([{ ingredient: 'Poire', quantity_g: 150 }], T)
    expect(big.sorbitol.level).toBe('inconnu')
  })
  it('ignore les aliments sans quantité ; repas vide : tout inconnu', () => {
    const r = estimateMealFodmap([{ ingredient: 'Lait' }, { ingredient: '', quantity_g: 10 }], T)
    for (const g of FODMAP_SUBGROUPS) expect(r[g].level).toBe('inconnu')
    expect(estimateMealFodmap(null, T).lactose.level).toBe('inconnu')
  })
  it('cherche les mesures publiées sous le nom de l’alias', () => {
    const m = { foods: { Riz: { fructans_g: 0.5, source: 's' } } }
    const r = estimateMealFodmap([{ ingredient: 'Riz (alias)', quantity_g: 100 }], T, m)
    expect(r.fructans).toMatchObject({ g: 0.5, level: 'élevé' })
  })
  it('classe les groupes élevés par rapport au repère', () => {
    const r = estimateMealFodmap([{ ingredient: 'Lait', quantity_g: 30 }, { ingredient: 'Miel', quantity_g: 20 }], T)
    // lactose 1,44 g (1,4 × repère) ; fructose 1 g (6,7 × repère)
    expect(highFodmapGroups(r)).toEqual(['fructose', 'lactose'])
  })
})

describe('cohérence avec la réintroduction et les données livrées', () => {
  it('mêmes groupes que la réintroduction guidée', () => {
    expect([...FODMAP_SUBGROUPS].sort()).toEqual(FODMAP_GROUPS.map((g) => g.id).sort())
    for (const g of FODMAP_SUBGROUPS) expect(SERVING_CUTOFFS_G[g]).toBeGreaterThan(0)
  })
  it('table livrée : 125 ml de lait demi-écrémé dépassent le repère lactose, la poire a du fructose en excès', () => {
    const lait = estimateMealFodmap([{ ingredient: 'Lait demi-écrémé (aliment moyen)', quantity_g: 125 }], table)
    expect(lait.lactose.level).toBe('élevé')
    expect(lait.fructose.level).toBe('bas')
    const poire = estimateMealFodmap([{ ingredient: 'Poire', quantity_g: 150 }], table)
    expect(poire.fructose.level).toBe('élevé')
  })
  it('mesures publiées : chaque aliment existe dans la table et cite une source déclarée', () => {
    for (const [name, m] of Object.entries(measurements.foods)) {
      expect(table[name], name).toBeTruthy()
      expect(measurements.sources[m.source], `${name} : source`).toBeTruthy()
      expect(['mesure', 'analogie']).toContain(m.confidence)
      if (m.confidence === 'analogie') expect(table[m.analogy_of], `${name} : analogie`).toBeTruthy()
    }
  })
})
