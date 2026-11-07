/**
 * TS-1 — Un seul modèle à espace d'états pour le bien-être et le confort digestif (revue design du 07/11, remplace
 * VENTRE-BE-2). Tout tourne sur l'appareil.
 *
 * Deux états cachés par jour, chacun = tendance lente (marche aléatoire) + rythme de la semaine + écart du jour.
 * Les écarts du jour du bien-être et de la digestion sont corrélés : le lien est appris sur les jours où les deux
 * sont notés, rétréci vers une valeur prudente commune (RHO_PRIOR) tant qu'il y a peu de jours.
 *
 * Observations (chacune avec sa précision) :
 * - bien-être : la note du jour (précise) et l'estimation du visage (le même objet, moins précise ; précision
 *   apprise sur les jours où les deux existent, calibration du visage par personne déjà faite par faceMood.js) ;
 * - digestion : la note du ventre (échelle ordonnée calme / gêne / douleur, approchée par une valeur et une
 *   précision) et la forme des selles (Bristol, très peu précise).
 * Filtre de Kalman puis lissage de Rauch-Tung-Striebel → pour chaque jour une estimation, une fourchette à 80 %, et
 * l'attendu des jours à venir (tendance + rythme de la semaine, fourchette qui s'élargit).
 *
 * Règle 5 : `digestionOwn` est le confort digestif estimé SANS aucune information du bien-être (modèle relancé sans
 * les observations du bien-être). C'est la seule série digestive que les analyses ont le droit d'utiliser ;
 * `digestion` (avec le lien au bien-être) ne sert qu'à l'affichage, et seulement si `showDigestiveCurve` (elle prédit
 * les notes du ventre mises de côté, par blocs d'une semaine, mieux que leur moyenne).
 * `noteRequest` : demander une note seulement les jours où l'estimation est parmi les plus incertaines.
 */
import { localDateKey } from '../analysisEngine'
import { faceMoodDays } from '../mood/faceMoodDays'
import { GUT_TYPE } from '../today'
import { STOOL_TYPE, stoolForm } from '../stool'

export const SCALE_MIN = 0
export const SCALE_MAX = 5
/** Fourchette affichée : 80 % (±1,28 écart type). */
export const BAND_Z = 1.2816

/** Précision des observations (écart type, points sur 5). */
export const OBS_SD = { note: 0.35, faceDefault: 0.8, gut: 0.6, stool: 1.4 }
/** Valeur du confort digestif lue dans une note du ventre ou une forme de selles (échelle ordonnée approchée). */
export const GUT_VALUE = { calm: 4.5, discomfort: 2.5, pain: 1 }
export const STOOL_VALUE = { normal: 4, hard: 2.75, loose: 2.5 }
/** Dérive quotidienne de la tendance (écart type, points sur 5). */
export const LEVEL_DRIFT_SD = 0.06
/** Lien des écarts du jour : valeur prudente commune et poids (en jours) de cette valeur. */
export const RHO_PRIOR = 0.3
export const RHO_PRIOR_DAYS = 20
/** Rythme de la semaine : appris à partir de 21 jours notés, rétréci (poids de 14 jours vers zéro). */
export const WEEKLY_MIN_DAYS = 21
export const WEEKLY_SHRINK_DAYS = 14
/** Courbe digestive estimée : au moins 3 semaines de notes du ventre pour la valider. */
export const CURVE_MIN_BLOCKS = 3
/** Demander une note : si l'incertitude du jour dépasse ce quantile des 28 derniers jours. */
export const ASK_QUANTILE = 0.7

const DAY_MS = 86_400_000
const dayNum = (key) => Math.round(Date.parse(`${key}T00:00:00Z`) / DAY_MS)
const keyOf = (num) => new Date(num * DAY_MS).toISOString().slice(0, 10)
const weekday = (key) => new Date(`${key}T00:00:00Z`).getUTCDay()
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const clip = (v) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, v))
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const variance = (a) => {
  const m = mean(a)
  return a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1)
}

// ─── Observations ────────────────────────────────────────────────────────────

/**
 * Observations par jour tirées des entrées.
 * @returns {{ wellbeing: Map<string, {note?: number, face?: number}>, digestion: Map<string, {gut?: number, stool?: number}> }}
 */
export function observationsFromEntries(entries) {
  const wellbeing = new Map()
  const digestion = new Map()
  const at = (map, dk) => map.get(dk) ?? (map.set(dk, {}), map.get(dk))
  const notes = new Map()
  const rank = { calm: 0, discomfort: 1, pain: 2 }
  const gut = new Map()
  const stool = new Map()
  for (const e of entries || []) {
    if (!e?.at) continue
    const dk = localDateKey(e.at)
    if (e.type === 'wellbeing' && isNum(e.payload?.score) && e.payload.score >= 0 && e.payload.score <= 5) {
      const a = notes.get(dk) ?? []
      a.push(e.payload.score)
      notes.set(dk, a)
    } else if (e.type === GUT_TYPE && e.payload?.level in rank) {
      if (!gut.has(dk) || rank[e.payload.level] > rank[gut.get(dk)]) gut.set(dk, e.payload.level)
    } else if (e.type === STOOL_TYPE) {
      const f = stoolForm(e)
      if (f) (stool.get(dk) ?? stool.set(dk, []).get(dk)).push(STOOL_VALUE[f])
    }
  }
  for (const [dk, a] of notes) at(wellbeing, dk).note = mean(a)
  for (const d of faceMoodDays(entries || [])) at(wellbeing, d.date).face = d.note
  for (const [dk, lvl] of gut) at(digestion, dk).gut = GUT_VALUE[lvl]
  for (const [dk, a] of stool) at(digestion, dk).stool = mean(a)
  return { wellbeing, digestion }
}

// ─── Paramètres ──────────────────────────────────────────────────────────────

/** Valeur « du jour » la plus précise disponible (pour estimer les paramètres). */
const bestW = (o) => (isNum(o?.note) ? o.note : o?.face)
const bestD = (o) => (isNum(o?.gut) ? o.gut : o?.stool)

/** Écart à la moyenne glissante centrée (14 jours) : l'écart du jour, sans la tendance lente. */
function dayDeviations(map, pick) {
  const pts = [...map].map(([dk, o]) => [dayNum(dk), pick(o)]).filter(([, v]) => isNum(v)).sort((a, b) => a[0] - b[0])
  const out = new Map()
  for (const [n, v] of pts) {
    const around = pts.filter(([m]) => Math.abs(m - n) <= 7).map(([, x]) => x)
    if (around.length >= 5) out.set(n, v - mean(around))
  }
  return out
}

/** Paramètres appris sur la personne (méthode des moments, prudente). */
export function estimateParams(obs) {
  // Précision du visage : sur les jours avec note et visage.
  const pairs = [...obs.wellbeing.values()].filter((o) => isNum(o.note) && isNum(o.face))
  let faceSd = OBS_SD.faceDefault
  if (pairs.length >= 7) {
    const v = variance(pairs.map((o) => o.face - o.note)) - OBS_SD.note ** 2
    faceSd = Math.min(1.5, Math.max(0.3, Math.sqrt(Math.max(0, v))))
  }
  const devW = dayDeviations(obs.wellbeing, bestW)
  const devD = dayDeviations(obs.digestion, bestD)
  const devSd = (dev, obsSd, fallback) => {
    if (dev.size < 10) return fallback
    const v = variance([...dev.values()]) - obsSd ** 2
    return Math.min(2, Math.max(0.2, Math.sqrt(Math.max(0, v))))
  }
  const sw = devSd(devW, OBS_SD.note, 0.5)
  const sd = devSd(devD, OBS_SD.gut, 0.8)
  // Lien des écarts : corrélation sur les jours où les deux sont connus, rétrécie vers RHO_PRIOR.
  const both = [...devW.keys()].filter((n) => devD.has(n))
  let rho = RHO_PRIOR
  let rhoDays = both.length
  if (both.length >= 5) {
    const a = both.map((n) => devW.get(n))
    const b = both.map((n) => devD.get(n))
    const ma = mean(a)
    const mb = mean(b)
    const cov = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0)
    const den = Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0) * b.reduce((s, v) => s + (v - mb) ** 2, 0))
    const r = den > 0 ? cov / den : 0
    rho = (both.length * r + RHO_PRIOR_DAYS * RHO_PRIOR) / (both.length + RHO_PRIOR_DAYS)
  } else rhoDays = 0
  rho = Math.min(0.9, Math.max(-0.9, rho))
  return { faceSd, sw, sd, rho, rhoDays, drift: LEVEL_DRIFT_SD }
}

// ─── Algèbre 4 × 4 ───────────────────────────────────────────────────────────

const zeros = (n) => Array.from({ length: n }, () => new Array(n).fill(0))
const matMul = (A, B) => A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)))
const transpose = (A) => A[0].map((_, j) => A.map((row) => row[j]))
const matAdd = (A, B) => A.map((row, i) => row.map((v, j) => v + B[i][j]))
const matSub = (A, B) => A.map((row, i) => row.map((v, j) => v - B[i][j]))
const matVec = (A, v) => A.map((row) => row.reduce((s, x, k) => s + x * v[k], 0))

function invert(A) {
  const n = A.length
  const M = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])
  for (let c = 0; c < n; c += 1) {
    let p = c
    for (let r = c + 1; r < n; r += 1) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    ;[M[c], M[p]] = [M[p], M[c]]
    const piv = M[c][c] || 1e-12
    for (let j = 0; j < 2 * n; j += 1) M[c][j] /= piv
    for (let r = 0; r < n; r += 1) {
      if (r === c) continue
      const f = M[r][c]
      if (f) for (let j = 0; j < 2 * n; j += 1) M[r][j] -= f * M[c][j]
    }
  }
  return M.map((row) => row.slice(n))
}

// État : [tendance bien-être, tendance digestion, écart du jour bien-être, écart du jour digestion].
const F = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
const FT = transpose(F)

function processNoise(p) {
  const Q = zeros(4)
  Q[0][0] = p.drift ** 2
  Q[1][1] = p.drift ** 2
  Q[2][2] = p.sw ** 2
  Q[3][3] = p.sd ** 2
  Q[2][3] = Q[3][2] = p.rho * p.sw * p.sd
  return Q
}

/** Observations d'un jour : liste de { idx (0 bien-être, 1 digestion), y, r (variance) }. */
function dayObservations(obs, dk, p, offsets, { withWellbeing = true } = {}) {
  const list = []
  const wd = weekday(dk)
  const w = withWellbeing ? obs.wellbeing.get(dk) : null
  if (isNum(w?.note)) list.push({ idx: 0, y: w.note - offsets.w[wd], r: OBS_SD.note ** 2 })
  if (isNum(w?.face)) list.push({ idx: 0, y: w.face - offsets.w[wd], r: p.faceSd ** 2 })
  const d = obs.digestion.get(dk)
  if (isNum(d?.gut)) list.push({ idx: 1, y: d.gut - offsets.d[wd], r: OBS_SD.gut ** 2 })
  if (isNum(d?.stool)) list.push({ idx: 1, y: d.stool - offsets.d[wd], r: OBS_SD.stool ** 2 })
  return list
}

/** Filtre de Kalman puis lissage RTS sur [first, last] (numéros de jour). */
function runModel(obs, p, offsets, first, last, opts = {}) {
  const Q = processNoise(p)
  const init = (pick, map) => {
    const v = [...map.values()].map(pick).filter(isNum)
    return v.length ? mean(v) : 3
  }
  let m = [init(bestW, obs.wellbeing), init(bestD, obs.digestion), 0, 0]
  let P = zeros(4)
  P[0][0] = 1
  P[1][1] = 1
  const filtered = []
  const predicted = []
  for (let n = first; n <= last; n += 1) {
    // Prédiction.
    let mp = matVec(F, m)
    let Pp = matAdd(matMul(matMul(F, P), FT), Q)
    if (n === first) { mp = [m[0], m[1], 0, 0]; Pp = matAdd(P, Q) }
    predicted.push({ m: mp, P: Pp })
    // Mises à jour scalaires (observation = tendance + écart du jour de l'objet observé).
    m = mp.slice()
    P = Pp.map((r) => r.slice())
    for (const o of dayObservations(obs, keyOf(n), p, offsets, opts)) {
      const h = o.idx === 0 ? [1, 0, 1, 0] : [0, 1, 0, 1]
      const Ph = matVec(P, h)
      const s = h.reduce((acc, v, k) => acc + v * Ph[k], 0) + o.r
      const innov = o.y - h.reduce((acc, v, k) => acc + v * m[k], 0)
      const K = Ph.map((v) => v / s)
      m = m.map((v, k) => v + K[k] * innov)
      P = P.map((row, i) => row.map((v, j) => v - K[i] * Ph[j]))
    }
    filtered.push({ m, P })
  }
  // Lissage.
  const smoothed = new Array(filtered.length)
  smoothed[filtered.length - 1] = filtered[filtered.length - 1]
  for (let t = filtered.length - 2; t >= 0; t -= 1) {
    const { m: mf, P: Pf } = filtered[t]
    const { m: mpn, P: Ppn } = predicted[t + 1]
    const G = matMul(matMul(Pf, FT), invert(Ppn))
    const next = smoothed[t + 1]
    const ms = mf.map((v, k) => v + matVec(G, next.m.map((x, j) => x - mpn[j]))[k])
    const Ps = matAdd(Pf, matMul(matMul(G, matSub(next.P, Ppn)), transpose(G)))
    smoothed[t] = { m: ms, P: Ps }
  }
  return { filtered, smoothed, Q }
}

/** Rythme de la semaine (moyenne des écarts par jour de semaine, rétrécie, centrée). */
function weeklyOffsets(obs, run, first, pick, mapName, idx) {
  const byWd = Array.from({ length: 7 }, () => [])
  for (const [dk, o] of obs[mapName]) {
    const v = pick(o)
    const t = dayNum(dk) - first
    if (!isNum(v) || t < 0 || t >= run.smoothed.length) continue
    byWd[weekday(dk)].push(v - run.smoothed[t].m[idx])
  }
  const total = byWd.reduce((s, a) => s + a.length, 0)
  if (total < WEEKLY_MIN_DAYS) return new Array(7).fill(0)
  const raw = byWd.map((a) => (a.length ? (mean(a) * a.length) / (a.length + WEEKLY_SHRINK_DAYS / 7) : 0))
  const c = mean(raw)
  return raw.map((v) => v - c)
}

const band = (mu, v) => {
  const sd = Math.sqrt(Math.max(0, v))
  return { mean: clip(mu), low: clip(mu - BAND_Z * sd), high: clip(mu + BAND_Z * sd), sd }
}

/** Validation par blocs : la courbe digestive estimée prédit-elle les notes du ventre mises de côté ? */
function digestiveCurveCheck(obs, p, offsets, first, last) {
  const gutDays = [...obs.digestion].filter(([, o]) => isNum(o.gut)).map(([dk, o]) => [dayNum(dk), o.gut])
  const blocks = new Map()
  for (const [n, v] of gutDays) {
    const b = Math.floor((n - first) / 7)
    ;(blocks.get(b) ?? blocks.set(b, []).get(b)).push([n, v])
  }
  if (blocks.size < CURVE_MIN_BLOCKS) return { show: false, blocks: blocks.size, modelError: null, meanError: null }
  let se = 0
  let seMean = 0
  let count = 0
  for (const [b, list] of blocks) {
    const held = new Set(list.map(([n]) => n))
    const digestion = new Map([...obs.digestion].map(([dk, o]) => [dk, held.has(dayNum(dk)) ? { ...o, gut: undefined } : o]))
    const run = runModel({ ...obs, digestion }, p, offsets, first, last)
    const others = gutDays.filter(([n]) => Math.floor((n - first) / 7) !== b).map(([, v]) => v)
    const m = others.length ? mean(others) : 3
    for (const [n, v] of list) {
      const s = run.smoothed[n - first]
      se += (s.m[1] + s.m[3] + offsets.d[weekday(keyOf(n))] - v) ** 2
      seMean += (m - v) ** 2
      count += 1
    }
  }
  return { show: se < seMean, blocks: blocks.size, modelError: Math.sqrt(se / count), meanError: Math.sqrt(seMean / count) }
}

/**
 * Estimation jour par jour du bien-être et du confort digestif.
 * @param {{ wellbeing: Map, digestion: Map }} obs  observationsFromEntries
 * @param {{ today: string, ahead?: number }} options
 * @returns {{
 *   params: object,
 *   days: Array<{ date: string, future: boolean, observed: { wellbeing: boolean, digestion: boolean },
 *     wellbeing: {mean, low, high, sd}, digestion: {mean, low, high, sd}, digestionOwn: {mean, low, high, sd} }>,
 *   showDigestiveCurve: boolean, curveCheck: object,
 *   noteRequest: { wellbeing: boolean, digestion: boolean }
 * } | null}
 */
export function estimateStates(allObs, { today, ahead = 7 } = {}) {
  // Rien après « aujourd'hui » (jours futurs d'un jeu importé, horloge en retard).
  const upTo = (m) => (today ? new Map([...m].filter(([k]) => k <= today)) : m)
  const obs = { wellbeing: upTo(allObs.wellbeing), digestion: upTo(allObs.digestion) }
  const keys = [...obs.wellbeing.keys(), ...obs.digestion.keys()]
  if (!keys.length) return null
  const first = Math.min(...keys.map(dayNum))
  const last = today ? dayNum(today) : Math.max(...keys.map(dayNum))
  const p = estimateParams(obs)
  const flat = { w: new Array(7).fill(0), d: new Array(7).fill(0) }
  const pass1 = runModel(obs, p, flat, first, last)
  const offsets = {
    w: weeklyOffsets(obs, pass1, first, bestW, 'wellbeing', 0),
    d: weeklyOffsets(obs, pass1, first, bestD, 'digestion', 1),
  }
  const run = runModel(obs, p, offsets, first, last)
  // Règle 5 : la digestion sans aucune information du bien-être (rythme de la semaine compris).
  const ownOpts = { withWellbeing: false }
  const ownPass1 = runModel(obs, p, flat, first, last, ownOpts)
  const ownOffsets = { w: flat.w, d: weeklyOffsets(obs, ownPass1, first, bestD, 'digestion', 1) }
  const own = runModel(obs, p, ownOffsets, first, last, ownOpts)

  const days = []
  for (let t = 0; t <= last - first; t += 1) {
    const dk = keyOf(first + t)
    const wd = weekday(dk)
    const s = run.smoothed[t]
    const o = own.smoothed[t]
    days.push({
      date: dk,
      future: false,
      observed: { wellbeing: obs.wellbeing.has(dk), digestion: isNum(obs.digestion.get(dk)?.gut) },
      wellbeing: band(s.m[0] + s.m[2] + offsets.w[wd], s.P[0][0] + s.P[2][2] + 2 * s.P[0][2]),
      digestion: band(s.m[1] + s.m[3] + offsets.d[wd], s.P[1][1] + s.P[3][3] + 2 * s.P[1][3]),
      digestionOwn: band(o.m[1] + o.m[3] + ownOffsets.d[wd], o.P[1][1] + o.P[3][3] + 2 * o.P[1][3]),
    })
  }
  // Attendu des jours à venir : tendance + rythme de la semaine ; la fourchette s'élargit avec la dérive.
  const end = run.filtered[run.filtered.length - 1]
  const endOwn = own.filtered[own.filtered.length - 1]
  for (let h = 1; h <= ahead; h += 1) {
    const dk = keyOf(last + h)
    const wd = weekday(dk)
    const grow = h * p.drift ** 2
    days.push({
      date: dk,
      future: true,
      observed: { wellbeing: false, digestion: false },
      wellbeing: band(end.m[0] + offsets.w[wd], end.P[0][0] + grow + p.sw ** 2),
      digestion: band(end.m[1] + offsets.d[wd], end.P[1][1] + grow + p.sd ** 2),
      digestionOwn: band(endOwn.m[1] + ownOffsets.d[wd], endOwn.P[1][1] + grow + p.sd ** 2),
    })
  }

  const curveCheck = digestiveCurveCheck(obs, p, offsets, first, last)

  // Demander une note : aujourd'hui sans note et parmi les jours les plus incertains des 4 dernières semaines.
  const past = days.filter((d) => !d.future).slice(-28)
  const ask = (pick, noted) => {
    const todayDay = past[past.length - 1]
    if (!todayDay || noted(todayDay)) return false
    const sds = past.map(pick).sort((a, b) => a - b)
    const q = sds[Math.min(sds.length - 1, Math.floor(ASK_QUANTILE * sds.length))]
    return pick(todayDay) >= q
  }
  const todayKey = keyOf(last)
  const noteRequest = {
    wellbeing: ask((d) => d.wellbeing.sd, () => isNum(obs.wellbeing.get(todayKey)?.note)),
    digestion: [...obs.digestion.values()].some((o) => isNum(o.gut))
      && ask((d) => d.digestionOwn.sd, () => isNum(obs.digestion.get(todayKey)?.gut)),
  }

  return { params: { ...p, offsets }, days, showDigestiveCurve: curveCheck.show, curveCheck, noteRequest }
}

/** Raccourci : depuis les entrées, jusqu'à `now`. */
export function estimateStatesFromEntries(entries, { now = new Date(), ahead = 7 } = {}) {
  return estimateStates(observationsFromEntries(entries), { today: localDateKey(now.toISOString()), ahead })
}
