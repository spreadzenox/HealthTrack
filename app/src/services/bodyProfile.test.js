import { describe, it, expect, beforeEach } from 'vitest'
import { getBodyProfile, computeBmi } from './bodyProfile'
import { setBodySettings } from '../settings/bodySettings'
import { setWithingsUserProfile } from '../settings/withingsSettings'

describe('bodyProfile', () => {
  beforeEach(() => localStorage.clear())

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

  it('signale chaque valeur par défaut (rien de saisi, pas de Withings)', async () => {
    const profile = await getBodyProfile([])
    expect(profile).toMatchObject({ weightKg: 70, heightCm: 170, sex: undefined, age: undefined })
    expect(profile.origins).toEqual({ weight: 'default', height: 'default', sex: 'default', age: 'default' })
  })

  it('utilise le profil saisi dans l\'app (sexe, année de naissance, taille)', async () => {
    setBodySettings({ sex: 'F', birthYear: 1990, heightCm: 162 })
    const profile = await getBodyProfile([])
    expect(profile.sex).toBe('F')
    expect(profile.age).toBe(new Date().getFullYear() - 1990)
    expect(profile.heightCm).toBe(162)
    expect(profile.origins).toMatchObject({ height: 'manual', sex: 'manual', age: 'manual', weight: 'default' })
  })

  it('le profil saisi prime sur celui de Withings ; Withings complète ce qui manque', async () => {
    setWithingsUserProfile({ sex: 'M', age: 45 })
    setBodySettings({ sex: 'F' })
    const profile = await getBodyProfile([
      { type: 'height', source: 'withings', at: '2026-05-01T08:00:00Z', payload: { valueCm: 178 } },
    ])
    expect(profile.sex).toBe('F')
    expect(profile.age).toBe(45)
    expect(profile.heightCm).toBe(178)
    expect(profile.origins).toMatchObject({ sex: 'manual', age: 'withings', height: 'withings' })
  })

  it('une taille saisie dans l\'app prime sur celle de la balance', async () => {
    setBodySettings({ heightCm: 181 })
    const profile = await getBodyProfile([
      { type: 'height', source: 'withings', at: '2026-05-01T08:00:00Z', payload: { valueCm: 178 } },
    ])
    expect(profile.heightCm).toBe(181)
  })

  it('prend la pesée la plus récente, saisie à la main ou Withings', async () => {
    const entries = [
      { type: 'weight', source: 'withings', at: '2026-05-20T08:00:00Z', payload: { valueKg: 72.5 } },
      { type: 'weight', source: 'app_weight', at: '2026-06-02T08:00:00Z', payload: { valueKg: 71 } },
    ]
    const profile = await getBodyProfile(entries)
    expect(profile.weightKg).toBe(71)
    expect(profile.weightAt).toBe('2026-06-02T08:00:00Z')
    expect(profile.origins.weight).toBe('manual')
  })
})
