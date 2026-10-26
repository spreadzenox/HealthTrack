/**
 * Audit de cohérence d'une table nutritionnelle { nom: valeurs pour 100 g } (format de
 * src/data/ingredientsNutrition.json). Pur : aucune lecture de fichier.
 *
 * Contrôles (demande du propriétaire du 26/10) :
 * - énergie ≈ macros (facteurs du règlement UE 1169/2011 : protéines et glucides 4, lipides 9,
 *   fibres 2, alcool 7 kcal/g) ;
 * - sucres ≤ glucides, AG saturés ≤ lipides ;
 * - aucun vecteur de micronutriments identique entre aliments différents (signe de valeurs
 *   inventées ou recopiées) ;
 * - sec / cuit plausibles : le même aliment cuit (dans l'eau) n'a pas plus d'énergie que sec,
 *   ni exactement les mêmes minéraux.
 * Une valeur null ou absente est « inconnue » : elle n'est jamais comptée comme 0.
 */

export const MICRO_FIELDS = [
  'vitamin_c_mg', 'vitamin_d_ug', 'vitamin_b12_ug', 'vitamin_b9_ug', 'vitamin_a_ug', 'vitamin_e_mg',
  'calcium_mg', 'iron_mg', 'magnesium_mg', 'zinc_mg', 'potassium_mg', 'sodium_mg',
]

const MINERALS = ['calcium_mg', 'iron_mg', 'magnesium_mg', 'zinc_mg', 'potassium_mg', 'sodium_mg']

const known = (v) => typeof v === 'number' && Number.isFinite(v)

/** Énergie recalculée depuis les macros, ou null si une macro manque. */
export function energyFromMacros(f) {
  const parts = [
    [f.protein_g, 4], [f.carbohydrates_g, 4], [f.fat_g, 9], [f.fiber_g, 2], [f.alcohol_g, 7],
  ]
  // Protéines, glucides et lipides sont indispensables ; fibres et alcool absents comptent 0
  if (![f.protein_g, f.carbohydrates_g, f.fat_g].every(known)) return null
  return parts.reduce((s, [v, k]) => s + (known(v) ? v * k : 0), 0)
}

/** Écart toléré : 15 kcal ou 15 %, le plus grand des deux (polyols, acides organiques…). */
export function energyMismatch(f) {
  const calc = energyFromMacros(f)
  if (calc == null || !known(f.energy_kcal)) return null
  const diff = f.energy_kcal - calc
  return Math.abs(diff) > Math.max(15, 0.15 * Math.max(f.energy_kcal, calc)) ? { declared: f.energy_kcal, calc: Math.round(calc) } : null
}

/** Clé « nom de base » + état (sec / cuit) d'un nom Ciqual, ou null. */
export function dryCookedKey(name) {
  const n = name.toLowerCase()
  const m = n.match(/^(.*?),\s*(sèches?|secs?|crues?|crus?)(,|$)/) || n.match(/^(.*?),\s*(cuites?|cuits?|bouillies?|bouillis?)(,|$)/)
  if (!m) return null
  const state = /cuit|bouilli/.test(m[2]) ? 'cuit' : 'sec'
  return { base: m[1].trim(), state }
}

export function auditTable(table) {
  const names = Object.keys(table)
  const issues = { energy: [], sugar: [], saturatedFat: [], identicalMicros: [], dryCooked: [] }
  let unknownValues = 0
  let totalValues = 0

  for (const name of names) {
    const f = table[name]
    for (const k of ['energy_kcal', 'protein_g', 'carbohydrates_g', 'fat_g', 'fiber_g', 'sugar_g', 'saturated_fat_g', ...MICRO_FIELDS]) {
      totalValues++
      if (!known(f[k])) unknownValues++
    }
    const e = energyMismatch(f)
    if (e) issues.energy.push({ name, ...e })
    if (known(f.sugar_g) && known(f.carbohydrates_g) && f.sugar_g > f.carbohydrates_g + 0.5) {
      issues.sugar.push({ name, sugar_g: f.sugar_g, carbohydrates_g: f.carbohydrates_g })
    }
    if (known(f.saturated_fat_g) && known(f.fat_g) && f.saturated_fat_g > f.fat_g + 0.1) {
      issues.saturatedFat.push({ name, saturated_fat_g: f.saturated_fat_g, fat_g: f.fat_g })
    }
  }

  // Vecteurs identiques : seulement s'ils portent au moins 4 valeurs connues non nulles,
  // sinon deux aliments pauvres (eau, sucre…) se ressembleraient légitimement.
  const byVector = new Map()
  for (const name of names) {
    const f = table[name]
    const nonZero = MICRO_FIELDS.filter((k) => known(f[k]) && f[k] > 0).length
    if (nonZero < 4) continue
    const key = JSON.stringify(MICRO_FIELDS.map((k) => (known(f[k]) ? f[k] : null)))
    if (!byVector.has(key)) byVector.set(key, [])
    byVector.get(key).push(name)
  }
  for (const group of byVector.values()) if (group.length > 1) issues.identicalMicros.push(group)
  issues.identicalMicros.sort((a, b) => b.length - a.length)

  // Sec / cuit
  const groups = new Map()
  for (const name of names) {
    const k = dryCookedKey(name)
    if (!k) continue
    if (!groups.has(k.base)) groups.set(k.base, { sec: [], cuit: [] })
    groups.get(k.base)[k.state].push(name)
  }
  for (const [base, g] of groups) {
    for (const dry of g.sec) {
      for (const cooked of g.cuit) {
        const a = table[dry]
        const b = table[cooked]
        const sameMinerals = MINERALS.filter((k) => known(a[k]) && known(b[k]) && a[k] > 0 && a[k] === b[k])
        const moreEnergy = known(a.energy_kcal) && known(b.energy_kcal) && b.energy_kcal > a.energy_kcal * 1.05
        // Un mode de cuisson sans eau (frit, rôti…) peut légitimement concentrer : on ne juge que l'eau
        const watery = !/frit|rôti|grill|sauté|poêlé|four/.test(cooked.toLowerCase())
        if ((watery && moreEnergy) || sameMinerals.length >= 2) {
          issues.dryCooked.push({ base, dry, cooked, sameMinerals, moreEnergy: watery && moreEnergy })
        }
      }
    }
  }

  const foodsInIdentical = issues.identicalMicros.reduce((s, g) => s + g.length, 0)
  return {
    foods: names.length,
    unknownShare: totalValues ? unknownValues / totalValues : 0,
    issues,
    summary: {
      energy: issues.energy.length,
      sugar: issues.sugar.length,
      saturatedFat: issues.saturatedFat.length,
      identicalMicroGroups: issues.identicalMicros.length,
      foodsInIdenticalMicroGroups: foodsInIdentical,
      dryCooked: issues.dryCooked.length,
    },
  }
}
