import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import CycleSanteCard from './CycleSanteCard'
import { IOS_HEALTHKIT_ASKED_KEY } from './cycleSante'

// FUSION-3 (correctif 61 fondu) : la carte vit dans le code commun et Sources l'affiche partout ; hors iPhone, elle ne
// rend rien, même avec « Mon cycle » et Santé marquée autorisée.
describe('Sources : « Suivi du cycle (Santé) » hors iPhone', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['cycle'] }))
    localStorage.setItem(IOS_HEALTHKIT_ASKED_KEY, '1')
  })
  afterEach(() => {
    delete window.Capacitor
  })

  it('Android : rien d’affiché', () => {
    window.Capacitor = { getPlatform: () => 'android' }
    const { container } = render(<CycleSanteCard />)
    expect(container).toBeEmptyDOMElement()
  })

  it('navigateur : rien d’affiché', () => {
    const { container } = render(<CycleSanteCard />)
    expect(container).toBeEmptyDOMElement()
  })

  it('iPhone : la carte s’affiche (même module, sans simulation)', () => {
    window.Capacitor = { getPlatform: () => 'ios' }
    const { getByRole } = render(<CycleSanteCard />)
    expect(getByRole('heading', { name: 'Suivi du cycle (Santé)' })).toBeInTheDocument()
  })
})
