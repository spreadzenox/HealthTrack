import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SeeExample from './SeeExample'
import { saveOnboarding } from '../settings/onboarding'
import { TOUR_START_EVENT } from '../services/tour'

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
