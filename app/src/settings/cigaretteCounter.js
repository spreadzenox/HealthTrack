/**
 * Bouton « + 1 cigarette » de l'accueil (nettoyage du 12/10/2026) : il n'apparaît plus pour tout
 * le monde, seulement si une cigarette a été notée récemment — ou si l'utilisateur l'a demandé
 * dans Paramètres (premier usage, fumeur occasionnel). Stocké dans localStorage.
 */

const KEY = 'healthtrack_cigarette_counter'

export function isCigaretteCounterPinned() {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

export function setCigaretteCounterPinned(pinned) {
  try {
    if (pinned) localStorage.setItem(KEY, 'on')
    else localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

/** Affiché si demandé, ou si une cigarette figure dans les entrées récentes chargées par l'accueil. */
export function shouldShowCigaretteCounter(recentEntries) {
  return isCigaretteCounterPinned() || recentEntries.some((e) => e.type === 'cigarette')
}
