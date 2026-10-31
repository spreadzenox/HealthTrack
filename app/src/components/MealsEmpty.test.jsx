import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MealsEmpty from './MealsEmpty'

describe('MealsEmpty (POL-PLAY-88)', () => {
  beforeEach(() => localStorage.clear())

  it('montre trois étapes numérotées au lieu d’une phrase seule', () => {
    render(<MealsEmpty />)
    expect(screen.getByText(/Aucun repas enregistré/i)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('Comparés à votre ventre')).toBeInTheDocument()
  })

  it('ne parle pas du ventre si sa carte est masquée', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ goal: 'energy' }))
    render(<MealsEmpty />)
    expect(screen.getByText('Comparés à vos jours')).toBeInTheDocument()
    expect(screen.queryByText(/ventre/)).toBeNull()
  })
})
