/**
 * autoSync – silently syncs all enabled connectors in the background.
 *
 * A sync is triggered only when:
 *   1. The connector is enabled (user toggled it on).
 *   2. Health Connect is available (native bridge present).
 *   3. Permissions are granted.
 *   4. The last successful sync is absent or older than STALE_THRESHOLD_MS.
 *
 * Multiple callers (app launch, Recommendations page) can call
 * triggerAutoSync() concurrently — the internal lock prevents duplicate
 * in-flight syncs for the same connector.
 */
import { CONNECTORS } from './connectorRegistry'
import { getConnectorSettings, setConnectorSettings } from '../settings/connectorSettings'
import { upsertEntries, getLatestEntryAt } from '../storage/localHealthStorage'
import { noteFirstGrant, readsAllFailed, syncSince } from './syncWindow'
import { debugInfo, debugWarn } from '../utils/debugLog'

const TAG = 'AutoSync'

/** Syncs triggered within this window are considered fresh enough. */
export const STALE_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour

/** Default first-import window when no prior sync exists (bounded by the source's read window). */
const DEFAULT_HISTORY_DAYS = 180

/** Tracks connector IDs that are currently syncing to avoid duplicates. */
const inFlight = new Set()

/**
 * Returns true if the connector needs a sync based on its last sync timestamp.
 * @param {string|null} lastSyncAt  ISO string or null
 */
export function isSyncStale(lastSyncAt) {
  if (!lastSyncAt) return true
  const elapsed = Date.now() - new Date(lastSyncAt).getTime()
  return elapsed > STALE_THRESHOLD_MS
}

/**
 * Attempt a background sync for a single connector.
 * Resolves to true if sync ran, false if skipped (not stale / not ready).
 *
 * @param {import('./BaseConnector').BaseConnector} connector
 * @returns {Promise<boolean>}
 */
async function syncConnector(connector) {
  if (inFlight.has(connector.id)) {
    debugInfo(TAG, `${connector.id}: already syncing, skipping`)
    return false
  }

  const settings = getConnectorSettings(connector.id)

  if (!settings.enabled) {
    debugInfo(TAG, `${connector.id}: not enabled, skipping`)
    return false
  }

  // lastAttemptAt : dernier essai où tout a échoué (lastSyncAt n'avance pas) ; on attend aussi une heure.
  const lastTry = [settings.lastSyncAt, settings.lastAttemptAt].filter(Boolean).sort().pop() || null
  if (!isSyncStale(lastTry)) {
    debugInfo(TAG, `${connector.id}: last sync is recent, skipping`)
    return false
  }

  // Check availability and permissions (graceful: skip if unavailable)
  let available = false
  let permissions = 'denied'
  try {
    available = await connector.isAvailable()
  } catch {
    debugWarn(TAG, `${connector.id}: isAvailable() threw, skipping`)
    return false
  }

  if (!available) {
    debugInfo(TAG, `${connector.id}: not available on this device, skipping`)
    return false
  }

  try {
    permissions = await connector.checkPermissions()
  } catch {
    debugWarn(TAG, `${connector.id}: checkPermissions() threw, skipping`)
    return false
  }

  if (permissions !== 'granted') {
    debugInfo(TAG, `${connector.id}: permissions not granted (${permissions}), skipping`)
    return false
  }

  noteFirstGrant(connector.id)
  inFlight.add(connector.id)
  debugInfo(TAG, `${connector.id}: starting background sync`)

  try {
    const now = new Date()
    const freshSettings = getConnectorSettings(connector.id)

    const latestAt = freshSettings.lastSyncAt ? null : await getLatestEntryAt(connector.id)
    const since = syncSince({
      now,
      settings: freshSettings,
      latestAt,
      historyDays: DEFAULT_HISTORY_DAYS,
      readWindowDays: connector.readWindowDays ?? null,
    })

    const result = await connector.sync({
      since,
      until: now,
      writer: async (entries) => {
        await upsertEntries(entries)
      },
    })

    if (readsAllFailed(result)) {
      // Rien d'importé : on réessaiera depuis le même point (sinon l'historique serait perdu).
      setConnectorSettings(connector.id, { lastAttemptAt: now.toISOString(), lastSyncResult: result })
      debugWarn(TAG, `${connector.id}: every read failed`, result.errors)
      return false
    }

    setConnectorSettings(connector.id, {
      lastSyncAt: now.toISOString(),
      lastSyncResult: result,
    })

    debugInfo(TAG, `${connector.id}: sync done`, result)

    window.dispatchEvent(new CustomEvent('health-entries-updated'))
    return true
  } catch (e) {
    debugWarn(TAG, `${connector.id}: sync error — ${e?.message}`)
    return false
  } finally {
    inFlight.delete(connector.id)
  }
}

/**
 * Trigger a background auto-sync for all registered connectors that are
 * enabled, available, have permissions granted, and whose last sync is stale.
 *
 * This is intentionally fire-and-forget from the caller's perspective;
 * the returned promise resolves once all connectors have been evaluated.
 *
 * @returns {Promise<void>}
 */
export async function triggerAutoSync() {
  debugInfo(TAG, 'triggerAutoSync called')
  await Promise.all(CONNECTORS.map((c) => syncConnector(c)))
}
