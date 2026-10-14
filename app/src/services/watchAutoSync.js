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
import { getBodyProfile } from './bodyProfile'
import { getBodySettings } from '../settings/bodySettings'
import { listEntries } from '../storage/localHealthStorage'

/** Profil envoyé à la montre (7/0x02) : taille, poids, âge, sexe connus de HealthTrack (lectures par index). */
export async function watchProfile() {
  const [weights, heights] = await Promise.all([listEntries({ type: 'weight' }), listEntries({ type: 'height' })])
  const p = await getBodyProfile([...weights, ...heights])
  return { heightCm: p.heightCm, weightKg: p.weightKg, age: p.age, sex: p.sex, birthYear: getBodySettings().birthYear ?? null }
}

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

/** État de la dernière connexion (manuelle ou automatique) : { at, outcome, title, label, inserted, battery, auto, failures, everConnected } ou {}. */
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
    battery: report?.battery ?? (code === 'connected' ? null : prev.battery ?? null),
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
      profile: watchProfile,
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
const plural = (n, one, many) => `${n.toLocaleString('fr-FR')} ${n > 1 ? many : one}`

/**
 * État de la montre en une ligne pour la carte : { tone: 'ok' | 'warn', title, text } ou null tant
 * qu'elle n'a jamais été connectée.
 */
export function describeWatchStatus(state, { now = Date.now(), formatAgo } = {}) {
  if (!state?.at || !state.everConnected) return null
  const when = formatAgo(state.at, new Date(now))
  if (isAutoSyncPaused(state)) {
    return { tone: 'warn', title: 'Synchro en pause', text: `${state.title || 'connexion refusée'} (${when}). « Synchroniser la montre » la relance.` }
  }
  if (state.outcome === 'connected') {
    const parts = []
    if (state.battery != null) parts.push(`batterie ${state.battery} %`)
    parts.push(`synchro ${when}`)
    if (state.inserted != null) parts.push(state.inserted > 0 ? `${plural(state.inserted, 'nouvelle mesure', 'nouvelles mesures')}` : 'rien de nouveau')
    return { tone: 'ok', title: 'Connectée', text: parts.join(' · ') }
  }
  const retryMin = Math.round(autoSyncInterval(state) / 60000)
  const retry = retryMin >= 60 ? `${Math.round(retryMin / 60)} h` : `${retryMin} min`
  return { tone: 'warn', title: 'Dernière synchro échouée', text: `${state.title || 'montre injoignable'} (${when}). Nouvel essai à l’ouverture de l’app, dans ${retry} au plus tôt.` }
}
