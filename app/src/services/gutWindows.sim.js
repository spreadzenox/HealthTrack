/**
 * Simulateur de journaux repas + ventre (I169), pour les tests seulement : trames synthétiques, jamais de vraies
 * données. Dix aliments, trois repas par jour ; chaque scénario ajoute une difficulté réaliste :
 * - drift : le ventre dérive lentement (AR(1), φ = 0,9) ;
 * - series : chaque aliment se mange par séries de jours (on garde l'habitude d'un jour à l'autre 85 % du temps) ;
 * - informative : une note est plus souvent prise quand ça va mal (30 % des moments calmes, 80 % des moments de gêne) ;
 * - postMeal : les notes sont prises surtout dans les 2 h qui suivent un repas (plus une le soir).
 * `effect` (facultatif) multiplie la cote de gêne quand l'aliment a été mangé entre fromH et toH avant la note.
 * Bilan du soir (I170) : `dayNotes` ajoute un bilan de la journée vers 21 h (oublié 15 % des soirs, et aussi soumis
 * à la saisie informative) ; `timedNotes: false` retire les notes au fil de l'eau. `dayEffect` = { food, day, odds } :
 * la cote de gêne du bilan est multipliée si l'aliment a été mangé le jour même (day 0, avant le bilan) ou la veille
 * (day 1).
 * `extraFoods` (I173) : n aliments de plus, de plus en plus rares (de 1 repas sur 6 à 1 sur 60 environ), comme dans un
 * vrai journal où une longue traîne d'ingrédients ne revient que de temps en temps. Tirés après les dix aliments de
 * base : sans cette option, les journaux simulés ne changent pas.
 */

export const SIM_FOODS = ['Oignon', 'Ail', 'Blé', 'Lentilles', 'Pomme', 'Lait', 'Riz', 'Poulet', 'Carotte', 'Yaourt']

export const NULL_SCENARIOS = {
  derive: { drift: true },
  series: { series: true },
  saisie: { informative: true },
  apres_repas: { postMeal: true },
  tous: { drift: true, series: true, informative: true, postMeal: true },
}

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
export function rng(seed) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const H = 3_600_000
const START = Date.parse('2026-09-01T00:00:00Z')
const MEAL_HOURS = [8, 12.5, 19.5]

export function simulateRealistic({ seed, days = 63, drift = false, series = false, informative = false, postMeal = false, effect = null, timedNotes = true, dayNotes = false, dayEffect = null, extraFoods = 0 }) {
  const rand = rng(seed)
  const entries = []
  const meals = []
  let latent = 0
  const phi = 0.9
  const on = SIM_FOODS.map(() => rand() < 0.35)
  for (let d = 0; d < days; d++) {
    if (drift) latent = phi * latent + Math.sqrt(1 - phi * phi) * (rand() + rand() + rand() - 1.5) * 2
    if (series) SIM_FOODS.forEach((_, i) => { if (rand() > 0.85) on[i] = !on[i] })
    const moments = []
    for (const h of MEAL_HOURS) {
      const items = SIM_FOODS
        .filter((_, i) => (series ? on[i] && h > 10 && rand() < 0.8 : rand() < 0.3))
        .map((ingredient) => ({ ingredient, quantity_g: 100 }))
      for (let k = 0; k < extraFoods; k++) {
        if (rand() < 1 / (6 + k * (54 / Math.max(1, extraFoods - 1)))) items.push({ ingredient: `Extra ${k + 1}`, quantity_g: 50 })
      }
      if (!items.length) items.push({ ingredient: 'Pâtes', quantity_g: 100 })
      const t = START + (d * 24 + h) * H
      const meal = { type: 'food', at: new Date(t).toISOString(), payload: { items } }
      meals.push({ t, foods: new Set(items.map((it) => it.ingredient.toLocaleLowerCase('fr-FR'))) })
      entries.push(meal)
      if (postMeal) moments.push(t + (0.5 + rand() * 1.5) * H)
    }
    if (postMeal) moments.push(START + (d * 24 + 23) * H)
    else for (const h of [13, 18, 23]) moments.push(START + (d * 24 + h) * H)

    for (const t of timedNotes ? moments : []) {
      let logit = latent * 1.5 - 0.8
      if (effect && meals.some((m) => m.foods.has(effect.food) && t - m.t >= effect.fromH * H && t - m.t < effect.toH * H)) {
        logit += Math.log(effect.odds)
      }
      const bad = rand() < 1 / (1 + Math.exp(-logit))
      if (informative && rand() >= (bad ? 0.8 : 0.3)) continue
      entries.push({ type: 'gut', at: new Date(t).toISOString(), payload: { level: bad ? 'discomfort' : 'calm' } })
    }

    if (dayNotes && rand() >= 0.15) {
      const t = START + (d * 24 + 21) * H
      let logit = latent * 1.5 - 0.8
      if (dayEffect) {
        const from = START + (d - dayEffect.day) * 24 * H
        const to = dayEffect.day === 0 ? t : from + 24 * H
        if (meals.some((m) => m.foods.has(dayEffect.food) && m.t >= from && m.t < to)) logit += Math.log(dayEffect.odds)
      }
      const bad = rand() < 1 / (1 + Math.exp(-logit))
      if (!informative || rand() < (bad ? 0.8 : 0.3)) {
        entries.push({ type: 'gut', at: new Date(t).toISOString(), payload: { level: bad ? 'discomfort' : 'calm', scope: 'day' } })
      }
    }
  }
  return entries
}
