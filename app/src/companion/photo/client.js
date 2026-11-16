/**
 * L'envoi unique du selfie au relais (`POST /v1/pilou/style`, relay/src/pilou.js), sur le geste de la personne et
 * après son consentement. La photo part une fois, n'est gardée nulle part, et l'objet qui la porte est vidé dès la
 * réponse, ou au bout de 30 s sans réponse (PILOU-DOUBLE.md § 2.4). Il ne revient qu'une fiche de style.
 *
 * Plafond : 3 analyses par mois (le relais tient le sien ; celui-ci évite d'envoyer pour rien et l'affiche).
 */
import { postRelay } from '../../services/aiRelay.js'
import { normalizeStyle } from './style.js'

export const PILOU_STYLE_PATH = '/v1/pilou/style'
export const PHOTO_TIMEOUT_MS = 30_000
export const PHOTO_MONTHLY_CAP = 3
const MONTH_KEY = 'halcya_pilou_photo_month'

const monthOf = (ms) => new Date(ms).toISOString().slice(0, 7)

function readMonth(storage, now) {
  try {
    const saved = JSON.parse(storage.getItem(MONTH_KEY) || 'null')
    return saved?.month === monthOf(now) && Number.isInteger(saved.count) ? saved.count : 0
  } catch {
    return 0
  }
}

/** Analyses de photo qu'il reste ce mois-ci (3 au plus). */
export function photoAnalysesLeft({ now = Date.now(), storage = globalThis.localStorage } = {}) {
  return Math.max(0, PHOTO_MONTHLY_CAP - readMonth(storage, now))
}

function countAnalysis(storage, now, remaining) {
  const used = Number.isInteger(remaining) ? PHOTO_MONTHLY_CAP - remaining : readMonth(storage, now) + 1
  try {
    storage.setItem(MONTH_KEY, JSON.stringify({ month: monthOf(now), count: Math.min(PHOTO_MONTHLY_CAP, Math.max(0, used)) }))
  } catch {
    // stockage indisponible : le relais garde son plafond
  }
}

export const CAP_MESSAGE = 'Vous avez utilisé vos 3 analyses de photo du mois. Le Studio reste ouvert pour ajuster votre Pilou à la main.'

/**
 * Envoie le selfie et rend `{ style, remaining }`. `photo` est vidé (`data` effacé) quoi qu'il arrive.
 * @param {{ mimeType: string, data: string }} photo
 */
export async function analyzeSelfie(photo, { post = postRelay, now = Date.now(), storage = globalThis.localStorage, timeoutMs = PHOTO_TIMEOUT_MS } = {}) {
  try {
    if (photoAnalysesLeft({ now, storage }) <= 0) throw new Error(CAP_MESSAGE)
    const body = { image: { mimeType: photo.mimeType, data: photo.data } }
    // Une seule référence à la photo : celle de la requête, lâchée à la fin de l'appel
    photo.data = null
    const data = await post(body, { path: PILOU_STYLE_PATH, timeoutMs })
    body.image = null
    const remaining = Number.isInteger(data?.month?.remaining) ? data.month.remaining : null
    countAnalysis(storage, now, remaining)
    return { style: normalizeStyle(data.parsed), remaining: remaining ?? photoAnalysesLeft({ now, storage }) }
  } finally {
    photo.data = null
  }
}
