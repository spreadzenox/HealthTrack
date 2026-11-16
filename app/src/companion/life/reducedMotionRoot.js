/**
 * Pont entre le réglage « Mouvements réduits » de l'app (lot SCÈNE, CONTRAT.md § 6) et les styles du lot VIE : pose
 * `data-reduced-motion="on"` sur la racine quand le réglage est « Activé », pour que les animations CSS se coupent
 * comme avec le réglage du téléphone (`prefers-reduced-motion`, déjà suivi par les feuilles de style).
 */
import { bus, EVENTS } from '../bus'

/** Clé du réglage tenue par le lot SCÈNE (companion/motion.js) ; seule la valeur « on » est lue ici. */
const SETTING_KEY = 'halcya.companion.reducedMotion'

export function applyReducedMotion(on, root = globalThis.document?.documentElement) {
  if (!root) return
  if (on) root.dataset.reducedMotion = 'on'
  else delete root.dataset.reducedMotion
}

/** À l'ouverture puis à chaque changement ; rend la fonction d'arrêt. */
export function watchReducedMotion(target = bus) {
  let saved = null
  try {
    saved = globalThis.localStorage?.getItem(SETTING_KEY)
  } catch {
    saved = null
  }
  applyReducedMotion(saved === 'on')
  return target.on(EVENTS.REDUCED_MOTION_CHANGED, (p) => {
    let setting = null
    try {
      setting = globalThis.localStorage?.getItem(SETTING_KEY)
    } catch {
      setting = null
    }
    // « on » de l'app, ou valeur effective vraie : on coupe ; sinon le réglage du téléphone décide (media query)
    applyReducedMotion(setting === 'on' || (setting !== 'off' && !!p?.value))
  })
}
