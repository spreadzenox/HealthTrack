/**
 * Saisie rapide des repas sans photo : repas habituels (mêmes ingrédients) à refaire en un tap.
 */
import { mealKcal, normalizeName } from './mealEditing'

const LABEL_INGREDIENTS = 3
/** Marge tolérée pour une heure « maintenant » saisie à la minute près. */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000

function ingredientsOf(payload) {
  return (payload?.items || []).filter((it) => String(it?.ingredient ?? '').trim())
}

/** Nom court d'un repas : le plat s'il est connu, sinon ses premiers ingrédients (noms courts). */
export function mealLabel(payload) {
  if (payload?.dish) return payload.dish
  // « Poulet, cuisse, viande bouillie… » (base Ciqual) → « Poulet »
  const names = ingredientsOf(payload).map((it) => String(it.ingredient).split(',')[0].trim() || String(it.ingredient).trim())
  if (!names.length) return 'Repas'
  const shown = names.slice(0, LABEL_INGREDIENTS).join(', ')
  return names.length > LABEL_INGREDIENTS ? `${shown}…` : shown
}

/** Même repas = même ensemble d'ingrédients (ordre, casse et accents ignorés ; grammes libres). */
function signature(items) {
  return [...new Set(items.map((it) => normalizeName(it.ingredient)))].sort().join('|')
}

/**
 * Repas les plus souvent saisis, puis les plus récents : chaque suggestion reprend les ingrédients,
 * les grammes et le nom du plat de la fois la plus récente.
 * @returns {Array<{ key: string, label: string, dish?: string, items: object[], count: number, lastAt: string, kcal: number }>}
 */
export function frequentMeals(entries, { limit = 4 } = {}) {
  const groups = new Map()
  for (const e of entries || []) {
    if (e?.type !== 'food') continue
    const items = ingredientsOf(e.payload)
    if (!items.length) continue
    const key = signature(items)
    const group = groups.get(key)
    if (!group) {
      groups.set(key, { key, count: 1, latest: e, items })
    } else {
      group.count += 1
      if (e.at > group.latest.at) {
        group.latest = e
        group.items = items
      }
    }
  }
  return [...groups.values()]
    .sort((a, b) => b.count - a.count || (b.latest.at > a.latest.at ? 1 : -1))
    .slice(0, limit)
    .map(({ key, count, latest, items }) => ({
      key,
      label: mealLabel(latest.payload),
      ...(latest.payload.dish ? { dish: latest.payload.dish } : {}),
      items,
      count,
      lastAt: latest.at,
      kcal: mealKcal(items),
    }))
}

/** Message d'erreur pour l'heure d'un repas (ISO), ou null si elle est acceptable. */
export function mealTimeError(at, now = Date.now()) {
  const t = at ? new Date(at).getTime() : NaN
  if (Number.isNaN(t)) return 'Heure invalide.'
  if (t > now + FUTURE_TOLERANCE_MS) return 'L’heure du repas ne peut pas être dans le futur.'
  return null
}
