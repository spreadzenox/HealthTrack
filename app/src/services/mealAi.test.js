import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./aiRelay', () => ({
  analyzePhotoViaRelay: vi.fn().mockResolvedValue({ provider: 'relay' }),
  analyzeTextViaRelay: vi.fn().mockResolvedValue({ provider: 'relay' }),
}))
vi.mock('./geminiStandalone', () => ({
  analyzeWithGemini: vi.fn().mockResolvedValue({ provider: 'gemini' }),
  analyzeMealText: vi.fn().mockResolvedValue({ provider: 'gemini' }),
}))

import { featuresFor } from '../config/distribution'
import { setGeminiApiKey } from '../settings/geminiApiKey'
import { analyzeWithGemini } from './geminiStandalone'
import {
  aiPrivacyHint, analyzeMealDescription, analyzeMealPhoto, canAnalyzeMeals, needsAiConsent, rememberAiConsent,
} from './mealAi'

const play = featuresFor('play')
const sideload = featuresFor('sideload')

describe('analyse IA des repas selon la variante', () => {
  beforeEach(() => localStorage.clear())

  it('play : toujours possible, sans clé, par le relais', async () => {
    expect(canAnalyzeMeals(play)).toBe(true)
    expect(await analyzeMealPhoto(new Blob(), play)).toEqual({ provider: 'relay' })
    expect(await analyzeMealDescription('pomme', play)).toEqual({ provider: 'relay' })
  })

  it('sideload : il faut la clé Gemini, qui est alors utilisée', async () => {
    expect(canAnalyzeMeals(sideload)).toBe(false)
    setGeminiApiKey('AIzaTEST')
    expect(canAnalyzeMeals(sideload)).toBe(true)
    await analyzeMealPhoto(new Blob(), sideload)
    expect(analyzeWithGemini).toHaveBeenCalledWith(expect.anything(), 'AIzaTEST')
  })

  it('play : accord demandé une fois avant le premier envoi ; jamais en sideload (la clé vaut accord)', () => {
    expect(needsAiConsent(sideload)).toBe(false)
    expect(needsAiConsent(play)).toBe(true)
    rememberAiConsent()
    expect(needsAiConsent(play)).toBe(false)
  })

  it('les rappels disent où part la donnée : notre serveur en play, Google avec votre clé en sideload', () => {
    expect(aiPrivacyHint('photo', play)).toMatch(/notre serveur.*Europe/)
    expect(aiPrivacyHint('text', play)).toMatch(/notre serveur/)
    expect(aiPrivacyHint('photo', play)).not.toMatch(/clé/)
    expect(aiPrivacyHint('photo', sideload)).toMatch(/votre clé/)
  })
})
