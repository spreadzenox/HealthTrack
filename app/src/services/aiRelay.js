/**
 * Client du relais Halcya (variante play, jalon 6a) : l'analyse IA des repas passe par notre serveur Cloud Run,
 * qui appelle Gemini sur Vertex AI dans l'UE sous sa propre identité. Aucune clé n'est dans l'app.
 *
 * Ce qui part : la photo réduite et ré-encodée (sans métadonnées, voir imagePrep.js) ou la description du repas,
 * et un identifiant d'installation aléatoire (créé ici, sans lien avec la personne ni le téléphone) qui sert
 * seulement à compter les analyses IA (crédits, quotas). Le relais ne garde qu'un compteur
 * d'analyses par empreinte, effacé 13 mois après la dernière (relay/src/credits.js).
 */
import { loadNutritionTable } from '../data/nutritionTable'
import { prepareImageForGemini } from './imagePrep.js'
import { MEAL_TEXT_MAX_LENGTH, toMealResult } from './geminiStandalone.js'
import { isTestDevice, requestIntegrity } from './playIntegrity.js'
import { appLocale } from '../i18n/locale.js'

export const RELAY_URL = (import.meta.env?.VITE_RELAY_URL || 'https://halcya-relay-81378799481.europe-west1.run.app')
  .replace(/\/+$/, '')

const INSTALL_ID_KEY = 'halcya_install_id'
const QUOTA_KEY = 'halcya_ai_quota'
const CREDITS_KEY = 'halcya_ai_credits'
/** Jeton d'achat Google Play gardé par playBilling.js, renvoyé au relais pour qu'il retrouve le premium. */
export const PURCHASE_TOKEN_KEY = 'halcya_purchase_token'
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

/**
 * Empreinte de cette installation (12 caractères hexadécimaux) : les 12 premiers du SHA-256 de l'identifiant, la même
 * que `hashInstallId` du relais (journaux, `GOLD_INSTALLS`). Ne révèle pas l'identifiant.
 */
export async function installFingerprint() {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(getInstallId()))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12)
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

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

/**
 * Derniers crédits d'analyse IA donnés par le relais : `{ plan: 'free'|'premium', remaining, resetAt, state, … }`,
 * ou null s'ils sont inconnus ou périmés (renouvellement passé : on ne sait plus combien il en reste).
 */
export function getLastCredits({ now = Date.now() } = {}) {
  const c = readJson(CREDITS_KEY)
  if (!c || !Number.isFinite(c.remaining) || !c.resetAt) return null
  return Date.parse(c.resetAt) > now ? c : null
}

function rememberCredits(credits) {
  if (!credits || !Number.isFinite(credits.remaining) || !credits.resetAt) return
  try {
    localStorage.setItem(CREDITS_KEY, JSON.stringify(credits))
  } catch {
    // stockage indisponible : le compteur ne s'affichera pas
  }
}

/**
 * En-têtes de chaque appel : l'identifiant d'installation, le dernier état des crédits (le relais garde le plus
 * restrictif, pour que le compteur ne remonte pas quand il redémarre) et le jeton d'achat s'il y en a un.
 */
function relayHeaders() {
  const headers = { 'X-Install-Id': getInstallId() }
  const state = readJson(CREDITS_KEY)?.state
  if (typeof state === 'string' && state) headers['X-Credits'] = state
  try {
    const token = localStorage.getItem(PURCHASE_TOKEN_KEY)
    if (token) headers['X-Purchase-Token'] = token
  } catch {
    // stockage indisponible : le relais relira le premium autrement
  }
  return headers
}

const MONTHS_LONG = { day: 'numeric', month: 'long' }

/** « 12 analyses IA restantes · renouvellement le 1 novembre » (ou « demain » en premium). */
export function describeCredits(credits) {
  if (!credits) return null
  const n = credits.remaining
  const count = n > 1 ? `${n} analyses IA restantes` : `${n} analyse IA restante`
  if (credits.plan === 'premium') return `${count} aujourd’hui · renouvellement demain`
  const reset = new Date(credits.resetAt)
  // « 1er novembre » plutôt que « 1 novembre »
  const date = reset.getDate() === 1
    ? `1er ${reset.toLocaleDateString(appLocale(), { month: 'long' })}`
    : reset.toLocaleDateString(appLocale(), MONTHS_LONG)
  return `${count} · renouvellement le ${date}`
}

/** Demande au relais les crédits de cette installation, sans rien consommer ; null hors connexion. */
export async function refreshCredits({ fetchImpl = globalThis.fetch, timeoutMs = 15_000 } = {}) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
  try {
    const res = await fetchImpl(`${RELAY_URL}/v1/credits`, {
      headers: relayHeaders(),
      ...(controller ? { signal: controller.signal } : {}),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.credits) return getLastCredits()
    rememberCredits(data.credits)
    return getLastCredits()
  } catch {
    return getLastCredits()
  } finally {
    if (timer) clearTimeout(timer)
  }
}

const NETWORK_MESSAGE = "Pas de connexion au service d’analyse IA. Vérifiez votre connexion et réessayez."

async function postRelay(body, { fetchImpl = globalThis.fetch, timeoutMs = RELAY_TIMEOUT_MS, integrity = requestIntegrity, testDevice = isTestDevice } = {}) {
  const headers = { 'Content-Type': 'application/json', ...relayHeaders() }
  // Jeton Play Integrity (variante play) : le relais vérifie que la demande vient de l'app Google Play (6b-2b) ;
  // sans jeton, seulement la raison (délai, code d'erreur de Google Play) pour son bilan avant « enforce » (6b-2c-2)
  const result = await integrity(headers['X-Install-Id'])
  const integrityToken = typeof result === 'string' ? result : result?.token
  if (integrityToken) headers['X-Integrity-Token'] = integrityToken
  else if (result?.reason) headers['X-Integrity-Status'] = result.reason
  // Robots du rapport de pré-lancement de Google : comptés à part dans les bilans du relais (INSTALLS-21)
  if (await testDevice()) headers['X-Test-Device'] = '1'
  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
  let res
  try {
    res = await fetchImpl(`${RELAY_URL}/v1/meal/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      ...(controller ? { signal: controller.signal } : {}),
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error("L’analyse IA a pris trop de temps. Réessayez dans un instant.")
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
    rememberCredits(data?.credits)
    throw new Error(data?.message || "L’analyse IA n’a pas abouti. Réessayez dans un instant.")
  }
  if (!data || typeof data.parsed !== 'object') {
    throw new Error("Réponse inattendue du service d’analyse IA.")
  }
  rememberQuota(data.quota)
  rememberCredits(data.credits)
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
