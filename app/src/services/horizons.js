import { GUT_WINDOWS } from './gutWindows'

/**
 * ANALYSES-ONGLETS-3 (retour (4) du propriétaire, 04/11) : trois horizons d'effet, chacun lisible. Une piste est
 * rangée selon le délai qu'elle compare ; rien n'est recalculé ici.
 */
export const HORIZONS = [
  { id: 'hours', title: 'Dans les heures', hint: 'Entre un repas et votre digestion, jusqu’à 24 h après.' },
  { id: 'days', title: 'Sur quelques jours', hint: 'Le jour même, ou jusqu’à 3 jours après.' },
  { id: 'weeks', title: 'Sur quelques semaines', hint: 'D’une semaine à l’autre.' },
]

/** Repas → ventre : une fenêtre qui finit avant 24 h compte « dans les heures », le reste « sur quelques jours ». */
export function gutLinkHorizon(link) {
  if (link?.kind !== 'window') return 'days'
  const w = GUT_WINDOWS.find((win) => win.id === link.when)
  return w && w.toH <= 24 ? 'hours' : 'days'
}

/** Groupes non vides, dans l'ordre des horizons ; l'ordre des pistes dans un groupe est gardé. */
export function groupByHorizon(items, horizonOf) {
  return HORIZONS.map((horizon) => ({ horizon, items: items.filter((it) => horizonOf(it) === horizon.id) }))
    .filter((g) => g.items.length > 0)
}
