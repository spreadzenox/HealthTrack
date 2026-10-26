import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'play', FEATURES: actual.featuresFor('play') }
})

const billing = vi.hoisted(() => ({ loadPlans: vi.fn(), purchasePlan: vi.fn(), restorePurchases: vi.fn() }))
vi.mock('../services/playBilling', async (importOriginal) => ({ ...(await importOriginal()), ...billing }))

import Premium from './Premium'
import { ENTITLEMENT_EVENT } from '../services/entitlement'
import { PRIVACY_URL, TERMS_URL } from '../config/brand'

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

  it('VC-18b : sans rappel possible (navigateur), le paywall ne le promet pas', async () => {
    billing.loadPlans.mockResolvedValue([YEAR, MONTH])
    renderPremium()
    await screen.findByRole('radio', { name: /Annuel/ })
    expect(screen.getByLabelText('Déroulé de l’essai')).not.toHaveTextContent('On vous prévient')
    expect(screen.queryByText(/Rappel 2 jours avant/)).toBeNull()
  })

  it('VC-18b : avec le rappel local, « jour 12 : on vous prévient » et la mention du rappel', async () => {
    window.__HT_TRIAL_REMINDER__ = { schedule: vi.fn(), cancel: vi.fn() }
    try {
      billing.loadPlans.mockResolvedValue([YEAR, MONTH])
      renderPremium()
      await screen.findByRole('radio', { name: /Annuel/ })
      expect(screen.getByLabelText('Déroulé de l’essai')).toHaveTextContent(/jour 12\s*On vous prévient par une notification/)
      expect(screen.getByText(/Puis 29,99 € par an\. Rappel 2 jours avant la fin de l’essai\. Annulable/)).toBeInTheDocument()
    } finally {
      delete window.__HT_TRIAL_REMINDER__
    }
  })

  it('VC-17 : seuls les avantages livrés sont cochés, le reste est « en préparation » derrière « détails »', async () => {
    billing.loadPlans.mockResolvedValue([YEAR, MONTH])
    renderPremium()
    await screen.findByRole('radio', { name: /Annuel/ })
    expect(screen.getByText(/analyse IA des repas/)).toBeInTheDocument()
    expect(screen.getByText(/réintroduction FODMAP guidée/)).toBeInTheDocument()
    expect(screen.getByText('En préparation, inclus sans supplément')).toBeInTheDocument()
    expect(screen.queryByText(/rapport PDF/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les détails' }))
    const upcoming = screen.getByRole('list', { name: 'En préparation' })
    expect(upcoming).not.toHaveTextContent(/FODMAP/)
    expect(upcoming).toHaveTextContent(/rapport PDF/)
    expect(upcoming).toHaveTextContent(/délais de 2 à 48 h/)
  })

  it('VC-18 : liens « Conditions » et « Confidentialité » vers les pages publiées', async () => {
    billing.loadPlans.mockResolvedValue([YEAR, MONTH])
    renderPremium()
    await screen.findByRole('radio', { name: /Annuel/ })
    expect(screen.getByRole('link', { name: 'Conditions' })).toHaveAttribute('href', TERMS_URL)
    expect(screen.getByRole('link', { name: 'Confidentialité' })).toHaveAttribute('href', PRIVACY_URL)
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

  it('paiement en attente confirmé plus tard : la page passe au premium d’elle-même (jalon 6c-3c)', async () => {
    billing.loadPlans.mockResolvedValue([YEAR])
    billing.purchasePlan.mockResolvedValue({ status: 'pending', message: 'Paiement en attente chez Google Play' })
    renderPremium()
    fireEvent.click(await screen.findByRole('button', { name: /Essayer/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Paiement en attente')
    const detail = { premium: true, source: 'play', state: 'active', productId: 'halcya_premium', autoRenewing: true, expiresAt: new Date(Date.now() + 300 * 86_400_000).toISOString() }
    act(() => {
      window.dispatchEvent(new CustomEvent(ENTITLEMENT_EVENT, { detail }))
    })
    expect(await screen.findByText(/Premium actif · renouvellement le/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
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

  describe('période de lancement (P23 ②) : premium offert pendant le test', () => {
    const launchEnt = (until) => localStorage.setItem('halcya_entitlement', JSON.stringify({ premium: true, source: 'launch', launchUntil: until }))

    it('pendant la période : « Premium offert pendant le test », aucune formule ni bouton d’achat', async () => {
      billing.loadPlans.mockResolvedValue([YEAR, MONTH])
      launchEnt('2099-12-01T12:00:00.000Z')
      renderPremium()
      expect(screen.getByRole('heading', { name: 'Premium offert pendant le test' })).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent(/jusqu’au 1 déc\. 2099 : vous n’avez rien à payer/)
      await waitFor(() => expect(billing.loadPlans).toHaveBeenCalled())
      expect(screen.queryByRole('radio')).toBeNull()
      expect(screen.queryByRole('button', { name: /Essayer|S’abonner/ })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Restaurer un achat' })).toBeNull()
      expect(screen.queryByText(/Gérer mon abonnement/)).toBeNull()
      expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument()
    })

    it('dans l’onboarding aussi : « Continuer », pas d’incitation à payer', () => {
      billing.loadPlans.mockResolvedValue([YEAR, MONTH])
      launchEnt('2099-12-01T00:00:00.000Z')
      render(<MemoryRouter><Premium context="onboarding" onClose={() => {}} /></MemoryRouter>)
      expect(screen.getByRole('heading', { name: 'Premium offert pendant le test' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument()
      expect(screen.queryByText('Continuer gratuitement')).toBeNull()
    })

    it('à l’échéance : le parcours d’achat revient tel quel', async () => {
      billing.loadPlans.mockResolvedValue([YEAR, MONTH])
      launchEnt('2020-01-01T00:00:00.000Z')
      renderPremium()
      expect(screen.getByRole('heading', { name: 'Passez de « je note » à « je comprends »' })).toBeInTheDocument()
      expect(await screen.findByRole('radio', { name: /Annuel/ })).toBeChecked()
      expect(screen.getByRole('button', { name: 'Essayer 14 jours gratuitement' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Restaurer un achat' })).toBeInTheDocument()
    })
  })
})
