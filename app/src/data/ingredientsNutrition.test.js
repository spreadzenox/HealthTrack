import { describe, it, expect } from 'vitest'
import table from './ingredientsNutrition.json'
import meta from './ciqualMeta.json'
import { auditTable } from '../../scripts/nutrition/audit.mjs'

// Contrôles de cohérence de la table livrée (reconstruite depuis Ciqual, demande du propriétaire du 26/10)
describe('table nutritionnelle livrée (Ciqual)', () => {
  const names = Object.keys(table)
  const audit = auditTable(table)

  it('vient de Ciqual : code par aliment, alias vers un aliment existant', () => {
    expect(meta.version).toMatch(/^Ciqual \d{4}$/)
    expect(meta.attribution).toMatch(/^Anses\. Ciqual/)
    for (const n of names) {
      const f = table[n]
      if (f.alias_of) expect(table[f.alias_of]?.ciqual_code, n).toBe(f.ciqual_code)
      else expect(f.ciqual_code, n).toMatch(/^\d+$/)
    }
  })
  it('sucres ≤ glucides et AG saturés ≤ lipides partout', () => {
    expect(audit.issues.sugar).toEqual([])
    expect(audit.issues.saturatedFat).toEqual([])
  })
  it('énergie cohérente avec les macros, sauf polyols / acides (vinaigres, confiseries sans sucres)', () => {
    for (const e of audit.issues.energy) expect(e.name).toMatch(/Vinaigre|sans sucres|Chewing-gum|Groseille/)
  })
  it('presque plus de micronutriments recopiés (seulement les doublons publiés par Ciqual)', () => {
    expect(audit.summary.foodsInIdenticalMicroGroups).toBeLessThanOrEqual(40)
  })
  it('ail et oignon crus ne partagent plus leurs valeurs ; sec ≠ cuit pour les lentilles', () => {
    expect(table['Ail, cru'].potassium_mg).not.toBe(table['Oignon, cru'].potassium_mg)
    expect(table['Lentille, sèche (aliment moyen)'].potassium_mg).not.toBe(table["Lentille, bouillie/cuite à l'eau (aliment moyen)"].potassium_mg)
  })
  it('une valeur non mesurée est inconnue (null), jamais inventée', () => {
    expect(audit.unknownShare).toBeGreaterThan(0.05)
    for (const n of names) for (const [k, v] of Object.entries(table[n])) {
      if (k === '_q' || k === 'ciqual_code' || k === 'alias_of') continue
      expect(v === null || Number.isFinite(v), `${n} ${k}`).toBe(true)
    }
  })
})
