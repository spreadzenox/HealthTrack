import { describe, it, expect, vi, beforeEach } from 'vitest'
import { postRelay, sendFeedback } from './aiRelay'

// App Attest est propre à l'iPhone (ancien correctif 38) : sur Android et dans le navigateur, ni en-tête X-AppAttest-*,
// ni appel au relais de plus (défi, enregistrement) ; le corps envoyé reste le même JSON.
const noIntegrity = { integrity: async () => ({ token: null, reason: 'no_plugin' }), testDevice: async () => false }

describe('App Attest hors iPhone', () => {
  beforeEach(() => localStorage.clear())

  it('analyse : un seul appel, aucun en-tête App Attest', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ parsed: { items: [] } }) }))
    const body = { text: 'une salade' }
    await postRelay(body, { fetchImpl, ...noIntegrity })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [, init] = fetchImpl.mock.calls[0]
    expect(Object.keys(init.headers).filter((h) => h.startsWith('X-AppAttest'))).toEqual([])
    expect(init.body).toBe(JSON.stringify(body))
  })

  it('« Votre avis » : un seul appel, aucun en-tête App Attest', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }))
    await sendFeedback('Très bien', { version: '880', variant: 'play', fetchImpl, ...noIntegrity })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toMatch(/\/v1\/feedback$/)
    expect(Object.keys(init.headers).filter((h) => h.startsWith('X-AppAttest'))).toEqual([])
  })
})
