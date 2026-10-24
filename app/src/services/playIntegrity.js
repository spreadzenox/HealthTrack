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

/**
 * Jeton Play Integrity neuf pour cette installation, ou null. Ne lève jamais : un échec ne doit pas empêcher
 * l'analyse.
 */
export async function getIntegrityToken(installId, { native, timeoutMs = INTEGRITY_TIMEOUT_MS, now = Date.now } = {}) {
  if (now() < skipUntil) return null
  const plugin = native === undefined ? await loadIntegrityPlugin() : native
  if (!plugin) return null
  let timer
  try {
    const requestHash = await integrityRequestHash(installId)
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve('timeout'), timeoutMs)
    })
    const result = await Promise.race([plugin.request({ requestHash }), timeout])
    if (result === 'timeout') {
      skipUntil = now() + INTEGRITY_BACKOFF_MS
      return null
    }
    return typeof result?.token === 'string' && result.token ? result.token : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
