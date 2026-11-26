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
  it('le chevron dit en mots simples si c’est un peu ou bien plus que ce qui gêne certaines personnes (25/11)', () => {
    render(<MealFodmapLine items={[{ ingredient: 'Pomme', quantity_g: 150 }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les détails' }))
    expect(screen.getByText('Un peu plus que ce qui gêne certaines personnes.')).toBeTruthy()
    expect(screen.getByTestId('meal-fodmap-note').textContent).toMatch(/vos repas et votre confort digestif diront ce qu’il en est pour vous\.$/)
    // Les grammes restent, en petit, avec les sources (pour qui veut creuser).
    expect(screen.getByTestId('meal-fodmap-sources').textContent).toMatch(/Sorbitol : environ 0,75 g, repère 0,4 g\. /)
  })
  it('bien plus que le repère (3 fois ou plus) : « Bien plus », sans gramme dans la phrase (25/11)', () => {
    render(<MealFodmapLine items={[{ ingredient: 'Oignon, cru', quantity_g: 70 }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les détails' }))
    expect(screen.getByText('Bien plus que ce qui gêne certaines personnes.')).toBeTruthy()
    const list = screen.getByTestId('meal-fodmap').querySelector('.meal-fodmap-list').textContent
    expect(list).not.toMatch(/\d|repère|mesures publiées/)
  })
  it('mesures publiées divergentes : une fourchette et les deux sources (N3d)', () => {
    render(<MealFodmapLine items={[{ ingredient: 'Oignon, cru', quantity_g: 70 }]} />)
    expect(screen.getByText('Riche en fructanes')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les détails' }))
    expect(screen.getByTestId('meal-fodmap-sources').textContent).toMatch(/^Fructanes : 1,4 à 4,4 g selon les mesures, repère 0,3 g\. /)
    expect(screen.getByText(/Teneurs : Ferjančič 2024, Liljebo 2020\./)).toBeTruthy()
  })
  it('80 g de baguette : plus jamais dits pauvres, « probablement riche en fructanes » (N3d)', () => {
    render(<MealFodmapLine items={[{ ingredient: 'Pain blanc (par ex. : baguette, boule…)', quantity_g: 80 }]} />)
    expect(screen.getByText('Probablement riche en fructanes')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les détails' }))
    expect(screen.getByText('Peut-être plus que ce qui gêne certaines personnes : les mesures varient.')).toBeTruthy()
    expect(screen.getByTestId('meal-fodmap-sources').textContent).toMatch(/0,11 à 0,82 g selon les mesures/)
  })
  it('lentilles cuites : « probablement riche en GOS », source citée avec le calcul depuis le sec', () => {
    render(<MealFodmapLine items={[{ ingredient: 'Lentilles cuites', quantity_g: 150 }]} />)
    expect(screen.getByText('Probablement riche en GOS')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les détails' }))
    expect(screen.getByText(/Teneurs : .*Siva 2019 \(pertes : Njoumi 2019\)/)).toBeTruthy()
  })
  it('détails en mots simples : où se trouve le groupe, puis les sources sur une ligne à part (POLISH-SIM-77)', () => {
    render(<MealFodmapLine items={[{ ingredient: 'Oignon, cru', quantity_g: 70 }, { ingredient: 'Lentilles cuites', quantity_g: 150 }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les détails' }))
    const note = screen.getByTestId('meal-fodmap-note').textContent
    expect(note).toBe('Certaines personnes digèrent mal les fructanes (blé, oignon, ail) ou les GOS (pois chiches, lentilles), '
      + 'd’autres très bien : vos repas et votre confort digestif diront ce qu’il en est pour vous.')
    expect(note).not.toMatch(/Varney|Ferjančič|\d{4}/)
    const sources = screen.getByTestId('meal-fodmap-sources').textContent
    expect(sources).toMatch(/Repères de départ : Varney 2017\. Teneurs : .*Ferjančič 2024.*\.$/)
    expect(screen.getByTestId('meal-fodmap').textContent).not.toMatch(/≈|·/)
  })
  it('plusieurs groupes : une phrase simple, les groupes derrière « Détails » (UPG-9)', () => {
    render(<MealFodmapLine items={[
      { ingredient: 'Oignon, cru', quantity_g: 70 },
      { ingredient: 'Lentilles cuites', quantity_g: 150 },
      { ingredient: 'Pomme', quantity_g: 150 },
    ]} />)
    const card = screen.getByTestId('meal-fodmap')
    expect(screen.getByTestId('meal-fodmap-summary').textContent).toBe('Parfois mal digérés oignon, lentilles cuites, pomme')
    expect(card.textContent).not.toMatch(/fructanes|GOS|fructose|Riche/)
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les détails' }))
    expect(screen.getByText('Riche en fructanes')).toBeTruthy()
    expect(screen.getByText('Probablement riche en GOS')).toBeTruthy()
    expect(screen.getByText('Riche en fructose en excès')).toBeTruthy()
  })
  it('un seul groupe : la ligne « Riche en … » reste visible d’emblée (N4)', () => {
    render(<MealFodmapLine items={[{ ingredient: 'Oignon, cru', quantity_g: 70 }]} />)
    expect(screen.queryByTestId('meal-fodmap-summary')).toBeNull()
  })
  it('rien quand aucun groupe ne dépasse son repère ou sans ingrédients', () => {
    const { container, rerender } = render(<MealFodmapLine items={[{ ingredient: 'Riz blanc cuit', quantity_g: 150 }]} />)
    expect(container.textContent).toBe('')
    rerender(<MealFodmapLine items={undefined} />)
    expect(container.textContent).toBe('')
  })
})
