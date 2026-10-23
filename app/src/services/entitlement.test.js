import { describe, it, expect, vi, beforeEach } from 'vitest'

import { RELAY_URL, getInstallId } from './aiRelay'
import { ENTITLEMENT_EVENT, refreshEntitlement, getEntitlement, describeEntitlement, manageSubscriptionUrl } from './entitlement'

const response = (body, status = 200) => ({ ok: status < 400, status, json: () => Promise.resolve(body) })
const inDays = (n) => new Date(Date.now() + n * 86_400_000).toISOString()

describe('droits premium lus auprès du relais (jalon 6c)', () => {
  beforeEach(() => localStorage.clear())

  it('sans achat : demande au relais avec le seul identifiant d’installation, et retient la réponse', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ ok: true, premium: false, source: null, launchUntil: null, state: null, productId: null, expiresAt: null }))
    const ent = await refreshEntitlement({ fetchImpl })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(`${RELAY_URL}/v1/subscription/verify`)
    expect(init.method).toBe('POST')
    expect(init.headers['X-Install-Id']).toBe(getInstallId())
    expect(JSON.parse(init.body)).toEqual({})
    expect(ent).toMatchObject({ premium: false, source: null })
    expect(getEntitlement()).toMatchObject({ premium: false })
  })

  it('avec un jeton d’achat : il est transmis tel quel', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ ok: true, premium: true, source: 'play', state: 'active', productId: 'halcya_premium', expiresAt: inDays(30), autoRenewing: true }))
    await refreshEntitlement({ purchaseToken: 'tok.abc-123', fetchImpl })
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ purchaseToken: 'tok.abc-123' })
    expect(getEntitlement()).toMatchObject({ premium: true, source: 'play', productId: 'halcya_premium', autoRenewing: true })
  })

  it('période de lancement : premium jusqu’à la date donnée par le relais, puis plus', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ ok: true, premium: true, source: 'launch', launchUntil: inDays(10) }))
    await refreshEntitlement({ fetchImpl })
    expect(getEntitlement()).toMatchObject({ premium: true, source: 'launch' })
    expect(getEntitlement({ now: Date.now() + 11 * 86_400_000 })).toMatchObject({ premium: false })
  })

  it('hors connexion : garde le dernier état connu, sans jamais prolonger un abonnement expiré', async () => {
    localStorage.setItem('halcya_entitlement', JSON.stringify({ premium: true, source: 'play', state: 'active', expiresAt: inDays(2), checkedAt: new Date().toISOString() }))
    const ent = await refreshEntitlement({ fetchImpl: vi.fn().mockRejectedValue(new TypeError('offline')) })
    expect(ent).toMatchObject({ premium: true, source: 'play', offline: true })
    expect(getEntitlement({ now: Date.now() + 3 * 86_400_000 })).toMatchObject({ premium: false })
  })

  it('un état « en pause » ou « suspendu » ne donne aucun droit premium', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ ok: true, premium: false, source: null, state: 'paused', productId: 'halcya_premium', expiresAt: inDays(5) }))
    await refreshEntitlement({ fetchImpl })
    expect(getEntitlement()).toMatchObject({ premium: false, state: 'paused' })
  })

  it('réponse illisible ou erreur du relais : on ne retient rien de faux', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ error: 'upstream' }, 502))
    const ent = await refreshEntitlement({ fetchImpl })
    expect(ent).toMatchObject({ premium: false, offline: true })
    expect(localStorage.getItem('halcya_entitlement')).toBeNull()
  })

  it('prévient toute l’app quand les droits changent (achat confirmé en arrière-plan, jalon 6c-3c)', async () => {
    const seen = vi.fn()
    window.addEventListener(ENTITLEMENT_EVENT, seen)
    try {
      await refreshEntitlement({ fetchImpl: vi.fn().mockResolvedValue(response({ ok: true, premium: true, source: 'play', state: 'active', expiresAt: '2099-01-01T00:00:00Z' })) })
      expect(seen).toHaveBeenCalledTimes(1)
      expect(seen.mock.calls[0][0].detail).toMatchObject({ premium: true, source: 'play' })
      await refreshEntitlement({ fetchImpl: vi.fn().mockRejectedValue(new Error('hors ligne')) })
      expect(seen).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener(ENTITLEMENT_EVENT, seen)
    }
  })

  it('aucun état connu : version gratuite', () => {
    expect(getEntitlement()).toMatchObject({ premium: false, source: null })
    localStorage.setItem('halcya_entitlement', '{pas du json')
    expect(getEntitlement()).toMatchObject({ premium: false })
  })
})

describe('texte de l’état d’abonnement', () => {
  const date = '2026-12-01T10:00:00.000Z'

  it('gratuit, lancement, actif, essai, annulé, période de grâce, pause, suspendu', () => {
    expect(describeEntitlement({ premium: false, source: null })).toMatch(/Version gratuite/)
    expect(describeEntitlement({ premium: true, source: 'launch', launchUntil: date })).toMatch(/offert pendant la période de lancement, jusqu’au 1 déc\. 2026/)
    expect(describeEntitlement({ premium: true, source: 'play', state: 'active', expiresAt: date, autoRenewing: true })).toMatch(/Premium actif · renouvellement le 1 déc\. 2026/)
    expect(describeEntitlement({ premium: true, source: 'play', state: 'active', trial: true, expiresAt: date, autoRenewing: true })).toMatch(/Essai gratuit en cours · premier paiement le 1 déc\. 2026/)
    expect(describeEntitlement({ premium: true, source: 'play', state: 'canceled', expiresAt: date })).toMatch(/Abonnement annulé · premium jusqu’au 1 déc\. 2026/)
    expect(describeEntitlement({ premium: true, source: 'play', state: 'grace', expiresAt: date })).toMatch(/Paiement à régulariser dans Google Play/)
    expect(describeEntitlement({ premium: false, state: 'paused' })).toMatch(/Abonnement en pause/)
    expect(describeEntitlement({ premium: false, state: 'on_hold' })).toMatch(/Abonnement suspendu : paiement à régulariser/)
  })

  it('n’emploie jamais de vocabulaire technique', () => {
    const all = ['active', 'canceled', 'grace', 'paused', 'on_hold', 'expired'].map((state) => describeEntitlement({ premium: false, state, expiresAt: date }))
    for (const text of all) expect(text).not.toMatch(/on_hold|grace|token|SUBSCRIPTION_STATE/)
  })
})

describe('lien de gestion de l’abonnement', () => {
  it('pointe vers la page Abonnements de Google Play, sur le bon produit quand on le connaît', () => {
    expect(manageSubscriptionUrl('halcya_premium')).toBe('https://play.google.com/store/account/subscriptions?sku=halcya_premium&package=fr.jpesquet.sante')
    expect(manageSubscriptionUrl(null)).toBe('https://play.google.com/store/account/subscriptions')
  })
})
