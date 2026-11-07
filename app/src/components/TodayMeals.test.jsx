import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TodayMeals from './TodayMeals'
import { mealTitle } from '../services/mealEditing'

const NOW = new Date(2026, 10, 7, 20)
const at = (d, h) => new Date(2026, 10, d, h).toISOString()
const wrap = (entries) => render(<BrowserRouter><TodayMeals entries={entries} now={NOW} /></BrowserRouter>)

describe('TodayMeals — « Mes repas du jour » (AUJ-5)', () => {
  it('liste les repas du jour dans l’ordre, chacun vers Journal › Repas', () => {
    wrap([
      { id: 2, type: 'food', at: at(7, 19), payload: { dish: 'Soupe' } },
      { id: 1, type: 'food', at: at(7, 12), payload: { items: [{ name: 'Riz' }, { name: 'Poulet' }] } },
      { id: 3, type: 'food', at: at(6, 12), payload: { dish: 'Hier' } },
    ])
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveTextContent('Riz, Poulet')
    expect(links[1]).toHaveTextContent('Soupe')
    expect(links[0]).toHaveAttribute('href', '/food')
    expect(screen.queryByText('Hier')).toBeNull()
  })

  it('sans repas : « Aucun repas aujourd’hui » et un bouton qui ouvre l’appareil photo', () => {
    wrap([{ type: 'food', at: at(6, 12), payload: { dish: 'Hier' } }])
    expect(screen.getByText('Aucun repas aujourd’hui')).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: 'Photographier un repas' })
    expect(document.getElementById(btn.getAttribute('for'))).toHaveAttribute('capture', 'environment')
  })

  it('le titre d’un repas : le plat, sinon ses aliments, sinon « Repas »', () => {
    expect(mealTitle({ payload: { dish: 'Pâtes' } })).toBe('Pâtes')
    expect(mealTitle({ payload: { items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }] } })).toBe('a, b, c…')
    expect(mealTitle({ payload: {} })).toBe('Repas')
  })
})
