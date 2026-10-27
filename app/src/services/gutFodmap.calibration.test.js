/**
 * Banc des sous-groupes FODMAP (N5) : les facteurs « repas riches en fructanes / GOS / lactose… » s'ajoutent aux
 * aliments testés. Ils ne doivent ni fabriquer de fausses pistes (nulles réalistes, aucun effet) ni coûter trop de
 * puissance aux aliments. Journaux simulés aux vrais noms Ciqual (`realNames`) comparés aux mêmes journaux sans
 * sous-groupes (noms courts, inconnus de la table : mêmes repas, mêmes notes, seuls les facteurs FODMAP changent).
 * Lent : lancé seulement avec GUT_CALIBRATION=1 (`GUT_CALIBRATION=1 npx vitest run gutFodmap.calibration`).
 *
 * 27/10/2026 (200 jeux) : voir journal/runs/2026-10-27-0233-n5-pistes-fodmap.md.
 */
import { describe, it, expect } from 'vitest'
import { analyzeGutDays } from './gutDays'
import { analyzeGutWindows } from './gutWindows'
import { simulateRealistic, NULL_SCENARIOS } from './gutWindows.sim'

const env = globalThis.process?.env ?? {}
const RUNS = Number(env.GUT_CALIBRATION_RUNS || 200)
const DAY_ONLY = { timedNotes: false, dayNotes: true }
const log = (s) => globalThis.process?.stderr.write(`[N5] ${s}\n`)

describe.skipIf(!env.GUT_CALIBRATION)('banc des sous-groupes FODMAP (N5)', () => {
  for (const scenario of Object.keys(NULL_SCENARIOS)) {
    it(`bilans du soir, ${scenario}, 63 jours : moins d’un jeu sur dix avec une piste`, () => {
      const kept = { with: 0, without: 0, fodmap: 0 }
      for (let seed = 1; seed <= RUNS; seed++) {
        const opts = { seed: seed * 7919 + 63, days: 63, ...NULL_SCENARIOS[scenario], ...DAY_ONLY }
        const res = analyzeGutDays(simulateRealistic({ ...opts, realNames: true }))
        if (res.results.some((r) => r.status === 'link')) kept.with += 1
        if (res.results.some((r) => r.status === 'link' && r.factor.startsWith('fodmap:'))) kept.fodmap += 1
        if (analyzeGutDays(simulateRealistic(opts)).results.some((r) => r.status === 'link')) kept.without += 1
      }
      log(`bilans ${scenario} 63 j : piste ${kept.with}/${RUNS} (dont sous-groupe ${kept.fodmap}), sans sous-groupes ${kept.without}/${RUNS}`)
      expect(kept.with / RUNS).toBeLessThan(0.1)
    })
    it(`notes horodatées, ${scenario}, 63 jours : moins d’un jeu sur dix avec une piste`, () => {
      const kept = { with: 0, without: 0, fodmap: 0 }
      for (let seed = 1; seed <= RUNS; seed++) {
        const opts = { seed: seed * 7919 + 63, days: 63, ...NULL_SCENARIOS[scenario] }
        const res = analyzeGutWindows(simulateRealistic({ ...opts, realNames: true }))
        if (res.results.some((r) => r.status === 'link')) kept.with += 1
        if (res.results.some((r) => r.status === 'link' && r.factor.startsWith('fodmap:'))) kept.fodmap += 1
        if (analyzeGutWindows(simulateRealistic(opts)).results.some((r) => r.status === 'link')) kept.without += 1
      }
      log(`notes ${scenario} 63 j : piste ${kept.with}/${RUNS} (dont sous-groupe ${kept.fodmap}), sans sous-groupes ${kept.without}/${RUNS}`)
      expect(kept.with / RUNS).toBeLessThan(0.1)
    })
  }

  it('puissance, bilans du soir, 90 jours (mesurée)', () => {
    const cases = [
      ['lactose (lait ou yaourt) ×4', ['lait', 'yaourt'], ['fodmap:lactose', 'lait demi-écrémé, uht', 'yaourt nature']],
      ['oignon ×4', 'oignon', ['oignon jaune, cru']],
    ]
    for (const [label, food, names] of cases) {
      const found = { with: 0, subgroup: 0, without: 0, wrong: 0 }
      for (let seed = 1; seed <= RUNS; seed++) {
        const opts = { seed: seed * 104729 + 90, days: 90, ...DAY_ONLY, dayEffect: { food, day: 0, odds: 4 } }
        const res = analyzeGutDays(simulateRealistic({ ...opts, realNames: true }))
        const links = res.results.filter((r) => r.status === 'link')
        if (links.some((r) => names.includes(r.factor))) found.with += 1
        if (links.some((r) => r.factor === names[0] && names[0].startsWith('fodmap:'))) found.subgroup += 1
        if (links.some((r) => r.factor.startsWith('fodmap:') && !names.includes(r.factor))) found.wrong += 1
        const short = [].concat(food)
        if (analyzeGutDays(simulateRealistic(opts)).results.some((r) => r.status === 'link' && short.includes(r.factor))) found.without += 1
      }
      log(`puissance ${label} : repéré ${found.with}/${RUNS} (par le sous-groupe ${found.subgroup}), sans sous-groupes ${found.without}/${RUNS}, autre sous-groupe accusé ${found.wrong}/${RUNS}`)
    }
  })
})
