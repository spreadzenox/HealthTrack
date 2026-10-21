import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Trends from './Trends'

// Les blocs eux-mêmes ont leurs propres tests (ils lisent IndexedDB de leur côté)
vi.mock('../components/FormeSection', () => ({ default: () => <section data-testid="forme-section" /> }))
vi.mock('../components/WellbeingCharts', () => ({ default: () => <section data-testid="wellbeing-charts" /> }))

describe('Journal → Tendances (forme et courbes, déplacées de l’accueil, jalon 2b)', () => {
  it('montre les sous-onglets du Journal, le titre et les deux blocs', () => {
    render(
      <MemoryRouter initialEntries={['/tendances']}>
        <Trends />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: 'Tendances' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { name: 'Vos tendances' })).toBeInTheDocument()
    expect(screen.getByTestId('forme-section')).toBeInTheDocument()
    expect(screen.getByTestId('wellbeing-charts')).toBeInTheDocument()
  })
})
