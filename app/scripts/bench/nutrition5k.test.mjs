import { describe, it, expect } from 'vitest'
import { bootstrapMeanCI, candidateDishes, markdownReport, parseMetadata, predictTotals, scoreDish, summarize } from './nutrition5k.mjs'

// Lignes synthétiques au format de dish_metadata_cafe1.csv (aucune donnée réelle)
const CSV = [
  'dish_1,300,200,10,30,20,ingr_1,white rice,150,195,0.5,42,4,ingr_2,chicken,50,105,9.5,0,16',
  'dish_2,100,90,1,20,2,ingr_3,apple,90,100,1,20,2',
  'dish_3,abc,1,1,1,1',
  'header,line',
  'dish_4,500,1200,20,50,30,ingr_1,white rice,600,0,0,0,0,ingr_2,chicken,600,0,0,0,0',
  'dish_5,400,300,10,40,25,ingr_1,a,100,0,0,0,0,ingr_2,b,100,0,0,0,0,ingr_3,c,100,0,0,0,0',
].join('\n')

const TABLE = {
  'Riz blanc, cuit': { energy_kcal: 130, protein_g: 2.7, carbohydrates_g: 28, fat_g: 0.3 },
  'Poulet, cuit': { energy_kcal: 200, protein_g: 30, carbohydrates_g: 0, fat_g: 8 },
}

describe('banc Nutrition5k', () => {
  it('lit les métadonnées et ignore les lignes illisibles', () => {
    const dishes = parseMetadata(CSV)
    expect(dishes.map((d) => d.id)).toEqual(['dish_1', 'dish_2', 'dish_4', 'dish_5'])
    expect(dishes[0]).toMatchObject({ mass: 200, kcal: 300, fat: 10, carb: 30, protein: 20 })
    expect(dishes[0].ingredients).toEqual([{ name: 'white rice', grams: 150 }, { name: 'chicken', grams: 50 }])
  })

  it('choisit des assiettes de 2 à 8 ingrédients et de 80 à 900 g, dans un ordre stable', () => {
    const picked = candidateDishes(parseMetadata(CSV)).map((d) => d.id)
    expect(picked.sort()).toEqual(['dish_1', 'dish_5'])
    expect(candidateDishes(parseMetadata(CSV)).map((d) => d.id)).toEqual(candidateDishes(parseMetadata(CSV).reverse()).map((d) => d.id))
  })

  it('calcule les totaux prédits avec la table de l\'app ; un nom hors table compte dans la masse seulement', () => {
    const t = predictTotals({ ingredients: [
      { ingredient: 'Riz blanc, cuit', quantity_g: 200 },
      { ingredient: 'Poulet, cuit', quantity_g: 100 },
      { ingredient: 'Inconnu', quantity_g: 50 },
      { ingredient: 'Riz blanc, cuit', quantity_g: -3 },
    ] }, TABLE)
    expect(t.mass).toBe(350)
    expect(t.kcal).toBeCloseTo(460)
    expect(t.protein).toBeCloseTo(35.4)
    expect(t.unknown).toBe(1)
    expect(predictTotals({ not_food: true }, TABLE).mass).toBe(0)
  })

  it('note les erreurs absolues', () => {
    const truth = { mass: 200, kcal: 300, protein: 20, carb: 30, fat: 10 }
    expect(scoreDish(truth, { mass: 250, kcal: 280, protein: 20, carb: 40, fat: 5 })).toEqual({ mass: 50, kcal: 20, protein: 0, carb: 10, fat: 5 })
  })

  it('IC bootstrap reproductible, qui contient la moyenne', () => {
    const diffs = [5, 7, 3, 9, 6, 4, 8, 5, 6, 7]
    const [low, high] = bootstrapMeanCI(diffs)
    expect(low).toBeLessThan(6)
    expect(high).toBeGreaterThan(6)
    expect(bootstrapMeanCI(diffs)).toEqual([low, high])
  })

  const row = (i, s, g) => ({ dish: `dish_${i}`, silver: { mass: s, kcal: s * 1.5, protein: 5, carb: 5, fat: 5 }, gold: g === null ? null : { mass: g, kcal: g * 1.5, protein: 5, carb: 5, fat: 5 } })

  it('confirme la promesse quand Gold se trompe nettement moins, avec un chiffre prudent', () => {
    const rows = Array.from({ length: 40 }, (_, i) => row(i, 100 + (i % 7) * 10, 50 + (i % 5) * 10))
    const s = summarize(rows)
    expect(s.pairs).toBe(40)
    expect(s.confirmed).toBe(true)
    expect(s.claimPercent).toBeGreaterThanOrEqual(10)
    // Le chiffre affiché ne dépasse jamais la réduction observée
    expect(s.claimPercent / 100).toBeLessThanOrEqual(s.metrics.mass.reduction)
    expect(s.claimPercent % 5).toBe(0)
    expect(markdownReport(s)).toContain('confirmé')
  })

  it('ne confirme rien quand les deux niveaux se valent', () => {
    const rows = Array.from({ length: 40 }, (_, i) => row(i, 100 + (i % 2 ? 20 : -20), 100 + (i % 2 ? -20 : 20)))
    const s = summarize(rows)
    expect(s.confirmed).toBe(false)
    expect(s.claimPercent).toBeNull()
    expect(markdownReport(s)).toContain('non confirmé')
  })

  it('pas de verdict sous 30 paires ; les mesures Gold manquantes sont écartées', () => {
    const rows = Array.from({ length: 40 }, (_, i) => row(i, 200, i < 15 ? 50 : null))
    const s = summarize(rows)
    expect(s.pairs).toBe(15)
    expect(s.enough).toBe(false)
    expect(s.confirmed).toBe(false)
    expect(markdownReport(s, { servedLite: 25 })).toContain('pas assez de paires')
  })

  it('le rapport ne nomme aucun modèle', () => {
    const md = markdownReport(summarize(Array.from({ length: 40 }, (_, i) => row(i, 120, 60))))
    expect(md).not.toMatch(/gemini|flash/i)
  })
})
