/**
 * Entrées utiles à la page Nutrition, lues par index (perf D2) au lieu de toute la base : repas de la
 * fenêtre récente, pas des 14 jours du profil d'activité, poids, taille et composition corporelle.
 */
import { listEntries } from '../storage/localHealthStorage'
import { getRecentWindowStart, RECENT_WINDOW_DAYS } from './nutritionIntakeCompare'
import { STEPS_WINDOW_DAYS } from './bodyProfile'

const ALL = Number.MAX_SAFE_INTEGER

export async function loadNutritionEntries(now = new Date()) {
  const stepsSince = new Date(now)
  stepsSince.setHours(0, 0, 0, 0)
  // un jour de marge : fuseaux et totaux journaliers datés de minuit
  stepsSince.setDate(stepsSince.getDate() - STEPS_WINDOW_DAYS - 1)
  const foodSince = getRecentWindowStart(RECENT_WINDOW_DAYS)
  foodSince.setDate(foodSince.getDate() - 1)
  const parts = await Promise.all([
    listEntries({ type: 'food', since: foodSince.toISOString(), limit: ALL }),
    listEntries({ type: 'steps', since: stepsSince.toISOString(), limit: ALL }),
    listEntries({ type: 'weight', limit: ALL }),
    listEntries({ type: 'height', limit: ALL }),
    listEntries({ type: 'body_composition', limit: ALL }),
  ])
  return parts.flat()
}
