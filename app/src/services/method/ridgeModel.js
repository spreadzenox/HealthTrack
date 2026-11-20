/**
 * ORG-5c — Un modèle linéaire régularisé par résultat, et sa stabilité.
 *
 * Après le tri facteur par facteur (pente contrôlée, Holm : analysisResults.js), les facteurs candidats d'un résultat
 * (une courte liste par personne : les plus nets, au plus un pour 8 jours et 12 en tout, sans doublons trop corrélés)
 * entrent ensemble dans une régression ridge pondérée (jours notés plus pesants), avec les contrôles non pénalisés
 * (semaine / week-end, tendance, journée à part). La force de la régularisation est choisie par validation croisée
 * par semaines. Puis :
 * - stabilité : on rééchantillonne les semaines (bootstrap par blocs) et l'on refait le modèle ; un lien n'est « net »
 *   que si son signe tient dans au moins 85 % des rééchantillonnages (et qu'il passait déjà la correction de Holm) ;
 *   la fourchette est celle des rééchantillonnages (2,5 % – 97,5 %) ;
 * - prévision : « Ce qui pèse » n'est montré que si le modèle prévoit les jours mis de côté mieux que « demain =
 *   aujourd'hui » (la dernière valeur connue), sur les mêmes jours.
 * Les coefficients du modèle (effets à autres facteurs égaux) servent aussi aux contributions du jour : un facteur
 * n'y est pas compté deux fois à travers ses voisins.
 *
 * METHODE-BIAIS-1 (banc du 20/11) : la pénalité et le remplacement des jours sans valeur par la moyenne rétrécissent
 * la taille d'un lien (environ la moitié de la vraie) et sa fourchette manque la vraie valeur 8 fois sur 10. La TAILLE
 * montrée (`shown`) vient donc d'un second ajustement sans pénalité des seuls facteurs retenus et des contrôles, sur les
 * jours où ils sont tous connus, avec sa fourchette par les mêmes tirages de semaines. La ridge garde tout le reste :
 * choix des facteurs, stabilité du signe (« net »), prévision et contributions du jour.
 *
 * METHODE-BIAIS-3 (banc du 20/11 23:30) : dans cet ajustement, les facteurs retenus sans réel appui (choisis parmi
 * des dizaines pour une p favorable) prennent une part du lien d'un vrai facteur, surtout s'il est autocorrélé comme
 * le sommeil. N'y restent, à côté du facteur, que les autres facteurs très appuyés (SHOWN_PARTNER_MAX_P).
 */
import { rng } from './simulate'

export const MAX_MODEL_FACTORS = 12
export const DAYS_PER_FACTOR = 8
export const MAX_FACTOR_CORR = 0.9
export const RIDGE_GRID = [0.3, 1, 3, 10, 30, 100]
export const BOOTSTRAP_SAMPLES = 100
export const STABILITY_MIN = 0.85
/** Taille sans pénalité seulement avec assez de jours complets : 2 semaines et 4 jours par facteur retenu. */
export const SHOWN_MIN_DAYS_PER_FACTOR = 4
/** METHODE-BIAIS-3 : p (tri univarié) d'un autre facteur retenu pour qu'il reste dans l'ajustement de la taille montrée. */
export const SHOWN_PARTNER_MAX_P = 0.001
const WEEK = 7

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length

/** Résout A x = b (Gauss avec pivot partiel). */
function solve(A, b) {
  const n = A.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c += 1) {
    let p = c
    for (let r = c + 1; r < n; r += 1) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    ;[M[c], M[p]] = [M[p], M[c]]
    const piv = Math.abs(M[c][c]) > 1e-12 ? M[c][c] : 1e-12
    for (let r = 0; r < n; r += 1) {
      if (r === c) continue
      const f = M[r][c] / piv
      if (f) for (let j = c; j <= n; j += 1) M[r][j] -= f * M[c][j]
    }
  }
  return M.map((row, i) => row[n] / (Math.abs(M[i][i]) > 1e-12 ? M[i][i] : 1e-12))
}

/**
 * Ridge pondérée : colonnes 0..u-1 non pénalisées (intercept, contrôles), les autres pénalisées par λ × Σ poids.
 * @param {number[][]} X  lignes
 */
export function ridge(X, y, w, unpenalized, lambda) {
  const { A, b, sw } = normalEquations(X, y, w)
  return solvePenalized(A, b, sw / X.length, unpenalized, lambda)
}

/** Équations normales pondérées (Xᵀ W X, Xᵀ W y) et somme des poids ; `sign` = -1 pour retirer des lignes. */
function normalEquations(X, y, w, into = null, sign = 1) {
  const p = X[0].length
  const A = into?.A ?? Array.from({ length: p }, () => new Array(p).fill(0))
  const b = into?.b ?? new Array(p).fill(0)
  let sw = into?.sw ?? 0
  for (let i = 0; i < X.length; i += 1) {
    const xi = X[i]
    const wi = sign * w[i]
    sw += wi
    for (let j = 0; j < p; j += 1) {
      b[j] += wi * xi[j] * y[i]
      for (let k = j; k < p; k += 1) A[j][k] += wi * xi[j] * xi[k]
    }
  }
  return { A, b, sw }
}

/** Résout (A + λ × pénalité) x = b ; A n'a que son triangle supérieur rempli ; ni A ni b ne sont modifiés. */
function solvePenalized(A, b, penaltyScale, unpenalized, lambda) {
  const p = A.length
  const M = A.map((row) => [...row])
  for (let j = 0; j < p; j += 1) for (let k = 0; k < j; k += 1) M[j][k] = M[k][j]
  for (let j = unpenalized; j < p; j += 1) M[j][j] += lambda * penaltyScale
  return solve(M, [...b])
}

const predict = (beta, x) => x.reduce((s, v, j) => s + v * beta[j], 0)

/**
 * @param {object} o
 * @param {Array<{ dk: string, num: number, y: number, w: number, controls: number[] }>} o.rows  jours du résultat
 * @param {Array<{ id: string, p: number }>} o.candidates  facteurs × horizons triés, déjà passés au tri univarié
 * @param {(id: string, dk: string) => number|null} o.valueOf  valeur du facteur sur la fenêtre de son horizon
 * @param {(id: string, dk: string) => boolean} [o.completeOf]  fenêtre assez remplie pour la taille montrée
 *   (METHODE-BIAIS-2) ; par défaut, une valeur connue
 * @param {number} [o.seed]
 * @returns {null | { used: string[], lambda: number, beatsPersistence: boolean, cvError: number,
 *   persistenceError: number, coef: Map<string, { perUnit: number, low: number, high: number, stability: number,
 *   mean: number, shown: { perUnit: number, low: number, high: number } }> }}
 *   `shown` : la taille à montrer et sa fourchette (sans pénalité ; celles de la ridge s'il manque des jours complets
 *   ou si le sens diffère).
 */
export function fitOutcomeModel({ rows, candidates, valueOf, completeOf, seed = 7, samples = BOOTSTRAP_SAMPLES }) {
  if (rows.length < 2 * WEEK || !candidates.length) return null
  rows = [...rows].sort((a, b) => a.num - b.num)
  // Courte liste : par p croissante, sans doublon trop corrélé.
  const maxK = Math.max(1, Math.min(MAX_MODEL_FACTORS, Math.floor(rows.length / DAYS_PER_FACTOR)))
  const cols = new Map()
  const raws = new Map()
  const colOf = (id) => {
    if (!cols.has(id)) {
      const raw = rows.map((r) => valueOf(id, r.dk))
      raws.set(id, raw)
      const known = raw.filter((v) => v !== null)
      const m = known.length ? mean(known) : 0
      cols.set(id, raw.map((v) => (v === null ? m : v)))
    }
    return cols.get(id)
  }
  const corr = (a, b) => {
    const ma = mean(a)
    const mb = mean(b)
    let c = 0
    let va = 0
    let vb = 0
    for (let i = 0; i < a.length; i += 1) {
      c += (a[i] - ma) * (b[i] - mb)
      va += (a[i] - ma) ** 2
      vb += (b[i] - mb) ** 2
    }
    return va > 0 && vb > 0 ? c / Math.sqrt(va * vb) : 0
  }
  const used = []
  for (const c of [...candidates].sort((a, b) => a.p - b.p)) {
    if (used.length >= maxK) break
    const col = colOf(c.id)
    if (used.some((u) => Math.abs(corr(colOf(u), col)) > MAX_FACTOR_CORR)) continue
    used.push(c.id)
  }
  // Facteurs standardisés (pour une pénalité comparable), remis en unités du facteur à la fin.
  const stats = used.map((id) => {
    const col = colOf(id)
    const m = mean(col)
    const sd = Math.sqrt(mean(col.map((v) => (v - m) ** 2))) || 1
    return { m, sd }
  })
  const nCtrl = 1 + rows[0].controls.length
  const X = rows.map((r, i) => [1, ...r.controls, ...used.map((id, j) => (colOf(id)[i] - stats[j].m) / stats[j].sd)])
  const y = rows.map((r) => r.y)
  const w = rows.map((r) => r.w)
  const week = rows.map((r) => Math.floor((r.num - rows[0].num) / WEEK))
  const weeks = [...new Set(week)]

  // Validation croisée par semaines (une semaine mise de côté à la fois).
  const cvError = (lambda) => {
    let se = 0
    let sw = 0
    const preds = new Array(rows.length)
    for (const k of weeks) {
      const tr = rows.map((_, i) => i).filter((i) => week[i] !== k)
      if (tr.length < nCtrl + 2) continue
      const beta = ridge(tr.map((i) => X[i]), tr.map((i) => y[i]), tr.map((i) => w[i]), nCtrl, lambda)
      rows.forEach((_, i) => { if (week[i] === k) preds[i] = predict(beta, X[i]) })
    }
    rows.forEach((_, i) => { if (preds[i] !== undefined) { se += w[i] * (preds[i] - y[i]) ** 2; sw += w[i] } })
    return { error: sw ? se / sw : Infinity, preds }
  }
  let best = null
  for (const lambda of RIDGE_GRID) {
    const cv = cvError(lambda)
    if (!best || cv.error < best.error) best = { lambda, ...cv }
  }
  // « Demain = aujourd'hui » : la dernière valeur connue avant le jour, sur les mêmes jours.
  let sePers = 0
  let seModel = 0
  let swp = 0
  for (let i = 1; i < rows.length; i += 1) {
    if (best.preds[i] === undefined) continue
    sePers += w[i] * (y[i - 1] - y[i]) ** 2
    seModel += w[i] * (best.preds[i] - y[i]) ** 2
    swp += w[i]
  }
  const persistenceError = swp ? sePers / swp : Infinity
  const modelError = swp ? seModel / swp : Infinity

  const full = ridge(X, y, w, nCtrl, best.lambda)
  // Taille montrée (METHODE-BIAIS-1) : moindres carrés pondérés sans pénalité sur les jours complets. Une pénalité
  // infime sur toutes les colonnes ne sert qu'à rester soluble si un contrôle est constant sur ces jours.
  // METHODE-BIAIS-2 : un ajustement par facteur retenu, sur les jours où sa propre fenêtre est assez remplie (une
  // fenêtre à moitié vide mesure mal ce qui a agi et rétrécit la taille de son lien) ; les autres facteurs y gardent
  // leur moyenne les jours sans valeur (exiger qu'ils soient tous connus laissait trop peu de jours).
  const okFor = used.map((id) => rows.map((r, i) => raws.get(id)[i] !== null && (!completeOf || completeOf(id, r.dk))))
  const minDays = (idx) => idx.length >= Math.max(2 * WEEK, SHOWN_MIN_DAYS_PER_FACTOR * used.length)
  const sub = (idx) => [idx.map((i) => X[i]), idx.map((i) => y[i]), idx.map((i) => w[i])]
  // Un ajustement par facteur sur les mêmes jours moins ceux de sa fenêtre trop vide : les équations normales de tous
  // les jours sont faites une fois, puis on retire seulement les jours exclus (peu nombreux) pour chaque facteur.
  // METHODE-BIAIS-3 : à côté du facteur, seuls les autres facteurs retenus très appuyés (p < SHOWN_PARTNER_MAX_P) ;
  // un facteur sans effet retenu pour un hasard favorable prenait une part du lien (sommeil fort 0,80 de sa taille au
  // banc, 0,94 sans eux), et un vrai facteur très appuyé reste là pour qu'un voisin corrélé n'hérite pas de son effet.
  const pOf = new Map(candidates.map((c) => [c.id, c.p]))
  const shownCols = used.map((_, j) => [
    ...Array.from({ length: nCtrl }, (_, c) => c),
    ...used.map((_, k) => k).filter((k) => k === j || pOf.get(used[k]) < SHOWN_PARTNER_MAX_P).map((k) => nCtrl + k),
  ])
  const shownFits = (idx, all = normalEquations(...sub(idx))) => {
    return used.map((_, j) => {
      const out = idx.filter((i) => !okFor[j][i])
      if (!minDays(idx.filter((i) => okFor[j][i]))) return null
      const eq = out.length
        ? normalEquations(...sub(out), { A: all.A.map((row) => [...row]), b: [...all.b], sw: all.sw }, -1)
        : all
      // Une pénalité infime ne sert qu'à rester soluble si un contrôle est constant sur ces jours.
      const sel = shownCols[j]
      const A2 = sel.map((a) => sel.map((c) => eq.A[Math.min(a, c)][Math.max(a, c)]))
      return solvePenalized(A2, sel.map((a) => eq.b[a]), eq.sw / (idx.length - out.length), 0, 1e-6)[sel.indexOf(nCtrl + j)]
    })
  }
  const fullShown = shownFits(rows.map((_, i) => i))
  // Stabilité : bootstrap par semaines (les mêmes tirages servent à la fourchette de la taille montrée).
  const r = rng(seed)
  const draws = used.map(() => [])
  const drawsShown = used.map(() => [])
  for (let s = 0; s < samples; s += 1) {
    const idx = []
    for (let k = 0; k < weeks.length; k += 1) {
      const pick = weeks[Math.floor(r() * weeks.length)]
      week.forEach((wk, i) => { if (wk === pick) idx.push(i) })
    }
    if (idx.length < nCtrl + 2) continue
    const eqs = normalEquations(...sub(idx))
    const beta = solvePenalized(eqs.A, eqs.b, eqs.sw / idx.length, nCtrl, best.lambda)
    used.forEach((_, j) => draws[j].push(beta[nCtrl + j]))
    if (fullShown.every((v) => v === null)) continue
    const shown = shownFits(idx, eqs)
    used.forEach((_, j) => { if (fullShown[j] !== null && shown[j] !== null) drawsShown[j].push(shown[j]) })
  }
  const quantile = (a, q) => {
    const b = [...a].sort((x, z) => x - z)
    return b[Math.min(b.length - 1, Math.max(0, Math.round(q * (b.length - 1))))]
  }
  const coef = new Map()
  used.forEach((id, j) => {
    const b = full[nCtrl + j]
    const d = draws[j]
    const same = d.length ? d.filter((v) => Math.sign(v) === Math.sign(b) && v !== 0).length / d.length : 0
    const sd = stats[j].sd
    const ridgeCoef = {
      perUnit: b / sd,
      low: (d.length ? quantile(d, 0.025) : b) / sd,
      high: (d.length ? quantile(d, 0.975) : b) / sd,
    }
    const bs = fullShown[j]
    const ds = drawsShown[j]
    // Assez de tirages et même sens que la ridge (le sens de « net » ne change jamais) ; sinon, la taille de la ridge.
    const okShown = bs !== null && ds.length >= samples / 2 && Math.sign(bs) === Math.sign(b) && bs !== 0
    coef.set(id, {
      ...ridgeCoef,
      stability: same,
      mean: stats[j].m,
      shown: okShown
        ? { perUnit: bs / sd, low: quantile(ds, 0.025) / sd, high: quantile(ds, 0.975) / sd }
        : ridgeCoef,
    })
  })
  return {
    used,
    lambda: best.lambda,
    beatsPersistence: modelError < persistenceError,
    cvError: modelError,
    persistenceError,
    coef,
  }
}
