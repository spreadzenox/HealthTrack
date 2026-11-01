/**
 * Analyse IA des repas, quelle que soit la variante : en play par le relais Halcya (aucune clé, accord demandé une
 * fois avant le premier envoi), en sideload avec la clé Gemini saisie dans les Paramètres.
 */
import { FEATURES } from '../config/distribution'
import { analyzeMealText, analyzeWithGemini } from './geminiStandalone'
import { analyzePhotoViaRelay, analyzeTextViaRelay } from './aiRelay'
import { getGeminiApiKey, hasGeminiApiKey } from '../settings/geminiApiKey'

const CONSENT_KEY = 'halcya_ai_meal_consent'

/** Message affiché quand l'analyse n'est pas possible en l'état (sideload sans clé). */
export const MISSING_KEY_MESSAGE =
  'Ajoutez votre clé API Gemini dans Réglages (roue en haut à droite) → Paramètres pour analyser une photo.'

export function canAnalyzeMeals(features = FEATURES) {
  return features.aiRelay || hasGeminiApiKey()
}

/** Faut-il montrer la divulgation « ai_meal » avant l'envoi ? (play, tant que la personne n'a pas accepté) */
export function needsAiConsent(features = FEATURES) {
  if (!features.aiRelay) return false
  try {
    return localStorage.getItem(CONSENT_KEY) !== '1'
  } catch {
    return true
  }
}

export function rememberAiConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, '1')
  } catch {
    // stockage indisponible : la question reviendra au prochain envoi
  }
}

export function analyzeMealPhoto(file, features = FEATURES) {
  return features.aiRelay ? analyzePhotoViaRelay(file) : analyzeWithGemini(file, getGeminiApiKey())
}

export function analyzeMealDescription(text, features = FEATURES) {
  return features.aiRelay ? analyzeTextViaRelay(text) : analyzeMealText(text, getGeminiApiKey())
}

/** Rappel affiché sous la photo ou la description, avant l'envoi. */
export function aiPrivacyHint(kind, features = FEATURES) {
  if (features.aiRelay) {
    return kind === 'photo'
      ? 'Seule la photo part vers notre serveur, réduite et sans position GPS. Une IA de Google l’analyse en Europe. Rien n’est gardé.'
      : 'Vous pouvez dicter avec le micro du clavier. Seul ce texte part vers notre serveur, analysé par une IA de Google en Europe. Rien n’est gardé. Les nutriments sont calculés sur le téléphone.'
  }
  return kind === 'photo'
    ? 'Seule la photo est envoyée à Google Gemini avec votre clé, réduite et sans position GPS. Avec une clé gratuite, Google peut s’en servir pour améliorer ses produits.'
    : 'Vous pouvez dicter avec le micro du clavier. Seul ce texte est envoyé à Google Gemini avec votre clé. Les nutriments sont calculés sur le téléphone.'
}

/** Libellé du bouton qui remplit un repas décrit. */
export const describeButtonLabel = (features = FEATURES) => (features.aiRelay ? 'Remplir avec l’IA' : 'Remplir avec Gemini')
