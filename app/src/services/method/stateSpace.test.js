import { describe, expect, it } from 'vitest'
import {
  GUT_VALUE, RHO_PRIOR, estimateParams, estimateStates, estimateStatesFromEntries, observationsFromEntries,
} from './stateSpace'
import { analyzeMatrix } from '../analysisResults'
import { gaussian, rng, simDayKey, simulateMatrix } from './simulate'

/** Vérité connue : deux états liés (écarts corrélés), notes rares, visage fréquent, notes du ventre une fois sur deux. */
function world({ days = 84, seed = 1, rho = 0.7, noteShare = 0.3, faceShare = 0.9, gutShare = 0.5, faceSd = 0.8 } = {}) {
  const r = rng(seed)
  const truth = []
  let lw = 3
  let ld = 3.5
  const wellbeing = new Map()
  const digestion = new Map()
  for (let i = 0; i < days; i += 1) {
    lw += 0.05 * gaussian(r)
    ld += 0.05 * gaussian(r)
    const z1 = gaussian(r)
    const z2 = rho * z1 + Math.sqrt(1 - rho ** 2) * gaussian(r)
    const w = lw + 0.6 * z1
    const d = ld + 0.9 * z2
    const dk = simDayKey(i)
    truth.push({ dk, w, d })
    const o = {}
    if (r() < noteShare) o.note = w + 0.3 * gaussian(r)
    if (r() < faceShare) o.face = w + faceSd * gaussian(r)
    if (Object.keys(o).length) wellbeing.set(dk, o)
    if (r() < gutShare) {
      const level = d > 3 ? 'calm' : d > 1.8 ? 'discomfort' : 'pain'
      digestion.set(dk, { gut: GUT_VALUE[level] })
    }
  }
  return { obs: { wellbeing, digestion }, truth, today: simDayKey(days - 1) }
}

const rmse = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / a.length)
const corr = (a, b) => {
  const ma = a.reduce((s, v) => s + v, 0) / a.length
  const mb = b.reduce((s, v) => s + v, 0) / b.length
  const c = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0)
  return c / Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0) * b.reduce((s, v) => s + (v - mb) ** 2, 0))
}

describe('TS-1 : modèle à espace d’états bien-être + confort digestif', () => {
  it('suit le bien-être mieux que le visage seul, avec une fourchette honnête', () => {
    let better = 0
    let inside = 0
    let total = 0
    for (let seed = 1; seed <= 10; seed += 1) {
      const { obs, truth, today } = world({ seed })
      const res = estimateStates(obs, { today })
      const days = res.days.filter((d) => !d.future)
      const withFace = truth.filter((t) => obs.wellbeing.get(t.dk)?.face !== undefined)
      const est = withFace.map((t) => days.find((d) => d.date === t.dk).wellbeing.mean)
      const raw = withFace.map((t) => Math.min(5, Math.max(0, obs.wellbeing.get(t.dk).face)))
      const tru = withFace.map((t) => t.w)
      if (rmse(est, tru) < rmse(raw, tru)) better += 1
      for (const t of truth) {
        const d = days.find((x) => x.date === t.dk)
        total += 1
        if (t.w >= d.wellbeing.low && t.w <= d.wellbeing.high) inside += 1
      }
    }
    expect(better).toBeGreaterThanOrEqual(9)
    // Fourchette à 80 % : couverture plausible.
    expect(inside / total).toBeGreaterThan(0.65)
    expect(inside / total).toBeLessThan(0.95)
  })

  it('apprend le lien entre les écarts du jour, rétréci vers une valeur prudente', () => {
    const many = estimateParams(world({ days: 200, rho: 0.8, noteShare: 0.9, gutShare: 0.9 }).obs)
    expect(many.rho).toBeGreaterThan(0.45)
    const few = estimateParams(world({ days: 12, rho: 0.8, gutShare: 0.2 }).obs)
    expect(few.rho).toBe(RHO_PRIOR)
  })

  it('règle 5 : digestionOwn ne dépend d’aucune observation du bien-être', () => {
    const { obs, today } = world({ seed: 4 })
    const a = estimateStates(obs, { today })
    const shifted = new Map([...obs.wellbeing].map(([dk, o]) => [dk, { ...o, face: (o.face ?? 3) - 2, note: 0.5 }]))
    const b = estimateStates({ ...obs, wellbeing: shifted }, { today })
    expect(b.days.map((d) => d.digestionOwn.mean)).toEqual(a.days.map((d) => d.digestionOwn.mean))
    expect(b.days.map((d) => d.digestion.mean)).not.toEqual(a.days.map((d) => d.digestion.mean))
  })

  it('sans note du ventre, la digestion s’estime par le bien-être quand les deux sont liés', () => {
    let gain = 0
    for (let seed = 1; seed <= 8; seed += 1) {
      const { obs, truth, today } = world({ seed, rho: 0.8, gutShare: 0.4, days: 120 })
      const res = estimateStates(obs, { today })
      const known = new Set(res.days.map((d) => d.date))
      const unseen = truth.filter((t) => obs.digestion.get(t.dk) === undefined && known.has(t.dk))
      const pick = (k) => unseen.map((t) => res.days.find((d) => d.date === t.dk)[k].mean)
      const tru = unseen.map((t) => t.d)
      if (corr(pick('digestion'), tru) > corr(pick('digestionOwn'), tru)) gain += 1
    }
    expect(gain).toBeGreaterThanOrEqual(7)
  })

  it('courbe digestive estimée : montrée seulement si elle prédit les notes mises de côté', () => {
    const linked = estimateStates(world({ seed: 2, rho: 0.85, days: 120, gutShare: 0.5 }).obs, { today: simDayKey(119) })
    expect(linked.curveCheck.blocks).toBeGreaterThanOrEqual(3)
    expect(linked.showDigestiveCurve).toBe(true)
    const { obs, today } = world({ seed: 2, gutShare: 0 })
    const none = estimateStates(obs, { today })
    expect(none.showDigestiveCurve).toBe(false)
    expect(none.noteRequest.digestion).toBe(false)
  })

  it('attendu des jours à venir : marqué futur, fourchette qui s’élargit', () => {
    const { obs, today } = world({ seed: 3 })
    const res = estimateStates(obs, { today, ahead: 7 })
    const fut = res.days.filter((d) => d.future)
    expect(fut).toHaveLength(7)
    expect(fut[0].date > today).toBe(true)
    for (let i = 1; i < fut.length; i += 1) expect(fut[i].wellbeing.sd).toBeGreaterThan(fut[i - 1].wellbeing.sd)
    expect(fut.every((d) => !d.observed.wellbeing)).toBe(true)
  })

  it('ne demande pas de note un jour déjà noté', () => {
    const { obs, today } = world({ seed: 5 })
    obs.wellbeing.set(today, { note: 3 })
    obs.digestion.set(today, { gut: 4.5 })
    const res = estimateStates(obs, { today })
    expect(res.noteRequest).toEqual({ wellbeing: false, digestion: false })
  })

  it('demande une note quand l’estimation du jour est parmi les plus incertaines', () => {
    const { obs, today } = world({ seed: 6, faceShare: 1, noteShare: 0.5 })
    obs.wellbeing.delete(today)
    const res = estimateStates(obs, { today })
    expect(res.noteRequest.wellbeing).toBe(true)
  })

  it('lit les entrées : notes, ventre (le plus fort du jour), selles', () => {
    const entries = [
      { type: 'wellbeing', at: '2026-03-02T21:00:00', payload: { score: 4 } },
      { type: 'wellbeing', at: '2026-03-02T09:00:00', payload: { score: 2 } },
      { type: 'gut', at: '2026-03-02T10:00:00', payload: { level: 'calm' } },
      { type: 'gut', at: '2026-03-02T15:00:00', payload: { level: 'pain' } },
      { type: 'stool', at: '2026-03-03T08:00:00', payload: { form: 'loose' } },
    ]
    const obs = observationsFromEntries(entries)
    expect(obs.wellbeing.get('2026-03-02').note).toBe(3)
    expect(obs.digestion.get('2026-03-02').gut).toBe(GUT_VALUE.pain)
    expect(obs.digestion.get('2026-03-03').stool).toBeLessThan(3)
    const res = estimateStatesFromEntries(entries, { now: new Date('2026-03-03T22:00:00') })
    expect(res.days.at(-8).date).toBe('2026-03-03')
    expect(estimateStatesFromEntries([], {})).toBeNull()
  })

  it('banc, règle 5 : un facteur qui ne touche que le bien-être ne devient pas un facteur digestif', () => {
    // Les analyses digestives prennent digestionOwn, jamais la série jointe.
    let leakOwn = 0
    const reps = 25
    for (let seed = 1; seed <= reps; seed += 1) {
      const sim = simulateMatrix({
        days: 120, seed, factors: ['sleepMinutes', 'steps', 'screen_minutes'], digestionMissing: 0.5,
        effects: [{ outcome: 'wellbeing', key: 'sleepMinutes', horizon: 'short', size: 2 }],
      })
      // Visage chaque jour (bruité) ; notes du ventre de la simulation (une sur deux) ; lien fort supposé.
      const r = rng(1000 + seed)
      const wellbeing = new Map([...sim.matrix.series.wellbeing].map(([dk, v]) => [dk, { face: v + 0.5 * gaussian(r) }]))
      const digestion = new Map([...sim.matrix.series.digestion].map(([dk, v]) => [dk, { gut: v === 5 ? 4.5 : v === 3 ? 2.5 : 1 }]))
      const res = estimateStates({ wellbeing, digestion }, { today: sim.lastDay, ahead: 0 })
      const leak = (key) => {
        const series = new Map(res.days.map((d) => [d.date, d[key].mean]))
        const m = { ...sim.matrix, series: { ...sim.matrix.series, digestion: series } }
        const out = analyzeMatrix(m, { today: sim.lastDay }).outcomes.digestion
        return Object.values(out.horizons).some((h) => h.factors.some((f) => f.key === 'sleepMinutes' && f.net))
      }
      if (leak('digestionOwn')) leakOwn += 1
    }
    expect(leakOwn / reps).toBeLessThanOrEqual(0.05)
  }, 120_000)
})
