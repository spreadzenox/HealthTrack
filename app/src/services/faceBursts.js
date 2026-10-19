/**
 * Import des rafales de la « Lecture du visage » dans l'historique (journal/IDEES.md I90). Le service natif
 * (FaceSenseService.java) dépose, pour chaque rafale, un petit JSON de scores (FaceRecord.java : indices médians,
 * nombre d'images valides, rejets, temps ; jamais d'image) dans sa boîte privée ; à l'ouverture de l'app, elles
 * deviennent des entrées `face_burst` (source `face_sense`), écrites sans doublon (même source, heure, type), puis
 * retirées de la boîte. Une rafale illisible est retirée aussi ; une écriture qui échoue laisse tout pour la
 * prochaine ouverture. Ne lève jamais.
 *
 * Ces entrées sont des **entrées de l'humeur estimée** (Y, préfixe `face_` dans mood/estimatorInputs.js) : elles ne
 * sont jamais des facteurs des Analyses, et rien de leurs valeurs n'est affiché avant la porte de calibration
 * (I110 / I112). Seules les rafales du **déverrouillage** comptent pour l'humeur (`moodFaceBursts`, I114) : une
 * rafale déclenchée par l'usage du téléphone ferait dépendre les images vues d'un X (biais de composition).
 */
import { faceSensePlugin } from './faceSense'
import { upsertEntries } from '../storage/localHealthStorage'

export const FACE_BURST_TYPE = 'face_burst'
export const FACE_SOURCE = 'face_sense'
/** Déclencheurs dont les rafales servent à estimer l'humeur ; `manual` (test) reste du diagnostic. */
export const MOOD_TRIGGERS = ['unlock']

const RECORD_VERSION = 1
const MAX_FRAMES = 10
const LAST_IMPORT_KEY = 'healthtrack_face_import'

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const isCount = (v) => Number.isInteger(v) && v >= 0

function numbers(obj, keep = isNum) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return undefined
  const out = {}
  for (const [k, v] of Object.entries(obj)) if (keep(v)) out[k] = v
  return out
}

/** Entrée `face_burst` d'un JSON déposé par le natif, ou null s'il n'est pas lisible. */
export function parseFaceBurst(json) {
  let r
  try {
    r = JSON.parse(json)
  } catch {
    return null
  }
  if (!r || typeof r !== 'object' || r.v !== RECORD_VERSION) return null
  if (!isNum(r.at) || r.at <= 0 || typeof r.trigger !== 'string' || !r.trigger) return null
  const frames = isCount(r.frames) && r.frames <= MAX_FRAMES ? r.frames : null
  if (frames == null || !isCount(r.valid) || r.valid > frames) return null
  const payload = { v: r.v, trigger: r.trigger, frames, valid: r.valid }
  const values = r.valid > 0 ? numbers(r.values) : undefined
  if (values && Object.keys(values).length) payload.values = values
  payload.rejected = numbers(r.rejected, isCount) || {}
  const ms = numbers(r.ms)
  if (ms) payload.ms = ms
  return { type: FACE_BURST_TYPE, source: FACE_SOURCE, at: new Date(r.at).toISOString(), payload }
}

/** Dernier import (diagnostic) : { at, imported, dropped, kept } ou null. */
export function getLastFaceImport(storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage?.getItem(LAST_IMPORT_KEY) || 'null')
  } catch {
    return null
  }
}

function rememberImport(summary, storage) {
  try {
    storage?.setItem(LAST_IMPORT_KEY, JSON.stringify(summary))
  } catch {
    /* seul le diagnostic en pâtit */
  }
}

let inFlight = null

/**
 * Importe les rafales en attente. Rend { imported, inserted, dropped, kept } : rafales lues et écrites (doublons
 * compris), réellement ajoutées, illisibles retirées, gardées pour plus tard.
 */
export function importPendingFaceBursts({ plugin = faceSensePlugin(), write = upsertEntries, storage = globalThis.localStorage, now = new Date() } = {}) {
  if (inFlight) return inFlight
  inFlight = run({ plugin, write, storage, now }).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function run({ plugin, write, storage, now }) {
  const out = { imported: 0, inserted: 0, dropped: 0, kept: 0 }
  if (!plugin?.list) return out
  let items = []
  try {
    items = (await plugin.list())?.bursts || []
  } catch {
    return out
  }
  if (!items.length) return out
  const entries = []
  const read = []
  const dropped = []
  for (const it of items) {
    const entry = parseFaceBurst(it?.json)
    if (entry) {
      entries.push(entry)
      read.push(it.name)
    } else {
      dropped.push(it?.name)
    }
  }
  out.dropped = dropped.length
  let done = dropped
  if (entries.length) {
    try {
      const res = await write(entries)
      out.imported = entries.length
      out.inserted = res?.inserted ?? 0
      done = [...read, ...dropped]
    } catch {
      out.kept = entries.length
    }
  }
  const names = items.map((it) => it?.name).filter((n) => done.includes(n))
  if (names.length && plugin.remove) {
    try {
      await plugin.remove({ names })
    } catch {
      /* retirées à la prochaine ouverture : l'écriture est sans doublon */
    }
  }
  rememberImport({ at: now.toISOString(), imported: out.imported, dropped: out.dropped, kept: out.kept }, storage)
  return out
}

/** Les rafales qui comptent pour l'humeur (Y) : déverrouillage, au moins une image valide, des indices. */
export function moodFaceBursts(entries) {
  return (entries || []).filter((e) =>
    e?.type === FACE_BURST_TYPE &&
    MOOD_TRIGGERS.includes(e.payload?.trigger) &&
    e.payload.valid > 0 &&
    e.payload.values && Object.keys(e.payload.values).length > 0)
}

/** Ce que la carte peut dire de l'historique, sans aucune valeur : { stored, forMood, firstAt }. */
export function faceHistorySummary(entries) {
  const bursts = (entries || []).filter((e) => e?.type === FACE_BURST_TYPE)
  const firstAt = bursts.reduce((min, e) => (min == null || e.at < min ? e.at : min), null)
  return { stored: bursts.length, forMood: moodFaceBursts(bursts).length, firstAt }
}

/** Lectures du déverrouillage avec un visage visées par jour (I118 : simulé, 12–16 → porte en 2–3 mois). */
export const VALID_BURSTS_TARGET = 12
const COUNT_DAYS = 7

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function median(values) {
  if (!values.length) return null
  const v = [...values].sort((a, b) => a - b)
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2)
}

/**
 * Assez de lectures par jour ? (I118, diagnostic). Sur les 7 derniers jours terminés où la lecture a tourné
 * (au moins une rafale du déverrouillage), médianes des rafales du déverrouillage, de celles qui ont lu un visage
 * et des déverrouillages comptés par le temps d'écran (`phone_usage`, null s'il n'est pas activé). Des comptes
 * seulement, jamais une valeur. null sans aucun jour terminé.
 *
 * @param {{ today?: string }} opts  today : clé du jour en cours (AAAA-MM-JJ, heure locale)
 */
export function faceDailyCounts(entries, { today = dayKey(new Date()) } = {}) {
  const [y, m, d] = today.split('-').map(Number)
  const from = dayKey(new Date(y, m - 1, d - COUNT_DAYS))
  const inWindow = (k) => k >= from && k < today
  const days = new Map()
  const valid = new Set(moodFaceBursts(entries))
  for (const e of entries || []) {
    if (e?.type !== FACE_BURST_TYPE || !MOOD_TRIGGERS.includes(e.payload?.trigger)) continue
    const k = dayKey(new Date(e.at))
    if (!inWindow(k)) continue
    const c = days.get(k) || { bursts: 0, valid: 0 }
    c.bursts += 1
    if (valid.has(e)) c.valid += 1
    days.set(k, c)
  }
  if (!days.size) return null
  const unlocks = new Map()
  for (const e of entries || []) {
    const k = e?.type === 'phone_usage' ? e.payload?.date : null
    if (k && days.has(k) && Number.isFinite(e.payload.unlocks)) unlocks.set(k, e.payload.unlocks)
  }
  const counts = [...days.values()]
  const validBurstsPerDay = median(counts.map((c) => c.valid))
  return {
    days: days.size,
    unlocksPerDay: median([...unlocks.values()]),
    burstsPerDay: median(counts.map((c) => c.bursts)),
    validBurstsPerDay,
    target: VALID_BURSTS_TARGET,
    enough: validBurstsPerDay >= VALID_BURSTS_TARGET,
  }
}
