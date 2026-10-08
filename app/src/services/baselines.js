/**
 * Personal baselines ("ma norme") for resting heart rate and HRV.
 *
 * Population ranges say little about one person: what matters is a deviation
 * from *your own* usual values (Oura, Whoop, HRV4Training all work this way).
 * Method, deliberately simple and explainable:
 *   - one value per local calendar day (mean of that day's readings);
 *   - "recent" = mean of the last 7 calendar days (today included, ≥ 3 days);
 *   - "norm"   = mean ± 1 SD of the 60 days *before* those 7 days (≥ 14 days),
 *     so that a bad week does not drag the norm along with it;
 *   - HRV is right-skewed: its statistics are computed on ln(ms), the usual
 *     practice for RMSSD (Plews et al. 2013, Sports Med 43:773).
 * The result is an observation, never a diagnosis: the UI must say so.
 */

import { localDateKey } from './wellbeingSeries'

export const RECENT_DAYS = 7
export const BASELINE_DAYS = 60
export const MIN_RECENT_DAYS = 3
export const MIN_BASELINE_DAYS = 14

export const BASELINE_METRICS = {
  restingHeartRate: {
    key: 'restingHeartRate',
    label: 'FC au repos',
    unit: 'bpm',
    higherIsBetter: false,
    log: false,
    // Half-width floor of the normal range (in the metric's working scale)
    minSd: 1,
    plausible: [25, 200],
    read: (p) => p?.bpm ?? p?.value,
  },
  heartRateVariability: {
    key: 'heartRateVariability',
    label: 'VFC (variabilité cardiaque)',
    unit: 'ms',
    higherIsBetter: true,
    log: true,
    minSd: 0.05, // ≈ ±5 %
    plausible: [1, 500],
    read: (p) => p?.value ?? p?.bpm,
  },
}

/**
 * @returns {Map<string, number>} local day key (YYYY-MM-DD) → mean of that day's readings
 */
export function dailyValues(entries, metric) {
  const sums = new Map()
  const [min, max] = metric.plausible
  for (const e of entries || []) {
    if (e?.type !== 'heart_rate' || e.payload?.subtype !== metric.key || !e.at) continue
    const v = metric.read(e.payload)
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) continue
    const key = localDateKey(e.at)
    const s = sums.get(key) || { sum: 0, n: 0 }
    s.sum += v
    s.n += 1
    sums.set(key, s)
  }
  const out = new Map()
  for (const [key, { sum, n }] of sums) out.set(key, sum / n)
  return out
}

function dayKeyOffset(now, daysBack) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack, 12)
  return localDateKey(d.toISOString())
}

function meanSd(values) {
  const n = values.length
  const mean = values.reduce((s, v) => s + v, 0) / n
  const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0
  return { mean, sd: Math.sqrt(variance) }
}

/**
 * @returns {{
 *   metric: object,
 *   status: 'insufficient' | 'within' | 'above' | 'below',
 *   favourable: boolean | null,
 *   recentDays: number, baselineDays: number, missingDays: number,
 *   recentMean?: number, baselineMean?: number, low?: number, high?: number, z?: number,
 *   latest: { value: number, dateKey: string } | null,
 * }}
 */
export function computeBaseline(entries, metric, now = new Date()) {
  const days = dailyValues(entries, metric)
  const recentStart = dayKeyOffset(now, RECENT_DAYS - 1)
  const baselineStart = dayKeyOffset(now, RECENT_DAYS - 1 + BASELINE_DAYS)
  const today = dayKeyOffset(now, 0)

  const recent = []
  const baseline = []
  for (const [key, v] of days) {
    if (key > today) continue
    if (key >= recentStart) recent.push([key, v])
    else if (key >= baselineStart) baseline.push(v)
  }
  recent.sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const last = recent[recent.length - 1]

  const base = {
    metric,
    recentDays: recent.length,
    baselineDays: baseline.length,
    missingDays: Math.max(0, MIN_BASELINE_DAYS - baseline.length),
    latest: last ? { value: last[1], dateKey: last[0] } : null,
  }
  if (baseline.length < MIN_BASELINE_DAYS || recent.length < MIN_RECENT_DAYS) {
    return { ...base, status: 'insufficient', favourable: null }
  }

  const fwd = metric.log ? Math.log : (v) => v
  const back = metric.log ? Math.exp : (v) => v
  const { mean, sd: rawSd } = meanSd(baseline.map(fwd))
  const sd = Math.max(rawSd, metric.minSd)
  const recentT = recent.reduce((s, [, v]) => s + fwd(v), 0) / recent.length
  const z = (recentT - mean) / sd

  let status = 'within'
  if (z > 1) status = 'above'
  else if (z < -1) status = 'below'
  const favourable = status === 'within' ? null : (status === 'above') === metric.higherIsBetter

  return {
    ...base,
    status,
    favourable,
    z,
    recentMean: back(recentT),
    baselineMean: back(mean),
    low: back(mean - sd),
    high: back(mean + sd),
  }
}

export function computeHeartBaselines(entries, now = new Date()) {
  return Object.values(BASELINE_METRICS).map((m) => computeBaseline(entries, m, now))
}
