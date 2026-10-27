import { describe, it, expect } from 'vitest'
import { render as rtlRender, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GutLinks from './GutLinks'

const render = (ui) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>)

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

describe('GutLinks — vérifier une piste par une réintroduction guidée (7c)', () => {
  it('ouvre le test de l’aliment cité, présélectionné', () => {
    render(<GutLinks gut={{ status: 'links', noteDays: 70, tested: 12, links: [link()] }} />)
    expect(screen.getByRole('link', { name: /Vérifier avec une réintroduction guidée/ }))
      .toHaveAttribute('href', '/reintroduction?groupe=fructans&aliment=onion')
  })

  it('aliments mangés ensemble : le premier qui a un test', () => {
    render(<GutLinks gut={{ status: 'links', noteDays: 70, tested: 12, links: [link({ factor: 'banane', together: ['banane', 'yaourt nature'] })] }} />)
    expect(screen.getByRole('link', { name: /Vérifier/ })).toHaveAttribute('href', '/reintroduction?groupe=lactose&aliment=milk')
  })

  it('sans groupe correspondant, ouvre le choix du groupe', () => {
    render(<GutLinks gut={{ status: 'links', noteDays: 70, tested: 12, links: [link({ factor: 'fodmap_eleve', label: 'Repas riches en FODMAP' })] }} />)
    expect(screen.getByRole('link', { name: /Vérifier avec une réintroduction guidée/ })).toHaveAttribute('href', '/reintroduction')
  })
})

describe('GutLinks — pistes par sous-groupe FODMAP (N5)', () => {
  const lactose = link({ factor: 'fodmap:lactose', label: 'Repas riches en lactose' })

  it('phrase simple et lien vers le test du même groupe', () => {
    render(<GutLinks gut={{ status: 'links', noteDays: 70, tested: 12, links: [lactose] }} />)
    expect(screen.getByText('Repas riches en lactose', { exact: false })).toBeTruthy()
    expect(screen.getByText(/^Les jours avec un repas riche en lactose, gêne ou douleur 12 fois sur 20\./)).toBeTruthy()
    expect(screen.getByRole('link', { name: /Vérifier/ })).toHaveAttribute('href', '/reintroduction?groupe=lactose&aliment=milk')
  })

  it('fructanes : la veille, et le choix de l’aliment dans le groupe', () => {
    const f = link({ factor: 'fodmap:fructans', label: 'Repas riches en fructanes', when: 'veille', whenLabel: 'la veille' })
    render(<GutLinks gut={{ status: 'links', noteDays: 70, tested: 12, links: [f] }} />)
    expect(screen.getByText(/^Les lendemains d’un repas riche en fructanes,/)).toBeTruthy()
    expect(screen.getByRole('link', { name: /Vérifier/ })).toHaveAttribute('href', '/reintroduction?groupe=fructans')
  })

  it('dans les détails, le repère présenté comme une hypothèse de départ', () => {
    render(<GutLinks gut={{ status: 'links', noteDays: 70, tested: 12, links: [lactose] }} />)
    expect(screen.queryByText(/hypothèse de départ/)).toBeNull()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/repère général par portion \(une hypothèse de départ\)\. Vos données priment\./)).toBeTruthy()
  })
})
