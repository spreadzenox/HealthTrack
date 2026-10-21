/**
 * Fichiers détaillés d'une montre Huawei (service 0x2C) : téléchargement d'un fichier et lecture du
 * sommeil détaillé (fichier « sequence_data », dictionnaire 700013 : phases, score, VFC de la nuit).
 * Écrit d'après journal/protocoles/huawei.md §7.6 (aucun code Gadgetbridge).
 */
import { decodeTlvs, resultCode, RESULT_SUCCESS } from './protocol'

export const FILES = 0x2c
export const FILE_CMD = { OPEN: 0x01, INFO: 0x03, BLOCK: 0x04, PUSH: 0x05, DONE: 0x06 }
export const FILE_TYPE = { SLEEP_STATE: 0x0e, STRESS: 0x10, SEQUENCE: 0x16 }
export const SLEEP_DICTIONARY = 700013
/** Taille maxi acceptée pour un fichier (garde-fou : une semaine de sommeil fait quelques Ko). */
export const MAX_FILE_BYTES = 2 * 1024 * 1024

const int = (n, size) => {
  const out = []
  for (let i = size - 1; i >= 0; i--) out.push(Math.floor(n / 2 ** (8 * i)) & 0xff)
  return out
}
const uint = (bytes) => Array.from(bytes || []).reduce((v, b) => v * 256 + b, 0)
const find = (tlvs, tag) => tlvs.find((t) => t.tag === tag)?.value
const sec = (ms) => Math.floor(ms / 1000)

/** Demande d'ouverture 0x2C/0x01. */
export function openFileTlvs({ name, type, startMs, endMs, dictionary = null }) {
  return [
    { tag: 1, value: Array.from(new TextEncoder().encode(name)) },
    { tag: 2, value: [type] },
    { tag: 5, value: int(sec(startMs), 4) },
    { tag: 6, value: int(sec(endMs), 4) },
    ...(dictionary != null ? [{ tag: 0x0c, value: int(dictionary, 4) }] : []),
  ]
}

/** Bloc poussé 0x2C/0x05 (corps brut) → { fileId, offset, data }. */
export function parsePush(raw) {
  if (!raw || raw.length < 6) return null
  return { fileId: raw[0], offset: uint(raw.slice(1, 5)), data: raw.slice(6) }
}

/**
 * Télécharge un fichier sur une session authentifiée. Rend ses octets, ou null s'il est vide.
 * Lève si la montre refuse ou se tait (l'appelant décide de continuer sans).
 */
export async function downloadFile(session, request, { log = () => {}, timeoutMs = 10_000 } = {}) {
  const opened = await session.request(FILES, FILE_CMD.OPEN, openFileTlvs(request))
  const code = resultCode(opened.tlvs)
  if (code !== null && code !== RESULT_SUCCESS) throw new Error(`fichier ${request.name} refusé (code ${code})`)
  const fileId = find(opened.tlvs, 3)?.[0]
  const size = uint(find(opened.tlvs, 4))
  if (fileId == null) throw new Error(`fichier ${request.name} : pas d'identifiant`)
  const done = () => session.send(FILES, FILE_CMD.DONE, [{ tag: 1, value: [fileId] }, { tag: 2, value: [1] }]).catch(() => {})
  if (!size || size === 0xffffffff) {
    await done()
    return null
  }
  if (size > MAX_FILE_BYTES) {
    await done()
    throw new Error(`fichier ${request.name} trop gros (${size} octets)`)
  }
  const info = await session.request(FILES, FILE_CMD.INFO, [{ tag: 1, value: [fileId] }, { tag: 2 }, { tag: 3 }, { tag: 4 }, { tag: 5 }])
  const maxBlock = uint(find(info.tlvs, 4)) || 4096
  const plain = (find(info.tlvs, 5)?.[0] ?? 0) === 1

  const file = new Uint8Array(size)
  let received = 0
  try {
    while (received < size) {
      const offset = received
      const want = Math.min(size - offset, maxBlock)
      await new Promise((resolve, reject) => {
        let got = 0
        const timer = setTimeout(() => finish(new Error(`fichier ${request.name} : bloc ${offset} incomplet`)), timeoutMs)
        const stop = session.listen(FILES, FILE_CMD.PUSH, (m) => {
          const p = parsePush(m.raw)
          if (!p || p.fileId !== fileId) return
          const at = p.offset - offset
          if (at < 0 || at + p.data.length > want) return finish(new Error(`fichier ${request.name} : bloc inattendu`))
          file.set(p.data, offset + at)
          got = Math.max(got, at + p.data.length)
          if (got >= want) finish()
        })
        function finish(err) {
          clearTimeout(timer)
          stop()
          if (err) reject(err)
          else resolve()
        }
        const block = [
          { tag: 1, value: [fileId] },
          { tag: 2, value: int(offset, 4) },
          { tag: 3, value: int(want, 4) },
          ...(request.dictionary != null ? [{ tag: 4, value: int(request.dictionary, 4) }] : []),
        ]
        session.send(FILES, FILE_CMD.BLOCK, block, { plain }).catch(finish)
      })
      received += want
    }
  } finally {
    await done()
  }
  log(`fichier ${request.name} : ${size} octets`)
  return file
}

// ── Sommeil détaillé (dictionnaire 700013) ─────────────────────────────────────

/** Champs du résumé d'une nuit (§7.6, §10.3). */
export const SLEEP_FIELD = {
  BED: 700013298,
  FALL_ASLEEP: 700013686,
  WAKE: 700013156,
  RISE: 700013973,
  VALID: 700013786,
  SCORE: 700013245,
  HRV: 700013878,
  AVG_HR: 700013580,
  MIN_HR: 700013436,
  MAX_HR: 700013502,
  WAKEUPS: 700013635,
  LATENCY: 700013713,
  EFFICIENCY: 700013232,
  DEEP_SHARE: 700013679,
  RESP_AVG: 700013886,
  RESP_MIN: 700013646,
  RESP_MAX: 700013492,
  SPO2_AVG: 700013468,
  SPO2_MIN: 700013340,
  SPO2_MAX: 700013026,
  HRV_BASE_MAX: 700013355,
  HRV_BASE_MIN: 700013305,
  HRV_DEVIATION: 700013824,
  BREATHING_INDEX: 700013759,
  DATA_QUALITY: 700013254,
}
const PHASES = { 1: 'light', 2: 'rem', 3: 'deep', 4: 'awake', 5: 'asleep' }
const NAP_PHASE = 5
/** Phase la plus longue acceptée (24 h) : au-delà, le bloc est abîmé. */
const MAX_PHASE_MINUTES = 1440

/** `BF 80 00 00` (−1,0 en réel de 4 octets) : valeur absente pour la montre. */
const isMissing = (bytes) => bytes.length === 4 && bytes[0] === 0xbf && bytes[1] === 0x80 && bytes[2] === 0 && bytes[3] === 0

/** Valeur d'un champ du résumé selon son type (1, 2, 4 entier ; 3 long ; 6 réel ; 5 texte) ; null si absente. */
function fieldValue(type, bytes) {
  if (isMissing(bytes)) return null
  const view = () => new DataView(Uint8Array.from(bytes).buffer)
  if (type === 6 && bytes.length === 8) return view().getFloat64(0)
  if (type === 6 && bytes.length === 4) return view().getFloat32(0)
  if (type === 5) return new TextDecoder().decode(Uint8Array.from(bytes))
  // entier signé : « données valides = −1 » s'écrit FF…FF
  if (bytes.length === 4 || bytes.length === 8) return bytes[0] & 0x80 ? uint(bytes) - 2 ** (8 * bytes.length) : uint(bytes)
  return uint(bytes)
}

/** Résumé TLV → Map numéro de champ → valeur (parcourt tous les niveaux de conteneurs). */
export function parseSummary(bytes) {
  const fields = new Map()
  const walk = (data) => {
    let tlvs
    try {
      tlvs = decodeTlvs(data)
    } catch {
      return
    }
    const id = find(tlvs, 3)
    const value = find(tlvs, 5)
    if (id && value) {
      const v = fieldValue(find(tlvs, 4)?.[0], value)
      if (v != null) fields.set(uint(id), v)
    }
    for (const t of tlvs) if (t.tag & 0x80) walk(t.value)
  }
  walk(bytes)
  return fields
}

const u32le = (b, i) => b[i] + b[i + 1] * 256 + b[i + 2] * 65536 + b[i + 3] * 16777216
const inRange = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi
const round1 = (v) => Math.round(v * 10) / 10

/**
 * Mesures du résumé gardées pour une nuit valide, avec leurs bornes (valeur hors bornes = ignorée).
 * Celles dont l'unité n'est pas sûre (latence, efficacité, lignes de base…) vont dans `extras`, brutes.
 */
const NIGHT_METRICS = [
  ['score', SLEEP_FIELD.SCORE, 1, 100, Math.round],
  ['hrvMs', SLEEP_FIELD.HRV, 5, 300, round1],
  ['avgHr', SLEEP_FIELD.AVG_HR, 25, 200, Math.round],
  ['minHr', SLEEP_FIELD.MIN_HR, 25, 200, Math.round],
  ['maxHr', SLEEP_FIELD.MAX_HR, 25, 220, Math.round],
  ['wakeups', SLEEP_FIELD.WAKEUPS, 0, 100, Math.round],
  ['respAvg', SLEEP_FIELD.RESP_AVG, 4, 60, round1],
  ['respMin', SLEEP_FIELD.RESP_MIN, 4, 60, round1],
  ['respMax', SLEEP_FIELD.RESP_MAX, 4, 60, round1],
  ['spo2Avg', SLEEP_FIELD.SPO2_AVG, 50, 100, Math.round],
  ['spo2Min', SLEEP_FIELD.SPO2_MIN, 50, 100, Math.round],
  ['spo2Max', SLEEP_FIELD.SPO2_MAX, 50, 100, Math.round],
]
const NIGHT_EXTRAS = {
  latency: SLEEP_FIELD.LATENCY,
  efficiency: SLEEP_FIELD.EFFICIENCY,
  deepShare: SLEEP_FIELD.DEEP_SHARE,
  hrvBaselineMax: SLEEP_FIELD.HRV_BASE_MAX,
  hrvBaselineMin: SLEEP_FIELD.HRV_BASE_MIN,
  hrvDeviation: SLEEP_FIELD.HRV_DEVIATION,
  breathingIndex: SLEEP_FIELD.BREATHING_INDEX,
  dataQuality: SLEEP_FIELD.DATA_QUALITY,
}

/**
 * Fichier « sequence_data » du dictionnaire 700013 → nuits et siestes :
 * [{ start, end (ms), nap?, score?, hrvMs?, avgHr?, minHr?, maxHr?, wakeups?, respAvg?, respMin?, respMax?,
 *    spo2Avg?, spo2Min?, spo2Max?, extras?, stages: [{ start (ms), minutes, stage }] }].
 * `bedTime` (capacité 199) : les phases partent de l'heure de coucher si la nuit est valide, sinon de
 * l'endormissement. Une nuit marquée invalide (« données valides » = −1 : sieste ou nuit incomplète) garde
 * ses phases mais aucune mesure du résumé.
 */
export function parseSleepSequence(bytes, { bedTime = true } = {}) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || [])
  const nights = []
  let i = 32 // en-tête de fichier
  while (i + 32 <= b.length) {
    const start = uint(b.slice(i, i + 4)) * 1000
    const version = b[i + 8]
    const summaryType = b[i + 9]
    const summaryLen = uint(b.slice(i + 10, i + 12))
    const detailLen = uint(b.slice(i + 12, i + 16))
    i += 32
    if (i + summaryLen + detailLen > b.length) break
    const summary = version === 1 && summaryType === 2 ? parseSummary(b.slice(i, i + summaryLen)) : new Map()
    i += summaryLen
    const detail = b.slice(i, i + detailLen)
    i += detailLen

    const validMark = summary.get(SLEEP_FIELD.VALID)
    const invalid = validMark != null && validMark < 0
    const valid = validMark > 0
    // nuit invalide : l'heure de coucher n'a plus de sens (remise à zéro), départ à l'endormissement ou au début
    const bed = invalid ? null : summary.get(SLEEP_FIELD.BED)
    const asleep = summary.get(SLEEP_FIELD.FALL_ASLEEP)
    const origin = (bedTime && valid && bed > 0 ? bed : null) ?? (asleep > 0 ? asleep : null) ?? (bed > 0 ? bed : start / 1000)
    let t = Math.floor((origin * 1000) / 60_000) * 60_000
    const stages = []
    let nap = false
    for (let k = 0; k + 8 <= detail.length; k += 8) {
      const seconds = u32le(detail, k)
      // durée abîmée (pas une minute entière, ou plus d'un jour) : bloc ignoré, le temps n'avance pas
      if (seconds % 60 !== 0 || seconds / 60 > MAX_PHASE_MINUTES) continue
      const minutes = seconds / 60
      const stage = PHASES[detail[k + 4]]
      if (minutes > 0 && stage) {
        stages.push({ start: t, minutes, stage })
        if (detail[k + 4] === NAP_PHASE) nap = true
      }
      t += minutes * 60_000
    }
    if (!stages.length) continue
    const night = { start: stages[0].start, end: t, stages }
    if (nap) night.nap = true
    if (!invalid) {
      for (const [key, id, lo, hi, fmt] of NIGHT_METRICS) {
        const v = summary.get(id)
        if (inRange(v, lo, hi)) night[key] = fmt(v)
      }
      if (night.spo2Min > night.spo2Avg) delete night.spo2Min
      const extras = {}
      for (const [key, id] of Object.entries(NIGHT_EXTRAS)) {
        const v = summary.get(id)
        if (typeof v === 'number' && Number.isFinite(v)) extras[key] = round1(v)
      }
      if (Object.keys(extras).length) night.extras = extras
    }
    nights.push(night)
  }
  return nights
}
