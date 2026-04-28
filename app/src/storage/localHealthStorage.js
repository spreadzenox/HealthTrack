/**
 * Local-only health data storage (IndexedDB).
 * All user data (food, future watch/scale, wearables) is stored on the device only.
 * Survives app updates. Use Export/Import to survive reinstallation.
 *
 * Schema v2: added compound index 'source_at' for efficient connector sync queries.
 */

const DB_NAME = 'HealthTrack'
const STORE_NAME = 'health_entries'
const DB_VERSION = 2

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      const oldVersion = e.oldVersion

      let store
      if (oldVersion < 1) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('at', 'at', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('source', 'source', { unique: false })
      } else {
        store = e.target.transaction.objectStore(STORE_NAME)
      }

      // v2: compound index to quickly find entries by source within a date range
      if (oldVersion < 2 && !store.indexNames.contains('source_at')) {
        store.createIndex('source_at', ['source', 'at'], { unique: false })
      }
    }
  })
}

/**
 * @param {{ type?: string, source?: string, since?: string, until?: string, limit?: number }} [opts]
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
      if (opts.since) entries = entries.filter((e) => e.at >= opts.since)
      if (opts.until) entries = entries.filter((e) => e.at <= opts.until)
      entries.sort((a, b) => (b.at < a.at ? -1 : 1))
      const limit = opts.limit ?? 100
      resolve(entries.slice(0, limit))
    }
  })
}

/**
 * Get the most recent 'at' timestamp for a given source (used to determine
 * the last successful sync point for connector incremental updates).
 * Returns null if no entries exist for that source.
 * @param {string} source
 * @returns {Promise<string|null>}
 */
export async function getLatestEntryAt(source) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const entries = (req.result || []).filter((e) => e.source === source)
      if (entries.length === 0) return resolve(null)
      entries.sort((a, b) => (b.at < a.at ? -1 : 1))
      resolve(entries[0].at)
    }
  })
}

/**
 * Bulk insert entries, skipping duplicates based on (source, at, type).
 * Returns the count of actually inserted entries.
 * @param {Array<{ type: string, source: string, payload: object, at?: string }>} newEntries
 * @returns {Promise<{ inserted: number, skipped: number }>}
 */
export async function upsertEntries(newEntries) {
  if (!newEntries || newEntries.length === 0) return { inserted: 0, skipped: 0 }

  const db = await openDB()

  // Build a set of existing keys for dedup: "source|at|type"
  const existingKeys = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const keys = new Set((req.result || []).map((e) => `${e.source}|${e.at}|${e.type}`))
      resolve(keys)
    }
  })

  const now = new Date().toISOString()
  let inserted = 0
  let skipped = 0

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    for (const entry of newEntries) {
      const at = entry.at || now
      const key = `${entry.source}|${at}|${entry.type}`
      if (existingKeys.has(key)) {
        skipped++
        continue
      }
      store.add({
        type: entry.type,
        source: entry.source,
        payload: entry.payload || {},
        at,
        created_at: now,
      })
      existingKeys.add(key)
      inserted++
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  return { inserted, skipped }
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
 * Count total entries in the DB (lightweight — does not load payloads via getAll;
 * uses IDBObjectStore.count() which is O(1) in most IndexedDB engines).
 * @returns {Promise<number>}
 */
export async function countAllEntries() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.count()
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
  })
}

/**
 * Load all entries for analysis/ML, loading each type independently so that
 * high-frequency types (e.g. heart_rate) cannot crowd out lower-frequency
 * types (e.g. wellbeing, sleep, food) due to a shared entry cap.
 *
 * Per-type limits (most-recent N entries of that type):
 *   - heart_rate: 5000  (high-frequency wearable data)
 *   - steps:      2000
 *   - wellbeing:  2000
 *   - food:       2000
 *   - sleep:      500
 *   - activity:   500
 *   - calories:   500
 *   - default:    1000  (any future types)
 *
 * @returns {Promise<Array<{ id: number, type: string, source: string, at: string, payload: object, created_at: string }>>}
 */
export async function listEntriesForAnalysis() {
  const TYPE_LIMITS = {
    heart_rate: 5000,
    steps: 2000,
    wellbeing: 2000,
    food: 2000,
    sleep: 500,
    activity: 500,
    calories: 500,
  }
  const DEFAULT_LIMIT = 1000

  const db = await openDB()
  const allEntries = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result || [])
  })

  // Group by type, sort each group descending by `at`, apply per-type limit
  const byType = {}
  for (const entry of allEntries) {
    const t = entry.type || '__unknown__'
    if (!byType[t]) byType[t] = []
    byType[t].push(entry)
  }

  const result = []
  for (const [type, entries] of Object.entries(byType)) {
    entries.sort((a, b) => (b.at < a.at ? -1 : 1))
    const limit = TYPE_LIMITS[type] ?? DEFAULT_LIMIT
    result.push(...entries.slice(0, limit))
  }

  return result
}

/**
 * Export all entries as JSON string (for download / backup).
 * Uses per-type limits (same as listEntriesForAnalysis) so that high-frequency
 * types cannot crowd out other types in the export file.
 * @returns {Promise<string>}
 */
export async function exportToJson() {
  const entries = await listEntriesForAnalysis()
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
