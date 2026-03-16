/**
 * Formatage des dates pour l'affichage (entrées, repas).
 * @param {string} at - Date ISO ou valeur affichable
 * @returns {string}
 */
export function formatAt(at) {
  if (!at) return ''
  try {
    const d = new Date(at)
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return at
  }
}
