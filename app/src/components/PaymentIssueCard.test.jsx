import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'play', FEATURES: actual.featuresFor('play') }
})

import PaymentIssueCard from './PaymentIssueCard'
import { ENTITLEMENT_EVENT } from '../services/entitlement'

const store = (ent) => localStorage.setItem('halcya_entitlement', JSON.stringify({ checkedAt: new Date().toISOString(), ...ent }))

describe('PaymentIssueCard — carte de l’Accueil (variante play, 6e)', () => {
  beforeEach(() => localStorage.clear())

  it('rien sans problème de paiement', () => {
    store({ premium: true, source: 'play', state: 'active', expiresAt: new Date(Date.now() + 86_400_000).toISOString() })
    const { container } = render(<PaymentIssueCard />)
    expect(container).toBeEmptyDOMElement()
  })

  it('période de grâce : carte avec le lien vers les abonnements Google Play', () => {
    store({ premium: true, source: 'play', state: 'grace', productId: 'halcya_premium' })
    render(<PaymentIssueCard />)
    expect(screen.getByRole('heading', { name: 'Votre paiement n’est pas passé' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mettre à jour mon paiement' })).toHaveAttribute(
      'href', 'https://play.google.com/store/account/subscriptions?sku=halcya_premium&package=fr.jpesquet.sante')
  })

  it('apparaît et disparaît avec l’état donné par le relais', () => {
    render(<PaymentIssueCard />)
    expect(screen.queryByRole('heading')).toBeNull()
    act(() => { window.dispatchEvent(new CustomEvent(ENTITLEMENT_EVENT, { detail: { premium: false, source: 'play', state: 'on_hold', productId: 'halcya_premium' } })) })
    expect(screen.getByRole('heading', { name: 'Abonnement suspendu' })).toBeInTheDocument()
    act(() => { window.dispatchEvent(new CustomEvent(ENTITLEMENT_EVENT, { detail: { premium: true, source: 'play', state: 'active' } })) })
    expect(screen.queryByRole('heading')).toBeNull()
  })
})
