import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'play', FEATURES: actual.featuresFor('play') }
})

import Settings from './Settings'
import { DebugProvider } from '../contexts/DebugContext'

const renderSettings = () => render(<DebugProvider><BrowserRouter><Settings /></BrowserRouter></DebugProvider>)

const relayAnswer = (body) => vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(body) })

describe('Settings — variante play (relais Halcya)', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = relayAnswer({ ok: true, premium: false, source: null })
  })

  it('aucun champ de clé Gemini : l’analyse passe par notre serveur', () => {
    renderSettings()
    expect(screen.queryByLabelText(/Clé API Gemini/i)).toBeNull()
    expect(screen.getByText('Analyse des repas (IA)')).toBeInTheDocument()
    expect(screen.getByText(/Aucune clé à saisir/)).toBeInTheDocument()
    const sent = screen.getByText(/Ce qui est envoyé/i).closest('p')
    expect(sent).toHaveTextContent(/identifiant aléatoire/)
    expect(sent).toHaveTextContent(/ne garde rien/)
  })

  it('montre les analyses restantes du jour quand le relais les a données', () => {
    localStorage.setItem('halcya_ai_quota', JSON.stringify({ remaining: 7, resetAt: new Date(Date.now() + 3600_000).toISOString() }))
    renderSettings()
    expect(screen.getByText('7 analyses restantes aujourd’hui.')).toBeInTheDocument()
  })

  it('bloc Abonnement : version gratuite par défaut, sans lien de gestion', async () => {
    renderSettings()
    expect(screen.getByText('Abonnement')).toBeInTheDocument()
    expect(screen.getByText(/Version gratuite/)).toBeInTheDocument()
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    expect(globalThis.fetch.mock.calls[0][0]).toMatch(/\/v1\/subscription\/verify$/)
    expect(screen.queryByRole('link', { name: /Gérer mon abonnement/ })).toBeNull()
  })

  it('bloc Abonnement : l’état renvoyé par le relais s’affiche, avec le lien Google Play', async () => {
    globalThis.fetch = relayAnswer({ ok: true, premium: true, source: 'play', state: 'active', productId: 'halcya_premium', expiresAt: new Date(Date.now() + 20 * 86_400_000).toISOString(), autoRenewing: true })
    renderSettings()
    expect(await screen.findByText(/Premium actif · renouvellement le/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Gérer mon abonnement dans Google Play/ })
    expect(link).toHaveAttribute('href', 'https://play.google.com/store/account/subscriptions?sku=halcya_premium&package=fr.jpesquet.sante')
  })

  it('« Restaurer un achat » : redemande les droits au relais avec le dernier jeton retenu', async () => {
    localStorage.setItem('halcya_purchase_token', 'tok.retenu-0123456789abc')
    renderSettings()
    const button = screen.getByRole('button', { name: 'Restaurer un achat' })
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1))
    fireEvent.click(button)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2))
    expect(JSON.parse(globalThis.fetch.mock.calls[1][1].body)).toEqual({ purchaseToken: 'tok.retenu-0123456789abc' })
    expect(await screen.findByRole('status')).toHaveTextContent(/Aucun abonnement trouvé/)
  })

  it('version gratuite : lien « Découvrir le premium » vers le paywall', () => {
    renderSettings()
    expect(screen.getByRole('link', { name: 'Découvrir le premium' })).toHaveAttribute('href', '/premium')
  })

  it('premium actif : pas de bouton « Restaurer un achat »', async () => {
    globalThis.fetch = relayAnswer({ ok: true, premium: true, source: 'play', state: 'active', productId: 'halcya_premium', expiresAt: new Date(Date.now() + 20 * 86_400_000).toISOString(), autoRenewing: true })
    renderSettings()
    await screen.findByText(/Premium actif/)
    expect(screen.queryByRole('button', { name: 'Restaurer un achat' })).toBeNull()
  })
})
