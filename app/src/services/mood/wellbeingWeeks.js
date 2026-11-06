/**
 * Bien-être, « Sur quelques semaines » (horizon long terme de l'onglet Bien-être, retours du 04/11 point 4) : pour
 * chaque semaine, la moyenne du bien-être estimé par le visage (même note du jour que l'Accueil, l'historique et les
 * Analyses : `faceMoodDays`) et, à part, la moyenne des notes données à la main. Jamais mêlées (comme l'historique).
 *
 * Description seulement : aucune analyse, aucun facteur X lu (D5), aucun jugement ni conseil (règle 6).
 */
import { localDateKey } from '../analysisEngine'
import { faceMoodDays } from './faceMoodDays'

export const WELLBEING_WEEKS = 8
/** Semaines avec au moins un jour estimé ou noté avant de montrer le graphique (une seule ne fait pas une tendance). */
export const WELLBEING_WEEKS_MIN = 2

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const round1 = (v) => Math.round(v * 10) / 10
const mean = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null)

const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d + n, 12).toISOString())
}

/**
 * @param {object[]} entries  entrées `face_burst`, `wellbeing` et `gut` (les autres sont ignorées)
 * @param {{ now?: Date, weeks?: number }} [opts]
 * @returns {{ from: string, to: string, estDays: number, est: number|null, noteDays: number, note: number|null }[]}
 *   de la plus ancienne à la plus récente ; la dernière finit aujourd'hui ; moyennes sur 5, à 0,1 près
 */
export function wellbeingWeeks(entries, { now = new Date(), weeks = WELLBEING_WEEKS } = {}) {
  const to = localDateKey(now.toISOString())
  const from = addDays(to, -(weeks * 7 - 1))
  const inRange = (k) => k >= from && k <= to
  const est = new Map(faceMoodDays(entries || []).filter((d) => inRange(d.date)).map((d) => [d.date, d.note]))
  // Plusieurs notes le même jour : leur moyenne compte pour un jour.
  const notesByDay = new Map()
  for (const e of entries || []) {
    if (e?.type !== 'wellbeing' || !isNum(e.payload?.score) || !e.at || Number.isNaN(Date.parse(e.at))) continue
    const k = localDateKey(e.at)
    if (!inRange(k)) continue
    if (!notesByDay.has(k)) notesByDay.set(k, [])
    notesByDay.get(k).push(e.payload.score)
  }
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(from, i * 7)
    const estValues = []
    const noteValues = []
    for (let j = 0; j < 7; j++) {
      const k = addDays(start, j)
      if (est.has(k)) estValues.push(est.get(k))
      if (notesByDay.has(k)) noteValues.push(mean(notesByDay.get(k)))
    }
    const e = mean(estValues)
    const n = mean(noteValues)
    return {
      from: start,
      to: addDays(start, 6),
      estDays: estValues.length,
      est: e == null ? null : round1(e),
      noteDays: noteValues.length,
      note: n == null ? null : round1(n),
    }
  })
}

const hasData = (w) => w.estDays > 0 || w.noteDays > 0

/** Assez de semaines avec un jour estimé ou noté pour montrer le graphique. */
export const wellbeingWeeksReady = (weeks) => (weeks || []).filter(hasData).length >= WELLBEING_WEEKS_MIN

/** Les semaines à montrer : à partir de la première qui a un jour estimé ou noté. */
export const shownWellbeingWeeks = (weeks) => {
  const list = weeks || []
  const first = list.findIndex(hasData)
  return first < 0 ? [] : list.slice(first)
}

const fmt = (v) => String(v).replace('.', ',')

/** « Semaine du 26 oct. : estimé 3,4 sur 5 (6 jours), vos notes 3,8 (2 jours) » (lecteur d'écran). */
export function wellbeingWeekLabel(w) {
  const [y, m, d] = w.from.split('-').map(Number)
  const day = new Date(y, m - 1, d, 12).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const days = (n) => `${n} jour${n > 1 ? 's' : ''}`
  const parts = []
  if (w.est != null) parts.push(`estimé ${fmt(w.est)} sur 5 (${days(w.estDays)})`)
  if (w.note != null) parts.push(`vos notes ${fmt(w.note)} sur 5 (${days(w.noteDays)})`)
  return `Semaine du ${day} : ${parts.length ? parts.join(', ') : 'rien de lu ni de noté'}`
}
