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
 * utile pour les totaux nutritionnels, ferait apparaître du lactose dans l'oignon. La limite est gardée (`max`) : un
 * repas n'est `bas` que si le total, limites comprises, reste sous le repère (polyols « < 0,5 » : 100 g d'avocat
 * pourraient contenir 0,5 g, au-dessus du repère de 0,4 g).
 *
 * Mesures publiées (`fodmapMeasurements.json`, une entrée par groupe) : `g` pour 100 g, ou pour le sorbitol et le
 * mannitol `share`, la part des polyols totaux Ciqual (Ciqual d'abord, la source ne sert qu'à répartir). Une mesure
 * publiée ne remplace jamais une valeur Ciqual, sauf une teneur « < x » qu'elle précise sans la contredire (≤ x).
 * Confiance `analogie` (aliment proche, répartition supposée) ou `citée` (valeur citée par une revue) : basse.
 * GOS des légumineuses cuites : calculés depuis leur mesure à sec (scripts/nutrition/legumeGos.mjs, `derivation`).
 * Fourchette (N3d) : quand deux mesures publiées divergent de plus de 2 fois (pain, poireau, oignon), `g_high` donne
 * la borne haute (`high`). Les repères ont été fixés avec la série de mesures la plus haute : un repas n'est alors
 * jamais `bas` si la borne haute dépasse le repère, mais `probable` (compté comme mangé dans les pistes).
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

/** Limite de détection d'une teneur « < x » (en g/100 g), sinon null. */
function detectionLimit(food, field) {
  const q = food?._q?.[field]
  if (typeof q !== 'string' || !q.startsWith('<')) return null
  const x = Number(q.slice(1).replace(',', '.'))
  return Number.isFinite(x) ? x : null
}

/** Valeur Ciqual d'un champ : { g, status, max? } avec status `mesuré`, `traces` ou `inconnu`. */
function ciqualValue(food, field) {
  const limit = detectionLimit(food, field)
  if (limit != null) return { g: 0, status: 'traces', max: limit }
  if (typeof food?._q?.[field] === 'string' && food._q[field].startsWith('<')) return { g: 0, status: 'traces' }
  if (!isNum(food?.[field])) return { g: null, status: 'inconnu' }
  if (food._q?.[field] === 'traces') return { g: 0, status: 'traces' }
  return { g: food[field], status: 'mesuré' }
}

const unknown = () => ({ g: null, status: 'inconnu', source: null })
const LOW_CONFIDENCE = new Set(['analogie', 'citée'])

function fromPublished(entry, g, source = entry.source ?? null) {
  const low = LOW_CONFIDENCE.has(entry.confidence)
  const out = { g, status: low ? 'approché' : 'mesuré', source, confidence: low ? 'basse' : 'mesure' }
  if (isNum(entry.g_high) && entry.g_high > g) Object.assign(out, { high: entry.g_high, sourceHigh: entry.source_high ?? null })
  return out
}

/**
 * Teneurs pour 100 g d'un aliment de la table.
 * @param {object} food entrée de ingredientsNutrition.json
 * @param {object} [published] entrée de fodmapMeasurements.json (foods[nom]) pour cet aliment
 * @returns {{ [group: string]: { g: number|null, status: string, source: string|null, confidence?: string, max?: number, high?: number, sourceHigh?: string } }}
 */
export function fodmapPer100g(food, published) {
  const out = Object.fromEntries(FODMAP_SUBGROUPS.map((g) => [g, unknown()]))
  if (!food) return out
  const withSource = (v) => ({ ...v, source: v.g == null ? null : CIQUAL })

  out.lactose = withSource(ciqualValue(food, 'lactose_g'))

  const fru = ciqualValue(food, 'fructose_g')
  const glu = ciqualValue(food, 'glucose_g')
  if (fru.g === 0) {
    out.fructose = withSource(fru)
  } else if (fru.g != null && glu.g != null) {
    // glucose sous la limite de détection : on ne sait pas combien il couvre, confiance basse
    out.fructose = { g: Math.max(0, fru.g - glu.g), status: glu.status === 'traces' ? 'approché' : 'mesuré', source: CIQUAL }
  }

  const polyols = ciqualValue(food, 'polyols_g')
  if (polyols.g === 0) {
    out.sorbitol = withSource(polyols)
    out.mannitol = withSource(polyols)
  }

  for (const group of ['fructans', 'gos', 'sorbitol', 'mannitol']) {
    const entry = published?.[group]
    if (!entry) continue
    const current = out[group]
    const isPolyol = group === 'sorbitol' || group === 'mannitol'
    const ciqualTotal = isPolyol && polyols.status === 'mesuré' ? polyols.g : null
    if (isNum(entry.share) && ciqualTotal > 0) {
      out[group] = fromPublished(entry, ciqualTotal * entry.share, `${CIQUAL} + ${entry.source}`)
    } else if (!isNum(entry.g)) {
      continue
    } else if (current.status === 'inconnu' && (ciqualTotal == null || entry.g <= ciqualTotal)) {
      out[group] = fromPublished(entry, entry.g)
    } else if (current.status === 'traces' && current.max != null && entry.g <= current.max) {
      out[group] = fromPublished(entry, entry.g) // précise une teneur « < x » sans la contredire
    }
  }
  out.polyolsTotal = polyols.g
  out.polyolsMax = polyols.g == null ? null : polyols.g + (polyols.max ?? 0)
  return out
}

const round3 = (x) => Math.round(x * 1000) / 1000

/**
 * Estimation pour un repas : grammes par sous-groupe, aliments qui en apportent, et niveau par rapport au repère.
 * `level` : `élevé` (au-dessus du repère, même si d'autres aliments sont inconnus), `probable` (seule la borne haute
 * d'une fourchette de mesures publiées dépasse le repère), `bas` (tous les aliments sont connus pour ce groupe et le
 * total reste sous le repère, bornes hautes comprises) ou `inconnu`. `high` : total avec les bornes hautes.
 * @param {{ ingredient: string, quantity_g?: number }[]} items
 * @param {object} table ingredientsNutrition (nom → valeurs pour 100 g)
 * @param {{ foods?: object }} [measurements] fodmapMeasurements.json
 */
export function estimateMealFodmap(items, table, measurements = {}) {
  const groups = Object.fromEntries(FODMAP_SUBGROUPS.map((g) => [g, { g: 0, max: 0, high: 0, unknownFoods: [], contributors: [] }]))
  let polyolsTotal = 0
  let polyolsMax = 0
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
      groups[group].max += grams + (v.max ?? 0) * factor
      groups[group].high += (v.high ?? v.g) * factor
      if (grams > 0) {
        const c = { ingredient: name, g: round3(grams), status: v.status, source: v.source }
        if (v.high != null) Object.assign(c, { high: round3(v.high * factor), sourceHigh: v.sourceHigh })
        groups[group].contributors.push(c)
      }
    }
    if (per100.polyolsTotal == null) polyolsKnown = false
    else {
      polyolsTotal += per100.polyolsTotal * factor
      polyolsMax += per100.polyolsMax * factor
    }
  }

  const result = {}
  for (const group of FODMAP_SUBGROUPS) {
    const { g, max, high, unknownFoods, contributors } = groups[group]
    const cutoff = SERVING_CUTOFFS_G[group]
    let level = 'inconnu'
    if (counted > 0 && g >= cutoff) level = 'élevé'
    else if (counted > 0 && high >= cutoff) level = 'probable'
    // « < x » : bas seulement si le total reste sous le repère même au plafond des limites de détection
    else if (counted > 0 && unknownFoods.length === 0 && max < cutoff) level = 'bas'
    result[group] = {
      g: round3(g),
      ...(high > g ? { high: round3(high) } : {}),
      level,
      cutoff,
      contributors: contributors.sort((a, b) => b.g - a.g),
      unknownFoods,
    }
  }
  // Polyols totaux connus et sous le repère (limites comprises) : ni le sorbitol ni le mannitol ne peuvent le dépasser.
  if (counted > 0 && polyolsKnown && polyolsMax < SERVING_CUTOFFS_G.polyols) {
    for (const group of ['sorbitol', 'mannitol']) {
      if (result[group].level === 'inconnu') result[group].level = 'bas'
    }
  }
  result.polyols = { g: polyolsKnown && counted > 0 ? round3(polyolsTotal) : null, cutoff: SERVING_CUTOFFS_G.polyols }
  return result
}

const HIGH_LEVELS = new Set(['élevé', 'probable'])
const load = (e) => (e.high ?? e.g) / e.cutoff

/**
 * Groupes au-dessus du repère pour un repas (`probable` compris : un sandwich ne compte pas comme un jour sans
 * fructanes dans les pistes), du plus chargé (rapport au repère, borne haute) au moins chargé.
 */
export function highFodmapGroups(estimate) {
  return FODMAP_SUBGROUPS
    .filter((g) => HIGH_LEVELS.has(estimate?.[g]?.level))
    .sort((a, b) => load(estimate[b]) - load(estimate[a]))
}

/**
 * Ce que la carte d'un repas dit des FODMAP (N4) : pour chaque groupe au-dessus du repère, les aliments qui en
 * apportent le plus (3 au plus) et `probable` quand le repère n'est dépassé qu'en comptant des valeurs à confiance
 * basse (analogie, valeur citée, glucose sous la limite de détection) ou avec la borne haute d'une fourchette
 * (`high` : « 0,1 à 0,8 g »).
 * `sources` : clés des sources de ces teneurs (`Ciqual` ou clés de `fodmapMeasurements.json`), pour les citer.
 * @returns {{ group: string, foods: string[], probable: boolean, g: number, high?: number, cutoff: number, sources: string[] }[]}
 */
export function mealFodmapHighlights(estimate) {
  return highFodmapGroups(estimate).map((group) => {
    const { g, high, cutoff, contributors } = estimate[group]
    const sure = contributors.filter((c) => c.status === 'mesuré').reduce((s, c) => s + c.g, 0)
    const sources = [...new Set(contributors.flatMap((c) => [
      ...(c.source ? c.source.split(' + ') : []), ...(c.sourceHigh ? [c.sourceHigh] : []),
    ]))]
    const foods = contributors.slice(0, 3).map((c) => c.ingredient)
    return { group, foods, probable: sure < cutoff, g, ...(high != null ? { high } : {}), cutoff, sources }
  })
}
