/**
 * Local-only health data storage (IndexedDB).
 * All user data (food, future watch/scale, wearables) is stored on the device only.
 * Survives app updates. Use Export/Import to survive reinstallation.
 *
 * Schema v2: added compound index 'source_at' for efficient connector sync queries.
 * Schema v3: added compound index 'type_at' — listEntries reads a type / source / date range through
 * the indexes instead of loading the whole store (perf D2).
 */
import { getBodySettings, setBodySettings, sanitizeBodySettings } from '../settings/bodySettings'

const DB_NAME = 'HealthTrack'
const STORE_NAME = 'health_entries'
const DB_VERSION = 3

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
      // v3: same for a type within a date range (index only, entries untouched)
      if (oldVersion < 3 && !store.indexNames.contains('type_at')) {
        store.createIndex('type_at', ['type', 'at'], { unique: false })
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
    const req = indexedRead(tx.objectStore(STORE_NAME), opts)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      let entries = req.result || []
      // Les filtres restent appliqués : l'index ne fait que réduire ce qui est lu
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

// Borne haute d'une date ISO (aucune date réelle ne la dépasse)
const AT_MAX = '\uffff'

/** Plus petite lecture couvrant les filtres : index [type, at], [source, at], at ou type ; sinon tout. */
function indexedRead(store, { type, source, since, until }) {
  const from = since ?? ''
  const to = until ?? AT_MAX
  if (type && (since || until)) return store.index('type_at').getAll(IDBKeyRange.bound([type, from], [type, to]))
  if (source && (since || until)) return store.index('source_at').getAll(IDBKeyRange.bound([source, from], [source, to]))
  if (type) return store.index('type').getAll(IDBKeyRange.only(type))
  if (source) return store.index('source').getAll(IDBKeyRange.only(source))
  if (since || until) return store.index('at').getAll(IDBKeyRange.bound(from, to))
  return store.getAll()
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
    const range = IDBKeyRange.bound([source, ''], [source, AT_MAX])
    const req = tx.objectStore(STORE_NAME).index('source_at').openCursor(range, 'prev')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result?.value.at ?? null)
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
 *   - cigarette:  2000
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
    cigarette: 2000,
  }
  const DEFAULT_LIMIT = 1000

  const db = await openDB()
  const store = () => db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME)
  const request = (req) =>
    new Promise((resolve, reject) => {
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result)
    })

  // Types présents : clés uniques de l'index 'type', sans lire les entrées
  const types = await new Promise((resolve, reject) => {
    const found = []
    const req = store().index('type').openKeyCursor(null, 'nextunique')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) return resolve(found)
      found.push(cursor.key)
      cursor.continue()
    }
  })

  const perType = await Promise.all(types.map(async (type) => {
    const limit = TYPE_LIMITS[type] ?? DEFAULT_LIMIT
    const typeIndex = store().index('type')
    const count = await request(typeIndex.count(IDBKeyRange.only(type)))
    let entries
    if (count <= limit) {
      entries = await request(typeIndex.getAll(IDBKeyRange.only(type)))
    } else {
      // Date de la N-ième plus récente (clés seules), puis lecture de cette date à aujourd'hui
      const nth = await new Promise((resolve, reject) => {
        const req = store().index('type_at').openKeyCursor(IDBKeyRange.bound([type, ''], [type, AT_MAX]), 'prev')
        let skipped = false
        req.onerror = () => reject(req.error)
        req.onsuccess = () => {
          const cursor = req.result
          if (!cursor) return resolve('')
          if (!skipped && limit > 1) {
            skipped = true
            return cursor.advance(limit - 1)
          }
          resolve(cursor.key[1])
        }
      })
      entries = await request(store().index('type_at').getAll(IDBKeyRange.bound([type, nth], [type, AT_MAX])))
    }
    entries.sort((a, b) => (b.at < a.at ? -1 : 1))
    return entries.slice(0, limit)
  }))
  return perType.flat()
}

/**
 * Delete one entry by id (no-op if it does not exist).
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteEntry(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Modify an app entry in place: only `payload` and `at` can change (type, source, id and
 * created_at are kept). Stamps `updated_at`. Rejects if the entry does not exist.
 * @param {number} id
 * @param {{ payload?: object, at?: string }} changes
 * @returns {Promise<void>}
 */
export async function updateEntry(id, changes = {}) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    let missing = false
    const req = store.get(id)
    req.onsuccess = () => {
      const row = req.result
      if (!row) {
        missing = true
        return
      }
      if (changes.payload !== undefined) row.payload = changes.payload
      if (changes.at) row.at = changes.at
      row.updated_at = new Date().toISOString()
      store.put(row)
    }
    tx.oncomplete = () => (missing ? reject(new Error('Entrée introuvable')) : resolve())
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Export ALL entries as JSON string (for download / backup).
 * No per-type limit here: a backup must never silently drop old data.
 * Le profil saisi dans l'app (sexe, année, taille, activité) est joint s'il existe.
 * @returns {Promise<string>}
 */
export async function exportToJson() {
  const db = await openDB()
  const entries = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result || [])
  })
  entries.sort((a, b) => (b.at < a.at ? -1 : 1))
  const backup = { version: 1, exportedAt: new Date().toISOString(), entries }
  const profile = getBodySettings()
  if (Object.keys(profile).length > 0) backup.profile = profile
  return JSON.stringify(backup, null, 2)
}

const NOT_A_BACKUP = "Ce fichier n'est pas une sauvegarde HealthTrack (aucune entrée reconnue)."

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== ''
}

/** Normalise une entrée de sauvegarde ; renvoie null si elle est illisible. */
function normalizeBackupEntry(e, now) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null
  if (!isNonEmptyString(e.type) || !isNonEmptyString(e.source)) return null
  // Sans date fiable, l'entrée fausserait les analyses (elle tomberait « aujourd'hui »).
  if (!isNonEmptyString(e.at) || Number.isNaN(new Date(e.at).getTime())) return null
  let payload = e.payload
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      payload = {}
    }
  }
  if (!payload || typeof payload !== 'object') payload = {}
  const row = {
    type: e.type,
    source: e.source,
    payload,
    at: e.at,
    created_at: isNonEmptyString(e.created_at) ? e.created_at : now,
  }
  if (e.updated_at) row.updated_at = e.updated_at
  return row
}

/**
 * Lit et vérifie un fichier de sauvegarde, sans rien écrire (aperçu avant import).
 * Accepte le format actuel `{ version, exportedAt, entries, profile? }` et l'ancien tableau nu.
 * @param {string} json
 * @returns {{ entries: object[], invalid: number, exportedAt: string|null, firstAt: string|null, lastAt: string|null,
 *   byType: Record<string, number>, profile: object|null }}
 * @throws si le JSON est illisible ou ne ressemble pas à une sauvegarde HealthTrack
 */
export function parseBackup(json) {
  let data
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Fichier JSON invalide')
  }
  const raw = Array.isArray(data) ? data : data && typeof data === 'object' ? data.entries : undefined
  if (!Array.isArray(raw)) throw new Error(NOT_A_BACKUP)

  const now = new Date().toISOString()
  const entries = []
  const byType = {}
  let firstAt = null
  let lastAt = null
  let firstMs = Infinity
  let lastMs = -Infinity
  for (const e of raw) {
    const row = normalizeBackupEntry(e, now)
    if (!row) continue
    entries.push(row)
    byType[row.type] = (byType[row.type] || 0) + 1
    const ms = new Date(row.at).getTime()
    if (ms < firstMs) {
      firstMs = ms
      firstAt = row.at
    }
    if (ms > lastMs) {
      lastMs = ms
      lastAt = row.at
    }
  }
  if (raw.length > 0 && entries.length === 0) throw new Error(NOT_A_BACKUP)

  const exportedAt = !Array.isArray(data) && isNonEmptyString(data.exportedAt) ? data.exportedAt : null
  const cleanProfile = Array.isArray(data) ? {} : sanitizeBodySettings(data.profile)
  const profile = Object.keys(cleanProfile).length > 0 ? cleanProfile : null
  return { entries, invalid: raw.length - entries.length, exportedAt, firstAt, lastAt, byType, profile }
}

/**
 * Restaure le profil d'une sauvegarde. Remplacer : le profil du fichier remplace l'actuel.
 * Ajouter : il ne complète que les champs vides (ce qui est saisi sur l'appareil prime).
 * @returns {boolean} true si le profil a changé
 */
function restoreProfile(profile, merge) {
  if (!profile) return false
  try {
    const current = getBodySettings()
    const next = merge ? { ...profile, ...current } : profile
    if (JSON.stringify(sanitizeBodySettings(next)) === JSON.stringify(current)) return false
    setBodySettings(next)
    return true
  } catch {
    return false
  }
}

/**
 * Import entries from a previously exported JSON.
 * Le fichier est vérifié avant toute écriture : un mauvais fichier ou une sauvegarde vide
 * n'efface jamais les données existantes.
 * @param {string} json
 * @param {{ merge?: boolean }} [opts] - merge=true : ajoute seulement les entrées absentes
 *   (même source, date et type) ; sinon remplace tout
 * @returns {Promise<{ imported: number, skipped: number, invalid: number, profileRestored: boolean }>}
 */
export async function importFromJson(json, opts = {}) {
  const { entries, invalid, profile } = parseBackup(json)
  if (entries.length === 0) return { imported: 0, skipped: 0, invalid, profileRestored: false }

  const db = await openDB()
  const existingKeys = opts.merge
    ? await new Promise((resolve, reject) => {
        const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
        req.onerror = () => reject(req.error)
        req.onsuccess = () => resolve(new Set((req.result || []).map((e) => `${e.source}|${e.at}|${e.type}`)))
      })
    : null

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    if (!opts.merge) {
      store.clear()
    }
    let imported = 0
    let skipped = 0
    for (const row of entries) {
      if (existingKeys?.has(`${row.source}|${row.at}|${row.type}`)) {
        skipped++
        continue
      }
      store.add(row)
      imported++
    }
    tx.oncomplete = () => resolve({ imported, skipped, invalid, profileRestored: restoreProfile(profile, opts.merge) })
    tx.onerror = () => reject(tx.error)
  })
}
