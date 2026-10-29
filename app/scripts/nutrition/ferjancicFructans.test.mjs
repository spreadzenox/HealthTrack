import { describe, it, expect } from 'vitest'
import { ndLimit, ND_LIMIT_DW, ROWS, buildFerjancicEntries } from './ferjancicFructans.mjs'
import measurements from '../../src/data/fodmapMeasurements.json'
import table from '../../src/data/ingredientsNutrition.json'

describe('ndLimit (borne haute d’un « non détectable » de Ferjančič 2024)', () => {
  it('ramène la limite en matière sèche au frais par l’eau de l’article', () => {
    expect(ndLimit(79)).toBeCloseTo(ND_LIMIT_DW * 0.21, 3)
    expect(ndLimit(95)).toBeLessThan(ndLimit(79))
    expect(ndLimit(null)).toBe(ND_LIMIT_DW) // « / » : échantillon analysé tel quel
  })
  it('reste au-dessus de la plus petite teneur quantifiée du tableau (polenta, 0,07 % MS)', () => {
    expect(ND_LIMIT_DW).toBeGreaterThan(0.07)
  })
})

describe('entrées livrées dans fodmapMeasurements.json', () => {
  const built = buildFerjancicEntries()

  it('le générateur redonne exactement les entrées livrées', () => {
    expect(Object.keys(built).length).toBeGreaterThan(40)
    for (const [name, e] of Object.entries(built)) expect(measurements.foods[name]?.fructans, name).toEqual(e)
  })
  it('noms Ciqual existants, jamais des alias ; une analogie cite son aliment mesuré s’il existe', () => {
    for (const [name, e] of Object.entries(built)) {
      expect(table[name], name).toBeTruthy()
      expect(table[name].alias_of, name).toBeUndefined()
      if (e.analogy_of) expect(built[e.analogy_of]?.confidence, name).toBe('mesure')
    }
  })
  it('chaque ligne a soit une teneur, soit « ND » ; jamais d’aliment rôti, aromatisé ou cuisiné', () => {
    for (const row of ROWS) {
      expect(row.nd === true || typeof row.fw === 'number', row.row).toBe(true)
      for (const name of [...row.foods, ...Object.keys(row.analogies)]) expect(name, row.row).not.toMatch(/rôti|aromatis|cuisin/i)
    }
  })
})
