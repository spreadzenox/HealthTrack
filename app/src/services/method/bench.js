/**
 * ORG-5a — Banc : rejoue une méthode sur des matrices simulées et mesure
 * - le taux de jeux avec au moins un faux lien « net » (facteur sans aucun effet sur ce résultat) : cible ≤ 5 % ;
 * - la puissance pour chaque effet vrai (retrouvé « net », dans le bon sens, au bon horizon) ;
 * - les liens nets au mauvais horizon d'un facteur qui agit (comptés à part : un facteur autocorrélé agit aussi
 *   « en moyenne » sur les fenêtres voisines).
 * - pour chaque effet vrai, ce que la méthode en dit à chaque jeu, net ou non (`estimates` : pente par unité du
 *   facteur et fourchette dans la même unité), pour juger le biais et la couverture (REFONTE-4b-2).
 * La méthode est une fonction (matrix, { today }) → AnalysisResults (le contrat).
 */
import { smoothedMatrix } from '../analysisResults'
import { simulateMatrix } from './simulate'
import { GUT_VALUE } from './stateSpace'

/**
 * METHODE-BIAIS-4 — Ce que l'app analyse vraiment : les notes simulées passent par le lissage TS-1 (notes du
 * bien-être ; notes du ventre calme / gêne / douleur), comme `buildAnalysisMatrix` le fait pour un vrai journal.
 */
export function smoothSimulated(matrix, today) {
  const gutOf = { 5: GUT_VALUE.calm, 3: GUT_VALUE.discomfort, 1: GUT_VALUE.pain }
  const wellbeing = new Map([...matrix.series.wellbeing].map(([dk, v]) => [dk, { note: v }]))
  const digestion = new Map([...matrix.series.digestion].map(([dk, v]) => [dk, { gut: gutOf[v] }]))
  return smoothedMatrix({ wellbeing, digestion }, { raw: matrix.series, days: matrix.days, today })
}

/** @param {{ reps?: number, seed0?: number, smooth?: boolean }} [opts]  smooth : notes lissées par TS-1, comme dans l'app */
export function runBench(method, scenario, { reps = 100, seed0 = 1, smooth = false } = {}) {
  let falseSets = 0
  let falseLinks = 0
  let wrongHorizon = 0
  const found = new Map((scenario.effects ?? []).map((e) => [`${e.outcome}|${e.key}|${e.horizon}`, 0]))
  const estimates = new Map([...found.keys()].map((id) => [id, []]))
  for (let k = 0; k < reps; k += 1) {
    const sim = simulateMatrix({ ...scenario, seed: seed0 + k })
    const { truth, lastDay } = sim
    const matrix = smooth ? smoothSimulated(sim.matrix, lastDay) : sim.matrix
    const res = method(matrix, { today: lastDay })
    let anyFalse = false
    for (const [outcomeId, out] of Object.entries(res.outcomes)) {
      const acting = new Set(truth.filter((t) => t.outcome === outcomeId).map((t) => t.key))
      for (const h of Object.values(out.horizons)) {
        for (const f of h.factors) {
          const id = `${outcomeId}|${f.key}|${h.id}`
          const a = f.usualChange?.amount || 1
          estimates.get(id)?.push({ perUnit: f.effect / a, low: f.low / a, high: f.high / a })
          if (!f.net) continue
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
    estimates: Object.fromEntries(estimates),
  }
}
