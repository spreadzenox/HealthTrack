import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MealFodmapLine from './MealFodmapLine'
import { loadNutritionTable } from '../data/nutritionTable'

beforeAll(() => loadNutritionTable())

describe('MealFodmapLine — FODMAP par sous-groupe sur la carte d’un repas (N4)', () => {
  it('dit simplement quel groupe dépasse le repère et quel aliment l’apporte', () => {
    render(<MealFodmapLine items={[{ ingredient: 'Oignon, cru', quantity_g: 70 }, { ingredient: 'Riz blanc cuit', quantity_g: 150 }]} />)
    expect(screen.getByText('Riche en fructanes')).toBeTruthy()
    expect(screen.getByTestId('meal-fodmap').textContent).toMatch(/Riche en fructanes oignon$/)
    expect(screen.queryByText(/repère/)).toBeNull()
  })
  it('« probablement » quand seule une valeur à confiance basse dépasse le repère', () => {
    render(<MealFodmapLine items={[{ ingredient: 'Ail, cru', quantity_g: 3 }]} />)
    expect(screen.getByText('Probablement riche en fructanes')).toBeTruthy()
  })
  it('le chevron montre les grammes, le repère de départ et l’origine des teneurs', () => {
    render(<MealFodmapLine items={[{ ingredient: 'Oignon, cru', quantity_g: 70 }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les détails' }))
    expect(screen.getByText(/≈ 1,4 g · repère 0,3 g par repas/)).toBeTruthy()
    expect(screen.getByText(/hypothèse de départ : vos propres données priment/)).toBeTruthy()
  })
  it('rien quand aucun groupe ne dépasse son repère ou sans ingrédients', () => {
    const { container, rerender } = render(<MealFodmapLine items={[{ ingredient: 'Riz blanc cuit', quantity_g: 150 }]} />)
    expect(container.textContent).toBe('')
    rerender(<MealFodmapLine items={undefined} />)
    expect(container.textContent).toBe('')
  })
})
