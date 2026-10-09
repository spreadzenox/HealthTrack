/**
 * Édition d'un repas avant enregistrement : noms d'ingrédients rapprochés de la base Ciqual,
 * recherche d'ingrédients, grammes modifiables et kcal estimées.
 */
import { INGREDIENT_NAMES } from '../data/ingredientNames.js'
import nutritionMap from '../data/ingredientsNutrition.json'

const MAX_GRAMS = 5000
const CONFIDENCES = new Set(['high', 'medium', 'low'])

/** Minuscules, sans accents ni virgules ou apostrophes, espaces simplifiés. */
export function normalizeName(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’',;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const CANONICAL = INGREDIENT_NAMES.map((n) => n.trim())
const CANONICAL_SET = new Set(CANONICAL)
const BY_NORMALIZED = new Map()
for (const name of CANONICAL) {
  const key = normalizeName(name)
  if (!BY_NORMALIZED.has(key)) BY_NORMALIZED.set(key, name)
}
const SEARCH_INDEX = CANONICAL.map((name) => ({ name, norm: normalizeName(name) }))

/**
 * Nom canonique de la base correspondant à `name` (casse, accents et espaces ignorés), sinon null.
 */
export function matchIngredientName(name) {
  if (name == null) return null
  const exact = String(name).trim()
  if (!exact) return null
  if (CANONICAL_SET.has(exact)) return exact
  return BY_NORMALIZED.get(normalizeName(exact)) ?? null
}

/**
 * Ingrédients de la base contenant tous les mots de la requête (au moins 2 caractères).
 * Ordre : noms qui commencent par la requête, puis les plus courts (les plus génériques).
 */
export function searchIngredients(query, limit = 8) {
  const q = normalizeName(query)
  if (q.length < 2) return []
  const words = q.split(' ')
  return SEARCH_INDEX
    .filter(({ norm }) => words.every((w) => norm.includes(w)))
    .sort((a, b) => {
      const pa = a.norm.startsWith(q) ? 0 : a.norm.startsWith(words[0]) ? 1 : 2
      const pb = b.norm.startsWith(q) ? 0 : b.norm.startsWith(words[0]) ? 1 : 2
      return pa - pb || a.name.length - b.name.length || a.name.localeCompare(b.name, 'fr')
    })
    .slice(0, limit)
    .map(({ name }) => name)
}

function parseGrams(value) {
  if (value == null || value === '') return undefined
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.').trim())
  if (!Number.isFinite(n)) return undefined
  return Math.min(MAX_GRAMS, Math.max(0, Math.round(n)))
}

function quantityLabel(grams) {
  return grams != null ? `${grams} g` : 'portion non précisée'
}

/**
 * Élément de repas propre : nom canonique si trouvé (sinon `unknown: true`), grammes entiers,
 * libellé de quantité, confiance high/medium/low si fournie.
 */
export function normalizeMealItem(raw) {
  const original = String(raw?.ingredient ?? '').trim()
  const matched = matchIngredientName(original)
  const grams = parseGrams(raw?.quantity_g)
  const item = {
    ingredient: matched ?? original,
    quantity: quantityLabel(grams),
    quantity_g: grams,
  }
  if (CONFIDENCES.has(raw?.confidence)) item.confidence = raw.confidence
  if (!matched) item.unknown = true
  return item
}

/** Nouvelles grammes saisies par l'utilisateur (chaîne ou nombre). */
export function setItemGrams(item, value) {
  const grams = parseGrams(value)
  return { ...item, quantity_g: grams, quantity: quantityLabel(grams) }
}

/** kcal estimées d'un élément, ou null si inconnu ou sans grammes. */
export function itemKcal(item) {
  const p100 = nutritionMap[item?.ingredient]
  const grams = Number(item?.quantity_g)
  if (!p100 || !Number.isFinite(grams) || item?.quantity_g == null) return null
  return Math.round(((p100.energy_kcal || 0) * grams) / 100)
}

/** Total des kcal connues du repas. */
export function mealKcal(items) {
  return (items || []).reduce((sum, it) => sum + (itemKcal(it) ?? 0), 0)
}
