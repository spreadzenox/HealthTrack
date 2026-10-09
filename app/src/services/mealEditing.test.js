import { describe, it, expect } from 'vitest'
import {
  matchIngredientName,
  searchIngredients,
  normalizeMealItem,
  itemKcal,
  mealKcal,
  setItemGrams,
} from './mealEditing.js'

describe('matchIngredientName', () => {
  it('garde un nom exact de la base', () => {
    expect(matchIngredientName('Abondance')).toBe('Abondance')
  })
  it('retrouve un nom malgré la casse, les accents et les espaces', () => {
    expect(matchIngredientName('  abricot, denoyaute,   cru ')).toBe('Abricot, dénoyauté, cru')
    expect(matchIngredientName('riz blanc, cuit')).toBe('Riz blanc cuit')
  })
  it('renvoie null pour un nom inconnu ou vide', () => {
    expect(matchIngredientName('Zorglub au caramel')).toBeNull()
    expect(matchIngredientName('')).toBeNull()
    expect(matchIngredientName(null)).toBeNull()
  })
})

describe('searchIngredients', () => {
  it('trouve les ingrédients contenant tous les mots, sans accents', () => {
    const res = searchIngredients('abricot sec', 5)
    expect(res.length).toBeGreaterThan(0)
    expect(res.length).toBeLessThanOrEqual(5)
    for (const name of res) expect(name.toLowerCase()).toContain('abricot')
    expect(res).toContain('Abricot, dénoyauté, sec')
  })
  it('classe en premier les noms qui commencent par la requête, puis les plus courts', () => {
    const res = searchIngredients('abricot', 3)
    expect(res[0].startsWith('Abricot')).toBe(true)
    expect(res[0].length).toBeLessThanOrEqual(res[1].length)
  })
  it('ne renvoie rien pour une requête de moins de 2 caractères', () => {
    expect(searchIngredients('a')).toEqual([])
    expect(searchIngredients('  ')).toEqual([])
  })
})

describe('normalizeMealItem', () => {
  it('corrige le nom, arrondit les grammes et refait le libellé de quantité', () => {
    expect(normalizeMealItem({ ingredient: 'abondance', quantity_g: '42.4', confidence: 'low' })).toEqual({
      ingredient: 'Abondance',
      quantity: '42 g',
      quantity_g: 42,
      confidence: 'low',
    })
  })
  it('signale un ingrédient absent de la base sans le perdre', () => {
    const it0 = normalizeMealItem({ ingredient: 'Zorglub', quantity_g: 30 })
    expect(it0.ingredient).toBe('Zorglub')
    expect(it0.unknown).toBe(true)
  })
  it('accepte une quantité absente', () => {
    const it0 = normalizeMealItem({ ingredient: 'Abondance' })
    expect(it0.quantity).toBe('portion non précisée')
    expect(it0.quantity_g).toBeUndefined()
  })
  it('ignore une confiance inconnue', () => {
    expect(normalizeMealItem({ ingredient: 'Abondance', quantity_g: 10, confidence: 'sure' }).confidence).toBeUndefined()
  })
})

describe('kcal', () => {
  it('calcule les kcal d’un ingrédient à partir des valeurs pour 100 g', () => {
    // Abondance : 393 kcal / 100 g
    expect(itemKcal({ ingredient: 'Abondance', quantity_g: 50 })).toBe(197)
  })
  it('renvoie null si l’ingrédient est inconnu ou sans grammes', () => {
    expect(itemKcal({ ingredient: 'Zorglub', quantity_g: 50 })).toBeNull()
    expect(itemKcal({ ingredient: 'Abondance' })).toBeNull()
  })
  it('additionne les kcal du repas', () => {
    expect(mealKcal([
      { ingredient: 'Abondance', quantity_g: 100 },
      { ingredient: 'Abondance', quantity_g: 50 },
      { ingredient: 'Zorglub', quantity_g: 50 },
    ])).toBe(590)
    expect(mealKcal([])).toBe(0)
  })
})

describe('setItemGrams', () => {
  it('met à jour les grammes et le libellé', () => {
    expect(setItemGrams({ ingredient: 'Abondance', quantity: '10 g', quantity_g: 10 }, '125')).toMatchObject({
      quantity_g: 125,
      quantity: '125 g',
    })
  })
  it('borne les grammes entre 0 et 5000 et accepte la virgule', () => {
    expect(setItemGrams({ ingredient: 'Abondance' }, '12,6').quantity_g).toBe(13)
    expect(setItemGrams({ ingredient: 'Abondance' }, '-4').quantity_g).toBe(0)
    expect(setItemGrams({ ingredient: 'Abondance' }, '99999').quantity_g).toBe(5000)
  })
  it('vide la quantité si la saisie est vide', () => {
    const r = setItemGrams({ ingredient: 'Abondance', quantity_g: 10, quantity: '10 g' }, '')
    expect(r.quantity_g).toBeUndefined()
    expect(r.quantity).toBe('portion non précisée')
  })
})
