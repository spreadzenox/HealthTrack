/**
 * Banc du bilan du soir (I170 étape 3) : nulles réalistes sans aucun effet, puis puissance mesurée.
 * Lent : lancé seulement avec GUT_CALIBRATION=1 (`GUT_CALIBRATION=1 npx vitest run gutDays.calibration`).
 *
 * 26/10/2026, Mantel-Haenszel par blocs de 7 jours (≥ 5 blocs informatifs) + BH + porte TTS : PASSE (au plus 7/200,
 * « derive » en 9 semaines). Puissance ×4 en 9 semaines : 25/200 (jour même), 36/200 (veille).
 * I173 (12 aliments testés au plus) : +20 / +40 aliments rares, 13 semaines, ×4 le jour même : 51 et 64/200.
 */
import { describe, it, expect } from 'vitest'
import { analyzeGutDays } from './gutDays'
import { simulateRealistic, NULL_SCENARIOS } from './gutWindows.sim'

const env = globalThis.process?.env ?? {}
const RUNS = Number(env.GUT_CALIBRATION_RUNS || 200)
const DAY_ONLY = { timedNotes: false, dayNotes: true }

describe.skipIf(!env.GUT_CALIBRATION)('banc du bilan du soir (I170)', () => {
  for (const days of [42, 63]) {
    for (const scenario of Object.keys(NULL_SCENARIOS)) {
      it(`${scenario}, ${days} jours : moins d’un jeu sur dix avec une piste`, () => {
        let kept = 0
        let raw = 0
        for (let seed = 1; seed <= RUNS; seed++) {
          const res = analyzeGutDays(simulateRealistic({ seed: seed * 7919 + days, days, ...NULL_SCENARIOS[scenario], ...DAY_ONLY }))
          if (res.results.some((r) => r.q != null && r.q < 0.1)) raw += 1
          if (res.results.some((r) => r.status === 'link')) kept += 1
        }
        globalThis.process?.stderr.write(`[I170] ${scenario} ${days} j : piste ${kept}/${RUNS}, sans porte ${raw}/${RUNS}\n`)
        expect(kept / RUNS).toBeLessThan(0.1)
      })
    }
    for (const [label, hard] of [['sans difficulté', {}], ['dérive + séries + saisie', { drift: true, series: true, informative: true }]]) {
      for (const day of [0, 1]) {
        it(`puissance, effet ×4 ${day ? 'la veille' : 'le jour même'}, ${label}, ${days} jours (mesurée)`, () => {
          let found = 0
          for (let seed = 1; seed <= RUNS; seed++) {
            const res = analyzeGutDays(simulateRealistic({ seed: seed * 104729 + days, days, ...hard, ...DAY_ONLY, dayEffect: { food: 'oignon', day, odds: 4 } }))
            if (res.results.some((r) => r.factor === 'oignon' && r.window === (day ? 'veille' : 'jour') && r.status === 'link')) found += 1
          }
          globalThis.process?.stderr.write(`[I170] puissance ${day ? 'veille' : 'jour'} ${label} ${days} j : ${found}/${RUNS}\n`)
        })
      }
    }
  }
  it('puissance avec une longue traîne d’aliments rares (I173, mesurée)', () => {
    for (const extraFoods of [20, 40]) {
      let found = 0
      for (let seed = 1; seed <= RUNS; seed++) {
        const res = analyzeGutDays(simulateRealistic({ seed: seed * 104729 + 90, days: 90, ...DAY_ONLY, extraFoods, dayEffect: { food: 'oignon', day: 0, odds: 4 } }))
        if (res.results.some((r) => r.factor === 'oignon' && r.window === 'jour' && r.status === 'link')) found += 1
      }
      globalThis.process?.stderr.write(`[I173] puissance jour, +${extraFoods} aliments rares, 90 j : ${found}/${RUNS}\n`)
    }
  })
})
