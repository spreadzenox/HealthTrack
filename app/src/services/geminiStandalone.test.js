import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./imagePrep', () => ({
  prepareImageForGemini: vi.fn(async () => ({ base64: 'QUJD', mimeType: 'image/jpeg' })),
}))

import { analyzeWithGemini, analyzeMealText, extractResponseText, MEAL_TEXT_MAX_LENGTH } from './geminiStandalone'
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

describe('analyzeWithGemini — réponse structurée', () => {
  const photo = () => new File(['x'], 'p.jpg', { type: 'image/jpeg' })
  beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = vi.fn()
  })

  it('impose un schéma JSON (ingrédients, grammes, confiance, nom du plat)', async () => {
    fetch.mockResolvedValue(okResponse('{"not_food": false, "ingredients": []}'))
    await analyzeWithGemini(photo(), 'KEY')
    const schema = JSON.parse(fetch.mock.calls[0][1].body).generationConfig.responseSchema
    expect(schema.type).toBe('OBJECT')
    expect(schema.required).toContain('not_food')
    const item = schema.properties.ingredients.items
    expect(Object.keys(item.properties)).toEqual(expect.arrayContaining(['ingredient', 'quantity_g', 'confidence']))
    expect(item.properties.confidence.enum).toEqual(['high', 'medium', 'low'])
    expect(schema.properties.dish.type).toBe('STRING')
  })

  it('réessaie sans schéma si le modèle refuse le schéma (400)', async () => {
    fetch
      .mockResolvedValueOnce(errResponse(400, 'Invalid JSON payload: unknown field response_schema'))
      .mockResolvedValueOnce(okResponse('{"not_food": false, "ingredients": [{"ingredient": "Abondance", "quantity_g": 30}]}'))
    const res = await analyzeWithGemini(photo(), 'KEY')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[0][0]).toBe(fetch.mock.calls[1][0])
    expect(JSON.parse(fetch.mock.calls[1][1].body).generationConfig.responseSchema).toBeUndefined()
    expect(res.items).toHaveLength(1)
  })

  it('rapproche les noms de la base, garde les inconnus signalés, la confiance et le plat', async () => {
    fetch.mockResolvedValue(okResponse(JSON.stringify({
      not_food: false,
      dish: 'Plateau de fromages',
      ingredients: [
        { ingredient: 'abondance', quantity_g: 40.4, confidence: 'low' },
        { ingredient: 'Fromage lunaire', quantity_g: 20, confidence: 'medium' },
        { ingredient: '', quantity_g: 10 },
      ],
    })))
    const res = await analyzeWithGemini(photo(), 'KEY')
    expect(res.dish).toBe('Plateau de fromages')
    expect(res.items).toEqual([
      { ingredient: 'Abondance', quantity: '40 g', quantity_g: 40, confidence: 'low' },
      { ingredient: 'Fromage lunaire', quantity: '20 g', quantity_g: 20, confidence: 'medium', unknown: true },
    ])
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

describe('analyzeMealText — repas décrit en quelques mots', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.fetch = vi.fn()
  })

  it("n'envoie que la description (aucune image) avec le schéma JSON", async () => {
    fetch.mockResolvedValue(okResponse('{"not_food": false, "ingredients": []}'))
    await analyzeMealText('  2 œufs au plat et une tartine beurrée  ', 'KEY')
    const body = JSON.parse(fetch.mock.calls[0][1].body)
    const parts = body.contents[0].parts
    expect(parts.some((p) => p.inlineData)).toBe(false)
    const text = parts.map((p) => p.text).join('\n')
    expect(text).toContain('2 œufs au plat et une tartine beurrée')
    expect(body.generationConfig.responseSchema.properties.ingredients).toBeDefined()
  })

  it('rappelle les unités ménagères françaises et les matières grasses de cuisson', async () => {
    fetch.mockResolvedValue(okResponse('{"not_food": false, "ingredients": []}'))
    await analyzeMealText('une omelette', 'KEY')
    const prompt = JSON.parse(fetch.mock.calls[0][1].body).contents[0].parts[0].text
    expect(prompt).toMatch(/cuillère à soupe/i)
    expect(prompt).toMatch(/tranche de pain/i)
    expect(prompt).toMatch(/matière grasse|huile|beurre/i)
  })

  it('rapproche les noms de la base et garde le nom du plat', async () => {
    fetch.mockResolvedValue(okResponse(JSON.stringify({
      not_food: false,
      dish: 'Omelette',
      ingredients: [{ ingredient: 'abondance', quantity_g: 30, confidence: 'medium' }],
    })))
    const res = await analyzeMealText('omelette au fromage', 'KEY')
    expect(res.dish).toBe('Omelette')
    expect(res.provider).toBe('gemini')
    expect(res.items).toEqual([{ ingredient: 'Abondance', quantity: '30 g', quantity_g: 30, confidence: 'medium' }])
  })

  it('remonte la raison si le texte ne décrit pas un repas', async () => {
    fetch.mockResolvedValue(okResponse('{"not_food": true, "reason": "Ce texte ne décrit pas un repas."}'))
    await expect(analyzeMealText('bonjour', 'KEY')).rejects.toThrow('Ce texte ne décrit pas un repas.')
  })

  it('refuse une description vide sans appeler Gemini', async () => {
    await expect(analyzeMealText('   ', 'KEY')).rejects.toThrow(/Décrivez/)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('tronque une description trop longue', async () => {
    fetch.mockResolvedValue(okResponse('{"not_food": false, "ingredients": []}'))
    await analyzeMealText('pâtes '.repeat(400), 'KEY')
    const prompt = JSON.parse(fetch.mock.calls[0][1].body).contents[0].parts[0].text
    const described = prompt.split('DESCRIPTION DU REPAS')[1]
    expect(described.length).toBeLessThan(MEAL_TEXT_MAX_LENGTH + 200)
  })
})
