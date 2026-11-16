/**
 * Le temps long de l'îlot (specs/ile.SPEC.md § 8), en fonctions pures : les jours d'usage donnent la croissance, la
 * date et l'hémisphère donnent la saison. Rien ne fane ni ne recule : un jour sans rien ne retire rien, une absence
 * ne fait rien perdre (la croissance ne compte que les jours où quelque chose a été noté).
 */
import { clamp01 } from './easing.js'

/** Croissance complète après 90 jours d'usage (SPEC § 8). */
export const GROWTH_FULL_DAYS = 90
/** Mois 1 : un îlot voisin flotte à droite. Mois 3 : une mare. */
export const NEIGHBOR_DAYS = 30
export const POND_DAYS = 90
export const TUFTS_MIN = 14
export const TUFTS_MAX = 42

const smooth = (t) => t * t * (3 - 2 * t)

/**
 * Nombre de jours d'usage : jours distincts (clés AAAA-MM-JJ) où au moins une donnée a été notée. Les doublons et les
 * valeurs vides sont ignorés.
 */
export function countUsageDays(dayKeys) {
  const set = new Set()
  for (const k of dayKeys || []) if (typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k)) set.add(k)
  return set.size
}

/**
 * Croissance de l'îlot pour un nombre de jours d'usage : g ∈ [0, 1] (jours / 90, plafonné, lissé), échelles de
 * l'îlot (largeur × (1 + 0,3 g), hauteur × (1 + 0,12 g)), touffes d'herbe (14 → 42), l'arbuste qui devient un petit
 * arbre (× 1,45), l'îlot voisin (mois 1) et la mare (mois 3).
 */
export function islandGrowth(usageDays) {
  const days = Math.max(0, Math.floor(Number(usageDays) || 0))
  const g = smooth(clamp01(days / GROWTH_FULL_DAYS))
  const r = (v) => Math.round(v * 1000) / 1000
  return {
    days,
    g: r(g),
    widthScale: r(1 + 0.3 * g),
    heightScale: r(1 + 0.12 * g),
    tufts: Math.round(TUFTS_MIN + (TUFTS_MAX - TUFTS_MIN) * g),
    shrubScale: r(1 + 0.45 * g),
    tree: g >= 0.5,
    neighbor: days >= NEIGHBOR_DAYS,
    pond: days >= POND_DAYS,
  }
}

/**
 * Forme du contrat (CONTRAT.md § 5) : `growthAt(daysOfUse, date, { hemisphere = 'nord' })` →
 * `{ g, islandScaleXZ, islandScaleY, tufts, shrubScale, neighbourIsland, pond, season }`, plus en ajout `days` et
 * `tree` (l'arbuste est devenu un petit arbre). `hemisphere` : 'nord', 'sud', ou une latitude.
 */
export function growthAt(daysOfUse, date = new Date(), { hemisphere = 'nord' } = {}) {
  const g = islandGrowth(daysOfUse)
  return {
    g: g.g,
    islandScaleXZ: g.widthScale,
    islandScaleY: g.heightScale,
    tufts: g.tufts,
    shrubScale: g.shrubScale,
    neighbourIsland: g.neighbor,
    pond: g.pond,
    season: seasonOf(date, hemisphere),
    days: g.days,
    tree: g.tree,
  }
}

/**
 * Saison de l'îlot selon la date et l'hémisphère ('sud' ou une latitude < 0 : décalé de six mois) : 'automne' (feuillage
 * orange, herbe dorée), 'hiver' (calotte de neige), 'fin-hiver' (amandier en fleur), 'printemps-ete' (herbe vive).
 * Bornes au jour près : automne du 22/09, hiver du 21/12, fin d'hiver du 01/02, printemps du 21/03.
 */
export function seasonOf(date, latitude = null) {
  const d = date instanceof Date ? date : new Date(date)
  let month = d.getMonth() + 1
  const day = d.getDate()
  const south = latitude === 'sud' || (typeof latitude === 'number' && latitude < 0)
  if (south) month = ((month + 5) % 12) + 1
  const md = month * 100 + day
  if (md >= 1221 || md < 201) return 'hiver'
  if (md < 321) return 'fin-hiver'
  if (md < 922) return 'printemps-ete'
  return 'automne'
}

export const SEASON_LABEL = Object.freeze({
  automne: "L'automne est arrivé sur l'îlot",
  hiver: "L'hiver est arrivé sur l'îlot",
  'fin-hiver': "L'amandier de l'îlot est en fleur",
  'printemps-ete': "Le printemps est arrivé sur l'îlot",
})

/**
 * Ce qui est nouveau sur l'îlot depuis la dernière visite (deux sorties de growthAt, ou deux états { growth, season }), pour l'étiquette et le
 * petit saut de Pilou à l'ouverture. Une seule phrase, la plus marquante ; null si rien n'a changé.
 */
export function worldNews(previous, current) {
  if (!previous || !current) return null
  const pg = previous.growth || previous
  const cg = current.growth || current
  const neighbour = (x) => Boolean(x.neighbourIsland ?? x.neighbor)
  if (cg.pond && !pg.pond) return "Une mare est apparue sur l'îlot"
  if (neighbour(cg) && !neighbour(pg)) return 'Un îlot voisin est apparu'
  if (cg.tree && !pg.tree) return "L'arbuste est devenu un petit arbre"
  if (current.season && previous.season && current.season !== previous.season) return SEASON_LABEL[current.season] || null
  return null
}
