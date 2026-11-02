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

const relayAnswer = (body, credits = null) => vi.fn((url) => Promise.resolve({
  ok: true, status: 200, json: () => Promise.resolve(String(url).endsWith('/v1/credits') ? { credits } : body),
}))
/** Appels de vérification des droits seulement (le compteur de crédits a sa propre route). */
const verifyCalls = () => globalThis.fetch.mock.calls.filter(([url]) => String(url).endsWith('/v1/subscription/verify'))

describe('Settings — variante play (relais Halcya)', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = relayAnswer({ ok: true, premium: false, source: null })
  })

  it('aucun champ de clé Gemini : l’analyse passe par notre serveur', () => {
    renderSettings()
    expect(screen.queryByLabelText(/Clé API Gemini/i)).toBeNull()
    expect(screen.getByText('Analyse des repas (IA)')).toBeInTheDocument()
    // 31/10 : aucun nom de modèle visible dans la variante play ; la confidentialité nomme Google (Vertex AI, UE)
    expect(document.body.textContent).not.toMatch(/Gemini/)
    expect(screen.getByText(/une IA de Google/)).toBeInTheDocument()
    const details = screen.getByText(/Ce qui est envoyé, en détail/i).closest('details')
    expect(details).toHaveTextContent(/identifiant aléatoire/)
    expect(details).toHaveTextContent(/ne garde ni la photo ni le texte/)
    expect(details).toHaveTextContent(/13 mois/)
  })

  it('simple d’abord : une phrase sur ce qui est envoyé, le détail replié', () => {
    renderSettings()
    const short = screen.getByText(/Seule la photo ou la description part/)
    expect(short.closest('details')).toBeNull()
    expect(short).toHaveTextContent(/sans ses métadonnées/)
    const details = screen.getByText(/Ce qui est envoyé, en détail/i).closest('details')
    expect(details.open).toBe(false)
  })

  it('montre les crédits d’analyse IA relus auprès du relais', async () => {
    globalThis.fetch = relayAnswer({ ok: true, premium: false, source: null }, { plan: 'free', remaining: 7, monthly: 7, welcome: 0, resetAt: '2099-11-01T00:00:00.000Z', state: '2099-10:8:10' })
    renderSettings()
    expect(await screen.findByText('7 analyses IA restantes · renouvellement le 1er novembre')).toBeInTheDocument()
    expect(screen.getByText(/10 analyses offertes, puis 15 par mois/)).toBeInTheDocument()
  })

  it('version gratuite : le quota IA donne le plafond de Silver et de Gold', () => {
    renderSettings()
    expect(screen.getByText('Sans abonnement : 10 analyses offertes, puis 15 par mois. Silver : 10 par jour, Gold : 20.')).toBeInTheDocument()
  })

  it('période de lancement : Gold, donc 20 analyses par jour, sans parler de prix (P23 a, POL-PLAY-95)', async () => {
    globalThis.fetch = relayAnswer({ ok: true, premium: true, source: 'launch', launchUntil: '2099-11-19T23:00:00.000Z' })
    renderSettings()
    expect(await screen.findByText('Pendant le test : jusqu’à 20 analyses par jour, sans rien payer.')).toBeInTheDocument()
    expect(screen.queryByText(/Sans abonnement/)).toBeNull()
  })

  it('Silver payé : le quota IA dit « jusqu’à 10 par jour »', async () => {
    globalThis.fetch = relayAnswer({ ok: true, premium: true, source: 'play', state: 'active', productId: 'halcya_premium', expiresAt: new Date(Date.now() + 20 * 86_400_000).toISOString(), autoRenewing: true })
    renderSettings()
    expect(await screen.findByText('Avec Silver : jusqu’à 10 analyses par jour.')).toBeInTheDocument()
    expect(screen.queryByText(/Sans abonnement/)).toBeNull()
  })

  it('Gold payé : le quota IA dit « jusqu’à 20 par jour » (POL-PLAY-95)', async () => {
    globalThis.fetch = relayAnswer({ ok: true, premium: true, source: 'play', state: 'active', tier: 'gold', productId: 'halcya_gold', expiresAt: new Date(Date.now() + 20 * 86_400_000).toISOString(), autoRenewing: true })
    renderSettings()
    expect(await screen.findByText('Avec Gold : jusqu’à 20 analyses par jour.')).toBeInTheDocument()
  })

  it('bloc Abonnement : version gratuite par défaut, sans lien de gestion', async () => {
    renderSettings()
    expect(screen.getByText('Abonnement')).toBeInTheDocument()
    expect(screen.getByText(/Version gratuite/)).toBeInTheDocument()
    await waitFor(() => expect(verifyCalls().length).toBeGreaterThan(0))
    expect(screen.queryByRole('link', { name: /Gérer mon abonnement/ })).toBeNull()
  })

  it('bloc Abonnement : l’état renvoyé par le relais s’affiche, avec le lien Google Play', async () => {
    globalThis.fetch = relayAnswer({ ok: true, premium: true, source: 'play', state: 'active', productId: 'halcya_premium', expiresAt: new Date(Date.now() + 20 * 86_400_000).toISOString(), autoRenewing: true })
    renderSettings()
    expect(await screen.findByText(/Silver actif · renouvellement le/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Gérer mon abonnement dans Google Play/ })
    expect(link).toHaveAttribute('href', 'https://play.google.com/store/account/subscriptions?sku=halcya_premium&package=fr.jpesquet.sante')
  })

  it('« Restaurer un achat » : redemande les droits au relais avec le dernier jeton retenu', async () => {
    localStorage.setItem('halcya_purchase_token', 'tok.retenu-0123456789abc')
    renderSettings()
    const button = screen.getByRole('button', { name: 'Restaurer un achat' })
    await waitFor(() => expect(verifyCalls().length).toBeGreaterThan(0))
    const before = verifyCalls().length
    fireEvent.click(button)
    await waitFor(() => expect(verifyCalls().length).toBeGreaterThan(before))
    expect(JSON.parse(verifyCalls().at(-1)[1].body)).toEqual({ purchaseToken: 'tok.retenu-0123456789abc' })
    expect(await screen.findByRole('status')).toHaveTextContent(/Aucun abonnement trouvé/)
  })

  it('version gratuite : lien « Découvrir le premium » vers le paywall', () => {
    renderSettings()
    expect(screen.getByRole('link', { name: 'Découvrir le premium' })).toHaveAttribute('href', '/premium')
  })

  it('premium actif : pas de bouton « Restaurer un achat »', async () => {
    globalThis.fetch = relayAnswer({ ok: true, premium: true, source: 'play', state: 'active', productId: 'halcya_premium', expiresAt: new Date(Date.now() + 20 * 86_400_000).toISOString(), autoRenewing: true })
    renderSettings()
    await screen.findByText(/Silver actif/)
    expect(screen.queryByRole('button', { name: 'Restaurer un achat' })).toBeNull()
  })

  it('VC-4 : « Mode diagnostic » caché, révélé par 7 touches sur le numéro de version', () => {
    renderSettings()
    expect(screen.queryByText('Mode diagnostic')).toBeNull()
    const version = screen.getByRole('button', { name: /^Version / })
    for (let i = 0; i < 6; i++) fireEvent.click(version)
    expect(screen.queryByText('Mode diagnostic')).toBeNull()
    fireEvent.click(version)
    expect(screen.getByText('Mode diagnostic')).toBeInTheDocument()
    expect(screen.getByTestId('debug-mode-toggle')).not.toBeChecked()
  })

  it('GOLD-a3 : le mode diagnostic montre l’empreinte de l’installation (rien de personnel)', async () => {
    localStorage.setItem('healthtrack_debug_mode_enabled', 'true')
    renderSettings()
    expect(await screen.findByTestId('install-fingerprint')).toHaveTextContent(/^[0-9a-f]{12}$/)
  })

  it('VC-4 : le réglage reste visible une fois déverrouillé, ou si le mode est déjà actif', () => {
    localStorage.setItem('healthtrack_debug_mode_enabled', 'true')
    renderSettings()
    expect(screen.getByText('Mode diagnostic')).toBeInTheDocument()
  })
})

describe('Settings — variante play : réglage Cigarettes (VC-14)', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = relayAnswer({ ok: true, premium: false, source: null })
  })

  it('masqué sur une installation neuve', () => {
    renderSettings()
    expect(screen.queryByText('Cigarettes')).toBeNull()
    expect(screen.queryByLabelText(/Toujours afficher le bouton cigarette/i)).toBeNull()
  })

  it('reste visible s’il a déjà été activé, pour pouvoir le désactiver', () => {
    localStorage.setItem('healthtrack_cigarette_counter', 'on')
    renderSettings()
    expect(screen.getByLabelText(/Toujours afficher le bouton cigarette/i).querySelector('input')).toBeChecked()
  })
})

describe('Settings — Votre avis (play)', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = relayAnswer({ ok: true, premium: false, source: null })
  })

  it('renvoie vers la page Halcya du Play Store, rien n’est joint', () => {
    renderSettings()
    expect(screen.getByText('Votre avis')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Donner mon avis sur le Play Store' })
    expect(link).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=fr.jpesquet.sante')
    expect(screen.getByText(/Aucune donnée n’est jointe/)).toBeInTheDocument()
  })
})
