import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { fakeAppStoreBilling } from '../ios/captureMode.js'

// Version iOS (HealthTrack-iOS), étape I6 : l'achat est ouvert sur iPhone (relais d'Android, v689). L'écran
// d'abonnement est celui d'Android, avec le nom de l'App Store (VITE_STORE=appstore) : formules, prix et
// renouvellement près du bouton, « Restaurer un achat », conditions et confidentialité ; jamais « Google Play ».
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore'), STORE: actual.storeFor('appstore') }
})

import Premium from './Premium'

describe('Premium sur iPhone (variante appstore)', () => {
  beforeEach(() => {
    localStorage.clear()
    window.__HT_PLAY_BILLING__ = fakeAppStoreBilling()
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, premium: false }) }))
  })

  it('propose Silver et Gold de l’App Store, essai et renouvellement dits près du bouton, sans parler de Google Play', async () => {
    const { container } = render(<MemoryRouter initialEntries={['/premium']}><Premium /></MemoryRouter>)
    expect(await screen.findByRole('button', { name: /Essayer 14 jours gratuitement/ })).toBeInTheDocument()
    expect(screen.getByText(/Puis 29,99 € par an\./)).toBeInTheDocument()
    expect(screen.getByText(/Annulable à tout moment dans l’App Store\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restaurer un achat' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Conditions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Confidentialité' })).toBeInTheDocument()
    expect(container).not.toHaveTextContent(/Google|arrive bientôt/)
  })

  it('Gold : « estime mieux les quantités », sans pourcentage de précision (Android v721, P36)', async () => {
    const { container } = render(<MemoryRouter initialEntries={['/premium']}><Premium /></MemoryRouter>)
    expect(await screen.findByText('Silver ou Gold : Gold analyse plus de repas par jour et estime mieux les quantités.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: /Gold/ }))
    expect(screen.getByText('Gold estime mieux les quantités')).toBeInTheDocument()
    expect(container).not.toHaveTextContent(/\d+ ?%/)
  })

  it('formule mensuelle : prix dit sur la formule et le bouton, pas répété sous le bouton (Android v703, POL-PLAY-96)', async () => {
    render(<MemoryRouter initialEntries={['/premium']}><Premium /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('radio', { name: /Mensuel/ }))
    expect(screen.getByRole('button', { name: 'S’abonner · 4,99 € / mois' })).toBeInTheDocument()
    expect(screen.getByText('Annulable à tout moment dans l’App Store.')).toBeInTheDocument()
    expect(screen.queryByText(/^4,99 € par mois\./)).toBeNull()
  })

  it('abonné Silver de l’App Store : « Passer à Gold », achat du Gold mensuel sans ancien jeton (Apple fait le passage)', async () => {
    const silver = { ok: true, premium: true, source: 'appstore', state: 'active', tier: 'silver', productId: 'halcya_premium_annuel', expiresAt: '2099-01-01T00:00:00.000Z' }
    localStorage.setItem('halcya_entitlement', JSON.stringify(silver))
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(silver) }))
    const billing = fakeAppStoreBilling()
    billing.purchase = vi.fn(async () => ({ status: 'cancelled' }))
    window.__HT_PLAY_BILLING__ = billing
    const { container } = render(<MemoryRouter initialEntries={['/premium']}><Premium /></MemoryRouter>)
    // Android v721 (P36) : Gold annonce aussi ses quantités mieux estimées, sans chiffre de précision
    expect(await screen.findByText('Passer à Gold : 20 analyses IA par jour au lieu de 10, et des quantités mieux estimées.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Passer à Gold · 9,99 € / mois' }))
    await waitFor(() => expect(billing.purchase).toHaveBeenCalledTimes(1))
    const args = billing.purchase.mock.calls[0][0]
    expect(args).toMatchObject({ productId: 'halcya_gold', offerToken: 'halcya_gold_mensuel' })
    expect(args).not.toHaveProperty('oldPurchaseToken')
    expect(args).not.toHaveProperty('replacementMode')
    expect(container).not.toHaveTextContent(/Google/)
  })
})
