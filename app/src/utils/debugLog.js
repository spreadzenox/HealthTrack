/**
 * In-memory debug log buffer.
 *
 * Any module can call `debugLog(tag, message, data)` to append a structured
 * log entry. The DebugContext subscribes to changes and forwards entries to
 * the in-app debug panel.
 *
 * Entries are NOT persisted to localStorage – they live only for the current
 * app session.
 */

/** Maximum number of entries kept in the buffer. */
const MAX_ENTRIES = 500

/** @type {Array<{id: number, ts: string, level: string, tag: string, message: string, data?: unknown}>} */
let entries = []
let nextId = 1

/** @type {Array<() => void>} */
const listeners = []

function now() {
  return new Date().toISOString()
}

/**
 * Append a log entry.
 * @param {'info'|'warn'|'error'|'debug'} level
 * @param {string} tag   – short category label (e.g. 'HealthConnect')
 * @param {string} message
 * @param {unknown} [data] – optional structured payload
 */
export function debugLog(level, tag, message, data) {
  const entry = {
    id: nextId++,
    ts: now(),
    level,
    tag,
    message,
    data: data !== undefined ? data : undefined,
  }
  entries = [...entries.slice(-(MAX_ENTRIES - 1)), entry]
  listeners.forEach((fn) => fn())
}

/** Convenience wrappers */
export const debugInfo = (tag, msg, data) => debugLog('info', tag, msg, data)
export const debugWarn = (tag, msg, data) => debugLog('warn', tag, msg, data)
export const debugError = (tag, msg, data) => debugLog('error', tag, msg, data)
export const debugDebug = (tag, msg, data) => debugLog('debug', tag, msg, data)

/** Returns a shallow copy of the current entries array. */
export function getDebugEntries() {
  return [...entries]
}

/** Clear all entries. */
export function clearDebugLog() {
  entries = []
  nextId = 1
  listeners.forEach((fn) => fn())
}

/**
 * Subscribe to log changes.
 * @param {() => void} fn
 * @returns {() => void} unsubscribe function
 */
export function subscribeDebugLog(fn) {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx !== -1) listeners.splice(idx, 1)
  }
}
