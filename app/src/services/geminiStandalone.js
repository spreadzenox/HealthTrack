/**
 * Appel direct à l'API Gemini depuis le frontend (mode standalone, sans backend).
 */
import { INGREDIENT_NAMES } from '../data/ingredientNames.js'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function buildPrompt() {
  const namesList = INGREDIENT_NAMES.map((n) => `"${n}"`).join(', ')
  return `Tu analyses une photo de plat / repas pour une application de suivi nutritionnel.

RÈGLES:
1) Si l'image ne montre PAS de nourriture (pas un plat, pas des aliments comestibles), réponds UNIQUEMENT par du JSON valide avec ce format exact:
{"not_food": true, "reason": "explication courte en français"}

2) Si l'image montre un plat ou des aliments, liste les ingrédients PRIMAIRES (aliments de base, pas des plats préparés complexes) avec une estimation du poids en grammes.
   Tu DOIS utiliser UNIQUEMENT des noms pris dans cette liste (choisis le plus proche si besoin):
   ${namesList}
   Réponds UNIQUEMENT par du JSON valide avec ce format exact:
   {"not_food": false, "ingredients": [{"ingredient": "Nom exact de la liste", "quantity_g": nombre}]}
   - "ingredient" doit être exactement un des noms de la liste ci-dessus.
   - "quantity_g" doit être un nombre (grammes), pas de texte.

Réponds uniquement avec le JSON, sans texte avant ou après.`
}

/**
 * Lit le fichier image en base64 (sans le préfixe data:...).
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64 = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : dataUrl
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Analyse une photo avec l'API Gemini (clé fournie par l'utilisateur).
 * @param {File} file - fichier image
 * @param {string} apiKey - clé API Gemini
 * @returns {Promise<{ provider: string, items: Array<{ ingredient: string, quantity: string, quantity_g?: number }> }>}
 * @throws si not_food (message = reason) ou erreur API
 */
export async function analyzeWithGemini(file, apiKey) {
  const base64 = await fileToBase64(file)
  const mimeType = file.type || 'image/jpeg'
  const prompt = buildPrompt()

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64,
            },
          },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    let message = errText
    try {
      const errJson = JSON.parse(errText)
      message = errJson.error?.message || errJson.message || errText
    } catch (_) {}
    throw new Error(message)
  }

  const data = await res.json()
  const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!textPart || typeof textPart !== 'string') {
    throw new Error('Réponse Gemini invalide (pas de texte).')
  }

  let jsonStr = textPart.trim()
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim()

  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    throw new Error('Réponse Gemini invalide (JSON attendu).')
  }

  if (parsed.not_food === true) {
    const reason = (parsed.reason || '').trim() || "Cette image ne semble pas représenter un plat ou des aliments."
    throw new Error(reason)
  }

  const ingredients = parsed.ingredients || []
  const items = ingredients
    .filter((it) => (it.ingredient || '').trim())
    .map((it) => {
      const name = String(it.ingredient).trim()
      const qtyG = it.quantity_g != null ? Number(it.quantity_g) : null
      const quantity = qtyG != null && !Number.isNaN(qtyG) ? `${Math.round(qtyG)} g` : 'portion non précisée'
      return {
        ingredient: name,
        quantity,
        quantity_g: qtyG != null && !Number.isNaN(qtyG) ? qtyG : undefined,
      }
    })

  return { provider: 'gemini', items }
}
