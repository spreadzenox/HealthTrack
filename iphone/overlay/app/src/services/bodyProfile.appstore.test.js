import { describe, it, expect, beforeEach } from 'vitest'
import { getBodyProfile, getLatestBodyComposition } from './bodyProfile'

// Version iOS (HealthTrack-iOS) : le poids et la masse grasse lus dans l'app Santé (source `health_connect`, le même
// connecteur qu'Android) ne sont pas une saisie de la personne : ils ont leur propre origine, et la masse grasse de
// l'app Santé est montrée comme celle de Withings (correctif 35, demande de `DEMANDES.md` du 29/10).
const NOW = new Date(2026, 9, 31, 10)

describe('poids et masse grasse de l’app Santé', () => {
  beforeEach(() => localStorage.clear())

  it('un poids de l’app Santé a l’origine « health », pas « manual »', async () => {
    const p = await getBodyProfile([{ type: 'weight', source: 'health_connect', at: new Date(2026, 9, 28, 7).toISOString(), payload: { valueKg: 77.2 } }], NOW)
    expect(p.weightKg).toBe(77.2)
    expect(p.origins.weight).toBe('health')
  })

  it('un poids saisi dans l’app reste « manual », un poids de Withings reste « withings »', async () => {
    const at = new Date(2026, 9, 28, 7).toISOString()
    expect((await getBodyProfile([{ type: 'weight', source: 'manual', at, payload: { valueKg: 70 } }], NOW)).origins.weight).toBe('manual')
    expect((await getBodyProfile([{ type: 'weight', source: 'withings', at, payload: { valueKg: 70 } }], NOW)).origins.weight).toBe('withings')
  })

  it('la masse grasse de l’app Santé est montrée, avec sa source ; la plus récente l’emporte', () => {
    const hk = { type: 'body_composition', source: 'health_connect', at: new Date(2026, 9, 29, 7).toISOString(), payload: { fatRatioPct: 21.2 } }
    const wi = { type: 'body_composition', source: 'withings', at: new Date(2026, 9, 20, 7).toISOString(), payload: { fatRatioPct: 22, muscleMassKg: 32.4 } }
    expect(getLatestBodyComposition([hk])).toEqual({ fatRatioPct: 21.2, source: 'health_connect' })
    expect(getLatestBodyComposition([wi, hk])).toEqual({ fatRatioPct: 21.2, source: 'health_connect' })
    expect(getLatestBodyComposition([{ ...wi, at: new Date(2026, 9, 30, 7).toISOString() }, hk]).source).toBe('withings')
    expect(getLatestBodyComposition([])).toBeNull()
  })
})
