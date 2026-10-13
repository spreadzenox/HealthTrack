/**
 * Montre Huawei en direct (chantier D3, étape d ter) : connexion à la montre appairée à Android et
 * resynchronisation automatique à l'ouverture de l'app (et au retour dans l'app), au plus toutes les
 * 30 min, seulement si HealthTrack a déjà une clé pour cette montre. Une seule connexion à la fois
 * (verrou partagé avec « Synchroniser la montre »). Les échecs espacent les essais (30 min → 4 h) ;
 * une clé refusée ou une méthode non prise en charge met l'automatique en pause jusqu'à la
 * prochaine connexion manuelle réussie. Ne lève jamais.
 */
import { registerPlugin } from '@capacitor/core'
import { connectAndAuthenticate, createKeyStore, findBondedWatch } from '../devices/huawei/pairing'
import { classicTransport, HONOR_RFCOMM_UUID, HUAWEI_RFCOMM_UUID } from '../devices/huawei/transports'
import { loadSetup } from '../devices/huawei/setup'
import { createWatchSync, getWatchSyncState } from './watchSync'
import { CURRENT_VERSION } from './updateCheck'

export const WATCH_AUTO_SYNC_MS = 30 * 60 * 1000
const MAX_BACKOFF_STEPS = 3 // 30 min × 2³ = 4 h
const STATE_KEY = 'healthtrack_watch_autosync'
/** Issues qui ne se corrigent pas seules : l'automatique attend une connexion manuelle. */
const PAUSING = ['key_rejected', 'pin_failed', 'need_secrets', 'unsupported']

const NativeBtClassic = registerPlugin('BtClassic')

const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

/** Plugin RFCOMM : faux plugin des captures (`npm run visual -- --ble=watch`), natif dans l'app, sinon aucun. */
export function classicPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeBtClassic) return window.__healthtrackFakeBtClassic
  return isNative() ? NativeBtClassic : null
}

/** État de la connexion automatique : { at, outcome, title, label, inserted, auto, failures, everConnected } ou {}. */
export function getWatchAutoSyncState(storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage?.getItem(STATE_KEY) || 'null')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

/** Retient l'issue d'une connexion (manuelle ou automatique) pour régler les essais suivants. */
export function recordWatchConnection(report, { auto = false, storage = globalThis.localStorage, now = () => Date.now() } = {}) {
  const prev = getWatchAutoSyncState(storage)
  const code = report?.outcome?.code || 'failed'
  const next = {
    at: new Date(now()).toISOString(),
    auto,
    outcome: code,
    title: report?.outcome?.title || null,
    label: report?.sync?.label || null,
    inserted: report?.sync?.inserted ?? null,
    failures: code === 'connected' ? 0 : (prev.failures || 0) + 1,
    everConnected: code === 'connected' || !!prev.everConnected,
  }
  try {
    storage?.setItem(STATE_KEY, JSON.stringify(next))
  } catch {
    /* stockage plein : l'essai suivant viendra un peu plus tôt */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('watch-sync-updated'))
  return next
}

/** Délai avant le prochain essai automatique : 30 min, doublé à chaque échec (4 h au plus). */
export const autoSyncInterval = (state) => WATCH_AUTO_SYNC_MS * 2 ** Math.min(state?.failures || 0, MAX_BACKOFF_STEPS)

export const isAutoSyncPaused = (state) => PAUSING.includes(state?.outcome)

let lock = null

/** Une seule connexion à la montre à la fois : attend la précédente avant de lancer `fn`. */
export async function withWatchLock(fn) {
  while (lock) await lock.catch(() => {})
  const run = (async () => fn())()
  lock = run
  try {
    return await run
  } finally {
    if (lock === run) lock = null
  }
}

export const isWatchBusy = () => lock !== null

/**
 * Connexion authentifiée (étape c) à la montre appairée à Android, en Bluetooth classique, puis
 * lecture des mesures (étape d). Lève si aucune montre n'est utilisable, sinon rend le rapport.
 */
export async function connectBondedWatch({
  classic = classicPlugin(),
  secrets = null,
  rebind = false,
  onUpdate,
  auto = false,
  keyStore,
  storage = globalThis.localStorage,
  connect = connectAndAuthenticate,
  watch: knownWatch = null,
  now = () => Date.now(),
} = {}) {
  if (!classic) throw new Error('Connexion possible seulement dans l’app Android.')
  return withWatchLock(async () => {
    const watch = knownWatch || (await findBondedWatch(classic))
    if (!watch) throw new Error('Aucune montre Huawei appairée à Android : suivez d’abord « Libérer et appairer la montre ».')
    const honor = /honor/i.test(watch.name) && (watch.uuids || []).map((u) => String(u).toLowerCase()).includes(HONOR_RFCOMM_UUID)
    const setupState = loadSetup(storage)
    const report = await connect({
      transport: classicTransport(classic, watch.deviceId, honor ? HONOR_RFCOMM_UUID : HUAWEI_RFCOMM_UUID),
      watchKey: watch.deviceId,
      watchName: watch.name,
      ...(keyStore ? { keyStore } : {}),
      secrets,
      rebind,
      accountId: setupState.choice === 'keep' ? setupState.accountId || null : null,
      onUpdate,
      appVersion: CURRENT_VERSION,
      sync: createWatchSync({ watchKey: watch.deviceId, watchName: watch.name, storage }),
    })
    recordWatchConnection(report, { auto, storage, now })
    return report
  })
}

/**
 * Resynchro automatique si elle est due. Rend { ran, reason?, outcome? } ; `reason` dit pourquoi
 * rien n'a été tenté (unavailable, busy, paused, recent, no_watch, not_paired, error).
 */
let autoInFlight = null

export function syncWatchIfStale(opts = {}) {
  // appels simultanés (Accueil + Analyses, retour dans l'app) : un seul essai
  if (autoInFlight) return autoInFlight
  autoInFlight = runIfStale(opts).finally(() => {
    autoInFlight = null
  })
  return autoInFlight
}

async function runIfStale({
  classic = classicPlugin(),
  storage = globalThis.localStorage,
  keyStore = createKeyStore(storage),
  now = () => Date.now(),
  connect = connectAndAuthenticate,
} = {}) {
  try {
    if (!classic) return { ran: false, reason: 'unavailable' }
    if (isWatchBusy()) return { ran: false, reason: 'busy' }
    const state = getWatchAutoSyncState(storage)
    if (isAutoSyncPaused(state)) return { ran: false, reason: 'paused' }
    const watch = await findBondedWatch(classic)
    if (!watch) return { ran: false, reason: 'no_watch' }
    if (!keyStore.get(watch.deviceId)?.authToken) return { ran: false, reason: 'not_paired' }
    const last = Math.max(Date.parse(state.at || '') || 0, Date.parse(getWatchSyncState(watch.deviceId, storage)?.at || '') || 0)
    if (now() - last < autoSyncInterval(state)) return { ran: false, reason: 'recent' }
    const report = await connectBondedWatch({ classic, watch, keyStore, storage, connect, now, auto: true })
    return { ran: true, outcome: report?.outcome?.code || null }
  } catch {
    // Bluetooth coupé, plugin absent (ancienne version) : on réessaiera à la prochaine ouverture
    return { ran: false, reason: 'error' }
  }
}

/** Phrase d'état pour la carte « Connexion à la montre », ou null s'il n'y a encore rien eu. */
export function describeAutoSync(state, { now = Date.now(), formatAgo } = {}) {
  // rien à dire tant que la montre n'a jamais été connectée (l'automatique ne tourne qu'avec une clé)
  if (!state?.at || !state.everConnected) return null
  const when = formatAgo(state.at, new Date(now))
  if (isAutoSyncPaused(state)) {
    return `Synchro automatique en pause : ${state.title || 'connexion refusée'} (${when}). Reconnectez la montre ci-dessus pour la relancer.`
  }
  if (state.outcome === 'connected') {
    return `Synchro automatique à chaque ouverture de l’app (au plus toutes les 30 min). Dernière : ${when}${state.label ? `, ${state.label}` : ''}.`
  }
  const retryMin = Math.round(autoSyncInterval(state) / 60000)
  const retry = retryMin >= 60 ? `${Math.round(retryMin / 60)} h` : `${retryMin} min`
  return `Dernière synchro ${state.auto ? 'automatique ' : ''}échouée (${when}) : ${state.title || 'montre injoignable'}. Nouvel essai à l’ouverture de l’app, dans ${retry} au plus tôt.`
}
