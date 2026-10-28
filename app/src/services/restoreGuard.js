/**
 * Sauvegarde Android conservée (décision du 24/10, journal/BACKLOG.md SAUV) : les données de l'app (IndexedDB et
 * localStorage de la WebView) suivent la sauvegarde Google du téléphone. Les règles de sauvegarde
 * (res/xml/data_extraction_rules.xml, backup_rules.xml) écartent les fichiers natifs propres au téléphone, mais ne
 * peuvent pas viser une clé du localStorage. D'où ce repère : le natif garde un identifiant hors sauvegarde
 * (BackupMarkerPlugin.java, getNoBackupFilesDir) et le localStorage en garde une copie. Si la copie diffère, les
 * données viennent d'une restauration (nouveau téléphone ou réinstallation) : on retire les secrets propres à
 * l'ancien téléphone. L'identifiant d'installation reste (il porte les crédits IA côté relais), la montre se
 * réappaire, le jeton d'achat est relu dans Google Play à l'ouverture. Ne lève jamais.
 */
import { registerPlugin } from '@capacitor/core'
import { withTimeout } from '../utils/withTimeout'
import { markWatchRestored } from './watchAutoSync'

const NativeMarker = registerPlugin('BackupMarker')

export const MARKER_KEY = 'halcya_device_marker'

/** Secrets et jetons qui ne doivent pas changer de téléphone. */
export const DEVICE_BOUND_KEYS = [
  'healthtrack_gemini_api_key', // clé Gemini saisie (variante sideload)
  'healthtrack_watch_keys', // clés d'appairage de la montre
  'healthtrack_withings_tokens',
  'healthtrack_withings_credentials',
  'halcya_purchase_token', // relu dans Google Play par syncEntitlement
]

const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

export function markerPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeBackupMarker) return window.__healthtrackFakeBackupMarker
  return isNative() ? NativeMarker : null
}

/** Rend `{ restored: false }`, `{ restored: true, removed }` ou `{ restored: false, unavailable: true }`. */
export async function checkRestore({ plugin = markerPlugin(), storage = globalThis.localStorage, timeoutMs = 2000 } = {}) {
  let id
  try {
    id = plugin?.marker ? (await withTimeout(plugin.marker(), timeoutMs, 'repère de sauvegarde'))?.id : null
  } catch {
    id = null
  }
  if (typeof id !== 'string' || !id) return { restored: false, unavailable: true }
  try {
    const seen = storage.getItem(MARKER_KEY)
    if (seen === id) return { restored: false }
    const removed = []
    if (seen) {
      for (const key of DEVICE_BOUND_KEYS) {
        if (storage.getItem(key) != null) {
          storage.removeItem(key)
          removed.push(key)
        }
      }
    }
    // la montre se réappaire au geste « Reconnecter ma montre », jamais en silence
    if (removed.includes('healthtrack_watch_keys')) markWatchRestored({ storage })
    storage.setItem(MARKER_KEY, id)
    return seen ? { restored: true, removed } : { restored: false }
  } catch {
    return { restored: false, unavailable: true }
  }
}
