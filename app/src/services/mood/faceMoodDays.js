/**
 * L'humeur estimée par le visage devient une **série quotidienne Y**, comparée aux facteurs X des Analyses (sommeil,
 * pas, écran, réseaux sociaux, météo…) sans aucune note à saisir — consignes du propriétaire du 18/10 (« collecte
 * entièrement automatique du bien-être ») et du 19/10 au soir (« 100 % auto »), directives D5 et D6.
 *
 * - Un jour compte s'il a au moins FACE_MOOD_MIN_READINGS lectures du déverrouillage avec un visage (une seule
 *   lecture est trop bruitée pour représenter une journée). Bien-être estimé du jour = médiane des estimations de ses
 *   lectures, pondérée par leur précision (I127 : une lecture de biais ou floue compte moins) (mood/faceMood.js : modèle valence / éveil ou a priori, visage habituel, calibration facultative).
 * - Anti-circularité (D5) : la série n'est faite que d'entrées Y (rafales du visage, notes facultatives via la
 *   calibration) ; les facteurs restent ceux de VARIABLE_META, dont aucun n'est une entrée de l'estimateur
 *   (antiCircularity.test.js).
 * - Ordre temporel : le jour est traité comme une note donnée à sa **dernière lecture** (même règle que les notes,
 *   DAY_OVER_HOUR) : avant 20 h, pas, écran, réseaux… du jour ne comptent que s'ils sont finis avant elle.
 * - Habitudes (tags) et effets décalés : mêmes calculs que sur les notes (behaviorTags.js, laggedEffects.js), avec
 *   l'humeur estimée du jour comme bien-être ; les tags déclarés restent ceux de vos notes, le stress ressenti (côté
 *   Y) n'est jamais comparé. Aucune piste n'est tirée des effets décalés (D6).
 * - Mêmes garde-fous que les corrélations sur les notes (computeBasicCorrelations) : week-end pris en compte,
 *   taille d'échantillon effective, Benjamini-Hochberg sur tous les facteurs testés ; au moins
 *   FACE_MOOD_MIN_DAYS jours (l'estimation d'un jour est moins précise qu'une note). Aucune « piste » proposée :
 *   ce sont des liens à observer, pas des leviers (D6 : aucun sens d'effet présupposé).
 */
import { localDateKey, computeBasicCorrelations } from '../analysisEngine'
import { computeTagEffects } from '../behaviorTags'
import { computeLaggedEffects } from '../laggedEffects'
import { moodFaceBursts } from '../faceBursts'
import { estimateBurst, personalCalibration, personalNeutral, readingWeight, weightedMedian } from './faceMood'

export const FACE_MOOD_MIN_READINGS = 3
export const FACE_MOOD_MIN_DAYS = 14

/**
 * Bien-être estimé jour par jour : [{ date, note, readings, lastAt }], trié.
 * La ligne de base (visage habituel) est calculée une fois par jour, à sa dernière lecture : O(jours × lectures)
 * au lieu de O(lectures²) (≈ 50 lectures par jour sur des mois).
 * @param {object[]} entries  entrées `face_burst` et `wellbeing` (les autres sont ignorées)
 */
export function faceMoodDays(entries) {
  const bursts = moodFaceBursts(entries).sort((a, b) => (a.at < b.at ? -1 : 1))
  const byDay = new Map()
  for (const b of bursts) {
    const dk = localDateKey(b.at)
    if (!byDay.has(dk)) byDay.set(dk, [])
    byDay.get(dk).push(b)
  }
  const days = [...byDay].filter(([, list]) => list.length >= FACE_MOOD_MIN_READINGS)
  if (!days.length) return []
  const calibration = personalCalibration(entries)
  return days.map(([date, list]) => {
    const lastAt = list[list.length - 1].at
    const base = personalNeutral(bursts, lastAt)
    const readings = list.map((b) => estimateBurst(b, { bursts, calibration, base }))
    const note = weightedMedian(readings.map((r) => r.note), readings.map(readingWeight))
    return { date, note: Math.round(note * 100) / 100, readings: list.length, lastAt }
  })
}

/**
 * Entrées des Analyses où le bien-être du jour est l'humeur estimée par le visage : les notes sont retirées (elles ont
 * leurs propres Analyses) et chaque jour estimé devient une note à l'heure de sa dernière lecture (ordre temporel).
 */
export function faceMoodAnalysisEntries(entries, days = faceMoodDays(entries)) {
  const others = (entries || []).filter((e) => e?.type !== 'wellbeing')
  return [...others, ...days.map((d) => ({ type: 'wellbeing', at: d.lastAt, payload: { score: d.note } }))]
}

/**
 * Corrélations facteurs X ↔ humeur estimée par le visage.
 * @returns {{ status: 'no_face' } | { status: 'not_enough_data', minDays: number, currentDays: number, readingsMin: number }
 *   | { status: 'ok', datasetDays: number, faceDays: number, correlations: object[], weekendControl: object,
 *       tagEffects: object, laggedEffects: object }}  tagEffects / laggedEffects : mêmes formes que
 *   computeTagEffects / computeLaggedEffects, sans piste (`action` toujours nulle).
 */
export function computeFaceMoodCorrelations(entries) {
  if (!moodFaceBursts(entries).length) return { status: 'no_face' }
  const days = faceMoodDays(entries)
  if (days.length < FACE_MOOD_MIN_DAYS) {
    return { status: 'not_enough_data', minDays: FACE_MOOD_MIN_DAYS, currentDays: days.length, readingsMin: FACE_MOOD_MIN_READINGS }
  }
  const analysisEntries = faceMoodAnalysisEntries(entries, days)
  const res = computeBasicCorrelations(analysisEntries)
  if (res.status !== 'ok') return { status: 'not_enough_data', minDays: FACE_MOOD_MIN_DAYS, currentDays: days.length, readingsMin: FACE_MOOD_MIN_READINGS }
  const lagged = computeLaggedEffects(analysisEntries)
  return {
    status: 'ok',
    datasetDays: res.datasetDays,
    faceDays: days.length,
    correlations: res.correlations,
    weekendControl: res.weekendControl,
    tagEffects: computeTagEffects(entries, { outcomeByDay: new Map(days.map((d) => [d.date, d.note])) }),
    laggedEffects: lagged.status === 'ok'
      ? { ...lagged, effects: lagged.effects.map((e) => ({ ...e, action: null, againstNorm: false })) }
      : lagged,
  }
}
