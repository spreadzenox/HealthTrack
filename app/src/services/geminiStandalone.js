/**
 * Appel direct à l'API Gemini depuis le frontend (mode standalone, sans backend).
 */
import { INGREDIENT_NAMES } from '../data/ingredientNames.js'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

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
   {"not_food": false, "ingredients": [{"ingredient": "Nom exact copié de la liste", "quantity_g": nombre}]}
   - "ingredient" : exactement une chaîne prise dans la liste exhaustive ci-dessus (copie à l'identique).
   - "quantity_g" : nombre (grammes), entier ou décimal.

Interdiction : ne réponds pas avec du texte libre, des explications ou du markdown. Uniquement le JSON.`
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

  const allowedSet = new Set(INGREDIENT_NAMES.map((n) => n.trim()))
  const ingredients = (parsed.ingredients || []).filter(
    (it) => (it.ingredient || '').trim() && allowedSet.has(String(it.ingredient).trim())
  )
  const items = ingredients.map((it) => {
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
