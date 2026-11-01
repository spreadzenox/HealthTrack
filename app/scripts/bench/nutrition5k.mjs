/**
 * Banc Silver / Gold sur des assiettes pesées du jeu public Nutrition5k (GOLD-b5, décision du 31/10 vers 22:45).
 *
 * Nutrition5k (Google Research, CC BY 4.0) : https://github.com/google-research-datasets/Nutrition5k — photos vues de
 * dessus d'assiettes de cafétéria, chaque ingrédient pesé. Les images sont téléchargées pendant le banc (CI) et jamais
 * commitées. Ce module ne fait aucun accès réseau : lecture des métadonnées, choix des assiettes, notation, verdict.
 *
 * Mesures (par assiette, pour chaque niveau) :
 * - erreur absolue sur la masse totale (g) : l'estimation des quantités ;
 * - erreur absolue sur l'énergie (kcal), les protéines, les glucides et les lipides (g), calculés avec la table de
 *   l'app (ingredientsNutrition.json, Ciqual) à partir des ingrédients reconnus : ces erreurs mêlent la reconnaissance
 *   des ingrédients et les quantités.
 *
 * Verdict prudent (droit de la consommation, règles Play) : la promesse « Gold fait moins d'erreurs » n'est confirmée
 * que si, sur la masse ET sur l'énergie, l'intervalle de confiance à 95 % (bootstrap apparié) de l'écart d'erreur
 * Silver − Gold est entièrement au-dessus de zéro. Le chiffre affichable est la borne basse de cet intervalle,
 * rapportée à l'erreur de Silver et arrondie à 5 % en dessous ; sous 10 %, pas de chiffre.
 */
import { createHash } from 'node:crypto'

export const DATASET_ROOT = 'https://storage.googleapis.com/nutrition5k_dataset/nutrition5k_dataset'
export const METADATA_URL = `${DATASET_ROOT}/metadata/dish_metadata_cafe1.csv`
export const imageUrl = (dishId) => `${DATASET_ROOT}/imagery/realsense_overhead/${dishId}/rgb.png`
export const ATTRIBUTION = 'Nutrition5k, Google Research (Thames et al., CVPR 2021), CC BY 4.0'

export const METRICS = ['mass', 'kcal', 'protein', 'carb', 'fat']
/** Mesures qui décident du verdict. */
export const VERDICT_METRICS = ['mass', 'kcal']

const num = (v) => {
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Lit dish_metadata_cafe1.csv : par ligne, dish_id, kcal, masse, lipides, glucides, protéines, puis par ingrédient
 * 7 colonnes (id, nom, grammes, kcal, lipides, glucides, protéines). Les lignes illisibles sont ignorées.
 */
export function parseMetadata(csv) {
  const dishes = []
  for (const line of String(csv).split(/\r?\n/)) {
    const cells = line.split(',')
    if (!/^dish_\d+$/.test(cells[0] ?? '')) continue
    const [id, kcal, mass, fat, carb, protein] = [cells[0], ...cells.slice(1, 6).map(num)]
    if ([kcal, mass, fat, carb, protein].some((v) => v === null)) continue
    const ingredients = []
    for (let i = 6; i + 6 < cells.length; i += 7) {
      const grams = num(cells[i + 2])
      if (grams !== null) ingredients.push({ name: cells[i + 1].trim(), grams })
    }
    dishes.push({ id, mass, kcal, fat, carb, protein, ingredients })
  }
  return dishes
}

const rank = (id) => createHash('sha256').update(`halcya-bench:${id}`).digest('hex')

/**
 * Assiettes candidates, dans un ordre fixe (empreinte de l'identifiant) : de 2 à 8 ingrédients, de 80 à 900 g.
 * Le banc prend les premières dont la photo existe, jusqu'au nombre voulu.
 */
export function candidateDishes(dishes) {
  return dishes
    .filter((d) => d.ingredients.length >= 2 && d.ingredients.length <= 8 && d.mass >= 80 && d.mass <= 900)
    .sort((a, b) => (rank(a.id) < rank(b.id) ? -1 : 1))
}

/** Totaux prédits à partir de la réponse du modèle et de la table de l'app (valeurs pour 100 g). */
export function predictTotals(parsed, table) {
  const out = { mass: 0, kcal: 0, protein: 0, carb: 0, fat: 0, unknown: 0 }
  for (const item of parsed?.ingredients ?? []) {
    const grams = Number(item?.quantity_g)
    if (!Number.isFinite(grams) || grams <= 0) continue
    out.mass += grams
    const row = table[item.ingredient]
    if (!row) {
      out.unknown += 1
      continue
    }
    const k = grams / 100
    out.kcal += (row.energy_kcal ?? 0) * k
    out.protein += (row.protein_g ?? 0) * k
    out.carb += (row.carbohydrates_g ?? 0) * k
    out.fat += (row.fat_g ?? 0) * k
  }
  return out
}

/** Erreurs absolues d'une assiette. */
export function scoreDish(truth, predicted) {
  return Object.fromEntries(METRICS.map((m) => [m, Math.abs(predicted[m] - truth[m])]))
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length

/** Générateur pseudo-aléatoire à graine (mulberry32) : le verdict ne change pas d'une exécution à l'autre. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** IC 95 % (percentiles) de la moyenne des écarts appariés, par bootstrap. */
export function bootstrapMeanCI(diffs, { resamples = 4000, seed = 20261031 } = {}) {
  const rand = rng(seed)
  const means = []
  for (let r = 0; r < resamples; r += 1) {
    let s = 0
    for (let i = 0; i < diffs.length; i += 1) s += diffs[Math.floor(rand() * diffs.length)]
    means.push(s / diffs.length)
  }
  means.sort((a, b) => a - b)
  return [means[Math.floor(0.025 * resamples)], means[Math.ceil(0.975 * resamples) - 1]]
}

/**
 * @param {{ dish: string, silver: object|null, gold: object|null }[]} rows erreurs par assiette (null si le niveau n'a
 *   pas répondu, ou si Gold a été servi par Flash-Lite : la mesure est alors écartée)
 */
export function summarize(rows, { minPairs = 30 } = {}) {
  const pairs = rows.filter((r) => r.silver && r.gold)
  const metrics = {}
  for (const m of METRICS) {
    const s = pairs.map((r) => r.silver[m])
    const g = pairs.map((r) => r.gold[m])
    if (!pairs.length) {
      metrics[m] = null
      continue
    }
    const diffs = pairs.map((r) => r.silver[m] - r.gold[m])
    const [low, high] = bootstrapMeanCI(diffs)
    const maeSilver = mean(s)
    metrics[m] = {
      maeSilver,
      maeGold: mean(g),
      reduction: maeSilver > 0 ? 1 - mean(g) / maeSilver : 0,
      diffCI: [low, high],
      goldBetter: pairs.filter((r) => r.gold[m] < r.silver[m]).length,
    }
  }
  const enough = pairs.length >= minPairs
  const confirmed = enough && VERDICT_METRICS.every((m) => metrics[m] && metrics[m].diffCI[0] > 0)
  let claimPercent = null
  if (confirmed) {
    const conservative = Math.min(...VERDICT_METRICS.map((m) => metrics[m].diffCI[0] / metrics[m].maeSilver))
    const rounded = Math.floor((conservative * 100) / 5) * 5
    claimPercent = rounded >= 10 ? rounded : null
  }
  return { pairs: pairs.length, dishes: rows.length, enough, confirmed, claimPercent, metrics }
}

const fmt = (v, d = 0) => (v === null || v === undefined ? '—' : v.toFixed(d).replace('.', ','))

/** Résumé Markdown pour le workflow (aucun nom de modèle n'en sort vers l'app). */
export function markdownReport(summary, { costEur = null, servedLite = 0 } = {}) {
  const label = { mass: 'Masse (g)', kcal: 'Énergie (kcal)', protein: 'Protéines (g)', carb: 'Glucides (g)', fat: 'Lipides (g)' }
  const lines = [
    '## Banc Silver / Gold — Nutrition5k',
    '',
    `- Assiettes : ${summary.dishes}, paires exploitables : ${summary.pairs}` + (servedLite ? ` (${servedLite} mesure(s) Gold servie(s) par Flash-Lite, écartée(s))` : ''),
    costEur !== null ? `- Coût Vertex du banc : ${fmt(costEur, 2)} €` : null,
    `- Données : ${ATTRIBUTION}`,
    '',
    '| Mesure | Erreur moyenne Silver | Erreur moyenne Gold | Écart | IC 95 % (Silver − Gold) | Gold meilleur |',
    '|---|---|---|---|---|---|',
    ...METRICS.map((m) => {
      const x = summary.metrics[m]
      if (!x) return `| ${label[m]} | — | — | — | — | — |`
      return `| ${label[m]} | ${fmt(x.maeSilver, 1)} | ${fmt(x.maeGold, 1)} | ${fmt(-x.reduction * 100)} % | [${fmt(x.diffCI[0], 1)} ; ${fmt(x.diffCI[1], 1)}] | ${x.goldBetter}/${summary.pairs} |`
    }),
    '',
  ].filter((l) => l !== null)
  if (!summary.enough) lines.push(`**Verdict : pas assez de paires (${summary.pairs}) pour conclure.** Aucune promesse.`)
  else if (summary.confirmed) {
    lines.push(summary.claimPercent
      ? `**Verdict : confirmé.** Gold fait au moins ${summary.claimPercent} % d'erreurs en moins sur les quantités et l'énergie (borne basse de l'IC 95 %).`
      : '**Verdict : confirmé, sans chiffre net** (écart réel mais sous 10 % en borne basse).')
  } else lines.push('**Verdict : non confirmé.** Pas de promesse « moins d\'erreurs » ; prévenir le propriétaire.')
  return lines.join('\n')
}
