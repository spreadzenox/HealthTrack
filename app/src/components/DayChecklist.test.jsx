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

  it('« Vos repas » sous les cercles mène à tous les repas, même avant le premier du jour (POLISH-SIM-137)', () => {
    show()
    const meals = screen.getByRole('group', { name: 'Repas' })
    expect(within(meals).getByRole('link', { name: 'Vos repas' })).toHaveAttribute('href', '/food')
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

  it('une gêne notée le matin : la ligne du soir la cite comme un moment et « Déjà noté » la montre (POLISH-SIM-123, 139)', () => {
    const gene = { id: 'g1', type: 'gut', at: at(8, 35), payload: { level: 'discomfort' } }
    const { props } = show({ askGut: true, entries: [gene], now: new Date(2026, 10, 15, 8, 40) })
    const line = screen.getByRole('group', { name: 'Votre digestion ce soir' })
    expect(within(line).getByText('Dans la journée : gêne à 08:35')).toBeInTheDocument()
    expect(within(line).queryByText(/Noté à/)).not.toBeInTheDocument()
    expect(within(line).getByText('À partir de 18 h')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Déjà noté (1)' }))
    fireEvent.click(screen.getByRole('button', { name: /08:35.*Digestion · Gêne/ }))
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
    expect(screen.getByRole('heading', { name: 'Plus rien à faire, bravo !' })).toBeInTheDocument()
    expect(screen.getByText('Tout est noté pour aujourd’hui. Pilou garde vos bulles jusqu’à demain.')).toBeInTheDocument()
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

describe('DayChecklist : habitudes (refonte étape 4)', () => {
  const habits = [{ id: 'meditation', label: 'Méditation' }, { id: 'reading', label: 'Lecture' }]
  const answer = (habit, done) => ({ id: `h-${habit.id}`, type: 'habit', at: at(12, 1), payload: { habit: habit.id, label: habit.label, done } })

  it('une ligne miel par habitude, avec « Oui » et « Non » de même poids', () => {
    const onHabit = vi.fn()
    show({ habits, onHabit })
    expect(screen.getByText('Encore 4 choses aujourd’hui')).toBeInTheDocument()
    const line = screen.getByRole('group', { name: 'Méditation' })
    expect(line).toHaveAttribute('data-tone', 'honey')
    const [oui, non] = within(line).getAllByRole('button')
    expect(oui).toHaveTextContent('Oui')
    expect(non).toHaveTextContent('Non')
    expect(oui.className).toBe(non.className)
    fireEvent.click(oui)
    expect(onHabit).toHaveBeenCalledWith(habits[0], true)
    fireEvent.click(within(screen.getByRole('group', { name: 'Lecture' })).getByRole('button', { name: 'Non' }))
    expect(onHabit).toHaveBeenCalledWith(habits[1], false)
  })

  it('« non » fait partir la ligne comme « oui », avec le même mot', async () => {
    const { again } = show({ habits, onHabit: vi.fn() })
    again({ entries: [answer(habits[1], false)] })
    const line = screen.getByRole('group', { name: 'Lecture' })
    expect(line.className).toContain('is-leaving')
    expect(within(line).getByText('Noté')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Lecture : noté. Encore 3 choses aujourd’hui.')
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Lecture' })).not.toBeInTheDocument(), { timeout: 2000 })
  })

  it('« Déjà noté » dit la réponse et permet de la changer', () => {
    const onHabitUndo = vi.fn()
    const done = answer(habits[0], true)
    show({ habits, entries: [done, answer(habits[1], false)], onHabit: vi.fn(), onHabitUndo })
    fireEvent.click(screen.getByRole('button', { name: /Déjà noté \(2\)/ }))
    expect(screen.getByText('Lecture · non')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Méditation · oui, changer la réponse' }))
    expect(onHabitUndo).toHaveBeenCalledWith(done)
  })

  it('sans habitude suivie, aucune ligne de plus', () => {
    show()
    expect(screen.queryByRole('button', { name: 'Oui' })).not.toBeInTheDocument()
  })
})
