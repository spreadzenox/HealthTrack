/**
 * Lecture des mesures d'une montre Huawei (chantier D3, étape d) : heure, sommeil simple, mesures
 * minute par minute (pas, calories, distance, FC, SpO₂, FC de repos) et totaux du jour, puis
 * conversion en entrées HealthTrack. Écrit d'après journal/protocoles/huawei.md §7 (aucun code
 * Gadgetbridge). Les messages passent par la session déjà authentifiée (chiffrés).
 *
 * Agrégation pour garder l'historique léger : pas et calories par heure, FC par tranche de 10 min,
 * SpO₂ telle quelle, FC de repos une par jour. Seules les tranches terminées avant `until` (arrondi à
 * l'heure) sont rendues : la synchro suivante repart de là, sans tranche à moitié comptée.
 */
import { decodeTlvs, resultCode, RESULT_SUCCESS } from './protocol'

export const DEVICE_CONFIG = 1
export const SET_TIME = 0x05
export const FITNESS = 7
export const FIT = { TOTALS: 0x03, MINUTE_COUNT: 0x0a, MINUTE_DATA: 0x0b, SLEEP_COUNT: 0x0c, SLEEP_DATA: 0x0d }

export const WATCH_SOURCE = 'huawei_watch'
/** Début minimal accepté par certaines montres (1/1/2000) : jamais 0. */
export const MIN_START_SEC = 946684800

const HOUR = 3600_000
const HR_SLOT = 10 * 60_000
const DAY = 24 * HOUR
const SLEEP_STAGES = { 6: 'light', 7: 'deep' }

const int = (n, size) => {
  const out = []
  for (let i = size - 1; i >= 0; i--) out.push(Math.floor(n / 2 ** (8 * i)) & 0xff)
  return out
}
/** Entier gros-boutiste de 1 à 4 octets (lecture tolérante). */
const uint = (bytes) => (bytes || []).reduce((v, b) => v * 256 + b, 0)
const find = (tlvs, tag) => tlvs.find((t) => t.tag === tag)?.value
const inner = (tlvs, tag = 0x81) => {
  const v = find(tlvs, tag)
  return v ? decodeTlvs(v) : []
}

/** 1/0x05 : heure Unix + décalage (heures, +128 si négatif ; minutes). */
export function setTimeTlvs(nowMs, offsetMinutes) {
  const abs = Math.abs(offsetMinutes)
  const hours = Math.floor(abs / 60) + (offsetMinutes < 0 ? 128 : 0)
  return [
    { tag: 1, value: int(Math.floor(nowMs / 1000), 4) },
    { tag: 2, value: [hours, abs % 60] },
  ]
}

/** Demande de nombre de blocs (0x0A / 0x0C) : `81` vide puis début et fin au premier niveau. */
export function countTlvs(startMs, endMs) {
  return [
    { tag: 0x81 },
    { tag: 3, value: int(Math.max(MIN_START_SEC, Math.floor(startMs / 1000)), 4) },
    { tag: 4, value: int(Math.floor(endMs / 1000), 4) },
  ]
}

export const blockTlvs = (index) => [{ tag: 0x81, value: [0x02, 0x02, ...int(index, 2)] }]

export const parseCount = (tlvs) => uint(find(inner(tlvs), 2))

// Champs des octets d'une minute, dans l'ordre des bits (§7.2) : [nom ou null, taille]
const MASK1 = [
  [null, 2],
  ['steps', 2],
  ['kcal', 2],
  ['distanceM', 2],
  [null, 2],
  [null, 1],
  ['hr', 1],
]
const MASK2 = [['spo2', 1], ['restingHr', 1], [null, 1], [null, 1], [null, 1], [null, 1], [null, 1], [null, 1]]

/** Octets d'une minute → { steps?, kcal?, distanceM?, hr?, spo2?, restingHr? } (valeurs nulles ignorées). */
export function parseMinuteBytes(bytes) {
  const m1 = bytes[0] ?? 0
  let i = 1
  const m2 = m1 & 0x80 ? bytes[i++] ?? 0 : 0
  const out = {}
  const read = (mask, fields) => {
    fields.forEach(([name, size], bit) => {
      if (!(mask & (1 << bit))) return
      if (i + size > bytes.length) throw new Error('Minute tronquée')
      const v = uint(bytes.slice(i, i + size))
      i += size
      const empty = v === 0 || (size === 1 && v === 0xff)
      if (name && !empty) out[name] = v
    })
  }
  read(m1, MASK1)
  read(m2, MASK2)
  return out
}

/** Réponse 7/0x0B → [{ t (ms), ...mesures }]. */
export function parseMinuteBlock(tlvs) {
  const body = inner(tlvs)
  const start = uint(find(body, 3)) * 1000
  const out = []
  for (const item of body.filter((t) => t.tag === 0x84)) {
    const sub = decodeTlvs(item.value)
    const raw = find(sub, 5)?.[0] ?? 0
    const offset = raw > 127 ? raw - 256 : raw
    const data = find(sub, 6)
    if (!data?.length) continue
    out.push({ t: start + offset * 60_000, ...parseMinuteBytes(data) })
  }
  return out
}

/** Réponse 7/0x0D → [{ start (ms), minutes, stage: 'light' | 'deep' | 'unknown' }]. */
export function parseSleepBlock(tlvs) {
  const out = []
  for (const item of inner(tlvs).filter((t) => t.tag === 0x83)) {
    const sub = decodeTlvs(item.value)
    const type = find(sub, 4)?.[0]
    const span = find(sub, 5)
    if (!span || span.length < 6) continue
    const minutes = uint(span.slice(4, 6))
    if (minutes <= 0) continue
    out.push({ start: uint(span.slice(0, 4)) * 1000, minutes, stage: SLEEP_STAGES[type] || 'unknown' })
  }
  return out
}

/** Réponse 7/0x03 → { steps, kcal, distanceM } (somme des éléments 0x83). */
export function parseTotals(tlvs) {
  const total = { steps: 0, kcal: 0, distanceM: 0 }
  for (const item of inner(tlvs).filter((t) => t.tag === 0x83)) {
    const sub = decodeTlvs(item.value)
    total.steps += uint(find(sub, 5))
    total.kcal += uint(find(sub, 6))
    total.distanceM += uint(find(sub, 7))
  }
  return total
}

const iso = (ms) => new Date(ms).toISOString()
const floorTo = (ms, step) => Math.floor(ms / step) * step
/** Minuit local du jour de `ms`. */
const localDayStart = (ms) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Minutes et périodes de sommeil → entrées HealthTrack (source « huawei_watch »).
 * `until` : seules les tranches terminées avant cet instant (ms) sont rendues.
 */
export function watchEntries({ minutes = [], sleep = [] }, { until, sourceName = 'Montre Huawei' }) {
  const base = { connector: WATCH_SOURCE, sourceName }
  const out = []
  const hourly = new Map()
  const slots = new Map()
  const resting = new Map()
  for (const m of minutes) {
    if (!(m.t < until)) continue
    const h = floorTo(m.t, HOUR)
    if (h + HOUR <= until && (m.steps || m.kcal)) {
      const b = hourly.get(h) || { steps: 0, kcal: 0 }
      b.steps += m.steps || 0
      b.kcal += m.kcal || 0
      hourly.set(h, b)
    }
    const s = floorTo(m.t, HR_SLOT)
    if (m.hr && s + HR_SLOT <= until) slots.set(s, [...(slots.get(s) || []), m.hr])
    // SpO₂ à la minute + 30 s : jamais la même heure qu'une tranche de FC (même type d'entrée)
    if (m.spo2) out.push({ type: 'heart_rate', source: WATCH_SOURCE, at: iso(floorTo(m.t, 60_000) + 30_000), payload: { value: m.spo2, unit: '%', subtype: 'oxygenSaturation', ...base } })
    const day = localDayStart(m.t)
    if (m.restingHr && day + DAY <= until) resting.set(day, m.restingHr) // la dernière valeur du jour
  }
  for (const [h, b] of hourly) {
    const endDate = iso(h + HOUR)
    if (b.steps) out.push({ type: 'steps', source: WATCH_SOURCE, at: iso(h), payload: { value: b.steps, unit: 'count', endDate, ...base } })
    if (b.kcal) out.push({ type: 'calories', source: WATCH_SOURCE, at: iso(h), payload: { value: b.kcal, unit: 'kcal', endDate, ...base } })
  }
  for (const [s, values] of slots) {
    const bpm = Math.round(values.reduce((a, v) => a + v, 0) / values.length)
    out.push({ type: 'heart_rate', source: WATCH_SOURCE, at: iso(s), payload: { bpm, unit: 'bpm', subtype: 'heartRate', samples: values.length, min: Math.min(...values), max: Math.max(...values), ...base } })
  }
  // FC de repos : une par jour terminé, à minuit + 45 s (aucune autre entrée n'y tombe)
  for (const [day, bpm] of resting) out.push({ type: 'heart_rate', source: WATCH_SOURCE, at: iso(day + 45_000), payload: { bpm, unit: 'bpm', subtype: 'restingHeartRate', ...base } })
  for (const p of sleep) {
    if (p.stage === 'unknown') continue
    out.push({ type: 'sleep', source: WATCH_SOURCE, at: iso(p.start), payload: { durationMinutes: p.minutes, sleepState: p.stage, endDate: iso(p.start + p.minutes * 60_000), ...base } })
  }
  return out.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
}

async function readBlocks(session, countCmd, dataCmd, since, until, parse, log, label) {
  const count = parseCount((await session.request(FITNESS, countCmd, countTlvs(since, until))).tlvs)
  log(`${label} : ${count} bloc${count > 1 ? 's' : ''}`)
  const out = []
  for (let i = 0; i < count; i++) {
    const reply = await session.request(FITNESS, dataCmd, blockTlvs(i))
    const code = resultCode(reply.tlvs)
    if (code !== null && code !== RESULT_SUCCESS) {
      log(`${label} : bloc ${i} refusé (code ${code})`, 'warn')
      continue
    }
    out.push(...parse(reply.tlvs))
  }
  return out
}

/**
 * Déroule la synchro sur une session authentifiée. Ne garde que [since, until).
 * @returns {Promise<{ minutes: object[], sleep: object[], totals: object|null }>}
 */
export async function readWatchData(session, { since, until, now = until, log = () => {}, tzOffsetMinutes = -new Date(now).getTimezoneOffset() }) {
  await session.request(DEVICE_CONFIG, SET_TIME, setTimeTlvs(now, tzOffsetMinutes)).catch(() => log('heure non réglée (sans réponse)', 'warn'))
  const sleep = (await readBlocks(session, FIT.SLEEP_COUNT, FIT.SLEEP_DATA, since, until, parseSleepBlock, log, 'sommeil')).filter(
    (p) => p.start >= since - DAY && p.start < until,
  )
  const minutes = (await readBlocks(session, FIT.MINUTE_COUNT, FIT.MINUTE_DATA, since, until, parseMinuteBlock, log, 'minutes')).filter(
    (m) => m.t >= since && m.t < until,
  )
  let totals = null
  try {
    totals = parseTotals((await session.request(FITNESS, FIT.TOTALS, [{ tag: 1 }])).tlvs)
  } catch (e) {
    log(`totaux du jour non lus : ${e?.message || e}`, 'warn')
  }
  return { minutes, sleep, totals }
}

/** Période à relire : depuis la dernière synchro (7 jours la première fois), jusqu'à l'heure pleine. */
export function syncWindow(lastUntil, nowMs, { firstDays = 7 } = {}) {
  const until = floorTo(nowMs, HOUR)
  const since = lastUntil ? Math.min(lastUntil, until) : until - firstDays * DAY
  return { since, until }
}
