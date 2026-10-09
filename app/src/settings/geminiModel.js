/**
 * Modèle Gemini utilisé pour l'analyse photo (réglable dans Paramètres).
 * Source : https://ai.google.dev/gemini-api/docs/models (consultée le 2026-10-09) —
 * 3.8 Flash et 3.5 Flash-Lite recommandés ; 2.5 Flash n'est plus ouvert qu'aux comptes
 * qui l'utilisaient déjà.
 */
const STORAGE_KEY = 'healthtrack_gemini_model'

export const GEMINI_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (recommandé, plus précis)' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (plus rapide, quota gratuit plus large)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (ancien modèle)' },
]

export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS[0].id

const isKnown = (id) => GEMINI_MODELS.some((m) => m.id === id)

export function getGeminiModel() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isKnown(stored) ? stored : DEFAULT_GEMINI_MODEL
  } catch {
    return DEFAULT_GEMINI_MODEL
  }
}

export function setGeminiModel(id) {
  try {
    if (isKnown(id)) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // stockage indisponible : rien à faire
  }
}

/** Modèle choisi d'abord, puis les autres (utilisés seulement si le modèle est introuvable). */
export function getGeminiModelFallbacks() {
  const chosen = getGeminiModel()
  return [chosen, ...GEMINI_MODELS.map((m) => m.id).filter((id) => id !== chosen)]
}
