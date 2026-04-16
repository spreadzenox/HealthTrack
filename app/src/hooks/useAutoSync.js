/**
 * useAutoSync – React hook that triggers a background auto-sync once when the
 * component mounts (i.e. when the user opens the app or navigates to a page).
 *
 * The sync only runs if the last sync is stale (> 1 hour old), so it is safe
 * to call this from multiple places without worrying about duplicate syncs.
 */
import { useEffect } from 'react'
import { triggerAutoSync } from '../connectors/autoSync'

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
    // No cleanup needed — the sync is self-contained.
  }, [])
}
