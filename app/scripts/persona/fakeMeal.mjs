// Faux relais des personas : l'analyse d'un repas décrit par écrit reprend les mots de la description
// (PERSONAS-OUTIL-2). Un aliment par morceau de la description (virgules, « et », « + », « avec »), cherché dans la
// table nutritionnelle par son premier mot ; rien de reconnu : le plat de démonstration d'avant.
export const DEFAULT_MEAL = {
  dish: 'Pâtes à la carbonara',
  ingredients: [
    { ingredient: 'Pâtes cuites', quantity_g: 220 },
    { ingredient: 'Lardon fumé, cuit', quantity_g: 50 },
    { ingredient: 'Oeuf cru', quantity_g: 50 },
    { ingredient: 'Parmesan', quantity_g: 15 },
  ],
}

const STOP = new Set(['un', 'une', 'des', 'de', 'du', 'la', 'le', 'les', 'au', 'aux', 'a', 'en', 'petit', 'petite', 'grand', 'grande', 'bol', 'verre', 'tasse', 'assiette', 'part', 'tranche', 'tranches'])
const PORTION_G = 100
// Mots courants dont le premier nom de la table n'est pas l'aliment voulu (« Tartine craquante extrudée »)
const ALIAS = { tartine: 'pain', baguette: 'pain' }

export const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const singular = (w) => (w.length > 3 && /[sx]$/.test(w) ? w.slice(0, -1) : w)

// Index : premier mot (normalisé, au singulier) → noms de la table, le plus court d'abord (le plus générique)
export function buildIndex(names) {
  const index = new Map()
  for (const name of names) {
    const first = singular(norm(name).split(/[^a-z0-9]+/)[0] || '')
    if (!first) continue
    if (!index.has(first)) index.set(first, [])
    index.get(first).push(name)
  }
  for (const list of index.values()) list.sort((a, b) => a.length - b.length)
  return index
}

export function fakeMealFromDescription(description, index) {
  const text = String(description || '').trim()
  if (!text) return DEFAULT_MEAL
  const parts = text.split(/,|\+|;|\bet\b|\bavec\b/i).map((p) => p.trim()).filter(Boolean)
  const ingredients = []
  for (const part of parts) {
    const count = Number(part.match(/^(\d+(?:[.,]\d+)?)/)?.[1]?.replace(',', '.')) || 1
    const words = norm(part).split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w) && !/^\d/.test(w))
    const hit = words.map(singular).map((w) => ALIAS[w] || w).find((w) => index.has(w))
    if (!hit) continue
    const ingredient = index.get(hit)[0]
    if (ingredients.some((i) => i.ingredient === ingredient)) continue
    ingredients.push({ ingredient, quantity_g: Math.round(PORTION_G * Math.min(count, 5)) })
  }
  if (!ingredients.length) return DEFAULT_MEAL
  const dish = text.length > 60 ? `${text.slice(0, 57)}…` : text
  return { dish: dish[0].toUpperCase() + dish.slice(1), ingredients }
}
