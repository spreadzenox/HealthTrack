/**
 * Connector settings – persisted in localStorage.
 *
 * Shape per connector:
 * {
 *   enabled: boolean,          // user has turned this connector on
 *   lastSyncAt: string|null,   // ISO timestamp of last successful sync
 *   lastSyncResult: {          // result summary from the last sync
 *     synced: number,
 *     skipped: number,
 *     errors: string[],
 *   } | null,
 *   historicalSince: string|null, // ISO date to start the initial historical import from
 * }
 */

const KEY_PREFIX = 'healthtrack_connector_'

function storageKey(connectorId) {
  return `${KEY_PREFIX}${connectorId}`
}

/**
 * @param {string} connectorId
 * @returns {{ enabled: boolean, lastSyncAt: string|null, lastSyncResult: object|null, historicalSince: string|null }}
 */
export function getConnectorSettings(connectorId) {
  try {
    const raw = localStorage.getItem(storageKey(connectorId))
    if (raw) return JSON.parse(raw)
  } catch {
    // corrupted storage – return defaults
  }
  return {
    enabled: false,
    lastSyncAt: null,
    lastSyncResult: null,
    historicalSince: null,
  }
}

/**
 * @param {string} connectorId
 * @param {Partial<{ enabled: boolean, lastSyncAt: string, lastSyncResult: object, historicalSince: string }>} patch
 */
export function setConnectorSettings(connectorId, patch) {
  const current = getConnectorSettings(connectorId)
  const updated = { ...current, ...patch }
  localStorage.setItem(storageKey(connectorId), JSON.stringify(updated))
}

/**
 * Returns a list of ids of all connectors that have stored settings.
 * @returns {string[]}
 */
export function listConfiguredConnectorIds() {
  const ids = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(KEY_PREFIX)) {
      ids.push(key.slice(KEY_PREFIX.length))
    }
  }
  return ids
}
