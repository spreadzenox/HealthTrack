import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SeeExample from './SeeExample'
import { saveOnboarding } from '../settings/onboarding'
import { TOUR_START_EVENT, stillEmpty } from '../services/tour'

describe('« Voir un exemple » part de l’écran où on le touche (POLISH-SIM-37)', () => {
  beforeEach(() => {
    localStorage.clear()
    saveOnboarding({ done: true, endedBy: 'completed', doneAt: new Date().toISOString() })
  })

  it('depuis Analyses › Digestion, la visite reçoit cet écran', () => {
    let detail = null
    const on = (e) => { detail = e.detail }
    window.addEventListener(TOUR_START_EVENT, on)
    render(
      <MemoryRouter initialEntries={['/recommendations/ventre']}>
        <SeeExample />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Voir un exemple' }))
    window.removeEventListener(TOUR_START_EVENT, on)
    expect(detail).toEqual({ from: '/recommendations/ventre' })
  })
})

describe('« Voir un exemple » s’arrête au jour des premiers résultats (POLISH-SIM-85)', () => {
  const DAY = 86_400_000
  const doneAt = Date.parse('2026-11-01T09:00:00Z')
  const at = (dayNumber) => doneAt + (dayNumber - 1) * DAY + 3_600_000
  const s = { done: true, endedBy: 'completed', doneAt: new Date(doneAt).toISOString() }

  it('montré du 1er au 13e jour', () => {
    expect(stillEmpty(s, at(1))).toBe(true)
    expect(stillEmpty(s, at(13))).toBe(true)
  })

  it('caché au 14e jour : « Exemple au jour 14 » ne se propose pas à qui y est déjà', () => {
    expect(stillEmpty(s, at(14))).toBe(false)
    expect(stillEmpty(s, at(15))).toBe(false)
  })
})
