import { describe, it, expect } from 'vitest'
import {
  faceMoodEstimate,
  describeFaceMood,
  priorValence,
  personalNeutral,
  testReadingEstimate,
  EXPRESSION_KEYS,
  FACE_PRIOR,
  arousalLabel,
  weightedMedian,
  lightPenalty,
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

describe('faceMood — duo de modèles du visage (I126)', () => {
  const duo = (gap, extra = {}) => ({ valence: 0.3, arousal: 0.1, affectGap: gap, affectModels: 2, ...extra })

  it('narrows the range when both models agree, widens it when they disagree', () => {
    const single = faceMoodEstimate([burst(at(0, 8), { valence: 0.3, arousal: 0.1 })], { now: NOW })
    const agree = faceMoodEstimate([burst(at(0, 8), duo(0.05))], { now: NOW })
    const disagree = faceMoodEstimate([burst(at(0, 8), duo(0.5))], { now: NOW })
    const width = (e) => e.day.high - e.day.low
    expect(agree.day.note).toBe(single.day.note)
    expect(width(agree)).toBeLessThan(width(single))
    expect(width(disagree)).toBeGreaterThan(width(single))
    expect(agree.duo).toEqual({ models: 2, gap: 0.05, agreement: 'accord' })
    expect(disagree.duo.agreement).toBe('désaccord')
    expect(single.duo).toBeNull()
  })

  it('uses the median disagreement of the day', () => {
    const est = faceMoodEstimate([
      burst(at(0, 8), duo(0.1)), burst(at(0, 12), duo(0.2)), burst(at(0, 18), duo(0.6)),
    ], { now: NOW })
    expect(est.duo.gap).toBeCloseTo(0.2, 5)
    expect(est.duo.agreement).toBe('partiel')
  })

  it('says whether the two models agree, in the confidence line', () => {
    const lines = describeFaceMood(faceMoodEstimate([burst(at(0, 8), duo(0.05))], { now: NOW }))
    expect(lines.some((l) => l.startsWith('Confiance') && l.includes('deux modèles d’accord'))).toBe(true)
    expect(lines.some((l) => l.startsWith('Deux modèles valence / éveil embarqués (HSEmotion)'))).toBe(true)
    const off = describeFaceMood(faceMoodEstimate([burst(at(0, 8), duo(0.5))], { now: NOW }))
    expect(off.some((l) => l.includes('deux modèles en désaccord'))).toBe(true)
    expect(off.join(' ')).not.toMatch(/diagnostic/)
  })

  it('disagreement never moves the estimate itself, only its uncertainty', () => {
    const a = faceMoodEstimate([burst(at(0, 8), duo(0.0))], { now: NOW })
    const b = faceMoodEstimate([burst(at(0, 8), duo(0.8))], { now: NOW })
    expect(a.day.note).toBe(b.day.note)
    expect(a.moment.note).toBe(b.moment.note)
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
    expect(lines.join(' ')).not.toMatch(/diagnostic/)
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

describe('faceMood — modèle valence / éveil embarqué (étape 2)', () => {
  it('prefers the model valence over the expression prior, with a narrower range', () => {
    // Même visage neutre aux blendshapes : seule la valence du modèle dit « plutôt bonne ».
    const va = faceMoodEstimate([burst(at(0, 8), { valence: 0.6, arousal: 0.1 })], { now: NOW })
    const prior = faceMoodEstimate([burst(at(0, 8))], { now: NOW })
    expect(va.model).toBe('va')
    expect(prior.model).toBe('prior')
    expect(va.day.note).toBeGreaterThan(3.7)
    expect(va.day.label).toBe('plutôt bonne')
    expect(prior.day.label).toBe('moyenne')
    expect(va.day.high - va.day.low).toBeLessThan(prior.day.high - prior.day.low)
  })

  it('reads arousal for the moment and the day; absent without the model', () => {
    const est = faceMoodEstimate([
      burst(at(0, 8), { valence: 0.1, arousal: -0.5 }),
      burst(at(0, 12), { valence: 0.1, arousal: -0.4 }),
    ], { now: NOW })
    expect(est.day.arousal).toBeCloseTo(-0.45, 2)
    expect(est.day.arousalLabel).toBe('plutôt calme')
    expect(est.moment.arousalLabel).toBe('plutôt calme')
    expect(arousalLabel(0.5)).toBe('plutôt animé')
    expect(arousalLabel(0)).toBe('modéré')
    const none = faceMoodEstimate([burst(at(0, 8))], { now: NOW })
    expect(none.day.arousal).toBeNull()
    expect(none.moment.arousalLabel).toBeNull()
  })

  it('half-adjusts to the personal usual valence, without notes', () => {
    // 20 jours à 0,4 : le « visage habituel » ramène une lecture à 0,4 vers le milieu, mais à moitié seulement.
    const past = Array.from({ length: 20 }, (_, d) => burst(at(d + 1, 9), { valence: 0.4 }))
    const alone = faceMoodEstimate([burst(at(0, 8), { valence: 0.4 })], { now: NOW })
    const usual = faceMoodEstimate([...past, burst(at(0, 8), { valence: 0.4 })], { now: NOW })
    expect(usual.day.note).toBeLessThan(alone.day.note)
    expect(usual.day.note).toBeGreaterThan(2.9)
  })

  it('mixes old readings without valence and new ones with it', () => {
    const est = faceMoodEstimate([burst(at(1, 9), { smile: 0.6 }), burst(at(0, 8), { valence: -0.5, arousal: 0 })], { now: NOW })
    expect(est.model).toBe('va')
    expect(est.day.label).toBe('plutôt basse')
  })

  it('describes the model and arousal as an estimate', () => {
    const lines = describeFaceMood(faceMoodEstimate([burst(at(0, 8), { valence: 0.3, arousal: 0.4 })], { now: NOW }))
    expect(lines.some((l) => l.includes('Éveil à la dernière lecture : plutôt animé'))).toBe(true)
    expect(lines.some((l) => l.startsWith('Modèle valence / éveil embarqué (HSEmotion)'))).toBe(true)
    expect(lines.join(' ')).not.toMatch(/diagnostic/)
  })
})

describe('faceMood — lectures pondérées par leur qualité (I127)', () => {
  it('weightedMedian : poids égaux = médiane ordinaire ; un gros poids l’emporte', () => {
    expect(weightedMedian([1, 2, 3, 4], [1, 1, 1, 1])).toBe(2.5)
    expect(weightedMedian([3, 1, 2], [0.2, 0.2, 0.2])).toBe(2)
    expect(weightedMedian([1, 2, 3, 4], [0.1, 0.1, 1, 1])).toBe(3)
    expect(weightedMedian([], [])).toBeNull()
    expect(weightedMedian([1, null, 5], [1, 1, 0])).toBe(1)
  })

  it('les lectures nettes comptent plus que celles de biais ou floues', () => {
    const good = [burst(at(0, 8), { valence: 0.6, arousal: 0 }), burst(at(0, 9), { valence: 0.6, arousal: 0 })]
    const poorFrown = [8.5, 9.5].map((h) => burst(at(0, Math.floor(h), 30), { valence: -0.6, arousal: 0, yaw: 30 }, { valid: 1, frames: 3 }))
    const sameFrown = [8.5, 9.5].map((h) => burst(at(0, Math.floor(h), 30), { valence: -0.6, arousal: 0 }))
    const weighted = faceMoodEstimate([...good, ...poorFrown], { now: NOW })
    const equal = faceMoodEstimate([...good, ...sameFrown], { now: NOW })
    const goodOnly = faceMoodEstimate(good, { now: NOW })
    expect(weighted.day.note).toBeGreaterThan(equal.day.note)
    expect(weighted.day.note).toBeCloseTo(goodOnly.day.note, 1)
    expect(weighted.day.poorReadings).toBe(2)
    expect(equal.day.poorReadings).toBe(0)
    expect(describeFaceMood(weighted).join(' ')).toMatch(/2 lectures peu nettes comptées moins/)
    expect(describeFaceMood(equal).join(' ')).not.toMatch(/peu nette/)
  })

  it('des lectures peu nettes resserrent moins la fourchette que des lectures nettes', () => {
    const r = noise(7)
    const vals = Array.from({ length: 6 }, () => 0.3 + 0.05 * r())
    const sharp = faceMoodEstimate(vals.map((v, i) => burst(at(0, 8, i * 5), { valence: v, arousal: 0 })), { now: NOW })
    const mixed = faceMoodEstimate(vals.map((v, i) => burst(at(0, 8, i * 5), { valence: v, arousal: 0, yaw: i % 2 ? 30 : 4 }, { valid: i % 2 ? 1 : 3, frames: 3 })), { now: NOW })
    expect(mixed.day.high - mixed.day.low).toBeGreaterThan(sharp.day.high - sharp.day.low)
  })
})

describe('faceMood — lumière du visage (I127b)', () => {
  it('lightPenalty : 1 en lumière correcte ou inconnue, plus près des limites du natif', () => {
    expect(lightPenalty(undefined)).toBe(1)
    expect(lightPenalty(0.5)).toBe(1)
    expect(lightPenalty(0.25)).toBe(1)
    expect(lightPenalty(0.8)).toBe(1)
    expect(lightPenalty(0.18)).toBeGreaterThan(1)
    expect(lightPenalty(0.86)).toBeGreaterThan(1)
  })

  it('une lecture dans la pénombre compte moins et élargit la fourchette, sans déplacer sa note', () => {
    const lit = faceMoodEstimate([burst(at(0, 8), { valence: 0.4, arousal: 0, light: 0.5 })], { now: NOW })
    const dim = faceMoodEstimate([burst(at(0, 8), { valence: 0.4, arousal: 0, light: 0.18 })], { now: NOW })
    expect(dim.day.note).toBe(lit.day.note)
    expect(dim.day.high - dim.day.low).toBeGreaterThan(lit.day.high - lit.day.low)
    expect(dim.day.poorReadings).toBe(1)
    expect(lit.day.poorReadings).toBe(0)
  })

  it('les lectures bien éclairées l’emportent sur celles prises dans la pénombre', () => {
    const good = [8, 9].map((h) => burst(at(0, h), { valence: 0.6, arousal: 0, light: 0.5 }))
    const dimFrown = [8, 9].map((h) => burst(at(0, h, 30), { valence: -0.6, arousal: 0, light: 0.17 }))
    const litFrown = [8, 9].map((h) => burst(at(0, h, 30), { valence: -0.6, arousal: 0, light: 0.5 }))
    const weighted = faceMoodEstimate([...good, ...dimFrown], { now: NOW })
    const equal = faceMoodEstimate([...good, ...litFrown], { now: NOW })
    expect(weighted.day.note).toBeGreaterThan(equal.day.note)
  })

  it('la carte dit quand la lumière a souvent manqué, et se tait sinon', () => {
    const dim = faceMoodEstimate([8, 9, 10].map((h) => burst(at(0, h), { valence: 0.2, arousal: 0, light: 0.18 })), { now: NOW })
    const bright = faceMoodEstimate([8, 9, 10].map((h) => burst(at(0, h), { valence: 0.2, arousal: 0, light: 0.87 })), { now: NOW })
    const fine = faceMoodEstimate([8, 9, 10].map((h) => burst(at(0, h), { valence: 0.2, arousal: 0, light: 0.5 })), { now: NOW })
    const old = faceMoodEstimate([8, 9, 10].map((h) => burst(at(0, h), { valence: 0.2, arousal: 0 })), { now: NOW })
    expect(dim.day.lighting).toBe('pénombre')
    expect(bright.day.lighting).toBe('vive')
    expect(fine.day.lighting).toBe('correcte')
    expect(old.day.lighting).toBeNull()
    expect(describeFaceMood(dim).join(' ')).toMatch(/souvent dans la pénombre/)
    expect(describeFaceMood(bright).join(' ')).toMatch(/lumière souvent trop vive/)
    expect(describeFaceMood(fine).join(' ')).not.toMatch(/pénombre|trop vive/)
  })

  it('la lumière n’est jamais une entrée de l’humeur ni un facteur des Analyses', () => {
    expect(EXPRESSION_KEYS).not.toContain('light')
    expect(isEstimatorInput('light')).toBe(false)
  })
})
