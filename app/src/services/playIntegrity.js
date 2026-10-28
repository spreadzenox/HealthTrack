/**
 * Play Integrity dans la variante play (jalon 6b-2b). Le plugin natif `PlayIntegrity` (PlayIntegrityPlugin.java,
 * source de la seule variante play) demande à Google Play un jeton « standard » lié à l'installation par `requestHash`
 * (empreinte de l'identifiant d'installation aléatoire, comme `requestHashFor` du relais). Le relais le fait décoder
 * par Google et vérifie que l'app vient de Google Play, sur un appareil certifié (relay/src/integrity.js) : c'est ce
 * qui empêche un script d'inventer des installations pour toucher sans fin les analyses IA offertes.
 *
 * Le jeton est opaque pour l'app ; il ne contient aucune donnée de santé. Sans jeton (sideload, Play Store absent,
 * Google trop lent), l'analyse part quand même : c'est le relais qui décide selon son mode.
 */
import { FEATURES } from '../config/distribution'
import { notThenable } from './nativePlugin'

/** Au-delà, l'analyse part sans jeton (le relais coupe lui-même ses appels à Google à 10 s). */
export const INTEGRITY_TIMEOUT_MS = 8_000
/** Après un délai dépassé, on ne redemande pas de jeton pendant ce temps : pas 8 s de plus à chaque analyse. */
export const INTEGRITY_BACKOFF_MS = 60 * 60_000

let skipUntil = 0

export function resetIntegrityBackoff() {
  skipUntil = 0
}

/** sha256 hexadécimal de « halcya-integrity:<installation> » (identique au relais). */
export async function integrityRequestHash(installId) {
  const bytes = new TextEncoder().encode(`halcya-integrity:${installId}`)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Le plugin natif, dans la seule variante play sur Android ; sinon null (sideload, navigateur, tests). */
export async function loadIntegrityPlugin() {
  if (!FEATURES.aiRelay) return null
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core')
    if (!Capacitor?.isNativePlatform?.() || Capacitor.getPlatform?.() !== 'android') return null
    if (Capacitor.isPluginAvailable && !Capacitor.isPluginAvailable('PlayIntegrity')) return null
    return notThenable(registerPlugin('PlayIntegrity'))
  } catch {
    return null
  }
}

/** Code d'erreur du plugin natif (StandardIntegrityErrorCode, ou UNKNOWN) ; jamais le message, qui est libre. */
const ERROR_CODE = /^[A-Z0-9_-]{1,24}$/

/**
 * Jeton Play Integrity neuf pour cette installation, ou la raison de son absence (6b-2c-2) :
 * `{ token, reason }` avec `reason` ∈ no_plugin | backoff | timeout | bad_token | error:<code>. Ne lève jamais : un
 * échec ne doit pas empêcher l'analyse.
 */
export async function requestIntegrity(installId, { native, timeoutMs = INTEGRITY_TIMEOUT_MS, now = Date.now } = {}) {
  if (now() < skipUntil) return { token: null, reason: 'backoff' }
  const plugin = native === undefined ? await loadIntegrityPlugin() : native
  if (!plugin) return { token: null, reason: 'no_plugin' }
  let timer
  try {
    const requestHash = await integrityRequestHash(installId)
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve('timeout'), timeoutMs)
    })
    const result = await Promise.race([plugin.request({ requestHash }), timeout])
    if (result === 'timeout') {
      skipUntil = now() + INTEGRITY_BACKOFF_MS
      return { token: null, reason: 'timeout' }
    }
    return typeof result?.token === 'string' && result.token ? { token: result.token, reason: null } : { token: null, reason: 'bad_token' }
  } catch (err) {
    const code = String(err?.code ?? '')
    return { token: null, reason: `error:${ERROR_CODE.test(code) ? code : 'UNKNOWN'}` }
  } finally {
    clearTimeout(timer)
  }
}

/** Jeton Play Integrity neuf pour cette installation, ou null. */
export async function getIntegrityToken(installId, options) {
  return (await requestIntegrity(installId, options)).token
}

let testDeviceCache = null

export function resetTestDeviceCache() {
  testDeviceCache = null
}

/**
 * Vrai sur un appareil de test de Google (Firebase Test Lab : robots du rapport de pré-lancement de la Play Console,
 * qui parcourent l'app à chaque version envoyée). Le relais compte alors leurs analyses à part (INSTALLS-21) ; rien ne
 * change pour l'app. Lu une fois par lancement ; faux sans plugin ou si la lecture échoue.
 */
export async function isTestDevice({ native } = {}) {
  if (testDeviceCache !== null) return testDeviceCache
  let result = false
  try {
    const plugin = native === undefined ? await loadIntegrityPlugin() : native
    if (typeof plugin?.environment === 'function') result = (await plugin.environment())?.testLab === true
  } catch {
    result = false
  }
  testDeviceCache = result
  return result
}
