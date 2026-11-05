import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./imagePrep.js', () => ({ prepareImageForGemini: () => Promise.resolve({ base64: 'AAAA', mimeType: 'image/jpeg' }) }))

import { RELAY_URL } from './aiRelay'
import { analyzeStoolPhoto, normalizeStoolEstimate, STOOL_PHOTO_PROMPT } from './stoolPhoto'

const okResponse = (body, status = 200) => ({ ok: status < 400, status, json: () => Promise.resolve(body) })
const future = () => new Date(Date.now() + 3600_000).toISOString()

describe('forme des selles estimée par photo (SELLES-PHOTO-2)', () => {
  beforeEach(() => localStorage.clear())

  it('normalise la réponse : type 1 à 7 et sa forme, sinon illisible', () => {
    expect(normalizeStoolEstimate({ visible: true, bristol: 6, confidence: 'medium' }))
      .toEqual({ readable: true, bristol: 6, form: 'loose', confidence: 'medium' })
    expect(normalizeStoolEstimate({ visible: true, bristol: 2 })).toMatchObject({ readable: true, form: 'hard', confidence: 'low' })
    for (const bad of [null, { visible: false }, { visible: true, bristol: 9 }, { visible: true, bristol: 3.5 }, { visible: 'true', bristol: 4 }]) {
      expect(normalizeStoolEstimate(bad)).toEqual({ readable: false, bristol: null, form: null, confidence: 'low' })
    }
  })

  it('play : la photo préparée part sur la route des selles du relais, sans autre donnée', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({
      parsed: { visible: true, bristol: 4, confidence: 'high' },
      model: 'flash-lite',
      quota: { remaining: 9, resetAt: future() },
      credits: { plan: 'premium', remaining: 19, resetAt: future() },
    }))
    const r = await analyzeStoolPhoto(new Blob(['x']), { aiRelay: true }, { fetchImpl, integrity: async () => null, testDevice: async () => false })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(`${RELAY_URL}/v1/stool/analyze`)
    expect(JSON.parse(init.body)).toEqual({ image: { mimeType: 'image/jpeg', data: 'AAAA' } })
    expect(r).toEqual({ readable: true, bristol: 4, form: 'normal', confidence: 'high' })
  })

  it('play : « photo difficile à lire » du relais → illisible, sans erreur', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ parsed: { visible: false, bristol: null, confidence: 'low' }, unreadable: true }))
    const r = await analyzeStoolPhoto(new Blob(['x']), { aiRelay: true }, { fetchImpl, integrity: async () => null, testDevice: async () => false })
    expect(r.readable).toBe(false)
  })

  it('play : un refus du relais (quota) remonte son message', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({ error: 'quota', scope: 'install', message: 'Plus d’analyse aujourd’hui.', resetAt: future() }, 429))
    await expect(analyzeStoolPhoto(new Blob(['x']), { aiRelay: true }, { fetchImpl, integrity: async () => null, testDevice: async () => false }))
      .rejects.toThrow('Plus d’analyse aujourd’hui.')
  })

  it('sideload : même consigne envoyée à Gemini avec la clé de la personne', async () => {
    localStorage.setItem('healthtrack_gemini_api_key', 'cle-test')
    const fetchImpl = vi.fn().mockResolvedValue(okResponse({
      candidates: [{ content: { parts: [{ text: '{"visible":true,"bristol":1,"confidence":"low"}' }] } }],
    }))
    const r = await analyzeStoolPhoto(new Blob(['x']), { aiRelay: false }, { fetchImpl, apiKey: 'cle-test' })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toContain('generativelanguage.googleapis.com')
    const body = JSON.parse(init.body)
    expect(body.contents[0].parts[0].text).toBe(STOOL_PHOTO_PROMPT)
    expect(body.contents[0].parts[1]).toEqual({ inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } })
    expect(r).toEqual({ readable: true, bristol: 1, form: 'hard', confidence: 'low' })
  })

  it('la consigne ne parle que de la forme : ni couleur, ni sang, ni santé à commenter', () => {
    expect(STOOL_PHOTO_PROMPT).toMatch(/Bristol/)
    expect(STOOL_PHOTO_PROMPT).toMatch(/Ne commente jamais la couleur/)
  })
})
