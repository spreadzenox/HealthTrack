/**
 * FODMAP par sous-groupe (demande du propriétaire du 26/10) : au lieu d'un score générique, une estimation par
 * portion pour chacun des six groupes de la réintroduction (mêmes id que FODMAP_GROUPS de fodmapChallenge.js).
 * Pur : la table nutritionnelle et les mesures publiées sont passées en paramètres.
 *
 * D'où vient chaque valeur :
 * - lactose : Ciqual (`lactose_g`) ;
 * - fructose en excès du glucose : Ciqual (`fructose_g` − `glucose_g`, 0 si le glucose couvre le fructose) ;
 * - sorbitol, mannitol : Ciqual ne publie que les polyols totaux (`polyols_g`) ; s'ils valent 0, les deux valent 0,
 *   sinon la répartition vient des mesures publiées (`fodmapMeasurements.json`) ou reste inconnue ;
 * - fructanes, GOS : mesures publiées seulement (`fodmapMeasurements.json`), sinon inconnus.
 * Une teneur Ciqual « < x » (sous la limite de détection) compte 0 avec le statut `traces` : la moitié de la limite,
 * utile pour les totaux nutritionnels, ferait apparaître du lactose dans l'oignon.
 *
 * Repères de départ par portion (Varney J et al., « FODMAPs: food composition, defining cutoff values and
 * international application », J Gastroenterol Hepatol 2017;32 Suppl 1:53-61, PMID 28244665) : oligosaccharides
 * 0,3 g, fructose en excès 0,15 g, lactose 1 g, polyols 0,4 g. Le repère des oligosaccharides vaut ici pour les
 * fructanes et les GOS séparément, celui des polyols pour le sorbitol et le mannitol séparément (et pour leur
 * somme quand seule celle-ci est connue). Ce sont des hypothèses de départ, pas des normes (règle 6) : les données
 * personnelles priment.
 */

export const FODMAP_SUBGROUPS = ['fructans', 'gos', 'fructose', 'lactose', 'sorbitol', 'mannitol']

/** Repères de départ par portion, en grammes (voir la source plus haut). */
export const SERVING_CUTOFFS_G = {
  fructans: 0.3, gos: 0.3, fructose: 0.15, lactose: 1, sorbitol: 0.4, mannitol: 0.4, polyols: 0.4,
}

export const CUTOFFS_SOURCE = 'Varney J et al. J Gastroenterol Hepatol 2017;32 Suppl 1:53-61 (PMID 28244665)'

const CIQUAL = 'Ciqual'

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const belowDetection = (food, field) => typeof food?._q?.[field] === 'string' && food._q[field].startsWith('<')

/** Valeur Ciqual d'un champ : { g, status } avec status `mesuré`, `traces` ou `inconnu`. */
function ciqualValue(food, field) {
  if (belowDetection(food, field)) return { g: 0, status: 'traces' }
  if (!isNum(food?.[field])) return { g: null, status: 'inconnu' }
  if (food._q?.[field] === 'traces') return { g: 0, status: 'traces' }
  return { g: food[field], status: 'mesuré' }
}

const unknown = () => ({ g: null, status: 'inconnu', source: null })

/**
 * Teneurs pour 100 g d'un aliment de la table.
 * @param {object} food entrée de ingredientsNutrition.json
 * @param {object} [published] entrée de fodmapMeasurements.json (foods[nom]) pour cet aliment
 * @returns {{ [group: string]: { g: number|null, status: string, source: string|null, confidence?: string } }}
 */
export function fodmapPer100g(food, published) {
  const out = Object.fromEntries(FODMAP_SUBGROUPS.map((g) => [g, unknown()]))
  if (!food) return out

  const lactose = ciqualValue(food, 'lactose_g')
  out.lactose = { ...lactose, source: lactose.g == null ? null : CIQUAL }

  const fru = ciqualValue(food, 'fructose_g')
  const glu = ciqualValue(food, 'glucose_g')
  if (fru.g === 0) {
    out.fructose = { g: 0, status: fru.status, source: CIQUAL }
  } else if (fru.g != null && glu.g != null) {
    // glucose sous la limite de détection : on ne sait pas combien il couvre, confiance basse
    out.fructose = { g: Math.max(0, fru.g - glu.g), status: glu.status === 'traces' ? 'approché' : 'mesuré', source: CIQUAL }
  }

  const polyols = ciqualValue(food, 'polyols_g')
  if (polyols.g === 0) {
    out.sorbitol = { g: 0, status: polyols.status, source: CIQUAL }
    out.mannitol = { g: 0, status: polyols.status, source: CIQUAL }
  }

  if (published) {
    for (const group of ['fructans', 'gos', 'sorbitol', 'mannitol']) {
      const v = published[`${group}_g`]
      if (!isNum(v) || out[group].status !== 'inconnu') continue
      out[group] = {
        g: v,
        status: published.confidence === 'analogie' ? 'approché' : 'mesuré',
        source: published.source ?? null,
        confidence: published.confidence === 'analogie' ? 'basse' : 'mesure',
      }
    }
  }
  out.polyolsTotal = polyols.g
  return out
}

const round3 = (x) => Math.round(x * 1000) / 1000

/**
 * Estimation pour un repas : grammes par sous-groupe, aliments qui en apportent, et niveau par rapport au repère.
 * `level` : `élevé` (au-dessus du repère, même si d'autres aliments sont inconnus), `bas` (tous les aliments sont
 * connus pour ce groupe et le total reste sous le repère) ou `inconnu`.
 * @param {{ ingredient: string, quantity_g?: number }[]} items
 * @param {object} table ingredientsNutrition (nom → valeurs pour 100 g)
 * @param {{ foods?: object }} [measurements] fodmapMeasurements.json
 */
export function estimateMealFodmap(items, table, measurements = {}) {
  const groups = Object.fromEntries(FODMAP_SUBGROUPS.map((g) => [g, { g: 0, unknownFoods: [], contributors: [] }]))
  let polyolsTotal = 0
  let polyolsKnown = true
  let counted = 0

  for (const it of Array.isArray(items) ? items : []) {
    const name = (it?.ingredient || '').trim()
    const qty = Number(it?.quantity_g)
    if (!name || !(qty > 0)) continue
    counted++
    const food = table?.[name]
    const per100 = fodmapPer100g(food, measurements.foods?.[name] ?? measurements.foods?.[food?.alias_of])
    const factor = qty / 100
    for (const group of FODMAP_SUBGROUPS) {
      const v = per100[group]
      if (v.g == null) { groups[group].unknownFoods.push(name); continue }
      const grams = v.g * factor
      groups[group].g += grams
      if (grams > 0) groups[group].contributors.push({ ingredient: name, g: round3(grams), status: v.status, source: v.source })
    }
    if (per100.polyolsTotal == null) polyolsKnown = false
    else polyolsTotal += per100.polyolsTotal * factor
  }

  const result = {}
  for (const group of FODMAP_SUBGROUPS) {
    const { g, unknownFoods, contributors } = groups[group]
    const cutoff = SERVING_CUTOFFS_G[group]
    let level = 'inconnu'
    if (counted > 0 && g >= cutoff) level = 'élevé'
    else if (counted > 0 && unknownFoods.length === 0) level = 'bas'
    result[group] = {
      g: round3(g),
      level,
      cutoff,
      contributors: contributors.sort((a, b) => b.g - a.g),
      unknownFoods,
    }
  }
  // Polyols totaux connus et sous le repère : ni le sorbitol ni le mannitol ne peuvent le dépasser.
  if (counted > 0 && polyolsKnown && polyolsTotal < SERVING_CUTOFFS_G.polyols) {
    for (const group of ['sorbitol', 'mannitol']) {
      if (result[group].level === 'inconnu') result[group].level = 'bas'
    }
  }
  result.polyols = { g: polyolsKnown && counted > 0 ? round3(polyolsTotal) : null, cutoff: SERVING_CUTOFFS_G.polyols }
  return result
}

/** Groupes au-dessus du repère pour un repas, du plus chargé (rapport au repère) au moins chargé. */
export function highFodmapGroups(estimate) {
  return FODMAP_SUBGROUPS
    .filter((g) => estimate?.[g]?.level === 'élevé')
    .sort((a, b) => estimate[b].g / estimate[b].cutoff - estimate[a].g / estimate[a].cutoff)
}
