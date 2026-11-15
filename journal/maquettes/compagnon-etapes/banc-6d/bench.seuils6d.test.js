import { afterAll, describe, expect, it } from 'vitest'
import { analyzeMatrix, UNLOCK_DAYS } from '../analysisResults'
import { runBench } from './bench'

/**
 * REFONTE-6d — Banc des seuils 7 et 14 (brief « Compagnon » § 3.5, préparation ETAPE-6-OBJECTIFS.md § 4).
 * Question : si l'horizon court du moteur s'ouvrait à 7 jours notés (bien-être) et 14 (digestion), les liens « nets »
 * resteraient-ils sous 5 % de jeux avec un faux lien, et un effet fort serait-il retrouvé ?
 * Mesure, pas un test de non-régression : lancé seulement avec BENCH_6D=1 (`BENCH_6D=1 npx vitest run bench.seuils6d`),
 * résultats dans le journal. Le seuil court est abaissé le temps du banc, puis remis.
 */
const RUN = Boolean(process.env.BENCH_6D)
const REPS = Number(process.env.BENCH_REPS ?? 200)
const saved = { w: UNLOCK_DAYS.wellbeing.short, d: UNLOCK_DAYS.digestion.short }

const rows = []
function bench(label, unlock, scenario) {
  UNLOCK_DAYS.wellbeing.short = unlock.w
  UNLOCK_DAYS.digestion.short = unlock.d
  const t0 = Date.now()
  const b = runBench(analyzeMatrix, scenario, { reps: REPS })
  const power = Object.entries(b.power).map(([k, v]) => `${k}=${Math.round(v * 100)}%`).join(' ')
  rows.push(`| ${label} | ${Math.round(b.falseSetRate * 1000) / 10} % | ${b.falseLinksPerSet.toFixed(2)} | ${power || '—'} | ${Math.round((Date.now() - t0) / 1000)} s |`)
  return b
}

describe.skipIf(!RUN)('banc des seuils 7 et 14 (REFONTE-6d)', () => {
  afterAll(() => {
    UNLOCK_DAYS.wellbeing.short = saved.w
    UNLOCK_DAYS.digestion.short = saved.d
    console.log(['', `| Scénario (${REPS} jeux) | Jeux avec faux lien | Faux liens par jeu | Puissance | Durée |`, '|---|---|---|---|---|', ...rows].join('\n'))
  })

  const sleep = (size) => ({ outcome: 'wellbeing', key: 'sleepMinutes', horizon: 'short', size })
  const fiber = (size) => ({ outcome: 'digestion', key: 'fiber_g', horizon: 'short', size })
  const full = { wellbeingMissing: 0, digestionMissing: 0 }

  it('nul, seuils 7 / 14', () => {
    for (const n of [7, 8, 10, 14]) bench(`nul, ${n} j tous notés, seuils 7/14`, { w: 7, d: 14 }, { days: n, ...full })
    bench('nul, 16 j (10 % non notés), seuils 7/14', { w: 7, d: 14 }, { days: 16 })
    bench('nul, 21 j tous notés, seuils 7/14', { w: 7, d: 14 }, { days: 21, ...full })
    expect(true).toBe(true)
  }, 1_800_000)

  it('nul, digestion plus souvent gênée (moitié des jours)', () => {
    for (const n of [14, 21]) bench(`nul, ${n} j, gêne 1 j sur 2, seuils 7/14`, { w: 7, d: 14 }, { days: n, ...full, symptomShare: 0.5 })
  }, 1_800_000)

  it('effet fort (1 et 1,5 écart type) : retrouvé ?', () => {
    for (const n of [8, 10, 14, 21, 28]) bench(`sommeil fort (1), ${n} j, seuils 7/14`, { w: 7, d: 14 }, { days: n, ...full, effects: [sleep(1)] })
    for (const n of [8, 14]) bench(`sommeil très fort (1,5), ${n} j, seuils 7/14`, { w: 7, d: 14 }, { days: n, ...full, effects: [sleep(1.5)] })
    for (const n of [14, 21, 28]) bench(`fibres très fort (1,5), ${n} j, gêne 1 j sur 2, seuils 7/14`, { w: 7, d: 14 }, { days: n, ...full, symptomShare: 0.5, effects: [fiber(1.5)] })
  }, 1_800_000)

  it('repère : seuils actuels 14 / 28', () => {
    bench('sommeil fort (1), 14 j, seuils 14/28', { w: 14, d: 28 }, { days: 14, ...full, effects: [sleep(1)] })
    bench('fibres très fort (1,5), 28 j, gêne 1 j sur 2, seuils 14/28', { w: 14, d: 28 }, { days: 28, ...full, symptomShare: 0.5, effects: [fiber(1.5)] })
  }, 1_800_000)
})
