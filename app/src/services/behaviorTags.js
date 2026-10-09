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
 */
import { localDateKey } from './analysisEngine'
import { benjaminiHochberg, evidenceLevel } from './statistics'

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

/**
 * Two-sided permutation test on the difference of means between two groups.
 * Uses the add-one estimator (never 0), see Phipson & Smyth 2010.
 */
export function permutationPValue(a, b, permutations = PERMUTATIONS) {
  const pooled = [...a, ...b]
  const nA = a.length
  const observed = Math.abs(mean(a) - mean(b))
  const total = pooled.reduce((s, v) => s + v, 0)
  const rand = mulberry32(12345)
  let extreme = 0
  for (let k = 0; k < permutations; k++) {
    // Partial Fisher-Yates: the first nA slots become group A.
    for (let i = 0; i < nA; i++) {
      const j = i + Math.floor(rand() * (pooled.length - i))
      const tmp = pooled[i]
      pooled[i] = pooled[j]
      pooled[j] = tmp
    }
    let sumA = 0
    for (let i = 0; i < nA; i++) sumA += pooled[i]
    const diff = Math.abs(sumA / nA - (total - sumA) / (pooled.length - nA))
    if (diff >= observed - 1e-12) extreme++
  }
  return (extreme + 1) / (permutations + 1)
}

/**
 * @param {Array} entries  health entries (only wellbeing ones are used)
 * @returns {{ status: 'no_tags' } | {
 *   status: 'ok', trackedDays: number,
 *   effects: Array<{ tagId, label, emoji, effectDay, nWith, nWithout, meanWith, meanWithout, diff, p, q, evidence }>,
 *   pending: Array<{ tagId, label, emoji, effectDay, nWith, nWithout }>,
 * }}
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
    for (const k of tracked) {
      const outcomeDay = days.get(tag.effectDay === 'next' ? nextDateKey(k) : k)
      if (!outcomeDay) continue
      const score = outcomeDay.sum / outcomeDay.count
      ;(days.get(k).tags.has(tag.id) ? withTag : withoutTag).push(score)
    }
    const base = { tagId: tag.id, label: tag.label, emoji: tag.emoji, effectDay: tag.effectDay }
    if (withTag.length === 0) continue
    if (withTag.length < MIN_TAG_DAYS || withoutTag.length < MIN_TAG_DAYS) {
      pending.push({ ...base, nWith: withTag.length, nWithout: withoutTag.length })
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
      diff: meanWith - meanWithout,
      p: permutationPValue(withTag, withoutTag),
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
