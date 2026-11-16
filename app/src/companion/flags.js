/**
 * Interrupteur de la scène 3D de l'Accueil (refonte « Compagnon », étape 8). Allumé par défaut ; un réglage local
 * (`halcya.companion.scene` = `off`) l'éteint, sans rien effacer : l'Accueil redevient celui d'avant, sans canevas
 * ni import de three.js. C'est aussi le frein d'urgence si un téléphone se comporte mal.
 */
const KEY = 'halcya.companion.scene'

export function companionSceneEnabled() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setCompanionSceneEnabled(on) {
  try {
    if (on) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, 'off')
  } catch { /* stockage indisponible : on garde l'état par défaut */ }
}
