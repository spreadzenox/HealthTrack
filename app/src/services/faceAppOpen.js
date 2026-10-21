/**
 * Lecture du visage à l'ouverture de l'app (variante play, journal/PLAY-CONFORMITE.md option B) : sans service caméra
 * en arrière-plan, la lecture n'a lieu que quand vous ouvrez HealthTrack (ou y revenez), app à l'écran, si vous l'avez
 * activée. Un bandeau la signale pendant toute la capture (`FACE_READ_EVENT`, FaceReadIndicator) : rien ne se passe
 * sans que vous regardiez l'écran. Le natif garde ses propres garde-fous (une lecture par demi-heure, 12 par jour,
 * pas pendant un appel) ; ce module évite seulement d'afficher le bandeau quand une lecture vient d'avoir lieu.
 * En sideload, rien : le service lit au déverrouillage.
 */
import { FEATURES } from '../config/distribution'
import { faceSensePlugin, isFaceSenseEnabled, readFaceNow } from './faceSense'

/** Événement window : { phase: 'start' } puis { phase: 'end', outcome }. */
export const FACE_READ_EVENT = 'healthtrack-face-read'
/** Même intervalle que le natif (FaceSchedule.APP_OPEN_MIN_INTERVAL_MS). */
export const APP_OPEN_INTERVAL_MS = 30 * 60 * 1000
const KEY = 'healthtrack_face_app_open'

let inFlight = null

function lastTry(storage) {
  try {
    return Number(storage?.getItem(KEY)) || 0
  } catch {
    return 0
  }
}

function emit(detail) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(FACE_READ_EVENT, { detail }))
}

/**
 * Une lecture si la variante et l'interrupteur le permettent ; rend le résultat du natif (« face »,
 * « skip:… »…) ou null si rien n'a été tenté. Ne lève jamais ; une seule lecture à la fois.
 */
export function readFaceOnOpen({
  enabled = FEATURES.faceAppOpen,
  plugin = faceSensePlugin(),
  storage = globalThis.localStorage,
  now = Date.now(),
  visible = () => typeof document === 'undefined' || document.visibilityState === 'visible',
} = {}) {
  if (!enabled || !plugin?.readNow || !isFaceSenseEnabled(storage) || !visible()) return Promise.resolve(null)
  if (inFlight) return inFlight
  const last = lastTry(storage)
  if (last && now - last >= 0 && now - last < APP_OPEN_INTERVAL_MS) return Promise.resolve(null)
  try {
    storage?.setItem(KEY, String(now))
  } catch {
    /* stockage indisponible : le natif garde son propre intervalle */
  }
  emit({ phase: 'start' })
  inFlight = readFaceNow(plugin).then((outcome) => {
    emit({ phase: 'end', outcome })
    return outcome
  }).finally(() => {
    inFlight = null
  })
  return inFlight
}
