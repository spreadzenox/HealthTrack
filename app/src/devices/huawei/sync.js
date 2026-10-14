/**
 * Lecture des mesures d'une montre Huawei (chantier D3, étape d) : heure, sommeil simple, mesures
 * minute par minute (pas, calories, distance, FC, SpO₂, FC de repos) et totaux du jour, puis
 * conversion en entrées HealthTrack. Écrit d'après journal/protocoles/huawei.md §7 (aucun code
 * Gadgetbridge). Les messages passent par la session déjà authentifiée (chiffrés).
 *
 * Agrégation pour garder l'historique léger : pas et calories par heure, FC par tranche de 10 min,
 * SpO₂ telle quelle, FC de repos une par jour. Seules les tranches terminées avant `until` (arrondi à
 * l'heure) sont rendues : la synchro suivante repart de là, sans tranche à moitié comptée.
 *
 * Étape d bis (§7.5, 7.6, 7.8) : capacités de la montre, séances (totaux) et sommeil détaillé
 * (phases, score, VFC de la nuit) par fichier. Chacune est facultative : un échec n'arrête rien.
 */
import { decodeTlvs, encodeTlvs, resultCode, RESULT_SUCCESS } from './protocol'
import { downloadFile, FILE_TYPE, FILES, parseSleepSequence, SLEEP_DICTIONARY } from './files'

export const DEVICE_CONFIG = 1
export const SET_TIME = 0x05
export const FITNESS = 7
export const FIT = { TOTALS: 0x03, MINUTE_COUNT: 0x0a, MINUTE_DATA: 0x0b, SLEEP_COUNT: 0x0c, SLEEP_DATA: 0x0d }
export const CONFIG = { SERVICES: 0x02, COMMANDS: 0x03, SETTINGS: 0x31, EXPAND: 0x37 }
export const WORKOUT = 0x17
export const WORKOUT_CMD = { LIST: 0x07, TOTALS: 0x08 }
export const STRESS = 0x20

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

/** Règle l'heure de la montre (1/0x05) ; un silence est seulement consigné. */
export const setWatchTime = (session, now, tzOffsetMinutes, log = () => {}) =>
  session.request(DEVICE_CONFIG, SET_TIME, setTimeTlvs(now, tzOffsetMinutes)).catch(() => log('heure non réglée (sans réponse)', 'warn'))

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
    try {
      out.push({ t: start + offset * 60_000, ...parseMinuteBytes(data) })
    } catch {
      // minute plus courte que son masque ne l'annonce (§7.10) : seule cette minute est perdue
    }
  }
  return out
}

/** Réponse 7/0x0D → [{ start (ms), minutes, stage: 'light' | 'deep' | 'unknown', type }] (type brut gardé pour le journal). */
export function parseSleepBlock(tlvs) {
  const out = []
  for (const item of inner(tlvs).filter((t) => t.tag === 0x83)) {
    const sub = decodeTlvs(item.value)
    const type = find(sub, 4)?.[0]
    const span = find(sub, 5)
    if (!span || span.length < 6) continue
    const minutes = uint(span.slice(4, 6))
    if (minutes <= 0) continue
    out.push({ start: uint(span.slice(0, 4)) * 1000, minutes, stage: SLEEP_STAGES[type] || 'unknown', type })
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

// ── Capacités (§7.8) ───────────────────────────────────────────────────────────

/** Services et commandes demandés (petite demande : une seule trame). */
export const CAPABILITY_QUERY = [
  [DEVICE_CONFIG, [CONFIG.SETTINGS, CONFIG.EXPAND]],
  [FITNESS, [FIT.MINUTE_COUNT, FIT.SLEEP_COUNT, 0x16]],
  [WORKOUT, [0x01, WORKOUT_CMD.LIST]],
  [STRESS, [0x09]],
  [FILES, [0x01, 0x04]],
]
/** Fusionne des demandes de capacités : une entrée par service, commandes sans doublon, ordre gardé. */
export function mergeCapabilityQueries(...queries) {
  const by = new Map()
  for (const q of queries) for (const [service, cmds] of q) by.set(service, [...new Set([...(by.get(service) || []), ...cmds])])
  return [...by.entries()]
}
export const EXPAND = { SLEEP_DICTIONARY: 143, HRV: 235, APNEA: 107, EMOTION: 206 }

export const servicesTlvs = (ids) => [{ tag: 1, value: ids }]
/** Réponse 1/0x02 → Map service → bool (un octet par service demandé, même ordre). */
export function parseServices(tlvs, ids) {
  const flags = find(tlvs, 2) || []
  return new Map(ids.map((id, i) => [id, flags[i] === 1]))
}
export function commandsTlvs(query) {
  const body = []
  for (const [service, cmds] of query) body.push({ tag: 2, value: [service] }, { tag: 3, value: cmds })
  return [{ tag: 0x81, value: encodeTlvs(body) }]
}
/** Réponse 1/0x03 → Map « service/commande » → bool (tableau aligné sur la demande). */
export function parseCommands(tlvs, query) {
  const out = new Map()
  const body = inner(tlvs)
  let service = null
  for (const t of body) {
    if (t.tag === 2) service = t.value[0]
    if (t.tag === 4 && service != null) {
      const cmds = query.find(([s]) => s === service)?.[1] || []
      cmds.forEach((c, i) => out.set(`${service}/${c}`, t.value[i] === 1))
    }
  }
  return out
}
/** Capacité étendue N : bit (N mod 8), poids faible d'abord, de l'octet ⌊N / 8⌋. */
export const hasExpand = (bytes, n) => Boolean(bytes && (bytes[n >> 3] ?? 0) & (1 << (n & 7)))

/**
 * Lit ce que la montre sait faire. Chaque question peut échouer : la réponse vaut alors null
 * (« on ne sait pas » → l'appelant essaie quand même).
 */
export async function readCapabilities(session, log = () => {}, { timeout = 3000, query = CAPABILITY_QUERY } = {}) {
  const opt = { timeout }
  const caps = { services: null, commands: null, settings: null, expand: null }
  const ask = async (label, fn) => {
    try {
      return await fn()
    } catch (e) {
      log(`capacités : ${label} non lu (${e?.message || e})`, 'warn')
      return null
    }
  }
  const ids = [...new Set(query.map(([s]) => s))].filter((s) => s !== DEVICE_CONFIG)
  caps.services = await ask('services', async () => parseServices((await session.request(DEVICE_CONFIG, CONFIG.SERVICES, servicesTlvs(ids), opt)).tlvs, ids))
  caps.commands = await ask('commandes', async () => parseCommands((await session.request(DEVICE_CONFIG, CONFIG.COMMANDS, commandsTlvs(query), opt)).tlvs, query))
  if (caps.commands?.get(`1/${CONFIG.SETTINGS}`) !== false) {
    caps.settings = await ask('réglages', async () => {
      const v = find((await session.request(DEVICE_CONFIG, CONFIG.SETTINGS, [1, 2, 3, 4, 5, 6].map((tag) => ({ tag })), opt)).tlvs, 2)
      return v ? uint(v) : null
    })
  }
  if (caps.commands?.get(`1/${CONFIG.EXPAND}`)) {
    caps.expand = await ask('capacités étendues', async () => Array.from(find((await session.request(DEVICE_CONFIG, CONFIG.EXPAND, [{ tag: 1 }], opt)).tlvs, 1) || []))
  }
  return caps
}

/** « non » seulement si la montre l'a dit ; inconnu → oui (on essaie). */
export function canDo(caps, service, command = null) {
  if (caps?.services?.get(service) === false) return false
  if (command != null && caps?.commands?.get(`${service}/${command}`) === false) return false
  return true
}

/** Résumé lisible des capacités (journal de diagnostic, sans donnée personnelle). */
export function describeCapabilities(caps) {
  if (!caps) return 'capacités inconnues'
  const yes = (v) => (v == null ? '?' : v ? 'oui' : 'non')
  const parts = [
    `séances ${yes(caps.services?.get(WORKOUT))}`,
    `fichiers 0x2C ${yes(caps.services?.get(FILES))}`,
    `TruSleep ${yes(caps.commands?.get(`${FITNESS}/22`))}`,
    `stress auto ${yes(caps.commands?.get(`${STRESS}/9`))}`,
  ]
  if (caps.settings != null) parts.push(`réglages 0x${caps.settings.toString(16)}`)
  if (caps.expand) parts.push(`sommeil dictionnaire ${yes(hasExpand(caps.expand, EXPAND.SLEEP_DICTIONARY))}`, `VFC ${yes(hasExpand(caps.expand, EXPAND.HRV))}`)
  return parts.join(', ')
}

// ── Séances (§7.5) ─────────────────────────────────────────────────────────────

/** Code de sport Huawei → type d'activité HealthTrack (mêmes noms que Health Connect). */
export const WORKOUT_TYPES = {
  1: 'running', 2: 'walking', 3: 'cycling', 4: 'hiking', 5: 'runningTreadmill', 6: 'swimmingPool', 7: 'bikingStationary',
  8: 'swimmingOpenWater', 11: 'running', 13: 'walking', 14: 'hiking', 21: 'jumpRope', 128: 'tableTennis', 129: 'badminton',
  130: 'tennis', 131: 'soccer', 132: 'basketball', 133: 'volleyball', 134: 'elliptical', 135: 'rowingMachine',
  136: 'stairClimbing', 137: 'yoga', 138: 'pilates', 139: 'dance', 140: 'strengthTraining', 141: 'bikingStationary',
  143: 'highIntensityIntervalTraining', 145: 'crossTraining', 146: 'functionalStrengthTraining', 177: 'stairClimbing',
  200: 'rowing', 224: 'tennis', 255: 'other',
}

export const workoutListTlvs = (startMs, endMs) => [
  { tag: 0x81, value: encodeTlvs([{ tag: 3, value: int(Math.max(MIN_START_SEC, Math.floor(startMs / 1000)), 4) }, { tag: 4, value: int(Math.floor(endMs / 1000), 4) }]) },
]
/** Réponse 0x17/0x07 → numéros de séance (identifiants de la montre). */
export const parseWorkoutList = (tlvs) =>
  inner(tlvs)
    .filter((t) => t.tag === 0x85)
    .map((t) => find(decodeTlvs(t.value), 6))
    .filter(Boolean)
    .map(uint)
export const workoutTotalsTlvs = (number) => [{ tag: 0x81, value: [0x02, 0x02, ...int(number, 2)] }]

/** Réponse 0x17/0x08 → { number, start, end (ms), kcal, distanceM, steps, durationSec, sport, hrMin?, hrMax? } ou null. */
export function parseWorkoutTotals(tlvs) {
  const b = inner(tlvs)
  const start = uint(find(b, 4)) * 1000
  const end = uint(find(b, 5)) * 1000
  if (!start || !(end > start)) return null
  const code = find(b, 0x14)?.[0]
  const w = {
    number: uint(find(b, 2)),
    start,
    end,
    kcal: uint(find(b, 6)),
    distanceM: uint(find(b, 7)),
    steps: uint(find(b, 8)),
    durationSec: uint(find(b, 0x12)) || Math.round((end - start) / 1000),
    sport: WORKOUT_TYPES[code] || 'other',
  }
  const hr = find(b, 0x0c)
  if (hr?.length >= 2) {
    if (hr[0] > 0 && hr[0] < 255) w.hrMin = hr[0]
    if (hr[1] > 0 && hr[1] < 255) w.hrMax = hr[1]
  }
  return w
}

/** Séances : une séance illisible (bloc vide ou plus court qu'annoncé, §7.10) n'empêche pas de lire les autres. */
async function readWorkouts(session, since, until, log) {
  const list = parseWorkoutList((await session.request(WORKOUT, WORKOUT_CMD.LIST, workoutListTlvs(since, until))).tlvs)
  log(`séances : ${list.length}`)
  const items = []
  let failed = 0
  let failure = null
  for (const n of list) {
    try {
      const w = parseWorkoutTotals((await session.request(WORKOUT, WORKOUT_CMD.TOTALS, workoutTotalsTlvs(n))).tlvs)
      if (w && w.start >= since - DAY && w.start < until) items.push(w)
      else log(`séance ${n} hors période ou incomplète`)
    } catch (e) {
      failed++
      failure = failure || outcomeOf(e)
      log(`séance ${n} non lue : ${e?.message || e}`, 'warn')
    }
  }
  return { items, outcome: items.length ? 'ok' : failure || (list.length ? 'ok' : 'empty'), units: list.length, failed }
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
export function watchEntries({ minutes = [], sleep = [], nights = [], workouts = [] }, { until, sourceName = 'Montre Huawei' }) {
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
  // Une nuit détaillée (fichier) remplace les périodes simples qui la recoupent
  const detailed = (p) => nights.some((n) => p.start < n.end && p.start + p.minutes * 60_000 > n.start)
  for (const n of nights) {
    if (!(n.end <= until)) continue
    const night = { nightStart: iso(n.start), nightEnd: iso(n.end), ...(n.score ? { sleepScore: n.score } : {}) }
    for (const p of n.stages) {
      out.push({ type: 'sleep', source: WATCH_SOURCE, at: iso(p.start), payload: { durationMinutes: p.minutes, sleepState: p.stage, endDate: iso(p.start + p.minutes * 60_000), detail: true, ...night, ...base } })
    }
    // VFC moyenne de la nuit, au réveil + 15 s (aucune autre entrée de FC n'y tombe)
    if (n.hrvMs) out.push({ type: 'heart_rate', source: WATCH_SOURCE, at: iso(floorTo(n.end, 60_000) + 15_000), payload: { value: n.hrvMs, unit: 'ms', subtype: 'heartRateVariability', during: 'sleep', ...base } })
  }
  for (const w of workouts) {
    if (!(w.end <= until)) continue
    out.push({
      type: 'activity',
      source: WATCH_SOURCE,
      at: iso(w.start),
      payload: {
        workoutType: w.sport,
        durationSeconds: w.durationSec,
        ...(w.kcal ? { totalCalories: w.kcal } : {}),
        ...(w.distanceM ? { totalDistanceMeters: w.distanceM } : {}),
        ...(w.steps ? { steps: w.steps } : {}),
        ...(w.hrMin ? { minHeartRate: w.hrMin } : {}),
        ...(w.hrMax ? { maxHeartRate: w.hrMax } : {}),
        endDate: iso(w.end),
        ...base,
      },
    })
  }
  for (const p of sleep) {
    if (p.stage === 'unknown' || detailed(p)) continue
    out.push({ type: 'sleep', source: WATCH_SOURCE, at: iso(p.start), payload: { durationMinutes: p.minutes, sleepState: p.stage, endDate: iso(p.start + p.minutes * 60_000), ...base } })
  }
  return out.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
}

/**
 * Nombre de blocs puis chaque bloc. Un bloc refusé ou illisible est sauté ; un bloc sans réponse arrête la
 * lecture de ce service (la montre ne répond plus), mais ce qui est déjà lu est gardé.
 * @returns {Promise<{ items: object[], outcome: string, units: number, failed: number }>}
 */
async function readBlocks(session, countCmd, dataCmd, since, until, parse, log, label) {
  const count = parseCount((await session.request(FITNESS, countCmd, countTlvs(since, until))).tlvs)
  log(`${label} : ${count} bloc${count > 1 ? 's' : ''}`)
  const items = []
  let failed = 0
  let failure = null
  for (let i = 0; i < count; i++) {
    let reply
    try {
      reply = await session.request(FITNESS, dataCmd, blockTlvs(i))
    } catch (e) {
      failed += count - i
      failure = outcomeOf(e)
      log(`${label} : bloc ${i} non lu (${e?.message || e}), ${count - i} bloc${count - i > 1 ? 's' : ''} abandonné${count - i > 1 ? 's' : ''}`, 'warn')
      break
    }
    const code = resultCode(reply.tlvs)
    if (code !== null && code !== RESULT_SUCCESS) {
      failed++
      failure = failure || 'refused'
      log(`${label} : bloc ${i} refusé (code ${code})`, 'warn')
      continue
    }
    try {
      items.push(...parse(reply.tlvs))
    } catch (e) {
      failed++
      failure = failure || 'error'
      log(`${label} : bloc ${i} illisible (${e?.message || e})`, 'warn')
    }
  }
  const outcome = items.length ? 'ok' : failure || (count ? 'ok' : 'empty')
  return { items, outcome, units: count, failed }
}

// ── Issue de chaque lecture (I69) ──────────────────────────────────────────────

/** Ce qui est lu, dans l'ordre de la synchro : nom dans le journal et commande (§7). */
export const SYNC_READS = [
  { id: 'sleep', label: 'sommeil', command: '7/0x0C' },
  { id: 'minutes', label: 'minutes', command: '7/0x0A' },
  { id: 'totals', label: 'totaux du jour', command: '7/0x03' },
  { id: 'workouts', label: 'séances', command: '0x17/0x07' },
  { id: 'sleepFile', label: 'sommeil détaillé', command: '0x2C' },
]
/** Issue d'une lecture : ok · empty (rien) · timeout · refused · unsupported (la montre a dit non) · error. */
export function outcomeOf(e) {
  const msg = e?.message || String(e)
  if (/^Pas de réponse|incomplet/.test(msg)) return 'timeout'
  return /refusé/.test(msg) ? 'refused' : 'error'
}
const OUTCOME_LABELS = { ok: 'reçu', empty: 'vide', timeout: 'sans réponse', refused: 'refusé', unsupported: 'non pris en charge', error: 'erreur' }

/** Une lecture du journal : { id, label, command, outcome, count, units?, failed? } — des nombres, jamais de valeur. */
const serviceRead = (id, outcome, extra = {}) => ({ ...SYNC_READS.find((r) => r.id === id), outcome, ...extra })

/** « sommeil : sans réponse, minutes : vide » : lectures qui n'ont rien rendu (toutes si `all`). */
export function describeServices(services = [], { all = false } = {}) {
  return services
    .filter((s) => all || s.outcome !== 'ok' || s.failed)
    .map((s) => `${s.label} : ${OUTCOME_LABELS[s.outcome] || s.outcome}${s.outcome === 'ok' ? ` (${s.count})` : ''}${s.failed ? `, ${s.failed} bloc${s.failed > 1 ? 's' : ''} perdu${s.failed > 1 ? 's' : ''}` : ''}`)
    .join(', ')
}

/** Lectures où la montre a calé (sans réponse, refus, erreur) : ce que l'utilisateur doit savoir. */
export const stalledServices = (services = []) => services.filter((s) => ['timeout', 'refused', 'error'].includes(s.outcome))

/**
 * Pistes pour le journal quand l'historique reste vide (§7.10), sans valeur personnelle.
 * @returns {string[]}
 */
export function syncHints(services = [], { caps = null, totals = null } = {}) {
  const get = (id) => services.find((s) => s.id === id)
  const hints = []
  if (get('sleepFile')?.outcome === 'timeout' && caps?.services?.get(FILES) === true) {
    hints.push('fichiers 0x2C déclarés mais sans réponse : piste du canal RFCOMM auxiliaire (§7.10, PR 6448)')
  }
  const minutes = get('minutes')
  if (minutes?.outcome === 'empty' && totals?.steps > 0) {
    hints.push('aucun bloc minute alors que la montre compte des pas aujourd’hui : historique pas encore écrit, ou période demandée refusée (§7.2)')
  }
  const stalled = stalledServices(services)
  if (stalled.length && stalled.length === services.filter((s) => s.outcome !== 'unsupported').length) {
    hints.push('aucune lecture n’a abouti : montre occupée ou liaison instable, réessayer montre près du téléphone')
  }
  return hints
}

/** « 6×3, 7×1 » : types bruts des périodes de sommeil (seuls 6 et 7 sont connus, §7.3). */
export const describeTypes = (periods) =>
  Object.entries(periods.reduce((acc, p) => ({ ...acc, [p.type]: (acc[p.type] || 0) + 1 }), {}))
    .map(([t, n]) => `${t}×${n}`)
    .join(', ')

/** « pas 120, FC 45, SpO₂ 3 » : nombre de minutes portant chaque mesure. */
export function describeMinutes(minutes) {
  const labels = { steps: 'pas', kcal: 'kcal', distanceM: 'distance', hr: 'FC', spo2: 'SpO₂', restingHr: 'FC repos' }
  const n = {}
  for (const m of minutes) for (const k of Object.keys(labels)) if (m[k]) n[k] = (n[k] || 0) + 1
  return Object.entries(n).map(([k, c]) => `${labels[k]} ${c}`).join(', ') || 'aucune mesure'
}

/**
 * Déroule la synchro sur une session authentifiée. Ne garde que [since, until).
 * Chaque lecture est indépendante : un service qui cale n'empêche pas de lire les suivants (`services`).
 * @returns {Promise<{ minutes: object[], sleep: object[], totals: object|null, workouts: object[], nights: object[], services: object[], hints: string[], capabilities: string }>}
 */
export async function readWatchData(session, { since, until, now = until, log = () => {}, tzOffsetMinutes = -new Date(now).getTimezoneOffset(), caps: knownCaps = null }) {
  // heure et capacités déjà envoyées / lues par la fin d'association (pairing.js) : pas de seconde fois
  if (!knownCaps) await setWatchTime(session, now, tzOffsetMinutes, log)
  const caps = knownCaps || (await readCapabilities(session, log))
  log(`capacités : ${describeCapabilities(caps)}`)
  const services = []
  /** Lit un service sans jamais arrêter la synchro : l'issue est consignée, l'échec rend `fallback`. */
  const attempt = async (id, fn, fallback) => {
    try {
      const r = await fn()
      services.push(serviceRead(id, r.outcome, { count: r.outcome === 'empty' ? 0 : r.items.length, ...(r.units != null ? { units: r.units } : {}), ...(r.failed ? { failed: r.failed } : {}) }))
      return r.items
    } catch (e) {
      const label = SYNC_READS.find((r) => r.id === id).label
      log(`${label} non lu : ${e?.message || e}`, 'warn')
      services.push(serviceRead(id, outcomeOf(e), { count: 0 }))
      return fallback
    }
  }
  const skip = (id) => services.push(serviceRead(id, 'unsupported', { count: 0 }))

  const sleepAll = await attempt('sleep', () => readBlocks(session, FIT.SLEEP_COUNT, FIT.SLEEP_DATA, since, until, parseSleepBlock, log, 'sommeil'), [])
  const sleep = sleepAll.filter((p) => p.start >= since - DAY && p.start < until)
  if (sleepAll.length) log(`sommeil : ${sleepAll.length} période${sleepAll.length > 1 ? 's' : ''} (types ${describeTypes(sleepAll)}), ${sleep.length} dans la période`)
  const minutesAll = await attempt('minutes', () => readBlocks(session, FIT.MINUTE_COUNT, FIT.MINUTE_DATA, since, until, parseMinuteBlock, log, 'minutes'), [])
  const minutes = minutesAll.filter((m) => m.t >= since && m.t < until)
  if (minutesAll.length) log(`minutes : ${minutesAll.length} reçues, ${minutes.length} dans la période (${describeMinutes(minutes)})`)
  const [totals = null] = await attempt('totals', async () => {
    const t = parseTotals((await session.request(FITNESS, FIT.TOTALS, [{ tag: 1 }])).tlvs)
    return { items: [t], outcome: t.steps || t.kcal || t.distanceM ? 'ok' : 'empty' }
  }, [])
  let workouts = []
  if (canDo(caps, WORKOUT, WORKOUT_CMD.LIST)) workouts = await attempt('workouts', () => readWorkouts(session, since, until, log), [])
  else skip('workouts')
  let nights = []
  if (canDo(caps, FILES, 0x01) && (!caps?.expand || hasExpand(caps.expand, EXPAND.SLEEP_DICTIONARY))) {
    nights = await attempt('sleepFile', async () => {
      const file = await downloadFile(
        session,
        { name: 'sequence_data', type: FILE_TYPE.SEQUENCE, startMs: since - DAY, endMs: until, dictionary: SLEEP_DICTIONARY },
        { log },
      )
      const items = file ? parseSleepSequence(file).filter((n) => n.end > since && n.end <= until) : []
      log(`sommeil détaillé : ${items.length} nuit${items.length > 1 ? 's' : ''}`)
      return { items, outcome: items.length ? 'ok' : 'empty' }
    }, [])
  } else skip('sleepFile')
  log(`lectures : ${describeServices(services, { all: true })}`)
  const hints = syncHints(services, { caps, totals })
  for (const h of hints) log(`piste : ${h}`, 'warn')
  return { minutes, sleep, totals, workouts, nights, services, hints, capabilities: describeCapabilities(caps) }
}

/** Reprise après une longue absence : jamais plus de 30 jours relus. */
export const RESUME_MAX_DAYS = 30
/** Recouvrement relu à chaque synchro (doublons écartés à l'écriture) : la fenêtre n'est jamais vide. */
export const SYNC_OVERLAP_MS = 6 * HOUR

/**
 * Période à relire, jusqu'à l'heure pleine. Première synchro : depuis le 1/1/2000 (§7.2), la montre
 * rend tout ce qu'elle a encore. Ensuite : depuis la dernière synchro réussie moins 6 h de recouvrement
 * (une synchro relancée dans la même heure relit donc quand même les dernières heures), 30 jours au plus.
 */
export function syncWindow(lastUntil, nowMs, { maxDays = RESUME_MAX_DAYS, overlapMs = SYNC_OVERLAP_MS } = {}) {
  const until = floorTo(nowMs, HOUR)
  if (!lastUntil) return { since: MIN_START_SEC * 1000, until }
  return { since: Math.max(until - maxDays * DAY, Math.min(lastUntil, until) - overlapMs), until }
}

/**
 * Totaux du jour (7/0x03, de minuit à maintenant) → entrées « total du jour » (`period: 'day'`), à minuit
 * local + 50 s (aucune tranche horaire n'y tombe). Le journal garde le plus grand entre ce total et la
 * somme des tranches horaires : rien n'est compté deux fois. Une synchro suivante remplace ces entrées.
 */
export function totalsEntries(totals, nowMs, { sourceName = 'Montre Huawei' } = {}) {
  if (!totals) return []
  const base = { connector: WATCH_SOURCE, sourceName, period: 'day', endDate: iso(nowMs) }
  const at = iso(localDayStart(nowMs) + 50_000)
  const out = []
  if (totals.steps > 0) out.push({ type: 'steps', source: WATCH_SOURCE, at, payload: { value: totals.steps, unit: 'count', ...(totals.distanceM > 0 ? { distanceM: totals.distanceM } : {}), ...base } })
  if (totals.kcal > 0) out.push({ type: 'calories', source: WATCH_SOURCE, at, payload: { value: totals.kcal, unit: 'kcal', ...base } })
  return out
}

/** Nombre d'entrées par genre (journal de diagnostic : ce qui a vraiment été écrit). */
export function countEntryKinds(entries) {
  const out = {}
  for (const e of entries) {
    const k = e.payload?.period === 'day' ? `${e.type}_jour` : e.payload?.subtype || e.type
    out[k] = (out[k] || 0) + 1
  }
  return out
}
