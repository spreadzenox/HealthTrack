import { describe, it, expect } from 'vitest'
import { auditTable, energyFromMacros, dryCookedKey } from './audit.mjs'

const micros = (k) => ({ vitamin_c_mg: k, calcium_mg: k * 2, iron_mg: k / 10, magnesium_mg: k * 3, potassium_mg: k * 20, sodium_mg: k })

describe('auditTable', () => {
  it('énergie recalculée selon le règlement UE', () => {
    expect(energyFromMacros({ protein_g: 10, carbohydrates_g: 20, fat_g: 5, fiber_g: 3, alcohol_g: 1 })).toBe(40 + 80 + 45 + 6 + 7)
    expect(energyFromMacros({ protein_g: 10, carbohydrates_g: null, fat_g: 5 })).toBeNull()
  })

  it('repère énergie incohérente, sucres > glucides et AGS > lipides', () => {
    const r = auditTable({
      ok: { energy_kcal: 100, protein_g: 5, carbohydrates_g: 15, fat_g: 2, fiber_g: 1, sugar_g: 3, saturated_fat_g: 1 },
      energie: { energy_kcal: 0, protein_g: 5, carbohydrates_g: 15, fat_g: 2 },
      sucre: { energy_kcal: 40, protein_g: 0, carbohydrates_g: 10, fat_g: 0, sugar_g: 12 },
      ags: { energy_kcal: 18, protein_g: 0, carbohydrates_g: 0, fat_g: 2, saturated_fat_g: 3 },
    })
    expect(r.summary).toMatchObject({ energy: 1, sugar: 1, saturatedFat: 1 })
    expect(r.issues.energy[0].name).toBe('energie')
  })

  it('repère les vecteurs de micronutriments identiques, pas les aliments pauvres', () => {
    const r = auditTable({
      'Ail, cru': micros(10),
      'Oignon, cru': micros(10),
      'Poireau, cru': micros(11),
      Eau: { sodium_mg: 1 },
      Sucre: { sodium_mg: 1 },
    })
    expect(r.issues.identicalMicros).toEqual([['Ail, cru', 'Oignon, cru']])
  })

  it('repère sec / cuit implausibles', () => {
    const r = auditTable({
      'Lentille, sèche': { energy_kcal: 300, potassium_mg: 900, iron_mg: 7 },
      'Lentille, cuite': { energy_kcal: 120, potassium_mg: 900, iron_mg: 7 },
      'Riz, cru': { energy_kcal: 350, potassium_mg: 100 },
      'Riz, cuit': { energy_kcal: 400, potassium_mg: 30 },
      'Pois, sec': { energy_kcal: 300, potassium_mg: 900, iron_mg: 5 },
      'Pois, cuit': { energy_kcal: 110, potassium_mg: 300, iron_mg: 2 },
    })
    expect(r.issues.dryCooked.map((d) => d.base)).toEqual(['lentille', 'riz'])
  })

  it('reconnaît les états sec / cuit des noms Ciqual', () => {
    expect(dryCookedKey('Lentille verte, sèche')).toEqual({ base: 'lentille verte', state: 'sec' })
    expect(dryCookedKey('Lentille verte, cuite')).toEqual({ base: 'lentille verte', state: 'cuit' })
    expect(dryCookedKey('Pomme')).toBeNull()
  })

  it('une valeur absente est inconnue, jamais 0', () => {
    expect(auditTable({ a: { energy_kcal: 10 } }).unknownShare).toBeGreaterThan(0.9)
  })
})
