/**
 * Ventre, « Sur quelques semaines » (horizon long terme de l'onglet Ventre, retours du 04/11 point 4) : pour chaque
 * semaine, les jours calmes, de gêne et de douleur. Même règle que le rapport PDF (`report/buildReport.js`) : un jour
 * prend sa note la plus forte (douleur > gêne > calme), bilans du soir et notes au fil de l'eau confondus ; un jour
 * sans note n'est ni calme ni gêné. Description seulement : aucune analyse, aucun jugement.
 */
import { localDateKey } from './analysisEngine'
import { GUT_TYPE } from './today'

export const GUT_WEEKS = 8
/** Semaines avec au moins une note avant de montrer le graphique (une seule ne fait pas une tendance). */
export const GUT_WEEKS_MIN_NOTED = 2

const RANK = { calm: 0, discomfort: 1, pain: 2 }

const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d + n, 12).toISOString())
}

/**
 * @param {object[]} entries
 * @param {{ now?: Date, weeks?: number }} [opts]
 * @returns {{ from: string, to: string, notedDays: number, calm: number, discomfort: number, pain: number }[]}
 *   de la plus ancienne à la plus récente ; la dernière finit aujourd'hui
 */
export function gutWeeks(entries, { now = new Date(), weeks = GUT_WEEKS } = {}) {
  const to = localDateKey(now.toISOString())
  const from = addDays(to, -(weeks * 7 - 1))
  const byDay = new Map()
  for (const e of entries || []) {
    if (e?.type !== GUT_TYPE || !(e.payload?.level in RANK) || !e.at || Number.isNaN(Date.parse(e.at))) continue
    const k = localDateKey(e.at)
    if (k < from || k > to) continue
    const prev = byDay.get(k)
    if (!prev || RANK[e.payload.level] > RANK[prev]) byDay.set(k, e.payload.level)
  }
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(from, i * 7)
    const week = { from: start, to: addDays(start, 6), notedDays: 0, calm: 0, discomfort: 0, pain: 0 }
    for (let j = 0; j < 7; j++) {
      const level = byDay.get(addDays(start, j))
      if (!level) continue
      week[level] += 1
      week.notedDays += 1
    }
    return week
  })
}

/** Assez de semaines notées pour montrer le graphique. */
export const gutWeeksReady = (weeks) => (weeks || []).filter((w) => w.notedDays > 0).length >= GUT_WEEKS_MIN_NOTED

/** « Semaine du 26 oct. : 3 calmes, 2 gênes, 1 douleur, 1 jour sans note » (lecteur d'écran). */
export function gutWeekLabel(w) {
  const [y, m, d] = w.from.split('-').map(Number)
  const day = new Date(y, m - 1, d, 12).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const parts = [
    [w.calm, 'calme', 'calmes'],
    [w.discomfort, 'gêne', 'gênes'],
    [w.pain, 'douleur', 'douleurs'],
  ].filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n > 1 ? many : one}`)
  const missing = 7 - w.notedDays
  if (missing > 0) parts.push(missing === 7 ? 'aucune note' : `${missing} jour${missing > 1 ? 's' : ''} sans note`)
  return `Semaine du ${day} : ${parts.join(', ')}`
}
