/**
 * Règle anti-circularité (directive D5 du propriétaire) : une variable qui sert à estimer l'humeur (Y)
 * ne doit jamais être présentée comme un facteur (X) corrélé à l'humeur. Ce test échoue si une entrée
 * déclarée de l'estimateur apparaît parmi les facteurs des Analyses, des liens décalés ou des tags.
 */
import { describe, it, expect } from 'vitest'
import { ESTIMATOR_INPUTS, isEstimatorInput, ESTIMATOR_TAGS } from './estimatorInputs'
import { VARIABLE_META } from '../analysisEngine'
import { BEHAVIOR_TAGS, computeTagEffects } from '../behaviorTags'

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
})
