/**
 * I119 — la phrase du soir est lue par deux lexiques disjoints : le ressenti (Y : proposition de note,
 * tag « Stress » déclaré) et le contexte (X : tags de comportement). Un mot ne peut pas servir aux deux,
 * sinon un même texte ferait à la fois l'humeur et son « facteur » (D5).
 */
import { describe, it, expect } from 'vitest'
import { FEELING_WORDS, CONTEXT_WORDS, FUNCTION_WORDS, normalizeWords, readPhrase } from './lexicon'
import { BEHAVIOR_TAGS } from '../behaviorTags'
import { ESTIMATOR_TAGS, isEstimatorInput } from './estimatorInputs'

const contentWords = (lexicon) =>
  new Set(lexicon.flatMap((item) => item.forms.flatMap((f) => normalizeWords(f))).filter((w) => !FUNCTION_WORDS.includes(w)))

describe('lexiques ressenti (Y) / contexte (X)', () => {
  it('ne partagent aucun mot', () => {
    const feeling = contentWords(FEELING_WORDS)
    const shared = [...contentWords(CONTEXT_WORDS)].filter((w) => feeling.has(w))
    expect(shared).toEqual([])
  })

  it('le contexte ne propose que des tags X existants, jamais une entrée de l’estimateur', () => {
    const ids = BEHAVIOR_TAGS.map((t) => t.id)
    for (const item of CONTEXT_WORDS) {
      expect(ids).toContain(item.tag)
      expect(isEstimatorInput(item.tag)).toBe(false)
      expect(item.valence).toBeUndefined()
    }
  })

  it('le ressenti ne propose que la note et des tags Y', () => {
    for (const item of FEELING_WORDS) {
      expect(Number.isInteger(item.valence) && Math.abs(item.valence) <= 2).toBe(true)
      if (item.tag) expect(ESTIMATOR_TAGS).toContain(item.tag)
    }
  })

  it('les formes sont déjà normalisées (minuscules, sans accents)', () => {
    for (const item of [...FEELING_WORDS, ...CONTEXT_WORDS]) {
      for (const f of item.forms) expect(normalizeWords(f).join(' ')).toBe(f)
    }
  })
})

describe('readPhrase', () => {
  it('rien à proposer sans phrase ou sans mot connu', () => {
    expect(readPhrase('')).toEqual({ score: null, tags: [], words: [] })
    expect(readPhrase('Réunion puis courses').score).toBeNull()
  })

  it('propose une note haute pour un ressenti positif, basse pour un ressenti négatif', () => {
    expect(readPhrase('Journée crevante mais contente').score).toBe(3)
    expect(readPhrase('Très heureuse aujourd’hui !').score).toBe(5)
    expect(readPhrase('Je suis épuisé et triste').score).toBeLessThanOrEqual(1)
  })

  it('tient compte de la négation', () => {
    expect(readPhrase('pas en forme du tout').score).toBeLessThan(3)
    expect(readPhrase('je ne suis pas stressé').tags).not.toContain('stress')
  })

  it('le stress ressenti est proposé comme tag déclaré (côté Y)', () => {
    const r = readPhrase('Grosse journée, stressée par le boulot')
    expect(r.tags).toContain('stress')
  })

  it('le contexte propose les tags X, sauf s’il est nié', () => {
    expect(readPhrase('Apéro avec les collègues puis dîner tard').tags).toEqual(['alcohol', 'late_meal'])
    expect(readPhrase('Pas d’alcool ce soir').tags).toEqual([])
    expect(readPhrase('Un peu malade, rhume').tags).toEqual(['sick'])
  })

  it('ne prend pas un mot dans un autre (« vin » dans « vingt »)', () => {
    expect(readPhrase('vingt minutes de marche').tags).toEqual([])
  })

  it('dit quels mots ont été lus', () => {
    expect(readPhrase('Contente, apéro').words).toEqual(['contente', 'apero'])
  })
})
