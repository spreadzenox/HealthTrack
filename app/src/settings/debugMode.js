/**
 * Mode diagnostic (anciennement « mode debug ») – stocké dans localStorage.
 *
 * Un simple interrupteur dans Paramètres : il affiche les journaux techniques (connexions
 * Health Connect, analyses…) directement dans l'app, pour pouvoir les montrer ou les exporter.
 * L'ancien déverrouillage par adresse MAC saisie à la main a été retiré (12/10/2026) : Android ne
 * donne de toute façon pas l'adresse MAC à une app, et rien de sensible n'est affiché.
 */

const DEBUG_ENABLED_KEY = 'healthtrack_debug_mode_enabled'

export function isDebugModeEnabled() {
  try {
    return localStorage.getItem(DEBUG_ENABLED_KEY) === 'true'
  } catch {
    return false
  }
}

export function setDebugModeEnabled(enabled) {
  try {
    if (enabled) {
      localStorage.setItem(DEBUG_ENABLED_KEY, 'true')
    } else {
      localStorage.removeItem(DEBUG_ENABLED_KEY)
    }
  } catch {
    // ignore
  }
}
