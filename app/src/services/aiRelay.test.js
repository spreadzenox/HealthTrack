import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./imagePrep.js', () => ({ prepareImageForGemini: () => Promise.resolve({ base64: 'AAAA', mimeType: 'image/jpeg' }) }))

import { RELAY_URL, analyzePhotoViaRelay, analyzeTextViaRelay, describeCredits, getInstallId, getLastCredits, getLastQuota, refreshCredits } from './aiRelay'

const okResponse = (body, status = 200) => ({ ok: status < 400, status, json: () => Promise.resolve(body) })
const future = () => new Date(Date.now() + 3600_000).toISOString()

describe('relais Halcya (variante play)', () => {
  beforeEach(() => localStorage.clear())

  it('identifiant d’installation aléatoire, stable, au format accepté par le relais', () => {
    const id = getInstallId()
    expect(id).toMatch(/^[A-Za-z0-9_-]{16,64}$/)
    expect(getInstallId()).toBe(id)
    localStorage.clear()
    expect(getInstallId()).not.toBe(id)
  })

  it('photo : envoie seulement la photo préparée et l’identifiant, décode les aliments comme l’appel direct', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({
      parsed: { not_food: false, dish: 'Pomme', ingredients: [{ ingredient: 'Pomme', quantity_g: 150, confidence: 'high' }] },
      model: 'gemini-2.5-flash-lite',
      quota: { remaining: 19, resetAt: future() },
    }))
    const result = await analyzePhotoViaRelay(new Blob(['x']), { fetchImpl })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(`${RELAY_URL}/v1/meal/analyze`)
    expect(init.headers['X-Install-Id']).toBe(getInstallId())
    expect(JSON.parse(init.body)).toEqual({ kind: 'photo', image: { mimeType: 'image/jpeg', data: 'AAAA' } })
    expect(result).toMatchObject({ provider: 'relay', model: 'gemini-2.5-flash-lite', dish: 'Pomme' })
    expect(result.items).toHaveLength(1)
    expect(getLastQuota()).toMatchObject({ remaining: 19 })
  })

  it('texte : description tronquée à 500 caractères, vide refusée sans appel', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ parsed: { not_food: false, ingredients: [] }, model: 'm', quota: null }))
    await analyzeTextViaRelay('a'.repeat(600), { fetchImpl })
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ kind: 'text', description: 'a'.repeat(500) })
    await expect(analyzeTextViaRelay('  ', { fetchImpl })).rejects.toThrow(/Décrivez/)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('« pas un repas » : la raison du modèle est montrée', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ parsed: { not_food: true, reason: 'Un chat.' }, model: 'm' }))
    await expect(analyzePhotoViaRelay(new Blob(['x']), { fetchImpl })).rejects.toThrow('Un chat.')
  })

  it('quota épuisé (429) : message du relais, compteur à 0', async () => {
    const resetAt = future()
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({
      error: 'quota', scope: 'install', message: "Vous avez utilisé toutes vos analyses IA d'aujourd'hui. Elles reviennent demain.", resetAt,
    }, 429))
    await expect(analyzeTextViaRelay('pomme', { fetchImpl })).rejects.toThrow(/reviennent demain/)
    expect(getLastQuota()).toEqual({ remaining: 0, resetAt })
  })

  it('réseau absent ou délai dépassé : message clair', async () => {
    await expect(analyzeTextViaRelay('pomme', { fetchImpl: () => Promise.reject(new TypeError('Failed to fetch')) }))
      .rejects.toThrow(/Pas de connexion/)
    const hang = (_url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => {
      const e = new Error('aborted'); e.name = 'AbortError'; reject(e)
    }))
    await expect(analyzeTextViaRelay('pomme', { fetchImpl: hang, timeoutMs: 10 })).rejects.toThrow(/trop de temps/)
  })

  it('erreur du serveur sans JSON : message générique', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 502, json: () => Promise.reject(new Error('html')) })
    await expect(analyzeTextViaRelay('pomme', { fetchImpl })).rejects.toThrow(/n'a pas abouti/)
  })

  it('compteur périmé (jour suivant) : rien n’est affiché', () => {
    localStorage.setItem('halcya_ai_quota', JSON.stringify({ remaining: 3, resetAt: new Date(Date.now() - 1000).toISOString() }))
    expect(getLastQuota()).toBeNull()
  })
})

describe('crédits d’analyse IA (jalon 6c-3b)', () => {
  beforeEach(() => localStorage.clear())
  const nextMonth = () => new Date(Date.now() + 10 * 86400_000).toISOString()

  it('mémorise les crédits renvoyés et les renvoie au relais (X-Credits), avec le jeton d’achat', async () => {
    localStorage.setItem('halcya_purchase_token', 'tok_abcdefghijklmnopqrstuvwxyz')
    const credits = { plan: 'free', remaining: 24, monthly: 14, welcome: 10, resetAt: nextMonth(), state: '2026-10:1:0' }
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ parsed: { not_food: false, ingredients: [] }, model: 'm', credits }))
    await analyzeTextViaRelay('pomme', { fetchImpl })
    expect(getLastCredits()).toEqual(credits)
    expect(fetchImpl.mock.calls[0][1].headers['X-Purchase-Token']).toBe('tok_abcdefghijklmnopqrstuvwxyz')
    await analyzeTextViaRelay('pomme', { fetchImpl })
    expect(fetchImpl.mock.calls[1][1].headers['X-Credits']).toBe('2026-10:1:0')
  })

  it('crédits épuisés (429 « credits ») : message du relais, compteur à 0', async () => {
    const credits = { plan: 'free', remaining: 0, monthly: 0, welcome: 0, resetAt: nextMonth(), state: '2026-10:15:10' }
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ error: 'quota', scope: 'credits', message: 'Vous avez utilisé toutes vos analyses IA gratuites.', credits }, 429))
    await expect(analyzeTextViaRelay('pomme', { fetchImpl })).rejects.toThrow(/gratuites/)
    expect(getLastCredits().remaining).toBe(0)
  })

  it('refreshCredits : GET /v1/credits ; hors connexion, garde le dernier état', async () => {
    const credits = { plan: 'premium', remaining: 10, daily: 10, resetAt: future(), state: '2026-10:0:0' }
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ credits }))
    expect(await refreshCredits({ fetchImpl })).toEqual(credits)
    expect(fetchImpl.mock.calls[0][0]).toBe(`${RELAY_URL}/v1/credits`)
    expect(await refreshCredits({ fetchImpl: () => Promise.reject(new TypeError('offline')) })).toEqual(credits)
  })

  it('phrase du compteur : gratuit (date de renouvellement), premium (demain), périmé (rien)', () => {
    expect(describeCredits({ plan: 'free', remaining: 12, resetAt: '2026-11-01T00:00:00.000Z' })).toMatch(/^12 analyses IA restantes · renouvellement le 1er novembre$/)
    expect(describeCredits({ plan: 'free', remaining: 1, resetAt: '2026-11-01T00:00:00.000Z' })).toMatch(/^1 analyse IA restante/)
    expect(describeCredits({ plan: 'premium', remaining: 9, resetAt: future() })).toBe('9 analyses IA restantes aujourd’hui · renouvellement demain')
    expect(describeCredits(null)).toBeNull()
    localStorage.setItem('halcya_ai_credits', JSON.stringify({ plan: 'free', remaining: 3, resetAt: new Date(Date.now() - 1000).toISOString() }))
    expect(getLastCredits()).toBeNull()
  })
})
