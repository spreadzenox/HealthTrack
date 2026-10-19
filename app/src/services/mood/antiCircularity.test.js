/**
 * Règle anti-circularité (directive D5 du propriétaire) : une variable qui sert à estimer l'humeur (Y)
 * ne doit jamais être présentée comme un facteur (X) corrélé à l'humeur. Ce test échoue si une entrée
 * déclarée de l'estimateur apparaît parmi les facteurs des Analyses, des liens décalés ou des tags.
 */
import { describe, it, expect } from 'vitest'
import { ESTIMATOR_INPUTS, isEstimatorInput, ESTIMATOR_TAGS } from './estimatorInputs'
import { VARIABLE_META, PHONE_APPS_KEYS, buildDailyDataset, computeBasicCorrelations } from '../analysisEngine'
import { BEHAVIOR_TAGS, computeTagEffects } from '../behaviorTags'
import { FACE_BURST_TYPE, MOOD_TRIGGERS, moodFaceBursts } from '../faceBursts'

describe('séparation Y (humeur) / X (comportements et contexte)', () => {
  it('déclare les seules entrées permises : visage, voix, auto-déclaration', () => {
    expect(ESTIMATOR_INPUTS.map((i) => i.key).sort()).toEqual(['face', 'selfReport', 'voice'])
  })

  it("aucun facteur des Analyses n'est une entrée de l'estimateur", () => {
    const circular = Object.keys(VARIABLE_META).filter(isEstimatorInput)
    expect(circular).toEqual([])
  })

  it('reconnaît les colonnes et tags déclarés, y compris les futurs signaux visage / voix', () => {
    expect(isEstimatorInput('wellbeing')).toBe(true)
    expect(isEstimatorInput('stress')).toBe(true)
    expect(isEstimatorInput('face_smile')).toBe(true)
    expect(isEstimatorInput('voice_pitch_sd')).toBe(true)
    // Choix documenté : l'usage des réseaux sociaux est un X, pas une entrée de l'estimateur.
    expect(isEstimatorInput('social_media_minutes')).toBe(false)
    expect(isEstimatorInput('screen_late_minutes')).toBe(false)
    expect(isEstimatorInput('sleepMinutes')).toBe(false)
  })

  it("le temps par app (réseaux sociaux, vidéo…) est un facteur X, jamais une entrée de l'estimateur (I116)", () => {
    const keys = Object.keys(PHONE_APPS_KEYS)
    expect(keys).toContain('social_minutes')
    for (const k of keys) {
      expect(VARIABLE_META[k]).toBeDefined()
      expect(isEstimatorInput(k)).toBe(false)
    }
    expect(isEstimatorInput('phone_apps')).toBe(false)
    const entries = []
    for (let i = 0; i < 20; i++) {
      entries.push({ type: 'wellbeing', at: new Date(2026, 8, 1 + i, 21).toISOString(), payload: { score: 2 + (i % 3) } })
      entries.push({ type: 'phone_apps', source: 'phone', at: new Date(2026, 8, 1 + i, 12).toISOString(), payload: { minutes: { social: 30 + 20 * (i % 3) } } })
    }
    const factors = (computeBasicCorrelations(entries)?.correlations || []).map((c) => c.variable)
    expect(factors).toContain('social_minutes')
    expect(factors.filter(isEstimatorInput)).toEqual([])
  })

  it("les tags qui sont des entrées de l'estimateur sont côté Y, les autres côté X", () => {
    for (const tag of BEHAVIOR_TAGS) {
      expect(tag.side === 'Y').toBe(ESTIMATOR_TAGS.includes(tag.id))
    }
  })

  it("le stress ressenti n'est jamais comparé au bien-être comme un facteur", () => {
    const entries = []
    for (let i = 0; i < 20; i++) {
      const d = new Date(2026, 8, 1 + i, 21, 0)
      const stressed = i % 2 === 0
      entries.push({ type: 'wellbeing', at: d.toISOString(), payload: { score: stressed ? 2 : 4, tags: stressed ? ['stress'] : ['alcohol'] } })
    }
    const res = computeTagEffects(entries)
    const ids = [...(res.effects || []), ...(res.pending || [])].map((e) => e.tagId)
    expect(ids).toContain('alcohol')
    expect(ids.filter(isEstimatorInput)).toEqual([])
  })

  it("les rafales du visage (Y) ne deviennent jamais une colonne ni un facteur des Analyses", () => {
    const entries = []
    for (let i = 0; i < 20; i++) {
      const d = new Date(2026, 8, 1 + i, 21, 0)
      const smile = i % 2 === 0 ? 0.6 : 0.1
      entries.push({ type: 'wellbeing', at: d.toISOString(), payload: { score: smile > 0.3 ? 4 : 2 } })
      entries.push({ type: 'steps', at: new Date(2026, 8, 1 + i, 12).toISOString(), payload: { value: 4000 + 500 * (i % 3) } })
      entries.push({ type: FACE_BURST_TYPE, source: 'face_sense', at: new Date(2026, 8, 1 + i, 8).toISOString(), payload: { trigger: 'unlock', frames: 3, valid: 3, values: { smile } } })
    }
    const columns = new Set(buildDailyDataset(entries).flatMap((row) => Object.keys(row)))
    expect([...columns].filter((c) => c.startsWith('face'))).toEqual([])
    const factors = (computeBasicCorrelations(entries)?.correlations || []).map((c) => c.variable)
    expect(factors).toContain('steps')
    expect(factors.filter(isEstimatorInput)).toEqual([])
  })

  it("composition (I114) : seules les rafales du déverrouillage comptent pour l'humeur, quel que soit l'usage du téléphone", () => {
    // Des rafales prises pendant l'usage d'une app (ou un test) suivraient l'usage (un X) : jamais en Y.
    expect(MOOD_TRIGGERS).toEqual(['unlock'])
    const burst = (trigger) => ({ type: FACE_BURST_TYPE, at: '2026-09-01T08:00:00.000Z', payload: { trigger, valid: 3, values: { smile: 0.5 } } })
    const kept = moodFaceBursts(['unlock', 'manual', 'inUse', 'appOpen', 'social'].map(burst))
    expect(kept.map((e) => e.payload.trigger)).toEqual(['unlock'])
  })
})
