/**
 * Client du relais Halcya (variante play, jalon 6a) : l'analyse IA des repas passe par notre serveur Cloud Run,
 * qui appelle Gemini sur Vertex AI dans l'UE sous sa propre identité. Aucune clé n'est dans l'app.
 *
 * Ce qui part : la photo réduite et ré-encodée (sans métadonnées, voir imagePrep.js) ou la description du repas,
 * et un identifiant d'installation aléatoire (créé ici, sans lien avec la personne ni le téléphone) qui sert
 * seulement à compter les analyses du jour. Le relais ne garde rien (relay/README.md).
 */
import { loadNutritionTable } from '../data/nutritionTable'
import { prepareImageForGemini } from './imagePrep.js'
import { MEAL_TEXT_MAX_LENGTH, toMealResult } from './geminiStandalone.js'

export const RELAY_URL = (import.meta.env?.VITE_RELAY_URL || 'https://halcya-relay-81378799481.europe-west1.run.app')
  .replace(/\/+$/, '')

const INSTALL_ID_KEY = 'halcya_install_id'
const QUOTA_KEY = 'halcya_ai_quota'
/** Délai maximal d'une analyse (le relais coupe lui-même le modèle à 45 s). */
export const RELAY_TIMEOUT_MS = 60_000

function randomId() {
  const bytes = new Uint8Array(24)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Identifiant aléatoire de cette installation (48 caractères hexadécimaux), créé au premier appel. */
export function getInstallId() {
  try {
    const existing = localStorage.getItem(INSTALL_ID_KEY)
    if (existing && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing
    const id = randomId()
    localStorage.setItem(INSTALL_ID_KEY, id)
    return id
  } catch {
    return randomId()
  }
}

/** Dernier état connu du compteur d'analyses du jour : `{ remaining, resetAt }` ou null. */
export function getLastQuota() {
  try {
    const q = JSON.parse(localStorage.getItem(QUOTA_KEY) || 'null')
    if (!q || !Number.isFinite(q.remaining) || !q.resetAt) return null
    // Compteur périmé (jour suivant) : on ne sait plus, mieux vaut ne rien afficher
    return Date.parse(q.resetAt) > Date.now() ? q : null
  } catch {
    return null
  }
}

function rememberQuota(quota) {
  if (!quota || !Number.isFinite(quota.remaining) || !quota.resetAt) return
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify({ remaining: quota.remaining, resetAt: quota.resetAt }))
  } catch {
    // stockage indisponible : le compteur ne s'affichera pas
  }
}

const NETWORK_MESSAGE = "Pas de connexion au service d'analyse IA. Vérifiez votre connexion et réessayez."

async function postRelay(body, { fetchImpl = globalThis.fetch, timeoutMs = RELAY_TIMEOUT_MS } = {}) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
  let res
  try {
    res = await fetchImpl(`${RELAY_URL}/v1/meal/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Install-Id': getInstallId() },
      body: JSON.stringify(body),
      ...(controller ? { signal: controller.signal } : {}),
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error("L'analyse IA a pris trop de temps. Réessayez dans un instant.")
    throw new Error(NETWORK_MESSAGE)
  } finally {
    if (timer) clearTimeout(timer)
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    if (res.status === 429 && data?.scope === 'install') rememberQuota({ remaining: 0, resetAt: data.resetAt })
    throw new Error(data?.message || "L'analyse IA n'a pas abouti. Réessayez dans un instant.")
  }
  if (!data || typeof data.parsed !== 'object') {
    throw new Error("Réponse inattendue du service d'analyse IA.")
  }
  rememberQuota(data.quota)
  return data
}

/**
 * Analyse une photo de repas par le relais.
 * @returns {Promise<{ provider: 'relay', model: string, dish?: string, items: Array }>}
 */
export async function analyzePhotoViaRelay(file, options) {
  const { base64, mimeType } = await prepareImageForGemini(file)
  await loadNutritionTable()
  const data = await postRelay({ kind: 'photo', image: { mimeType, data: base64 } }, options)
  return toMealResult(data, 'Cette image ne semble pas représenter un plat ou des aliments.', 'relay')
}

/** Analyse la description d'un repas par le relais. */
export async function analyzeTextViaRelay(text, options) {
  const description = String(text ?? '').trim().slice(0, MEAL_TEXT_MAX_LENGTH)
  if (!description) throw new Error('Décrivez votre repas en quelques mots.')
  await loadNutritionTable()
  const data = await postRelay({ kind: 'text', description }, options)
  return toMealResult(data, 'Ce texte ne semble pas décrire un repas.', 'relay')
}
