/**
 * Lagged effects — does what I did 1 to 3 days ago go with how I feel today?
 *
 * Same-day correlations miss delayed effects (a big walking day that pays off
 * the next day, a short night that weighs two days later) and are exposed to
 * reverse causation (feeling good → walking more the same day). Here, for each
 * actionable lifestyle variable x and each lag k ∈ LAGS, wellbeing on day t is
 * correlated with x on day t − k, as a partial correlation controlling for:
 *   - the previous day's wellbeing (a good or bad mood that simply lasts, the
 *     autoregressive term of cross-lagged models),
 *   - the same-day values of the lifestyle variables: habits are regular
 *     (similar sleep or steps from one day to the next), so without this the
 *     same-day effect would leak into « la veille »; it also removes the
 *     variance they explain, which makes real delayed effects easier to see,
 *   - whether day t is a week-end day (when enough days of both kinds).
 * Effective n is corrected for autocorrelation and the p-values of every
 * (variable, lag) tested are adjusted together (Benjamini-Hochberg), so trying
 * three lags does not triple the chance of a false discovery.
 *
 * Nutrition is not here: it is already smoothed over ~10 days in the main
 * analysis. Evening habits (alcohol, late screen…) are handled by the tags.
 */
import {
  buildDailyDataset,
  pearsonCorrelation,
  leverAction,
  VARIABLE_META,
  MIN_WEEKEND_DAYS,
} from './analysisEngine'
import {
  benjaminiHochberg,
  correlationPValue,
  correlationStrength,
  effectiveSampleSize,
  evidenceLevel,
  isWeekendKey,
  residualize,
} from './statistics'

/** Delays tested, in days (0 = same day, already in the main analysis). */
export const LAGS = [1, 2, 3]

/** Lifestyle variables one can act on, whose effect may come later. */
export const LAGGED_KEYS = ['sleepMinutes', 'steps', 'activityCalories', 'cigaretteCount']

/**
 * Only effects whose FDR-adjusted p-value is below this are shown (« solide »).
 * Stricter than the same-day levers (0.2): testing three delays per variable
 * gives chance more opportunities, and on the demo data (no effect simulated
 * three days later) a « 3 jours avant » link reached q ≈ 0.09.
 */
export const LAG_MAX_Q = 0.05

/** Minimum number of (day, day before) pairs with a known value to test a lag. */
export const MIN_LAG_PAIRS = 14

/** 'YYYY-MM-DD' shifted by `days` calendar days. */
export function shiftDateKey(key, days) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/**
 * When the cause happened, in plain French. Sleep is dated by the wake-up day
 * (last night counts for today), so a 1-day lag is the night before last.
 */
export function lagLabel(variable, lag) {
  if (variable === 'sleepMinutes') {
    return lag === 1 ? 'L’avant-dernière nuit' : `Il y a ${lag + 1} nuits`
  }
  return lag === 1 ? 'La veille' : `${lag} jours avant`
}

function isKnown(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

function std(values) {
  const m = values.reduce((s, v) => s + v, 0) / values.length
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, values.length - 1))
}

/**
 * Same-day value of each lifestyle variable over the rows, as a control.
 * Unknown days take the mean of the known ones (« a usual day »); a variable
 * known on less than half of the rows is left out.
 */
function sameDayControls(rows) {
  const controls = []
  for (const key of LAGGED_KEYS) {
    const known = rows.map((d) => d[key]).filter(isKnown)
    if (known.length < rows.length / 2) continue
    const m = known.reduce((s, v) => s + v, 0) / known.length
    controls.push(rows.map((d) => (isKnown(d[key]) ? d[key] : m)))
  }
  return controls
}

function testLag(byDate, targets, variable, lag) {
  const rows = []
  const y = []
  const x = []
  const prevWellbeing = []
  const weekend = []
  for (const t of targets) {
    const src = byDate.get(shiftDateKey(t.dateKey, -lag))
    if (!src || !isKnown(src[variable])) continue
    rows.push(t)
    y.push(t.wellbeing)
    x.push(src[variable])
    prevWellbeing.push(byDate.get(shiftDateKey(t.dateKey, -1)).wellbeing)
    weekend.push(isWeekendKey(t.dateKey) ? 1 : 0)
  }
  if (x.length < MIN_LAG_PAIRS) return null
  const sd = std(x)
  if (!(sd > 0)) return null

  const weekendDays = weekend.filter((w) => w === 1).length
  const covariates = [prevWellbeing, ...sameDayControls(rows)]
  if (weekendDays >= MIN_WEEKEND_DAYS && x.length - weekendDays >= MIN_WEEKEND_DAYS) covariates.push(weekend)
  const { residuals: ry, used } = residualize(y, covariates)
  const { residuals: rx } = residualize(x, covariates)
  const sxx = rx.reduce((s, v) => s + v * v, 0)
  if (!(sxx > 1e-12 * sd * sd * x.length)) return null

  const r = pearsonCorrelation(ry, rx)
  const nEff = effectiveSampleSize(ry, rx)
  const slope = rx.reduce((s, v, i) => s + v * ry[i], 0) / sxx
  return {
    variable,
    lag,
    r,
    n: x.length,
    nEff,
    p: correlationPValue(r, nEff - used),
    sd,
    // Change in wellbeing (points) for one usual deviation of the variable.
    effectPerSd: slope * sd,
  }
}

/**
 * @param {Array} entries  raw entries (listEntriesForAnalysis)
 * @returns {{ status: 'not_enough_data', minDays: number, currentDays: number }
 *   | { status: 'ok', pairs: number, tested: string[], effects: Array<object> }}
 *   effects: one per variable at most (its best lag), only when q < LAG_MAX_Q,
 *   sorted by strength of evidence.
 */
export function computeLaggedEffects(entries) {
  const days = buildDailyDataset(entries, { includeDaysWithoutWellbeing: true })
  const byDate = new Map(days.map((d) => [d.dateKey, d]))
  // Days with a score whose previous day also has one (needed for the control).
  const targets = days.filter(
    (d) => isKnown(d.wellbeing) && isKnown(byDate.get(shiftDateKey(d.dateKey, -1))?.wellbeing),
  )
  if (targets.length < MIN_LAG_PAIRS) {
    return { status: 'not_enough_data', minDays: MIN_LAG_PAIRS, currentDays: targets.length }
  }

  const tests = []
  for (const variable of LAGGED_KEYS) {
    for (const lag of LAGS) {
      const t = testLag(byDate, targets, variable, lag)
      if (t) tests.push(t)
    }
  }
  const q = benjaminiHochberg(tests.map((t) => t.p))
  tests.forEach((t, i) => {
    t.q = q[i]
  })

  const effects = []
  for (const variable of LAGGED_KEYS) {
    const best = tests
      .filter((t) => t.variable === variable)
      .sort((a, b) => a.p - b.p)[0]
    if (!best || best.q >= LAG_MAX_Q) continue
    effects.push({
      ...best,
      label: VARIABLE_META[variable].label,
      format: VARIABLE_META[variable].format,
      when: lagLabel(variable, best.lag),
      strength: correlationStrength(best.r),
      evidence: evidenceLevel(best.q),
      action: leverAction(variable, best.r),
    })
  }
  effects.sort((a, b) => a.q - b.q)

  return {
    status: 'ok',
    pairs: targets.length,
    tested: [...new Set(tests.map((t) => t.variable))],
    effects,
  }
}
