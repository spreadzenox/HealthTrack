import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import YesterdayHabits from './YesterdayHabits'

const catchUp = { dateKey: '2026-11-15', title: 'Hier, dimanche', pending: [
  { id: 'meditation', label: 'Méditation' }, { id: 'reading', label: 'Lecture' }] }

describe('YesterdayHabits', () => {
  it('pose les questions d’hier en Oui / Non et répond pour la veille', () => {
    const onAnswer = vi.fn()
    render(<YesterdayHabits catchUp={catchUp} onAnswer={onAnswer} onSkip={() => {}} />)
    expect(screen.getByText('Hier, dimanche')).toBeInTheDocument()
    expect(screen.getByText('2 questions, si vous voulez.')).toBeInTheDocument()
    const med = screen.getByRole('group', { name: 'Méditation' })
    fireEvent.click(med.querySelector('button'))
    expect(onAnswer).toHaveBeenCalledWith(catchUp.pending[0], true, '2026-11-15')
  })

  it('une seule question au singulier, et Passer', () => {
    const onSkip = vi.fn()
    render(<YesterdayHabits catchUp={{ ...catchUp, pending: [catchUp.pending[1]] }} onAnswer={() => {}} onSkip={onSkip} />)
    expect(screen.getByText('Une question, si vous voulez.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Passer' }))
    expect(onSkip).toHaveBeenCalledWith('2026-11-15')
  })

  it('rien sans rattrapage', () => {
    const { container } = render(<YesterdayHabits catchUp={null} onAnswer={() => {}} onSkip={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
