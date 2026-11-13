import { describe, it, expect, vi, beforeEach } from 'vitest'

// Version iOS (HealthTrack-iOS), étape I6 : l'analyse des repas porte l'assertion App Attest de l'iPhone (correctif 38),
// calculée sur le corps exact envoyé : le relais d'Android la vérifie sur le corps brut (v713, #629, I6-RELAIS-5d-2).
const attest = vi.hoisted(() => ({ calls: [] }))
vi.mock('../ios/appAttest.js', () => ({
  iosAttestHeaders: vi.fn(async (args) => {
    attest.calls.push(args)
    return { 'X-AppAttest-Key': 'cle-1', 'X-AppAttest-Assertion': 'YXNzZXJ0aW9u', 'X-AppAttest-Time': '5' }
  }),
}))

import { analyzeTextViaRelay, postRelay, sendFeedback } from './aiRelay'

describe('analyse des repas : assertion App Attest de l’iPhone (correctif 38)', () => {
  beforeEach(() => {
    localStorage.clear()
    attest.calls.length = 0
  })

  it('en-têtes X-AppAttest-* ajoutés, signés sur le corps exact de la requête', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ parsed: { items: [] } }) }))
    await analyzeTextViaRelay('une salade', { fetchImpl, integrity: async () => ({ token: null, reason: 'no_plugin' }), testDevice: async () => false })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toMatch(/\/v1\/meal\/analyze$/)
    expect(init.headers).toMatchObject({ 'X-AppAttest-Key': 'cle-1', 'X-AppAttest-Assertion': 'YXNzZXJ0aW9u', 'X-AppAttest-Time': '5' })
    expect(attest.calls).toHaveLength(1)
    expect(attest.calls[0].body).toBe(init.body)
    expect(attest.calls[0].installId).toBe(init.headers['X-Install-Id'])
  })
})

// Selles en photo (Android v809, SELLES-PHOTO-2) : même chemin que l'analyse des repas (`postRelay` avec `path`),
// donc même assertion sur le corps exact, prête pour le jour où la fonction s'ouvre sur iPhone (masquée, correctif 42)
describe('analyse des selles : assertion App Attest de l’iPhone (correctif 38)', () => {
  beforeEach(() => {
    localStorage.clear()
    attest.calls.length = 0
  })

  it('POST /v1/stool/analyze signé sur le corps exact', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ parsed: { visible: false } }) }))
    await postRelay({ image: { mimeType: 'image/jpeg', data: 'AAAA' } }, { path: '/v1/stool/analyze', fetchImpl, integrity: async () => ({ token: null, reason: 'no_plugin' }), testDevice: async () => false })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toMatch(/\/v1\/stool\/analyze$/)
    expect(init.headers).toMatchObject({ 'X-AppAttest-Key': 'cle-1', 'X-AppAttest-Assertion': 'YXNzZXJ0aW9u', 'X-AppAttest-Time': '5' })
    expect(attest.calls[0].body).toBe(init.body)
  })
})

// « Votre avis » (Android v782, AVIS-RELAIS-2) : le relais attend l'assertion sur POST /v1/feedback comme sur l'analyse
// (POUR-IOS.md du 04/11 23:35) ; même corps exact signé, même identifiant d'installation
describe('« Votre avis » : assertion App Attest de l’iPhone (correctif 38)', () => {
  beforeEach(() => {
    localStorage.clear()
    attest.calls.length = 0
  })

  it('en-têtes X-AppAttest-* ajoutés, signés sur le corps exact de l’avis', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }))
    await sendFeedback('  Très bien sur iPhone  ', { version: '782', variant: 'ios', fetchImpl, integrity: async () => ({ token: null, reason: 'no_plugin' }), testDevice: async () => false })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toMatch(/\/v1\/feedback$/)
    expect(JSON.parse(init.body)).toEqual({ text: 'Très bien sur iPhone', version: '782', variant: 'ios' })
    expect(init.headers).toMatchObject({ 'X-AppAttest-Key': 'cle-1', 'X-AppAttest-Assertion': 'YXNzZXJ0aW9u', 'X-AppAttest-Time': '5' })
    expect(attest.calls).toHaveLength(1)
    expect(attest.calls[0].body).toBe(init.body)
    expect(attest.calls[0].installId).toBe(init.headers['X-Install-Id'])
  })

  it('texte vide : rien n’est signé ni envoyé', async () => {
    const fetchImpl = vi.fn()
    await expect(sendFeedback('   ', { fetchImpl })).rejects.toThrow('Écrivez quelques mots')
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(attest.calls).toHaveLength(0)
  })
})
