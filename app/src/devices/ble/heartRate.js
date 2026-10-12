/**
 * Profil Bluetooth standard « Heart Rate » (service 0x180D, caractéristique 0x2A37) :
 * décodage des trames, nettoyage des intervalles RR et VFC (RMSSD), conversion en entrées HealthTrack.
 * Spécification : Bluetooth SIG, Heart Rate Service 1.0 / GATT Specification Supplement.
 * Fonctionne avec toute ceinture cardio (Polar H10, Garmin HRM, Wahoo TICKR…) et les montres qui
 * « diffusent » leur fréquence cardiaque.
 */

const RR_MIN_MS = 300 // 200 bpm
const RR_MAX_MS = 2000 // 30 bpm
const RR_MAX_JUMP = 0.2 // saut relatif max entre deux battements retenus (battement manqué / en trop)
const MIN_CLEAN_RR = 50
const MIN_CLEAN_SECONDS = 60
const MAX_REJECTED_RATIO = 0.2
const BIN_MS = 10_000

/**
 * @param {DataView} view
 * @returns {{ bpm: number, contact: boolean|null, energyKj: number|null, rrMs: number[] } | null}
 */
export function parseHeartRateMeasurement(view) {
  if (!view || view.byteLength < 2) return null
  const flags = view.getUint8(0)
  let offset = 1
  const wide = flags & 0x01
  if (view.byteLength < offset + (wide ? 2 : 1)) return null
  const bpm = wide ? view.getUint16(offset, true) : view.getUint8(offset)
  offset += wide ? 2 : 1
  const contactSupported = (flags & 0x04) !== 0
  const contact = contactSupported ? (flags & 0x02) !== 0 : null
  let energyKj = null
  if (flags & 0x08) {
    if (view.byteLength >= offset + 2) energyKj = view.getUint16(offset, true)
    offset += 2
  }
  const rrMs = []
  if (flags & 0x10) {
    for (; offset + 1 < view.byteLength; offset += 2) {
      rrMs.push(Math.round((view.getUint16(offset, true) * 1000) / 1024))
    }
  }
  return { bpm, contact, energyKj, rrMs }
}

/**
 * Garde les RR plausibles (300–2000 ms) qui ne s'écartent pas de plus de 20 % du dernier RR retenu.
 * `pairs` = différences entre battements retenus réellement consécutifs (pour le RMSSD).
 * @param {number[]} rr
 */
export function cleanRrIntervals(rr) {
  const kept = []
  const pairs = []
  let last = null
  let lastWasKept = false
  let rejected = 0
  for (const v of rr) {
    const ok = v >= RR_MIN_MS && v <= RR_MAX_MS && (last === null || Math.abs(v - last) <= RR_MAX_JUMP * last)
    if (!ok) {
      rejected++
      lastWasKept = false
      continue
    }
    if (lastWasKept) pairs.push(v - last)
    kept.push(v)
    last = v
    lastWasKept = true
  }
  return { kept, rejected, pairs }
}

/** RMSSD (ms) d'une suite de RR consécutifs, ou null s'il n'y a pas au moins une différence. */
export function rmssd(rr) {
  const diffs = []
  for (let i = 1; i < rr.length; i++) diffs.push(rr[i] - rr[i - 1])
  return rmssdFromDiffs(diffs)
}

function rmssdFromDiffs(diffs) {
  if (diffs.length === 0) return null
  return Math.sqrt(diffs.reduce((s, d) => s + d * d, 0) / diffs.length)
}

/**
 * Résumé d'une mesure : FC moyenne / min / max et VFC (RMSSD) seulement si elle est fiable.
 * quality : 'good' | 'short' (moins d'1 min de battements propres) | 'noisy' (> 20 % d'artefacts) | 'no_rr' (capteur sans RR).
 * @param {Array<{ at: number, bpm: number, rrMs: number[] }>} samples
 */
export function summarizeHeartRateSession(samples) {
  const valid = (samples || []).filter((s) => s.bpm > 0)
  if (valid.length === 0) return null
  const bpms = valid.map((s) => s.bpm)
  const allRr = (samples || []).flatMap((s) => s.rrMs || [])
  const { kept, rejected, pairs } = cleanRrIntervals(allRr)
  const cleanSeconds = kept.reduce((a, b) => a + b, 0) / 1000
  let quality = 'good'
  if (allRr.length === 0) quality = 'no_rr'
  else if (rejected / allRr.length > MAX_REJECTED_RATIO) quality = 'noisy'
  else if (kept.length < MIN_CLEAN_RR || cleanSeconds < MIN_CLEAN_SECONDS) quality = 'short'
  const value = quality === 'good' ? rmssdFromDiffs(pairs) : null
  return {
    meanBpm: Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length),
    minBpm: Math.min(...bpms),
    maxBpm: Math.max(...bpms),
    rmssdMs: value === null ? null : Math.round(value * 10) / 10,
    rrCount: kept.length,
    rejectedCount: rejected,
    durationSec: Math.round((valid[valid.length - 1].at - valid[0].at) / 1000),
    quality,
  }
}

/**
 * Entrées HealthTrack d'une mesure : FC moyennée par tranches de 10 s + VFC si fiable.
 * Même forme que les mesures Health Connect (type heart_rate + subtype), source « ble ».
 */
export function sessionToEntries(samples, summary, { deviceName }) {
  const valid = (samples || []).filter((s) => s.bpm > 0)
  if (valid.length === 0) return []
  const t0 = valid[0].at
  const bins = new Map()
  for (const s of valid) {
    const k = Math.floor((s.at - t0) / BIN_MS)
    if (!bins.has(k)) bins.set(k, [])
    bins.get(k).push(s.bpm)
  }
  const payloadBase = { sourceName: deviceName || 'Capteur Bluetooth', connector: 'ble' }
  const entries = [...bins.entries()].map(([k, list]) => ({
    type: 'heart_rate',
    source: 'ble',
    at: new Date(t0 + k * BIN_MS).toISOString(),
    payload: { bpm: Math.round(list.reduce((a, b) => a + b, 0) / list.length), unit: 'bpm', subtype: 'heartRate', ...payloadBase },
  }))
  if (summary?.rmssdMs != null) {
    entries.push({
      type: 'heart_rate',
      source: 'ble',
      at: new Date(valid[valid.length - 1].at + 1).toISOString(),
      payload: {
        value: summary.rmssdMs,
        unit: 'ms',
        subtype: 'heartRateVariability',
        method: 'rmssd',
        rrCount: summary.rrCount,
        durationSec: summary.durationSec,
        ...payloadBase,
      },
    })
  }
  return entries
}
