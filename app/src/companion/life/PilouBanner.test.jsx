import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PilouBanner from './PilouBanner'
import { saveCompanion, setCompanionName } from './companionState'

const day = '2026-11-16'
const NOON = new Date(2026, 10, 16, 12, 0)
const at = (h) => new Date(2026, 10, 16, h, 0).toISOString()
const tasks = [{ id: 'meals', done: false }, { id: 'wellbeing', done: false }]

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

function show(entries, extra = {}) {
  const props = { entries, tasks, remaining: 2, todayKey: day, now: NOON, ...extra }
  const utils = render(<PilouBanner {...props} />)
  return { ...utils, again: (next) => utils.rerender(<PilouBanner {...props} entries={next} />) }
}

describe('PilouBanner', () => {
  it('au repos : sa phrase et « Encore 2 choses aujourd’hui » ; le dessin est décoratif', () => {
    const { container } = show([])
    expect(screen.getByText('Je suis là quand vous voulez.')).toBeInTheDocument()
    expect(screen.getByText('Encore 2 choses aujourd’hui')).toBeInTheDocument()
    expect(container.querySelector('.pilou-figure')).toHaveAttribute('aria-hidden', 'true')
  })

  it('un point par chose du compte : un par repas, plein quand il est noté (POLISH-SIM-168)', () => {
    const slots = [{ id: 'morning', filled: true }, { id: 'noon', filled: false }, { id: 'evening', filled: false }]
    const { container } = show([], { tasks: [{ id: 'meals', done: false, slots, count: 1 }, { id: 'wellbeing', done: false }], remaining: 3 })
    expect(screen.getByText('Encore 3 choses aujourd’hui')).toBeInTheDocument()
    expect(container.querySelectorAll('.day-dot')).toHaveLength(4)
    expect(container.querySelectorAll('.day-dot.is-todo')).toHaveLength(3)
  })

  it('un repas noté le nourrit, avec son nom', () => {
    setCompanionName('Bulle')
    const { again } = show([])
    again([{ id: 1, type: 'food', at: at(12), payload: { dish: 'Soupe' } }])
    expect(screen.getByText('Merci, c’était délicieux !')).toBeInTheDocument()
    expect(screen.getByText('Bravo, Bulle est rassasié.')).toBeInTheDocument()
  })

  it('une note de bien-être se reflète', () => {
    const { again } = show([])
    again([{ id: 2, type: 'wellbeing', source: 'app_wellbeing', at: at(12), payload: { score: 0 } }])
    expect(screen.getByText('Journée difficile ? Je reste près de vous.')).toBeInTheDocument()
  })

  it('à 2 h du matin : la nuit, aux couleurs du soir, comme l’Accueil où Pilou dort', () => {
    const { container } = show([], { now: new Date(2026, 10, 16, 2, 30) })
    expect(screen.getByText('Bonne nuit. Le reste peut attendre demain.')).toBeInTheDocument()
    expect(screen.queryByText(/Bonjour/)).not.toBeInTheDocument()
    expect(container.querySelector('.pilou-banner')).toHaveClass('is-evening')
  })

  it('après une absence : « Bon retour », sans compteur', () => {
    saveCompanion({ lastDay: '2026-11-13' })
    show([])
    expect(screen.getByText('Bon retour ! On repart d’aujourd’hui.')).toBeInTheDocument()
  })
})
