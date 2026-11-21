/**
 * Images fixes de la scène (palier bas, et attente du premier rendu) : une par étape de croissance de l'îlot et par
 * saison, plus le soir (ciel étoilé, Pilou éveillé) et la nuit. Rendues par scripts/companion/render-scene-stills.mjs depuis le banc de la scène.
 * Étapes (world/growth.js) : 0 (îlot nu), 30 (îlot voisin), 90 jours d'usage (mare). Les cadeaux (arbuste, puis petit
 * arbre à 45 jours) ne sont pas dans les images : ils dépendent de chacun.
 */
export const STILL_STAGES = [0, 30, 90]
export const STILL_SEASONS = ['printemps-ete', 'automne', 'hiver', 'fin-hiver']

export function stillStage(days) {
  const d = Number(days)
  if (!Number.isFinite(d)) return 0
  return STILL_STAGES.reduce((best, s) => (d >= s ? s : best), 0)
}

export function stillName(days, season) {
  return `j${days}-${season}`
}

/** Nom de l'image à montrer (sans extension). */
export function stillKey({ days, season, night = false, evening = false } = {}) {
  if (night) return 'nuit'
  if (evening) return 'soir'
  return stillName(stillStage(days), STILL_SEASONS.includes(season) ? season : 'printemps-ete')
}
