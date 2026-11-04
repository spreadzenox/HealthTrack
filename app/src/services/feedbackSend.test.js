import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RELAY_URL, getInstallId, sendFeedback, FEEDBACK_MAX_LENGTH } from './aiRelay'

const res = (body, status = 200) => ({ ok: status < 400, status, json: () => Promise.resolve(body) })
const noIntegrity = () => Promise.resolve({ token: null, reason: 'no_plugin' })
const notTest = () => Promise.resolve(false)

describe('« Votre avis » envoyé au relais (AVIS-RELAIS-2)', () => {
  beforeEach(() => localStorage.clear())

  it('envoie le texte, la version et la variante, rien d’autre', async () => {
    localStorage.setItem('halcya_purchase_token', 'jeton-achat')
    const fetchImpl = vi.fn().mockResolvedValue(res({ ok: true }))
    await expect(sendFeedback('  Super app  ', { version: '1.2.3', variant: 'play', fetchImpl, integrity: noIntegrity, testDevice: notTest })).resolves.toBe(true)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(`${RELAY_URL}/v1/feedback`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ text: 'Super app', version: '1.2.3', variant: 'play' })
    expect(init.headers['X-Install-Id']).toBe(getInstallId())
    expect(init.headers['X-Integrity-Status']).toBe('no_plugin')
    // ni jeton d'achat, ni crédits : l'avis n'a rien à voir avec l'abonnement
    expect(init.headers).not.toHaveProperty('X-Purchase-Token')
    expect(init.headers).not.toHaveProperty('X-Credits')
  })

  it('joint le jeton Play Integrity quand Google Play en fournit un', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res({ ok: true }))
    await sendFeedback('Bien', { fetchImpl, integrity: () => Promise.resolve({ token: 'jeton', reason: null }), testDevice: notTest })
    expect(fetchImpl.mock.calls[0][1].headers['X-Integrity-Token']).toBe('jeton')
  })

  it('refuse un texte vide ou trop long sans rien envoyer', async () => {
    const fetchImpl = vi.fn()
    await expect(sendFeedback('   ', { fetchImpl, integrity: noIntegrity, testDevice: notTest })).rejects.toThrow(/quelques mots/)
    await expect(sendFeedback('a'.repeat(FEEDBACK_MAX_LENGTH + 1), { fetchImpl, integrity: noIntegrity, testDevice: notTest })).rejects.toThrow(/2000/)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rend le message du relais (quota) ou un message de connexion', async () => {
    const quota = vi.fn().mockResolvedValue(res({ error: 'quota', message: 'Merci ! Vous avez déjà envoyé 5 avis aujourd’hui.' }, 429))
    await expect(sendFeedback('Encore', { fetchImpl: quota, integrity: noIntegrity, testDevice: notTest })).rejects.toThrow(/5 avis/)
    const offline = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(sendFeedback('Encore', { fetchImpl: offline, integrity: noIntegrity, testDevice: notTest })).rejects.toThrow(/Pas de connexion/)
  })
})
