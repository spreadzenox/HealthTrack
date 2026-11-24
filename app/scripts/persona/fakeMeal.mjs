// Faux relais des personas : l'analyse d'un repas décrit par écrit reprend les mots de la description
// (PERSONAS-OUTIL-2). Un aliment par morceau de la description (virgules, « et », « + », « avec »), cherché dans la
// table nutritionnelle par son premier mot, accents compris d'abord (« pâtes » n'est pas « pâté »), sans accents
// ensuite ; « 200 g » ou « 1,5 kg » donne la quantité ; le nom du plat est le premier morceau, sans sa quantité
// (PERSONAS-OUTIL-3) ; rien de reconnu : le plat de démonstration d'avant.
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
const WORD = /[^a-z0-9à-ÿœæ]+/
const UNIT_G = { g: 1, gr: 1, kg: 1000, ml: 1, cl: 10, l: 1000 }
const QUANTITY = /^(\d+(?:[.,]\d+)?)\s*(kg|gr|g|ml|cl|l)?(?![a-zà-ÿ])/i
const LEAD = /^(\d+(?:[.,]\d+)?\s*(kg|gr|g|ml|cl|l)?(?![a-zà-ÿ])\s*)?((de|du|des|d')\s*)?/i

// Index : premier mot tel qu'écrit (minuscules, accents gardés), et « ~ » + le même sans accents → noms de la
// table, le plus court d'abord (le plus générique)
export function buildIndex(names) {
  const index = new Map()
  const add = (key, name) => {
    if (!index.has(key)) index.set(key, [])
    index.get(key).push(name)
  }
  for (const name of names) {
    const first = name.toLowerCase().split(WORD)[0] || ''
    if (!first) continue
    add(first, name)
    add(`~${norm(first)}`, name)
  }
  for (const list of index.values()) list.sort((a, b) => a.length - b.length)
  return index
}

// Clés essayées pour un mot, de la plus exacte à la plus large
function lookup(word, index) {
  const w = ALIAS[norm(singular(word))] || word
  const keys = [w, singular(w), `${w}s`, `~${norm(w)}`, `~${norm(singular(w))}`, `~${norm(w)}s`]
  const key = keys.find((k) => index.has(k))
  return key ? index.get(key)[0] : null
}

export function fakeMealFromDescription(description, index) {
  const text = String(description || '').trim()
  if (!text) return DEFAULT_MEAL
  const parts = text.split(/(?<!\d),|,(?!\d)|\+|;|\bet\b|\bavec\b/i).map((p) => p.trim()).filter(Boolean)
  const ingredients = []
  for (const part of parts) {
    const [, number, unit] = part.match(QUANTITY) || []
    const value = Number(number?.replace(',', '.')) || 1
    const quantity_g = unit ? value * UNIT_G[unit.toLowerCase()] : PORTION_G * Math.min(value, 5)
    const words = part.toLowerCase().split(WORD).filter((w) => w && !STOP.has(norm(w)) && !/^\d/.test(w) && !UNIT_G[w])
    const ingredient = words.map((w) => lookup(w, index)).find(Boolean)
    if (!ingredient) continue
    if (ingredients.some((i) => i.ingredient === ingredient)) continue
    ingredients.push({ ingredient, quantity_g: Math.round(quantity_g) })
  }
  if (!ingredients.length) return DEFAULT_MEAL
  const first = parts[0].replace(LEAD, '').trim() || parts[0]
  const dish = first.length > 40 ? `${first.slice(0, 37)}…` : first
  return { dish: dish[0].toUpperCase() + dish.slice(1), ingredients }
}
