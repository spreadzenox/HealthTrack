/**
 * Behaviour tags — one-tap context added to the wellbeing check-in
 * (« Alcool », « Écran tard », « Stress »…), stored in the wellbeing entry
 * payload as `tags: string[]` (no schema change, old entries simply have none).
 *
 * Analysis: for each tag, wellbeing on days *with* the tag vs days *without*
 * (difference of means, two-sided permutation test, Benjamini-Hochberg across
 * tags). Evening behaviours are measured on the NEXT day's wellbeing, the
 * others on the same day. Only days since the first tag ever used count, so
 * the history recorded before the feature existed is not read as "without".
 *
 * Week-end control: wellbeing differs between week-ends and weekdays, and many
 * tags (alcohol…) are more frequent before a week-end. The comparison is
 * therefore stratified by the type of the day the wellbeing is measured on:
 * week-end days are compared with week-end days, weekdays with weekdays, and
 * the two differences are pooled (weights n_with·n_without / n, as in
 * Cochran-Mantel-Haenszel). The permutation test shuffles labels within each
 * stratum only. The raw (unstratified) difference is kept as `diffRaw`.
 */
import { localDateKey } from './wellbeingSeries'
import { benjaminiHochberg, evidenceLevel, isWeekendKey } from './statistics'

/** Minimum number of days with AND without a tag before comparing them. */
export const MIN_TAG_DAYS = 5

/** Number of random permutations of the permutation test. */
const PERMUTATIONS = 2000

/**
 * effectDay: 'next' → compared on the following day's wellbeing (evening
 * behaviours whose effect shows the day after), 'same' → same day.
 * auto: the tag is measured by the app itself when that capture is on ('phone_usage': late screen
 * from the phone's screen events) — the check-in then no longer asks for it, and the measured value
 * wins over a declared tag for the same evening (never ask for something the app already captures).
 * 'workouts': « Sport le soir » from the workouts recorded by the watch or Health Connect (start ≥ 18:00);
 * there a declared tag still counts on an evening nothing was recorded (sport without the watch): a
 * recorded workout adds the tag, it never removes one (`declaredAlsoCounts`).
 * 'meals': « Repas tardif » from the meals noted (a meal from 21:00, or after midnight); an evening is only
 * known when ≥ 2 meals were noted that day (one noted meal says nothing about the others), and a declared
 * tag still counts on the other evenings.
 * 'timezone': « Voyage » from a change of the phone's time zone (`context` entries, timezoneContext.js); a trip
 * in the same zone is not seen, so a declared tag still counts, and the check-in only stops asking on a day the
 * change was seen.
 * radarCause: a known, harmless reason for resting HR / HRV / sleep to drift
 * for a night or two — the radar then says « probably linked to… » instead of
 * raising a worry (radar.js, explainRadar).
 * side 'Y': the tag is part of the mood itself (felt stress is self-reported, an input of the mood
 * estimator, see mood/estimatorInputs.js) — never compared with wellbeing as if it were a cause (D5).
 */
export const BEHAVIOR_TAGS = [
  { id: 'alcohol', label: 'Alcool', emoji: '🍷', effectDay: 'next', radarCause: true },
  { id: 'coffee_late', label: 'Café après 14 h', emoji: '☕', effectDay: 'next' },
  { id: 'late_meal', label: 'Repas tardif', emoji: '🍽️', effectDay: 'next', radarCause: true, auto: 'meals', declaredAlsoCounts: true },
  { id: 'late_screen', label: 'Écran tard', emoji: '📱', effectDay: 'next', auto: 'phone_usage' },
  { id: 'evening_sport', label: 'Sport le soir', emoji: '🏃', effectDay: 'next', radarCause: true, auto: 'workouts', declaredAlsoCounts: true },
  { id: 'stress', label: 'Stress', emoji: '😣', effectDay: 'same', radarCause: true, side: 'Y' },
  { id: 'travel', label: 'Voyage', emoji: '✈️', effectDay: 'same', radarCause: true, auto: 'timezone', declaredAlsoCounts: true },
  { id: 'vaccine', label: 'Vaccin', emoji: '💉', effectDay: 'next', radarCause: true },
  { id: 'sick', label: 'Malade', emoji: '🤒', effectDay: 'same' },
]

const TAGS_BY_ID = Object.fromEntries(BEHAVIOR_TAGS.map((t) => [t.id, t]))

/** Minutes of screen between 22:00 and 04:00 from which an evening counts as « Écran tard ». */
export const AUTO_LATE_SCREEN_MIN = 30

/** A workout starting from this hour (local time) counts as « Sport le soir ». */
export const EVENING_SPORT_FROM_HOUR = 18

/** A meal noted from this hour (local time), or before LATE_MEAL_UNTIL_HOUR the night after, is « Repas tardif ». */
export const LATE_MEAL_FROM_HOUR = 21
const LATE_MEAL_UNTIL_HOUR = 4

/** Meals noted on a day before it tells anything about a late meal (no late one among them = « without »). */
const MIN_MEALS_PER_DAY = 2

/** Late meals are deduced (and no longer asked) when ≥ 2 meals were noted on this many of the last 14 days. */
const REGULAR_MEAL_DAYS = 7
const REGULAR_MEAL_WINDOW_DAYS = 14

/** Two time zones seen more than this many days apart say nothing about the day of the trip. */
const MAX_TIMEZONE_GAP_DAYS = 3

/** Shorter recorded sessions (a walk to the bus picked up by the watch…) are not a workout. */
const MIN_WORKOUT_SECONDS = 10 * 60

/** A recorded workout (watch / Health Connect session), not a distance-only `activity` entry. */
export function isWorkoutEntry(e) {
  const secs = e?.type === 'activity' ? e.payload?.durationSeconds : null
  return typeof secs === 'number' && secs >= MIN_WORKOUT_SECONDS
}

/**
 * Tags the check-in should not ask for, because the app measures them itself.
 * @param {{ phoneUsage?: boolean, workouts?: boolean, meals?: boolean, travelToday?: boolean }} captures  which
 *   automatic captures are on (`travelToday`: the time zone changed today)
 */
export function autoDetectedTagIds({ phoneUsage = false, workouts = false, meals = false, travelToday = false } = {}) {
  const on = { phone_usage: phoneUsage, workouts, meals, timezone: travelToday }
  return BEHAVIOR_TAGS.filter((t) => t.auto && on[t.auto]).map((t) => t.id)
}

/** 'YYYY-MM-DD' → the previous calendar day. */
function previousDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10)
}

/**
 * Measured tags per evening: Map<tagId, Map<dateKey, boolean>> (an evening missing from a map is unknown).
 * A phone_usage entry of day D carries the screen time of the evening of D−1 (22:00 → 04:00).
 */
export function measuredTagsByDay(entries) {
  const late = new Map()
  for (const e of entries) {
    if (e.type !== 'phone_usage') continue
    const date = e.payload?.date
    const mins = e.payload?.lateScreenMinutes
    if (typeof date !== 'string' || typeof mins !== 'number' || Number.isNaN(mins)) continue
    late.set(previousDateKey(date), mins >= AUTO_LATE_SCREEN_MIN)
  }
  return new Map([
    ['late_screen', late],
    ['evening_sport', eveningSport(entries)],
    ['late_meal', lateMeals(entries)],
    ['travel', timezoneChanges(entries)],
  ])
}

/**
 * Days the phone changed time zone (true), or kept the zone seen on a recent day (false). Each `context` entry
 * is compared with the one before it (several the same day when the zone changed during the day); a day whose
 * previous entry is older than MAX_TIMEZONE_GAP_DAYS, or the very first one, is unknown. The zone name is
 * compared, not the offset: summer time changes the offset, not the zone.
 */
function timezoneChanges(entries) {
  const seen = entries
    .filter((e) => e.type === 'context' && typeof e.payload?.tz === 'string' && e.payload.tz && typeof e.payload.date === 'string')
    .sort((a, b) => (a.payload.date === b.payload.date ? (a.at < b.at ? -1 : 1) : a.payload.date < b.payload.date ? -1 : 1))
  const out = new Map()
  for (let i = 1; i < seen.length; i++) {
    const prev = seen[i - 1].payload
    const cur = seen[i].payload
    const gap = (Date.parse(cur.date) - Date.parse(prev.date)) / 86_400_000
    if (!(gap <= MAX_TIMEZONE_GAP_DAYS)) continue
    out.set(cur.date, out.get(cur.date) === true || cur.tz !== prev.tz)
  }
  return out
}

/**
 * Evenings with a recorded workout (start ≥ EVENING_SPORT_FROM_HOUR). Days between the first and the last
 * recorded workout without one are « without »; outside that span nothing is known (watch not worn yet,
 * or no longer synced).
 */
function eveningSport(entries) {
  const evenings = new Set()
  let first = null
  let last = null
  for (const e of entries) {
    if (!isWorkoutEntry(e)) continue
    const start = new Date(e.at)
    if (Number.isNaN(start.getTime())) continue
    const key = localDateKey(e.at)
    if (first === null || key < first) first = key
    if (last === null || key > last) last = key
    if (start.getHours() >= EVENING_SPORT_FROM_HOUR) evenings.add(key)
  }
  const out = new Map()
  if (first === null) return out
  for (let k = first; k <= last; k = nextDateKey(k)) out.set(k, evenings.has(k))
  return out
}

/** Evening a meal belongs to: its day, or the day before for a meal after midnight (before 04:00). */
function mealEvening(e) {
  const at = new Date(e.at)
  if (Number.isNaN(at.getTime())) return null
  const key = localDateKey(e.at)
  return at.getHours() < LATE_MEAL_UNTIL_HOUR ? { key: previousDateKey(key), late: true } : { key, late: at.getHours() >= LATE_MEAL_FROM_HOUR }
}

/** Evenings with a late meal (true), or with ≥ MIN_MEALS_PER_DAY meals noted and none late (false). */
function lateMeals(entries) {
  const days = new Map()
  for (const e of entries) {
    if (e.type !== 'food') continue
    const m = mealEvening(e)
    if (!m) continue
    const day = days.get(m.key) ?? { count: 0, late: false }
    day.count += 1
    day.late ||= m.late
    days.set(m.key, day)
  }
  const out = new Map()
  for (const [key, day] of days) {
    if (day.late) out.set(key, true)
    else if (day.count >= MIN_MEALS_PER_DAY) out.set(key, false)
  }
  return out
}

/**
 * True when meals are noted regularly enough (≥ 2 meals on REGULAR_MEAL_DAYS of the last 14 days) for
 * « Repas tardif » to be deduced instead of asked.
 * @param {Array} foodEntries  recent `food` entries
 */
export function mealsLoggedRegularly(foodEntries, now = new Date()) {
  const since = now.getTime() - REGULAR_MEAL_WINDOW_DAYS * 86_400_000
  const counts = new Map()
  for (const e of foodEntries || []) {
    if (e?.type !== 'food') continue
    const t = new Date(e.at).getTime()
    if (Number.isNaN(t) || t < since || t > now.getTime()) continue
    const key = localDateKey(e.at)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.values()].filter((n) => n >= MIN_MEALS_PER_DAY).length >= REGULAR_MEAL_DAYS
}

export function getTagMeta(id) {
  return TAGS_BY_ID[id] ?? null
}

/** 'YYYY-MM-DD' → the following calendar day, same format. */
export function nextDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  return next.toISOString().slice(0, 10)
}

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

// Deterministic PRNG so the same data always gives the same p-value.
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Pooled within-stratum difference of means (strata lacking a group are skipped).
function stratifiedDiff(strata) {
  let num = 0
  let den = 0
  for (const { a, b } of strata) {
    if (a.length === 0 || b.length === 0) continue
    const w = (a.length * b.length) / (a.length + b.length)
    num += w * (mean(a) - mean(b))
    den += w
  }
  return den > 0 ? num / den : null
}

/**
 * Two-sided permutation test on the difference of means between two groups.
 * Uses the add-one estimator (never 0), see Phipson & Smyth 2010.
 */
export function permutationPValue(a, b, permutations = PERMUTATIONS) {
  return stratifiedPermutationPValue([{ a, b }], permutations)
}

/**
 * Same test on the pooled within-stratum difference (see `stratifiedDiff`):
 * group labels are only shuffled inside each stratum.
 * @param {Array<{ a: number[], b: number[] }>} strata
 */
export function stratifiedPermutationPValue(strata, permutations = PERMUTATIONS) {
  const used = strata
    .filter(({ a, b }) => a.length > 0 && b.length > 0)
    .map(({ a, b }) => {
      const pooled = [...a, ...b]
      return {
        pooled,
        nA: a.length,
        total: pooled.reduce((s, v) => s + v, 0),
        w: (a.length * b.length) / pooled.length,
      }
    })
  if (used.length === 0) return 1
  const den = used.reduce((s, st) => s + st.w, 0)
  const observed = Math.abs(stratifiedDiff(strata))
  const rand = mulberry32(12345)
  let extreme = 0
  for (let k = 0; k < permutations; k++) {
    let num = 0
    for (const st of used) {
      const { pooled, nA } = st
      // Partial Fisher-Yates: the first nA slots become group A.
      for (let i = 0; i < nA; i++) {
        const j = i + Math.floor(rand() * (pooled.length - i))
        const tmp = pooled[i]
        pooled[i] = pooled[j]
        pooled[j] = tmp
      }
      let sumA = 0
      for (let i = 0; i < nA; i++) sumA += pooled[i]
      num += st.w * (sumA / nA - (st.total - sumA) / (pooled.length - nA))
    }
    if (Math.abs(num / den) >= observed - 1e-12) extreme++
  }
  return (extreme + 1) / (permutations + 1)
}

/**
 * @param {Array} entries  health entries (only wellbeing ones are used)
 * @param {{ outcomeByDay?: Map<string, number> }} [options]  outcomeByDay: wellbeing to compare with, per day
 *   ('YYYY-MM-DD' → score), instead of the notes — the mood estimated by the face (mood/faceMoodDays.js). Declared
 *   tags still come from the wellbeing entries (a tag noted on an evening without a face reading still counts).
 * @returns {{ status: 'no_tags' } | {
 *   status: 'ok', trackedDays: number,
 *   effects: Array<{ tagId, label, emoji, effectDay, nWith, nWithout, meanWith, meanWithout,
 *     diff, diffRaw, p, q, evidence }>,
 *   pending: Array<{ tagId, label, emoji, effectDay, nWith, nWithout, weekendOnly? }>,
 * }}
 * `diff` is the week-end-controlled difference, `meanWith` / `meanWithout` /
 * `diffRaw` the plain ones. `weekendOnly`: enough days, but the tag always
 * falls on the same type of day as all comparable days → not separable.
 */
export function computeTagEffects(entries, { outcomeByDay } = {}) {
  // Per day: mean wellbeing score and union of known tags.
  const days = new Map()
  const dayOf = (key) => {
    let day = days.get(key)
    if (!day) {
      day = { sum: 0, count: 0, tags: new Set() }
      days.set(key, day)
    }
    return day
  }
  for (const e of entries) {
    if (e.type !== 'wellbeing') continue
    const score = e.payload?.score
    const scored = typeof score === 'number' && !Number.isNaN(score)
    if (!scored && !outcomeByDay) continue
    const day = dayOf(localDateKey(e.at))
    if (!outcomeByDay) {
      day.sum += score
      day.count += 1
    }
    for (const t of Array.isArray(e.payload?.tags) ? e.payload.tags : []) {
      if (TAGS_BY_ID[t]) day.tags.add(t)
    }
  }
  for (const [key, score] of outcomeByDay ?? []) {
    if (typeof score !== 'number' || Number.isNaN(score)) continue
    const day = dayOf(key)
    day.sum = score
    day.count = 1
  }

  const measured = measuredTagsByDay(entries)
  // Estimated mood: an evening measured by the phone counts even when that day itself has too few face readings
  // to be estimated (only the day the outcome is read on needs one).
  if (outcomeByDay) for (const m of measured.values()) for (const k of m.keys()) dayOf(k)
  const keys = [...days.keys()].sort()
  const firstTagged = keys.find((k) => days.get(k).tags.size > 0)
  const anyMeasured = [...measured.values()].some((m) => keys.some((k) => m.has(k)))
  if (!firstTagged && !anyMeasured) return { status: 'no_tags' }
  // Declared tags only count from the first tag ever used (older days are not « without »);
  // a measured evening always counts.
  const declaredFrom = firstTagged ?? '9999-12-31'
  const tracked = new Set()

  const effects = []
  const pending = []
  for (const tag of BEHAVIOR_TAGS) {
    if (tag.side === 'Y') continue
    const withTag = []
    const withoutTag = []
    const strata = { weekend: { a: [], b: [] }, weekday: { a: [], b: [] } }
    const tagMeasured = measured.get(tag.id)
    let usedMeasure = false
    for (const k of keys) {
      const isMeasured = tagMeasured?.has(k) ?? false
      if (!isMeasured && k < declaredFrom) continue
      const outcomeKey = tag.effectDay === 'next' ? nextDateKey(k) : k
      const outcomeDay = days.get(outcomeKey)
      if (!outcomeDay?.count) continue
      tracked.add(k)
      const score = outcomeDay.sum / outcomeDay.count
      const declared = days.get(k).tags.has(tag.id)
      const has = isMeasured ? tagMeasured.get(k) || (tag.declaredAlsoCounts === true && declared) : declared
      if (isMeasured) usedMeasure = true
      ;(has ? withTag : withoutTag).push(score)
      const stratum = strata[isWeekendKey(outcomeKey) ? 'weekend' : 'weekday']
      ;(has ? stratum.a : stratum.b).push(score)
    }
    const base = { tagId: tag.id, label: tag.label, emoji: tag.emoji, effectDay: tag.effectDay }
    if (usedMeasure) base.auto = true
    if (withTag.length === 0) continue
    if (withTag.length < MIN_TAG_DAYS || withoutTag.length < MIN_TAG_DAYS) {
      pending.push({ ...base, nWith: withTag.length, nWithout: withoutTag.length })
      continue
    }
    const strataList = [strata.weekend, strata.weekday]
    const diff = stratifiedDiff(strataList)
    if (diff === null) {
      pending.push({ ...base, nWith: withTag.length, nWithout: withoutTag.length, weekendOnly: true })
      continue
    }
    const meanWith = mean(withTag)
    const meanWithout = mean(withoutTag)
    effects.push({
      ...base,
      nWith: withTag.length,
      nWithout: withoutTag.length,
      meanWith,
      meanWithout,
      diff,
      diffRaw: meanWith - meanWithout,
      p: stratifiedPermutationPValue(strataList),
    })
  }

  const q = benjaminiHochberg(effects.map((e) => e.p))
  effects.forEach((e, i) => {
    e.q = q[i]
    e.evidence = evidenceLevel(e.q)
  })
  effects.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))

  return { status: 'ok', trackedDays: tracked.size, effects, pending }
}
