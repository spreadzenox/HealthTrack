/**
 * Le selfie du double numérique, en mémoire seulement (PILOU-DOUBLE.md § 2.3) : caméra avant ouverte par
 * getUserMedia (la WebView demande l'autorisation caméra à ce moment-là, jamais avant le consentement), une image
 * prise sur un canevas, réduite à 512 px et ré-encodée en JPEG (le ré-encodage ne garde aucune métadonnée). Rien
 * n'est écrit sur le disque ni dans la galerie ; le canevas est vidé aussitôt.
 */
import { computeTargetSize } from '../../services/imagePrep.js'

export const SELFIE_MAX_SIDE = 512
const JPEG_QUALITY = 0.85

/** Ouvre la caméra avant (sans micro). Lève une Error lisible si elle est refusée ou absente. */
export async function openFrontCamera({ mediaDevices = globalThis.navigator?.mediaDevices } = {}) {
  if (!mediaDevices?.getUserMedia) throw new Error('La caméra n’est pas disponible sur cet appareil.')
  try {
    return await mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } } })
  } catch {
    throw new Error('La caméra n’a pas pu s’ouvrir. Vous pouvez faire votre Pilou à la main.')
  }
}

/** Coupe la caméra (voyant éteint). */
export function stopCamera(stream) {
  for (const track of stream?.getTracks?.() ?? []) track.stop()
}

/**
 * Prend une image de la vidéo : plus grand côté 512 px, JPEG ré-encodé. Rend `{ mimeType, data }` (base64).
 * @param {HTMLVideoElement | { videoWidth: number, videoHeight: number }} video
 */
export function captureSelfie(video, { doc = globalThis.document, maxSide = SELFIE_MAX_SIDE } = {}) {
  const size = computeTargetSize(video?.videoWidth, video?.videoHeight, maxSide)
  if (!size || !doc) throw new Error('La photo n’a pas pu être prise. Réessayez.')
  const canvas = doc.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('La photo n’a pas pu être prise. Réessayez.')
  try {
    ctx.drawImage(video, 0, 0, size.width, size.height)
    const url = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
    if (!url.startsWith('data:image/jpeg')) throw new Error('La photo n’a pas pu être prise. Réessayez.')
    return { mimeType: 'image/jpeg', data: url.slice(url.indexOf(',') + 1), width: size.width, height: size.height }
  } finally {
    // Rien ne reste dans le canevas
    ctx.clearRect(0, 0, size.width, size.height)
    canvas.width = 0
    canvas.height = 0
  }
}
