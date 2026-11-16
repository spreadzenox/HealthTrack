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

/**
 * Note que le bandeau met en titre (REFONTE-UPG-2) : une note marquée `aLaUne` parmi les non lues passe devant les
 * plus récentes (un testeur qui arrive d'avant la refonte doit d'abord lire la nouvelle navigation), sinon la plus
 * récente.
 * @param {Array<{ aLaUne?: boolean }>} unseen  notes non lues, de la plus récente à la plus ancienne
 */
export function bannerHeadline(unseen) {
  return unseen.find((e) => e.aLaUne) ?? unseen[0] ?? null
}
