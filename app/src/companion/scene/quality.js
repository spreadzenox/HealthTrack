/**
 * Paliers de qualité de la scène (brief § 7.9, SPEC île § 11). Fonctions pures, testées.
 *
 * - `initialTier` : un premier choix d'après ce que l'appareil dit de lui (WebGL, économie de données, mémoire).
 * - `createFrameMeter` : mesure le temps d'image pendant les 2 premières secondes de rendu et descend d'un palier si
 *   la moyenne dépasse 33 ms (directement au palier bas si elle dépasse le double) ; à n'importe quel moment, 30 images
 *   de suite au-dessus de 40 ms → palier bas (image fixe). Un appareil très lent (5 premières images à plus de 100 ms
 *   en moyenne) passe tout de suite à l'image fixe, sans bloquer l'écran pendant la mesure.
 */
export const TIERS = ['haut', 'moyen', 'bas']

/** Réglages de rendu par palier (brief § 7.9). */
export const TIER_SETTINGS = {
  haut: { maxDpr: 2, tufts: 600, envSize: 128, physical: true, sheen: true, shadowBlob: true, dust: 24 },
  moyen: { maxDpr: 1.5, tufts: 300, envSize: 64, physical: true, sheen: false, shadowBlob: true, dust: 0 },
  bas: { maxDpr: 1, tufts: 0, envSize: 0, physical: false, sheen: false, shadowBlob: true, dust: 0 },
}

export function lowerTier(tier) {
  const i = TIERS.indexOf(tier)
  return TIERS[Math.min(TIERS.length - 1, Math.max(0, i) + 1)]
}

/**
 * @param {{ webgl?: boolean, saveData?: boolean, deviceMemory?: number, cores?: number, forced?: string }} env
 */
export function initialTier({ webgl = true, saveData = false, deviceMemory, cores, forced } = {}) {
  if (forced && TIERS.includes(forced)) return forced
  if (!webgl || saveData) return 'bas'
  if ((deviceMemory != null && deviceMemory <= 2) || (cores != null && cores <= 4)) return 'moyen'
  return 'haut'
}

/**
 * @param {{ windowMs?: number, budgetMs?: number, slowMs?: number, slowFrames?: number }} opts
 * `push(frameMs)` rend `null` ou une décision `{ tier, reason, frameMs }` quand il faut changer de palier.
 */
export function createFrameMeter({ windowMs = 2000, budgetMs = 33, slowMs = 40, slowFrames = 30, quickFrames = 5, quickMs = 100 } = {}) {
  let elapsed = 0
  let sum = 0
  let n = 0
  let measured = false
  let slowRun = 0
  let average = null
  return {
    push(frameMs, tier) {
      if (!(frameMs >= 0) || tier === 'bas') return null
      slowRun = frameMs > slowMs ? slowRun + 1 : 0
      if (slowRun >= slowFrames) {
        slowRun = 0
        return { tier: 'bas', reason: 'mesure', frameMs }
      }
      if (measured) return null
      elapsed += frameMs
      sum += frameMs
      n += 1
      if (n === quickFrames && sum / n > quickMs) {
        measured = true
        average = sum / n
        return { tier: 'bas', reason: 'mesure', frameMs: average }
      }
      if (elapsed < windowMs) return null
      measured = true
      average = sum / n
      if (average > budgetMs * 2) return { tier: 'bas', reason: 'mesure', frameMs: average }
      if (average > budgetMs) return { tier: lowerTier(tier), reason: 'mesure', frameMs: average }
      return null
    },
    /** Nouvelle fenêtre de mesure (après un changement de palier). */
    reset() {
      elapsed = 0
      sum = 0
      n = 0
      measured = false
      slowRun = 0
    },
    get average() {
      return average
    },
  }
}

/** Densité de pixels du canevas : celle de l'écran, plafonnée par le palier. */
export function pixelRatioFor(tier, devicePixelRatio = 1) {
  return Math.min(devicePixelRatio || 1, TIER_SETTINGS[tier]?.maxDpr ?? 1)
}
