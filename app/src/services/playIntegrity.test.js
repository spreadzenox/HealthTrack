import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getIntegrityToken, integrityRequestHash, isTestDevice, requestIntegrity, resetIntegrityBackoff, resetTestDeviceCache } from './playIntegrity'

const TOKEN = 'a'.repeat(200)

describe('Play Integrity (variante play)', () => {
  beforeEach(() => {
    resetIntegrityBackoff()
    resetTestDeviceCache()
  })

  it('requestHash identique à requestHashFor du relais (sha256 de « halcya-integrity:<installation> »)', async () => {
    // Même vecteur que relay/test/integrity.test.js
    expect(await integrityRequestHash('abc123')).toBe('5540733c35182f8d31cc8b5f5da1f438d47dd58b691989c0f4036be0ef67c790')
  })

  it('demande un jeton lié à l’installation au plugin natif', async () => {
    const native = { request: vi.fn().mockResolvedValue({ token: TOKEN }) }
    expect(await getIntegrityToken('abc123', { native })).toBe(TOKEN)
    expect(native.request).toHaveBeenCalledWith({ requestHash: '5540733c35182f8d31cc8b5f5da1f438d47dd58b691989c0f4036be0ef67c790' })
  })

  it('sans plugin (sideload, navigateur, tests) : aucun jeton', async () => {
    expect(await getIntegrityToken('abc123', { native: null })).toBeNull()
    // Hors variante play, le chargement par défaut ne trouve pas de plugin
    expect(await getIntegrityToken('abc123')).toBeNull()
  })

  it('échec du plugin : pas de jeton, l’analyse part quand même', async () => {
    const native = { request: vi.fn().mockRejectedValue(Object.assign(new Error('Play Store absent'), { code: '-2' })) }
    expect(await getIntegrityToken('abc123', { native })).toBeNull()
  })

  it('jeton illisible ignoré', async () => {
    const native = { request: vi.fn().mockResolvedValue({ token: 42 }) }
    expect(await getIntegrityToken('abc123', { native })).toBeNull()
  })

  it('Google trop lent : on n’attend pas plus que le délai, puis on ne redemande pas pendant une heure', async () => {
    let now = 1_000_000
    const native = { request: vi.fn(() => new Promise(() => {})) }
    expect(await getIntegrityToken('abc123', { native, timeoutMs: 10, now: () => now })).toBeNull()
    expect(await getIntegrityToken('abc123', { native, timeoutMs: 10, now: () => now })).toBeNull()
    expect(native.request).toHaveBeenCalledTimes(1)
    now += 61 * 60_000
    native.request.mockResolvedValue({ token: TOKEN })
    expect(await getIntegrityToken('abc123', { native, timeoutMs: 10, now: () => now })).toBe(TOKEN)
  })

  it('sans jeton, dit pourquoi au relais (6b-2c-2) : jamais le message d’erreur, seulement un code borné', async () => {
    let now = 1_000_000
    const opts = (native) => ({ native, timeoutMs: 10, now: () => now })
    expect(await requestIntegrity('abc123', opts({ request: vi.fn().mockResolvedValue({ token: TOKEN }) }))).toEqual({ token: TOKEN, reason: null })
    expect(await requestIntegrity('abc123', opts(null))).toEqual({ token: null, reason: 'no_plugin' })
    const failing = (code) => ({ request: vi.fn().mockRejectedValue(Object.assign(new Error('Play Store absent sur cet appareil'), { code })) })
    expect(await requestIntegrity('abc123', opts(failing('-2')))).toEqual({ token: null, reason: 'error:-2' })
    expect(await requestIntegrity('abc123', opts(failing('UNKNOWN')))).toEqual({ token: null, reason: 'error:UNKNOWN' })
    expect(await requestIntegrity('abc123', opts(failing(undefined)))).toEqual({ token: null, reason: 'error:UNKNOWN' })
    expect(await requestIntegrity('abc123', opts(failing('message libre <x>')))).toEqual({ token: null, reason: 'error:UNKNOWN' })
    expect(await requestIntegrity('abc123', opts({ request: vi.fn().mockResolvedValue({ token: 42 }) }))).toEqual({ token: null, reason: 'bad_token' })
    const slow = { request: vi.fn(() => new Promise(() => {})) }
    expect(await requestIntegrity('abc123', opts(slow))).toEqual({ token: null, reason: 'timeout' })
    expect(await requestIntegrity('abc123', opts(slow))).toEqual({ token: null, reason: 'backoff' })
  })

  it('appareil de test de Google (Firebase Test Lab, INSTALLS-21) : lu une fois, jamais d’erreur', async () => {
    const native = { environment: vi.fn().mockResolvedValue({ testLab: true }) }
    expect(await isTestDevice({ native })).toBe(true)
    expect(await isTestDevice({ native })).toBe(true)
    expect(native.environment).toHaveBeenCalledTimes(1)
    resetTestDeviceCache()
    expect(await isTestDevice({ native: { environment: vi.fn().mockResolvedValue({ testLab: false }) } })).toBe(false)
    resetTestDeviceCache()
    expect(await isTestDevice({ native: { environment: vi.fn().mockRejectedValue(new Error('ancienne version')) } })).toBe(false)
    resetTestDeviceCache()
    expect(await isTestDevice({ native: {} })).toBe(false)
    resetTestDeviceCache()
    expect(await isTestDevice({ native: null })).toBe(false)
  })
})
