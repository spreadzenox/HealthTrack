/**
 * Repas → ventre avec délais (jalon 5, I132) : trois fenêtres fixées d'avance, pas un balayage.
 *
 * Unité d'analyse : chaque note du ventre horodatée (Calme / Gêne / Douleur). Pour une note à l'instant t et une
 * fenêtre [de, à[, un aliment est « présent » s'il figure dans un repas pris entre t − à et t − de (toujours AVANT la
 * note : X précède Y). On compare la part de notes « gêne ou douleur » quand l'aliment est présent et quand il ne
 * l'est pas (test exact de Fisher), puis on corrige pour toutes les combinaisons aliment × fenêtre testées
 * (Benjamini-Hochberg). Moins de fenêtres = moins de comparaisons = plus de puissance.
 *
 * Les fenêtres et leurs repères (FODMAP par groupe) ne sont que des hypothèses de départ affichées comme telles
 * (règle D6) : seules les données de la personne décident. Le ventre n'est jamais une entrée de l'estimateur du
 * bien-être (règle anti-circularité). Le seuil minimal de notes est provisoire : I133 le fixera par simulation.
 */
import { localDateKey } from './analysisEngine'
import { computeTotalsFromItems } from './nutritionKPIs'
import { benjaminiHochberg, fisherExactTwoSided } from './statistics'
import { GUT_TYPE } from './today'

export const GUT_WINDOWS = [
  {
    id: '0-4', fromH: 0, toH: 4, label: '0–4 h',
    hypothesis: 'Souvent le réflexe de l’intestin après le repas, plutôt que les FODMAP (repère général).',
  },
  {
    id: '4-24', fromH: 4, toH: 24, label: '4–24 h',
    hypothesis: 'Fructanes (blé, oignon, ail) et GOS (légumineuses) : souvent dans cet intervalle (repère général).',
  },
  {
    id: '24-48', fromH: 24, toH: 48, label: '24–48 h',
    hypothesis: 'Polyols et édulcorants : parfois jusqu’à 1 ou 2 jours après (repère général).',
  },
]

/** Facteur « repas riche en FODMAP » : hypothèse de départ issue d'une table générale, jamais un verdict. */
export const FODMAP_FACTOR = 'fodmap_eleve'

/** Notes minimales avec et sans l'aliment dans une fenêtre avant de tester (provisoire, calibré par I133). */
export const MIN_EXPOSED_NOTES = 8
export const MIN_UNEXPOSED_NOTES = 8
/** Seuil de q (après correction) pour parler de « lien repéré ». */
export const GUT_LINK_MAX_Q = 0.1

const H = 3_600_000
const SYMPTOM_LEVELS = new Set(['discomfort', 'pain'])
const KNOWN_LEVELS = new Set(['calm', ...SYMPTOM_LEVELS])

const normalize = (name) => String(name || '').trim().toLocaleLowerCase('fr-FR')

function mealFactors(meal) {
  const items = meal.payload?.items
  if (!Array.isArray(items)) return []
  const factors = new Set(items.map((it) => normalize(it.ingredient)).filter(Boolean))
  if (factors.size === 0) return []
  try {
    if (computeTotalsFromItems(items).fodmap_score >= 2) factors.add(FODMAP_FACTOR)
  } catch {
    // Table nutritionnelle pas chargée : on garde seulement les aliments.
  }
  return [...factors]
}

/**
 * Aliments présents avant une note, par fenêtre.
 * @param {{ at: string }} note
 * @param {{ at: string, factors: string[] }[]} meals
 * @returns {Record<string, Set<string>>}
 */
export function mealExposures(note, meals) {
  const t = Date.parse(note.at)
  const out = Object.fromEntries(GUT_WINDOWS.map((w) => [w.id, new Set()]))
  for (const m of meals) {
    const dt = t - Date.parse(m.at)
    if (!(dt >= 0)) continue
    const w = GUT_WINDOWS.find((win) => dt >= win.fromH * H && dt < win.toH * H)
    if (!w) continue
    for (const f of m.factors) out[w.id].add(f)
  }
  return out
}

/**
 * @param {object[]} entries  entrées `food` et `gut` (les autres sont ignorées)
 * @returns {{ notes: number, tested: number, results: {
 *   factor: string, window: string, status: 'link'|'no_link'|'too_early',
 *   exposed: { notes: number, symptoms: number }, unexposed: { notes: number, symptoms: number },
 *   rr: number|null, p: number|null, q: number|null, days: number }[] }}
 */
export function analyzeGutWindows(entries) {
  const meals = []
  const notes = []
  for (const e of entries || []) {
    if (!e?.at || Number.isNaN(Date.parse(e.at))) continue
    if (e.type === 'food') {
      const factors = mealFactors(e)
      if (factors.length) meals.push({ at: e.at, factors })
    } else if (e.type === GUT_TYPE && KNOWN_LEVELS.has(e.payload?.level)) {
      notes.push(e)
    }
  }
  if (notes.length === 0 || meals.length === 0) return { notes: notes.length, tested: 0, results: [] }

  const factors = [...new Set(meals.flatMap((m) => m.factors))].sort()
  const exposures = notes.map((n) => mealExposures(n, meals))
  const days = new Set(notes.map((n) => localDateKey(n.at))).size

  const results = []
  for (const factor of factors) {
    for (const w of GUT_WINDOWS) {
      const exposed = { notes: 0, symptoms: 0 }
      const unexposed = { notes: 0, symptoms: 0 }
      notes.forEach((n, i) => {
        const bucket = exposures[i][w.id].has(factor) ? exposed : unexposed
        bucket.notes += 1
        if (SYMPTOM_LEVELS.has(n.payload.level)) bucket.symptoms += 1
      })
      if (exposed.notes === 0) continue
      const enough = exposed.notes >= MIN_EXPOSED_NOTES && unexposed.notes >= MIN_UNEXPOSED_NOTES
      // Correction de Haldane (+0,5) : un rapport lisible même avec un zéro.
      const rr = enough
        ? ((exposed.symptoms + 0.5) / (exposed.notes + 1)) / ((unexposed.symptoms + 0.5) / (unexposed.notes + 1))
        : null
      const p = enough
        ? fisherExactTwoSided(exposed.symptoms, exposed.notes - exposed.symptoms, unexposed.symptoms, unexposed.notes - unexposed.symptoms)
        : null
      results.push({ factor, window: w.id, status: enough ? 'no_link' : 'too_early', exposed, unexposed, rr, p, q: null, days })
    }
  }

  const tested = results.filter((r) => r.p != null)
  const qs = benjaminiHochberg(tested.map((r) => r.p))
  tested.forEach((r, i) => {
    r.q = qs[i]
    if (r.q < GUT_LINK_MAX_Q) r.status = 'link'
  })
  return { notes: notes.length, tested: tested.length, results }
}
