import { describe, it, expect } from 'vitest'
import { cookedGos, LEGUMES, buildLegumeEntries } from './legumeGos.mjs'
import measurements from '../../src/data/fodmapMeasurements.json'
import table from '../../src/data/ingredientsNutrition.json'

describe('cookedGos (GOS d’une légumineuse cuite depuis sa mesure à sec)', () => {
  it('ramène la base sèche à l’eau du cuit, puis applique les pertes au trempage et à la cuisson', () => {
    // lentille : Siva 2019 (base 10 % d’eau) raffinose 496 + stachyose 2 292 mg ; cuite à 64,8 % d’eau
    const g = cookedGos({ raffinose_mg: 496, stachyose_mg: 2292 }, { water_g: 64.8, soak_loss: 0.1 })
    const factor = (100 - 64.8) / 90
    expect(g).toBeCloseTo((496 * 0.68 + 2292 * 0.75) * factor * 0.9 / 1000, 3)
    expect(g).toBeGreaterThan(0.6)
    expect(g).toBeLessThan(0.8)
  })
  it('plus d’eau ou plus de pertes : moins de GOS ; jamais négatif', () => {
    const dry = { raffinose_mg: 441, stachyose_mg: 1533 }
    expect(cookedGos(dry, { water_g: 72, soak_loss: 0.4 })).toBeLessThan(cookedGos(dry, { water_g: 62, soak_loss: 0.4 }))
    expect(cookedGos(dry, { water_g: 62, soak_loss: 0.4 })).toBeLessThan(cookedGos(dry, { water_g: 62, soak_loss: 0.1 }))
    expect(cookedGos(dry, { water_g: 100, soak_loss: 0 })).toBe(0)
  })
})

describe('entrées livrées dans fodmapMeasurements.json', () => {
  const derived = Object.entries(measurements.foods).filter(([, e]) => e.gos?.derivation)

  it('chaque légumineuse cuite de la liste a son entrée, recalculable depuis sa dérivation', () => {
    expect(derived.length).toBe(Object.keys(LEGUMES).length)
    for (const [name, e] of derived) {
      const d = e.gos.derivation
      expect(LEGUMES[name], name).toBeTruthy()
      expect(e.gos.confidence, name).toBe('analogie')
      expect(e.gos.source, name).toBe('siva2019')
      expect(e.gos.g, name).toBeCloseTo(cookedGos(d.dry, d), 3)
      expect(d.ciqual_code, name).toBe(table[name].ciqual_code)
    }
  })
  it('le générateur redonne exactement les entrées livrées', () => {
    const water = Object.fromEntries(derived.map(([n, e]) => [n, e.gos.derivation.water_g]))
    const built = buildLegumeEntries(water, table)
    for (const [name, e] of derived) expect(built[name], name).toEqual(e.gos)
  })
  it('ordres de grandeur : 150 g de lentilles cuites dépassent le repère de 0,3 g, 50 g de pois chiches en conserve non', () => {
    const per = (n, g) => (measurements.foods[n].gos.g * g) / 100
    expect(per("Lentille verte, bouillie/cuite à l'eau", 150)).toBeGreaterThan(0.3)
    expect(per('Pois chiche, appertisé, égoutté', 50)).toBeLessThan(0.3)
  })
})
