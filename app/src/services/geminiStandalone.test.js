import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./imagePrep', () => ({
  prepareImageForGemini: vi.fn(async () => ({ base64: 'QUJD', mimeType: 'image/jpeg' })),
}))

import { analyzeWithGemini, extractResponseText } from './geminiStandalone'
import { prepareImageForGemini } from './imagePrep'
import { setGeminiModel } from '../settings/geminiModel'

function okResponse(text) {
  return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) }
}
function errResponse(status, message) {
  return { ok: false, status, text: async () => JSON.stringify({ error: { message } }) }
}

describe('analyzeWithGemini', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = vi.fn()
  })
  afterEach(() => vi.restoreAllMocks())

  it("n'envoie que l'image préparée (sans métadonnées) et le prompt", async () => {
    fetch.mockResolvedValue(okResponse('{"not_food": false, "ingredients": []}'))
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })
    await analyzeWithGemini(file, 'KEY')
    expect(prepareImageForGemini).toHaveBeenCalledWith(file)
    const [url, init] = fetch.mock.calls[0]
    expect(url).toContain('gemini-3.8-flash:generateContent')
    const body = JSON.parse(init.body)
    expect(body.contents[0].parts[1].inlineData).toEqual({ mimeType: 'image/jpeg', data: 'QUJD' })
    expect(body.generationConfig.responseMimeType).toBe('application/json')
  })

  it('utilise le modèle choisi dans les Paramètres', async () => {
    setGeminiModel('gemini-2.5-flash')
    fetch.mockResolvedValue(okResponse('{"not_food": false, "ingredients": []}'))
    await analyzeWithGemini(new File(['x'], 'p.jpg', { type: 'image/jpeg' }), 'KEY')
    expect(fetch.mock.calls[0][0]).toContain('gemini-2.5-flash:generateContent')
  })

  it('bascule sur un autre modèle si le modèle choisi est introuvable (404)', async () => {
    fetch
      .mockResolvedValueOnce(errResponse(404, 'models/gemini-3.8-flash is not found'))
      .mockResolvedValueOnce(okResponse('{"not_food": false, "ingredients": [{"ingredient": "Riz blanc cuit", "quantity_g": 150}]}'))
    const res = await analyzeWithGemini(new File(['x'], 'p.jpg', { type: 'image/jpeg' }), 'KEY')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[1][0]).not.toContain('gemini-3.8-flash')
    expect(res.provider).toBe('gemini')
    expect(res.model).toBe(fetch.mock.calls[1][0].match(/models\/([^:]+):/)[1])
  })

  it('essaie les autres modèles si le quota du modèle choisi est épuisé, puis remonte la 1re erreur', async () => {
    fetch.mockResolvedValue(errResponse(429, 'Quota exceeded for gemini-3.8-flash'))
    await expect(analyzeWithGemini(new File(['x'], 'p.jpg', { type: 'image/jpeg' }), 'KEY')).rejects.toThrow('Quota exceeded for gemini-3.8-flash')
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('ne réessaie pas si la clé est invalide', async () => {
    fetch.mockResolvedValue(errResponse(400, 'API key not valid'))
    await expect(analyzeWithGemini(new File(['x'], 'p.jpg', { type: 'image/jpeg' }), 'KEY')).rejects.toThrow('API key not valid')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('extractResponseText', () => {
  it('ignore les parties « pensée » et concatène le texte', () => {
    const data = { candidates: [{ content: { parts: [{ thought: true, text: 'je réfléchis' }, { text: '{"a":' }, { text: '1}' }] } }] }
    expect(extractResponseText(data)).toBe('{"a":1}')
  })
  it('renvoie une chaîne vide si rien', () => {
    expect(extractResponseText({})).toBe('')
  })
})
