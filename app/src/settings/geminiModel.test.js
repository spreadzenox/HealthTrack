import { describe, it, expect, beforeEach } from 'vitest'
import {
  GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
  getGeminiModel,
  setGeminiModel,
  getGeminiModelFallbacks,
} from './geminiModel'

describe('geminiModel', () => {
  beforeEach(() => localStorage.clear())

  it('propose un modèle récent par défaut, présent dans la liste', () => {
    expect(GEMINI_MODELS.map((m) => m.id)).toContain(DEFAULT_GEMINI_MODEL)
    expect(DEFAULT_GEMINI_MODEL).not.toMatch(/^gemini-2\./)
    expect(getGeminiModel()).toBe(DEFAULT_GEMINI_MODEL)
  })

  it('mémorise le modèle choisi', () => {
    setGeminiModel('gemini-2.5-flash')
    expect(getGeminiModel()).toBe('gemini-2.5-flash')
  })

  it('ignore une valeur inconnue (ex. modèle retiré de la liste)', () => {
    localStorage.setItem('healthtrack_gemini_model', 'gemini-0-obsolete')
    expect(getGeminiModel()).toBe(DEFAULT_GEMINI_MODEL)
    setGeminiModel('n-importe-quoi')
    expect(getGeminiModel()).toBe(DEFAULT_GEMINI_MODEL)
  })

  it('ordre de repli : le modèle choisi puis les autres, sans doublon', () => {
    setGeminiModel('gemini-2.5-flash')
    const order = getGeminiModelFallbacks()
    expect(order[0]).toBe('gemini-2.5-flash')
    expect(new Set(order).size).toBe(order.length)
    expect(order).toHaveLength(GEMINI_MODELS.length)
  })
})
