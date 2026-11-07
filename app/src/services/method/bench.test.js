import { describe, expect, it } from 'vitest'
import { analyzeMatrix, holm, tCritical95, tTwoSidedP } from '../analysisResults'
import { runBench } from './bench'
import { simulateMatrix } from './simulate'

/**
 * ORG-5a — Banc de simulation avec vérité connue. Cibles du propriétaire (07/11) : faux liens ≤ 5 % (part des jeux où
 * au moins un facteur sans effet sort « net », sur les deux résultats et les trois horizons), effets forts retrouvés.
 * Mesures du 07/11 (200 jeux par scénario, méthode provisoire) : nul 70 j 2 % ; nul 120 j avec dérive des facteurs
 * 0 % ; effet fort court terme 3,5 % de faux, retrouvé 60 % à 70 j ; moyen terme 3,5 %, 26 % ; long terme 0,5 %, 3 %
 * (une moyenne sur 21 jours ne se distingue de la tendance qu'avec des mois) ; digestion forte : 75 % retrouvée.
 */
const REPS = 80

describe('banc de la méthode (ORG-5a)', () => {
  it('outils : Student et Holm', () => {
    expect(tTwoSidedP(2.262, 9)).toBeCloseTo(0.05, 3)
    expect(tCritical95(1000)).toBeCloseTo(1.962, 2)
    expect(holm([0.01, 0.04, 0.03])).toEqual([0.03, 0.06, 0.06])
  })

  it('simulateur : forme de la matrice et vérité gardée', () => {
    const eff = [{ outcome: 'digestion', key: 'fiber_g', horizon: 'short', size: 1 }]
    const { matrix, truth, lastDay } = simulateMatrix({ days: 50, seed: 2, effects: eff })
    expect(truth).toEqual(eff)
    expect(matrix.series.wellbeing.size).toBeGreaterThan(40)
    expect(matrix.series.wellbeing.size).toBeLessThanOrEqual(50)
    expect([...matrix.series.digestion.values()].every((v) => [1, 3, 5].includes(v))).toBe(true)
    expect(matrix.series.symptomDays).toBeGreaterThan(5)
    expect(matrix.days.get(lastDay)).toHaveProperty('sleepMinutes')
    // Déterministe.
    expect(simulateMatrix({ days: 50, seed: 2 }).matrix.series.wellbeing).toEqual(simulateMatrix({ days: 50, seed: 2 }).matrix.series.wellbeing)
  })

  it('le banc repère un faux lien planté (méthode qui dit tout « net »)', () => {
    const naive = (m, o) => {
      const res = analyzeMatrix(m, o)
      for (const out of Object.values(res.outcomes)) for (const h of Object.values(out.horizons)) for (const f of h.factors) f.net = true
      return res
    }
    expect(runBench(naive, { days: 60 }, { reps: 3 }).falseSetRate).toBe(1)
  })

  it('aucun effet : au plus 5 % des jeux montrent un faux lien', () => {
    expect(runBench(analyzeMatrix, { days: 70 }, { reps: REPS }).falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)

  it('aucun effet, facteurs qui dérivent sur 4 mois : au plus 5 %', () => {
    expect(runBench(analyzeMatrix, { days: 120, factorTrend: 1 }, { reps: REPS }).falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)

  it('effet fort sur le bien-être (court terme) : retrouvé, dans le bon sens, sans faux liens', () => {
    const eff = { outcome: 'wellbeing', key: 'sleepMinutes', horizon: 'short', size: 1 }
    const b = runBench(analyzeMatrix, { days: 120, effects: [eff] }, { reps: REPS })
    expect(b.power['wellbeing|sleepMinutes|short']).toBeGreaterThanOrEqual(0.8)
    expect(b.falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)

  it('effet fort sur la digestion : retrouvé ; règle 5 : un facteur du seul bien-être ne devient pas digestif', () => {
    const effects = [
      { outcome: 'digestion', key: 'fiber_g', horizon: 'short', size: 1.5 },
      { outcome: 'wellbeing', key: 'sleepMinutes', horizon: 'short', size: 1.5 },
    ]
    const b = runBench(analyzeMatrix, { days: 90, effects }, { reps: REPS })
    expect(b.power['digestion|fiber_g|short']).toBeGreaterThanOrEqual(0.6)
    expect(b.power['wellbeing|sleepMinutes|short']).toBeGreaterThanOrEqual(0.8)
    // sleepMinutes n'agit que sur le bien-être : « net » en digestion serait un faux lien, compté ici.
    expect(b.falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)
})
