/**
 * Porte de calibration du visage (journal/IDEES.md I110 / I112) : vérifie si, **chez cet utilisateur**, les
 * lectures du déverrouillage suivent les notes qu'il donne lui-même. Depuis la consigne du 19/10/2026 au soir, elle
 * ne conditionne plus l'affichage (l'humeur estimée s'affiche dès la première lecture, mood/faceMood.js) : c'est une
 * vérification facultative, montrée dans la carte et le diagnostic. Fonction pure, rien de stocké : l'historique des regards hebdomadaires
 * est recalculé à partir des entrées.
 *
 * - Un jour compte s'il a une note de bien-être et au moins une rafale qui compte pour l'humeur (`moodFaceBursts` :
 *   déverrouillage, visage lu). Indices du jour = médianes des rafales ; note du jour = moyenne des notes.
 * - Un seul indice combiné (pas un test par indice : comparaisons multiples) : prédiction en validation croisée
 *   « un jour en moins » d'une régression Ridge des notes sur les indices standardisés. λ est fixé d'avance (le
 *   choisir sur les mêmes jours rendrait la prédiction optimiste). Le sens de chaque indice est appris chez
 *   l'utilisateur (aucun « sourire = bonne humeur » présupposé) ; seul compte que la prédiction aille dans le sens
 *   des notes, d'où un z unilatéral.
 * - Robuste aux dérives lentes (I121) : la prédiction d'un jour est apprise **sans les 7 jours avant et après**
 *   (mood/blockCv.js), et z = r / erreur type jackknife de la corrélation prédiction ↔ note est ramené à la taille
 *   d'échantillon effective (× √((1 − a)/(1 + a)), a = autocorrélations d'un jour à l'autre de la prédiction et des
 *   notes) ; si le visage dérive nettement, chaque indice est comparé à sa moyenne des 14 jours précédents. Sans
 *   cela, une humeur qui dure et un visage qui dérive (lumière de saison…) ouvraient la porte à tort dans 12,5 % des
 *   cas simulés ; avec, 2,5 % (gate.test.js).
 * - Ouverte quand z ≥ 3,29 à **deux regards hebdomadaires consécutifs** avec ≥ 30 jours ; refermée quand, sur les
 *   8 dernières semaines (≥ 14 jours), z < 1,5 à deux regards consécutifs ; après une refermeture, seuls les jours
 *   suivants comptent pour rouvrir. Simulé dans gate.test.js : 0,5 % de faux départs en 120 jours sans lien ;
 *   un lien net ouvert à J90 dans 9 cas sur 10 ; refermée ≈ 5 semaines après la disparition du lien. (La règle
 *   « 6 semaines, z < 2 » d'IDEES.md I112 refermait 4 fois sur 10 un vrai lien : fenêtre trop courte.)
 *
 * Les entrées restent Y (estimatorInputs.js) : la porte compare deux entrées Y entre elles, elle ne crée aucun
 * facteur des Analyses.
 */
import { localDateKey } from '../analysisEngine'
import { moodFaceBursts } from '../faceBursts'
import { blockedRidgePredictions, effectiveZ, lag1Autocorrelation, sharedAutocorrelation } from './blockCv'

export const GATE_MIN_DAYS = 30
export const GATE_Z_OPEN = 3.29
export const GATE_Z_CLOSE = 1.5
export const GATE_CLOSE_WINDOW_DAYS = 56
export const GATE_CLOSE_MIN_DAYS = 14
export const GATE_LAMBDA = 10
const LOOK_EVERY_DAYS = 7
/** Un indice entre dans le modèle s'il est lu au moins ces jours-là (sinon remplacé par sa médiane). */
const MIN_FEATURE_SHARE = 0.8
const DAY_MS = 86400000
const DETREND_DAYS = 14
const DETREND_MIN = 3
/** Au-delà, le visage dérive assez pour qu'on le compare à ses 14 jours précédents (I121). */
export const FACE_DRIFT_DETREND = 0.5

const dayNumber = (key) => Math.round(Date.parse(`${key}T00:00:00Z`) / DAY_MS)
const keyOf = (n) => new Date(n * DAY_MS).toISOString().slice(0, 10)

function median(values) {
  const s = [...values].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Jours comparables, triés : [{ date, note, face: { indice: médiane } }].
 * @param {object[]} entries  entrées `wellbeing` et `face_burst` (les autres sont ignorées)
 */
export function gateDays(entries) {
  const notes = new Map()
  for (const e of entries || []) {
    const score = e?.type === 'wellbeing' ? e.payload?.score : undefined
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 5 || !e.at) continue
    const dk = localDateKey(e.at)
    const n = notes.get(dk) || { sum: 0, count: 0 }
    n.sum += score
    n.count += 1
    notes.set(dk, n)
  }
  const faces = new Map()
  for (const b of moodFaceBursts(entries)) {
    const dk = localDateKey(b.at)
    if (!notes.has(dk)) continue
    const f = faces.get(dk) || {}
    for (const [k, v] of Object.entries(b.payload.values)) (f[k] ||= []).push(v)
    faces.set(dk, f)
  }
  return [...faces.keys()].sort().map((date) => {
    const face = {}
    for (const [k, vs] of Object.entries(faces.get(date))) face[k] = median(vs)
    const n = notes.get(date)
    return { date, note: n.sum / n.count, face }
  })
}

/** Autocorrélation médiane d'un jour à l'autre des indices du visage (0 = aucune dérive lente). */
export function faceDrift(days) {
  const keys = [...new Set(days.flatMap((d) => Object.keys(d.face)))]
  const r1 = keys.map((k) => {
    const rows = days.filter((d) => typeof d.face[k] === 'number')
    return lag1Autocorrelation(rows.map((d) => d.face[k]), rows.map((d) => dayNumber(d.date)))
  })
  return r1.length ? median(r1) : 0
}

/**
 * Écart de chaque indice à sa moyenne des 14 jours **précédents** (passé seulement : aucune fuite de l'avenir).
 * Retire du visage ce qui dérive lentement sans rapport avec l'humeur du jour (lumière de saison, lunettes, coque).
 * Un jour sans au moins 3 jours lus dans les 14 précédents est laissé de côté.
 */
export function detrendFace(days) {
  const nums = days.map((d) => dayNumber(d.date))
  const out = []
  days.forEach((d, i) => {
    const face = {}
    for (const [k, v] of Object.entries(d.face)) {
      const prev = []
      for (let j = i - 1; j >= 0 && nums[j] >= nums[i] - DETREND_DAYS; j--) {
        if (typeof days[j].face[k] === 'number') prev.push(days[j].face[k])
      }
      if (prev.length >= DETREND_MIN) face[k] = v - prev.reduce((t, x) => t + x, 0) / prev.length
    }
    if (Object.keys(face).length) out.push({ ...d, face })
  })
  return out
}

/**
 * Indice combiné en validation croisée par blocs : une prédiction de la note par jour, obtenue sans les jours à
 * moins de 7 jours de lui.
 * Si le visage dérive nettement (autocorrélation médiane de ses indices d'un jour à l'autre > 0,5), chaque indice
 * est d'abord comparé à sa moyenne des 14 jours précédents (detrendFace) ; sinon cette étape coûterait de la
 * puissance pour rien (simulé : lien net reconnu à J90 dans 71 % des cas au lieu de 83 %).
 * @returns {{ keys: string[], index: number[], days: object[], drift: number, detrended: boolean } | null}
 *   days = jours retenus ; drift = autocorrélation médiane des indices du visage
 */
export function faceIndexLoo(rawDays) {
  const drift = faceDrift(rawDays)
  const days = drift > FACE_DRIFT_DETREND ? detrendFace(rawDays) : rawDays
  const n = days.length
  if (n < 3) return null
  const counts = {}
  for (const d of days) for (const k of Object.keys(d.face)) counts[k] = (counts[k] || 0) + 1
  const keys = Object.keys(counts).filter((k) => counts[k] >= MIN_FEATURE_SHARE * n).sort()
  const cols = []
  const kept = []
  for (const k of keys) {
    const present = days.map((d) => d.face[k]).filter((v) => typeof v === 'number')
    const fill = median(present)
    const raw = days.map((d) => (typeof d.face[k] === 'number' ? d.face[k] : fill))
    const mean = raw.reduce((s, v) => s + v, 0) / n
    const sd = Math.sqrt(raw.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1))
    if (!(sd > 1e-9)) continue
    cols.push(raw.map((v) => (v - mean) / sd))
    kept.push(k)
  }
  if (!kept.length) return null
  const X = days.map((_, i) => [1, ...cols.map((c) => c[i])])
  const index = blockedRidgePredictions(X, days.map((d) => d.note), days.map((d) => dayNumber(d.date)), GATE_LAMBDA)
  return index ? { keys: kept, index, days, drift, detrended: days !== rawDays } : null
}

/** Corrélation de Pearson et z = r / erreur type jackknife (un point en moins). */
export function jackknifeCorrelation(x, y) {
  const n = x.length
  if (n < 3 || y.length !== n) return { r: 0, z: 0 }
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0
  for (let i = 0; i < n; i++) {
    sx += x[i]; sy += y[i]; sxx += x[i] * x[i]; syy += y[i] * y[i]; sxy += x[i] * y[i]
  }
  const corr = (m, a, b, aa, bb, ab) => {
    const v = (aa - (a * a) / m) * (bb - (b * b) / m)
    return v > 1e-12 ? (ab - (a * b) / m) / Math.sqrt(v) : 0
  }
  const r = corr(n, sx, sy, sxx, syy, sxy)
  const loo = x.map((xi, i) => corr(n - 1, sx - xi, sy - y[i], sxx - xi * xi, syy - y[i] * y[i], sxy - xi * y[i]))
  const mean = loo.reduce((s, v) => s + v, 0) / n
  const se = Math.sqrt(((n - 1) / n) * loo.reduce((s, v) => s + (v - mean) ** 2, 0))
  return { r, z: se > 0 ? r / se : 0 }
}

/** Accord prédiction ↔ notes : r, z corrigé de l'autocorrélation, et a (autocorrélation retenue). */
function agreement(days) {
  const fit = faceIndexLoo(days)
  if (!fit) return { r: 0, z: 0, a: 0, drift: 0, detrended: false }
  const notes = fit.days.map((d) => d.note)
  const { r, z } = jackknifeCorrelation(fit.index, notes)
  const a = sharedAutocorrelation(fit.index, notes, fit.days.map((d) => dayNumber(d.date)))
  return { r, z: effectiveZ(z, a), a, drift: fit.drift, detrended: fit.detrended }
}

/**
 * État de la porte.
 * @param {{ date: string, note: number, face: object }[]} days  sortie de gateDays
 * @param {{ today?: string }} [opts]  dernier jour regardé (clé AAAA-MM-JJ ; par défaut le dernier jour comparable)
 * @returns {{ state: 'candidate'|'active', nDays: number, needed: number, r: number|null, z: number|null, a: number|null,
 *   drift: number|null, detrended: boolean,
 *   openedAt: string|null, closedAt: string|null, periods: { from: string, to: string|null }[],
 *   looks: { date: string, nDays: number, z: number|null }[] }}
 *   periods = chaque ouverture (to = refermeture, null si toujours ouverte) ; a = autocorrélation retenue au
 *   dernier regard, drift = dérive du visage d'un jour à l'autre, detrended = visage comparé à ses 14 jours
 *   précédents (diagnostic : ce que la correction des dérives lentes fait chez l'utilisateur).
 */
export function evaluateGate(days, { today } = {}) {
  const sorted = [...(days || [])].sort((a, b) => (a.date < b.date ? -1 : 1))
  const out = { state: 'candidate', nDays: 0, needed: GATE_MIN_DAYS, r: null, z: null, a: null, drift: null, detrended: false, openedAt: null, closedAt: null, periods: [], looks: [] }
  if (!sorted.length) return out
  const first = dayNumber(sorted[0].date)
  const last = dayNumber(today || sorted[sorted.length - 1].date)
  let since = -Infinity // après une refermeture, seuls les jours suivants comptent pour rouvrir
  let streak = 0
  for (let look = first + LOOK_EVERY_DAYS - 1; look <= last; look += LOOK_EVERY_DAYS) {
    const upTo = sorted.filter((d) => dayNumber(d.date) <= look)
    if (out.state === 'candidate') {
      const pool = upTo.filter((d) => dayNumber(d.date) > since)
      const { r, z, a, drift, detrended } = pool.length >= GATE_MIN_DAYS ? agreement(pool) : {}
      out.looks.push({ date: keyOf(look), nDays: pool.length, z: z ?? null })
      streak = z != null && z >= GATE_Z_OPEN ? streak + 1 : 0
      Object.assign(out, { nDays: pool.length, r: r ?? null, z: z ?? null, a: a ?? null, drift: drift ?? null, detrended: !!detrended })
      if (streak >= 2) {
        Object.assign(out, { state: 'active', openedAt: keyOf(look) })
        out.periods.push({ from: keyOf(look), to: null })
        streak = 0
      }
    } else {
      const recent = upTo.filter((d) => dayNumber(d.date) > look - GATE_CLOSE_WINDOW_DAYS)
      const { r, z, a, drift, detrended } = recent.length >= GATE_CLOSE_MIN_DAYS ? agreement(recent) : {}
      out.looks.push({ date: keyOf(look), nDays: recent.length, z: z ?? null })
      streak = z != null && z < GATE_Z_CLOSE ? streak + 1 : 0
      Object.assign(out, { nDays: upTo.length, r: r ?? null, z: z ?? null, a: a ?? null, drift: drift ?? null, detrended: !!detrended })
      if (streak >= 2) {
        Object.assign(out, { state: 'candidate', closedAt: keyOf(look), openedAt: null })
        out.periods[out.periods.length - 1].to = keyOf(look)
        since = look
        streak = 0
      }
    }
  }
  if (out.state === 'candidate') {
    // Compte du jour (pas seulement du dernier regard) pour la carte : « N jours sur 30 ».
    out.nDays = sorted.filter((d) => dayNumber(d.date) > since && dayNumber(d.date) <= last).length
  }
  return out
}

const frenchDay = (key) => new Date(`${key}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

/**
 * Une phrase pour la carte « Lecture du visage » : où en est la vérification facultative « votre visage suit vos
 * notes ». Elle ne bloque plus rien (consigne du 19/10/2026 au soir) : l'humeur estimée s'affiche dès la première
 * lecture (mood/faceMood.js) ; cette porte dit seulement si, chez vous, le visage suit vos propres notes.
 */
export function describeGate(gate) {
  if (!gate) return 'Vos notes, facultatives, permettront aussi de vérifier si votre visage suit votre ressenti.'
  if (gate.state === 'active') {
    return `Vérification : votre visage suit vos notes depuis le ${frenchDay(gate.openedAt)}.`
  }
  const lost = gate.closedAt ? `Le lien visage ↔ notes s’est perdu le ${frenchDay(gate.closedAt)} : on recompte depuis. ` : ''
  if (gate.nDays < gate.needed) {
    const n = gate.nDays
    return `${lost}Vérification facultative : ${n} ${n > 1 ? 'jours' : 'jour'} sur ${gate.needed} avec une note et des lectures pour savoir si votre visage suit vos notes.`
  }
  return `${lost}Vérification : sur ${gate.nDays} jours comparés, votre visage ne suit pas encore nettement vos notes ; l’estimation reste générale, avec une large fourchette.`
}
