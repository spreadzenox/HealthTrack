import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DayChecklist from './DayChecklist'

const at = (h, m = 0) => new Date(2026, 10, 15, h, m).toISOString()
const meal = (h, dish) => ({ id: `m${h}`, type: 'food', at: at(h), payload: { dish } })
const NOON = new Date(2026, 10, 15, 12, 0)
const EVENING = new Date(2026, 10, 15, 20, 0)
const note = { id: 'w', type: 'wellbeing', at: at(9), payload: { score: 4 } }
const bilan = { id: 'g', type: 'gut', at: at(19, 30), payload: { level: 'calm', scope: 'day' } }

function show(props) {
  const p = { entries: [], askGut: false, now: NOON, onWellbeing: vi.fn(), onGut: vi.fn(), ...props }
  const utils = render(<MemoryRouter><DayChecklist {...p} /></MemoryRouter>)
  return { ...utils, props: p, again: (next) => utils.rerender(<MemoryRouter><DayChecklist {...p} {...next} /></MemoryRouter>) }
}

describe('DayChecklist (refonte étape 3)', () => {
  it('journée vide : « Encore 2 choses aujourd’hui », les trois cercles des repas et « Noter » le bien-être', () => {
    const { props } = show()
    expect(screen.getByText('Encore 2 choses aujourd’hui')).toBeInTheDocument()
    const meals = screen.getByRole('group', { name: 'Repas' })
    for (const label of ['Matin', 'Midi', 'Soir']) {
      expect(within(meals).getByRole('button', { name: `${label} : photographier le repas` })).toBeInTheDocument()
    }
    fireEvent.click(within(screen.getByRole('group', { name: 'Bien-être' })).getByRole('button', { name: 'Noter' }))
    expect(props.onWellbeing).toHaveBeenCalled()
    expect(screen.queryByText(/digestion/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Déjà noté/)).not.toBeInTheDocument()
  })

  it('une seule chose restante s’écrit au singulier', () => {
    show({ entries: [note] })
    expect(screen.getByText('Encore 1 chose aujourd’hui')).toBeInTheDocument()
  })

  it('un repas noté remplit son cercle, qui mène aux repas ; les autres ouvrent l’appareil photo', () => {
    show({ entries: [meal(8, 'Tartines')] })
    const meals = screen.getByRole('group', { name: 'Repas' })
    expect(within(meals).getByRole('link', { name: 'Matin : noté' })).toHaveAttribute('href', '/food')
    expect(within(meals).getByRole('button', { name: 'Midi : photographier le repas' })).toBeInTheDocument()
    expect(within(meals).getByText('1 sur 3')).toBeInTheDocument()
  })

  it('avec l’objectif digestion, le ventre attend 18 h puis ouvre le bilan du jour', () => {
    const before = show({ askGut: true })
    const line = screen.getByRole('group', { name: 'Votre digestion ce soir' })
    expect(within(line).getByText('À partir de 18 h')).toBeInTheDocument()
    expect(within(line).queryByRole('button')).not.toBeInTheDocument()
    before.unmount()
    const { props } = show({ askGut: true, now: EVENING })
    fireEvent.click(within(screen.getByRole('group', { name: 'Votre digestion ce soir' })).getByRole('button', { name: 'Noter' }))
    expect(props.onGut).toHaveBeenCalled()
  })

  it('une ligne faite part de la liste et passe dans « Déjà noté », que l’on ouvre pour modifier', async () => {
    const { again, props } = show({ entries: [] })
    again({ entries: [note] })
    expect(screen.getByRole('status')).toHaveTextContent('Bien-être : noté. Encore 1 chose aujourd’hui.')
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Bien-être' })).not.toBeInTheDocument(), { timeout: 2000 })
    const toggle = screen.getByRole('button', { name: 'Déjà noté (1)' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    fireEvent.click(screen.getByRole('button', { name: /Bien-être.*4 sur 5/ }))
    expect(props.onWellbeing).toHaveBeenCalled()
  })

  it('tout est noté : « Plus rien à faire », sans liste de tâches', () => {
    show({ entries: [meal(8, 'Tartines'), meal(13, 'Salade'), meal(19, 'Soupe'), note, bilan], askGut: true, now: EVENING })
    expect(screen.getByRole('heading', { name: 'Plus rien à faire' })).toBeInTheDocument()
    expect(screen.getByText('Tout est noté pour aujourd’hui.')).toBeInTheDocument()
    expect(screen.queryByText(/Encore/)).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Repas' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Déjà noté (5)' }))
    expect(screen.getByRole('link', { name: /Salade/ })).toHaveAttribute('href', '/food')
    expect(screen.getByRole('button', { name: /Digestion du jour.*Calme/ })).toBeInTheDocument()
  })

  it('aucune calorie dans Ma journée', () => {
    show({ entries: [{ ...meal(8, 'Tartines'), payload: { dish: 'Tartines', items: [{ name: 'Pain', kcal: 200 }] } }] })
    fireEvent.click(screen.getByRole('button', { name: 'Déjà noté (1)' }))
    expect(screen.queryByText(/kcal/)).not.toBeInTheDocument()
  })
})
