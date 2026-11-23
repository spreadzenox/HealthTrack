import { describe, it, expect } from 'vitest'
import table from '../../src/data/ingredientsNutrition.json'
import { buildIndex, fakeMealFromDescription, DEFAULT_MEAL } from './fakeMeal.mjs'

const index = buildIndex(Object.keys(table))

describe('fakeMealFromDescription (PERSONAS-OUTIL-2)', () => {
  it('reprend les mots de la description, pas un plat fixe', () => {
    const meal = fakeMealFromDescription('2 tartines de pain, café et banane', index)
    expect(meal.dish).toBe('2 tartines de pain, café et banane')
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
})
