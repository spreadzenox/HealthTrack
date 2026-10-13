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

export const SLEEP_FIELD = {
  BED: 700013298,
  FALL_ASLEEP: 700013686,
  WAKE: 700013156,
  RISE: 700013973,
  VALID: 700013786,
  SCORE: 700013245,
  HRV: 700013878,
  AVG_HR: 700013580,
}
const PHASES = { 1: 'light', 2: 'rem', 3: 'deep', 4: 'awake', 5: 'asleep' }

/** Valeur d'un champ du résumé selon son type (1, 2, 4 entier ; 3 long ; 6 réel ; 5 texte). */
function fieldValue(type, bytes) {
  if (type === 6 && bytes.length === 8) return new DataView(Uint8Array.from(bytes).buffer).getFloat64(0)
  if (type === 5) return new TextDecoder().decode(Uint8Array.from(bytes))
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
    if (id && value) fields.set(uint(id), fieldValue(find(tlvs, 4)?.[0], value))
    for (const t of tlvs) if (t.tag & 0x80) walk(t.value)
  }
  walk(bytes)
  return fields
}

const u32le = (b, i) => b[i] + b[i + 1] * 256 + b[i + 2] * 65536 + b[i + 3] * 16777216

/**
 * Fichier « sequence_data » du dictionnaire 700013 → nuits :
 * [{ start, end (ms), score?, hrvMs?, avgHr?, stages: [{ start (ms), minutes, stage }] }].
 */
export function parseSleepSequence(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes || [])
  const nights = []
  let i = 32 // en-tête de fichier
  while (i + 32 <= b.length) {
    const start = uint(b.slice(i, i + 4)) * 1000
    const version = b[i + 8]
    const summaryLen = uint(b.slice(i + 10, i + 12))
    const detailLen = uint(b.slice(i + 12, i + 16))
    i += 32
    if (i + summaryLen + detailLen > b.length) break
    const summary = version === 1 ? parseSummary(b.slice(i, i + summaryLen)) : new Map()
    i += summaryLen
    const detail = b.slice(i, i + detailLen)
    i += detailLen

    const bed = summary.get(SLEEP_FIELD.BED)
    const asleep = summary.get(SLEEP_FIELD.FALL_ASLEEP)
    const origin = bed && summary.get(SLEEP_FIELD.VALID) ? bed : asleep || bed || start / 1000
    let t = Math.floor((origin * 1000) / 60_000) * 60_000
    const stages = []
    for (let k = 0; k + 8 <= detail.length; k += 8) {
      const minutes = Math.round(u32le(detail, k) / 60)
      const stage = PHASES[detail[k + 4]]
      if (minutes > 0 && stage) stages.push({ start: t, minutes, stage })
      t += minutes * 60_000
    }
    if (!stages.length) continue
    const night = { start: stages[0].start, end: t, stages }
    const score = summary.get(SLEEP_FIELD.SCORE)
    const hrv = summary.get(SLEEP_FIELD.HRV)
    const hr = summary.get(SLEEP_FIELD.AVG_HR)
    if (score > 0 && score <= 100) night.score = Math.round(score)
    if (hrv >= 5 && hrv <= 300) night.hrvMs = Math.round(hrv * 10) / 10
    if (hr >= 25 && hr <= 200) night.avgHr = Math.round(hr)
    nights.push(night)
  }
  return nights
}
