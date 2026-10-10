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
import { localDateKey } from './analysisEngine'
import { benjaminiHochberg, evidenceLevel, isWeekendKey } from './statistics'

/** Minimum number of days with AND without a tag before comparing them. */
export const MIN_TAG_DAYS = 5

/** Number of random permutations of the permutation test. */
const PERMUTATIONS = 2000

/**
 * effectDay: 'next' → compared on the following day's wellbeing (evening
 * behaviours whose effect shows the day after), 'same' → same day.
 */
export const BEHAVIOR_TAGS = [
  { id: 'alcohol', label: 'Alcool', emoji: '🍷', effectDay: 'next' },
  { id: 'coffee_late', label: 'Café après 14 h', emoji: '☕', effectDay: 'next' },
  { id: 'late_meal', label: 'Repas tardif', emoji: '🍽️', effectDay: 'next' },
  { id: 'late_screen', label: 'Écran tard', emoji: '📱', effectDay: 'next' },
  { id: 'evening_sport', label: 'Sport le soir', emoji: '🏃', effectDay: 'next' },
  { id: 'stress', label: 'Stress', emoji: '😣', effectDay: 'same' },
  { id: 'sick', label: 'Malade', emoji: '🤒', effectDay: 'same' },
]

const TAGS_BY_ID = Object.fromEntries(BEHAVIOR_TAGS.map((t) => [t.id, t]))

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
export function computeTagEffects(entries) {
  // Per day: mean wellbeing score and union of known tags.
  const days = new Map()
  for (const e of entries) {
    if (e.type !== 'wellbeing') continue
    const score = e.payload?.score
    if (typeof score !== 'number' || Number.isNaN(score)) continue
    const key = localDateKey(e.at)
    let day = days.get(key)
    if (!day) {
      day = { sum: 0, count: 0, tags: new Set() }
      days.set(key, day)
    }
    day.sum += score
    day.count += 1
    for (const t of Array.isArray(e.payload.tags) ? e.payload.tags : []) {
      if (TAGS_BY_ID[t]) day.tags.add(t)
    }
  }

  const keys = [...days.keys()].sort()
  const firstTagged = keys.find((k) => days.get(k).tags.size > 0)
  if (!firstTagged) return { status: 'no_tags' }
  const tracked = keys.filter((k) => k >= firstTagged)

  const effects = []
  const pending = []
  for (const tag of BEHAVIOR_TAGS) {
    const withTag = []
    const withoutTag = []
    const strata = { weekend: { a: [], b: [] }, weekday: { a: [], b: [] } }
    for (const k of tracked) {
      const outcomeKey = tag.effectDay === 'next' ? nextDateKey(k) : k
      const outcomeDay = days.get(outcomeKey)
      if (!outcomeDay) continue
      const score = outcomeDay.sum / outcomeDay.count
      const has = days.get(k).tags.has(tag.id)
      ;(has ? withTag : withoutTag).push(score)
      const stratum = strata[isWeekendKey(outcomeKey) ? 'weekend' : 'weekday']
      ;(has ? stratum.a : stratum.b).push(score)
    }
    const base = { tagId: tag.id, label: tag.label, emoji: tag.emoji, effectDay: tag.effectDay }
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

  return { status: 'ok', trackedDays: tracked.length, effects, pending }
}
