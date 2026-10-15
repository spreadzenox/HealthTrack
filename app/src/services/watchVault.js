/**
 * Clé de la montre confiée au natif (chantier D3 d quater ③ c, huawei.md §9.1) : après chaque connexion réussie,
 * l'identifiant du téléphone et la clé longue durée sont déposés dans le coffre Android (WatchVaultPlugin.java,
 * AES-GCM par une clé du Keystore qui n'en sort jamais), pour que le client Java « synchro seule » puisse relire
 * la montre app tuée. Une clé refusée par la montre est retirée du coffre. Rien ne revient du natif vers le JS,
 * sauf « gardée ou non ». Ne lève jamais.
 */
import { registerPlugin } from '@capacitor/core'

const NativeVault = registerPlugin('WatchVault')

const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

/** Plugin natif dans l'app, faux plugin des tests / captures, sinon aucun. */
export function vaultPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeWatchVault) return window.__healthtrackFakeWatchVault
  return isNative() ? NativeVault : null
}

/**
 * Dépose la clé de `watch` : rend 'stored', 'no_key' (pas encore de clé longue durée), 'unavailable' (hors de
 * l'app, ou version sans coffre) ou 'error' (Keystore indisponible, clé refusée par le natif).
 */
export async function shareWatchKey({ watch, keys, plugin = vaultPlugin() } = {}) {
  if (!keys?.authToken || !keys?.authId || !watch?.deviceId) return 'no_key'
  if (!plugin?.store) return 'unavailable'
  try {
    await plugin.store({ deviceId: watch.deviceId, name: watch.name || null, authId: keys.authId, authToken: keys.authToken })
    return 'stored'
  } catch (e) {
    return /not implemented|unimplemented/i.test(String(e?.message || e)) ? 'unavailable' : 'error'
  }
}

/** Retire la clé de `deviceId` du coffre ; rend true si le natif l'a fait. */
export async function forgetWatchKey({ deviceId, plugin = vaultPlugin() } = {}) {
  if (!deviceId || !plugin?.clear) return false
  try {
    await plugin.clear({ deviceId })
    return true
  } catch {
    return false
  }
}

/** Issues après lesquelles la clé gardée ne vaut plus rien. */
const KEY_INVALIDATED = ['key_rejected']

/**
 * Après une connexion : clé déposée si la montre a accepté, retirée si elle l'a refusée, sinon rien.
 * Rend l'état à consigner dans le rapport (`nativeKey`) ou null.
 */
export async function syncVaultAfterConnection({ report, watch, keyStore, plugin = vaultPlugin() } = {}) {
  const code = report?.outcome?.code
  if (code === 'connected') return shareWatchKey({ watch, keys: keyStore?.get?.(watch?.deviceId), plugin })
  if (KEY_INVALIDATED.includes(code)) return (await forgetWatchKey({ deviceId: watch?.deviceId, plugin })) ? 'cleared' : null
  return null
}
