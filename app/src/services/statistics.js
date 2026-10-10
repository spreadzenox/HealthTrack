/**
 * Small statistics toolkit used to qualify correlations honestly.
 *
 * Daily health series are autocorrelated (sleep, weight, smoothed nutrition…),
 * which makes a naive Pearson test far too optimistic, and testing ~40
 * variables at once guarantees a few "significant" results by chance.
 * Hence:
 *   - effectiveSampleSize : n corrected for lag-1 autocorrelation of both series
 *     (Bretherton et al. 1999, J. Climate 12:1990 — eq. 31)
 *   - correlationPValue   : two-sided p-value via Fisher's z transform
 *   - benjaminiHochberg   : false discovery rate adjustment (q-values)
 */

/** Standard normal cumulative distribution (Abramowitz & Stegun 7.1.26, |ε| < 1.5e-7). */
export function normalCdf(z) {
  const x = Math.abs(z) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * x)
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const erf = 1 - poly * Math.exp(-x * x)
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf)
}

/** Lag-1 autocorrelation of a series (0 for constant or < 3 points). */
export function lag1Autocorrelation(values) {
  const n = values.length
  if (n < 3) return 0
  const m = values.reduce((s, v) => s + v, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    const d = values[i] - m
    den += d * d
    if (i > 0) num += d * (values[i - 1] - m)
  }
  return den === 0 ? 0 : num / den
}

/**
 * Effective number of independent days for a correlation between x and y.
 * Never larger than n, never below 3.
 */
export function effectiveSampleSize(x, y) {
  const n = x.length
  const rho = lag1Autocorrelation(x) * lag1Autocorrelation(y)
  if (rho <= 0) return n
  const nEff = (n * (1 - rho)) / (1 + rho)
  return Math.max(3, Math.min(n, nEff))
}

/** Two-sided p-value of a Pearson r computed on (effectively) n points. */
export function correlationPValue(r, n) {
  if (!(n > 3) || r == null || Number.isNaN(r)) return 1
  const clipped = Math.max(-0.999999, Math.min(0.999999, r))
  const z = Math.atanh(clipped) * Math.sqrt(n - 3)
  return Math.min(1, 2 * (1 - normalCdf(Math.abs(z))))
}

/** Benjamini–Hochberg adjusted p-values (q-values), returned in input order. */
export function benjaminiHochberg(pValues) {
  const m = pValues.length
  const order = pValues.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0])
  const q = new Array(m)
  let running = 1
  for (let k = m - 1; k >= 0; k--) {
    const [p, i] = order[k]
    running = Math.min(running, (p * m) / (k + 1))
    q[i] = Math.min(1, running)
  }
  return q
}

/** Plain-language strength of a correlation coefficient. */
export function correlationStrength(r) {
  const a = Math.abs(r)
  if (a < 0.1) return 'négligeable'
  if (a < 0.3) return 'faible'
  if (a < 0.5) return 'modéré'
  return 'fort'
}

/** Confidence level from a q-value (FDR-adjusted p-value). */
export function evidenceLevel(q) {
  if (q < 0.05) return 'solide'
  if (q < 0.2) return 'à confirmer'
  return 'incertain'
}

/** True for a Saturday or Sunday local date key (YYYY-MM-DD). */
export function isWeekendKey(dateKey) {
  const day = new Date(dateKey + 'T00:00:00Z').getUTCDay()
  return day === 0 || day === 6
}

/**
 * Removes a binary covariate from a series by subtracting each group's mean.
 * Correlating two series residualized this way gives their partial
 * correlation controlling for the group (e.g. week-end vs weekday).
 */
export function residualizeByGroup(values, groups) {
  const sums = new Map()
  values.forEach((v, i) => {
    const s = sums.get(groups[i]) ?? { total: 0, count: 0 }
    s.total += v
    s.count += 1
    sums.set(groups[i], s)
  })
  return values.map((v, i) => {
    const s = sums.get(groups[i])
    return v - s.total / s.count
  })
}

/**
 * Removes from `values` the linear part explained by the covariates (plus an
 * intercept), by Gram-Schmidt orthogonalisation. Correlating two series
 * residualized on the same covariates gives their partial correlation.
 * Constant or redundant covariates are skipped; `used` counts the others
 * (the degrees of freedom spent on the control).
 *
 * @param {number[]} values
 * @param {number[][]} covariates  each the same length as values
 * @returns {{ residuals: number[], used: number }}
 */
export function residualize(values, covariates) {
  const n = values.length
  const centre = (v) => {
    const m = v.reduce((s, x) => s + x, 0) / n
    return v.map((x) => x - m)
  }
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
  const basis = []
  for (const cov of covariates) {
    let u = centre(cov)
    const norm0 = dot(u, u)
    for (const b of basis) {
      const c = dot(u, b) / dot(b, b)
      u = u.map((x, i) => x - c * b[i])
    }
    // Nothing left once the intercept and previous covariates are removed.
    if (!(dot(u, u) > 1e-10 * Math.max(norm0, 1e-300)) || norm0 === 0) continue
    basis.push(u)
  }
  let residuals = centre(values)
  for (const b of basis) {
    const c = dot(residuals, b) / dot(b, b)
    residuals = residuals.map((x, i) => x - c * b[i])
  }
  return { residuals, used: basis.length }
}
