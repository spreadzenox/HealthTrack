import { describe, expect, it } from 'vitest'
import { analyzeMatrix, FACTORS, habitFactors, holm, tCritical95, tTwoSidedP } from '../analysisResults'
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

  // REFONTE-6d (banc du 15/11 20:35) : avec l'horizon moyen ouvert à 21 jours, un vrai lien fort donnait 7,2 % (21 j) et
  // 6 % (28 j) de jeux avec un faux lien, presque tous sur l'horizon moyen. Ouvert à 35 jours : 3,8 à 4 %.
  for (const days of [21, 28]) {
    it(`effet fort sur le bien-être, ${days} jours tous notés : au plus 5 % de jeux avec un faux lien`, () => {
      const eff = { outcome: 'wellbeing', key: 'sleepMinutes', horizon: 'short', size: 1 }
      const b = runBench(analyzeMatrix, { days, effects: [eff], wellbeingMissing: 0, digestionMissing: 0 }, { reps: 400 })
      expect(b.falseSetRate).toBeLessThanOrEqual(0.05)
    }, 120_000)
  }

  // REFONTE-4b-2 (banc du 20/11 19:30) : une habitude de Ma journée est un facteur oui / non tiré chaque jour, sans
  // mémoire. Mesures (60 à 80 jeux, notes brutes, sans le lissage TS-1) : aucun faux lien sur 70 et 120 jours ;
  // effet planté de 0,8 point retrouvé à 0,38-0,39 (net dans 15 % des jeux à 70 jours, 49 % à 120), de 1,6 point à
  // 0,61 de sa taille (net 97 % à 90 jours). Ce n'est pas propre aux habitudes : le sommeil (effet fort) ressort à 0,55
  // de sa taille ; c'est le modèle régularisé (ridge) qui rétrécit tous les effets, et sa fourchette (bootstrap autour
  // de l'estimation rétrécie) ne contient la vraie valeur que dans 10 à 30 % des jeux. Dans l'app, le lissage TS-1
  // rétrécit en plus un effet du jour même (0,63 → 0,38 sur les mondes de analysisResults.test.js). Suite : METHODE-BIAIS-1.
  const habit = habitFactors([{ type: 'habit', at: '2026-01-01T12:00:00', payload: { habit: 'x', label: 'X', done: true } }])
  const withHabit = (m, o) => analyzeMatrix(m, { ...o, factors: [...FACTORS, ...habit] })

  it('simulateur : une habitude vaut 0 ou 1, chaque jour au hasard', () => {
    const { matrix } = simulateMatrix({ days: 60, seed: 4, binary: ['habit_x'] })
    const vals = [...matrix.days.values()].map((d) => d.habit_x).filter((v) => v !== null)
    expect(new Set(vals)).toEqual(new Set([0, 1]))
    const yes = vals.filter((v) => v === 1).length / vals.length
    expect(yes).toBeGreaterThan(0.35)
    expect(yes).toBeLessThan(0.65)
    // Sans habitude, rien ne change pour les autres bancs (même suite de tirages).
    expect(simulateMatrix({ days: 50, seed: 2, binary: [] }).matrix.series.wellbeing).toEqual(simulateMatrix({ days: 50, seed: 2 }).matrix.series.wellbeing)
  })

  it('habitude sans effet : au plus 5 % des jeux montrent un faux lien', () => {
    expect(runBench(withHabit, { days: 70, binary: ['habit_x'] }, { reps: REPS }).falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)

  it('habitude à effet fort : retrouvée nette, dans le bon sens ; le banc dit aussi ce que la méthode en estime', () => {
    const eff = { outcome: 'wellbeing', key: 'habit_x', horizon: 'short', size: 1.6 }
    const b = runBench(withHabit, { days: 90, binary: ['habit_x'], effects: [eff] }, { reps: 40 })
    expect(b.power['wellbeing|habit_x|short']).toBeGreaterThanOrEqual(0.8)
    expect(b.falseSetRate).toBeLessThanOrEqual(0.05)
    const est = b.estimates['wellbeing|habit_x|short']
    expect(est).toHaveLength(40)
    const ratio = est.reduce((s, e) => s + e.perUnit, 0) / est.length / eff.size
    // METHODE-BIAIS-1 : taille montrée sans pénalité, sur les jours complets ; 0,61 avant, 0,77 après (40 jeux).
    // METHODE-BIAIS-2 : seulement les jours où la fenêtre du facteur est remplie ; 0,92 (30 jeux).
    expect(ratio).toBeGreaterThan(0.85)
    expect(ratio).toBeLessThanOrEqual(1.1)
  }, 120_000)

  // METHODE-BIAIS-1 (21/11) : mesures à 90 jours, 40 jeux. Taille moyenne / vraie et part des jeux où la fourchette
  // contient la vraie valeur : habitude 0,8 pt 0,51 / 17 % → 0,76 / 78 % ; habitude 1,6 pt 0,61 / 23 % → 0,77 / 55 % ;
  // sommeil (effet fort) 0,61 / 38 % → 0,74 / 75 % ; sommeil (moyen) 0,53 / 47 % → 0,65 / 90 %. Puissance et faux
  // liens inchangés (la netteté reste celle de la ridge). Reste un rétrécissement d'environ 0,25 : METHODE-BIAIS-2.
  const cover = (est, truth) => est.filter((e) => e.low <= truth && truth <= e.high).length / est.length
  const ratioOf = (est, truth) => est.reduce((s, e) => s + e.perUnit, 0) / est.length / truth

  it('taille montrée : un effet du sommeil ressort près de sa taille, la fourchette contient la vraie', () => {
    const eff = { outcome: 'wellbeing', key: 'sleepMinutes', horizon: 'short', size: 1 }
    const b = runBench(analyzeMatrix, { days: 90, effects: [eff] }, { reps: 40 })
    const est = b.estimates['wellbeing|sleepMinutes|short']
    const truth = (0.5 * eff.size) / 45 // points par minute (bruit du bien-être 0,5 ; écart type du sommeil 45 min)
    // METHODE-BIAIS-3 : 0,78 avant (les facteurs retenus sans appui en prenaient une part), 0,94 après.
    expect(ratioOf(est, truth)).toBeGreaterThan(0.85)
    expect(ratioOf(est, truth)).toBeLessThanOrEqual(1.1)
    expect(cover(est, truth)).toBeGreaterThanOrEqual(0.85)
    expect(b.falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)

  it('taille montrée : une habitude à effet moyen, fourchette juste dans au moins 7 jeux sur 10', () => {
    const eff = { outcome: 'wellbeing', key: 'habit_x', horizon: 'short', size: 0.8 }
    const b = runBench(withHabit, { days: 90, binary: ['habit_x'], effects: [eff] }, { reps: 40 })
    const est = b.estimates['wellbeing|habit_x|short']
    expect(ratioOf(est, eff.size)).toBeGreaterThan(0.8)
    expect(cover(est, eff.size)).toBeGreaterThanOrEqual(0.7)
    expect(b.falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)

  // METHODE-BIAIS-3 (20/11 23:30) : un facteur continu autocorrélé (sommeil) ressortait à 0,78-0,80 de sa taille, 0,83
  // même sans jour manquant ; les facteurs retenus sans effet (choisis parmi des dizaines pour une p favorable) en
  // prenaient une part dans l'ajustement de la taille. Ils en sont retirés (seuls restent les très appuyés, p < 0,001) :
  // sommeil fort 0,80 → 0,94, moyen 0,68 → 0,92 (60 jeux). Garde-fou : un facteur sans effet lié au sommeil n'hérite
  // pas de son effet.
  it('taille montrée : un effet moyen du sommeil n\'est plus rétréci', () => {
    const eff = { outcome: 'wellbeing', key: 'sleepMinutes', horizon: 'short', size: 0.5 }
    const b = runBench(analyzeMatrix, { days: 90, effects: [eff] }, { reps: 40 })
    const truth = (0.5 * eff.size) / 45
    expect(ratioOf(b.estimates['wellbeing|sleepMinutes|short'], truth)).toBeGreaterThan(0.8)
    expect(b.falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)

  it('simulateur : deux facteurs liés gardent leur échelle', () => {
    const linked = [{ from: 'sleepMinutes', to: 'screen_late_minutes', r: -0.6 }]
    const { matrix } = simulateMatrix({ days: 200, seed: 3, linked, factorMissing: 0 })
    const pairs = [...matrix.days.values()].map((d) => [d.sleepMinutes, d.screen_late_minutes])
    const m = (k) => pairs.reduce((s, p) => s + p[k], 0) / pairs.length
    const [ma, mb] = [m(0), m(1)]
    const cov = pairs.reduce((s, p) => s + (p[0] - ma) * (p[1] - mb), 0) / pairs.length
    const sd = (k, mk) => Math.sqrt(pairs.reduce((s, p) => s + (p[k] - mk) ** 2, 0) / pairs.length)
    expect(cov / sd(0, ma) / sd(1, mb)).toBeLessThan(-0.45)
    expect(sd(1, mb)).toBeGreaterThan(15)
    expect(sd(1, mb)).toBeLessThan(25)
    // Sans `linked`, rien ne change pour les autres bancs.
    expect(simulateMatrix({ days: 50, seed: 2, linked: [] }).matrix.series.wellbeing).toEqual(simulateMatrix({ days: 50, seed: 2 }).matrix.series.wellbeing)
  })

  it('un facteur sans effet lié au sommeil n\'hérite pas de l\'effet du sommeil', () => {
    const effects = [{ outcome: 'wellbeing', key: 'sleepMinutes', horizon: 'short', size: 1 }]
    const linked = [{ from: 'sleepMinutes', to: 'screen_late_minutes', r: -0.6 }]
    const shown = []
    let net = 0
    for (let k = 0; k < 30; k += 1) {
      const { matrix, lastDay } = simulateMatrix({ days: 90, effects, linked, seed: 1 + k })
      const f = analyzeMatrix(matrix, { today: lastDay }).outcomes.wellbeing.horizons.short.factors
        .find((x) => x.key === 'screen_late_minutes')
      if (f?.inModel) shown.push(f.effect / f.usualChange.amount)
      if (f?.net) net += 1
    }
    // Pente qu'il aurait s'il prenait tout l'effet du sommeil : −0,6 × 0,5 point / 20 min = −0,015 par minute.
    const confounded = (-0.6 * 0.5) / 20
    expect(shown.length).toBeGreaterThan(10)
    expect(Math.abs(shown.reduce((s, v) => s + v, 0) / shown.length)).toBeLessThan(0.4 * Math.abs(confounded))
    expect(net).toBe(0)
  }, 120_000)

  // METHODE-BIAIS-2 (20/11 22:30) : 10 % de jours sans mesure laissent des fenêtres « le jour même et la veille »
  // remplies à moitié ; la veille seule mesure mal ce qui a agi et la taille montrée en sortait rétrécie (habitude
  // 1,6 pt : 0,75 de la vraie, fourchette juste 53 % ; 0,91 et 90 % sans jour manquant). La taille d'un lien ne prend
  // plus que les jours où sa propre fenêtre est remplie : 0,92 et 83 % ; sommeil fort 0,75 / 70 % → 0,78 / 83 %.
  it('jours sans mesure : la taille d\'une habitude reste proche de la vraie, la fourchette la contient', () => {
    const eff = { outcome: 'wellbeing', key: 'habit_x', horizon: 'short', size: 1.6 }
    const b = runBench(withHabit, { days: 90, binary: ['habit_x'], effects: [eff], factorMissing: 0.2 }, { reps: 30 })
    const est = b.estimates['wellbeing|habit_x|short']
    expect(ratioOf(est, eff.size)).toBeGreaterThan(0.85)
    expect(cover(est, eff.size)).toBeGreaterThanOrEqual(0.75)
    expect(b.falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)

  // METHODE-BIAIS-4 (21/11 01:30) : dans l'app, l'analyse lit l'estimation lissée de TS-1, qui tire l'écart du jour vers
  // la tendance. Rejouée au banc (option smooth), la taille montrée retombait à 0,47-0,73 de la vraie et sa fourchette
  // ne la contenait que 17 à 33 % du temps (30 jeux, 90 jours), alors que les notes brutes donnaient 0,93-0,97.
  // La taille montrée s'ajuste maintenant sur l'observation du jour (note, sinon visage) : 0,82-0,96 et 80 à 90 % ;
  // la netteté (ridge sur la série lissée) ne change pas.
  it('notes lissées comme dans l\'app : une habitude garde sa taille et sa fourchette la contient', () => {
    const eff = { outcome: 'wellbeing', key: 'habit_x', horizon: 'short', size: 1.6 }
    const b = runBench(withHabit, { days: 90, binary: ['habit_x'], effects: [eff] }, { reps: 30, smooth: true })
    const est = b.estimates['wellbeing|habit_x|short']
    expect(ratioOf(est, eff.size)).toBeGreaterThan(0.85)
    expect(cover(est, eff.size)).toBeGreaterThanOrEqual(0.75)
    expect(b.power['wellbeing|habit_x|short']).toBeGreaterThanOrEqual(0.8)
    expect(b.falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)

  it('notes lissées comme dans l\'app : un effet fort du sommeil garde sa taille', () => {
    const eff = { outcome: 'wellbeing', key: 'sleepMinutes', horizon: 'short', size: 1 }
    const b = runBench(analyzeMatrix, { days: 90, effects: [eff] }, { reps: 30, smooth: true })
    const est = b.estimates['wellbeing|sleepMinutes|short']
    const truth = (0.5 * eff.size) / 45
    expect(ratioOf(est, truth)).toBeGreaterThan(0.85)
    expect(cover(est, truth)).toBeGreaterThanOrEqual(0.75)
  }, 120_000)

  it('notes lissées : aucun effet, au plus 5 % des jeux montrent un faux lien', () => {
    expect(runBench(analyzeMatrix, { days: 70 }, { reps: 60, smooth: true }).falseSetRate).toBeLessThanOrEqual(0.05)
  }, 120_000)

  it('banc lissé : les séries sont celles de TS-1, avec l\'observation du jour à part', async () => {
    const { smoothSimulated } = await import('./bench')
    const { matrix, lastDay } = simulateMatrix({ days: 40, seed: 5 })
    const m = smoothSimulated(matrix, lastDay)
    const dk = [...matrix.series.wellbeing.keys()][10]
    expect(m.series.observed.wellbeing.ys.get(dk)).toBeCloseTo(matrix.series.wellbeing.get(dk), 6)
    expect(m.series.wellbeing.get(dk)).not.toBeCloseTo(matrix.series.wellbeing.get(dk), 6)
    expect(m.series.digestion.size).toBe(matrix.series.digestion.size)
  })
})

