import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import JournalEmpty from './JournalEmpty'
import { saveOnboarding } from '../settings/onboarding'

const renderEmpty = () => render(<MemoryRouter><JournalEmpty /></MemoryRouter>)

describe('JournalEmpty (Journal vierge en couleur, POL-PLAY-46)', () => {
  beforeEach(() => localStorage.clear())

  it('offers a meal photo, a gut note and a source, each a coloured tile', () => {
    saveOnboarding({ goal: 'gut' })
    renderEmpty()
    expect(screen.getByText('Rien de noté pour l’instant')).toBeInTheDocument()
    const meal = screen.getByRole('link', { name: /Photographier un repas/ })
    expect(meal).toHaveAttribute('href', '/food')
    expect(meal).toHaveAttribute('data-theme', 'peach')
    expect(screen.getByRole('link', { name: /Noter votre ventre/ })).toHaveAttribute('href', '/')
    const source = screen.getByRole('link', { name: /Ajouter une source/ })
    expect(source).toHaveAttribute('href', '/connectors')
    expect(source).toHaveAttribute('data-theme', 'lilac')
  })

  it('without the gut card on Today, points to the well-being note instead of the belly', () => {
    saveOnboarding({ goal: 'energy' })
    renderEmpty()
    expect(screen.queryByText(/ventre/)).not.toBeInTheDocument()
    const wellbeing = screen.getByRole('button', { name: /Noter votre bien-être/ })
    expect(wellbeing).toHaveAttribute('data-theme', 'mint')
  })

  it('the well-being tile opens the note in place instead of sending to Today (POL-PLAY-87)', async () => {
    saveOnboarding({ goal: 'energy' })
    renderEmpty()
    fireEvent.click(screen.getByRole('button', { name: /Noter votre bien-être/ }))
    expect(await screen.findByRole('dialog', { name: /Comment vous sentez-vous/ })).toBeInTheDocument()
  })
})
