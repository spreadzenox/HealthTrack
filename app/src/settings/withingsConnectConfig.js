/**
 * When HealthTrack can offer one-click Withings account connection.
 */
import { hasBuiltInWithingsCredentials } from './withingsBuiltInCredentials'

/** Demo / CI / Vitest — full API responses without network or developer portal. */
export function isWithingsMockMode() {
  return import.meta.env.VITE_WITHINGS_MOCK === 'true' || import.meta.env.MODE === 'test'
}

/** Direct Withings OAuth + full Body Scan biomarkers (not only Health Connect subset). */
export function isWithingsDirectConnectAvailable() {
  return hasBuiltInWithingsCredentials() || isWithingsMockMode()
}
