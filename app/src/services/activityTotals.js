/**
 * Pas et calories d'une journée, sans rien compter deux fois (signalement du 27/10/2026 : « 30 199 pas » et
 * « 658 625 kcal » le 26/10).
 *
 * - Plusieurs sources mesurent les mêmes pas (montre Huawei en direct, téléphone ou autre app via Health Connect) :
 *   pour chaque heure, on garde la source qui en compte le plus, au lieu d'additionner les sources.
 * - Le total « du jour » d'une source (`period: 'day'`) et ses tranches couvrent les mêmes pas : le plus grand.
 * - Les calories minute de la montre Huawei arrivent en calories (petites), pas en kcal : les tranches horaires
 *   écrites avant la correction (sans `rawCal`) sont divisées par 1 000 à la lecture ; la migration
 *   (`watchKcalFix.js`) les réécrit en base.
 * - Garde-fou : un total de jour hors de toute plausibilité n'est pas affiché (null) plutôt qu'un chiffre absurde.
 */
const HOUR = 3600_000
const WATCH_SOURCE = 'huawei_watch'

/** Au-delà, le total d'un jour est une erreur de mesure ou d'unité, pas une journée réelle. */
export const MAX_PLAUSIBLE = { steps: 100_000, calories: 15_000 }

/** Tranche horaire de calories de la montre écrite avant la correction d'unité (valeur en petites calories). */
export const isLegacyWatchCalories = (e) =>
  e?.type === 'calories' && e.source === WATCH_SOURCE && e.payload?.period !== 'day' && e.payload?.rawCal == null

/** Valeur d'une entrée pas / calories, en pas ou en kcal ; null si absente. */
export function activityValue(e) {
  const v = e?.payload?.value
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return null
  return isLegacyWatchCalories(e) ? v / 1000 : v
}

/** Groupe de source : une app d'origine (Health Connect garde la sienne), la montre, ou les agrégats déjà dédoublonnés. */
const groupOf = (e) => `${e.source || ''}|${e.payload?.sourceName || ''}`

/** Accumulateur d'un jour et d'un type (pas ou calories). */
export function createActivityTotal() {
  return { hours: new Map(), dayTotals: new Map() }
}

/** Ajoute une entrée pas / calories (déjà filtrée sur le jour et le type). */
export function addActivity(acc, e) {
  const v = activityValue(e)
  if (v == null) return
  const g = groupOf(e)
  if (e.payload?.period === 'day') {
    acc.dayTotals.set(g, Math.max(acc.dayTotals.get(g) || 0, v))
    return
  }
  const t = Date.parse(e.at)
  if (!Number.isFinite(t)) return
  const h = Math.floor(t / HOUR) * HOUR
  const byGroup = acc.hours.get(h) || new Map()
  byGroup.set(g, (byGroup.get(g) || 0) + v)
  acc.hours.set(h, byGroup)
}

/** Somme des heures (la plus grande source de chaque heure), sans total du jour ; 0 si rien. */
export function slicesTotal(acc) {
  let sum = 0
  for (const byGroup of acc.hours.values()) sum += Math.max(...byGroup.values())
  return sum
}

/**
 * Total du jour : le plus grand entre les totaux « du jour » des sources et la somme des heures ; null si aucune
 * donnée, ou si le résultat dépasse `MAX_PLAUSIBLE[kind]`.
 */
export function activityTotal(acc, kind) {
  if (!acc.hours.size && !acc.dayTotals.size) return null
  const v = Math.max(slicesTotal(acc), ...acc.dayTotals.values())
  const max = MAX_PLAUSIBLE[kind]
  return max != null && v > max ? null : v
}

/** Raccourci : total d'une liste d'entrées d'un même jour et d'un même type. */
export function totalOf(entries, kind) {
  const acc = createActivityTotal()
  for (const e of entries || []) addActivity(acc, e)
  return activityTotal(acc, kind)
}
