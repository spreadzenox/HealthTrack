/**
 * Import des captures du client Java « synchro seule » (chantier D3 d quater ③ d, huawei.md §9.1) : quand la
 * montre a été relue app tuée, ses réponses brutes attendent dans le stockage privé de l'app
 * (WatchCapturePlugin.java) ; à l'ouverture, elles sont décodées par les analyseurs de la synchro en direct,
 * écrites sans doublon, puis retirées. Une capture illisible est retirée aussi (elle ne se lira jamais) ; une
 * écriture qui échoue laisse la capture pour la prochaine ouverture. Ne lève jamais.
 */
import { registerPlugin } from '@capacitor/core'
import { importWatchCapture, SYNC_STATE_VERSION } from './watchSync'
import { isValidCapture } from '../devices/huawei/capture'

const NativeCapture = registerPlugin('WatchCapture')

const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

/** Plugin natif dans l'app, faux plugin des tests, sinon aucun. */
export function capturePlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeWatchCapture) return window.__healthtrackFakeWatchCapture
  return isNative() ? NativeCapture : null
}

/** Clé de synchro de la montre (adresse telle que le JS la connaît, casse comprise) : celle de l'état déjà gardé si elle existe. */
function watchKeyFor(address, storage) {
  try {
    const known = Object.keys(JSON.parse(storage?.getItem('healthtrack_watch_sync') || '{}') || {})
    return known.find((k) => k.toLowerCase() === String(address).toLowerCase()) || address
  } catch {
    return address
  }
}

/**
 * Importe les captures en attente. Rend { imported, inserted, dropped, kept, reports } (des nombres, et un
 * rapport par capture importée pour le journal).
 */
export async function importPendingCaptures({ plugin = capturePlugin(), storage = globalThis.localStorage, importCapture = importWatchCapture, log = () => {} } = {}) {
  const out = { imported: 0, inserted: 0, dropped: 0, kept: 0, reports: [] }
  if (!plugin?.list) return out
  let items = []
  try {
    items = (await plugin.list())?.captures || []
  } catch {
    return out
  }
  const done = []
  for (const item of items) {
    let capture = null
    try {
      capture = JSON.parse(item.json)
    } catch {
      capture = null
    }
    if (!isValidCapture(capture) || !capture.address) {
      out.dropped++
      done.push(item.name)
      continue
    }
    try {
      const report = await importCapture(capture, { watchKey: watchKeyFor(capture.address, storage), watchName: capture.name || null, storage, log })
      out.imported++
      out.inserted += report?.inserted ?? 0
      out.reports.push(report)
      done.push(item.name)
    } catch (e) {
      out.kept++
      log(`capture ${item.name} gardée pour plus tard : ${e?.message || e}`, 'warn')
    }
  }
  if (done.length) {
    try {
      await plugin.remove({ names: done })
    } catch {
      /* retirées à la prochaine ouverture : l'import est sans doublon */
    }
  }
  return out
}

/**
 * Où en est la relecture app tuée (BackgroundWatchSync.java) pour `deviceId` : { busy, lastSuccessAt, lastAttemptAt,
 * paused, outcome, battery, failures, lastDecision, lastTrigger, periodic } (horodatages en ms) ou null (hors de l'app, ancienne version).
 */
export async function getBackgroundSync({ deviceId, plugin = capturePlugin() } = {}) {
  if (!deviceId || !plugin?.background) return null
  try {
    return (await plugin.background({ deviceId })) || null
  } catch {
    return null
  }
}

/**
 * Recopie au natif la reprise de la dernière synchro du JS (état `healthtrack_watch_sync` de la montre), pour que la
 * relecture app tuée lise la même fenêtre et respecte les 30 min. Rend true si le natif l'a reçue.
 */
export async function shareResumeWithNative({ deviceId, state, plugin = capturePlugin() } = {}) {
  const at = Date.parse(state?.at || '')
  if (!deviceId || !plugin?.shareResume || !Number.isFinite(at)) return false
  try {
    // fichiers 0x2C déjà lus une fois par l'app : le lecteur en arrière-plan les relit depuis là (M6)
    const files = {
      ...(state.sleepFileUntil > 0 ? { sleepFileUntil: state.sleepFileUntil } : {}),
      ...(state.stressFileUntil > 0 ? { stressFileUntil: state.stressFileUntil } : {}),
      ...(typeof state.sleepBedTime === 'boolean' ? { sleepBedTime: state.sleepBedTime } : {}),
    }
    await plugin.shareResume({ deviceId, until: state.v === SYNC_STATE_VERSION && state.until > 0 ? state.until : 0, at, ...files })
    return true
  } catch {
    return false
  }
}

/**
 * Demande à Android (13+) d'autoriser les notifications de l'app : la seule est « synchro de la montre en pause »
 * quand la montre refuse la clé app fermée (WatchNotifications.java). Rend true si la demande a pu partir.
 */
export async function requestWatchNotifications({ plugin = capturePlugin() } = {}) {
  if (!plugin?.requestNotifications) return false
  try {
    await plugin.requestNotifications()
    return true
  } catch {
    return false
  }
}
