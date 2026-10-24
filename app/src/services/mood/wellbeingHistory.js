/**
 * Historique du bien-être (POL-2, retours du propriétaire du 24/10 vers 15:00) : pour une période (jour, semaine,
 * mois), la courbe du bien-être estimé et le détail de ce que sortent les modèles du visage — valence, éveil et, pour
 * les lectures qui les portent, les probabilités des 8 expressions d'AffectNet (FaceAffect.EXPRESSIONS). Fonction
 * pure, rien de stocké.
 *
 * - Jour : chaque lecture du déverrouillage (ou de l'ouverture, en play) est un point, avec sa fourchette.
 * - Semaine / mois : un point par jour lu, médiane pondérée de ses lectures (même règle que faceMoodDays) ; un jour
 *   de moins de FACE_MOOD_MIN_READINGS lectures est marqué « peu de lectures » (il ne compte pas dans les Analyses).
 * - Les notes de bien-être données à la main sont montrées à part (points distincts), jamais mêlées à l'estimation.
 *
 * Anti-circularité (D5) : uniquement des entrées Y (rafales du visage, notes) ; aucun facteur X n'est lu ici.
 * Ce sont des estimations de l'expression du visage, jamais un diagnostic ni ce que la personne ressent.
 */
import { localDateKey } from '../analysisEngine'
import { moodFaceBursts } from '../faceBursts'
import { estimateBurst, personalCalibration, personalNeutral, readingWeight, weightedMedian } from './faceMood'
import { FACE_MOOD_MIN_READINGS } from './faceMoodDays'

export const PERIODS = { day: 1, week: 7, month: 30 }

/** Les 8 expressions, dans l'ordre d'affichage, avec leur libellé (clés écrites par FacePipeline.java). */
export const EXPRESSIONS = [
  { key: 'exHappiness', label: 'Joie' },
  { key: 'exNeutral', label: 'Neutre' },
  { key: 'exSurprise', label: 'Surprise' },
  { key: 'exSadness', label: 'Tristesse' },
  { key: 'exAnger', label: 'Colère' },
  { key: 'exFear', label: 'Peur' },
  { key: 'exDisgust', label: 'Dégoût' },
  { key: 'exContempt', label: 'Mépris' },
]

const DAY_MS = 86400000
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const round2 = (v) => Math.round(v * 100) / 100
const mean = (values) => {
  const v = values.filter(isNum)
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null
}

function periodStart(period, now) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return new Date(start.getTime() - (PERIODS[period] - 1) * DAY_MS)
}

/** Moyenne de chaque expression sur les lectures qui en portent : [{ key, label, p }] trié, ou null sans aucune. */
export function expressionMix(bursts) {
  const withEx = bursts.filter((b) => EXPRESSIONS.every(({ key }) => isNum(b.payload.values?.[key])))
  if (!withEx.length) return null
  return {
    readings: withEx.length,
    items: EXPRESSIONS
      .map(({ key, label }) => ({ key, label, p: round2(mean(withEx.map((b) => b.payload.values[key]))) }))
      .sort((a, b) => b.p - a.p),
  }
}

/**
 * @param {object[]} entries  entrées `face_burst` et `wellbeing` (les autres sont ignorées)
 * @param {{ period?: 'day'|'week'|'month', now?: Date }} [opts]
 * @returns {{ period, from: string, points: { at: string, date: string, note: number, low?: number, high?: number,
 *   readings: number, few?: boolean }[], notes: { at: string, score: number }[], readings: number, days: number,
 *   mean: number|null, valence: number|null, arousal: number|null,
 *   expressions: null | { readings: number, items: { key, label, p }[] } }}
 */
export function wellbeingHistory(entries, { period = 'week', now = new Date() } = {}) {
  const from = periodStart(period, now)
  const fromIso = from.toISOString()
  const nowIso = now.toISOString()
  const all = moodFaceBursts(entries || []).sort((a, b) => (a.at < b.at ? -1 : 1))
  const inPeriod = all.filter((b) => b.at >= fromIso && b.at <= nowIso)
  const calibration = inPeriod.length ? personalCalibration(entries) : null
  const byDay = new Map()
  for (const b of inPeriod) {
    const dk = localDateKey(b.at)
    if (!byDay.has(dk)) byDay.set(dk, [])
    byDay.get(dk).push(b)
  }
  const points = []
  for (const [date, list] of byDay) {
    // Visage habituel calculé une fois par jour, à sa dernière lecture (comme faceMoodDays).
    const base = personalNeutral(all, list[list.length - 1].at)
    const readings = list.map((b) => estimateBurst(b, { bursts: all, calibration, base }))
    if (period === 'day') {
      for (const r of readings) points.push({ at: r.at, date, note: r.note, low: r.low, high: r.high, readings: 1 })
    } else {
      const note = weightedMedian(readings.map((r) => r.note), readings.map(readingWeight))
      points.push({
        at: list[list.length - 1].at, date, note: round2(note), readings: list.length,
        few: list.length < FACE_MOOD_MIN_READINGS,
      })
    }
  }
  const notes = (entries || [])
    .filter((e) => e?.type === 'wellbeing' && isNum(e.payload?.score) && e.at >= fromIso && e.at <= nowIso)
    .sort((a, b) => (a.at < b.at ? -1 : 1))
    .map((e) => ({ at: e.at, score: e.payload.score }))
  const valence = mean(inPeriod.map((b) => b.payload.values.valence))
  const arousal = mean(inPeriod.map((b) => b.payload.values.arousal))
  const m = mean(points.map((p) => p.note))
  return {
    period,
    from: fromIso,
    points,
    notes,
    readings: inPeriod.length,
    days: byDay.size,
    mean: m == null ? null : round2(m),
    valence: valence == null ? null : round2(valence),
    arousal: arousal == null ? null : round2(arousal),
    expressions: expressionMix(inPeriod),
  }
}
