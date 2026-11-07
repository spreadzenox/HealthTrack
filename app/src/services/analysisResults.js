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
 * Pour chaque facteur : effet en points (sur 5) pour une variation habituelle du facteur (« pour 50 min de sommeil de
 * plus »), sa fourchette à 95 %, s'il est « net », son thème (couleur) et si l'on peut agir dessus.
 * `dayContributions` rend, pour un jour donné, les 3 plus grandes contributions (coefficient × écart du facteur ce
 * jour-là à sa valeur habituelle), pour « Ce qui a pu peser ce jour-là » de Tendances.
 *
 * Méthode actuelle (`method: 'provisional'`) : pente simple par facteur et par horizon, contrôlée pour le jour de la
 * semaine (semaine / week-end) et la tendance, taille d'échantillon effective (autocorrélation), Benjamini-Hochberg sur
 * facteurs × horizons d'un même résultat ; « net » = q ≤ 0,1 et fourchette qui ne touche pas zéro. ORG-5c la remplace
 * par un modèle régularisé avec stabilité par rééchantillonnage ; la forme ne bouge pas.
 *
 * Règles de data science (5 et 6) : le bien-être n'est jamais un facteur, ni la digestion ; les analyses digestives
 * n'apprennent que de l'information digestive (notes du ventre), jamais du bien-être ; aucun facteur n'est une entrée
 * de l'estimateur du bien-être (`isEstimatorInput`) ; aucun sens « bon » ou « mauvais » n'est supposé.
 */
import { buildDailyDataset, localDateKey, VARIABLE_META } from './analysisEngine'
import { benjaminiHochberg, effectiveSampleSize, isWeekendKey, normalCdf, residualize } from './statistics'
import { faceMoodDays } from './mood/faceMoodDays'
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
 * @property {number} center         valeur habituelle du facteur sur cet horizon (moyenne des jours utilisés)
 * @property {number} days           jours utilisés
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
  wellbeing: { short: 14, medium: 21, long: 42 },
  digestion: { short: 28, medium: 35, long: 56 },
}
/** Digestion : au moins 5 jours de gêne ou de douleur (sans eux, rien à expliquer). */
export const DIGESTION_MIN_SYMPTOM_DAYS = 5

/** Un lien est « net » sous ce q (Benjamini-Hochberg sur facteurs × horizons d'un résultat). */
export const NET_MAX_Q = 0.1
/** Un facteur n'entre que s'il est connu au moins ces jours-là (part des jours du résultat). */
export const FACTOR_MIN_COVERAGE = 0.5

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
    out.set(r.dateKey, vals)
  }
  // Nutrition : un jour sans repas noté est inconnu, pas un jour à jeun.
  for (const vals of out.values()) {
    if (vals._meals) continue
    for (const f of FACTORS) if (f.theme === 'nutrition') vals[f.key] = null
  }
  return out
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

function fitOne(series, days, f, horizon) {
  const pts = []
  for (const [dk, y] of series) {
    const num = dayNum(dk)
    const x = windowValue(days, f.key, num, horizon)
    if (x !== null) pts.push({ dk, num, x, y })
  }
  if (pts.length < Math.max(8, FACTOR_MIN_COVERAGE * series.size)) return null
  pts.sort((a, b) => a.num - b.num)
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const center = xs.reduce((s, v) => s + v, 0) / xs.length
  // Contrôles : semaine / week-end et tendance lente (ORG-5).
  const covs = [pts.map((p) => (isWeekendKey(p.dk) ? 1 : 0)), pts.map((p) => p.num)]
  const rx = residualize(xs, covs)
  const ry = residualize(ys, covs).residuals
  const sxx = rx.residuals.reduce((s, v) => s + v * v, 0)
  if (!(sxx > 1e-9)) return null
  const slope = rx.residuals.reduce((s, v, i) => s + v * ry[i], 0) / sxx
  const n = pts.length
  const nEff = Math.max(3, Math.min(n, effectiveSampleSize(rx.residuals, ry)))
  const df = Math.max(1, nEff - 2 - rx.used)
  const rss = ry.reduce((s, v, i) => s + (v - slope * rx.residuals[i]) ** 2, 0)
  // Variance de la pente sur l'échantillon effectif (sxx ramené à nEff jours).
  const se = Math.sqrt(rss / df / (sxx * (nEff / n)))
  const sd = Math.sqrt(sxx / n)
  const amount = niceAmount(sd, f.step)
  const z = se > 0 ? Math.abs(slope / se) : 0
  const p = 2 * (1 - normalCdf(z))
  const r = (v) => Math.round(v * 100) / 100
  return {
    key: f.key,
    label: f.label,
    theme: f.theme,
    actionable: f.actionable,
    horizon: horizon.id,
    effect: r(slope * amount),
    low: r((slope - 1.96 * se) * amount),
    high: r((slope + 1.96 * se) * amount),
    net: false,
    usualChange: { amount, unit: f.unit, text: f.text(amount) },
    perUnit: slope,
    center,
    days: n,
    _p: p,
  }
}

/**
 * Résultats d'Analyses, forme stable (voir les typedefs plus haut).
 * @param {object[]} entries  toutes les entrées (listEntriesForAnalysis)
 * @param {{ now?: Date }} [options]
 * @returns {AnalysisResults}
 */
export function computeAnalysisResults(entries, { now = new Date() } = {}) {
  const today = localDateKey(now.toISOString())
  const series = outcomeSeries(entries)
  const days = factorDays(entries)
  const outcomes = {}
  for (const def of OUTCOMES) {
    const ys = new Map([...series[def.id]].filter(([dk]) => dk <= today))
    const daysHave = ys.size
    const symptomOk = def.id !== 'digestion' || series.symptomDays >= DIGESTION_MIN_SYMPTOM_DAYS
    const horizons = {}
    const fitted = []
    for (const h of HORIZONS) {
      const daysNeeded = UNLOCK_DAYS[def.id][h.id]
      const ready = symptomOk && daysHave >= daysNeeded
      horizons[h.id] = { id: h.id, label: h.label, window: h.window, status: ready ? 'ready' : 'locked', daysHave, daysNeeded, factors: [] }
      if (!ready) continue
      for (const f of FACTORS) {
        const fit = fitOne(ys, days, f, h)
        if (fit) { fit.outcome = def.id; fitted.push(fit) }
      }
    }
    const qs = benjaminiHochberg(fitted.map((f) => f._p))
    fitted.forEach((f, i) => {
      f.net = qs[i] <= NET_MAX_Q && (f.low > 0 || f.high < 0)
      delete f._p
      horizons[f.horizon].factors.push(f)
    })
    for (const h of Object.values(horizons)) h.factors.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
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
      beatsPersistence: null,
      horizons,
    }
  }
  return { contractVersion: CONTRACT_VERSION, method: 'provisional', computedFor: today, outcomes }
}

/**
 * Les plus grandes contributions d'un jour (« Ce qui a pu peser ce jour-là ») : pour chaque facteur, son horizon le
 * plus net (sinon le plus fort), contribution = perUnit × (valeur du jour − valeur habituelle). Triées par |points|.
 * @param {AnalysisResults} results
 * @param {object[]} entries
 * @param {string} dateKey   AAAA-MM-JJ
 * @param {{ outcome?: OutcomeId, max?: number }} [options]
 * @returns {DayContribution[]}
 */
export function dayContributions(results, entries, dateKey, { outcome = 'wellbeing', max = 3 } = {}) {
  const out = results?.outcomes?.[outcome]
  if (!out) return []
  const best = new Map()
  for (const h of Object.values(out.horizons)) {
    for (const f of h.factors) {
      const cur = best.get(f.key)
      const score = (f.net ? 1000 : 0) + Math.abs(f.effect)
      if (!cur || score > cur.score) best.set(f.key, { f, score })
    }
  }
  if (!best.size) return []
  const days = factorDays(entries)
  const num = dayNum(dateKey)
  const list = []
  for (const { f } of best.values()) {
    const horizon = HORIZONS.find((h) => h.id === f.horizon)
    const value = windowValue(days, f.key, num, horizon)
    if (value === null) continue
    const points = Math.round(f.perUnit * (value - f.center) * 100) / 100
    if (points === 0) continue
    list.push({ key: f.key, label: f.label, theme: f.theme, horizon: f.horizon, points, value, usual: f.center })
  }
  return list.sort((a, b) => Math.abs(b.points) - Math.abs(a.points)).slice(0, max)
}

/** Métadonnées d'un facteur (libellé, thème, possibilité d'agir), ou null. */
export const factorMeta = (key) => FACTOR_BY_KEY[key] ?? null

/** Garde-fou : chaque facteur existe dans le jeu quotidien du moteur. */
export const FACTOR_KEYS_KNOWN = FACTORS.every((f) => f.key in VARIABLE_META)
