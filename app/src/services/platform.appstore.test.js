import { describe, it, expect, vi } from 'vitest'

// Version iOS (HealthTrack-iOS) : l'app iPhone se signale au relais par `X-Platform: ios`. Décision du propriétaire du
// 2/11 : la période de lancement s'arrête sur iPhone le 6/11 inclus, plus tôt que sur Google Play ; le relais
// d'Android (v722, #638, `iosUntil`) s'appuie sur cet en-tête, que l'app d'Android ajoute elle-même depuis v722
// (`platformHeaders` d'aiRelay.js, quand `VITE_STORE=appstore`). Vérifié ici dans la variante de l'iPhone (le correctif
// 40, qui l'ajoutait côté iOS, est retiré).
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore'), STORE: actual.storeFor('appstore') }
})

import { refreshEntitlement } from './entitlement'
import { platformHeaders } from './aiRelay'
import { storeFor } from '../config/distribution'

const relais = (payload = { ok: true, premium: true, source: 'launch', launchUntil: '2026-11-06T23:00:00Z' }) =>
  vi.fn(async () => ({ ok: true, status: 200, json: async () => payload }))

describe('plateforme iPhone signalée au relais', () => {
  it('vérification des droits sans achat (période de lancement) : X-Platform: ios', async () => {
    const fetchImpl = relais()
    const ent = await refreshEntitlement({ fetchImpl })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toMatch(/\/v1\/subscription\/verify$/)
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', 'X-Platform': 'ios' })
    expect(init.headers['X-Install-Id']).toBeTruthy()
    expect(JSON.parse(init.body)).toEqual({})
    expect(ent.launchUntil).toBe('2026-11-06T23:00:00Z')
  })

  it('avec un achat de l’App Store : X-Platform: ios aussi', async () => {
    const fetchImpl = relais({ ok: true, premium: true, source: 'appstore', state: 'active', tier: 'silver' })
    await refreshEntitlement({ purchaseToken: 'tx.jws.signe', fetchImpl })
    expect(fetchImpl.mock.calls[0][1].headers).toMatchObject({ 'X-Platform': 'ios' })
  })

  it('jamais sur Android ni en sideload', () => {
    expect(platformHeaders()).toEqual({ 'X-Platform': 'ios' })
    expect(platformHeaders(storeFor('play'))).toEqual({})
    expect(platformHeaders(storeFor('sideload'))).toEqual({})
  })
})
