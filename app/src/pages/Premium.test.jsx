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
const GOLD = { productId: 'halcya_gold', tier: 'gold', basePlanId: 'mensuel', offerToken: 't-g', period: 'month', price: '9,99 €', priceMicros: 9_990_000, currency: 'EUR', trialDays: null }
const S_YEAR = { ...YEAR, productId: 'halcya_premium', tier: 'silver' }
const S_MONTH = { ...MONTH, productId: 'halcya_premium', tier: 'silver' }

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

  it('VC-17 : les quatre avantages sont livrés et cochés, plus rien « en préparation »', async () => {
    billing.loadPlans.mockResolvedValue([YEAR, MONTH])
    renderPremium()
    await screen.findByRole('radio', { name: /Annuel/ })
    expect(screen.getByText(/analyse IA des repas/)).toBeInTheDocument()
    expect(screen.getByText(/réintroduction FODMAP guidée/)).toBeInTheDocument()
    expect(screen.getByText(/rapport PDF/)).toBeInTheDocument()
    expect(screen.getByText(/délais de 2 à 48 h/)).toBeInTheDocument()
    expect(screen.queryByText('En préparation, inclus sans supplément')).toBeNull()
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
    expect(await screen.findByText(/Silver actif · renouvellement le/)).toBeInTheDocument()
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

  describe('deux niveaux, Silver et Gold (GOLD-b4)', () => {
    it('Silver choisi par défaut avec son essai ; Gold affiche son seul mensuel et 20 analyses par jour', async () => {
      billing.loadPlans.mockResolvedValue([S_YEAR, S_MONTH, GOLD])
      renderPremium()
      const silver = await screen.findByRole('radio', { name: /Silver/ })
      expect(screen.getByText('Silver ou Gold : seul le nombre d’analyses IA par jour change.')).toBeInTheDocument()
      expect(silver).toBeChecked()
      expect(screen.getByRole('radio', { name: /Annuel/ })).toBeChecked()
      expect(screen.getByText(/jusqu’à 10 par jour/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('radio', { name: /Gold/ }))
      expect(screen.getByRole('radio', { name: /Gold/ })).toBeChecked()
      expect(screen.queryByRole('radio', { name: /Annuel/ })).toBeNull()
      expect(screen.getByRole('radio', { name: /Mensuel/ })).toBeChecked()
      expect(screen.getByText('9,99 € / mois')).toBeInTheDocument()
      expect(screen.getByText(/jusqu’à 20 par jour/)).toBeInTheDocument()
      expect(screen.queryByLabelText('Déroulé de l’essai')).toBeNull()
      billing.purchasePlan.mockResolvedValue({ status: 'cancelled' })
      fireEvent.click(screen.getByRole('button', { name: 'S’abonner · 9,99 € / mois' }))
      await waitFor(() => expect(billing.purchasePlan).toHaveBeenCalledWith(GOLD))
    })

    it('aucun nom de modèle d’IA ni promesse de précision sur le paywall', async () => {
      billing.loadPlans.mockResolvedValue([S_YEAR, S_MONTH, GOLD])
      const { container } = renderPremium()
      fireEvent.click(await screen.findByRole('radio', { name: /Gold/ }))
      expect(container.textContent).not.toMatch(/gemini|flash|lite|vertex|moins d’erreurs|plus précis/i)
    })

    it('sans produit Gold chez Google Play : pas de choix de niveau, le paywall Silver reste tel quel', async () => {
      billing.loadPlans.mockResolvedValue([S_YEAR, S_MONTH])
      renderPremium()
      await screen.findByRole('radio', { name: /Annuel/ })
      expect(screen.queryByRole('radiogroup', { name: 'Niveaux' })).toBeNull()
    })

    it('abonné Gold : « Gold actif » et ses 20 analyses par jour', async () => {
      billing.loadPlans.mockResolvedValue([S_YEAR, S_MONTH, GOLD])
      localStorage.setItem('halcya_entitlement', JSON.stringify({ premium: true, source: 'play', state: 'active', tier: 'gold', productId: 'halcya_gold', autoRenewing: true, expiresAt: '2099-01-01T00:00:00Z' }))
      renderPremium()
      expect(await screen.findByText(/Gold actif · renouvellement le/)).toBeInTheDocument()
      expect(screen.getByText(/jusqu’à 20 par jour/)).toBeInTheDocument()
      expect(screen.queryByRole('radio')).toBeNull()
      expect(screen.queryByRole('button', { name: /Passer à Gold/ })).toBeNull()
    })

    it('abonné Silver (GOLD-b2) : « Passer à Gold » achète la formule Gold, qui remplace Silver', async () => {
      billing.loadPlans.mockResolvedValue([S_YEAR, S_MONTH, GOLD])
      billing.purchasePlan.mockResolvedValue({ status: 'purchased', entitlement: { premium: true, source: 'play', state: 'active', tier: 'gold', productId: 'halcya_gold', autoRenewing: true, expiresAt: '2099-01-01T00:00:00Z' } })
      localStorage.setItem('halcya_entitlement', JSON.stringify({ premium: true, source: 'play', state: 'active', tier: 'silver', productId: 'halcya_premium', autoRenewing: true, expiresAt: '2099-01-01T00:00:00Z' }))
      renderPremium()
      expect(await screen.findByText(/Silver actif · renouvellement le/)).toBeInTheDocument()
      expect(screen.getByText(/Gold remplace Silver : vous n’aurez qu’un abonnement/)).toBeInTheDocument()
      fireEvent.click(await screen.findByRole('button', { name: 'Passer à Gold · 9,99 € / mois' }))
      await waitFor(() => expect(billing.purchasePlan).toHaveBeenCalledWith(GOLD))
      expect(await screen.findByText(/Gold actif · renouvellement le/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Passer à Gold/ })).toBeNull()
    })

    it('abonné Silver sans produit Gold chez Google Play : aucun bouton de passage', async () => {
      billing.loadPlans.mockResolvedValue([S_YEAR, S_MONTH])
      localStorage.setItem('halcya_entitlement', JSON.stringify({ premium: true, source: 'play', state: 'active', tier: 'silver', productId: 'halcya_premium', autoRenewing: true, expiresAt: '2099-01-01T00:00:00Z' }))
      renderPremium()
      expect(await screen.findByText(/Silver actif/)).toBeInTheDocument()
      await waitFor(() => expect(billing.loadPlans).toHaveBeenCalled())
      expect(screen.queryByRole('button', { name: /Passer à Gold/ })).toBeNull()
    })
  })

  describe('période de lancement (P23 ②) : premium offert pendant le test', () => {
    const launchEnt = (until) => localStorage.setItem('halcya_entitlement', JSON.stringify({ premium: true, source: 'launch', launchUntil: until }))

    it('pendant la période : « Premium offert pendant le test », aucune formule ni bouton d’achat', async () => {
      billing.loadPlans.mockResolvedValue([YEAR, MONTH])
      launchEnt('2099-12-01T12:00:00.000Z')
      renderPremium()
      expect(screen.getByRole('heading', { name: 'Gold offert pendant le test' })).toBeInTheDocument()
      // une seule fois, dans la phrase d'accueil : plus de cadre qui répète le titre (POL-PLAY-39)
      expect(screen.getByText(/Jusqu’au 1er déc\. 2099, tout ce qui suit est débloqué : vous n’avez rien à payer/)).toBeInTheDocument()
      expect(screen.getAllByText(/Gold offert pendant le test/)).toHaveLength(1)
      expect(screen.getByText(/jusqu’à 20 par jour/)).toBeInTheDocument()
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
      expect(screen.getByRole('heading', { name: 'Gold offert pendant le test' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument()
      expect(screen.queryByText('Continuer gratuitement')).toBeNull()
    })

    it('à l’échéance : le parcours d’achat revient tel quel', async () => {
      billing.loadPlans.mockResolvedValue([YEAR, MONTH])
      launchEnt('2020-01-01T00:00:00.000Z')
      renderPremium()
      expect(screen.getByRole('heading', { name: 'Comprendre vos bons et mauvais jours' })).toBeInTheDocument()
      expect(await screen.findByRole('radio', { name: /Annuel/ })).toBeChecked()
      expect(screen.getByRole('button', { name: 'Essayer 14 jours gratuitement' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Restaurer un achat' })).toBeInTheDocument()
    })
  })
})
