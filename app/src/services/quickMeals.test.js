import { describe, it, expect } from 'vitest'
import { frequentMeals, mealLabel, mealTimeError } from './quickMeals'

const meal = (id, at, items, dish) => ({
  id,
  type: 'food',
  source: 'app_food',
  at,
  payload: { items: items.map(([ingredient, g]) => ({ ingredient, quantity: `${g} g`, quantity_g: g })), ...(dish ? { dish } : {}) },
})

describe('mealLabel', () => {
  it('utilise le nom du plat quand il existe', () => {
    expect(mealLabel({ dish: 'Pâtes au pesto', items: [{ ingredient: 'Pâtes' }] })).toBe('Pâtes au pesto')
  })

  it('sinon liste les 3 premiers ingrédients', () => {
    expect(mealLabel({ items: [{ ingredient: 'Riz' }, { ingredient: 'Poulet' }] })).toBe('Riz, Poulet')
    expect(mealLabel({
      items: [{ ingredient: 'A' }, { ingredient: 'B' }, { ingredient: 'C' }, { ingredient: 'D' }],
    })).toBe('A, B, C…')
  })

  it('raccourcit les noms détaillés de la base (partie avant la virgule)', () => {
    expect(mealLabel({
      items: [
        { ingredient: 'Poulet, cuisse, viande bouillie/cuite à l\'eau' },
        { ingredient: 'Pomme de terre, bouillie/cuite à l\'eau' },
        { ingredient: 'Haricot vert, cuit' },
      ],
    })).toBe('Poulet, Pomme de terre, Haricot vert')
  })

  it('renvoie « Repas » sans contenu exploitable', () => {
    expect(mealLabel(undefined)).toBe('Repas')
    expect(mealLabel({ items: [] })).toBe('Repas')
  })
})

describe('frequentMeals', () => {
  it('regroupe les repas aux mêmes ingrédients (ordre, casse et accents ignorés)', () => {
    const list = frequentMeals([
      meal(1, '2026-10-01T07:00:00Z', [['Café', 200], ['Pain', 60]]),
      meal(2, '2026-10-02T07:00:00Z', [['pain', 80], ['Cafe', 200]]),
      meal(3, '2026-10-02T12:00:00Z', [['Riz', 150]]),
    ])
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ count: 2, lastAt: '2026-10-02T07:00:00Z' })
    // Les grammes repris sont ceux de la fois la plus récente
    expect(list[0].items).toEqual([
      { ingredient: 'pain', quantity: '80 g', quantity_g: 80 },
      { ingredient: 'Cafe', quantity: '200 g', quantity_g: 200 },
    ])
    expect(list[1]).toMatchObject({ count: 1, label: 'Riz' })
  })

  it('classe par nombre de fois, puis du plus récent au plus ancien', () => {
    const list = frequentMeals([
      meal(1, '2026-10-01T12:00:00Z', [['Riz', 150]]),
      meal(2, '2026-10-05T12:00:00Z', [['Salade', 100]]),
      meal(3, '2026-10-03T12:00:00Z', [['Riz', 150]]),
      meal(4, '2026-10-04T12:00:00Z', [['Soupe', 300]]),
    ])
    expect(list.map((m) => m.label)).toEqual(['Riz', 'Salade', 'Soupe'])
  })

  it('garde le nom du plat le plus récent et limite le nombre de suggestions', () => {
    const entries = [
      meal(1, '2026-10-01T12:00:00Z', [['Riz', 150]], 'Riz blanc'),
      meal(2, '2026-10-02T12:00:00Z', [['Riz', 150]], 'Bol de riz'),
      ...[3, 4, 5, 6, 7].map((n) => meal(n, `2026-10-0${n}T12:00:00Z`, [[`Aliment ${n}`, 100]])),
    ]
    const list = frequentMeals(entries, { limit: 3 })
    expect(list).toHaveLength(3)
    expect(list[0]).toMatchObject({ label: 'Bol de riz', dish: 'Bol de riz', count: 2 })
  })

  it('ignore les entrées sans ingrédient et les autres types', () => {
    expect(frequentMeals([
      { id: 1, type: 'food', at: '2026-10-01T12:00:00Z', payload: { items: [] } },
      { id: 2, type: 'food', at: '2026-10-01T12:00:00Z', payload: {} },
      { id: 3, type: 'wellbeing', at: '2026-10-01T12:00:00Z', payload: { score: 4 } },
      { id: 4, type: 'food', at: '2026-10-01T12:00:00Z', payload: { items: [{ ingredient: '  ' }] } },
    ])).toEqual([])
    expect(frequentMeals(undefined)).toEqual([])
  })

  it('calcule les kcal connues du repas', () => {
    const [m] = frequentMeals([meal(1, '2026-10-01T12:00:00Z', [['Abondance', 100]])])
    expect(m.kcal).toBe(393)
  })
})

describe('mealTimeError', () => {
  const now = new Date('2026-10-09T18:00:00Z').getTime()

  it('accepte une heure passée ou à peine dans le futur (saisie à la minute)', () => {
    expect(mealTimeError('2026-10-09T10:00:00.000Z', now)).toBeNull()
    expect(mealTimeError('2026-10-09T18:03:00.000Z', now)).toBeNull()
  })

  it('refuse une heure invalide ou dans le futur', () => {
    expect(mealTimeError(null, now)).toBe('Heure invalide.')
    expect(mealTimeError('2026-10-09T20:00:00.000Z', now)).toMatch(/futur/)
  })
})
