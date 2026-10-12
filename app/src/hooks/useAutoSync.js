/**
 * useAutoSync – React hook that triggers a background auto-sync once when the
 * component mounts (i.e. when the user opens the app or navigates to a page).
 *
 * The sync only runs if the last sync is stale (> 1 hour old), so it is safe
 * to call this from multiple places without worrying about duplicate syncs.
 */
import { useEffect } from 'react'
import { triggerAutoSync } from '../connectors/autoSync'
import { syncWeather } from '../services/weatherSync'
import { syncPhoneUsage } from '../services/phoneUsageSync'

/**
 * Call inside any component that should trigger an auto-sync on mount.
 *
 * @example
 * // In Layout (runs on every app launch / cold start):
 * useAutoSync()
 *
 * // In Recommendations (runs when the user navigates to that page):
 * useAutoSync()
 */
export function useAutoSync() {
  useEffect(() => {
    triggerAutoSync()
    // Météo / air : au plus toutes les 3 h, seulement si l'utilisateur l'a activée.
    syncWeather()
    // Temps d'écran / sommeil estimé : au plus toutes les 30 min, seulement si activé et autorisé.
    syncPhoneUsage()
    // No cleanup needed — the sync is self-contained.
  }, [])
}
