import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NoteSection from './NoteSection'

const view = (props) => render(<MemoryRouter><NoteSection onWellbeing={() => {}} {...props} /></MemoryRouter>)

describe('NoteSection (TESTEUR-1d) : un seul endroit pour noter', () => {
  it('titre « Noter », « Photo du repas » d’abord, puis « Mon bien-être » en menthe', () => {
    const onWellbeing = vi.fn()
    view({ onWellbeing })
    const region = screen.getByRole('region', { name: 'Noter' })
    const [photo, wellbeing] = within(region).getAllByRole('button')
    expect(photo).toHaveTextContent('Photo du repas')
    expect(wellbeing).toHaveTextContent('Mon bien-être')
    expect(wellbeing).toHaveClass('is-wellbeing')
    fireEvent.click(wellbeing)
    expect(onWellbeing).toHaveBeenCalledTimes(1)
  })

  it('la carte ventre n’apparaît que si on la donne ; « Autre chose » seulement s’il y a un geste', () => {
    view({})
    expect(screen.queryByRole('group', { name: 'Autre chose' })).not.toBeInTheDocument()
  })

  it('ventre et autres gestes à leur place, dans la section', () => {
    view({ gut: <section data-testid="gut" />, other: <button type="button">+ 1 cigarette</button> })
    const region = screen.getByRole('region', { name: 'Noter' })
    expect(within(region).getByTestId('gut')).toBeInTheDocument()
    const other = within(region).getByRole('group', { name: 'Autre chose' })
    expect(within(other).getByRole('button', { name: '+ 1 cigarette' })).toBeInTheDocument()
  })

  it('false ou null ne laissent pas de cadre vide', () => {
    view({ gut: false, other: false })
    expect(screen.queryByRole('group', { name: 'Autre chose' })).not.toBeInTheDocument()
  })
})
