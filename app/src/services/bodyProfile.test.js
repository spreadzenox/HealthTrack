import { describe, it, expect } from 'vitest'
import { getBodyProfile, computeBmi } from './bodyProfile'

describe('bodyProfile', () => {
  it('reads latest weight and height from Health Connect', async () => {
    const profile = await getBodyProfile([
      { type: 'weight', source: 'health_connect', at: '2026-05-21T08:00:00Z', payload: { valueKg: 73 } },
      { type: 'height', source: 'health_connect', at: '2026-05-01T08:00:00Z', payload: { valueCm: 178 } },
    ])
    expect(profile.weightKg).toBe(73)
    expect(profile.heightCm).toBe(178)
    expect(profile.source).toBe('health_connect')
  })

  it('reads latest Withings weight and height', async () => {
    const entries = [
      { type: 'weight', source: 'withings', at: '2026-05-20T08:00:00Z', payload: { valueKg: 72.5 } },
      { type: 'height', source: 'withings', at: '2026-05-01T08:00:00Z', payload: { valueCm: 178 } },
      { type: 'weight', source: 'withings', at: '2026-05-21T08:00:00Z', payload: { valueKg: 73 } },
    ]
    const profile = await getBodyProfile(entries)
    expect(profile.weightKg).toBe(73)
    expect(profile.heightCm).toBe(178)
    expect(profile.source).toBe('withings')
  })

  it('falls back to defaults when no Withings data', async () => {
    const profile = await getBodyProfile([])
    expect(profile.source).toBe('default')
    expect(profile.weightKg).toBeGreaterThan(0)
  })

  it('computes BMI', () => {
    expect(computeBmi(70, 175)).toBeCloseTo(22.9, 1)
  })
})
