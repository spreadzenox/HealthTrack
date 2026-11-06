import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MealHoursHorizon } from './Horizon'

describe('MealHoursHorizon — bien-être dans les heures après un repas (ANALYSES-ONGLETS-5)', () => {
  it('rien sans lecture du visage ni repas noté', () => {
    const { container: a } = render(<MealHoursHorizon result={{ status: 'no_face' }} />)
    const { container: b } = render(<MealHoursHorizon result={{ status: 'no_meals' }} />)
    const { container: c } = render(<MealHoursHorizon result={undefined} />)
    expect(a.innerHTML + b.innerHTML + c.innerHTML).toBe('')
  })

  it('pas assez de jours : une ligne discrète avec le compteur, sous « Dans les heures »', () => {
    render(<MealHoursHorizon result={{ status: 'not_enough_data', currentDays: 4, minDays: 10 }} />)
    expect(screen.getByTestId('horizon-hours')).toHaveTextContent('Dans les heures')
    expect(screen.getByText(/arrive avec 10 jours de lectures du visage/)).toBeInTheDocument()
    expect(screen.getByText(/4 \/ 10/)).toBeInTheDocument()
  })

  it('écart net : dit le sens tel quel, avec le chiffre et le nombre de jours', () => {
    const { rerender } = render(<MealHoursHorizon result={{ status: 'ok', days: 14, shift: 0.23, p: 0.01, clear: true }} />)
    expect(screen.getByTestId('meal-hours')).toHaveTextContent(/un peu plus haut que le reste de la journée/)
    expect(screen.getByTestId('meal-hours')).toHaveTextContent(/\+0,2 point · 14 jours/)
    rerender(<MealHoursHorizon result={{ status: 'ok', days: 12, shift: -0.3, p: 0.02, clear: true }} />)
    expect(screen.getByTestId('meal-hours')).toHaveTextContent(/un peu plus bas/)
  })

  it('écart pas net : le dit simplement, sans chiffre d’écart', () => {
    render(<MealHoursHorizon result={{ status: 'ok', days: 14, shift: 0.08, p: 0.4, clear: false }} />)
    expect(screen.getByTestId('meal-hours')).toHaveTextContent('Pas de différence nette')
    expect(screen.getByTestId('meal-hours')).not.toHaveTextContent('point')
  })
})
