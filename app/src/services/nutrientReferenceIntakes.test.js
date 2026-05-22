import { describe, it, expect } from 'vitest'
import {
  computeBmr,
  computeDailyEnergyKcal,
  computeDailyNutrientTargets,
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
