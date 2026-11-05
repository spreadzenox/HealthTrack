/**
 * Le ressenti du ventre ajuste le bien-être (VENTRE-BE-2, I220 accepté par le propriétaire le 05/11).
 *
 * Une note du ventre « gêne » ou « douleur » est ce que la personne déclare d'elle-même : un signal Y, comme une note
 * de bien-être, mais qui ne parle que d'une partie du ressenti. Elle entre donc dans l'estimation du bien-être du jour
 * avec un poids faible : l'estimation du jour fait un pas de GUT_SELF_REPORT_WEIGHT vers la note qui va avec ce
 * ressenti (gêne ≈ 2 / 5, douleur ≈ 1 / 5), et seulement vers le bas : « calme » ne dit rien du bien-être, et une
 * gêne ne rend jamais une journée meilleure que ce que lit le visage. Au plus un pas par jour (la note la plus forte).
 *
 * Règle 5 : `gut` est déclaré dans `estimatorInputs.js` ; le ventre n'est donc jamais un facteur des liens ou des
 * pistes du bien-être (`antiCircularity.test.js`). Les pistes du ventre (repas → ventre) gardent leurs facteurs et
 * leur Y, le ventre lui-même : rien ne change pour elles.
 */
import { localDateKey } from '../analysisEngine'
import { GUT_TYPE } from '../today'

/** Note de bien-être (0–5) qui va avec chaque ressenti du ventre ; « calme » n'en a pas. */
export const GUT_SELF_REPORT_TARGET = { discomfort: 2, pain: 1 }
/** Poids faible : un pas de 20 % vers cette note (douleur avec un visage à 3,5 : 3,5 → 3,0). */
export const GUT_SELF_REPORT_WEIGHT = 0.2

const RANK = { discomfort: 1, pain: 2 }

/** Ressenti du ventre le plus fort de chaque jour : Map(date → 'discomfort' | 'pain'). */
export function gutLevelsByDay(entries) {
  const out = new Map()
  for (const e of entries || []) {
    const level = e?.type === GUT_TYPE ? e.payload?.level : null
    if (!RANK[level] || !e.at) continue
    const dk = localDateKey(e.at)
    if (!out.has(dk) || RANK[level] > RANK[out.get(dk)]) out.set(dk, level)
  }
  return out
}

/**
 * Note du jour ajustée par le ressenti du ventre. Rend { note, gut } : `gut` = { level, shift } quand le ventre a
 * compté (shift < 0, en points sur 5), sinon null.
 */
export function gutAdjust(note, level) {
  const target = GUT_SELF_REPORT_TARGET[level]
  if (!Number.isFinite(note) || target == null || target >= note) return { note, gut: null }
  const shift = GUT_SELF_REPORT_WEIGHT * (target - note)
  return { note: note + shift, gut: { level, shift: Math.round(shift * 100) / 100 } }
}
