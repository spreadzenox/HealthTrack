import { describe, it, expect } from 'vitest'
import {
  faceMoodEstimate,
  describeFaceMood,
  priorValence,
  personalNeutral,
  testReadingEstimate,
  EXPRESSION_KEYS,
  FACE_PRIOR,
} from './faceMood'
import { isEstimatorInput } from './estimatorInputs'

const NEUTRAL = { smile: 0.1, duchenne: 0.05, mouthFrown: 0.05, browDown: 0.15, browInnerUp: 0.1, eyeOpen: 0.8, jawOpen: 0.05, asymmetry: 0.02, yaw: 4 }

function burst(at, values = {}, { trigger = 'unlock', valid = 3, frames = 3 } = {}) {
  return { type: 'face_burst', source: 'face_sense', at: new Date(at).toISOString(), payload: { v: 1, trigger, frames, valid, values: { ...NEUTRAL, ...values }, rejected: {} } }
}
const note = (at, score) => ({ type: 'wellbeing', at: new Date(at).toISOString(), payload: { score } })
const NOW = new Date(2026, 9, 19, 22, 0)
const at = (daysAgo, h = 9, m = 0) => new Date(2026, 9, 19 - daysAgo, h, m)

/** Générateur déterministe dans [-1, 1]. */
function noise(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return (s / 2147483648) * 2 - 1
  }
}

describe('faceMoodEstimate — dès la première lecture (consigne du 19/10 au soir)', () => {
  it('gives an estimate from a single unlock reading, without any note', () => {
    const est = faceMoodEstimate([burst(at(0, 8), { smile: 0.7, duchenne: 0.5 })], { now: NOW })
    expect(est).not.toBeNull()
    expect(est.model).toBe('prior')
    expect(est.day.readings).toBe(1)
    expect(est.moment.label).toBe('plutôt bonne')
    expect(est.day.note).toBeGreaterThan(3)
    expect(est.confidence).toBe('faible')
    expect(est.day.low).toBeLessThan(est.day.note)
    expect(est.day.high).toBeGreaterThan(est.day.note)
  })

  it('reads a frown as lower than a smile (general prior)', () => {
    const frown = faceMoodEstimate([burst(at(0, 8), { mouthFrown: 0.5, browDown: 0.5, smile: 0 })], { now: NOW })
    expect(frown.day.note).toBeLessThan(2)
    expect(frown.day.label).toBe('plutôt basse')
  })

  it('returns null without an unlock reading with a face (test readings are diagnostics)', () => {
    expect(faceMoodEstimate([], { now: NOW })).toBeNull()
    expect(faceMoodEstimate([burst(at(0, 8), {}, { trigger: 'manual' })], { now: NOW })).toBeNull()
    expect(faceMoodEstimate([{ ...burst(at(0, 8)), payload: { v: 1, trigger: 'unlock', frames: 3, valid: 0, rejected: {} } }], { now: NOW })).toBeNull()
  })

  it('still shows the last reading when there is none today', () => {
    const est = faceMoodEstimate([burst(at(2, 8))], { now: NOW })
    expect(est.day).toBeNull()
    expect(est.moment.today).toBe(false)
    expect(describeFaceMood(est).join(' ')).toMatch(/aucune lecture aujourd’hui/)
  })

  it('narrows the range as readings accumulate', () => {
    const one = faceMoodEstimate([burst(at(0, 8), { smile: 0.3 })], { now: NOW })
    const r = noise(3)
    const many = faceMoodEstimate(Array.from({ length: 12 }, (_, i) => burst(at(0, 8, i * 4), { smile: 0.3 + 0.02 * r() })), { now: NOW })
    expect(many.day.high - many.day.low).toBeLessThan(one.day.high - one.day.low)
  })

  it('widens the range for poor framing and few valid frames', () => {
    const good = faceMoodEstimate([burst(at(0, 8))], { now: NOW })
    const poor = faceMoodEstimate([burst(at(0, 8), { yaw: 25 }, { valid: 1, frames: 3 })], { now: NOW })
    expect(poor.day.high - poor.day.low).toBeGreaterThan(good.day.high - good.day.low)
  })

  it('learns the personal resting face over days, without notes', () => {
    // Quelqu'un qui « fronce » toujours un peu (concentration) : pas plus triste pour autant.
    const habitual = { browDown: 0.45 }
    const bursts = []
    for (let d = 27; d >= 1; d--) for (let h = 8; h < 20; h += 3) bursts.push(burst(at(d, h), habitual))
    const first = faceMoodEstimate([burst(at(0, 8), habitual)], { now: NOW })
    const later = faceMoodEstimate([...bursts, burst(at(0, 8), habitual)], { now: NOW })
    expect(later.baselineDays).toBeGreaterThanOrEqual(27)
    expect(later.day.note).toBeGreaterThan(first.day.note)
    expect(Math.abs(later.day.note - 2.5)).toBeLessThan(0.3)
    expect(later.day.high - later.day.low).toBeLessThan(first.day.high - first.day.low)
  })

  it('switches to a personal model once notes predict better, with a narrower range', () => {
    // Chez cette personne, c'est browInnerUp qui suit la note (sens appris, pas supposé).
    const r = noise(11)
    const entries = []
    // 50 jours : la vérification visage ↔ notes doit être réussie (≥ 30 jours, deux regards hebdomadaires).
    for (let d = 50; d >= 1; d--) {
      const mood = 2.5 + 1.5 * r()
      const v = 0.1 + 0.08 * (mood - 2.5) + 0.01 * r()
      for (const h of [8, 12, 18]) entries.push(burst(at(d, h), { browInnerUp: v }))
      entries.push(note(at(d, 21), mood))
    }
    entries.push(burst(at(0, 8), { browInnerUp: 0.1 + 0.08 * 1.5 }))
    const est = faceMoodEstimate(entries, { now: NOW })
    expect(est.model).toBe('personal')
    expect(est.calibrationDays).toBe(50)
    expect(est.day.note).toBeGreaterThan(3.3)
    expect(['moyenne', 'bonne']).toContain(est.confidence)
    expect(describeFaceMood(est).join(' ')).toMatch(/Modèle personnel/)
  })

  it('does not adopt a personal model from slow drifts alone (I121 : blocs ±7 jours)', () => {
    // Humeur qui dure (AR 0,8) et visage qui dérive (AR 0,95 : lumière de saison, lunettes…), sans aucun lien.
    let adopted = 0
    for (let s = 1; s <= 60; s++) {
      const r = noise(s * 31 + 7)
      const gauss = () => (r() + r() + r()) / 1.0
      const ar = (prev, phi) => phi * prev + Math.sqrt(1 - phi * phi) * gauss()
      let mood = gauss()
      const drift = Object.fromEntries(EXPRESSION_KEYS.map((k) => [k, gauss()]))
      const entries = []
      for (let d = 90; d >= 1; d--) {
        mood = ar(mood, 0.8)
        for (const k of EXPRESSION_KEYS) drift[k] = ar(drift[k], 0.95)
        const values = Object.fromEntries(EXPRESSION_KEYS.map((k) => [k, NEUTRAL[k] + 0.05 * drift[k]]))
        for (const h of [8, 12, 18]) entries.push(burst(at(d, h), values))
        entries.push(note(at(d, 21), Math.min(5, Math.max(0, Math.round(2.5 + 0.9 * mood)))))
      }
      if (faceMoodEstimate(entries, { now: NOW }).model === 'personal') adopted++
    }
    expect(adopted / 60).toBeLessThanOrEqual(0.05)
  })

  it('keeps the general model while notes do not help (no lock, no hidden value)', () => {
    const r = noise(5)
    const entries = []
    for (let d = 20; d >= 1; d--) {
      entries.push(burst(at(d, 9), { smile: 0.1 + 0.05 * r() }))
      entries.push(note(at(d, 21), 2.5 + 2 * r()))
    }
    entries.push(burst(at(0, 9)))
    const est = faceMoodEstimate(entries, { now: NOW })
    expect(est.model).toBe('prior')
    expect(est.day).not.toBeNull()
  })
})

describe('faceMood — garde-fous', () => {
  it('uses only direct emotional signals (D5): face indices declared as estimator inputs', () => {
    for (const k of EXPRESSION_KEYS) expect(isEstimatorInput(`face_${k}`)).toBe(true)
    expect(isEstimatorInput('wellbeing')).toBe(true)
  })

  it('ignores behaviour entries entirely', () => {
    const base = [burst(at(0, 8), { smile: 0.4 })]
    const withX = [...base, { type: 'phone_usage', at: at(0, 8).toISOString(), payload: { date: '2026-10-19', unlocks: 80, screenMinutes: 400 } }, { type: 'sleep', at: at(0, 7).toISOString(), payload: { minutes: 300 } }]
    expect(faceMoodEstimate(withX, { now: NOW })).toEqual(faceMoodEstimate(base, { now: NOW }))
  })

  it('always words it as an estimate, never a diagnosis', () => {
    const lines = describeFaceMood(faceMoodEstimate([burst(at(0, 8))], { now: NOW }))
    expect(lines.join(' ')).toMatch(/estimation, pas un diagnostic/)
    expect(lines.join(' ')).toMatch(/Confiance faible/)
    expect(lines.join(' ')).toMatch(/entre .* et /)
  })

  it('prior is neutral on the population resting face', () => {
    expect(priorValence(FACE_PRIOR.neutral)).toBeCloseTo(0, 6)
  })

  it('personal neutral only uses the 28 days before the reading', () => {
    const old = burst(at(40, 9), { smile: 0.9 })
    const { days } = personalNeutral([old], at(0, 9).toISOString())
    expect(days).toBe(0)
  })

  it('estimates a recent « Tester maintenant » reading for the diagnostic only', () => {
    const t = burst(new Date(NOW - 30000), { smile: 0.6 }, { trigger: 'manual' })
    expect(testReadingEstimate([t], { now: NOW }).label).toBe('plutôt bonne')
    expect(testReadingEstimate([burst(new Date(NOW - 10 * 60000), {}, { trigger: 'manual' })], { now: NOW })).toBeNull()
  })
})
