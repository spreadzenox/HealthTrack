import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HabitsSetting from './HabitsSetting'
import { getHabits, setHabits } from '../settings/habits'

describe('Réglages › Vos habitudes (refonte étape 4)', () => {
  beforeEach(() => localStorage.clear())

  it('propose les quatre habitudes, aucune cochée d’avance', () => {
    render(<HabitsSetting />)
    for (const label of ['Méditation', 'Étirements', 'Relaxation', 'Lecture']) {
      expect(screen.getByRole('checkbox', { name: label })).not.toBeChecked()
    }
    expect(screen.getByText(/ce n’est pas une liste de bonnes résolutions/)).toBeInTheDocument()
  })

  it('cocher et décocher règle la liste suivie', () => {
    render(<HabitsSetting />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Lecture' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Méditation' }))
    expect(getHabits().map((h) => h.id)).toEqual(['meditation', 'reading'])
    fireEvent.click(screen.getByRole('checkbox', { name: 'Lecture' }))
    expect(getHabits().map((h) => h.id)).toEqual(['meditation'])
  })

  it('une habitude libre se nomme, se renomme et se retire en vidant le champ', () => {
    setHabits([{ id: 'reading' }])
    render(<HabitsSetting />)
    const field = screen.getByLabelText('Une autre habitude')
    fireEvent.change(field, { target: { value: 'Marche du soir' } })
    expect(getHabits()).toEqual([{ id: 'reading', label: 'Lecture' }, { id: 'custom:marche-du-soir', label: 'Marche du soir' }])
    fireEvent.change(field, { target: { value: '' } })
    expect(getHabits()).toEqual([{ id: 'reading', label: 'Lecture' }])
  })

  it('retrouve l’habitude libre déjà suivie', () => {
    setHabits([{ id: 'custom:piano', label: 'Piano' }])
    render(<HabitsSetting />)
    expect(screen.getByLabelText('Une autre habitude')).toHaveValue('Piano')
  })
})
