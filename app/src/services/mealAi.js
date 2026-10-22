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
      ? '🔒 Seule la photo, réduite et sans position GPS ni infos de l’appareil, part vers notre serveur pour être analysée par Gemini (Google Cloud, en Europe). Rien n’y est gardé.'
      : '🎙️ Le micro du clavier permet de dicter. 🔒 Seul ce texte part vers notre serveur, analysé par Gemini (Google Cloud, en Europe) ; rien n’y est gardé, et les nutriments sont calculés sur le téléphone.'
  }
  return kind === 'photo'
    ? '🔒 Seule la photo, réduite et sans position GPS ni infos de l’appareil, est envoyée à Google Gemini avec votre clé. Avec une clé gratuite, Google peut l’utiliser pour améliorer ses produits.'
    : '🎙️ Le micro du clavier permet de dicter. 🔒 Seul ce texte est envoyé à Google Gemini avec votre clé ; les nutriments sont calculés sur le téléphone.'
}

/** Libellé du bouton qui remplit un repas décrit. */
export const describeButtonLabel = (features = FEATURES) => (features.aiRelay ? '✨ Remplir avec l’IA' : '✨ Remplir avec Gemini')
