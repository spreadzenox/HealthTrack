/**
 * Lecture IndexedDB des entrées de l'humeur estimée (budget de lectures D2) : toutes les rafales du visage, et les
 * notes de bien-être **seulement depuis le jour de la première rafale** — une note plus ancienne n'a aucune lecture
 * à qui être comparée (gateDays, calibration), la lire coûterait des années d'historique à chaque ouverture.
 */
import { listEntries } from '../../storage/localHealthStorage'
import { FACE_BURST_TYPE } from '../faceBursts'
import { GUT_TYPE } from '../today'
import { faceMoodEstimate } from './faceMood'
import { faceMoodDays } from './faceMoodDays'
import { wellbeingHistory } from './wellbeingHistory'

export async function loadFaceMoodEntries({ list = listEntries } = {}) {
  const bursts = await list({ type: FACE_BURST_TYPE, limit: Infinity })
  if (!bursts.length) return { bursts, notes: [] }
  const first = bursts.reduce((min, b) => (b.at < min ? b.at : min), bursts[0].at)
  const since = new Date(first)
  since.setHours(0, 0, 0, 0)
  const [wellbeing, gut] = await Promise.all([
    list({ type: 'wellbeing', since: since.toISOString(), limit: Infinity }),
    // Notes du ventre : gêne et douleur ajustent un peu le bien-être du jour (VENTRE-BE-2).
    list({ type: GUT_TYPE, since: since.toISOString(), limit: Infinity }),
  ])
  return { bursts, notes: [...wellbeing, ...(gut || [])] }
}

/**
 * Accueil « Aujourd'hui » : estimation du jour et jours estimés (courbe des 14 jours), ou null sans aucune rafale.
 * @returns {Promise<null | { est: object | null, days: { date: string, note: number }[] }>}
 */
export async function loadWellbeingToday({ list = listEntries, now = new Date() } = {}) {
  const { bursts, notes } = await loadFaceMoodEntries({ list })
  if (!bursts.length) return null
  const entries = [...bursts, ...notes]
  // AUJ-2 : la courbe du jour de l'Accueil, les mêmes points que la vue Jour de l'historique.
  return {
    est: faceMoodEstimate(entries, { now }),
    days: faceMoodDays(entries),
    today: wellbeingHistory(entries, { period: 'day', now }),
  }
}

/**
 * « Historique du bien-être » (POL-2) : la période demandée, même avec des notes seules (sans aucune rafale).
 * @param {{ period?: 'day'|'week'|'month', now?: Date }} [opts]
 */
export async function loadWellbeingHistory({ list = listEntries, period = 'week', now = new Date() } = {}) {
  const { bursts, notes } = await loadFaceMoodEntries({ list })
  const since = new Date(now.getTime() - 31 * 86400000).toISOString()
  // Sans rafale, les notes du mois sont lues quand même : elles ont leur place sur la courbe.
  const manual = bursts.length ? notes : await list({ type: 'wellbeing', since, limit: Infinity })
  return wellbeingHistory([...bursts, ...manual], { period, now })
}

/**
 * Analyses → Tendances (signalement du 05/11) : la même série que l'historique du bien-être et la carte de l'Accueil,
 * sur les 14 derniers jours et sur aujourd'hui, en une seule lecture de la base.
 * @returns {Promise<{ days: ReturnType<typeof wellbeingHistory>, today: ReturnType<typeof wellbeingHistory> }>}
 */
export async function loadWellbeingTrends({ list = listEntries, now = new Date() } = {}) {
  const { bursts, notes } = await loadFaceMoodEntries({ list })
  const since = new Date(now.getTime() - 31 * 86400000).toISOString()
  const manual = bursts.length ? notes : await list({ type: 'wellbeing', since, limit: Infinity })
  const entries = [...bursts, ...manual]
  return {
    days: wellbeingHistory(entries, { period: 'fortnight', now }),
    today: wellbeingHistory(entries, { period: 'day', now }),
  }
}
