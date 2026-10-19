/**
 * Porte de calibration du visage (journal/IDEES.md I110 / I112). Une humeur estimée à partir du visage ne sera
 * affichée que lorsque, **chez cet utilisateur**, les lectures du déverrouillage suivent les notes qu'il donne
 * lui-même ; sinon elle reste en diagnostic. Fonction pure, rien de stocké : l'historique des regards hebdomadaires
 * est recalculé à partir des entrées.
 *
 * - Un jour compte s'il a une note de bien-être et au moins une rafale qui compte pour l'humeur (`moodFaceBursts` :
 *   déverrouillage, visage lu). Indices du jour = médianes des rafales ; note du jour = moyenne des notes.
 * - Un seul indice combiné (pas un test par indice : comparaisons multiples) : prédiction en validation croisée
 *   « un jour en moins » d'une régression Ridge des notes sur les indices standardisés. λ est fixé d'avance (le
 *   choisir sur les mêmes jours rendrait la prédiction optimiste). Le sens de chaque indice est appris chez
 *   l'utilisateur (aucun « sourire = bonne humeur » présupposé) ; seul compte que la prédiction aille dans le sens
 *   des notes, d'où un z unilatéral.
 * - z = r / erreur type jackknife (un jour en moins) de la corrélation prédiction ↔ note.
 * - Ouverte quand z ≥ 3,29 à **deux regards hebdomadaires consécutifs** avec ≥ 30 jours ; refermée quand, sur les
 *   8 dernières semaines (≥ 14 jours), z < 1,5 à deux regards consécutifs ; après une refermeture, seuls les jours
 *   suivants comptent pour rouvrir. Simulé dans gate.test.js : 0,5 % de faux départs en 120 jours sans lien ;
 *   un lien net ouvert à J90 dans 9 cas sur 10 ; refermée ≈ 5 semaines après la disparition du lien. (La règle
 *   « 6 semaines, z < 2 » d'IDEES.md I112 refermait 4 fois sur 10 un vrai lien : fenêtre trop courte.)
 *
 * Les entrées restent Y (estimatorInputs.js) : la porte compare deux entrées Y entre elles, elle ne crée aucun
 * facteur des Analyses.
 */
import { localDateKey, ridgeLooPredictions } from '../analysisEngine'
import { moodFaceBursts } from '../faceBursts'

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

/**
 * Indice combiné en validation croisée : une prédiction de la note par jour, obtenue sans ce jour.
 * @returns {{ keys: string[], index: number[] } | null}
 */
export function faceIndexLoo(days) {
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
  const index = ridgeLooPredictions(X, days.map((d) => d.note), GATE_LAMBDA)
  return index ? { keys: kept, index } : null
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

function agreement(days) {
  const fit = faceIndexLoo(days)
  if (!fit) return { r: 0, z: 0 }
  return jackknifeCorrelation(fit.index, days.map((d) => d.note))
}

/**
 * État de la porte.
 * @param {{ date: string, note: number, face: object }[]} days  sortie de gateDays
 * @param {{ today?: string }} [opts]  dernier jour regardé (clé AAAA-MM-JJ ; par défaut le dernier jour comparable)
 * @returns {{ state: 'candidate'|'active', nDays: number, needed: number, r: number|null, z: number|null,
 *   openedAt: string|null, closedAt: string|null, periods: { from: string, to: string|null }[],
 *   looks: { date: string, nDays: number, z: number|null }[] }}
 *   periods = chaque ouverture (to = refermeture, null si toujours ouverte).
 */
export function evaluateGate(days, { today } = {}) {
  const sorted = [...(days || [])].sort((a, b) => (a.date < b.date ? -1 : 1))
  const out = { state: 'candidate', nDays: 0, needed: GATE_MIN_DAYS, r: null, z: null, openedAt: null, closedAt: null, periods: [], looks: [] }
  if (!sorted.length) return out
  const first = dayNumber(sorted[0].date)
  const last = dayNumber(today || sorted[sorted.length - 1].date)
  let since = -Infinity // après une refermeture, seuls les jours suivants comptent pour rouvrir
  let streak = 0
  for (let look = first + LOOK_EVERY_DAYS - 1; look <= last; look += LOOK_EVERY_DAYS) {
    const upTo = sorted.filter((d) => dayNumber(d.date) <= look)
    if (out.state === 'candidate') {
      const pool = upTo.filter((d) => dayNumber(d.date) > since)
      const { r, z } = pool.length >= GATE_MIN_DAYS ? agreement(pool) : { r: null, z: null }
      out.looks.push({ date: keyOf(look), nDays: pool.length, z })
      streak = z != null && z >= GATE_Z_OPEN ? streak + 1 : 0
      Object.assign(out, { nDays: pool.length, r, z })
      if (streak >= 2) {
        Object.assign(out, { state: 'active', openedAt: keyOf(look) })
        out.periods.push({ from: keyOf(look), to: null })
        streak = 0
      }
    } else {
      const recent = upTo.filter((d) => dayNumber(d.date) > look - GATE_CLOSE_WINDOW_DAYS)
      const { r, z } = recent.length >= GATE_CLOSE_MIN_DAYS ? agreement(recent) : { r: null, z: null }
      out.looks.push({ date: keyOf(look), nDays: recent.length, z })
      streak = z != null && z < GATE_Z_CLOSE ? streak + 1 : 0
      Object.assign(out, { nDays: upTo.length, r, z })
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

/** Une phrase pour la carte « Lecture du visage », sans aucune valeur d'humeur. */
export function describeGate(gate) {
  if (!gate) return 'Les mesures attendent d’être assez nombreuses et comparées à vos notes : rien n’est affiché avant.'
  if (gate.state === 'active') {
    return `Votre visage suit vos notes depuis le ${frenchDay(gate.openedAt)} : l’humeur estimée arrivera dans une prochaine mise à jour, avec sa fourchette.`
  }
  const lost = gate.closedAt ? `Le lien s’est perdu le ${frenchDay(gate.closedAt)} : on recompte depuis. ` : ''
  if (gate.nDays < gate.needed) {
    const n = gate.nDays
    return `${lost}Calibration : ${n} ${n > 1 ? 'jours' : 'jour'} sur ${gate.needed} avec une note et des lectures. Rien n’est affiché avant que votre visage suive vos notes.`
  }
  return `${lost}Calibration : ${gate.nDays} jours comparés ; votre visage ne suit pas encore assez vos notes pour estimer votre humeur. Rien n’est affiché.`
}
