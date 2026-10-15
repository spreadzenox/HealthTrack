/**
 * Montre en « appareil compagnon » d'Android (chantier D3 d quater, idée I72, étapes ① et ②) : après un geste
 * dans la boîte Android, le système prévient HealthTrack quand la montre se reconnecte au téléphone
 * (CompanionPlugin.java, WatchPresenceService.java), même app en arrière-plan, sans scan ni sondage. La
 * resynchro passe par `syncWatchIfStale` : mêmes règles (clé connue, 30 min au plus, pause après un refus),
 * donc jamais de reconnexions en rafale (PR GB 6367). App tuée : le client Java relit la montre lui-même
 * (BackgroundWatchSync.java, mêmes règles) et ses mesures sont rangées à l'ouverture suivante (watchCaptures.js).
 * Ne lève jamais, sauf `enableWatchPresence` (message pour l'utilisateur).
 */
import { registerPlugin } from '@capacitor/core'
import { syncWatchIfStale } from './watchAutoSync'
import { getBackgroundSync } from './watchCaptures'

const NativeCompanion = registerPlugin('Companion')

const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

/** Plugin natif dans l'app, faux plugin des captures (`npm run visual -- --companion`), sinon aucun. */
export function companionPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeCompanion) return window.__healthtrackFakeCompanion
  return isNative() ? NativeCompanion : null
}

const sameDevice = (a, b) => !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase()

/**
 * { supported, association: { id, deviceId, name } | null, last: { at (ISO), event, appearedCount } | null,
 * background: dernière relecture app fermée { at (ISO), battery } | null }
 */
export async function getWatchPresence({ plugin = companionPlugin(), watch = null, background = getBackgroundSync } = {}) {
  const none = { supported: false, association: null, last: null }
  if (!plugin) return none
  try {
    const s = await plugin.status()
    if (!s?.supported) return none
    const association = (s.associations || []).find((a) => sameDevice(a.deviceId, watch?.deviceId)) || null
    const last = s.last?.at ? { at: new Date(s.last.at).toISOString(), event: s.last.event || null, appearedCount: s.last.appearedCount ?? 0 } : null
    const bg = association ? await background({ deviceId: watch?.deviceId }) : null
    const relued = bg?.lastSuccessAt > 0 ? { at: new Date(bg.lastSuccessAt).toISOString(), battery: bg.battery >= 0 ? bg.battery : null } : null
    return { supported: true, association, last, background: relued }
  } catch {
    return none
  }
}

/** Boîte Android « Autoriser HealthTrack à gérer la montre ? » ; rend { associated, id } ou lève (refus, annulation). */
export async function enableWatchPresence({ plugin = companionPlugin(), watch = null } = {}) {
  if (!plugin) throw new Error('Possible seulement dans l’app, sur Android 13 ou plus.')
  if (!watch?.deviceId) throw new Error('Aucune montre appairée à Android.')
  return plugin.associate({ deviceId: watch.deviceId, name: watch.name || null })
}

/** Ligne de la carte montre : { enabled, text } ou null quand Android ne le permet pas. */
export function describePresence(presence, { now = Date.now(), formatAgo } = {}) {
  if (!presence?.supported) return null
  if (!presence.association) {
    return { enabled: false, text: 'Synchro dès que la montre se reconnecte au téléphone, même app en arrière-plan.' }
  }
  const parts = ['Synchro dès que la montre se reconnecte au téléphone']
  if (presence.last?.at) {
    const verb = presence.last.event === 'disappeared' ? 'déconnectée' : 'reconnectée'
    parts.push(`${verb} ${formatAgo(presence.last.at, new Date(now))}`)
  }
  if (presence.background?.at) parts.push(`relue app fermée ${formatAgo(presence.background.at, new Date(now))}`)
  return { enabled: true, text: parts.join(' · ') }
}

let listening = null

/** Écoute unique des événements de présence ; rend true si l'écoute est en place. */
export function listenWatchPresence({ plugin = companionPlugin(), sync = syncWatchIfStale } = {}) {
  if (!plugin?.addListener) return Promise.resolve(false)
  if (listening) return listening
  const notify = () => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('watch-presence-updated'))
  }
  listening = (async () => {
    try {
      await plugin.addListener('watchPresence', async (e) => {
        notify()
        if (e?.event === 'appeared') await sync()
      })
      await plugin.addListener('companionAssociated', notify)
      return true
    } catch {
      listening = null
      return false
    }
  })()
  return listening
}

/** Tests seulement. */
export function resetPresenceListener() {
  listening = null
}
