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

const BG_TIMES = ['lastUntil', 'lastAttemptAt', 'lastSuccessAt', 'lastDecisionAt']
const BG_FIELDS = ['busy', 'failures', 'paused', 'outcome', 'battery', 'lastDecision', 'lastTrigger', 'periodic']

/**
 * État de la relecture app fermée (WatchCapture.background) réduit à ce qui aide au diagnostic : décisions,
 * déclencheur (presence / unlock / periodic), issues, horodatages ISO ; jamais d'adresse ni de clé.
 */
export function backgroundForJournal(bg) {
  if (!bg || typeof bg !== 'object') return null
  const out = {}
  for (const k of BG_FIELDS) if (k in bg) out[k] = bg[k] ?? null
  for (const k of BG_TIMES) if (k in bg) out[k] = bg[k] > 0 ? new Date(bg[k]).toISOString() : null
  return out
}

/** Journal commun : chaque rapport tel quel ; nom daté du plus récent. */
export function watchJournal({ connect = null, diagnostic = null, background = null } = {}, now = new Date()) {
  const latest = [connect?.startedAt, diagnostic?.startedAt].filter(Boolean).sort().pop() || now.toISOString()
  return {
    json: JSON.stringify({ format: 'healthtrack-watch-journal', version: 1, exportedAt: now.toISOString(), connect, diagnostic, background }, null, 2),
    filename: `healthtrack-journal-montre-${latest.slice(0, 16).replace(/[T:]/g, '-')}.json`,
  }
}
