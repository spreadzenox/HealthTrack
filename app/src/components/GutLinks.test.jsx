import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GutLinks from './GutLinks'

const link = (extra = {}) => ({
  factor: 'oignon', label: 'Oignon', when: 'jour', kind: 'day', whenLabel: 'le jour même',
  exposed: { n: 20, symptoms: 12 }, unexposed: { n: 50, symptoms: 8 }, rr: 3.6, q: 0.01, nearMeal: null,
  also: [], together: [], comparable: [], sameNight: false, oftenWith: [], ...extra,
})

describe('GutLinks — aliments souvent mangés avec la piste (I134 étape 3)', () => {
  it('dans les détails, rappelle les aliments écartés une fois la piste prise en compte', () => {
    render(<GutLinks gut={{ status: 'links', noteDays: 70, tested: 12, links: [link({ oftenWith: ['ail'] })] }} />)
    expect(screen.queryByText(/Souvent mangé avec/)).toBeNull()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/Souvent mangé avec : ail\. Comparé à part, il ne ressort pas à lui seul\./)).toBeTruthy()
  })

  it('rien de plus quand aucun aliment n’accompagne la piste', () => {
    render(<GutLinks gut={{ status: 'links', noteDays: 70, tested: 12, links: [link()] }} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByText(/Souvent mangé avec/)).toBeNull()
  })
})
