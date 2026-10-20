import { describe, it, expect } from 'vitest'
import {
  faceMoodDays,
  faceMoodAnalysisEntries,
  computeFaceMoodCorrelations,
  FACE_MOOD_MIN_DAYS,
  FACE_MOOD_MIN_READINGS,
} from './faceMoodDays'
import { isEstimatorInput } from './estimatorInputs'

const NEUTRAL = { smile: 0.1, duchenne: 0.05, mouthFrown: 0.05, browDown: 0.15, browInnerUp: 0.1, eyeOpen: 0.8, jawOpen: 0.05, asymmetry: 0.02, yaw: 4 }

function burst(at, values = {}, { trigger = 'unlock', valid = 3 } = {}) {
  return { type: 'face_burst', source: 'face_sense', at: at.toISOString(), payload: { v: 1, trigger, frames: 3, valid, values: { ...NEUTRAL, ...values }, rejected: {} } }
}
const day = (i, h, m = 0) => new Date(2026, 8, 1 + i, h, m)

/** Générateur déterministe dans [-1, 1]. */
function noise(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return (s / 2147483648) * 2 - 1
  }
}

/** n jours : 3 lectures (8 h, 9 h, 10 h) dont la valence suit `valence(i)`, et des pas à 7 h suivant `steps(i)`. */
function history(n, { valence, steps, readings = 3 }) {
  const entries = []
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < readings; k++) entries.push(burst(day(i, 8 + k), { valence: valence(i), arousal: 0 }))
    entries.push({ type: 'steps', at: day(i, 7).toISOString(), payload: { value: steps(i) } })
  }
  return entries
}

describe('faceMoodDays — le bien-être estimé jour par jour', () => {
  it(`ne garde que les jours avec au moins ${FACE_MOOD_MIN_READINGS} lectures du déverrouillage avec un visage`, () => {
    const entries = [
      burst(day(0, 8), { valence: 0.5 }), burst(day(0, 12), { valence: 0.5 }), burst(day(0, 18), { valence: 0.5 }),
      burst(day(1, 8), { valence: 0.5 }), burst(day(1, 9), { valence: 0.5 }),
      // Un test manuel ou une rafale sans visage ne comptent pas.
      burst(day(1, 10), { valence: 0.5 }, { trigger: 'manual' }), burst(day(1, 11), { valence: 0.5 }, { valid: 0 }),
    ]
    const days = faceMoodDays(entries)
    expect(days.map((d) => d.date)).toEqual(['2026-09-01'])
    expect(days[0].readings).toBe(3)
    expect(days[0].lastAt).toBe(day(0, 18).toISOString())
  })

  it('prend la médiane des estimations du jour (une lecture extrême ne fait pas la journée)', () => {
    const entries = [burst(day(0, 8), { valence: 0.4 }), burst(day(0, 9), { valence: 0.4 }), burst(day(0, 10), { valence: -1 })]
    const [d] = faceMoodDays(entries)
    const [high] = faceMoodDays([burst(day(0, 8), { valence: 0.4 }), burst(day(0, 9), { valence: 0.4 }), burst(day(0, 10), { valence: 0.4 })])
    expect(d.note).toBeCloseTo(high.note, 1)
    expect(d.note).toBeGreaterThan(2.5)
  })

  it('reste rapide sur des mois de lectures (≈ 50 par jour)', () => {
    const rnd = noise(3)
    const entries = []
    for (let i = 0; i < 120; i++) for (let k = 0; k < 50; k++) entries.push(burst(new Date(2026, 5, 1 + i, 7, 0 + 15 * k), { valence: 0.3 * rnd() }))
    const t = performance.now()
    expect(faceMoodDays(entries)).toHaveLength(120)
    expect(performance.now() - t).toBeLessThan(3000)
  })
})

describe('faceMoodAnalysisEntries — ordre temporel et notes', () => {
  it('remplace les notes par une estimation par jour, datée de la dernière lecture', () => {
    const entries = [
      burst(day(0, 8), { valence: 0.5 }), burst(day(0, 9), { valence: 0.5 }), burst(day(0, 10), { valence: 0.5 }),
      { type: 'wellbeing', at: day(0, 21).toISOString(), payload: { score: 0 } },
      { type: 'steps', at: day(0, 7).toISOString(), payload: { value: 5000 } },
    ]
    const out = faceMoodAnalysisEntries(entries)
    const wb = out.filter((e) => e.type === 'wellbeing')
    expect(wb).toHaveLength(1)
    expect(wb[0].at).toBe(day(0, 10).toISOString())
    expect(wb[0].payload.score).toBeGreaterThan(2.5)
    expect(out.some((e) => e.type === 'steps')).toBe(true)
  })
})

describe('computeFaceMoodCorrelations — vos facteurs comparés à l’humeur estimée, sans aucune note', () => {
  it('dit quand il n’y a aucune lecture du visage', () => {
    expect(computeFaceMoodCorrelations([{ type: 'steps', at: day(0, 7).toISOString(), payload: { value: 1 } }]).status).toBe('no_face')
  })

  it(`attend ${FACE_MOOD_MIN_DAYS} jours estimés`, () => {
    const res = computeFaceMoodCorrelations(history(FACE_MOOD_MIN_DAYS - 1, { valence: () => 0, steps: (i) => 1000 * i }))
    expect(res).toMatchObject({ status: 'not_enough_data', minDays: FACE_MOOD_MIN_DAYS, currentDays: FACE_MOOD_MIN_DAYS - 1 })
  })

  it('trouve un lien net entre un facteur et l’humeur estimée, sans aucune note', () => {
    const rnd = noise(11)
    const steps = (i) => 4000 + 3000 * Math.sin(i * 1.7) + 300 * rnd()
    const res = computeFaceMoodCorrelations(history(30, { valence: (i) => (steps(i) - 4000) / 4000, steps }))
    expect(res.status).toBe('ok')
    expect(res.faceDays).toBe(30)
    const c = res.correlations.find((x) => x.variable === 'steps')
    expect(c.r).toBeGreaterThan(0.8)
    expect(c.evidence).not.toBe('incertain')
  })

  it('aucun sens présupposé : un lien inverse est montré tel quel', () => {
    const steps = (i) => 4000 + 3000 * Math.sin(i * 1.7)
    const res = computeFaceMoodCorrelations(history(30, { valence: (i) => -(steps(i) - 4000) / 4000, steps }))
    expect(res.correlations.find((x) => x.variable === 'steps').r).toBeLessThan(-0.8)
  })

  it('ne présente jamais une entrée de l’estimateur comme un facteur (D5)', () => {
    const steps = (i) => 4000 + 3000 * Math.sin(i * 1.7)
    const entries = history(30, { valence: (i) => (steps(i) - 4000) / 4000, steps })
    for (let i = 0; i < 30; i++) entries.push({ type: 'wellbeing', at: day(i, 21).toISOString(), payload: { score: 2 + (i % 3), tags: ['stress'] } })
    const res = computeFaceMoodCorrelations(entries)
    const factors = res.correlations.map((c) => c.variable)
    expect(factors).toContain('steps')
    expect(factors.filter(isEstimatorInput)).toEqual([])
  })

  it('un comportement du jour fini après la dernière lecture (avant 20 h) ne compte pas', () => {
    const entries = []
    for (let i = 0; i < 20; i++) {
      for (let k = 0; k < 3; k++) entries.push(burst(day(i, 8 + k), { valence: i % 2 ? 0.5 : -0.5 }))
      // Pas faits l'après-midi, après la dernière lecture de 10 h : ils ne peuvent pas expliquer l'humeur lue avant.
      entries.push({ type: 'steps', at: day(i, 15).toISOString(), payload: { value: i % 2 ? 9000 : 2000 } })
    }
    const res = computeFaceMoodCorrelations(entries)
    expect(res.correlations.find((c) => c.variable === 'steps')).toBeUndefined()
  })
})
