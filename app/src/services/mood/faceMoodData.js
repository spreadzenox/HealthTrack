/**
 * Lecture IndexedDB des entrées de l'humeur estimée (budget de lectures D2) : toutes les rafales du visage, et les
 * notes de bien-être **seulement depuis le jour de la première rafale** — une note plus ancienne n'a aucune lecture
 * à qui être comparée (gateDays, calibration), la lire coûterait des années d'historique à chaque ouverture.
 */
import { listEntries } from '../../storage/localHealthStorage'
import { FACE_BURST_TYPE } from '../faceBursts'

export async function loadFaceMoodEntries({ list = listEntries } = {}) {
  const bursts = await list({ type: FACE_BURST_TYPE, limit: Infinity })
  if (!bursts.length) return { bursts, notes: [] }
  const first = bursts.reduce((min, b) => (b.at < min ? b.at : min), bursts[0].at)
  const since = new Date(first)
  since.setHours(0, 0, 0, 0)
  const notes = await list({ type: 'wellbeing', since: since.toISOString(), limit: Infinity })
  return { bursts, notes }
}
