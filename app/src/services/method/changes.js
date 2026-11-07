/**
 * TS-2 — Changements durables (revue design du 07/11). Sur une courbe quotidienne (bien-être, confort digestif,
 * sommeil, VFC, FC au repos, pas, écran), une fois le rythme de la semaine retiré : un saut de niveau, avec au moins
 * 7 jours de chaque côté, d'au moins une demi-variation habituelle, confirmé 7 jours après (il faut 7 jours après le
 * saut pour le voir). Le seuil est calé au banc (`changes.test.js`) : moins d'une fausse alerte par courbe et par
 * semestre. Jamais de cause : « Au même moment » liste seulement les autres changements à ± 5 jours.
 *
 * Usages : repère « changement » de Tendances (vue Mois) et du rapport médecin ; la norme des écarts du jour repart
 * du nouveau niveau (`normStart`) ; un lien d'Analyses doit tenir à l'intérieur des périodes (`periods`) ; un essai
 * traversé par un changement le signale (`crossingChanges`).
 */
import { buildAnalysisMatrix } from '../analysisResults'
import { estimateStatesFromEntries } from './stateSpace'
import { localDateKey } from '../analysisEngine'

/** Jours minimum de chaque côté du saut (et donc délai de confirmation). */
export const MIN_SIDE_DAYS = 7
/** Fenêtre comparée de chaque côté (jours connus au plus). */
export const MAX_SIDE_DAYS = 28
/** Saut minimal : une demi-variation habituelle. */
export const MIN_SHIFT_SD = 0.5
/** Seuil sur le t corrigé de l'autocorrélation (calé au banc : < 1 fausse alerte par courbe et par semestre). */
export const CHANGE_T = 4
/** Deux changements d'une même courbe sont séparés d'au moins ce nombre de jours. */
export const MIN_GAP_DAYS = 14
/** « Au même moment » : autres changements à ± ce nombre de jours. */
export const SAME_TIME_DAYS = 5

/** Courbes suivies (clé, libellé, colonne du jeu quotidien ou estimation TS-1). */
export const CHANGE_METRICS = [
  { key: 'wellbeing', label: 'Bien-être', theme: 'wellbeing' },
  { key: 'digestion', label: 'Confort digestif', theme: 'digestion' },
  { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep' },
  { key: 'hrv_ms', label: 'VFC', theme: 'body' },
  { key: 'restingHR', label: 'FC au repos', theme: 'body' },
  { key: 'steps', label: 'Pas', theme: 'activity' },
  { key: 'screen_minutes', label: 'Temps d’écran', theme: 'context' },
]

const DAY_MS = 86_400_000
const dayNum = (key) => Math.round(Date.parse(`${key}T00:00:00Z`) / DAY_MS)
const keyOf = (num) => new Date(num * DAY_MS).toISOString().slice(0, 10)
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const median = (a) => {
  const b = [...a].sort((x, y) => x - y)
  const h = Math.floor(b.length / 2)
  return b.length % 2 ? b[h] : (b[h - 1] + b[h]) / 2
}

/** Retire le rythme de la semaine (moyenne par jour de semaine, centrée) ; rend [{ n, v }] triés. */
export function deseasonalize(series) {
  const pts = [...series].filter(([, v]) => isNum(v)).map(([dk, v]) => ({ n: dayNum(dk), v })).sort((a, b) => a.n - b.n)
  if (pts.length < 21) return pts
  const wd = (n) => ((n % 7) + 7) % 7
  const sums = Array.from({ length: 7 }, () => [])
  const m = mean(pts.map((p) => p.v))
  for (const p of pts) sums[wd(p.n)].push(p.v - m)
  const off = sums.map((a) => (a.length ? mean(a) * a.length / (a.length + 2) : 0))
  const c = mean(off)
  return pts.map((p) => ({ n: p.n, v: p.v - (off[wd(p.n)] - c) }))
}

/**
 * Variation habituelle (écart type des écarts du jour à la moyenne glissante de 15 jours, estimation robuste par la
 * médiane des écarts absolus) et autocorrélation de ces écarts.
 */
export function usualVariation(pts) {
  const dev = []
  for (let i = 0; i < pts.length; i += 1) {
    const around = pts.filter((q) => Math.abs(q.n - pts[i].n) <= 7)
    if (around.length >= 5) dev.push({ n: pts[i].n, d: pts[i].v - mean(around.map((q) => q.v)) })
  }
  if (dev.length < 10) return null
  const abs = dev.map((x) => Math.abs(x.d)).sort((a, b) => a - b)
  const sd = Math.max(1e-9, 1.4826 * abs[Math.floor(abs.length / 2)])
  let num = 0
  let den = 0
  for (let i = 0; i < dev.length; i += 1) {
    den += dev[i].d ** 2
    if (i > 0 && dev[i].n - dev[i - 1].n === 1) num += dev[i].d * dev[i - 1].d
  }
  const rho = Math.min(0.9, Math.max(0, den > 0 ? num / den : 0))
  return { sd, rho }
}

/**
 * Changements durables d'une courbe quotidienne (Map jour → valeur).
 * @returns {Array<{ date: string, before: number, after: number, shift: number, size: number, t: number, confirmedOn: string }>}
 *   date = premier jour du nouveau niveau ; before / after en unités de la courbe (rythme de la semaine retiré) ;
 *   size = saut en variations habituelles ; confirmedOn = jour où il devient visible (7 jours connus après).
 */
export function detectChanges(series, { threshold = CHANGE_T } = {}) {
  const pts = deseasonalize(series)
  if (pts.length < 2 * MIN_SIDE_DAYS) return []
  const uv = usualVariation(pts)
  if (!uv) return []
  // Écart type d'une moyenne de m jours autocorrélés (AR(1)) : sd·sqrt((1+ρ)/(1−ρ)/m).
  const inflate = (1 + uv.rho) / (1 - uv.rho)
  const scan = (lo, hi) => {
    // Meilleur saut dans pts[lo..hi) (bornes des périodes déjà coupées).
    let best = null
    for (let k = lo + MIN_SIDE_DAYS; k <= hi - MIN_SIDE_DAYS; k += 1) {
      const left = pts.slice(Math.max(lo, k - MAX_SIDE_DAYS), k)
      const right = pts.slice(k, Math.min(hi, k + MAX_SIDE_DAYS))
      const m1 = mean(left.map((p) => p.v))
      const m2 = mean(right.map((p) => p.v))
      const se = uv.sd * Math.sqrt(inflate * (1 / left.length + 1 / right.length))
      const t = (m2 - m1) / se
      if (Math.abs(m2 - m1) < MIN_SHIFT_SD * uv.sd || Math.abs(t) < threshold) continue
      // Confirmé : les 7 jours juste après sont du côté du nouveau niveau, les 7 juste avant de l'ancien (médianes).
      // Sans cela, quelques jours inhabituels en fin de courbe déplaceraient la moyenne et dateraient un faux saut.
      const mid = (m1 + m2) / 2
      const side = (v) => Math.sign(v - mid) === Math.sign(m2 - m1)
      if (!side(median(right.slice(0, MIN_SIDE_DAYS).map((p) => p.v)))) continue
      if (side(median(left.slice(-MIN_SIDE_DAYS).map((p) => p.v)))) continue
      if (!best || Math.abs(t) > Math.abs(best.t)) best = { k, m1, m2, t, right }
    }
    return best
  }
  // Segmentation binaire : on coupe au saut le plus net, puis on cherche de chaque côté.
  const found = []
  const stack = [[0, pts.length]]
  while (stack.length) {
    const [lo, hi] = stack.pop()
    const b = scan(lo, hi)
    if (!b) continue
    found.push(b)
    stack.push([lo, b.k], [b.k, hi])
  }
  found.sort((a, b) => a.k - b.k)
  const kept = []
  for (const f of found) {
    const prev = kept[kept.length - 1]
    if (prev && pts[f.k].n - pts[prev.k].n < MIN_GAP_DAYS) {
      if (Math.abs(f.t) > Math.abs(prev.t)) kept[kept.length - 1] = f
      continue
    }
    kept.push(f)
  }
  const r = (v) => Math.round(v * 100) / 100
  return kept.map((f) => ({
    date: keyOf(pts[f.k].n),
    before: r(f.m1),
    after: r(f.m2),
    shift: r(f.m2 - f.m1),
    size: r((f.m2 - f.m1) / uv.sd),
    t: r(f.t),
    confirmedOn: keyOf(pts[f.k + MIN_SIDE_DAYS - 1].n),
  }))
}

/** Jour à partir duquel calculer la norme des écarts du jour : le dernier changement, sinon null (tout l'historique). */
export function normStart(changes) {
  return changes?.length ? changes[changes.length - 1].date : null
}

/** Périodes stables entre changements : [{ from, to }] (from/to inclus, null = ouvert). */
export function periods(changes) {
  const out = []
  let from = null
  for (const c of changes || []) {
    out.push({ from, to: keyOf(dayNum(c.date) - 1) })
    from = c.date
  }
  out.push({ from, to: null })
  return out
}

/** Changements qui tombent dans [from, to] (un essai traversé par un changement le signale). */
export function crossingChanges(changes, from, to) {
  return (changes || []).filter((c) => c.date > from && c.date <= to)
}

/**
 * « Au même moment » : pour un changement d'une courbe, les changements des autres courbes à ± 5 jours.
 * @param {Record<string, Array>} all  clé de courbe → changements
 */
export function sameTime(all, metricKey, date) {
  const n = dayNum(date)
  const out = []
  for (const [key, list] of Object.entries(all || {})) {
    if (key === metricKey) continue
    for (const c of list) if (Math.abs(dayNum(c.date) - n) <= SAME_TIME_DAYS) out.push({ metric: key, ...c })
  }
  return out.sort((a, b) => Math.abs(dayNum(a.date) - n) - Math.abs(dayNum(b.date) - n))
}

/**
 * Changements de toutes les courbes suivies, depuis les entrées. Bien-être et confort digestif : l'estimation TS-1
 * (digestionOwn, les jours où une information digestive existe ; jamais déduite du bien-être) ; les autres : les
 * valeurs du jour.
 * @returns {Record<string, Array>} clé → changements (liste vide si rien)
 */
export function changesFromEntries(entries, { now = new Date() } = {}) {
  const today = localDateKey(now.toISOString())
  const out = Object.fromEntries(CHANGE_METRICS.map((m) => [m.key, []]))
  const states = estimateStatesFromEntries(entries, { now, ahead: 0 })
  if (states) {
    const past = states.days.filter((d) => !d.future)
    out.wellbeing = detectChanges(new Map(past.filter((d) => d.observed.wellbeing).map((d) => [d.date, d.wellbeing.mean])))
    out.digestion = detectChanges(new Map(past.filter((d) => d.observed.digestion).map((d) => [d.date, d.digestionOwn.mean])))
  }
  const { days } = buildAnalysisMatrix(entries)
  for (const m of CHANGE_METRICS) {
    if (m.key === 'wellbeing' || m.key === 'digestion') continue
    const s = new Map([...days].filter(([dk, v]) => dk <= today && isNum(v[m.key])).map(([dk, v]) => [dk, v[m.key]]))
    out[m.key] = detectChanges(s)
  }
  return out
}
