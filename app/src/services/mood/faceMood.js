/**
 * Humeur estimée à partir du visage, **dès la première lecture** (consigne du propriétaire du 19/10/2026 au soir :
 * « une lecture du bien-être 100 % auto », sans attendre 30 jours de calibration). Fonction pure, rien de stocké.
 *
 * Trois couches, de la plus générale à la plus personnelle :
 * 1. **Modèle général.** Depuis l'étape 2, quand la lecture porte une valence et un éveil du **modèle embarqué**
 *    (HSEmotion `enet_b0_8_va_mtl`, FaceAffect.java ; CCC publiée sur AffectNet : valence 0,59, éveil 0,55), c'est
 *    cette valence qui sert. Sinon (modèle pas encore téléchargé, anciennes lectures), l'**a priori** : une valence dans
 *    [−1, 1] tirée des indices d'expression par des poids fixés d'après la correspondance blendshapes → unités
 *    d'action (journal/protocoles/visage.md §5) et la littérature FACS : AU12 (sourire) et AU6 + AU12 (sourire des
 *    yeux) vont avec une valence positive, AU15 (coins de la bouche abaissés), AU4 (froncement) et AU1 (sourcils
 *    intérieurs levés) avec une valence négative en moyenne. C'est une hypothèse de population (D6 : « a priori
 *    faible »), affichée avec une large fourchette, jamais un diagnostic. Note = 2,5 + 2,5 × valence (échelle 0–5 des
 *    notes de bien-être).
 * 2. **Ligne de base individuelle** : le « visage neutre » de la personne (médianes des 28 derniers jours) remplace
 *    peu à peu le neutre de population (poids j / (j + 7), j = jours avec des lectures). Sans aucune note. Pour la
 *    valence du modèle, déjà apprise sur des milliers de visages, on ne retire que la **moitié** de la valence
 *    habituelle (hypothèse : la moitié d'un « air » constant tient au visage, l'autre à l'humeur qui dure).
 * 3. **Calibration facultative** sur les notes (mood/calibration.js, ≥ 14 jours notés avec des lectures, gardée
 *    seulement une fois la vérification visage ↔ notes réussie (gate.js) et si elle prédit les notes mises de côté —
 *    chaque jour sans la semaine qui l'entoure, I121 — ≥ 10 % mieux que leur moyenne) : la note du jour vient alors du
 *    modèle personnel, et sa fourchette de son erreur en validation croisée. Les notes affinent, elles ne
 *    conditionnent jamais l'affichage.
 *
 * Entrées : uniquement des signaux émotionnels directs (rafales `face_burst` du déverrouillage, notes `wellbeing`),
 * c'est-à-dire des entrées Y déclarées dans estimatorInputs.js (D5) ; aucun comportement ni contexte.
 */
import { localDateKey } from '../analysisEngine'
import { FACE_BURST_TYPE, moodFaceBursts } from '../faceBursts'
import { evaluateGate, gateDays } from './gate'
import { calibrateRidge, predictCalibrated } from './calibration'

/** Indices d'expression lus par l'estimateur (yaw / asymmetry / jawOpen servent à la qualité, pas à l'humeur). */
export const EXPRESSION_KEYS = ['smile', 'duchenne', 'mouthFrown', 'browDown', 'browInnerUp']

/** A priori général : visage neutre de population et poids de chaque indice sur la valence. */
export const FACE_PRIOR = {
  neutral: { smile: 0.1, duchenne: 0.05, mouthFrown: 0.05, browDown: 0.15, browInnerUp: 0.1 },
  weights: { smile: 1.8, duchenne: 1.2, mouthFrown: -2, browDown: -0.8, browInnerUp: -0.6 },
}

export const BASELINE_DAYS = 28
const BASELINE_HALF = 7
/** Erreur type (échelle 0–5) de l'a priori seul, puis avec une ligne de base complète. */
const PRIOR_SD = 1.3
const BASELINE_SD = 1
/** Dispersion d'une lecture isolée autour de l'humeur du moment (échelle 0–5), faute de mieux. */
const READING_SD = 0.9
/** Erreur type du modèle valence / éveil seul, puis avec une ligne de base complète (hypothèse prudente : la CCC
 * publiée, 0,59, est mesurée entre des photos de personnes différentes, pas au fil des jours d'une même personne). */
const VA_SD = 1.1
const VA_BASELINE_SD = 0.9
/** Part de la valence habituelle retirée d'une lecture du modèle (voir couche 2). */
const VA_BASELINE_SHARE = 0.5
const AROUSAL_BAND = 0.2
const MAX_YAW_GOOD = 15
const DAY_MS = 86400000

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const clampNote = (v) => Math.min(5, Math.max(0, v))
const round1 = (v) => Math.round(v * 10) / 10

function median(values) {
  const s = values.filter(isNum).sort((a, b) => a - b)
  if (!s.length) return null
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Valence a priori dans [−1, 1] d'un jeu d'indices, autour d'un visage neutre donné. */
export function priorValence(values, neutral = FACE_PRIOR.neutral) {
  let t = 0
  for (const k of EXPRESSION_KEYS) {
    if (isNum(values?.[k])) t += FACE_PRIOR.weights[k] * (values[k] - neutral[k])
  }
  return Math.tanh(t)
}

export const valenceToNote = (valence) => 2.5 + 2.5 * valence

/** « plutôt basse » / « moyenne » / « plutôt bonne », sur l'échelle 0–5. */
export function moodLabel(note) {
  if (note < 2) return 'plutôt basse'
  if (note > 3) return 'plutôt bonne'
  return 'moyenne'
}

/** « plutôt calme » / « modéré » / « plutôt animé », d'après l'éveil du modèle dans [−1, 1] ; null sans valeur. */
export function arousalLabel(arousal) {
  if (!isNum(arousal)) return null
  if (arousal < -AROUSAL_BAND) return 'plutôt calme'
  if (arousal > AROUSAL_BAND) return 'plutôt animé'
  return 'modéré'
}

export function confidenceLevel(halfWidth) {
  if (halfWidth <= 0.75) return 'bonne'
  if (halfWidth <= 1.15) return 'moyenne'
  return 'faible'
}

/**
 * Visage neutre personnel : médianes des indices des lectures des 28 jours avant `at`, mêlées au neutre de
 * population selon le nombre de jours lus. Rend { neutral, days, weight }.
 */
export function personalNeutral(bursts, at) {
  const t = Date.parse(at)
  const recent = bursts.filter((b) => {
    const bt = Date.parse(b.at)
    return bt <= t && bt > t - BASELINE_DAYS * DAY_MS
  })
  const days = new Set(recent.map((b) => localDateKey(b.at))).size
  const weight = days / (days + BASELINE_HALF)
  const neutral = {}
  for (const k of EXPRESSION_KEYS) {
    const m = median(recent.map((b) => b.payload.values[k]))
    neutral[k] = m == null ? FACE_PRIOR.neutral[k] : (1 - weight) * FACE_PRIOR.neutral[k] + weight * m
  }
  // Valence habituelle du modèle (neutre de population : 0), sur les seules lectures qui en ont une.
  const withVa = recent.filter((b) => isNum(b.payload.values.valence))
  const vaDays = new Set(withVa.map((b) => localDateKey(b.at))).size
  const vaWeight = vaDays / (vaDays + BASELINE_HALF)
  neutral.valence = vaDays ? vaWeight * median(withVa.map((b) => b.payload.values.valence)) : 0
  return { neutral, days, weight, vaDays, vaWeight }
}

const hasModelValence = (values) => isNum(values?.valence)

/** Valence générale d'une lecture : celle du modèle embarqué (à moitié ajustée au visage habituel), sinon l'a priori. */
function generalValence(values, neutral) {
  if (hasModelValence(values)) return Math.max(-1, Math.min(1, values.valence - VA_BASELINE_SHARE * neutral.valence))
  return priorValence(values, neutral)
}

/** Erreur type du modèle utilisé pour une lecture. */
function modelSdFor(values, base, calibration) {
  if (calibration?.model) return calibration.model.rmse
  if (hasModelValence(values)) return VA_SD - (VA_SD - VA_BASELINE_SD) * base.vaWeight
  return PRIOR_SD - (PRIOR_SD - BASELINE_SD) * base.weight
}

/** Ligne de la calibration personnelle pour un jeu d'indices (mêmes colonnes à l'apprentissage et à l'usage). */
function calibrationRow(values) {
  // 1re colonne : valence du modèle embarqué si la lecture en a une, sinon l'a priori (même échelle [−1, 1]).
  return [hasModelValence(values) ? values.valence : priorValence(values), ...EXPRESSION_KEYS.map((k) => (isNum(values?.[k]) ? values[k] : FACE_PRIOR.neutral[k]))]
}

/**
 * Calibration facultative sur les notes, ou null : seulement quand la vérification visage ↔ notes est réussie
 * (gate.js, robuste aux dérives lentes), puis si la Ridge, validée par blocs de ±7 jours (I121), prédit mieux que la
 * moyenne. Sans cette double condition, une humeur qui dure et un visage qui dérive suffisaient à faire adopter un
 * modèle sans aucun lien (simulé : 60 % des jeux en LOO simple, 25 % avec les blocs seuls, 0–5 % avec la porte).
 */
export function personalCalibration(entries) {
  const days = gateDays(entries)
  // Même porte que la carte : pas de « modèle personnel » tant que la vérification visage ↔ notes n'est pas réussie.
  if (evaluateGate(days).state !== 'active') return { model: null, days: days.length }
  const dayNums = days.map((d) => Math.round(Date.parse(`${d.date}T00:00:00Z`) / DAY_MS))
  const model = calibrateRidge(days.map((d) => calibrationRow(d.face)), days.map((d) => d.note), { dayNums })
  return model ? { model, days: days.length } : { model: null, days: days.length }
}

function burstQuality(b) {
  return b.payload.frames > 0 ? b.payload.valid / b.payload.frames : 0
}

/**
 * Estimation d'une lecture (rafale) : { at, trigger, note, low, high, label, halfWidth }.
 * @param {object} burst  entrée `face_burst` avec des indices
 * @param {{ bursts: object[], calibration?: object|null, base?: object }} ctx  lectures du déverrouillage (ligne
 *   de base) ; `base` = personalNeutral déjà calculé (série du jour, faceMoodDays.js), sinon recalculé ici
 */
export function estimateBurst(burst, { bursts = [], calibration = null, base: given = null } = {}) {
  const values = burst.payload.values
  const base = given ?? personalNeutral(bursts, burst.at)
  const modelSd = modelSdFor(values, base, calibration)
  let note = calibration?.model
    ? predictCalibrated(calibration.model, calibrationRow(values))
    : valenceToNote(generalValence(values, base.neutral))
  note = clampNote(note)
  const yaw = Math.abs(values.yaw ?? 0)
  const penalty = (1 + 0.5 * (1 - burstQuality(burst))) * (yaw > MAX_YAW_GOOD ? 1.15 : 1)
  const halfWidth = Math.sqrt(modelSd ** 2 + READING_SD ** 2) * penalty
  return {
    at: burst.at,
    trigger: burst.payload.trigger,
    note: round1(note),
    low: round1(clampNote(note - halfWidth)),
    high: round1(clampNote(note + halfWidth)),
    label: moodLabel(note),
    arousal: isNum(values.arousal) ? values.arousal : null,
    halfWidth,
  }
}

/**
 * Humeur du moment et bien-être du jour, dès la première lecture du déverrouillage.
 *
 * @param {object[]} entries  entrées `face_burst` et `wellbeing` (les autres sont ignorées)
 * @param {{ now?: Date }} [opts]
 * @returns {null | {
 *   moment: { at, note, low, high, label, arousalLabel: string|null, today: boolean },
 *   day: null | { date, note, low, high, label, readings, quality, framing: number|null, spread: number|null,
 *     arousal: number|null, arousalLabel: string|null },
 *   confidence: 'faible'|'moyenne'|'bonne', model: 'prior'|'va'|'personal', baselineDays: number,
 *   calibrationDays: number, signals: string[] }}
 *   null sans aucune lecture du déverrouillage avec un visage.
 */
export function faceMoodEstimate(entries, { now = new Date() } = {}) {
  const bursts = moodFaceBursts(entries).sort((a, b) => (a.at < b.at ? -1 : 1))
  if (!bursts.length) return null
  const calibration = personalCalibration(entries)
  const ctx = { bursts, calibration }
  const today = localDateKey(now.toISOString())
  const last = bursts[bursts.length - 1]
  const moment = estimateBurst(last, ctx)
  const todays = bursts.filter((b) => localDateKey(b.at) === today)
  let day = null
  let halfWidth = moment.halfWidth
  if (todays.length) {
    const readings = todays.map((b) => estimateBurst(b, ctx))
    const notes = readings.map((r) => r.note)
    const note = median(notes)
    const n = notes.length
    const mean = notes.reduce((s, v) => s + v, 0) / n
    const spread = n > 1 ? Math.sqrt(notes.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1)) : null
    const quality = todays.reduce((s, b) => s + burstQuality(b), 0) / n
    const framing = median(todays.map((b) => Math.abs(b.payload.values.yaw)))
    const modelSd = modelSdFor(last.payload.values, personalNeutral(bursts, last.at), calibration)
    const arousal = median(todays.map((b) => b.payload.values.arousal))
    const noise = spread ?? READING_SD
    const penalty = (1 + 0.5 * (1 - quality)) * (framing != null && framing > MAX_YAW_GOOD ? 1.15 : 1)
    halfWidth = Math.sqrt(modelSd ** 2 + noise ** 2 / n) * penalty
    day = {
      date: today,
      note: round1(note),
      low: round1(clampNote(note - halfWidth)),
      high: round1(clampNote(note + halfWidth)),
      label: moodLabel(note),
      readings: n,
      quality: Math.round(quality * 100) / 100,
      framing: framing == null ? null : Math.round(framing),
      spread: spread == null ? null : round1(spread),
      arousal: arousal == null ? null : Math.round(arousal * 100) / 100,
      arousalLabel: arousalLabel(arousal),
    }
  }
  return {
    moment: {
      at: moment.at, note: moment.note, low: moment.low, high: moment.high, label: moment.label,
      arousalLabel: arousalLabel(moment.arousal), today: localDateKey(last.at) === today,
    },
    day,
    confidence: confidenceLevel(halfWidth),
    model: calibration.model ? 'personal' : hasModelValence(last.payload.values) ? 'va' : 'prior',
    baselineDays: personalNeutral(bursts, last.at).days,
    calibrationDays: calibration.days,
    signals: ['visage'],
  }
}

/** La lecture d'un « Tester maintenant » récent (≤ 2 min), estimée comme une autre, ou null. Diagnostic seulement. */
export function testReadingEstimate(entries, { now = new Date() } = {}) {
  const tests = (entries || []).filter((e) =>
    e?.type === FACE_BURST_TYPE && e.payload?.trigger === 'manual' && e.payload.valid > 0 && e.payload.values &&
    now - Date.parse(e.at) <= 2 * 60000 && now - Date.parse(e.at) >= -60000)
  if (!tests.length) return null
  const last = tests.sort((a, b) => (a.at < b.at ? -1 : 1))[tests.length - 1]
  const bursts = moodFaceBursts(entries)
  return estimateBurst(last, { bursts, calibration: personalCalibration(entries) })
}

const fmt = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const hour = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Phrases pour la carte (et le tableau de bord). Toujours une estimation, jamais un diagnostic. */
export function describeFaceMood(est) {
  if (!est) return null
  const lines = []
  if (est.day) {
    lines.push(`Bien-être estimé aujourd’hui : ${est.day.label}, ≈ ${fmt(est.day.note)} / 5 (entre ${fmt(est.day.low)} et ${fmt(est.day.high)}).`)
  }
  const when = est.moment.today ? `à ${hour(est.moment.at)}` : `le ${new Date(est.moment.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${hour(est.moment.at)}`
  lines.push(`Humeur à la dernière lecture (${when}) : ${est.moment.label}.`)
  if (est.moment.arousalLabel) {
    const dayArousal = est.day?.arousalLabel && est.day.readings > 1 ? ` (aujourd’hui : ${est.day.arousalLabel})` : ''
    lines.push(`Éveil à la dernière lecture : ${est.moment.arousalLabel}${dayArousal}.`)
  }
  const parts = []
  if (est.day) {
    parts.push(`${est.day.readings} ${est.day.readings > 1 ? 'lectures' : 'lecture'} aujourd’hui`)
    if (est.day.framing != null) parts.push(est.day.framing <= MAX_YAW_GOOD ? 'visage bien cadré' : 'visage souvent de biais')
    if (est.day.spread != null) parts.push(est.day.spread <= 0.8 ? 'lectures concordantes' : 'lectures dispersées')
  } else {
    parts.push('aucune lecture aujourd’hui')
  }
  parts.push('un seul signal (visage)')
  lines.push(`Confiance ${est.confidence} : ${parts.join(', ')}.`)
  const habit = est.baselineDays ? `, ajusté à votre visage habituel (${est.baselineDays} ${est.baselineDays > 1 ? 'jours' : 'jour'})` : ''
  lines.push(est.model === 'personal'
    ? `Modèle personnel, appris sur vos ${est.calibrationDays} jours notés. Une estimation, pas un diagnostic.`
    : est.model === 'va'
      ? `Modèle valence / éveil embarqué (HSEmotion), appris sur des centaines de milliers de visages${habit} ; vos notes, facultatives, l’affineront. Une estimation, pas un diagnostic.`
      : `Modèle général des expressions${est.baselineDays ? `, ajusté à votre visage habituel (${est.baselineDays} ${est.baselineDays > 1 ? 'jours' : 'jour'})` : ''} ; vos notes, facultatives, l’affineront. Une estimation, pas un diagnostic.`)
  return lines
}
