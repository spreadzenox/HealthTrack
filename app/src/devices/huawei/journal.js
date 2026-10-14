/**
 * Journal de la carte « Montre Huawei » : dernière connexion (pairing.js) et dernier test
 * (diagnostic.js), gardés sur le téléphone et exportés ensemble, sans clé, PIN ni adresse complète.
 */
export const CONNECT_LAST_KEY = 'healthtrack_watch_connect_last'

export function loadLastConnect(storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage?.getItem(CONNECT_LAST_KEY) || 'null')
    return v && Array.isArray(v.steps) ? v : null
  } catch {
    return null
  }
}

export function saveLastConnect(report, storage = globalThis.localStorage) {
  try {
    storage?.setItem(CONNECT_LAST_KEY, JSON.stringify(report))
  } catch {
    /* stockage plein : rapport seulement affiché */
  }
}

/** Journal commun : chaque rapport tel quel ; nom daté du plus récent. */
export function watchJournal({ connect = null, diagnostic = null } = {}, now = new Date()) {
  const latest = [connect?.startedAt, diagnostic?.startedAt].filter(Boolean).sort().pop() || now.toISOString()
  return {
    json: JSON.stringify({ format: 'healthtrack-watch-journal', version: 1, exportedAt: now.toISOString(), connect, diagnostic }, null, 2),
    filename: `healthtrack-journal-montre-${latest.slice(0, 16).replace(/[T:]/g, '-')}.json`,
  }
}
