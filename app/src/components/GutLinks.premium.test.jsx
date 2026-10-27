import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const dist = vi.hoisted(() => ({ play: false }))
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, get FEATURES() { return actual.featuresFor(dist.play ? 'play' : 'sideload') } }
})

import GutLinks from './GutLinks'

const link = (factor, label) => ({
  factor, label, when: 'jour', kind: 'day', whenLabel: 'le jour même',
  exposed: { n: 20, symptoms: 12 }, unexposed: { n: 50, symptoms: 8 }, rr: 3.6, q: 0.01, nearMeal: null,
  also: [], together: [], comparable: [], sameNight: false, oftenWith: [],
})
const gut = { status: 'links', noteDays: 40, tested: 12, links: [link('oignon', 'Oignon'), link('pain', 'Pain')] }
const renderLinks = (g = gut) => render(<MemoryRouter><GutLinks gut={g} /></MemoryRouter>)

describe('GutLinks — paywall au moment de la valeur (jalon 6, pistes-delays)', () => {
  beforeEach(() => {
    dist.play = false
    localStorage.clear()
  })

  it('sideload : les pistes restent visibles, sans paywall', () => {
    renderLinks()
    expect(screen.getByText(/Oignon → ventre/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Débloquer' })).toBeNull()
  })

  it('play sans premium : le nombre de pistes, un aperçu flouté sans aucun aliment, et « Débloquer »', () => {
    dist.play = true
    renderLinks()
    expect(screen.getByText('2 pistes repérées entre vos repas et votre ventre')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Débloquer' })).toHaveAttribute('href', '/premium')
    // Les aliments ne sont jamais dans la page (un flou CSS se retire) ; les liens de réintroduction non plus
    expect(document.body.textContent).not.toMatch(/Oignon|Pain/)
    expect(screen.queryByRole('link', { name: /réintroduction/ })).toBeNull()
    expect(screen.getByTestId('gut-links-preview')).toHaveAttribute('aria-hidden', 'true')
  })

  it('play sans premium : une seule piste au singulier', () => {
    dist.play = true
    renderLinks({ ...gut, links: [gut.links[0]] })
    expect(screen.getByText('1 piste repérée entre vos repas et votre ventre')).toBeInTheDocument()
  })

  it('play sans premium : « rien ne ressort » reste gratuit (aucune promesse à vendre)', () => {
    dist.play = true
    renderLinks({ status: 'none', noteDays: 40, tested: 12, links: [] })
    expect(screen.getByText(/Aucun aliment ne ressort nettement/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Débloquer' })).toBeNull()
  })

  it('play avec premium (période de lancement) : les pistes en clair', () => {
    dist.play = true
    localStorage.setItem('halcya_entitlement', JSON.stringify({ premium: true, source: 'launch', launchUntil: '2099-01-01T00:00:00Z' }))
    renderLinks()
    expect(screen.getByText(/Oignon → ventre/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Débloquer' })).toBeNull()
  })
})
