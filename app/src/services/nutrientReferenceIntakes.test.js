import { describe, it, expect } from 'vitest'
import {
  computeBmr,
  computeDailyEnergyKcal,
  computeDailyNutrientTargets,
  ACTIVITY_LEVELS,
  activityFromSteps,
} from './nutrientReferenceIntakes'

describe('nutrientReferenceIntakes', () => {
  const profile = { weightKg: 75, heightCm: 175, sex: 'M', age: 35 }

  it('computes BMR for male', () => {
    const bmr = computeBmr(profile)
    expect(bmr).toBeGreaterThan(1500)
    expect(bmr).toBeLessThan(2000)
  })

  it('computes daily energy with activity factor', () => {
    const kcal = computeDailyEnergyKcal(profile)
    expect(kcal).toBeGreaterThan(computeBmr(profile))
  })

  it('applique le niveau d\'activité (×1,55 par défaut, comme avant)', () => {
    const bmr = computeBmr(profile)
    expect(computeDailyEnergyKcal(profile)).toBe(Math.round(bmr * 1.55))
    expect(computeDailyEnergyKcal({ ...profile, activity: 'sedentary' })).toBe(Math.round(bmr * 1.4))
    expect(computeDailyEnergyKcal({ ...profile, activity: 'very_active' })).toBe(Math.round(bmr * 1.85))
    expect(computeDailyEnergyKcal({ ...profile, activity: 'inconnu' })).toBe(Math.round(bmr * 1.55))
  })

  it('les niveaux d\'activité sont ordonnés et libellés en français', () => {
    expect(ACTIVITY_LEVELS.map((l) => l.id)).toEqual(['sedentary', 'moderate', 'active', 'very_active'])
    expect(ACTIVITY_LEVELS.map((l) => l.factor)).toEqual([1.4, 1.55, 1.7, 1.85])
    expect(ACTIVITY_LEVELS[0].label).toBe('Sédentaire')
  })

  it('déduit le niveau d\'activité des pas quotidiens moyens', () => {
    expect(activityFromSteps(3200)).toBe('sedentary')
    expect(activityFromSteps(4999)).toBe('sedentary')
    expect(activityFromSteps(5000)).toBe('moderate')
    expect(activityFromSteps(8200)).toBe('active')
    expect(activityFromSteps(12000)).toBe('very_active')
    expect(activityFromSteps(null)).toBeUndefined()
  })

  it('scales protein with weight (0.83 g/kg)', () => {
    const targets = computeDailyNutrientTargets(profile)
    expect(targets.protein_g).toBeCloseTo(75 * 0.83, 0)
  })

  it('uses higher iron for women', () => {
    const male = computeDailyNutrientTargets({ ...profile, sex: 'M' })
    const female = computeDailyNutrientTargets({ ...profile, sex: 'F' })
    expect(female.iron_mg).toBeGreaterThan(male.iron_mg)
  })

  it('includes all micronutrient targets', () => {
    const targets = computeDailyNutrientTargets(profile)
    expect(targets.vitamin_c_mg).toBe(110)
    expect(targets.calcium_mg).toBe(1000)
    expect(targets.vitamin_d_ug).toBe(15)
  })
})
