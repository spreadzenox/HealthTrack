/**
 * Local-only health data storage (IndexedDB).
 * All user data (food, future watch/scale) is stored on the device only.
 * Survives app updates. Use Export/Import to survive reinstallation.
 */

const DB_NAME = 'HealthTrack'
const STORE_NAME = 'health_entries'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('at', 'at', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('source', 'source', { unique: false })
      }
    }
  })
}

/**
 * @param {{ type?: string, source?: string, limit?: number }} [opts]
 * @returns {Promise<Array<{ id: number, type: string, source: string, at: string, payload: object, created_at: string }>>}
 */
export async function listEntries(opts = {}) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      let entries = req.result || []
      if (opts.type) entries = entries.filter((e) => e.type === opts.type)
      if (opts.source) entries = entries.filter((e) => e.source === opts.source)
      entries.sort((a, b) => (b.at < a.at ? -1 : 1))
      const limit = opts.limit ?? 100
      resolve(entries.slice(0, limit))
    }
  })
}

/**
 * @param {{ type: string, source: string, payload: object, at?: string }} entry
 * @returns {Promise<number>} id
 */
export async function createEntry(entry) {
  const db = await openDB()
  const now = new Date().toISOString()
  const at = entry.at || now
  const row = {
    type: entry.type,
    source: entry.source,
    payload: entry.payload,
    at,
    created_at: now,
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.add(row)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
  })
}

/**
 * Export all entries as JSON string (for download / backup).
 * @returns {Promise<string>}
 */
export async function exportToJson() {
  const entries = await listEntries({ limit: 10000 })
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), entries },
    null,
    2
  )
}

/**
 * Import entries from a previously exported JSON.
 * @param {string} json
 * @param {{ merge?: boolean }} [opts] - if merge=true, add to existing; else replace all
 * @returns {Promise<{ imported: number }>}
 */
export async function importFromJson(json, opts = {}) {
  let data
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Fichier JSON invalide')
  }
  const entries = Array.isArray(data) ? data : data.entries
  if (!Array.isArray(entries) || entries.length === 0) {
    return { imported: 0 }
  }
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    if (!opts.merge) {
      store.clear()
    }
    let count = 0
    for (const e of entries) {
      const row = {
        type: e.type,
        source: e.source,
        payload: e.payload || {},
        at: e.at || new Date().toISOString(),
        created_at: e.created_at || new Date().toISOString(),
      }
      store.add(row)
      count++
    }
    tx.oncomplete = () => resolve({ imported: count })
    tx.onerror = () => reject(tx.error)
  })
}
