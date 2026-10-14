/**
 * Révision des données de santé : un compteur incrémenté à chaque écriture dans IndexedDB
 * (ajout, import, modification, suppression). Les calculs mis en cache (perf D2) s'y rattachent :
 * une révision différente = cache périmé.
 *
 * Gardé dans localStorage pour survivre aux redémarrages ; sans localStorage, le compteur vit en
 * mémoire et `isDataRevisionPersistent()` le dit (le cache persistant est alors désactivé).
 */
const KEY = 'healthtrack-data-revision'
let memoryRevision = 0

function readStored() {
  try {
    const raw = localStorage.getItem(KEY)
    const n = raw == null ? 0 : Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch {
    return null
  }
}

/** @returns {number} */
export function getDataRevision() {
  const stored = readStored()
  return stored == null ? memoryRevision : stored
}

/** @returns {boolean} vrai si la révision survit à un redémarrage de l'app */
export function isDataRevisionPersistent() {
  return readStored() != null
}

/** À appeler après chaque écriture réussie dans la base. */
export function bumpDataRevision() {
  const next = getDataRevision() + 1
  memoryRevision = next
  try {
    localStorage.setItem(KEY, String(next))
  } catch {
    /* localStorage indisponible : révision en mémoire seulement */
  }
  return next
}
