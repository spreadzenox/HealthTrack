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
    expect(profile.origins).toEqual({ weight: 'default', height: 'default', sex: 'default', age: 'default', activity: 'default' })
    expect(profile.activity).toBe('moderate')
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

  describe('niveau d\'activité', () => {
    const NOW = new Date('2026-10-11T12:00:00')
    const stepsDays = (values, { period = 'day' } = {}) => values.map((v, i) => {
      const d = new Date(NOW)
      d.setDate(d.getDate() - (i + 1))
      d.setHours(0, 0, 0, 0)
      return { type: 'steps', source: 'health_connect', at: d.toISOString(), payload: { value: v, period } }
    })

    it('est estimé d\'après la moyenne des pas des 14 derniers jours (aujourd\'hui exclu)', async () => {
      const entries = [
        ...stepsDays([8000, 9000, 8500, 7600, 9900, 8100, 8400, 8800]),
        // Aujourd'hui (journée en cours) : ne compte pas.
        { type: 'steps', source: 'health_connect', at: new Date('2026-10-11T08:00:00').toISOString(), payload: { value: 200, period: 'day' } },
      ]
      const profile = await getBodyProfile(entries, NOW)
      expect(profile.activity).toBe('active')
      expect(profile.origins.activity).toBe('steps')
      expect(profile.meanSteps).toBe(8538)
      expect(profile.stepsDays).toBe(8)
    })

    it('ignore les jours sans pas et reste par défaut sous 7 jours mesurés', async () => {
      const profile = await getBodyProfile(stepsDays([12000, 0, 11000, 13000, 0, 12500, 11800]), NOW)
      expect(profile.origins.activity).toBe('default')
      expect(profile.activity).toBe('moderate')
    })

    it('ne compte pas les pas de plus de 14 jours', async () => {
      const old = stepsDays(new Array(20).fill(15000)).slice(14)
      const profile = await getBodyProfile(old, NOW)
      expect(profile.origins.activity).toBe('default')
    })

    it('le niveau choisi dans l\'app prime sur l\'estimation', async () => {
      setBodySettings({ activity: 'sedentary' })
      const profile = await getBodyProfile(stepsDays(new Array(10).fill(12000)), NOW)
      expect(profile.activity).toBe('sedentary')
      expect(profile.origins.activity).toBe('manual')
    })
  })
})
