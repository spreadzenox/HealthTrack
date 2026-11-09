/**
 * Bien-être « dans les heures » (ANALYSES-ONGLETS-5, retours du propriétaire du 04/11 point 4) : les lectures du
 * visage prises dans les 2 h après le début d'un repas comparées à celles prises loin des repas, le même jour.
 *
 * - Y = estimation de chaque lecture du visage (même modèle que l'historique : visage habituel, calibration, recalage) ;
 *   X = l'heure des repas notés (entrées `food`). Aucune donnée du repas n'entre dans l'estimation (D5), et le repas
 *   précède toujours la lecture comparée (ordre temporel).
 * - Ce qui ne bouge qu'à l'échelle du jour (nuit, météo, ventre du jour…) s'annule : chaque lecture est prise par
 *   rapport à la médiane de son jour. Le moment de la journée aussi : on retire l'écart moyen de chaque tranche de
 *   3 heures (les repas tombent aux mêmes heures, le visage du matin n'est pas celui du soir).
 * - Unité d'analyse = le jour (les lectures d'un même jour ne sont pas indépendantes) : un écart « après − loin » par
 *   jour qui a les deux, au moins MEAL_HOURS_MIN_DAYS jours ; test de permutation des signes (graine fixe), une seule
 *   comparaison. Un écart n'est dit que s'il est net (p < 0,05) et d'au moins MIN_SHIFT point.
 * - Règle 6 : aucun sens n'est présupposé ; plus haut ou plus bas, l'écart est dit tel quel, sans conseil.
 */
import { localDateKey } from '../analysisEngine'
import { moodFaceBursts } from '../faceBursts'
import { estimateBurst, personalCalibration, personalNeutral, readingWeight, weightedMedian } from './faceMood'
import { FACE_MOOD_MIN_READINGS } from './faceMoodDays'

export const AFTER_H = 2
/** Une lecture compte « loin des repas » si aucun repas n'a commencé dans les AWAY_H heures d'avant. */
export const AWAY_H = 3
export const MEAL_HOURS_MIN_DAYS = 10
export const MIN_SHIFT = 0.1
const BIN_H = 3
const H_MS = 3600000
const PERMUTATIONS = 4000

// `+ 0` : un -0 (petit décalage négatif arrondi) devient 0, sinon le cache JSON le relit autrement (09/11).
export const round2 = (v) => Math.round(v * 100) / 100 + 0
const mean = (v) => v.reduce((s, x) => s + x, 0) / v.length

/** Générateur pseudo-aléatoire à graine (mulberry32) : même résultat à chaque calcul. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** p bilatéral du test de permutation des signes sur la moyenne des écarts journaliers. */
export function signFlipP(diffs, { permutations = PERMUTATIONS, seed = 42 } = {}) {
  const observed = Math.abs(mean(diffs))
  const rand = rng(seed)
  let extreme = 0
  for (let i = 0; i < permutations; i++) {
    let s = 0
    for (const d of diffs) s += rand() < 0.5 ? -d : d
    if (Math.abs(s / diffs.length) >= observed - 1e-12) extreme++
  }
  return (extreme + 1) / (permutations + 1)
}

/**
 * @param {object[]} entries
 * @returns {{ status: 'no_face' } | { status: 'no_meals' }
 *   | { status: 'not_enough_data', currentDays: number, minDays: number }
 *   | { status: 'ok', days: number, shift: number, p: number, clear: boolean }}
 *   shift : écart moyen (points de bien-être, 0–5) des lectures dans les 2 h après un repas par rapport à celles loin
 *   des repas, le même jour et à heure comparable.
 */
export function mealHoursEffect(entries) {
  const bursts = moodFaceBursts(entries).sort((a, b) => (a.at < b.at ? -1 : 1))
  if (!bursts.length) return { status: 'no_face' }
  const meals = (entries || [])
    .filter((e) => e?.type === 'food' && e.at && !Number.isNaN(Date.parse(e.at)))
    .map((e) => Date.parse(e.at))
    .sort((a, b) => a - b)
  if (!meals.length) return { status: 'no_meals' }

  const byDay = new Map()
  for (const b of bursts) {
    const dk = localDateKey(b.at)
    if (!byDay.has(dk)) byDay.set(dk, [])
    byDay.get(dk).push(b)
  }
  const calibration = personalCalibration(entries)
  const readings = []
  for (const list of byDay.values()) {
    if (list.length < FACE_MOOD_MIN_READINGS) continue
    const base = personalNeutral(bursts, list[list.length - 1].at)
    const est = list.map((b) => estimateBurst(b, { bursts, calibration, base }))
    const dayMedian = weightedMedian(est.map((r) => r.note), est.map(readingWeight))
    list.forEach((b, i) => {
      const t = Date.parse(b.at)
      readings.push({ day: localDateKey(b.at), bin: Math.floor(new Date(t).getHours() / BIN_H), t, r: est[i].note - dayMedian })
    })
  }

  // Écart moyen de chaque tranche horaire, retiré de ses lectures.
  const bins = new Map()
  for (const x of readings) {
    const s = bins.get(x.bin) ?? { sum: 0, n: 0 }
    s.sum += x.r
    s.n++
    bins.set(x.bin, s)
  }
  const perDay = new Map()
  for (const x of readings) {
    const { sum, n } = bins.get(x.bin)
    const value = x.r - sum / n
    const last = lastMealBefore(meals, x.t)
    const since = last == null ? Infinity : x.t - last
    const group = since <= AFTER_H * H_MS ? 'after' : since > AWAY_H * H_MS ? 'away' : null
    if (!group) continue
    const d = perDay.get(x.day) ?? { after: [], away: [] }
    d[group].push(value)
    perDay.set(x.day, d)
  }
  const diffs = [...perDay.values()].filter((d) => d.after.length && d.away.length).map((d) => mean(d.after) - mean(d.away))
  if (diffs.length < MEAL_HOURS_MIN_DAYS) {
    return { status: 'not_enough_data', currentDays: diffs.length, minDays: MEAL_HOURS_MIN_DAYS }
  }
  const shift = mean(diffs)
  const p = signFlipP(diffs)
  return { status: 'ok', days: diffs.length, shift: round2(shift), p: Math.round(p * 1000) / 1000, clear: p < 0.05 && Math.abs(shift) >= MIN_SHIFT }
}

/** Début du dernier repas commencé au plus tard à `t` (recherche dichotomique), ou null. */
function lastMealBefore(meals, t) {
  let lo = 0
  let hi = meals.length - 1
  let found = null
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (meals[mid] <= t) {
      found = meals[mid]
      lo = mid + 1
    } else hi = mid - 1
  }
  return found
}
