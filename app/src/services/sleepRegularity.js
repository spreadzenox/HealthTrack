/**
 * Régularité du sommeil : se coucher et se lever à des heures stables.
 *
 * La régularité est associée, au-delà de la durée, à un meilleur bien-être le lendemain
 * (Senthil et al., IEEE BHI 2025) et à un moindre risque de mortalité (Windred et al.,
 * Sleep 2023, UK Biobank — observationnel). Méthode, sur les 14 derniers jours :
 *   - une nuit principale par jour de réveil : les enregistrements de sommeil séparés de
 *     moins de 2 h sont réunis (phases d'une même nuit), la plus longue période l'emporte
 *     (une sieste ne remplace pas la nuit) ; au moins 2 h ;
 *   - heures de coucher et de lever : moyenne et écart-type, en minutes autour de minuit
 *     (23 h 30 et 0 h 30 → minuit, et non midi) ;
 *   - indice de régularité (SRI simplifié, Phillips et al. 2017) : sur des tranches de
 *     30 min, probabilité d'être dans le même état (endormi / éveillé) à 24 h d'intervalle,
 *     ramenée de 0 à 100 ; seulement entre deux nuits consécutives enregistrées ;
 *   - décalage du week-end (« jet-lag social ») : milieu de nuit des réveils du samedi et
 *     du dimanche moins celui des autres jours.
 * Une observation, jamais un diagnostic.
 */

import { localDateKey } from './wellbeingSeries'

export const REGULARITY_DAYS = 14
export const MIN_NIGHTS = 7
export const MIN_SRI_PAIRS = 5
const MIN_MAIN_SLEEP_MIN = 120
const MAX_MAIN_SLEEP_MIN = 16 * 60
const MAX_GAP_MS = 2 * 3600000
const SLOT_MS = 30 * 60000
const SLOTS_PER_DAY = 48
const NOT_SLEEP = new Set(['awake', 'inBed', 'outOfBed'])

function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

/** Bornes [début, fin] d'un enregistrement de sommeil, en ms, ou null. */
function bounds(e) {
  const start = new Date(e.at).getTime()
  if (!Number.isFinite(start)) return null
  const p = e.payload || {}
  let end = p.endDate ? new Date(p.endDate).getTime() : NaN
  if (!Number.isFinite(end) && isNum(p.durationMinutes)) end = start + p.durationMinutes * 60000
  if (!Number.isFinite(end) || end <= start) return null
  return [start, end]
}

function segmentsOf(entries) {
  const segs = []
  for (const e of entries || []) {
    if (e?.type !== 'sleep' || !e.at || e.payload?.nap) continue
    const state = e.payload?.sleepState
    if (state === 'outOfBed') continue
    const b = bounds(e)
    if (b) segs.push({ start: b[0], end: b[1], asleep: !state || !NOT_SLEEP.has(state) })
  }
  return segs.sort((a, b) => a.start - b.start)
}

/** Intervalles réunis, sans chevauchement : une session et ses phases ne comptent qu'une fois. */
function unionOf(intervals) {
  const out = []
  for (const [a, b] of [...intervals].sort((x, y) => x[0] - y[0])) {
    const last = out[out.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else out.push([a, b])
  }
  return out
}

/** Périodes de sommeil (enregistrements réunis), avec leurs intervalles endormis. */
function sleepPeriods(entries) {
  const periods = []
  let cur = null
  for (const s of segmentsOf(entries)) {
    if (cur && s.start - cur.end <= MAX_GAP_MS) {
      cur.end = Math.max(cur.end, s.end)
      cur.segs.push(s)
    } else {
      cur = { start: s.start, end: s.end, segs: [s] }
      periods.push(cur)
    }
  }
  for (const p of periods) {
    const asleep = p.segs.filter((s) => s.asleep)
    // Seulement « au lit » (ou éveils) : faute de mieux, toute la période compte comme sommeil
    p.asleep = unionOf((asleep.length ? asleep : p.segs).map((s) => [s.start, s.end]))
    delete p.segs
  }
  return periods
}

/**
 * Nuit principale par jour local de réveil.
 * @returns {Map<string, { start: number, end: number, asleep: number[][] }>}
 */
export function mainSleepPeriods(entries) {
  const out = new Map()
  for (const p of sleepPeriods(entries)) {
    const mins = (p.end - p.start) / 60000
    if (mins < MIN_MAIN_SLEEP_MIN || mins > MAX_MAIN_SLEEP_MIN) continue
    const key = localDateKey(new Date(p.end).toISOString())
    const prev = out.get(key)
    if (!prev || p.end - p.start > prev.end - prev.start) out.set(key, p)
  }
  return out
}

function dayStart(key, offsetDays = 0, hour = 0) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d + offsetDays, hour).getTime()
}

function meanSd(values) {
  const n = values.length
  const mean = values.reduce((s, v) => s + v, 0) / n
  const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0
  return { mean, sd: Math.sqrt(variance) }
}

const mod1440 = (m) => ((Math.round(m) % 1440) + 1440) % 1440

/** État endormi (true) / éveillé de chaque tranche de 30 min, de midi la veille à midi le jour du réveil. */
function slotStates(key, intervals) {
  const noon = dayStart(key, -1, 12)
  return Array.from({ length: SLOTS_PER_DAY }, (_, k) => {
    const t = noon + k * SLOT_MS + SLOT_MS / 2
    return intervals.some(([a, b]) => t >= a && t < b)
  })
}

/**
 * @returns {null | {
 *   status: 'insufficient' | 'ok',
 *   nights: number,
 *   missingNights?: number,
 *   bedtime?: { mean: number, sd: number },   // minutes après minuit (0–1439), écart-type en minutes
 *   wake?: { mean: number, sd: number },
 *   level?: 'regular' | 'fairly' | 'variable',
 *   sri?: number | null,
 *   sriPairs?: number,
 *   weekendShift?: number | null,             // minutes (positif = plus tard le week-end)
 * }}
 */
export function computeSleepRegularity(entries, now = new Date()) {
  if (!(entries || []).some((e) => e?.type === 'sleep')) return null

  const keys = Array.from({ length: REGULARITY_DAYS }, (_, i) =>
    localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12).toISOString()),
  ).reverse()
  const periods = mainSleepPeriods(entries)
  const nights = keys.filter((k) => periods.has(k)).map((k) => {
    const p = periods.get(k)
    const midnight = dayStart(k)
    const wd = new Date(midnight).getDay()
    return {
      key: k,
      bed: (p.start - midnight) / 60000, // négatif avant minuit
      wake: (p.end - midnight) / 60000,
      weekend: wd === 0 || wd === 6,
    }
  })

  if (nights.length < MIN_NIGHTS) {
    return { status: 'insufficient', nights: nights.length, missingNights: MIN_NIGHTS - nights.length }
  }

  const bed = meanSd(nights.map((n) => n.bed))
  const wake = meanSd(nights.map((n) => n.wake))
  const worstSd = Math.max(bed.sd, wake.sd)
  const level = worstSd <= 30 ? 'regular' : worstSd <= 60 ? 'fairly' : 'variable'

  // SRI : toutes les périodes endormies (siestes comprises), comparées d'un jour au suivant
  const intervals = sleepPeriods(entries).flatMap((p) => p.asleep)
  let agree = 0
  let total = 0
  let pairs = 0
  for (let i = 1; i < keys.length; i++) {
    if (!periods.has(keys[i - 1]) || !periods.has(keys[i])) continue
    const a = slotStates(keys[i - 1], intervals)
    const b = slotStates(keys[i], intervals)
    for (let k = 0; k < SLOTS_PER_DAY; k++) if (a[k] === b[k]) agree += 1
    total += SLOTS_PER_DAY
    pairs += 1
  }
  const sri = pairs >= MIN_SRI_PAIRS ? Math.round(200 * (agree / total) - 100) : null

  const mids = (list) => list.map((n) => (n.bed + n.wake) / 2)
  const we = nights.filter((n) => n.weekend)
  const wk = nights.filter((n) => !n.weekend)
  const weekendShift = we.length >= 2 && wk.length >= 3
    ? Math.round(meanSd(mids(we)).mean - meanSd(mids(wk)).mean)
    : null

  return {
    status: 'ok',
    nights: nights.length,
    bedtime: { mean: mod1440(bed.mean), sd: Math.round(bed.sd) },
    wake: { mean: mod1440(wake.mean), sd: Math.round(wake.sd) },
    level,
    sri,
    sriPairs: pairs,
    weekendShift,
  }
}
