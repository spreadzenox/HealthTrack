/**
 * Règle anti-circularité (directive D5 du propriétaire) : une variable qui sert à estimer l'humeur (Y)
 * ne doit jamais être présentée comme un facteur (X) corrélé à l'humeur. Ce test échoue si une entrée
 * déclarée de l'estimateur apparaît parmi les facteurs des Analyses, des liens décalés ou des tags.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { ESTIMATOR_INPUTS, isEstimatorInput, ESTIMATOR_TAGS } from './estimatorInputs'
import { VARIABLE_META, PHONE_APPS_KEYS, buildDailyDataset, computeBasicCorrelations } from '../analysisEngine'
import { BEHAVIOR_TAGS, computeTagEffects } from '../behaviorTags'
import { FACE_BURST_TYPE, MOOD_TRIGGERS, moodFaceBursts } from '../faceBursts'
import { computeFaceMoodCorrelations } from './faceMoodDays'

describe('séparation Y (humeur) / X (comportements et contexte)', () => {
  it('déclare les seules entrées permises : visage, voix, auto-déclaration (bien-être, ventre)', () => {
    expect(ESTIMATOR_INPUTS.map((i) => i.key).sort()).toEqual(['face', 'gutSelfReport', 'selfReport', 'voice'])
    expect(isEstimatorInput('gut')).toBe(true)
    expect(isEstimatorInput('gut_pain_days')).toBe(true)
  })

  it("VENTRE-BE-2 : le ventre (notes, selles) n'est jamais un facteur des liens du bien-être, notes ou visage", () => {
    const entries = []
    for (let i = 0; i < 24; i++) {
      const d = (h) => new Date(2026, 8, 1 + i, h).toISOString()
      const level = ['calm', 'discomfort', 'pain'][i % 3]
      entries.push({ type: 'wellbeing', at: d(21), payload: { score: 4 - (i % 3) } })
      entries.push({ type: 'gut', source: 'app_gut', at: d(20), payload: { level, scope: 'day' } })
      entries.push({ type: 'gut', source: 'app_gut', at: d(13), payload: { level } })
      entries.push({ type: 'stool', at: d(9), payload: { bristol: 3 + (i % 3) } })
      entries.push({ type: 'steps', at: d(12), payload: { value: 4000 + 700 * (i % 4) } })
      for (const h of [8, 9, 10]) {
        entries.push({ type: FACE_BURST_TYPE, source: 'face_sense', at: d(h), payload: { trigger: 'unlock', frames: 3, valid: 3, values: { valence: 0.3 - 0.2 * (i % 3), arousal: 0 } } })
      }
    }
    const gutLike = (name) => /gut|stool|bristol|ventre/i.test(name)
    const columns = new Set(buildDailyDataset(entries).flatMap((row) => Object.keys(row)))
    expect([...columns].filter(gutLike)).toEqual([])
    expect(Object.keys(VARIABLE_META).filter(gutLike)).toEqual([])
    const fromNotes = (computeBasicCorrelations(entries)?.correlations || []).map((c) => c.variable)
    expect(fromNotes).toContain('steps')
    const face = computeFaceMoodCorrelations(entries)
    expect(face.status).toBe('ok')
    const fromFace = [
      ...face.correlations.map((c) => c.variable),
      ...[...(face.tagEffects.effects || []), ...(face.tagEffects.pending || [])].map((e) => e.tagId),
      ...(face.laggedEffects.effects || []).map((e) => e.variable),
    ]
    for (const name of [...fromNotes, ...fromFace]) {
      expect(gutLike(name)).toBe(false)
      expect(isEstimatorInput(name)).toBe(false)
    }
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
    // Le stress calculé par la montre (M4) est une estimation physiologique : un X, jamais le « Stress » déclaré.
    expect(isEstimatorInput('watch_stress')).toBe(false)
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

  it("composition (I114) : seules les rafales du déverrouillage ou de l'ouverture de HealthTrack comptent pour le bien-être", () => {
    // Des rafales prises pendant l'usage d'une autre app (ou un test) suivraient l'usage (un X) : jamais en Y.
    // `app_open` = ouverture de HealthTrack seulement (variante play, sans service caméra) : HealthTrack est exclu
    // des facteurs « temps par app » (PhoneUsagePlugin.ignoredPackages), ce n'est donc pas un X.
    expect(MOOD_TRIGGERS).toEqual(['unlock', 'app_open'])
    const burst = (trigger) => ({ type: FACE_BURST_TYPE, at: '2026-09-01T08:00:00.000Z', payload: { trigger, valid: 3, values: { smile: 0.5 } } })
    const kept = moodFaceBursts(['unlock', 'manual', 'inUse', 'appOpen', 'social', 'app_open'].map(burst))
    expect(kept.map((e) => e.payload.trigger)).toEqual(['unlock', 'app_open'])
    const usage = readFileSync(resolve(import.meta.dirname, '../../../android/app/src/main/java/com/healthtrack/app/PhoneUsagePlugin.java'), 'utf-8')
    expect(usage).toMatch(/ignoredPackages[\s\S]*out\.add\(ctx\.getPackageName\(\)\)/)
  })
})
