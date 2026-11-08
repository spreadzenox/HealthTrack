/**
 * ORG-5 — Contrat des résultats d'Analyses (revue design du 07/11). C'est la seule porte entre la méthode (ce dossier)
 * et les écrans (Analyses, Tendances, Agir, rapport médecin). La forme des objets rendus est STABLE : la méthode peut
 * changer derrière (ORG-5b à 5d, TS-1, TS-2) sans que les écrans aient à changer. Toute évolution de la forme passe
 * par `CONTRACT_VERSION` et garde les champs existants.
 *
 * Deux résultats (bien-être, digestion) × trois horizons :
 * - court : le jour même (avant la mesure) et la veille ;
 * - moyen : 2 à 6 jours avant ;
 * - long : 7 à 27 jours avant.
 *
 * Échelle : les points sont ceux de l'échelle interne de 0 à 5 (comme le stockage) ; à l'écran (1 à 5), un écart se
 * convertit par `gapToDisplay` (mood/wellbeingScale.js), une valeur par `toDisplay`.
 *
 * Pour chaque facteur : effet en points (sur 5) pour une variation habituelle du facteur (« pour 50 min de sommeil de
 * plus »), sa fourchette à 95 %, s'il est « net », son thème (couleur) et si l'on peut agir dessus.
 * `dayContributions` rend, pour un jour donné, les 3 plus grandes contributions (coefficient × écart du facteur ce
 * jour-là à sa valeur habituelle), pour « Ce qui a pu peser ce jour-là » de Tendances.
 *
 * Méthode actuelle (`method: 'provisional'`) : pente simple par facteur et par horizon, contrôlée pour le jour de la
 * semaine (semaine / week-end) et la tendance, échantillon effectif de Bartlett (autocorrélations positives), erreur
 * élargie d'un facteur calé au banc, Student, Holm sur facteurs × horizons d'un même résultat ; « net » = p de Holm
 * ≤ 0,05 et fourchette qui ne touche pas zéro (banc ORG-5a : `method/bench.test.js`). ORG-5c la remplace
 * par un modèle régularisé avec stabilité par rééchantillonnage ; la forme ne bouge pas.
 *
 * Règles de data science (5 et 6) : le bien-être n'est jamais un facteur, ni la digestion ; les analyses digestives
 * n'apprennent que de l'information digestive (notes du ventre), jamais du bien-être ; aucun facteur n'est une entrée
 * de l'estimateur du bien-être (`isEstimatorInput`) ; aucun sens « bon » ou « mauvais » n'est supposé.
 */
import { FIRST_RESULTS_DAY } from '../config/firstResults'
import { buildDailyDataset, localDateKey, VARIABLE_META } from './analysisEngine'
import { isWeekendKey, residualize } from './statistics'
import { faceMoodDays } from './mood/faceMoodDays'
import { FODMAP_SUBGROUPS } from './fodmapGroups'
import { fodmapGroupOf, mealFactors } from './gutWindows'
import { measuredTagsByDay } from './behaviorTags'
import { estimateStates, observationsFromEntries } from './method/stateSpace'
import { STABILITY_MIN, fitOutcomeModel } from './method/ridgeModel'
import { detectChanges } from './method/changes'
import { GUT_TYPE } from './today'
import { formatDuration } from '../utils/format'
import { appLocale } from '../i18n/locale.js'

export const CONTRACT_VERSION = 1

/** @typedef {'wellbeing'|'digestion'} OutcomeId */
/** @typedef {'short'|'medium'|'long'} HorizonId */
/**
 * Thème = couleur de l'identité visuelle (DESIGN.md) : wellbeing vert, digestion et nutrition orange, activity lilas,
 * sleep bleu nuit, body rose framboise, context gris neutre.
 * @typedef {'wellbeing'|'digestion'|'nutrition'|'activity'|'sleep'|'body'|'context'} ThemeId
 */

/**
 * @typedef {object} Factor
 * @property {string} key            identifiant stable du facteur (colonne du jeu quotidien)
 * @property {string} label          libellé court (« Sommeil »)
 * @property {ThemeId} theme
 * @property {boolean} actionable    vrai si la personne peut le changer (sinon « À regarder, pas à changer »)
 * @property {OutcomeId} outcome
 * @property {HorizonId} horizon
 * @property {number} effect         points sur 5 pour `usualChange` (signé : > 0 = résultat plus haut)
 * @property {number} low            bas de la fourchette à 95 % (mêmes unités que effect)
 * @property {number} high           haut de la fourchette
 * @property {boolean} net           lien assez net pour être montré plein (sinon hachuré)
 * @property {{ amount: number, unit: string, text: string }} usualChange  variation habituelle (« 50 min de sommeil de plus »)
 * @property {number} perUnit        points par unité du facteur (pour les contributions)
 * @property {boolean} [outOfScale]   effet plus grand que l'échelle (SCALE_SPAN) : « pas assez de données »
 * @property {number} center         valeur habituelle du facteur sur cet horizon (moyenne des jours utilisés)
 * @property {number} days           jours utilisés
 * @property {boolean} [inModel]     ORG-5c : dans le modèle régularisé (effet à autres facteurs égaux)
 * @property {number|null} [stability]  part des rééchantillonnages par semaines où le signe tient (0 à 1)
 */

/**
 * @typedef {object} HorizonResult
 * @property {HorizonId} id
 * @property {string} label                 « Court terme »…
 * @property {string} window                « le jour même et la veille »…
 * @property {'ready'|'locked'} status      locked tant que `daysHave < daysNeeded` (ou condition digestive)
 * @property {number} daysHave              jours du résultat connus
 * @property {number} daysNeeded            seuil de déblocage
 * @property {Factor[]} factors             triés par |effect| décroissant ; vide si locked
 */

/**
 * @typedef {object} OutcomeResult
 * @property {OutcomeId} id
 * @property {string} label
 * @property {ThemeId} theme
 * @property {'ready'|'partial'|'locked'} status  ready = les trois horizons, partial = au moins un
 * @property {number} daysHave
 * @property {number|null} daysToFirst    jours restants avant le premier horizon (0 si déjà prêt)
 * @property {number} [symptomDays]       digestion : jours de gêne ou douleur
 * @property {number} [symptomDaysNeeded]
 * @property {boolean|null} beatsPersistence  la méthode prévoit-elle mieux que « demain = aujourd'hui » hors
 *   échantillon ? null tant que la méthode ne le mesure pas (ORG-5c) ; « Ce qui pèse » n'est montré que si vrai.
 * @property {Record<HorizonId, HorizonResult>} horizons
 */

/**
 * @typedef {object} AnalysisResults
 * @property {number} contractVersion
 * @property {'provisional'|'org5'} method
 * @property {string} computedFor   jour local (AAAA-MM-JJ) du calcul
 * @property {Record<OutcomeId, OutcomeResult>} outcomes
 */
/** @typedef {OutcomeResult & { changes?: string[] }} OutcomeWithChanges  `changes` : dates des changements durables du résultat (TS-2), contrôlés */

/**
 * @typedef {object} DayContribution
 * @property {string} key
 * @property {string} label
 * @property {ThemeId} theme
 * @property {HorizonId} horizon
 * @property {number} points        coefficient × écart du facteur ce jour-là (points sur 5, signé)
 * @property {number} value         valeur du facteur ce jour-là (sur la fenêtre de l'horizon)
 * @property {number} usual         valeur habituelle
 */

export const OUTCOMES = [
  { id: 'wellbeing', label: 'Bien-être', theme: 'wellbeing' },
  { id: 'digestion', label: 'Confort digestif', theme: 'digestion' },
]

/** Fenêtres en jours avant le jour mesuré (0 = le jour même, avant la mesure). */
export const HORIZONS = [
  { id: 'short', label: 'Court terme', window: 'le jour même et la veille', from: 0, to: 1 },
  { id: 'medium', label: 'Moyen terme', window: 'de 2 à 6 jours avant', from: 2, to: 6 },
  { id: 'long', label: 'Long terme', window: 'de 7 à 27 jours avant', from: 7, to: 27 },
]

/** Seuils de déblocage (ORG-6) : jours du résultat connus, par horizon. */
export const UNLOCK_DAYS = {
  wellbeing: { short: FIRST_RESULTS_DAY.wellbeing, medium: 21, long: 42 },
  digestion: { short: FIRST_RESULTS_DAY.digestion, medium: 35, long: 56 },
}
/** Digestion : au moins 5 jours de gêne ou de douleur (sans eux, rien à expliquer). */
export const DIGESTION_MIN_SYMPTOM_DAYS = 5

/**
 * Un lien est « net » si sa p corrigée par Holm sur facteurs × horizons d'un résultat reste sous ce seuil : la chance
 * qu'un seul faux lien apparaisse sur tout un résultat reste sous 5 % (banc ORG-5a). Benjamini-Hochberg contrôlait
 * seulement la part de faux liens et en laissait passer dès qu'un vrai lien fort était là.
 */
export const NET_MAX_P = 0.05

/** p corrigées de Holm (même ordre que l'entrée). */
export function holm(pValues) {
  const m = pValues.length
  const order = pValues.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0])
  const out = new Array(m)
  let run = 0
  order.forEach(([p, i], k) => {
    run = Math.max(run, Math.min(1, (m - k) * p))
    out[i] = run
  })
  return out
}
/** Un facteur n'entre que s'il est connu au moins ces jours-là (part des jours du résultat). */
export const FACTOR_MIN_COVERAGE = 0.5

const FODMAP_LABELS = {
  fructans: 'Fructanes', gos: 'GOS', fructose: 'Fructose en excès', lactose: 'Lactose', sorbitol: 'Sorbitol',
  mannitol: 'Mannitol',
}
const FODMAP_TEXT = {
  fructans: 'fructanes', gos: 'GOS', fructose: 'fructose en excès', lactose: 'lactose', sorbitol: 'sorbitol',
  mannitol: 'mannitol',
}

const fmtInt = (v) => Math.round(v).toLocaleString(appLocale())

/**
 * Courte liste de facteurs candidats (ORG-5 : « courte liste par personne » ; ceux qui ne sont pas assez connus
 * sont écartés au calcul). Ni bien-être, ni ventre, ni rien de ce qui estime le bien-être.
 */
export const FACTORS = [
  { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', actionable: true, unit: 'min', step: 10,
    text: (a) => `${formatDuration(a)} de sommeil de plus` },
  { key: 'steps', label: 'Pas', theme: 'activity', actionable: true, unit: 'pas', step: 500,
    text: (a) => `${fmtInt(a)} pas de plus` },
  { key: 'activityCalories', label: 'Activité', theme: 'activity', actionable: true, unit: 'kcal', step: 50,
    text: (a) => `${fmtInt(a)} kcal d’activité de plus` },
  { key: 'screen_minutes', label: 'Temps d’écran', theme: 'context', actionable: true, unit: 'min', step: 10,
    text: (a) => `${formatDuration(a)} d’écran de plus` },
  { key: 'screen_late_minutes', label: 'Écran tard le soir', theme: 'context', actionable: true, unit: 'min', step: 5,
    text: (a) => `${formatDuration(a)} d’écran tard de plus` },
  { key: 'social_minutes', label: 'Réseaux sociaux', theme: 'context', actionable: true, unit: 'min', step: 5,
    text: (a) => `${formatDuration(a)} de réseaux sociaux de plus` },
  { key: 'kcal', label: 'Calories mangées', theme: 'nutrition', actionable: true, unit: 'kcal', step: 50,
    text: (a) => `${fmtInt(a)} kcal mangées de plus` },
  { key: 'fiber_g', label: 'Fibres', theme: 'nutrition', actionable: true, unit: 'g', step: 1,
    text: (a) => `${fmtInt(a)} g de fibres de plus` },
  { key: 'sugar_g', label: 'Sucres', theme: 'nutrition', actionable: true, unit: 'g', step: 5,
    text: (a) => `${fmtInt(a)} g de sucres de plus` },
  { key: 'fat_g', label: 'Lipides', theme: 'nutrition', actionable: true, unit: 'g', step: 5,
    text: (a) => `${fmtInt(a)} g de lipides de plus` },
  { key: 'alcohol_g', label: 'Alcool', theme: 'nutrition', actionable: true, unit: 'g', step: 5,
    text: (a) => `${fmtInt(a)} g d’alcool de plus` },
  { key: 'restingHR', label: 'FC au repos', theme: 'body', actionable: false, unit: 'bpm', step: 1,
    text: (a) => `${fmtInt(a)} bpm de plus au repos` },
  { key: 'hrv_ms', label: 'VFC', theme: 'body', actionable: false, unit: 'ms', step: 1,
    text: (a) => `${fmtInt(a)} ms de VFC de plus` },
  { key: 'weather_sunshine_h', label: 'Soleil', theme: 'context', actionable: false, unit: 'h', step: 1,
    text: (a) => `${fmtInt(a)} h de soleil de plus` },
  { key: 'weather_temp_max_c', label: 'Température', theme: 'context', actionable: false, unit: '°C', step: 1,
    text: (a) => `${fmtInt(a)} °C de plus` },
  { key: 'weather_pressure_change_hpa', label: 'Pression', theme: 'context', actionable: false, unit: 'hPa', step: 1,
    text: (a) => `${fmtInt(a)} hPa de variation de pression de plus` },
  // ORG-5b : FODMAP par sous-groupe (repas au-dessus du repère par portion, hypothèse de départ, fodmapGroups.js).
  ...FODMAP_SUBGROUPS.map((g) => ({
    key: `fodmap_${g}`, label: FODMAP_LABELS[g], theme: 'nutrition', actionable: true, unit: 'repas', step: 1,
    text: (a) => `${fmtInt(a)} repas riche${a > 1 ? 's' : ''} en ${FODMAP_TEXT[g]} de plus`,
  })),
]

const FACTOR_BY_KEY = Object.fromEntries(FACTORS.map((f) => [f.key, f]))

// ─── Jours ───────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000
const dayNum = (key) => Math.round(Date.parse(`${key}T00:00:00Z`) / DAY_MS)
const keyOf = (num) => new Date(num * DAY_MS).toISOString().slice(0, 10)
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

/** Confort digestif d'un jour, sur 5, d'après le ressenti le plus fort noté ce jour-là (provisoire, TS-1). */
export const GUT_COMFORT = { calm: 5, discomfort: 3, pain: 1 }

/**
 * Séries quotidiennes des deux résultats : Map(jour → valeur sur 5).
 * Bien-être : la note du jour si elle existe, sinon l'estimation du visage (≥ 3 lectures).
 * Digestion : seulement les notes du ventre (règle 5 : jamais le bien-être).
 */
export function outcomeSeries(entries) {
  const wellbeing = new Map()
  const notes = new Map()
  for (const e of entries || []) {
    const s = e?.type === 'wellbeing' ? e.payload?.score : null
    if (!isNum(s) || s < 0 || s > 5 || !e.at) continue
    const dk = localDateKey(e.at)
    const acc = notes.get(dk) ?? { sum: 0, n: 0 }
    acc.sum += s
    acc.n += 1
    notes.set(dk, acc)
  }
  for (const d of faceMoodDays(entries || [])) wellbeing.set(d.date, d.note)
  for (const [dk, { sum, n }] of notes) wellbeing.set(dk, sum / n)

  const digestion = new Map()
  const rank = (lvl) => (lvl === 'pain' ? 2 : lvl === 'discomfort' ? 1 : 0)
  const worst = new Map()
  for (const e of entries || []) {
    const lvl = e?.type === GUT_TYPE ? e.payload?.level : null
    if (!(lvl in GUT_COMFORT) || !e.at) continue
    const dk = localDateKey(e.at)
    if (!worst.has(dk) || rank(lvl) > rank(worst.get(dk))) worst.set(dk, lvl)
  }
  let symptomDays = 0
  for (const [dk, lvl] of worst) {
    digestion.set(dk, GUT_COMFORT[lvl])
    if (lvl !== 'calm') symptomDays += 1
  }
  return { wellbeing, digestion, symptomDays }
}

/** Valeurs quotidiennes des facteurs : Map(jour → { clé: valeur|null }). Les jours notés avant 20 h s'arrêtent à la note. */
function factorDays(entries) {
  const rows = buildDailyDataset(entries || [], { includeDaysWithoutWellbeing: true, beforeRating: true })
  const out = new Map()
  for (const r of rows) {
    const vals = {}
    for (const f of FACTORS) {
      let v = r[f.key]
      // Mesures inconnues : null (jamais 0 pour du sommeil ou des pas absents).
      if (['sleepMinutes', 'steps', 'restingHR', 'hrv_ms'].includes(f.key) && !(v > 0)) v = null
      vals[f.key] = isNum(v) ? v : null
    }
    vals._meals = r.mealCount > 0
    for (const g of FODMAP_SUBGROUPS) vals[`fodmap_${g}`] = 0
    vals._disrupted = false
    out.set(r.dateKey, vals)
  }
  // FODMAP : nombre de repas du jour au-dessus du repère, par sous-groupe.
  // Contrôle « journée à part » (ORG-5) : malade ou en voyage (déclaré, ou fuseau horaire changé).
  for (const e of entries || []) {
    if (!e?.at) continue
    const vals = out.get(localDateKey(e.at))
    if (!vals) continue
    if (e.type === 'food') {
      for (const f of mealFactors(e)) {
        const g = fodmapGroupOf(f)
        if (g) vals[`fodmap_${g}`] += 1
      }
    }
    const tags = Array.isArray(e.payload?.tags) ? e.payload.tags : []
    if (tags.includes('sick') || tags.includes('travel')) vals._disrupted = true
  }
  for (const [dk, on] of measuredTagsByDay(entries || []).get('travel') ?? []) if (on && out.has(dk)) out.get(dk)._disrupted = true
  // Nutrition : un jour sans repas noté est inconnu, pas un jour à jeun.
  for (const vals of out.values()) {
    if (vals._meals) continue
    for (const f of FACTORS) if (f.theme === 'nutrition') vals[f.key] = null
  }
  return out
}

/**
 * Retire de `values` la part expliquée par les colonnes de `design` (aucun intercept ajouté : il est dans le design,
 * pondéré). Gram-Schmidt ; colonnes constantes ou redondantes ignorées ; `used` = colonnes retenues au-delà de la
 * première (l'intercept), comme `residualize`.
 */
function residualizeNoIntercept(values, design) {
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
  const basis = []
  for (const col of design) {
    let u = col.slice()
    const norm0 = dot(u, u)
    for (const b of basis) {
      const c = dot(u, b) / dot(b, b)
      u = u.map((x, i) => x - c * b[i])
    }
    if (!(dot(u, u) > 1e-10 * Math.max(norm0, 1e-300)) || norm0 === 0) continue
    basis.push(u)
  }
  let residuals = values.slice()
  for (const b of basis) {
    const c = dot(residuals, b) / dot(b, b)
    residuals = residuals.map((x, i) => x - c * b[i])
  }
  return { residuals, used: Math.max(0, basis.length - 1) }
}

/** Valeur d'un facteur sur la fenêtre d'un horizon avant le jour `num` ; null si moins de la moitié des jours connus. */
function windowValue(days, key, num, horizon) {
  let sum = 0
  let n = 0
  const len = horizon.to - horizon.from + 1
  for (let k = horizon.from; k <= horizon.to; k += 1) {
    const v = days.get(keyOf(num - k))?.[key]
    if (isNum(v)) { sum += v; n += 1 }
  }
  return n > 0 && n * 2 >= len ? sum / n : null
}

const niceAmount = (sd, step) => Math.max(step, Math.round(sd / step) * step)

// ─── Calcul ──────────────────────────────────────────────────────────────────

function logGamma(x) {
  const c = [76.180091729, -86.505320329, 24.014098241, -1.231739572, 0.001208651, -0.000005395]
  let y = x
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5)
  let ser = 1.00000000019
  for (const k of c) ser += k / ++y
  return -tmp + Math.log((2.5066282746 * ser) / x)
}

/** Fonction bêta incomplète régularisée (fraction continue de Lentz). */
function betaInc(a, b, x) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x))
  const cf = (aa, bb, xx) => {
    let c = 1
    let d = 1 - ((aa + bb) * xx) / (aa + 1)
    if (Math.abs(d) < 1e-30) d = 1e-30
    d = 1 / d
    let h = d
    for (let m = 1; m <= 200; m += 1) {
      const m2 = 2 * m
      let num = (m * (bb - m) * xx) / ((aa + m2 - 1) * (aa + m2))
      d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30
      c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30
      d = 1 / d; h *= d * c
      num = (-(aa + m) * (aa + bb + m) * xx) / ((aa + m2) * (aa + m2 + 1))
      d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30
      c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30
      d = 1 / d
      const del = d * c
      h *= del
      if (Math.abs(del - 1) < 1e-10) break
    }
    return h
  }
  return x < (a + 1) / (a + b + 2) ? (front * cf(a, b, x)) / a : 1 - (front * cf(b, a, 1 - x)) / b
}

function autocorrelations(v, maxLag) {
  const n = v.length
  const m = v.reduce((s, x) => s + x, 0) / n
  const d = v.map((x) => x - m)
  const den = d.reduce((s, x) => s + x * x, 0)
  const out = []
  for (let k = 1; k <= maxLag; k += 1) {
    let num = 0
    for (let i = k; i < n; i += 1) num += d[i] * d[i - k]
    out.push(den > 0 ? num / den : 0)
  }
  return out
}

/**
 * Échantillon effectif d'une pente (Bartlett) : n / (1 + 2 Σ ρx(k) ρe(k)), sommé tant que les deux autocorrélations
 * restent positives (jusqu'à n/4). Entre 3 et n.
 */
export function bartlettN(x, e) {
  const n = x.length
  const maxLag = Math.max(1, Math.floor(n / 4))
  const ax = autocorrelations(x, maxLag)
  const ae = autocorrelations(e, maxLag)
  let sum = 0
  for (let k = 0; k < maxLag; k += 1) {
    if (!(ax[k] > 0 && ae[k] > 0)) break
    sum += ax[k] * ae[k]
  }
  return Math.max(3, Math.min(n, n / (1 + 2 * sum)))
}

/**
 * Prudence calée au banc (ORG-5a, method/bench.test.js) : sur quelques semaines, l'autocorrélation estimée laisse
 * l'erreur de la pente 10 à 20 % trop petite ; sans ce facteur, des faux liens passent la correction de Holm.
 */
export const SE_INFLATION = 1.4

/** p bilatérale d'un t de Student à `df` degrés de liberté. */
export function tTwoSidedP(t, df) {
  return betaInc(df / 2, 0.5, df / (df + t * t))
}

/** Quantile bilatéral à 95 % du t de Student (par dichotomie). */
export function tCritical95(df) {
  let lo = 0
  let hi = 100
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2
    if (tTwoSidedP(mid, df) > 0.05) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * Longueur des blocs pour l'erreur de la pente (moyennes par blocs) : au moins une semaine, et au moins la fenêtre
 * de l'horizon (une moyenne sur 21 jours reste corrélée à elle-même pendant des semaines).
 */
export const blockDays = (horizon) => Math.max(7, horizon.to - horizon.from + 1)

function fitOne(series, days, f, horizon, weights, changeDates = []) {
  const pts = []
  for (const [dk, y] of series) {
    const num = dayNum(dk)
    const x = windowValue(days, f.key, num, horizon)
    if (x !== null) pts.push({ dk, num, x, y, w: weights?.get(dk) ?? 1 })
  }
  if (pts.length < Math.max(8, FACTOR_MIN_COVERAGE * series.size)) return null
  pts.sort((a, b) => a.num - b.num)
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const center = xs.reduce((s, v) => s + v, 0) / xs.length
  // Contrôles (ORG-5) : semaine / week-end, tendance lente, journée à part (malade, voyage) quand il y en a.
  const covs = [pts.map((p) => (isWeekendKey(p.dk) ? 1 : 0)), pts.map((p) => p.num)]
  const disrupted = pts.map((p) => (days.get(p.dk)?._disrupted ? 1 : 0))
  if (disrupted.some(Boolean) && !disrupted.every(Boolean)) covs.push(disrupted)
  for (const c of changeDates) covs.push(pts.map((p) => (p.dk >= c ? 1 : 0)))
  // Moindres carrés pondérés : tout est multiplié par √poids (l'intercept aussi), puis résidualisé sans intercept.
  const sw = pts.map((p) => Math.sqrt(p.w))
  const design = [sw, ...covs.map((c) => c.map((v, i) => v * sw[i]))]
  const rx = residualizeNoIntercept(xs.map((v, i) => v * sw[i]), design)
  const ry = residualizeNoIntercept(ys.map((v, i) => v * sw[i]), design).residuals
  const sxx = rx.residuals.reduce((s, v) => s + v * v, 0)
  if (!(sxx > 1e-9)) return null
  const slope = rx.residuals.reduce((s, v, i) => s + v * ry[i], 0) / sxx
  const n = pts.length
  // Échantillon effectif (Bartlett) d'après l'autocorrélation du facteur et du résultat (sans la part du facteur
  // qui agit), sommée tant que les deux restent positives : au-delà, les autocorrélations estimées sur quelques
  // semaines ne sont que du bruit et les additionner rend la fourchette faussement étroite.
  const errors = ry.map((v, i) => v - slope * rx.residuals[i])
  const nEff = bartlettN(rx.residuals, errors)
  const df = Math.max(1, Math.round(nEff) - 2 - rx.used)
  const rss = errors.reduce((s, v) => s + v * v, 0)
  const se = SE_INFLATION * Math.sqrt(rss / Math.max(1, n - 2 - rx.used) / (sxx * (nEff / n)))
  const tc = tCritical95(df)
  const sd = Math.sqrt(residualize(xs, covs).residuals.reduce((s, v) => s + v * v, 0) / n)
  const amount = niceAmount(sd, f.step)
  const p = se > 0 ? tTwoSidedP(Math.abs(slope / se), df) : 1
  const r = (v) => Math.round(v * 100) / 100 + 0 // + 0 : jamais -0 (le cache JSON le perdrait)
  return {
    key: f.key,
    label: f.label,
    theme: f.theme,
    actionable: f.actionable,
    horizon: horizon.id,
    effect: r(slope * amount),
    low: r((slope - tc * se) * amount),
    high: r((slope + tc * se) * amount),
    net: false,
    usualChange: { amount, unit: f.unit, text: f.text(amount) },
    perUnit: slope,
    center,
    days: n,
    _p: p,
  }
}

/**
 * POLISH-SIM-16 : une même variation pour toutes les lignes d'un facteur (« 2 000 pas de plus » partout, pas 2 000,
 * 1 000 puis 500). On garde celle du court terme (la variation d'un jour à l'autre, celle des essais d'Agir), sinon
 * la plus grande ; effet et fourchette suivent (la pente, la p et la netteté ne changent pas).
 */
export function sameUnitPerFactor(fitted) {
  const byKey = new Map()
  for (const f of fitted) byKey.set(f.key, [...(byKey.get(f.key) ?? []), f])
  for (const list of byKey.values()) {
    const short = list.find((f) => f.horizon === 'short')
    const amount = short ? short.usualChange.amount : Math.max(...list.map((f) => f.usualChange.amount))
    for (const f of list) {
      const k = amount / f.usualChange.amount
      if (k === 1) continue
      const r = (v) => Math.round(v * k * 100) / 100 + 0
      f.effect = r(f.effect)
      f.low = r(f.low)
      f.high = r(f.high)
      const def = FACTOR_BY_KEY[f.key]
      f.usualChange = { amount, unit: f.usualChange.unit, text: def ? def.text(amount) : f.usualChange.text }
    }
  }
  return fitted
}

/** Écart le plus grand possible sur une note de 1 à 5 : un effet au-delà n'est pas un résultat. */
export const SCALE_SPAN = 4

/**
 * POLISH-SIM-16 : un effet plus grand que l'échelle elle-même (« −4,7 pt » sur une note sur 5) vient de trop peu de
 * jours qui diffèrent : « pas assez de données », jamais net, et il ne compte pas dans « Ce qui a pu peser ».
 */
export function boundToScale(f) {
  if (Math.abs(f.effect) <= SCALE_SPAN) return f
  f.outOfScale = true
  f.net = false
  return f
}

/** Modèle régularisé d'un résultat (ORG-5c) sur les facteurs × horizons triés. */
function fitModel(ys, days, fitted, weights, changeDates = []) {
  const nums = [...ys.keys()].map(dayNum)
  const first = Math.min(...nums)
  const keys = [...ys.keys()]
  const disrupted = keys.map((dk) => (days.get(dk)?._disrupted ? 1 : 0))
  const withDisrupted = disrupted.some(Boolean) && !disrupted.every(Boolean)
  const rows = keys.map((dk, i) => ({
    dk,
    num: dayNum(dk),
    y: ys.get(dk),
    w: weights?.get(dk) ?? 1,
    controls: [
      isWeekendKey(dk) ? 1 : 0, (dayNum(dk) - first) / 100, ...(withDisrupted ? [disrupted[i]] : []),
      ...changeDates.map((c) => (dk >= c ? 1 : 0)),
    ],
  }))
  const byId = new Map(HORIZONS.map((h) => [h.id, h]))
  const valueOf = (id, dk) => {
    const [key, h] = id.split('|')
    return windowValue(days, key, dayNum(dk), byId.get(h))
  }
  return fitOutcomeModel({ rows, candidates: fitted.map((f) => ({ id: `${f.key}|${f.horizon}`, p: f._p })), valueOf })
}

/**
 * Résultats d'Analyses, forme stable (voir les typedefs plus haut).
 * @param {object[]} entries  toutes les entrées (listEntriesForAnalysis)
 * @param {{ now?: Date }} [options]
 * @returns {AnalysisResults}
 */
export function computeAnalysisResults(entries, { now = new Date() } = {}) {
  const today = localDateKey(now.toISOString())
  return analyzeMatrix(buildAnalysisMatrix(entries, { today }), { today })
}

/**
 * La matrice quotidienne qu'analyse la méthode : séries des résultats et valeurs des facteurs par jour. Le banc de
 * simulation (method/simulate.js) fabrique directement des matrices de même forme.
 * @returns {{ series: { wellbeing: Map<string, number>, digestion: Map<string, number>, symptomDays: number },
 *   days: Map<string, Record<string, number|null>> }}
 */
export function buildAnalysisMatrix(entries, { today } = {}) {
  const raw = outcomeSeries(entries)
  const days = factorDays(entries)
  // ORG-5b : le résultat de chaque jour est l'estimation de TS-1 (notes et visage pour le bien-être ; notes du ventre
  // et selles, sans rien du bien-être, pour la digestion : règle 5), pesée par sa précision (jours notés plus pesants).
  const obs = observationsFromEntries(entries)
  const states = estimateStates(obs, { today, ahead: 0 })
  if (!states) return { series: raw, days }
  const wellbeing = new Map()
  const digestion = new Map()
  const wW = new Map()
  const wD = new Map()
  for (const d of states.days) {
    if (d.future) continue
    if (obs.wellbeing.has(d.date)) {
      wellbeing.set(d.date, d.wellbeing.mean)
      wW.set(d.date, 1 / Math.max(1e-6, d.wellbeing.sd) ** 2)
    }
    const o = obs.digestion.get(d.date)
    if (isNum(o?.gut) || isNum(o?.stool)) {
      digestion.set(d.date, d.digestionOwn.mean)
      wD.set(d.date, 1 / Math.max(1e-6, d.digestionOwn.sd) ** 2)
    }
  }
  return {
    series: { wellbeing, digestion, symptomDays: raw.symptomDays, weights: { wellbeing: normWeights(wW), digestion: normWeights(wD) } },
    days,
  }
}

/** Poids ramenés à une moyenne de 1, bornés à [1/4, 4] (aucun jour ne compte pour plus de 16 autres). */
export const WEIGHT_RANGE = [0.25, 4]
function normWeights(map) {
  if (!map.size) return map
  const m = [...map.values()].reduce((s, v) => s + v, 0) / map.size
  return new Map([...map].map(([k, v]) => [k, Math.min(WEIGHT_RANGE[1], Math.max(WEIGHT_RANGE[0], v / m))]))
}

/**
 * Analyse d'une matrice quotidienne (voir buildAnalysisMatrix) jusqu'au jour `today` inclus.
 * @returns {AnalysisResults}
 */
export function analyzeMatrix({ series, days }, { today, factors = FACTORS } = {}) {
  const outcomes = {}
  for (const def of OUTCOMES) {
    const ys = new Map([...series[def.id]].filter(([dk]) => !today || dk <= today))
    const daysHave = ys.size
    const symptomOk = def.id !== 'digestion' || series.symptomDays >= DIGESTION_MIN_SYMPTOM_DAYS
    const horizons = {}
    const fitted = []
    // TS-2 : un lien doit tenir à l'intérieur des périodes : chaque changement durable du résultat devient un contrôle
    // (niveau propre à chaque période), comme la semaine et la tendance.
    const changeDates = daysHave >= 2 * UNLOCK_DAYS[def.id].short ? detectChanges(ys).map((c) => c.date) : []
    for (const h of HORIZONS) {
      const daysNeeded = UNLOCK_DAYS[def.id][h.id]
      const ready = symptomOk && daysHave >= daysNeeded
      horizons[h.id] = { id: h.id, label: h.label, window: h.window, status: ready ? 'ready' : 'locked', daysHave, daysNeeded, factors: [] }
      if (!ready) continue
      for (const f of factors) {
        const fit = fitOne(ys, days, f, h, series.weights?.[def.id], changeDates)
        if (fit) { fit.outcome = def.id; fitted.push(fit) }
      }
    }
    sameUnitPerFactor(fitted)
    const qs = holm(fitted.map((f) => f._p))
    // ORG-5c : les candidats entrent ensemble dans un modèle régularisé ; « net » exige aussi la stabilité.
    const model = fitted.length ? fitModel(ys, days, fitted, series.weights?.[def.id], changeDates) : null
    fitted.forEach((f, i) => {
      const passed = qs[i] <= NET_MAX_P && (f.low > 0 || f.high < 0)
      const c = model?.coef.get(`${f.key}|${f.horizon}`)
      f.inModel = Boolean(c)
      f.stability = c ? Math.round(c.stability * 100) / 100 : null
      if (c) {
        const a = f.usualChange.amount
        const r2 = (v) => Math.round(v * 100) / 100 + 0
        f.perUnit = c.perUnit
        f.center = c.mean
        f.effect = r2(c.perUnit * a)
        f.low = r2(Math.min(c.low, c.high) * a)
        f.high = r2(Math.max(c.low, c.high) * a)
      }
      f.net = passed && Boolean(c) && c.stability >= STABILITY_MIN && Math.sign(f.effect) !== 0
      boundToScale(f)
      delete f._p
      horizons[f.horizon].factors.push(f)
    })
    for (const h of Object.values(horizons)) {
      h.factors.sort((a, b) => Number(Boolean(a.outOfScale)) - Number(Boolean(b.outOfScale)) || Math.abs(b.effect) - Math.abs(a.effect))
    }
    const readyCount = Object.values(horizons).filter((h) => h.status === 'ready').length
    const first = UNLOCK_DAYS[def.id].short
    outcomes[def.id] = {
      id: def.id,
      label: def.label,
      theme: def.theme,
      status: readyCount === 3 ? 'ready' : readyCount > 0 ? 'partial' : 'locked',
      daysHave,
      daysToFirst: Math.max(0, first - daysHave),
      ...(def.id === 'digestion' ? { symptomDays: series.symptomDays, symptomDaysNeeded: DIGESTION_MIN_SYMPTOM_DAYS } : {}),
      beatsPersistence: model ? model.beatsPersistence : null,
      changes: changeDates,
      horizons,
    }
  }
  // ORG-5d : la méthode d'ORG-5 (TS-1, matrice, modèle régularisé et stabilité) est derrière le contrat.
  return { contractVersion: CONTRACT_VERSION, method: 'org5', computedFor: today ?? null, outcomes }
}

/**
 * Les plus grandes contributions d'un jour (« Ce qui a pu peser ce jour-là ») sur le modèle régularisé (ORG-5c) :
 * pour chaque terme du modèle (facteur × horizon), coefficient × (valeur du facteur sur la fenêtre ce jour-là −
 * valeur habituelle) ; les horizons d'un même facteur sont additionnés (une barre par facteur). Seuls les termes du
 * modèle comptent : un facteur n'est jamais compté deux fois à travers ses voisins. Triées par |points|.
 * @param {AnalysisResults} results
 * @param {object[]} entries
 * @param {string} dateKey   AAAA-MM-JJ
 * @param {{ outcome?: OutcomeId, max?: number, days?: Map }} [options]
 * @returns {DayContribution[]}  `horizon` = l'horizon qui pèse le plus pour ce facteur ce jour-là
 */
export function dayContributions(results, entries, dateKey, { outcome = 'wellbeing', max = 3, days: givenDays } = {}) {
  const out = results?.outcomes?.[outcome]
  if (!out) return []
  const terms = Object.values(out.horizons).flatMap((h) => h.factors.filter((f) => f.inModel && !f.outOfScale))
  if (!terms.length) return []
  const days = givenDays ?? factorDays(entries)
  const num = dayNum(dateKey)
  const byKey = new Map()
  for (const f of terms) {
    const horizon = HORIZONS.find((h) => h.id === f.horizon)
    const value = windowValue(days, f.key, num, horizon)
    if (value === null) continue
    const pts = f.perUnit * (value - f.center)
    const cur = byKey.get(f.key)
    if (!cur) byKey.set(f.key, { f, total: pts, top: { pts, horizon: f.horizon, value, usual: f.center } })
    else {
      cur.total += pts
      if (Math.abs(pts) > Math.abs(cur.top.pts)) cur.top = { pts, horizon: f.horizon, value, usual: f.center }
    }
  }
  const list = []
  for (const { f, total, top } of byKey.values()) {
    const points = Math.round(total * 100) / 100 + 0
    if (points === 0) continue
    list.push({ key: f.key, label: f.label, theme: f.theme, horizon: top.horizon, points, value: top.value, usual: top.usual })
  }
  return list.sort((a, b) => Math.abs(b.points) - Math.abs(a.points)).slice(0, max)
}

/**
 * Contributions de chaque jour connu d'un résultat (pour Tendances : toucher un jour), calculées une fois.
 * @returns {Record<OutcomeId, Record<string, DayContribution[]>>}
 */
export function contributionsByDay(results, entries, { max = 3 } = {}) {
  const days = factorDays(entries)
  const series = outcomeSeries(entries)
  const out = {}
  for (const def of OUTCOMES) {
    const map = {}
    const keys = new Set([...series[def.id].keys(), ...(def.id === 'wellbeing' ? days.keys() : [])])
    for (const dk of [...keys].sort()) {
      if (results?.computedFor && dk > results.computedFor) continue
      const list = dayContributions(results, entries, dk, { outcome: def.id, max, days })
      if (list.length) map[dk] = list
    }
    out[def.id] = map
  }
  return out
}

/** Métadonnées d'un facteur (libellé, thème, possibilité d'agir), ou null. */
export const factorMeta = (key) => FACTOR_BY_KEY[key] ?? null

/** Garde-fou : chaque facteur existe dans le jeu quotidien du moteur. */
export const factorKeysKnown = () => FACTORS.every((f) => f.key in VARIABLE_META || f.key.startsWith('fodmap_'))
