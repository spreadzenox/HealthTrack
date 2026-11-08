/**
 * Détail d'un jour de Journal › Tendances (ORG-3c, revue design du 07/11). Fonction pure, sans React.
 * - lectures du visage du jour et note éventuelle ;
 * - « Expressions du visage » : les 8 expressions du jour, l'habitude des 28 jours et la phrase « Plus de tristesse,
 *   moins de joie que d'habitude » dès 5 points d'écart ;
 * - « Humeur et éveil » : un point par lecture (valence, éveil), la moyenne du jour, l'habitude (moyenne et dispersion
 *   des 28 jours) et la phrase « Éveil plutôt calme, moins que d'habitude ».
 * Ce sont des estimations de l'expression du visage, jamais un diagnostic.
 */
import { localDateKey } from './analysisEngine'
import { moodFaceBursts } from './faceBursts'
import { expressionMix, habitualMix, habitShifts, pointDetail, wellbeingHistory } from './mood/wellbeingHistory'
import { toDisplay } from './mood/wellbeingScale'
import { gutLevelLabel } from './today'

const DAY_MS = 86_400_000
const HABIT_DAYS = 28
/** Écart de valence ou d'éveil moyen (sur −1…1) à partir duquel on dit « plus » ou « moins que d'habitude ». */
export const VA_SHIFT = 0.1

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null)
const sd = (xs, m) => (xs.length > 1 ? Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)) : 0)

/** « Plus de tristesse, moins de joie que d'habitude » (habitShifts), ou null. */
export function shiftsSentence(shifts) {
  if (!shifts?.length) return null
  const word = (s) => `${s.delta > 0 ? 'plus' : 'moins'} de ${s.label.toLowerCase()}`
  const text = shifts.map(word).join(', ')
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} que d’habitude`
}

/** « Éveil plutôt calme, moins que d'habitude » : l'axe qui s'écarte le plus de l'habitude, sinon l'éveil. */
export function vaSentence(day, habit) {
  if (!day || !isNum(day.v) || !isNum(day.a)) return null
  const dv = habit ? day.v - habit.v : 0
  const da = habit ? day.a - habit.a : 0
  const axis = Math.abs(dv) > Math.abs(da) ? 'v' : 'a'
  const value = day[axis]
  const delta = axis === 'v' ? dv : da
  const name = axis === 'v' ? 'Expression' : 'Éveil'
  const where = axis === 'v'
    ? (value >= 0 ? 'plutôt agréable' : 'plutôt désagréable')
    : (value >= 0 ? 'plutôt animé' : 'plutôt calme')
  if (!habit) return `${name} ${where}`
  // « moins » / « plus » se dit du sens de l'axe : moins animé pour l'éveil, moins agréable pour l'humeur
  const cmp = Math.abs(delta) < VA_SHIFT ? 'comme d’habitude' : `${delta > 0 ? 'plus' : 'moins'} que d’habitude`
  return `${name} ${where}, ${cmp}`
}

/**
 * @param {object[]} entries  rafales du visage (`face_burst`) et notes de bien-être
 * @param {string} dateKey    AAAA-MM-JJ
 * @returns {{ readings: number, note: number | null, mix: object | null, shifts: string | null,
 *   points: { v: number, a: number }[], day: { v, a } | null, habit: { v, a, sv, sa } | null, vaText: string | null }}
 */
export function dayFaceDetail(entries, dateKey) {
  const bursts = moodFaceBursts(entries || [])
  const ofDay = bursts.filter((b) => localDateKey(b.at) === dateKey)
  const notes = (entries || []).filter((e) => e?.type === 'wellbeing' && isNum(e.payload?.score) && localDateKey(e.at) === dateKey)
  const lastNote = notes.sort((a, b) => (a.at < b.at ? -1 : 1)).pop()
  // Note digestive du jour, la plus marquée (« noté « gêne » ») : douleur, sinon gêne, sinon calme
  const gutLevels = (entries || []).filter((e) => e?.type === 'gut' && localDateKey(e.at) === dateKey).map((e) => e.payload?.level)
  const gutLevel = ['pain', 'discomfort', 'calm'].find((l) => gutLevels.includes(l)) ?? null
  const end = new Date(`${dateKey}T23:59:59`)
  const habitMix = habitualMix(bursts, end)
  const mix = expressionMix(ofDay)
  const withHabit = mix && habitMix
    ? { ...mix, habitDays: habitMix.days, items: mix.items.map((it) => ({ ...it, habit: habitMix.p[it.key], delta: Math.round((it.p - habitMix.p[it.key]) * 100) / 100 })) }
    : mix
  const va = (b) => ({ v: b.payload.values?.valence, a: b.payload.values?.arousal })
  const points = ofDay.map(va).filter((p) => isNum(p.v) && isNum(p.a))
  const detail = pointDetail(ofDay)
  const day = isNum(detail.valence) && isNum(detail.arousal) ? { v: detail.valence, a: detail.arousal } : null
  const from = end.getTime() - HABIT_DAYS * DAY_MS
  const past = bursts.filter((b) => { const t = Date.parse(b.at); return t <= end.getTime() && t > from }).map(va).filter((p) => isNum(p.v) && isNum(p.a))
  const days = new Set(bursts.filter((b) => { const t = Date.parse(b.at); return t <= end.getTime() && t > from }).map((b) => localDateKey(b.at))).size
  let habit = null
  if (days >= 3 && past.length >= 3) {
    const mv = mean(past.map((p) => p.v))
    const ma = mean(past.map((p) => p.a))
    habit = { v: mv, a: ma, sv: sd(past.map((p) => p.v), mv), sa: sd(past.map((p) => p.a), ma) }
  }
  return {
    readings: ofDay.length,
    gut: gutLevel ? gutLevelLabel(gutLevel).toLowerCase() : null,
    note: lastNote ? toDisplay(lastNote.payload.score) : null,
    mix: withHabit,
    shifts: shiftsSentence(habitShifts(withHabit)),
    points,
    day,
    habit,
    vaText: vaSentence(day, habit),
  }
}

const hourOf = (iso) => {
  const d = new Date(iso)
  return d.getHours() + d.getMinutes() / 60
}

/**
 * Vue Jour de Tendances (correction T2 du propriétaire, maquette « Agir et Tendances ») : les lectures du visage du
 * jour à leur heure (au-delà de 24 lectures, une par heure, comme l'ancien historique) et la dernière note du jour,
 * sur l'échelle affichée de 1 à 5. Aujourd'hui : seulement ce qui est déjà fait, et l'heure de « maintenant ».
 * @returns {{ readings: { at: string, hour: number, value: number }[], note: { hour: number, value: number } | null,
 *   nowHour: number | null }}
 */
export function dayReadingsView(entries, dateKey, now = new Date()) {
  const isToday = localDateKey(now.toISOString()) === dateKey
  const end = isToday ? now : new Date(`${dateKey}T23:59:59.999`)
  const h = wellbeingHistory(entries || [], { period: 'day', now: end })
  const readings = h.points
    .filter((p) => localDateKey(p.at) === dateKey && isNum(p.note))
    .map((p) => ({ at: p.at, hour: hourOf(p.at), value: toDisplay(p.note) }))
  const last = h.notes.filter((n) => localDateKey(n.at) === dateKey).pop()
  return {
    readings,
    note: last ? { hour: hourOf(last.at), value: toDisplay(last.score) } : null,
    nowHour: isToday ? hourOf(now.toISOString()) : null,
  }
}

/**
 * Jour ouvert par défaut en vue Jour (T3) : aujourd'hui s'il a déjà une lecture du visage ou une note, sinon le
 * dernier jour passé qui en a une (la nuit, avant la première lecture, on voit la veille plutôt qu'un jour vide).
 * @returns {string | null} AAAA-MM-JJ, ou null s'il n'y a ni lecture ni note
 */
export function latestReadingDay(entries, now = new Date()) {
  const t = now.getTime()
  let best = null
  const notes = (entries || []).filter((e) => e?.type === 'wellbeing' && isNum(e.payload?.score))
  for (const e of [...moodFaceBursts(entries || []), ...notes]) {
    const at = Date.parse(e.at)
    if (!Number.isFinite(at) || at > t) continue
    if (best === null || at > best) best = at
  }
  return best === null ? null : localDateKey(new Date(best).toISOString())
}
