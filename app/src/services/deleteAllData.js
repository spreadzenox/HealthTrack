/**
 * « Supprimer toutes mes données » (Réglages → Données, VC-10). Efface ce qui décrit la santé de la personne :
 * toutes les entrées (repas, notes, mesures, lectures du visage), les agrégats, le profil, et les caches qui en
 * contiennent des résultats ou des traces. Rien ne quitte l'appareil ; le relais d'analyse IA ne garde
 * qu'un compteur d'analyses sous une empreinte, effacé 13 mois après la dernière (relay/src/credits.js).
 *
 * Restent les réglages qui reflètent un état d'Android ou du compte (lecture du visage, temps d'écran, rappels,
 * connexions et leurs dates de reprise, appairage de la montre, abonnement, crédits IA, thème) : les effacer
 * ferait dire à l'app « désactivé » pendant que le service natif tourne encore, ou ramènerait l'historique à la
 * prochaine synchro. Les dates de reprise gardées font que seules les nouvelles mesures arrivent ensuite.
 */
import { deleteAllEntries } from '../storage/localHealthStorage'

/** Clés effacées : données de santé ou dérivées (résultats d'analyse, journaux de connexion de la montre). */
export const DELETED_KEYS = [
  'healthtrack_body_profile',
  'healthtrack-analysis-cache-v1',
  'healthtrack_pistes_summary',
  'healthtrack_watch_diagnostic_last',
  'healthtrack_watch_connect_last',
  'healthtrack_ble_unknown_devices',
]

/** Clés gardées exprès (documentation et test) : réglages, état natif, compte. */
export const KEPT_KEYS = [
  'healthtrack_theme',
  'healthtrack_onboarding',
  'healthtrack_face_sense',
  'healthtrack_face_app_open',
  'healthtrack_phone_usage',
  'healthtrack_evening_note',
  'healthtrack_weather',
  'healthtrack_watch_keys',
  'healthtrack_watch_setup',
  'healthtrack_watch_sync',
  'healthtrack_watch_autosync',
  'healthtrack_huawei_secrets',
  'healthtrack_gemini_api_key',
  'halcya_install_id',
  'halcya_entitlement',
  'halcya_purchase_token',
  'halcya_ai_credits',
  'halcya_ai_quota',
]

const SESSION_KEYS = ['healthtrack-wellbeing-prompt-session']

function removeAll(storage, keys) {
  for (const k of keys) {
    try {
      storage?.removeItem(k)
    } catch {
      /* stockage indisponible : rien à effacer */
    }
  }
}

/**
 * @returns {Promise<{ entries: number }>} nombre d'entrées effacées
 */
export async function deleteAllMyData() {
  const entries = await deleteAllEntries()
  removeAll(globalThis.localStorage, DELETED_KEYS)
  removeAll(globalThis.sessionStorage, SESSION_KEYS)
  window.dispatchEvent(new CustomEvent('health-entries-updated'))
  return { entries }
}
