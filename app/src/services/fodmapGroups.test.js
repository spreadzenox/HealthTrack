import { describe, it, expect } from 'vitest'
import { FODMAP_SUBGROUPS, SERVING_CUTOFFS_G, fodmapPer100g, estimateMealFodmap, highFodmapGroups, mealFodmapHighlights } from './fodmapGroups'
import { FODMAP_GROUPS } from './fodmapChallenge'
import table from '../data/ingredientsNutrition.json'
import measurements from '../data/fodmapMeasurements.json'

// Aliments synthétiques (valeurs pour 100 g)
const T = {
  Lait: { lactose_g: 4.8, fructose_g: 0.05, glucose_g: 0.1, polyols_g: 0, _q: { fructose_g: '<0.11' } },
  Miel: { lactose_g: null, fructose_g: 40, glucose_g: 35, polyols_g: null },
  Oignon: { lactose_g: 0.05, fructose_g: 0.9, glucose_g: 0.9, polyols_g: 0, _q: { lactose_g: '<0.1' } },
  Poire: { lactose_g: 0, fructose_g: 6.4, glucose_g: 2.6, polyols_g: 2 },
  Riz: { lactose_g: 0, fructose_g: 0, glucose_g: 0, polyols_g: 0 },
  Glucose: { fructose_g: 2, glucose_g: 0.1, _q: { glucose_g: '<0.2' } },
  'Riz (alias)': { alias_of: 'Riz', lactose_g: 0, fructose_g: 0, glucose_g: 0, polyols_g: 0 },
}

describe('fodmapPer100g', () => {
  it('reprend le lactose de Ciqual', () => {
    expect(fodmapPer100g(T.Lait).lactose).toEqual({ g: 4.8, status: 'mesuré', source: 'Ciqual' })
  })
  it('compte 0 (traces) une teneur sous la limite de détection, jamais la moitié de la limite', () => {
    expect(fodmapPer100g(T.Oignon).lactose).toMatchObject({ g: 0, status: 'traces' })
    expect(fodmapPer100g(T.Lait).fructose).toMatchObject({ g: 0, status: 'traces' })
  })
  it('calcule le fructose en excès du glucose, jamais négatif', () => {
    expect(fodmapPer100g(T.Miel).fructose).toMatchObject({ g: 5, status: 'mesuré' })
    expect(fodmapPer100g(T.Oignon).fructose.g).toBe(0)
    expect(fodmapPer100g(T.Poire).fructose.g).toBeCloseTo(3.8)
  })
  it('marque « approché » un excès calculé sur un glucose sous la limite de détection', () => {
    expect(fodmapPer100g(T.Glucose).fructose).toMatchObject({ g: 2, status: 'approché' })
  })
  it('déduit sorbitol et mannitol nuls de polyols totaux nuls, inconnus sinon', () => {
    expect(fodmapPer100g(T.Riz).sorbitol).toMatchObject({ g: 0, source: 'Ciqual' })
    expect(fodmapPer100g(T.Poire).sorbitol).toEqual({ g: null, status: 'inconnu', source: null })
    expect(fodmapPer100g(T.Poire).polyolsTotal).toBe(2)
  })
  it('fructanes et GOS nuls quand Ciqual donne glucides et fibres nuls, limites gardées (N3e)', () => {
    const viande = { carbohydrates_g: 0, fiber_g: 0, lactose_g: 0 }
    expect(fodmapPer100g(viande).fructans).toEqual({ g: 0, status: 'mesuré', source: 'Ciqual' })
    expect(fodmapPer100g(viande).gos).toEqual({ g: 0, status: 'mesuré', source: 'Ciqual' })
    expect(fodmapPer100g({ carbohydrates_g: 0, fiber_g: 0.4, _q: { fiber_g: '<0.5' } }).fructans).toMatchObject({ g: 0, status: 'traces', max: 0.5 })
    expect(fodmapPer100g({ carbohydrates_g: 0.7, fiber_g: 0 }).fructans.status).toBe('inconnu')
  })
  it('une mesure « non détectable » compte 0 avec sa limite (N3e)', () => {
    const nd = { fructans: { g: 0, lt: 0.06, source: 'ferjancic2024', confidence: 'mesure' } }
    expect(fodmapPer100g(T.Riz, nd).fructans).toMatchObject({ g: 0, status: 'traces', max: 0.06, source: 'ferjancic2024' })
    const t = { Riz: T.Riz }, m = { foods: { Riz: nd } }
    expect(estimateMealFodmap([{ ingredient: 'Riz', quantity_g: 250 }], t, m).fructans.level).toBe('bas')
    // 600 g : la limite (0,36 g) dépasse le repère, on ne peut plus dire « bas »
    expect(estimateMealFodmap([{ ingredient: 'Riz', quantity_g: 600 }], t, m).fructans.level).toBe('inconnu')
  })
  it('laisse fructanes et GOS inconnus sans mesure publiée', () => {
    const r = fodmapPer100g(T.Oignon)
    expect(r.fructans.status).toBe('inconnu')
    expect(r.gos.status).toBe('inconnu')
  })
  it('reprend une mesure publiée avec sa source, et une analogie ou une valeur citée en confiance basse', () => {
    const r = fodmapPer100g(T.Oignon, { fructans: { g: 1.97, source: 'art1', confidence: 'mesure' } })
    expect(r.fructans).toEqual({ g: 1.97, status: 'mesuré', source: 'art1', confidence: 'mesure' })
    const a = fodmapPer100g(T.Oignon, { gos: { g: 2, source: 'art2', confidence: 'analogie' } })
    expect(a.gos).toMatchObject({ status: 'approché', confidence: 'basse' })
    const c = fodmapPer100g(T.Oignon, { fructans: { g: 17, source: 'revue', confidence: 'citée' } })
    expect(c.fructans).toMatchObject({ g: 17, confidence: 'basse' })
  })
  it('répartit les polyols totaux Ciqual selon la part publiée (Ciqual d’abord)', () => {
    const r = fodmapPer100g(T.Poire, { sorbitol: { share: 1, source: 'mext', confidence: 'analogie' } })
    expect(r.sorbitol).toEqual({ g: 2, status: 'approché', source: 'Ciqual + mext', confidence: 'basse' })
    expect(r.mannitol.status).toBe('inconnu')
    // une valeur absolue plus grande que le total Ciqual le contredirait : ignorée
    expect(fodmapPer100g(T.Poire, { sorbitol: { g: 2.9, source: 'mext' } }).sorbitol.status).toBe('inconnu')
  })
  it('ne remplace jamais une valeur Ciqual par une mesure publiée', () => {
    expect(fodmapPer100g(T.Riz, { sorbitol: { g: 3, source: 'x' } }).sorbitol.g).toBe(0)
  })
  it('garde la limite d’une teneur « < x » ; une mesure publiée la précise seulement sans la contredire', () => {
    const avocat = { polyols_g: 0.25, _q: { polyols_g: '<0.5' } }
    expect(fodmapPer100g(avocat).sorbitol).toEqual({ g: 0, status: 'traces', max: 0.5, source: 'Ciqual' })
    expect(fodmapPer100g(avocat, { sorbitol: { g: 0.3, source: 's', confidence: 'mesure' } }).sorbitol.g).toBe(0.3)
    expect(fodmapPer100g(avocat, { sorbitol: { g: 0.6, source: 's' } }).sorbitol.status).toBe('traces')
  })
  it('deux mesures publiées divergentes : garde la borne haute et sa source (N3d)', () => {
    const entry = { fructans: { g: 0.14, source: 'a', confidence: 'mesure', g_high: 1.02, source_high: 'b' } }
    expect(fodmapPer100g(T.Riz, entry).fructans).toMatchObject({ g: 0.14, high: 1.02, source: 'a', sourceHigh: 'b' })
  })
  it('aliment absent de la table : tout inconnu', () => {
    const r = fodmapPer100g(undefined)
    for (const g of FODMAP_SUBGROUPS) expect(r[g].status).toBe('inconnu')
  })
})

describe('estimateMealFodmap', () => {
  it('lait 250 g : lactose élevé, porté par le lait', () => {
    const r = estimateMealFodmap([{ ingredient: 'Lait', quantity_g: 250 }], T)
    expect(r.lactose).toMatchObject({ g: 12, level: 'élevé', cutoff: 1 })
    expect(r.lactose.contributors).toEqual([{ ingredient: 'Lait', g: 12, status: 'mesuré', source: 'Ciqual' }])
    expect(highFodmapGroups(r)).toEqual(['lactose'])
  })
  it('« bas » seulement si tous les aliments du repas sont connus pour ce groupe', () => {
    const r = estimateMealFodmap([{ ingredient: 'Riz', quantity_g: 150 }, { ingredient: 'Miel', quantity_g: 1 }], T)
    expect(r.fructose.level).toBe('bas') // 0,05 g < 0,15
    expect(r.lactose.level).toBe('inconnu') // lactose du miel inconnu
    expect(r.lactose.unknownFoods).toEqual(['Miel'])
  })
  it('« élevé » même si un autre aliment est inconnu', () => {
    const r = estimateMealFodmap([{ ingredient: 'Miel', quantity_g: 20 }, { ingredient: 'Inconnu', quantity_g: 50 }], T)
    expect(r.fructose.level).toBe('élevé')
  })
  it('polyols totaux connus sous le repère : sorbitol et mannitol bas', () => {
    const r = estimateMealFodmap([{ ingredient: 'Poire', quantity_g: 10 }, { ingredient: 'Riz', quantity_g: 100 }], T)
    expect(r.polyols.g).toBe(0.2)
    expect(r.sorbitol.level).toBe('bas')
    const big = estimateMealFodmap([{ ingredient: 'Poire', quantity_g: 150 }], T)
    expect(big.sorbitol.level).toBe('inconnu')
  })
  it('« < x » : bas seulement si le repas reste sous le repère au plafond de la limite (N3a-bis)', () => {
    const avocat = { lactose_g: 0.1, polyols_g: 0.25, _q: { lactose_g: '<0.2', polyols_g: '<0.5' } }
    const t = { ...T, Avocat: avocat }
    const r = estimateMealFodmap([{ ingredient: 'Avocat', quantity_g: 100 }], t)
    expect(r.sorbitol.level).toBe('inconnu') // jusqu'à 0,5 g ≥ 0,4
    expect(r.lactose.level).toBe('bas') // jusqu'à 0,2 g < 1
    expect(estimateMealFodmap([{ ingredient: 'Avocat', quantity_g: 30 }], t).sorbitol.level).toBe('bas')
  })
  it('ignore les aliments sans quantité ; repas vide : tout inconnu', () => {
    const r = estimateMealFodmap([{ ingredient: 'Lait' }, { ingredient: '', quantity_g: 10 }], T)
    for (const g of FODMAP_SUBGROUPS) expect(r[g].level).toBe('inconnu')
    expect(estimateMealFodmap(null, T).lactose.level).toBe('inconnu')
  })
  it('cherche les mesures publiées sous le nom de l’alias', () => {
    const m = { foods: { Riz: { fructans: { g: 0.5, source: 's' } } } }
    const r = estimateMealFodmap([{ ingredient: 'Riz (alias)', quantity_g: 100 }], T, m)
    expect(r.fructans).toMatchObject({ g: 0.5, level: 'élevé' })
  })
  it('fourchette de mesures publiées : jamais « bas » si la borne haute dépasse le repère (N3d)', () => {
    const m = { foods: { Riz: { fructans: { g: 0.14, source: 'a', confidence: 'mesure', g_high: 1.02, source_high: 'b' } } } }
    const r = estimateMealFodmap([{ ingredient: 'Riz', quantity_g: 80 }], T, m)
    expect(r.fructans).toMatchObject({ g: 0.112, high: 0.816, level: 'probable' })
    expect(highFodmapGroups(r)).toEqual(['fructans'])
    expect(estimateMealFodmap([{ ingredient: 'Riz', quantity_g: 20 }], T, m).fructans.level).toBe('bas') // 0,2 g au plus
    expect(estimateMealFodmap([{ ingredient: 'Riz', quantity_g: 300 }], T, m).fructans.level).toBe('élevé')
  })
  it('classe les groupes élevés par rapport au repère', () => {
    const r = estimateMealFodmap([{ ingredient: 'Lait', quantity_g: 30 }, { ingredient: 'Miel', quantity_g: 20 }], T)
    // lactose 1,44 g (1,4 × repère) ; fructose 1 g (6,7 × repère)
    expect(highFodmapGroups(r)).toEqual(['fructose', 'lactose'])
  })
})

describe('mealFodmapHighlights', () => {
  it('groupes élevés, du plus chargé au moins chargé, avec les aliments qui en apportent le plus', () => {
    const r = estimateMealFodmap([{ ingredient: 'Lait', quantity_g: 30 }, { ingredient: 'Miel', quantity_g: 20 }], T)
    const h = mealFodmapHighlights(r)
    expect(h.map((x) => x.group)).toEqual(['fructose', 'lactose'])
    expect(h[0]).toMatchObject({ foods: ['Miel'], probable: false, g: 1, cutoff: 0.15 })
  })
  it('« probable » quand le repère n’est dépassé qu’avec des valeurs à confiance basse', () => {
    const m = { foods: {
      Riz: { fructans: { g: 0.5, source: 's', confidence: 'analogie' } },
      Oignon: { fructans: { g: 0.2, source: 's', confidence: 'mesure' } },
    } }
    const items = [{ ingredient: 'Riz', quantity_g: 100 }, { ingredient: 'Oignon', quantity_g: 100 }]
    const [fructans] = mealFodmapHighlights(estimateMealFodmap(items, T, m))
    expect(fructans).toMatchObject({ group: 'fructans', foods: ['Riz', 'Oignon'], probable: true })
    const sure = { foods: { ...m.foods, Oignon: { fructans: { g: 0.4, source: 's', confidence: 'mesure' } } } }
    expect(mealFodmapHighlights(estimateMealFodmap(items, T, sure))[0].probable).toBe(false)
  })
  it('« probable » avec la fourchette quand seule la borne haute dépasse le repère (N3d)', () => {
    const m = { foods: { Riz: { fructans: { g: 0.14, source: 'a', confidence: 'mesure', g_high: 1.02, source_high: 'b' } } } }
    const [h] = mealFodmapHighlights(estimateMealFodmap([{ ingredient: 'Riz', quantity_g: 80 }], T, m))
    expect(h).toMatchObject({ group: 'fructans', probable: true, g: 0.112, high: 0.816, foods: ['Riz'] })
    expect(h.sources).toEqual(['a', 'b'])
  })
  it('trois aliments au plus ; rien d’élevé : liste vide', () => {
    const m = { foods: Object.fromEntries(['Lait', 'Miel', 'Oignon', 'Poire'].map((n) => [n, { fructans: { g: 1, source: 's' } }])) }
    const items = ['Lait', 'Miel', 'Oignon', 'Poire'].map((ingredient) => ({ ingredient, quantity_g: 50 }))
    expect(mealFodmapHighlights(estimateMealFodmap(items, T, m)).find((x) => x.group === 'fructans').foods).toHaveLength(3)
    expect(mealFodmapHighlights(estimateMealFodmap([{ ingredient: 'Riz', quantity_g: 100 }], T))).toEqual([])
  })
  it('table livrée : l’ail (valeur citée par une revue) seul ne donne qu’un « probablement »', () => {
    const est = (ingredient, quantity_g) => mealFodmapHighlights(estimateMealFodmap([{ ingredient, quantity_g }], table, measurements))
    expect(est('Ail, cru', 3)[0]).toMatchObject({ group: 'fructans', probable: true })
    expect(est('Oignon, cru', 70)[0]).toMatchObject({ group: 'fructans', probable: false, foods: ['Oignon, cru'] })
  })
  it('table livrée : lentilles et pois chiches cuits (GOS calculés depuis le sec) donnent un « probablement riche en GOS »', () => {
    const est = (ingredient, quantity_g) => mealFodmapHighlights(estimateMealFodmap([{ ingredient, quantity_g }], table, measurements))
    expect(est('Lentilles cuites', 150)[0]).toMatchObject({ group: 'gos', probable: true, foods: ['Lentilles cuites'] })
    expect(est('Pois chiches cuits', 120)[0]).toMatchObject({ group: 'gos', probable: true })
    expect(est('Pois chiche, appertisé, égoutté', 50).find((h) => h.group === 'gos')).toBeUndefined()
  })
})

describe('cohérence avec la réintroduction et les données livrées', () => {
  it('mêmes groupes que la réintroduction guidée', () => {
    expect([...FODMAP_SUBGROUPS].sort()).toEqual(FODMAP_GROUPS.map((g) => g.id).sort())
    for (const g of FODMAP_SUBGROUPS) expect(SERVING_CUTOFFS_G[g]).toBeGreaterThan(0)
  })
  it('table livrée : 125 ml de lait demi-écrémé dépassent le repère lactose, la poire a du fructose en excès', () => {
    const lait = estimateMealFodmap([{ ingredient: 'Lait demi-écrémé (aliment moyen)', quantity_g: 125 }], table)
    expect(lait.lactose.level).toBe('élevé')
    expect(lait.fructose.level).toBe('bas')
    const poire = estimateMealFodmap([{ ingredient: 'Poire', quantity_g: 150 }], table)
    expect(poire.fructose.level).toBe('élevé')
  })
  it('table livrée : 100 g d’avocat (polyols « < 0,5 ») ne passent pas pour pauvres en sorbitol', () => {
    const r = estimateMealFodmap([{ ingredient: 'Avocat', quantity_g: 100 }], table, measurements)
    expect(r.sorbitol.level).toBe('inconnu')
  })
  it('table livrée + mesures : oignon et ail riches en fructanes, pomme en sorbitol, tofu pauvre en GOS', () => {
    const est = (ingredient, quantity_g) => estimateMealFodmap([{ ingredient, quantity_g }], table, measurements)
    expect(est('Oignon, cru', 70).fructans).toMatchObject({ level: 'élevé', g: 1.379 })
    expect(est('Ail, cru', 3).fructans.level).toBe('élevé')
    expect(est('Pomme', 150).sorbitol).toMatchObject({ level: 'élevé', g: 0.75 })
    expect(est('Poire', 150).sorbitol.contributors[0].source).toBe('Ciqual + mext2020')
    expect(est('Tofu', 100).gos).toMatchObject({ level: 'bas', g: 0.14 })
    expect(est('Pâtes cuites', 200).fructans.level).toBe('élevé') // cherché sous le nom Ciqual de l'alias
  })
  it('table livrée : « poulet, riz, carottes » pauvre en fructanes, petits pois en conserve au repère (N3e)', () => {
    const meal = [
      { ingredient: 'Poulet, filet sans peau grillé/poêlé', quantity_g: 120 },
      { ingredient: 'Riz blanc cuit', quantity_g: 200 },
      { ingredient: 'Carotte cuite', quantity_g: 100 },
    ]
    expect(estimateMealFodmap(meal, table, measurements).fructans).toMatchObject({ level: 'bas', unknownFoods: [] })
    expect(estimateMealFodmap([{ ingredient: 'Petits pois, appertisés, égouttés', quantity_g: 100 }], table, measurements).fructans.level).toBe('élevé')
  })
  it('table livrée : pain et poireau jamais « bas » en fructanes, l’oignon reste élevé (N3d)', () => {
    const est = (ingredient, quantity_g) => estimateMealFodmap([{ ingredient, quantity_g }], table, measurements)
    expect(est('Pain blanc (par ex. : baguette, boule…)', 80).fructans).toMatchObject({ level: 'probable', g: 0.112, high: 0.816 })
    expect(est('Pain de tradition française (par ex. : baguette, boule…)', 80).fructans.level).toBe('probable')
    expect(est('Poireau, cru', 100).fructans).toMatchObject({ level: 'probable', g: 0.24, high: 3.8 })
    expect(est('Oignon, cru', 40).fructans.level).toBe('élevé')
    expect(est('Oignon rouge, cru', 40).fructans.high).toBeCloseTo(2.52)
  })
  it('table livrée : pain complet, couscous et boulgour au-dessus du repère fructanes, pain bis jamais « bas » (N3f)', () => {
    const est = (ingredient, quantity_g) => estimateMealFodmap([{ ingredient, quantity_g }], table, measurements)
    const hi = (ingredient, quantity_g) => mealFodmapHighlights(est(ingredient, quantity_g)).find((h) => h.group === 'fructans')
    expect(est('Pain complet', 60).fructans).toMatchObject({ level: 'élevé', g: 0.474 }) // alias du pain complet T150
    expect(hi('Pain complet', 60)).toMatchObject({ probable: true }) // valeur citée : confiance basse
    expect(est('Semoule ou graine de couscous, cuite, sans sel ajouté', 150).fructans.level).toBe('élevé')
    expect(est('Boulgour de blé, cuit, sans sel ajouté', 150).fructans.level).toBe('élevé')
    expect(est('Pain bis (à la farine T80 ou T110)', 80).fructans).toMatchObject({ level: 'probable', high: 0.816 })
    expect(est('Topinambour, cuit', 100).fructans.level).toBe('élevé')
  })
  it('mesures publiées : aliment existant, source déclarée, valeur ou part plausible', () => {
    const groups = ['fructans', 'gos', 'sorbitol', 'mannitol']
    expect(Object.keys(measurements.foods).length).toBeGreaterThan(20)
    for (const [name, entry] of Object.entries(measurements.foods)) {
      const food = table[name]
      expect(food, name).toBeTruthy()
      expect(food.alias_of, `${name} : nom Ciqual, pas un alias`).toBeUndefined()
      for (const [group, m] of Object.entries(entry)) {
        const label = `${name} / ${group}`
        expect(groups, label).toContain(group)
        expect(measurements.sources[m.source], `${label} : source`).toBeTruthy()
        expect(['mesure', 'analogie', 'citée'], label).toContain(m.confidence)
        if (m.analogy_of) expect(table[m.analogy_of], `${label} : analogie`).toBeTruthy()
        if ('share' in m) {
          expect(['sorbitol', 'mannitol'], label).toContain(group)
          expect(m.share, label).toBeGreaterThan(0)
          expect(m.share, label).toBeLessThanOrEqual(1)
          // une part ne sert que si Ciqual mesure des polyols totaux > 0
          expect(food.polyols_g, label).toBeGreaterThan(0)
          expect(food._q?.polyols_g, label).toBeUndefined()
        } else {
          expect(typeof m.g, `${label} : valeur sans source ni nombre`).toBe('number')
          if ('lt' in m) {
            // « non détectable » : 0 avec une limite positive (N3e)
            expect(m.g, label).toBe(0)
            expect(m.lt, label).toBeGreaterThan(0)
          }
          expect(m.g, label).toBeGreaterThanOrEqual(0)
          if (typeof food.carbohydrates_g === 'number' && food._q?.carbohydrates_g == null) {
            expect(m.g, `${label} ≤ glucides`).toBeLessThanOrEqual(food.carbohydrates_g)
          }
        }
        if ('g_high' in m) {
          // fourchette seulement quand deux mesures publiées divergent de plus de 2 fois (N3d)
          expect(m.g_high, `${label} : borne haute`).toBeGreaterThan(2 * m.g)
          expect(measurements.sources[m.source_high], `${label} : source de la borne haute`).toBeTruthy()
          expect(m.ref_high, `${label} : référence de la borne haute`).toBeTruthy()
          // les fructanes comptent dans les fibres de Ciqual (glucides disponibles + fibres)
          expect(m.g_high, `${label} ≤ glucides + fibres`).toBeLessThanOrEqual((food.carbohydrates_g ?? Infinity) + (food.fiber_g ?? 0))
        }
        // chaque valeur doit être réellement utilisée par le calcul
        expect(fodmapPer100g(food, entry)[group].source, `${label} : valeur ignorée`).toMatch(new RegExp(m.source))
      }
    }
  })
})
