/**
 * Repas → ventre avec délais (jalon 5, I132) : trois fenêtres fixées d'avance, pas un balayage.
 *
 * Unité d'analyse : chaque note du ventre horodatée (Calme / Gêne / Douleur). Pour une note à l'instant t et une
 * fenêtre [de, à[, un aliment est « présent » s'il figure dans un repas pris entre t − à et t − de (toujours AVANT la
 * note : X précède Y). On compare la part de notes « gêne ou douleur » quand l'aliment est présent et quand il ne
 * l'est pas, puis on corrige pour toutes les combinaisons aliment × fenêtre testées (Benjamini-Hochberg). Moins de
 * fenêtres = moins de comparaisons = plus de puissance.
 *
 * Les fenêtres et leurs repères (FODMAP par groupe) ne sont que des hypothèses de départ affichées comme telles
 * (règle D6) : seules les données de la personne décident. Le ventre n'est jamais une entrée de l'estimateur du
 * bien-être (règle anti-circularité). Le seuil minimal de notes est provisoire : I133 le fixera par simulation.
 *
 * Porte en plus (I168) : une comparaison globale suppose des notes indépendantes. Deux tendances lentes qui se superposent (une
 * semaine de lentilles pendant une mauvaise passe) lui suffisent pour conclure. Une piste doit donc aussi passer le
 * test du décalage temporel tronqué (TTS, Yuan et Shou, PLoS Biology 2024) sur les séries journalières.
 *
 * Comparaison par blocs de 3 jours (I169) : le TTS seul laissait passer 15 à 27 % de fausses pistes avec dix
 * aliments, une dérive lente du ventre, des aliments en séries, une saisie informative et des notes prises après les
 * repas (banc `gutWindows.calibration.test.js`). On compare donc les notes avec et sans l'aliment À L'INTÉRIEUR de
 * chaque bloc de 3 jours (Mantel-Haenszel), jamais une bonne semaine à une mauvaise : une tendance lente ne peut plus
 * passer pour un aliment. Test unilatéral avec correction de continuité. Banc du 26/10 (200 jeux par scénario, 6 et
 * 9 semaines, dix aliments) : au plus 13/200 jeux sans effet gardent une piste (scénario le plus exigeant : dérive
 * lente seule, 9 semaines ; les quatre difficultés ensemble : 5/200, contre 54/200 avant). Prix payé : un effet ×4
 * noyé dans une dérive et des séries ne se voit pas en 9 semaines (0/200) ; le bilan du soir (I170) et la
 * réintroduction guidée (I135) sont là pour ça. On préfère attendre plutôt que montrer de faux suspects.
 */
import { localDateKey } from './analysisEngine'
import { computeTotalsFromItems } from './nutritionKPIs'
import { benjaminiHochberg, normalCdf } from './statistics'
import { GUT_TYPE, isGutDayNote } from './today'

export const GUT_WINDOWS = [
  {
    id: '0-4', fromH: 0, toH: 4, label: '0–4 h',
    hypothesis: 'Souvent le réflexe de l’intestin après le repas, plutôt que les FODMAP (repère général).',
  },
  {
    id: '4-24', fromH: 4, toH: 24, label: '4–24 h',
    hypothesis: 'Fructanes (blé, oignon, ail) et GOS (légumineuses) : souvent dans cet intervalle (repère général).',
  },
  {
    id: '24-48', fromH: 24, toH: 48, label: '24–48 h',
    hypothesis: 'Polyols et édulcorants : parfois jusqu’à 1 ou 2 jours après (repère général).',
  },
]

/** Facteur « repas riche en FODMAP » : hypothèse de départ issue d'une table générale, jamais un verdict. */
export const FODMAP_FACTOR = 'fodmap_eleve'

/** Notes minimales avec et sans l'aliment dans une fenêtre avant de tester (provisoire, calibré par I133). */
export const MIN_EXPOSED_NOTES = 8
export const MIN_UNEXPOSED_NOTES = 8
/** Taille des blocs de comparaison, et blocs informatifs (avec et sans l'aliment, calme et gêne) exigés. */
export const BLOCK_DAYS = 3
export const MIN_INFORMATIVE_BLOCKS = 8
/** Seuil de q (après correction) pour parler de « lien repéré ». */
export const GUT_LINK_MAX_Q = 0.1

/**
 * TTS : r = 9 jours de décalage de chaque côté, donc u ≥ 1 / 10 et une piste n'est gardée que si l'alignement réel
 * bat strictement les 18 autres. Mesuré hors dépôt (25/10, effet à 6 h, 40 jeux ; nulle à dérive lente φ = 0,9 et
 * aliment en séries, 100 jeux) : r = 9 repère l'effet 32 fois sur 40 en 9 semaines (r = 19 : 27), avec 5 jeux nuls
 * sur 100 qui gardent une piste (Fisher seul : 31).
 */
export const TTS_SHIFT_DAYS = 9
export const GUT_TTS_MAX_U = 0.1
/** Jours gardés au minimum une fois r jours retirés à chaque bout (soit 28 jours de notes au moins). */
export const TTS_MIN_KEPT_DAYS = 10

const H = 3_600_000
const SYMPTOM_LEVELS = new Set(['discomfort', 'pain'])
const KNOWN_LEVELS = new Set(['calm', ...SYMPTOM_LEVELS])

const normalize = (name) => String(name || '').trim().toLocaleLowerCase('fr-FR')

export function mealFactors(meal) {
  const items = meal.payload?.items
  if (!Array.isArray(items)) return []
  const factors = new Set(items.map((it) => normalize(it.ingredient)).filter(Boolean))
  if (factors.size === 0) return []
  try {
    if (computeTotalsFromItems(items).fodmap_score >= 2) factors.add(FODMAP_FACTOR)
  } catch {
    // Table nutritionnelle pas chargée : on garde seulement les aliments.
  }
  return [...factors]
}

/**
 * Aliments présents avant une note, par fenêtre.
 * @param {{ at: string }} note
 * @param {{ at: string, factors: string[] }[]} meals
 * @returns {Record<string, Set<string>>}
 */
export function mealExposures(note, meals) {
  const t = Date.parse(note.at)
  const out = Object.fromEntries(GUT_WINDOWS.map((w) => [w.id, new Set()]))
  for (const m of meals) {
    const dt = t - Date.parse(m.at)
    if (!(dt >= 0)) continue
    const w = GUT_WINDOWS.find((win) => dt >= win.fromH * H && dt < win.toH * H)
    if (!w) continue
    for (const f of m.factors) out[w.id].add(f)
  }
  return out
}

/**
 * Test du décalage temporel tronqué (TTS). `stat(s)` recalcule la même statistique quand les repas sont décalés de
 * s jours, de −r à +r, SANS enroulement (on ne garde que les notes des jours r à n − r − 1, pour que chaque
 * décalage reste dans la période observée). B = nombre de décalages (0 compris) au moins aussi forts que
 * l'alignement réel ; u = B / (r + 1), plafonné à 1. Valide dès qu'une des deux séries est stationnaire. Un
 * décalage où la statistique n'est pas calculable compte comme « aussi fort » (prudent).
 * @param {(s: number) => number|null} stat
 * @param {number} r
 * @returns {number|null}  u, ou null si l'alignement réel n'est pas calculable
 */
export function truncatedTimeShift(stat, r) {
  const real = stat(0)
  if (real == null) return null
  let b = 0
  for (let s = -r; s <= r; s++) {
    const v = s === 0 ? real : stat(s)
    if (v == null || v >= real - 1e-12) b += 1
  }
  return Math.min(1, b / (r + 1))
}

/**
 * Test de Mantel-Haenszel stratifié : dans chaque strate (bloc de jours), la gêne est-elle plus (ou moins) fréquente
 * quand l'aliment est présent ? Une strate n'informe que si elle a des notes avec ET sans l'aliment, et des notes
 * calmes ET gênées.
 * @param {{ y: 0|1, x: 0|1, k: number }[]} rows
 * @returns {{ z: number|null, informative: number }}
 */
export function mantelHaenszel(rows) {
  const strata = new Map()
  for (const { y, x, k } of rows) {
    const s = strata.get(k) || { n1: 0, a: 0, n: 0, m: 0 }
    s.n += 1
    s.m += y
    if (x) { s.n1 += 1; s.a += y }
    strata.set(k, s)
  }
  let observed = 0
  let expected = 0
  let variance = 0
  let informative = 0
  for (const { n1, a, n, m } of strata.values()) {
    if (n1 === 0 || n1 === n || m === 0 || m === n) continue
    informative += 1
    observed += a
    expected += (n1 * m) / n
    variance += (n1 * (n - n1) * m * (n - m)) / (n * n * (n - 1))
  }
  // Correction de continuité de 0,5 (vers zéro) : l’approximation normale est trop optimiste sur de petits blocs.
  const diff = observed - expected
  const corrected = Math.sign(diff) * Math.max(0, Math.abs(diff) - 0.5)
  return { z: variance > 0 ? corrected / Math.sqrt(variance) : null, informative }
}

const exposedAt = (t, mealTimes, w) => mealTimes.some((m) => t - m >= w.fromH * H && t - m < w.toH * H) ? 1 : 0

/** z de Mantel-Haenszel, repas décalés de `s` jours. */
function shiftedStat(kept, mealTimes, w, s) {
  return mantelHaenszel(kept.map((n) => ({ y: n.y, k: n.k, x: exposedAt(n.t - s * 24 * H, mealTimes, w) }))).z
}

/**
 * @param {object[]} entries  entrées `food` et `gut` horodatées (les autres, et les bilans du soir, sont ignorées)
 * @returns {{ notes: number, tested: number, results: {
 *   factor: string, window: string, status: 'link'|'no_link'|'too_early',
 *   exposed: { notes: number, symptoms: number }, unexposed: { notes: number, symptoms: number },
 *   rr: number|null, p: number|null, q: number|null, u: number|null, days: number }[] }}
 */
export function analyzeGutWindows(entries) {
  const meals = []
  const notes = []
  for (const e of entries || []) {
    if (!e?.at || Number.isNaN(Date.parse(e.at))) continue
    if (e.type === 'food') {
      const factors = mealFactors(e)
      if (factors.length) meals.push({ at: e.at, factors })
    } else if (e.type === GUT_TYPE && KNOWN_LEVELS.has(e.payload?.level) && !isGutDayNote(e)) {
      // Le bilan du soir (I170) parle de la journée, pas d'un instant : pas de fenêtre horaire qui ait un sens.
      notes.push(e)
    }
  }
  if (notes.length === 0 || meals.length === 0) return { notes: notes.length, tested: 0, results: [] }

  const factors = [...new Set(meals.flatMap((m) => m.factors))].sort()
  const exposures = notes.map((n) => mealExposures(n, meals))
  const days = new Set(notes.map((n) => localDateKey(n.at))).size
  const times = notes.map((n) => Date.parse(n.at))
  const first = Math.min(...times)
  const last = Math.max(...times)
  const block = (t) => Math.floor((t - first) / (BLOCK_DAYS * 24 * H))

  const results = []
  for (const factor of factors) {
    for (const w of GUT_WINDOWS) {
      const exposed = { notes: 0, symptoms: 0 }
      const unexposed = { notes: 0, symptoms: 0 }
      const rows = notes.map((n, i) => {
        const x = exposures[i][w.id].has(factor) ? 1 : 0
        const y = SYMPTOM_LEVELS.has(n.payload.level) ? 1 : 0
        const bucket = x ? exposed : unexposed
        bucket.notes += 1
        bucket.symptoms += y
        return { y, x, k: block(times[i]) }
      })
      if (exposed.notes === 0) continue
      const { z, informative } = mantelHaenszel(rows)
      const enough = exposed.notes >= MIN_EXPOSED_NOTES && unexposed.notes >= MIN_UNEXPOSED_NOTES &&
        informative >= MIN_INFORMATIVE_BLOCKS && z != null
      // Correction de Haldane (+0,5) : un rapport lisible même avec un zéro.
      const rr = enough
        ? ((exposed.symptoms + 0.5) / (exposed.notes + 1)) / ((unexposed.symptoms + 0.5) / (unexposed.notes + 1))
        : null
      // Unilatéral : la question posée d'avance est « plus de gêne après cet aliment ? ». Un aliment « protecteur »
      // dans une fenêtre n'est le plus souvent que l'ombre d'un effet dans une autre (heure de la note).
      const p = enough ? 1 - normalCdf(z) : null
      results.push({ factor, window: w.id, status: enough ? 'no_link' : 'too_early', exposed, unexposed, rr, p, q: null, u: null, days })
    }
  }

  const tested = results.filter((r) => r.p != null)
  const qs = benjaminiHochberg(tested.map((r) => r.p))
  tested.forEach((r, i) => { r.q = qs[i] })

  // Porte TTS, seulement pour les candidates. Trop peu de jours pour décaler : on préfère attendre.
  const candidates = tested.filter((r) => r.q < GUT_LINK_MAX_Q)
  if (candidates.length) {
    const noteDays = new Set(notes.map((n) => localDateKey(n.at))).size
    const span = Math.round((last - first) / (24 * H)) + 1
    const r = TTS_SHIFT_DAYS
    const enoughDays = span - 2 * r >= TTS_MIN_KEPT_DAYS && noteDays >= TTS_MIN_KEPT_DAYS
    for (const c of candidates) {
      if (!enoughDays) { c.status = 'too_early'; continue }
      const w = GUT_WINDOWS.find((win) => win.id === c.window)
      const kept = notes
        .map((n) => ({ t: Date.parse(n.at), y: SYMPTOM_LEVELS.has(n.payload.level) ? 1 : 0, k: block(Date.parse(n.at)) }))
        .filter((n) => n.t - first >= r * 24 * H && last - n.t >= r * 24 * H)
      const mealTimes = meals.filter((m) => m.factors.includes(c.factor)).map((m) => Date.parse(m.at))
      c.u = truncatedTimeShift((s) => shiftedStat(kept, mealTimes, w, s), r)
      if (c.u == null) c.status = 'too_early'
      else if (c.u <= GUT_TTS_MAX_U) c.status = 'link'
    }
  }

  return { notes: notes.length, tested: tested.length, results }
}
