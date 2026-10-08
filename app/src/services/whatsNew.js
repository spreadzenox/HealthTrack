/**
 * « Nouveautés » : suit la dernière entrée du journal des changements vue par
 * l'utilisateur, pour lui résumer ce qui a changé depuis sa dernière mise à jour.
 */

const STORAGE_KEY = 'healthtrack-whats-new-last-seen'

export function getLastSeenId() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * @param {Array<{ id: string }>} changelog  entrées triées de la plus récente à la plus ancienne
 * @param {string|null} lastSeenId
 */
export function getUnseenEntries(changelog, lastSeenId) {
  if (!lastSeenId) return changelog
  const idx = changelog.findIndex((e) => e.id === lastSeenId)
  return idx === -1 ? changelog : changelog.slice(0, idx)
}

export function markAllSeen(changelog) {
  if (!changelog.length) return
  try {
    localStorage.setItem(STORAGE_KEY, changelog[0].id)
  } catch {
    /* stockage indisponible : la bannière réapparaîtra, sans gravité */
  }
}
