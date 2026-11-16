import { describe, it, expect, vi } from 'vitest'

// Version iOS (HealthTrack-iOS) : la VFC de l'app Santé (SDNN) est un facteur des Analyses, sous son propre nom, pour
// que « Ce qui a pu peser ce jour-là » de Tendances › Jour la dise comme le faisait la tuile du Journal (correctif 64).
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

import { FACTORS, factorKeysKnown, computeAnalysisResults, dayContributions } from './analysisResults'
import { contributionText } from './trendsDay'
import { isEstimatorInput } from './mood/estimatorInputs'

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const gauss = (r) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r())
const START = Date.UTC(2026, 6, 1)
const dk = (i) => new Date(START + i * 86_400_000).toISOString().slice(0, 10)
const at = (i, hh) => `${dk(i)}T${hh}:00:00`

/** 70 jours : VFC de l'app Santé (SDNN) aléatoire, bien-être qui la suit, aucune RMSSD. */
function world({ days = 70, seed = 7 } = {}) {
  const r = rng(seed)
  const entries = []
  const sdnn = []
  for (let i = 0; i < days; i += 1) {
    const v = Math.max(10, Math.round(45 + 12 * gauss(r)))
    sdnn.push(v)
    entries.push({
      type: 'heart_rate', source: 'health_connect', at: at(i, '04'),
      payload: { value: v, unit: 'ms', subtype: 'heartRateVariabilitySdnn', sourceName: 'Apple Watch' },
    })
    const y = Math.min(5, Math.max(0, 3 + 0.04 * (v - 45) + 0.3 * gauss(r)))
    entries.push({ type: 'wellbeing', at: at(i, '21'), payload: { score: Math.round(y * 10) / 10 } })
  }
  return { entries, sdnn, now: new Date(START + (days - 1) * 86_400_000 + 22 * 3_600_000) }
}

describe('Analyses sur iPhone : la VFC de l’app Santé dans « Ce qui a pu peser »', () => {
  it('est un facteur du corps, connu des Analyses, jamais une entrée de l’estimateur', () => {
    const f = FACTORS.find((x) => x.key === 'hrv_sdnn_ms')
    expect(f).toMatchObject({ label: 'Variabilité cardiaque', theme: 'body', actionable: false, unit: 'ms' })
    expect(factorKeysKnown()).toBe(true)
    expect(isEstimatorInput('hrv_sdnn_ms')).toBe(false)
  })

  it('le jour de la VFC la plus haute, elle est dite avec sa valeur ; la RMSSD absente reste inconnue', () => {
    const { entries, sdnn, now } = world()
    const res = computeAnalysisResults(entries, { now })
    const hi = sdnn.indexOf(Math.max(...sdnn))
    const c = dayContributions(res, entries, dk(hi)).find((x) => x.key === 'hrv_sdnn_ms')
    expect(c).toBeTruthy()
    expect(c.points).toBeGreaterThan(0)
    expect(contributionText(c)).toMatch(/^Variabilité cardiaque plus haute que d’habitude/)
    expect(contributionText(c)).toMatch(/ ms\)$/)
    const short = res.outcomes.wellbeing.horizons.short.factors.map((x) => x.key)
    expect(short).not.toContain('hrv_ms')
  })
})
