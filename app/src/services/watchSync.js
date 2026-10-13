/**
 * Synchronisation des mesures de la montre Huawei connectée en direct (chantier D3, étape d) :
 * relit la montre depuis la dernière synchro (7 jours la première fois), écrit les entrées dans
 * IndexedDB (sans doublon) et garde l'état de la dernière synchro par montre (localStorage).
 * Protocole : src/devices/huawei/sync.js.
 */
import { upsertEntries } from '../storage/localHealthStorage'
import { readWatchData, syncWindow, watchEntries } from '../devices/huawei/sync'

const KEY = 'healthtrack_watch_sync'

function readAll(storage) {
  try {
    const v = JSON.parse(storage?.getItem(KEY) || 'null')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

/** État de la dernière synchro d'une montre : { until, at, inserted, minutes, nights } ou null. */
export const getWatchSyncState = (watchKey, storage = globalThis.localStorage) => readAll(storage)[watchKey] || null

function setState(watchKey, state, storage) {
  try {
    storage?.setItem(KEY, JSON.stringify({ ...readAll(storage), [watchKey]: state }))
  } catch {
    /* stockage plein : la synchro suivante relira un peu plus */
  }
}

const plural = (n, one, many) => `${n.toLocaleString('fr-FR')} ${n > 1 ? many : one}`

/** Nombre de nuits distinctes (date de fin de chaque période). */
const countNights = (sleep) => new Set(sleep.map((p) => new Date(p.start + p.minutes * 60_000 - 12 * 3600_000).toDateString())).size

/**
 * Rend la fonction `sync(session, { log })` attendue par pairing.connectAndAuthenticate.
 */
export function createWatchSync({ watchKey, watchName, write = upsertEntries, storage = globalThis.localStorage, now = () => Date.now() } = {}) {
  return async (session, { log = () => {} } = {}) => {
    const t = now()
    const { since, until } = syncWindow(getWatchSyncState(watchKey, storage)?.until, t)
    log(`lecture du ${new Date(since).toISOString().slice(0, 16)} au ${new Date(until).toISOString().slice(0, 16)} (UTC)`)
    const data = await readWatchData(session, { since, until, now: t, log })
    const entries = watchEntries(data, { until, sourceName: watchName || 'Montre Huawei' })
    const result = entries.length ? await write(entries) : { inserted: 0 }
    const inserted = result?.inserted ?? 0
    const nights = countNights(data.sleep)
    setState(watchKey, { until, at: new Date(t).toISOString(), inserted, minutes: data.minutes.length, nights }, storage)
    if (inserted > 0 && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('health-entries-updated'))
    const parts = [plural(data.minutes.length, 'minute', 'minutes')]
    if (nights) parts.push(plural(nights, 'nuit', 'nuits'))
    return {
      label: `${parts.join(', ')} → ${plural(inserted, 'mesure', 'mesures')}`,
      inserted,
      minutes: data.minutes.length,
      nights,
      totals: data.totals,
      since: new Date(since).toISOString(),
      until: new Date(until).toISOString(),
    }
  }
}
