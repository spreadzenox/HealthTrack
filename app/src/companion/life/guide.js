/**
 * Pilou guide discret dans Objectifs (lot VIE, étape 12 ; specs/comprendre.SPEC.md § 6.1, § 6.2) : une phrase courte
 * d'après la carte Bien-être. Il ne réagit jamais à une baisse ou à l'attente par de la tristesse. Fonctions pures.
 */
import { objectiveCard } from '../../services/objectivesOverview'

/** @param {{ state: string, trend?: string|null, daysLeft?: number }|undefined} card la carte Bien-être */
export function guideLine(card) {
  if (!card) return { expr: 'tranquille', text: 'Je regarde vos semaines avec vous.' }
  if (card.state === 'waiting') {
    const n = card.daysLeft
    return { expr: 'curieux', text: `Encore ${n} jour${n > 1 ? 's' : ''} noté${n > 1 ? 's' : ''} pour votre premier score.` }
  }
  if (card.state === 'quiet') return { expr: 'tranquille', text: 'Notez votre bien-être quand vous voulez.' }
  if (card.trend === 'up') return { expr: 'content', text: 'Plutôt une bonne semaine.' }
  if (card.trend === 'down') return { expr: 'reconfortant', text: 'Une semaine plus chargée. Je reste près de vous.' }
  return { expr: 'tranquille', text: 'Une semaine plutôt régulière.' }
}

/** Le bien-être a son premier score (7 jours notés) : la cérémonie du jour 7 peut avoir lieu. */
export function wellbeingScoreReady(states, now = new Date()) {
  if (!states) return false
  return objectiveCard('wellbeing', states, now).state !== 'waiting'
}

/** Jours restants avant le premier score de la digestion (null : pas d'objectif digestion ou déjà là). */
export function digestionDaysLeft(states, gut, now = new Date()) {
  if (!gut || !states) return null
  const c = objectiveCard('digestion', states, now)
  return c.state === 'waiting' ? c.daysLeft : null
}
