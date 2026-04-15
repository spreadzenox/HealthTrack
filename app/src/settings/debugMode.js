/**
 * Debug mode settings – stored in localStorage.
 *
 * The debug mode toggle is only visible in the Settings page when the device
 * MAC address matches the authorised address (74:F6:7A:6C:6D:25).
 *
 * We cannot read the MAC address from the browser directly (it is blocked by
 * both web and Android WebView security policies). Instead we expose a
 * "developer unlock" flow: the user enters the MAC address manually once in
 * Settings; if it matches the authorised value we treat the device as
 * authorised for debug mode. The entered value is persisted so the user does
 * not have to re-enter it on every visit.
 */

const DEBUG_ENABLED_KEY = 'healthtrack_debug_mode_enabled'
const DEBUG_MAC_KEY = 'healthtrack_debug_mac'

/** Authorised MAC addresses (lower-case, colon-separated). */
export const AUTHORISED_MACS = ['74:f6:7a:6c:6d:25']

/**
 * Returns true if the stored MAC matches one of the authorised values.
 */
export function isDebugUnlocked() {
  try {
    const stored = (localStorage.getItem(DEBUG_MAC_KEY) || '').toLowerCase().trim()
    return AUTHORISED_MACS.includes(stored)
  } catch {
    return false
  }
}

/**
 * Stores the user-supplied MAC address. Returns true if it is authorised.
 */
export function setDebugMac(mac) {
  try {
    const normalised = (mac || '').toLowerCase().trim()
    localStorage.setItem(DEBUG_MAC_KEY, normalised)
    return AUTHORISED_MACS.includes(normalised)
  } catch {
    return false
  }
}

export function getDebugMac() {
  try {
    return localStorage.getItem(DEBUG_MAC_KEY) || ''
  } catch {
    return ''
  }
}

/** Returns true when debug mode is both unlocked and enabled. */
export function isDebugModeEnabled() {
  if (!isDebugUnlocked()) return false
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
