import { describe, it, expect, vi, beforeEach } from 'vitest'
import { APP_ATTEST_KEY, ATTEST_RETRY_MS, clientDataFor, appAttestHeaders, iosAttestHeaders, sha256Hex } from './appAttest.js'

// Version iOS (HealthTrack-iOS), étape I6 : App Attest selon les routes du relais d'Android (v712, #628,
// relay/src/attestroutes.js) : clé attestée une fois (défi à usage unique ; /v1/attest/register reçoit en JSON
// { keyId, attestation, challenge }), puis une assertion par requête sensible, en en-têtes X-AppAttest-Key,
// -Assertion et -Time (ceux qu'autorise le CORS du relais).
const RELAY = 'https://relais.example'
const CORPS = '{"dish":"salade"}'

function fakePlugin({ supported = true, assertionError = null } = {}) {
  return {
    isSupported: vi.fn(async () => ({ supported })),
    generateKey: vi.fn(async () => ({ keyId: 'cle-1' })),
    attestKey: vi.fn(async () => ({ attestation: 'YXR0ZXN0YXRpb24=' })),
    generateAssertion: vi.fn(async () => {
      if (assertionError) throw Object.assign(new Error('assertion refusée'), { code: assertionError })
      return { assertion: 'YXNzZXJ0aW9u' }
    }),
  }
}
function fakeRelay({ registerOk = true } = {}) {
  return vi.fn(async (url) => {
    if (url.endsWith('/v1/attest/challenge')) return { ok: true, json: async () => ({ challenge: 'Bw'.padEnd(43, 'A') + '=', expiresInSec: 300 }) }
    if (url.endsWith('/v1/attest/register')) return { ok: registerOk, json: async () => ({ ok: registerOk }) }
    return { ok: false, json: async () => ({}) }
  })
}

describe('App Attest sur iPhone (contrat I6-RELAIS-5)', () => {
  beforeEach(() => localStorage.clear())

  it('clientData : « halcya-assert:<installation>:<horodatage ms>:<SHA-256 du corps> »', async () => {
    expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect(await clientDataFor({ installId: 'install-1', timeMs: 1762070400000, body: '' }))
      .toBe('halcya-assert:install-1:1762070400000:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('première requête : clé tirée, attestée sur le défi du relais, enregistrée, puis assertion en en-têtes', async () => {
    const plugin = fakePlugin()
    const fetchImpl = fakeRelay()
    const headers = await appAttestHeaders({ plugin, installId: 'install-1', body: CORPS, now: 1762070400000, relayUrl: RELAY, fetchImpl })
    expect(plugin.attestKey).toHaveBeenCalledWith({ keyId: 'cle-1', challenge: expect.any(String) })
    const challenge = fetchImpl.mock.calls.find(([url]) => url.endsWith('/v1/attest/challenge'))
    expect(challenge[1]).toMatchObject({ method: 'POST', headers: { 'X-Install-Id': 'install-1' } })
    const register = fetchImpl.mock.calls.find(([url]) => url.endsWith('/v1/attest/register'))
    expect(register[1]).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Install-Id': 'install-1' } })
    expect(JSON.parse(register[1].body)).toEqual({ keyId: 'cle-1', attestation: 'YXR0ZXN0YXRpb24=', challenge: 'Bw'.padEnd(43, 'A') + '=' })
    expect(plugin.generateAssertion).toHaveBeenCalledWith({ keyId: 'cle-1', clientData: await clientDataFor({ installId: 'install-1', timeMs: 1762070400000, body: CORPS }) })
    expect(headers).toEqual({ 'X-AppAttest-Key': 'cle-1', 'X-AppAttest-Assertion': 'YXNzZXJ0aW9u', 'X-AppAttest-Time': '1762070400000' })
    expect(JSON.parse(localStorage.getItem(APP_ATTEST_KEY))).toEqual({ keyId: 'cle-1', registered: true })
  })

  it('requêtes suivantes : ni nouvelle clé ni nouvelle attestation', async () => {
    localStorage.setItem(APP_ATTEST_KEY, JSON.stringify({ keyId: 'cle-1', registered: true }))
    const plugin = fakePlugin()
    const fetchImpl = fakeRelay()
    await appAttestHeaders({ plugin, installId: 'install-1', body: CORPS, now: 1, relayUrl: RELAY, fetchImpl })
    expect(plugin.generateKey).not.toHaveBeenCalled()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('simulateur (pas de Secure Enclave) : « X-Integrity-Status: unsupported », rien d’autre', async () => {
    const plugin = fakePlugin({ supported: false })
    expect(await appAttestHeaders({ plugin, installId: 'install-1', body: CORPS, relayUrl: RELAY, fetchImpl: fakeRelay() })).toEqual({ 'X-Integrity-Status': 'unsupported' })
    expect(plugin.generateKey).not.toHaveBeenCalled()
  })

  it('relais sans la route (coupée par défaut) ou enregistrement refusé : aucun en-tête, nouvel essai dans une heure', async () => {
    const plugin = fakePlugin()
    const fetchImpl = fakeRelay({ registerOk: false })
    expect(await appAttestHeaders({ plugin, installId: 'install-1', body: CORPS, now: 1000, relayUrl: RELAY, fetchImpl })).toEqual({})
    expect(JSON.parse(localStorage.getItem(APP_ATTEST_KEY))).toEqual({ keyId: 'cle-1', registered: false, retryAt: 1000 + ATTEST_RETRY_MS })
    expect(plugin.generateAssertion).not.toHaveBeenCalled()
    // Dans l'heure : aucune requête de plus vers le relais à chaque analyse
    fetchImpl.mockClear()
    expect(await appAttestHeaders({ plugin, installId: 'install-1', body: CORPS, now: 1000 + ATTEST_RETRY_MS - 1, relayUrl: RELAY, fetchImpl })).toEqual({})
    expect(fetchImpl).not.toHaveBeenCalled()
    // Une heure après : nouvel essai, avec la même clé
    await appAttestHeaders({ plugin, installId: 'install-1', body: CORPS, now: 1000 + ATTEST_RETRY_MS, relayUrl: RELAY, fetchImpl })
    expect(fetchImpl).toHaveBeenCalled()
    expect(plugin.generateKey).toHaveBeenCalledTimes(1)
  })

  it('clé perdue (restauration sur un autre iPhone) : oubliée, une neuve sera tirée à la requête suivante', async () => {
    localStorage.setItem(APP_ATTEST_KEY, JSON.stringify({ keyId: 'cle-1', registered: true }))
    const headers = await appAttestHeaders({ plugin: fakePlugin({ assertionError: 'invalid_key' }), installId: 'install-1', body: CORPS, relayUrl: RELAY, fetchImpl: fakeRelay() })
    expect(headers).toEqual({})
    expect(localStorage.getItem(APP_ATTEST_KEY)).toBeNull()
  })

  it('sans plugin (autre plateforme) : aucun en-tête', async () => {
    expect(await appAttestHeaders({ plugin: null, installId: 'install-1', body: CORPS, relayUrl: RELAY })).toEqual({})
  })

  it('pour aiRelay.js (correctif 38) : iPhone seulement ; ailleurs ou en cas d’erreur, rien', async () => {
    const plugin = fakePlugin()
    expect(await iosAttestHeaders({ platform: 'web', plugin, installId: 'install-1', body: CORPS, relayUrl: RELAY, fetchImpl: fakeRelay() })).toEqual({})
    expect(plugin.isSupported).not.toHaveBeenCalled()
    expect(await iosAttestHeaders({ platform: 'android', plugin, installId: 'install-1', body: CORPS, relayUrl: RELAY, fetchImpl: fakeRelay() })).toEqual({})
    const headers = await iosAttestHeaders({ platform: 'ios', plugin, installId: 'install-1', body: CORPS, now: 5, relayUrl: RELAY, fetchImpl: fakeRelay() })
    expect(headers).toMatchObject({ 'X-AppAttest-Key': 'cle-1', 'X-AppAttest-Time': '5' })
    const broken = { isSupported: vi.fn(async () => { throw new Error('pont absent') }) }
    expect(await iosAttestHeaders({ platform: 'ios', plugin: broken, installId: 'install-1', body: CORPS, relayUrl: RELAY })).toEqual({})
  })
})
