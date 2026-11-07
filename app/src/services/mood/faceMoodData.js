/**
 * Lecture IndexedDB des entrées de l'humeur estimée (budget de lectures D2) : toutes les rafales du visage, et les
 * notes de bien-être **seulement depuis le jour de la première rafale** — une note plus ancienne n'a aucune lecture
 * à qui être comparée (gateDays, calibration), la lire coûterait des années d'historique à chaque ouverture.
 */
import { listEntries } from '../../storage/localHealthStorage'
import { FACE_BURST_TYPE } from '../faceBursts'
import { GUT_TYPE } from '../today'
import { STOOL_TYPE } from '../stool'
import { localDateKey } from '../analysisEngine'
import { peekAnalysis } from '../analysisRunner'
import { estimateStatesFromEntries } from '../method/stateSpace'
import { faceMoodEstimate } from './faceMood'
import { faceMoodDays } from './faceMoodDays'
import { wellbeingHistory } from './wellbeingHistory'

export async function loadFaceMoodEntries({ list = listEntries, withStool = false } = {}) {
  const bursts = await list({ type: FACE_BURST_TYPE, limit: Infinity })
  if (!bursts.length) return { bursts, notes: [] }
  const first = bursts.reduce((min, b) => (b.at < min ? b.at : min), bursts[0].at)
  const since = new Date(first)
  since.setHours(0, 0, 0, 0)
  const [wellbeing, gut, stool] = await Promise.all([
    list({ type: 'wellbeing', since: since.toISOString(), limit: Infinity }),
    // Notes digestives et selles : observations du modèle à espace d'états (TS-1), lié au bien-être.
    list({ type: GUT_TYPE, since: since.toISOString(), limit: Infinity }),
    withStool ? list({ type: STOOL_TYPE, since: since.toISOString(), limit: Infinity }) : [],
  ])
  return { bursts, notes: [...wellbeing, ...(gut || []), ...(stool || [])] }
}

/**
 * TS-1 : estimation du bien-être du jour par le modèle à espace d'états (remplace VENTRE-BE-2). Le calcul complet de
 * Tendances (tâche `dayStates`) s'il est en cache pour ces données ; sinon, le même modèle sur les entrées déjà lues
 * par l'Accueil (depuis la première lecture du visage), sans relire la base. Seulement si le bien-être est observé
 * aujourd'hui (au moins 3 lectures ou une note) ; jamais l'attendu d'un jour sans donnée.
 * @returns {{ mean: number, low: number, high: number } | null}  échelle interne 0–5
 */
export function todayWellbeingState(entries, now = new Date(), cached = peekAnalysis('dayStates', now)) {
  try {
    const states = cached?.hit && cached.result ? cached.result : estimateStatesFromEntries(entries, { now, ahead: 0 })
    const today = localDateKey(now.toISOString())
    const day = states?.days?.find((d) => d.date === today && !d.future)
    const w = day?.observed?.wellbeing ? day.wellbeing : null
    return w && Number.isFinite(w.mean) ? { mean: w.mean, low: w.low, high: w.high } : null
  } catch {
    return null
  }
}

/**
 * Accueil « Aujourd'hui » : estimation du jour et jours estimés (courbe des 14 jours), ou null sans aucune rafale.
 * @returns {Promise<null | { est: object | null, days: { date: string, note: number }[] }>}
 */
export async function loadWellbeingToday({ list = listEntries, now = new Date() } = {}) {
  const { bursts, notes } = await loadFaceMoodEntries({ list, withStool: true })
  if (!bursts.length) return null
  const entries = [...bursts, ...notes]
  // AUJ-2 : la courbe du jour de l'Accueil, les mêmes points que la vue Jour de l'historique.
  return {
    est: faceMoodEstimate(entries, { now }),
    state: todayWellbeingState(entries, now),
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
