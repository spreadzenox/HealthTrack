import { describe, it, expect } from 'vitest'
import table from '../../src/data/ingredientsNutrition.json'
import { buildIndex, fakeMealFromDescription, DEFAULT_MEAL } from './fakeMeal.mjs'

const index = buildIndex(Object.keys(table))

describe('fakeMealFromDescription (PERSONAS-OUTIL-2)', () => {
  it('reprend les mots de la description, pas un plat fixe', () => {
    const meal = fakeMealFromDescription('2 tartines de pain, café et banane', index)
    expect(meal.dish).toBe('Tartines de pain')
    const names = meal.ingredients.map((i) => i.ingredient)
    expect(names.some((n) => n.startsWith('Pain'))).toBe(true)
    expect(names).toContain('Café')
    expect(names).toContain('Banane')
    expect(names.join()).not.toMatch(/Lardon|Parmesan/)
  })

  it('chaque aliment rendu existe dans la table nutritionnelle', () => {
    const meal = fakeMealFromDescription('riz, poulet, yaourt avec confiture', index)
    expect(meal.ingredients.length).toBeGreaterThanOrEqual(3)
    for (const { ingredient, quantity_g } of meal.ingredients) {
      expect(table[ingredient]).toBeTruthy()
      expect(quantity_g).toBeGreaterThan(0)
    }
  })

  it('le nombre devant un aliment fait la quantité, sans dépasser 5 portions', () => {
    const [pain] = fakeMealFromDescription('2 pains', index).ingredients
    expect(pain.quantity_g).toBe(200)
    expect(fakeMealFromDescription('40 pains', index).ingredients[0].quantity_g).toBe(500)
  })

  it('rien de reconnu, ou description vide : le plat de démonstration', () => {
    expect(fakeMealFromDescription('zzz qwerty', index)).toEqual(DEFAULT_MEAL)
    expect(fakeMealFromDescription('', index)).toEqual(DEFAULT_MEAL)
  })

  // PERSONAS-OUTIL-3 (personas du 23/11 20:30)
  it('« pâtes » donne des pâtes, pas du pâté ; « pates » sans accent aussi', () => {
    expect(fakeMealFromDescription('pâtes', index).ingredients[0].ingredient).toBe('Pâtes cuites')
    expect(fakeMealFromDescription('pates', index).ingredients[0].ingredient).toBe('Pâtes cuites')
    expect(fakeMealFromDescription('pâté', index).ingredients[0].ingredient).toMatch(/^Pâté/)
  })

  it('les grammes écrits font la quantité', () => {
    const [saumon, riz] = fakeMealFromDescription('200 g de saumon et 1,5 kg de riz', index).ingredients
    expect(saumon.ingredient).toMatch(/^Saumon/)
    expect(saumon.quantity_g).toBe(200)
    expect(riz.quantity_g).toBe(1500)
    expect(fakeMealFromDescription('250g de pâtes', index).ingredients[0].quantity_g).toBe(250)
  })

  it('le nom du plat est court, pas la description entière', () => {
    const meal = fakeMealFromDescription('200 g de saumon, riz et haricots verts avec une sauce au citron', index)
    expect(meal.dish).toBe('Saumon')
  })
})
