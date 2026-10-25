/**
 * Banc de calibration de N (I169) : quatre nulles réalistes, sans aucun effet des aliments sur le ventre.
 * Lent (≈ 1 600 jeux) : lancé seulement avec GUT_CALIBRATION=1 (`GUT_CALIBRATION=1 npx vitest run gutWindows.calibration`).
 * Les seuils retenus et le scénario le plus exigeant sont recopiés dans le commentaire de `gutWindows.js` ;
 * `gutWindows.test.js` en gardera une version courte quand le moteur passera ce banc.
 *
 * 25/10/2026, moteur Fisher + BH + porte TTS : ÉCHEC (« derive » 29/200 et « tous » 54/200 en 9 semaines).
 * 26/10/2026, Mantel-Haenszel par blocs de 3 jours (unilatéral, correction de continuité) + BH + porte TTS : PASSE
 * (au plus 13/200, « derive » en 9 semaines). Puissance : voir journal/runs/2026-10-25-2333-*.
 */
import { describe, it, expect } from 'vitest'
import { analyzeGutWindows } from './gutWindows'
import { simulateRealistic, NULL_SCENARIOS } from './gutWindows.sim'

const env = globalThis.process?.env ?? {}
const RUNS = Number(env.GUT_CALIBRATION_RUNS || 200)

describe.skipIf(!env.GUT_CALIBRATION)('calibration de N sur quatre nulles réalistes (I169)', () => {
  for (const days of [42, 63]) {
    for (const scenario of Object.keys(NULL_SCENARIOS)) {
      it(`${scenario}, ${days} jours : moins d’un jeu sur dix avec une piste`, () => {
        let kept = 0
        let fisherOnly = 0
        for (let seed = 1; seed <= RUNS; seed++) {
          const res = analyzeGutWindows(simulateRealistic({ seed: seed * 7919 + days, days, ...NULL_SCENARIOS[scenario] }))
          if (res.results.some((r) => r.q != null && r.q < 0.1)) fisherOnly += 1
          if (res.results.some((r) => r.status === 'link')) kept += 1
        }
        globalThis.process?.stderr.write(`[I169] ${scenario} ${days} j : piste ${kept}/${RUNS}, sans porte ${fisherOnly}/${RUNS}\n`)
        expect(kept / RUNS).toBeLessThan(0.1)
      })
    }
    for (const [label, hard] of [['sans difficulté', {}], ['dérive + séries + saisie', { drift: true, series: true, informative: true }]]) {
      it(`puissance, effet à 6 h, ${label}, ${days} jours (mesurée, pas exigée)`, () => {
        let found = 0
        for (let seed = 1; seed <= RUNS; seed++) {
          const res = analyzeGutWindows(simulateRealistic({ seed: seed * 104729 + days, days, ...hard, effect: { food: 'oignon', fromH: 4, toH: 8, odds: 4 } }))
          if (res.results.some((r) => r.factor === 'oignon' && r.window === '4-24' && r.status === 'link')) found += 1
        }
        globalThis.process?.stderr.write(`[I169] puissance ${label} ${days} j : ${found}/${RUNS}\n`)
      })
    }
  }
})
