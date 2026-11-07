/**
 * Échelle visible du bien-être : de 1 à 5, avec un milieu (3) (TESTEUR-2a, retours du testeur iPhone du 06/11).
 *
 * Les notes, estimations et analyses restent stockées et calculées sur l'échelle interne de 0 à 5 : aucune donnée
 * n'est réécrite, les anciennes notes et les anciens exports restent lisibles tels quels. Seuls l'affichage et la
 * saisie passent par cette conversion linéaire et réversible (sans perte) :
 *   affiché = 1 + 0,8 × interne      (0 → 1, 2,5 → 3, 5 → 5)
 * Les cinq choix de la saisie tombent sur 0 ; 1,25 ; 2,5 ; 3,75 ; 5 en interne : le milieu (3) est le vrai milieu.
 */

export const NOTE_CHOICES = [1, 2, 3, 4, 5]
export const NOTE_MIDDLE = 3

const SLOPE = 0.8

/** Valeur interne (0–5) → valeur affichée (1–5). null si absente. */
export function toDisplay(score) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return null
  return 1 + SLOPE * score
}

/** Valeur affichée (1–5) → valeur interne (0–5). Inverse exacte de toDisplay. */
export function fromDisplay(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return (value - 1) / SLOPE
}

/** Un écart en points sur l'échelle interne → le même écart en points sur l'échelle affichée. */
export function gapToDisplay(gap) {
  if (typeof gap !== 'number' || !Number.isFinite(gap)) return null
  return SLOPE * gap
}

/** Choix 1 à 5 de la saisie → note stockée (0–5). */
export function choiceToScore(choice) {
  if (!NOTE_CHOICES.includes(choice)) return null
  return fromDisplay(choice)
}

/** Note stockée (0–5, ancienne ou nouvelle) → le choix 1 à 5 le plus proche, pour pré-remplir la saisie. */
export function scoreToChoice(score) {
  const d = toDisplay(score)
  if (d == null) return null
  return Math.min(5, Math.max(1, Math.round(d)))
}

/** « 3,4 » : valeur interne affichée sur 1–5 à une décimale (entier sans décimale). */
export function formatNote(score, digits = 1) {
  const d = toDisplay(score)
  if (d == null) return ''
  const r = Number(d.toFixed(digits))
  return Number.isInteger(r) ? String(r) : r.toFixed(digits).replace('.', ',')
}
