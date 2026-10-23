import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'play', FEATURES: actual.featuresFor('play') }
})

const billing = vi.hoisted(() => ({ loadPlans: vi.fn(), purchasePlan: vi.fn(), restorePurchases: vi.fn() }))
vi.mock('../services/playBilling', async (importOriginal) => ({ ...(await importOriginal()), ...billing }))

import Premium from './Premium'

const YEAR = { basePlanId: 'annuel', offerToken: 't-a', period: 'year', price: '29,99 €', priceMicros: 29_990_000, currency: 'EUR', trialDays: 14 }
const MONTH = { basePlanId: 'mensuel', offerToken: 't-m', period: 'month', price: '4,99 €', priceMicros: 4_990_000, currency: 'EUR', trialDays: null }

const renderPremium = () => render(<MemoryRouter initialEntries={['/premium']}><Premium /></MemoryRouter>)

describe('Paywall (variante play, jalon 6c-3)', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.values(billing).forEach((fn) => fn.mockReset())
  })

  it('formules lues dans Google Play : annuel présélectionné, économie et essai calculés, jamais codés en dur', async () => {
    billing.loadPlans.mockResolvedValue([YEAR, MONTH])
    renderPremium()
    const annual = await screen.findByRole('radio', { name: /Annuel/ })
    expect(annual).toBeChecked()
    expect(screen.getByText('29,99 € / an')).toBeInTheDocument()
    expect(screen.getByText(/soit 2,50.€ par mois/)).toBeInTheDocument()
    expect(screen.getByText('−50 %')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Essayer 14 jours gratuitement' })).toBeEnabled()
    expect(screen.getByText(/Puis 29,99 € par an\. Annulable à tout moment dans Google Play/)).toBeInTheDocument()
    expect(screen.getByLabelText('Déroulé de l’essai')).toHaveTextContent('jour 14')
  })

  it('mensuel choisi : pas d’essai, le bouton et la mention s’adaptent', async () => {
    billing.loadPlans.mockResolvedValue([YEAR, MONTH])
    renderPremium()
    fireEvent.click(await screen.findByRole('radio', { name: /Mensuel/ }))
    expect(screen.getByRole('button', { name: 'S’abonner · 4,99 € / mois' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Déroulé de l’essai')).toBeNull()
    expect(screen.getByText(/^4,99 € par mois\./)).toBeInTheDocument()
  })

  it('Google Play ne propose aucune formule (abonnement pas encore créé) : message clair, aucun prix', async () => {
    billing.loadPlans.mockResolvedValue([])
    renderPremium()
    expect(await screen.findByText(/ne propose pas encore de formule/)).toBeInTheDocument()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.getByText(/Toujours gratuit/)).toBeInTheDocument()
  })

  it('achat : la formule choisie part vers Google Play, le droit revérifié par le relais s’affiche', async () => {
    billing.loadPlans.mockResolvedValue([YEAR, MONTH])
    billing.purchasePlan.mockResolvedValue({
      status: 'purchased',
      entitlement: { premium: true, source: 'play', state: 'active', trial: true, productId: 'halcya_premium', expiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString() },
    })
    renderPremium()
    fireEvent.click(await screen.findByRole('button', { name: 'Essayer 14 jours gratuitement' }))
    await waitFor(() => expect(billing.purchasePlan).toHaveBeenCalledWith(YEAR))
    expect(await screen.findByText(/Essai gratuit en cours/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Gérer mon abonnement dans Google Play/ })).toBeInTheDocument()
  })

  it('achat annulé : aucun message ; erreur : le message de Google Play s’affiche', async () => {
    billing.loadPlans.mockResolvedValue([YEAR])
    billing.purchasePlan.mockResolvedValueOnce({ status: 'cancelled' }).mockResolvedValueOnce({ status: 'error', message: 'rien n’a été débité' })
    renderPremium()
    const cta = await screen.findByRole('button', { name: /Essayer/ })
    fireEvent.click(cta)
    await waitFor(() => expect(billing.purchasePlan).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('alert')).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: /Essayer/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('rien n’a été débité')
  })

  it('toujours passable : « Plus tard » et la croix de fermeture', async () => {
    billing.loadPlans.mockResolvedValue([])
    renderPremium()
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Plus tard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restaurer un achat' })).toBeInTheDocument()
  })
})
