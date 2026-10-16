/**
 * Entrées déclarées de l'estimateur d'humeur (règle anti-circularité, directive D5 du propriétaire).
 *
 * Y = l'humeur, estimée uniquement à partir de signaux émotionnels directs : expressions du visage,
 * voix, et ce que l'utilisateur déclare lui-même (note de bien-être, « Stress » ressenti).
 * X = comportements et contexte (sommeil, activité, écran, alimentation, météo…), qui servent
 * seulement à expliquer Y. Une variable listée ici ne doit jamais apparaître parmi les facteurs des
 * Analyses, des liens décalés ni des tags comparés au bien-être : `antiCircularity.test.js` y veille.
 *
 * Choix documenté : l'usage des réseaux sociaux (temps, apps) est un X — il peut expliquer l'humeur,
 * il ne sert pas à l'estimer. La capacité « émotion » d'une montre, si elle est lue un jour, est un X
 * aussi (c'est une estimation physiologique, pas un signal émotionnel direct).
 */

export const ESTIMATOR_INPUTS = [
  {
    key: 'selfReport',
    label: 'Ce que vous déclarez',
    columns: ['wellbeing'],
    tags: ['stress'],
  },
  {
    key: 'face',
    label: 'Expressions du visage',
    prefix: 'face_',
  },
  {
    key: 'voice',
    label: 'Voix (timbre, prosodie)',
    prefix: 'voice_',
  },
]

export const ESTIMATOR_COLUMNS = ESTIMATOR_INPUTS.flatMap((i) => i.columns ?? [])
export const ESTIMATOR_TAGS = ESTIMATOR_INPUTS.flatMap((i) => i.tags ?? [])
const PREFIXES = ESTIMATOR_INPUTS.map((i) => i.prefix).filter(Boolean)

/** Vrai si `name` (colonne du jeu de données ou identifiant de tag) sert à estimer l'humeur. */
export function isEstimatorInput(name) {
  return ESTIMATOR_COLUMNS.includes(name) || ESTIMATOR_TAGS.includes(name) || PREFIXES.some((p) => name.startsWith(p))
}
