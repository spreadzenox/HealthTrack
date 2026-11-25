import { niceAxis } from './niceAxis'

/**
 * Écart minimal de l'axe par unité (POLISH-SIM-165) : 100 g de poids ne doivent pas ressembler à une forte montée.
 * Ordre de grandeur d'une variation qui compte sur quelques jours.
 */
export const MIN_SPAN = { kg: 2, bpm: 10, ms: 20, h: 2, pas: 2000 }

/**
 * Domaine et graduations d'une unité : 1 à 5 pour les notes, sinon les valeurs visibles avec une petite marge,
 * élargies à l'écart minimal de l'unité (centré sur les valeurs) puis étendues à des graduations rondes
 * (POLISH-SIM-3b : « 4 000 / 8 000 / 12 000 » plutôt que « 4 651 / 11 759 »).
 */
export function trendDomain(unit, values) {
  if (unit === '/5') return { lo: 1, hi: 5, ticks: [1, 3, 5] }
  if (!values.length) return { lo: 0, hi: 1, ticks: [0, 1] }
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  const pad = (hi - lo) * 0.05
  lo -= pad
  hi += pad
  const min = MIN_SPAN[unit] || 0
  if (hi - lo < min) {
    const mid = (lo + hi) / 2
    lo = mid - min / 2
    hi = mid + min / 2
  }
  if (lo < 0 && Math.min(...values) >= 0) {
    hi -= lo
    lo = 0
  }
  return niceAxis(lo, hi)
}
