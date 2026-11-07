/**
 * ORG-5a — Banc : rejoue une méthode sur des matrices simulées et mesure
 * - le taux de jeux avec au moins un faux lien « net » (facteur sans aucun effet sur ce résultat) : cible ≤ 5 % ;
 * - la puissance pour chaque effet vrai (retrouvé « net », dans le bon sens, au bon horizon) ;
 * - les liens nets au mauvais horizon d'un facteur qui agit (comptés à part : un facteur autocorrélé agit aussi
 *   « en moyenne » sur les fenêtres voisines).
 * La méthode est une fonction (matrix, { today }) → AnalysisResults (le contrat).
 */
import { simulateMatrix } from './simulate'

export function runBench(method, scenario, { reps = 100, seed0 = 1 } = {}) {
  let falseSets = 0
  let falseLinks = 0
  let wrongHorizon = 0
  const found = new Map((scenario.effects ?? []).map((e) => [`${e.outcome}|${e.key}|${e.horizon}`, 0]))
  for (let k = 0; k < reps; k += 1) {
    const { matrix, truth, lastDay } = simulateMatrix({ ...scenario, seed: seed0 + k })
    const res = method(matrix, { today: lastDay })
    let anyFalse = false
    for (const [outcomeId, out] of Object.entries(res.outcomes)) {
      const acting = new Set(truth.filter((t) => t.outcome === outcomeId).map((t) => t.key))
      for (const h of Object.values(out.horizons)) {
        for (const f of h.factors) {
          if (!f.net) continue
          const id = `${outcomeId}|${f.key}|${h.id}`
          const eff = truth.find((t) => `${t.outcome}|${t.key}|${t.horizon}` === id)
          if (eff) {
            if (Math.sign(f.effect) === Math.sign(eff.size)) found.set(id, found.get(id) + 1)
          } else if (acting.has(f.key)) {
            wrongHorizon += 1
          } else {
            falseLinks += 1
            anyFalse = true
          }
        }
      }
    }
    if (anyFalse) falseSets += 1
  }
  return {
    reps,
    falseSetRate: falseSets / reps,
    falseLinksPerSet: falseLinks / reps,
    wrongHorizonPerSet: wrongHorizon / reps,
    power: Object.fromEntries([...found].map(([id, n]) => [id, n / reps])),
  }
}
