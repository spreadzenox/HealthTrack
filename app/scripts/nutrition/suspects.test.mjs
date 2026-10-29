import { describe, it, expect } from 'vitest'
import table from '../../src/data/ingredientsNutrition.json'
import { buildTable, parseRecords } from './ciqual.mjs'
import { SUSPECT_VALUES } from './suspects.mjs'

// Trames synthétiques (valeurs inventées pour le test, pas des données Ciqual)
const consts = parseRecords('<TABLE><CONST><const_code> 10260 </const_code><const_nom_fr> Fer (mg/100 g) </const_nom_fr></CONST></TABLE>', 'CONST')
const alims = parseRecords('<TABLE><ALIM><alim_code> 7 </alim_code><alim_nom_fr> Légume, cru </alim_nom_fr></ALIM></TABLE>', 'ALIM')
const compos = (t) => parseRecords(`<TABLE><COMPO><alim_code> 7 </alim_code><const_code> 10260 </const_code><teneur> ${t} </teneur></COMPO></TABLE>`, 'COMPO')
const suspects = [{ code: '7', field: 'iron_mg', ciqual: 0.0002, reason: 'test' }]

describe('valeurs Ciqual suspectes', () => {
  it('une valeur listée devient inconnue, marquée « suspect »', () => {
    const { table, meta } = buildTable({ alims, consts, compos: compos('0,0002') }, { version: 'T', suspects })
    expect(table['Légume, cru'].iron_mg).toBeNull()
    expect(table['Légume, cru']._q.iron_mg).toBe('suspect')
    expect(meta.staleSuspects).toEqual([])
  })
  it('si Ciqual a corrigé la valeur, elle est gardée et la ligne signalée comme périmée', () => {
    const { table, meta } = buildTable({ alims, consts, compos: compos('0,2') }, { version: 'T', suspects })
    expect(table['Légume, cru'].iron_mg).toBe(0.2)
    expect(meta.staleSuspects).toEqual(['7 iron_mg'])
  })
  it('chaque entrée est documentée', () => {
    for (const s of SUSPECT_VALUES) {
      expect(s.code).toMatch(/^\d+$/)
      expect(typeof s.ciqual).toBe('number')
      expect(s.reason.length).toBeGreaterThan(20)
    }
  })
  it('la table livrée applique la liste (oignon cru : fer inconnu, plus 0,00019 mg)', () => {
    for (const s of SUSPECT_VALUES) {
      for (const food of Object.values(table).filter((f) => f.ciqual_code === s.code)) {
        expect(food[s.field]).toBeNull()
        expect(food._q[s.field]).toBe('suspect')
      }
    }
    expect(table['Oignon, cru'].iron_mg).toBeNull()
  })
})
