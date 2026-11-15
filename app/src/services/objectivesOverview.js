/**
 * Onglet Objectifs, vue d'ensemble (refonte « Compagnon », étape 6a ; brief § 4, SPEC comprendre § 6.1 et § 6.2).
 * Fonction pure. Une carte par objectif : le score sur 5 des 7 derniers jours, sa tendance en mots et 7 barres.
 * Les valeurs sont celles de Tendances (modèle à espace d'états, TS-1 : un même objet, une seule mesure). Avant
 * 7 jours notés (bien-être) ou 14 (confort digestif), la carte dit combien il en reste, sans score.
 */
import { FIRST_SCORE_DAY } from '../config/firstResults'
import { buildTrendSeries, TREND_MIN_POINTS } from './trendsData'

/** Écart, en points sur 5, en dessous duquel la semaine est dite stable. */
export const TREND_STEP = 0.3

export const TREND_WORDS = {
  up: 'Plutôt en hausse cette semaine',
  down: 'Un peu en baisse cette semaine',
  flat: 'Plutôt stable cette semaine',
}

const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null)

/**
 * @param {'wellbeing'|'digestion'} key
 * @param {object|null} states sortie de la tâche `dayStates`
 * @returns {{ key, state: 'waiting'|'quiet'|'score', noted: number, need: number, daysLeft: number, weekNoted: number,
 *   score: number|null, trend: 'up'|'down'|'flat'|null, bars: Array<{ date: string, value: number|null, observed: boolean }> }}
 */
export function objectiveCard(key, states, now = new Date()) {
  const need = FIRST_SCORE_DAY[key]
  const noted = (states?.days || []).filter((d) => !d.future && d.observed?.[key]).length
  const { dates, today, series } = buildTrendSeries({ states, period: 'week', now })
  const byDate = new Map(series[key].filter((p) => !p.future).map((p) => [p.date, p]))
  const bars = dates.filter((d) => d <= today).map((date) => {
    const p = byDate.get(date)
    return { date, value: p ? p.value : null, observed: Boolean(p?.observed) }
  })
  const weekNoted = bars.filter((b) => b.observed).length
  const base = { key, noted, need, daysLeft: Math.max(0, need - noted), weekNoted, bars, score: null, trend: null }
  if (noted < need) return { ...base, state: 'waiting' }
  const values = bars.filter((b) => b.value != null)
  if (values.length < TREND_MIN_POINTS) return { ...base, state: 'quiet' }
  const before = mean(bars.slice(0, 4).filter((b) => b.value != null).map((b) => b.value))
  const recent = mean(bars.slice(4).filter((b) => b.value != null).map((b) => b.value))
  const gap = before != null && recent != null ? recent - before : null
  const trend = gap == null ? null : gap >= TREND_STEP ? 'up' : gap <= -TREND_STEP ? 'down' : 'flat'
  return { ...base, state: 'score', score: mean(values.map((b) => b.value)), trend }
}

/** Les cartes de l'onglet : le bien-être pour tout le monde, le confort digestif avec l'objectif. */
export function objectivesOverview(states, { gut = false, now = new Date() } = {}) {
  return ['wellbeing', ...(gut ? ['digestion'] : [])].map((key) => objectiveCard(key, states, now))
}
