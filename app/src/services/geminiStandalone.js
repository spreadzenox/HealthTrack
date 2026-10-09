/**
 * Appel direct à l'API Gemini depuis le frontend (mode standalone, sans backend).
 */
import { INGREDIENT_NAMES } from '../data/ingredientNames.js'
import { getGeminiModelFallbacks } from '../settings/geminiModel.js'
import { prepareImageForGemini } from './imagePrep.js'
import { normalizeMealItem } from './mealEditing.js'

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    not_food: { type: 'BOOLEAN' },
    reason: { type: 'STRING' },
    dish: { type: 'STRING' },
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          ingredient: { type: 'STRING' },
          quantity_g: { type: 'NUMBER' },
          confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
        },
        required: ['ingredient', 'quantity_g'],
      },
    },
  },
  required: ['not_food'],
}

const geminiUrl = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

function buildPrompt() {
  // Liste exhaustive : un nom par ligne pour limiter la taille du prompt tout en restant lisible
  const namesList = INGREDIENT_NAMES.join('\n')
  return `Tu analyses une photo de plat/repas. Tu ne dois répondre QUE par du JSON valide, rien d'autre (pas de texte, pas de markdown).

LISTE EXHAUSTIVE DES INGRÉDIENTS AUTORISÉS (tu DOIS utiliser exactement un de ces noms, copié à l'identique, pour chaque ingrédient détecté) :
---
${namesList}
---

RÈGLES DE RÉPONSE :
1) Si l'image ne montre PAS de nourriture : réponds uniquement ce JSON (rien d'autre) :
{"not_food": true, "reason": "explication courte en français"}

2) Si l'image montre un plat ou des aliments : liste chaque ingrédient visible avec une estimation du poids en grammes. Choisis le nom le plus pertinent dans la liste ci-dessus pour chaque aliment.
   Réponds UNIQUEMENT ce JSON (aucun texte avant ni après) :
   {"not_food": false, "dish": "nom court du plat en français", "ingredients": [{"ingredient": "Nom exact copié de la liste", "quantity_g": nombre, "confidence": "high" | "medium" | "low"}]}
   - "ingredient" : exactement une chaîne prise dans la liste exhaustive ci-dessus (copie à l'identique).
   - "quantity_g" : nombre (grammes), entier ou décimal. Estime la portion d'après les repères visibles (assiette ≈ 26 cm, couverts, verre, main).
   - "confidence" : "high" si l'aliment et sa quantité sont clairement visibles, "medium" si l'un des deux est estimé, "low" si tu devines (aliment caché, sauce, huile de cuisson).
   - Pense aux éléments peu visibles mais caloriques (huile, beurre, sauce, fromage râpé, boisson) s'ils sont probables, avec "confidence": "low".

Interdiction : ne réponds pas avec du texte libre, des explications ou du markdown. Uniquement le JSON.`
}

/**
 * Texte de la réponse : concatène les parties texte, en ignorant les « pensées » des modèles récents.
 */
export function extractResponseText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || []
  return parts
    .filter((p) => typeof p?.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
}

function postGemini(model, apiKey, body) {
  return fetch(`${geminiUrl(model)}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
}

async function readErrorMessage(res) {
  const errText = await res.text()
  try {
    const errJson = JSON.parse(errText)
    return errJson.error?.message || errJson.message || errText
  } catch {
    return errText
  }
}

/**
 * Analyse une photo avec l'API Gemini (clé fournie par l'utilisateur).
 * @param {File} file - fichier image
 * @param {string} apiKey - clé API Gemini
 * @returns {Promise<{ provider: string, model: string, dish?: string, items: Array<{ ingredient: string, quantity: string, quantity_g?: number, confidence?: string, unknown?: boolean }> }>}
 * @throws si not_food (message = reason) ou erreur API
 */
export async function analyzeWithGemini(file, apiKey) {
  // Seule l'image (réduite, sans métadonnées GPS/appareil) et le prompt partent chez Google
  const { base64, mimeType } = await prepareImageForGemini(file)
  const buildBody = (withSchema) => JSON.stringify({
    contents: [{
      parts: [
        { text: buildPrompt() },
        { inlineData: { mimeType, data: base64 } },
      ],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      ...(withSchema ? { responseSchema: RESPONSE_SCHEMA } : {}),
    },
  })

  let data = null
  let usedModel = null
  let firstError = null
  let withSchema = true
  for (const model of getGeminiModelFallbacks()) {
    let res = await postGemini(model, apiKey, buildBody(withSchema))
    if (!res.ok && res.status === 400 && withSchema) {
      const message = await readErrorMessage(res)
      // Un modèle qui ne connaît pas le schéma de réponse : même requête sans schéma
      if (!/schema/i.test(message)) throw new Error(message)
      withSchema = false
      res = await postGemini(model, apiKey, buildBody(false))
    }
    if (res.ok) {
      data = await res.json()
      usedModel = model
      break
    }
    const message = await readErrorMessage(res)
    // Requête ou clé invalide : changer de modèle n'y changerait rien
    if (res.status === 400 || res.status === 401) throw new Error(message)
    // Modèle introuvable, non ouvert à ce compte, quota épuisé ou surchargé : on essaie le suivant
    firstError ??= message
  }
  if (!data) {
    throw new Error(firstError || "Aucun modèle Gemini n'est disponible pour cette clé.")
  }

  const textPart = extractResponseText(data)
  if (!textPart) {
    throw new Error('Réponse Gemini invalide (pas de texte).')
  }

  let jsonStr = textPart.trim()
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim()

  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('Réponse Gemini invalide (JSON attendu).')
  }

  if (parsed.not_food === true) {
    const reason = (parsed.reason || '').trim() || "Cette image ne semble pas représenter un plat ou des aliments."
    throw new Error(reason)
  }

  // Noms rapprochés de la base (casse, accents) ; un nom inconnu est gardé et signalé pour correction
  const items = (Array.isArray(parsed.ingredients) ? parsed.ingredients : [])
    .filter((it) => String(it?.ingredient ?? '').trim())
    .map(normalizeMealItem)
  const dish = typeof parsed.dish === 'string' && parsed.dish.trim() ? parsed.dish.trim() : undefined

  return { provider: 'gemini', model: usedModel, items, ...(dish ? { dish } : {}) }
}
