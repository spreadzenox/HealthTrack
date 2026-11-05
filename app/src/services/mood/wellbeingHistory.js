/**
 * Historique du bien-être (POL-2, retours du propriétaire du 24/10 vers 15:00) : pour une période (jour, semaine,
 * mois), la courbe du bien-être estimé et le détail de ce que sortent les modèles du visage — valence, éveil et, pour
 * les lectures qui les portent, les probabilités des 8 expressions d'AffectNet (FaceAffect.EXPRESSIONS). Fonction
 * pure, rien de stocké.
 *
 * - Jour : chaque lecture du déverrouillage (ou de l'ouverture, en play) est un point, avec sa fourchette ; au-delà
 *   de DAY_MAX_POINTS lectures (une toutes les 2 min au plus), un point par heure (médianes pondérées de la note et de
 *   la fourchette), sinon la courbe devient un trait illisible sur un écran de téléphone (I83).
 * - Semaine / mois : un point par jour lu, médiane pondérée de ses lectures (même règle que faceMoodDays) ; un jour
 *   de moins de FACE_MOOD_MIN_READINGS lectures est marqué « peu de lectures » (il ne compte pas dans les Analyses).
 * - Les notes de bien-être données à la main sont montrées à part (points distincts), jamais mêlées à l'estimation.
 *
 * Anti-circularité (D5) : uniquement des entrées Y (rafales du visage, notes) ; aucun facteur X n'est lu ici.
 * Ce sont des estimations de l'expression du visage, jamais un diagnostic ni ce que la personne ressent.
 */
import { localDateKey } from '../analysisEngine'
import { moodFaceBursts } from '../faceBursts'
import { BASELINE_DAYS, estimateBurst, isPoorReading, notesAgreement, personalCalibration, personalNeutral, readingWeight, weightedMedian } from './faceMood'
import { FACE_MOOD_MIN_READINGS } from './faceMoodDays'

export const PERIODS = { day: 1, week: 7, month: 30 }
/** Au-delà, la vue « jour » regroupe les lectures par heure (≈ 12 px par point sur la largeur de la courbe). */
export const DAY_MAX_POINTS = 24

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

/**
 * Fin de la période affichée quand on remonte le temps (BE-HISTO-DETAIL-2) : `now` au décalage 0, sinon la fin du
 * dernier jour de la période `offset` crans plus tôt (un cran = 1, 7 ou 30 jours, sans chevauchement).
 */
export function viewEnd(period, now, offset = 0) {
  if (!offset) return now
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  end.setDate(end.getDate() - offset * PERIODS[period])
  return end
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

/** Jours de lectures avec expressions qu'il faut au moins pour parler d'une habitude. */
export const HABIT_MIN_DAYS = 3
/** Écart à l'habitude (en part, 0–1) à partir duquel la phrase le mentionne. */
export const HABIT_SHIFT = 0.05

/**
 * Expressions habituelles de la personne (BE-BIAIS-3, retour (5) du 04/11 : « 42 % tristesse alors que j'allais
 * plutôt bien ») : moyenne de chaque expression sur les 28 jours qui finissent à `end`. Chez beaucoup de gens, un
 * visage au repos est lu en partie « triste » ou « méprisant » : comparer à cette habitude dit ce qui change vraiment.
 * Rend { days, p: { [key]: number } }, ou null sous HABIT_MIN_DAYS jours.
 */
export function habitualMix(bursts, end) {
  const t = end.getTime()
  const recent = bursts.filter((b) => {
    const bt = Date.parse(b.at)
    return bt <= t && bt > t - BASELINE_DAYS * DAY_MS
  })
  const mix = expressionMix(recent)
  if (!mix) return null
  const days = new Set(recent.filter((b) => isNum(b.payload.values?.exNeutral)).map((b) => localDateKey(b.at))).size
  if (days < HABIT_MIN_DAYS) return null
  return { days, p: Object.fromEntries(mix.items.map((it) => [it.key, it.p])) }
}

/** Ajoute à chaque expression sa part habituelle (`habit`) et l'écart (`delta`), et le nombre de jours de l'habitude. */
function withHabit(mix, habit) {
  if (!mix || !habit) return mix
  return {
    ...mix,
    habitDays: habit.days,
    items: mix.items.map((it) => ({ ...it, habit: habit.p[it.key], delta: round2(it.p - habit.p[it.key]) })),
  }
}

/**
 * Ce qui change par rapport à l'habitude : jusqu'à 2 expressions dont la part s'écarte d'au moins HABIT_SHIFT, la plus
 * grande d'abord. [] quand tout est proche de l'habitude ; null sans habitude.
 */
export function habitShifts(mix) {
  if (!mix?.habitDays) return null
  return mix.items
    .filter((it) => isNum(it.delta) && Math.abs(it.delta) >= HABIT_SHIFT)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 2)
    .map((it) => ({ key: it.key, label: it.label, delta: it.delta }))
}

/**
 * Détail d'un point de la courbe (BE-HISTO-DETAIL, retour (6) du 04/11) : ce que les modèles ont lu dans ses lectures
 * (une lecture, une heure ou un jour) — valence et éveil moyens, expressions, et combien de lectures étaient peu nettes.
 */
export function pointDetail(bursts) {
  const v = mean(bursts.map((b) => b.payload.values.valence))
  const a = mean(bursts.map((b) => b.payload.values.arousal))
  return {
    readings: bursts.length,
    poor: bursts.filter(isPoorReading).length,
    valence: v == null ? null : round2(v),
    arousal: a == null ? null : round2(a),
    expressions: expressionMix(bursts),
  }
}

/** Lectures d'un jour regroupées par heure locale : médianes pondérées, à l'heure de la lecture du milieu. */
function byHour(readings, date, burstAt) {
  const hours = new Map()
  for (const r of readings) {
    const h = new Date(r.at).getHours()
    if (!hours.has(h)) hours.set(h, [])
    hours.get(h).push(r)
  }
  const wm = (list, key) => {
    const withV = list.filter((r) => isNum(r[key]))
    return withV.length ? round2(weightedMedian(withV.map((r) => r[key]), withV.map(readingWeight))) : undefined
  }
  return [...hours.values()].map((list) => ({
    at: list[Math.floor(list.length / 2)].at,
    date,
    note: wm(list, 'note'),
    low: wm(list, 'low'),
    high: wm(list, 'high'),
    readings: list.length,
    hourly: true,
    detail: pointDetail(list.map((r) => burstAt.get(r.at)).filter(Boolean)),
  }))
}

/**
 * @param {object[]} entries  entrées `face_burst` et `wellbeing` (les autres sont ignorées)
 * @param {{ period?: 'day'|'week'|'month', now?: Date }} [opts]
 * @returns {{ period, from: string, points: { at: string, date: string, note: number, low?: number, high?: number,
 *   readings: number, few?: boolean, hourly?: boolean, detail: ReturnType<typeof pointDetail> }[], notes: { at: string, score: number }[], readings: number, days: number,
 *   mean: number|null, valence: number|null, arousal: number|null,
 *   expressions: null | { readings: number, habitDays?: number, items: { key, label, p, habit?, delta? }[] },
 *   agreement: null | { days: number, gap: number }, earliest: string|null }}
 */
export function wellbeingHistory(entries, { period = 'week', now = new Date() } = {}) {
  const from = periodStart(period, now)
  const fromIso = from.toISOString()
  const nowIso = now.toISOString()
  const all = moodFaceBursts(entries || []).sort((a, b) => (a.at < b.at ? -1 : 1))
  const manual = (entries || []).filter((e) => e?.type === 'wellbeing' && isNum(e.payload?.score))
  const inPeriod = all.filter((b) => b.at >= fromIso && b.at <= nowIso)
  const calibration = inPeriod.length ? personalCalibration(entries) : null
  const byDay = new Map()
  for (const b of inPeriod) {
    const dk = localDateKey(b.at)
    if (!byDay.has(dk)) byDay.set(dk, [])
    byDay.get(dk).push(b)
  }
  let points = []
  const dayReadings = []
  for (const [date, list] of byDay) {
    // Visage habituel calculé une fois par jour, à sa dernière lecture (comme faceMoodDays).
    const base = personalNeutral(all, list[list.length - 1].at)
    const readings = list.map((b) => estimateBurst(b, { bursts: all, calibration, base }))
    if (period === 'day') {
      dayReadings.push(...readings)
      readings.forEach((r, i) => points.push({
        at: r.at, date, note: r.note, low: r.low, high: r.high, readings: 1, detail: pointDetail([list[i]]),
      }))
    } else {
      const note = weightedMedian(readings.map((r) => r.note), readings.map(readingWeight))
      points.push({
        at: list[list.length - 1].at, date, note: round2(note), readings: list.length,
        few: list.length < FACE_MOOD_MIN_READINGS, detail: pointDetail(list),
      })
    }
  }
  const notes = manual
    .filter((e) => e.at >= fromIso && e.at <= nowIso)
    .sort((a, b) => (a.at < b.at ? -1 : 1))
    .map((e) => ({ at: e.at, score: e.payload.score }))
  const valence = mean(inPeriod.map((b) => b.payload.values.valence))
  const arousal = mean(inPeriod.map((b) => b.payload.values.arousal))
  // La moyenne du jour reste celle des lectures, qu'elles soient regroupées par heure ou non.
  const m = mean(period === 'day' ? dayReadings.map((r) => r.note) : points.map((p) => p.note))
  if (period === 'day' && dayReadings.length > DAY_MAX_POINTS) {
    points = byHour(dayReadings, localDateKey(from), new Map(inPeriod.map((b) => [b.at, b])))
  }
  const habit = inPeriod.length ? habitualMix(all, now) : null
  if (habit) {
    points = points.map((p) => (p.detail?.expressions ? { ...p, detail: { ...p.detail, expressions: withHabit(p.detail.expressions, habit) } } : p))
  }
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
    expressions: withHabit(expressionMix(inPeriod), habit),
    // Écart mesuré entre vos notes et le visage (null sous 3 jours notés).
    agreement: inPeriod.length ? notesAgreement(entries || []) : null,
    // Première lecture ou note connue : jusqu'où l'on peut remonter le temps.
    earliest: [all[0]?.at, ...manual.map((e) => e.at)].filter(Boolean).sort()[0] ?? null,
  }
}
