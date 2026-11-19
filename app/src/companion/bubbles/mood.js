/**
 * Jauge « Humeur de Pilou » (titre avec le nom choisi : c’est l’humeur du compagnon, pas celle de la personne, POLISH-SIM-109) (refonte « Compagnon », étape 10 ; brief § 4 et § 5, specs/ile.SPEC.md § 3 et § 12).
 * Elle dit le fait d'avoir noté, jamais le contenu : chaque geste du jour la fait monter, « Oui » comme « Non ».
 * Plancher « Tranquille » ; elle ne redescend jamais dans la journée (une saisie annulée ne la fait pas baisser) :
 * le plus haut cran atteint est gardé pour la date du jour, sur le téléphone seulement.
 */
import { localDateKey } from '../../services/analysisEngine'

export const MOOD_WORDS = ['Tranquille', 'De bonne humeur', 'Content', 'Ravi', 'Rayonnant']
export const MOOD_TOP = MOOD_WORDS.length - 1

const KEY = 'halcya.companion.moodDay'

/**
 * Cran tiré des gestes du jour : 0 sans rien, le plus haut quand tout est noté ; le premier geste fait toujours
 * monter d'un cran.
 */
export function moodLevel(done, total) {
  if (!total || done <= 0) return 0
  return Math.min(MOOD_TOP, Math.ceil((Math.min(done, total) / total) * MOOD_TOP))
}

/** Part de la jauge remplie (0 à 1) pour un cran : le plancher garde un peu de couleur. */
export function moodFill(level) {
  return 0.2 + (0.8 * Math.max(0, Math.min(MOOD_TOP, level))) / MOOD_TOP
}

function read(storage) {
  try {
    return JSON.parse(storage?.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

/**
 * Cran affiché : le plus haut du jour entre celui d'avant et celui des gestes ; gardé pour la journée.
 * @returns {{ level: number, word: string, fill: number, rose: boolean }} `rose` : il vient de monter
 */
export function dayMood(done, total, { now = new Date(), storage = globalThis.localStorage } = {}) {
  const day = localDateKey(now.toISOString())
  const saved = read(storage)
  const before = saved?.day === day && Number.isInteger(saved.level) ? saved.level : 0
  const level = Math.max(before, moodLevel(done, total))
  if (level !== before || saved?.day !== day) {
    try {
      storage?.setItem(KEY, JSON.stringify({ day, level }))
    } catch {
      // stockage plein ou absent : la jauge reste juste pour cet affichage
    }
  }
  return { level, word: MOOD_WORDS[level], fill: moodFill(level), rose: level > before }
}
