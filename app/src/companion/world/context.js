/**
 * Les entrées réelles du monde de Pilou, lues sur le téléphone (rien ne sort) : jours d'usage pour la croissance,
 * lever et coucher habituels pour le cycle du jour (lus dans le sommeil, sinon 7 h et 22 h 30), hémisphère et météo
 * du moment (réglages météo de l'app). Le widget appelle `loadWorldContext()` (la scène, `sleepHabitsForDay()`) au changement de jour,
 * puis passe ces valeurs à `lightAt`, `weatherDecor` et `growthAt` (index.js).
 */
import { listEntries, listEntryDays } from '../../storage/localHealthStorage'
import { localDateKey } from '../../services/analysisEngine'
import { computeSleepRegularity } from '../../services/sleepRegularity'
import { getWeatherSettings } from '../../services/weatherSync'
import { countUsageDays, GROWTH_FULL_DAYS, worldNews } from './growth.js'
import { worldDayKey } from './daylight.js'

/** Ce que la personne note elle-même : un jour avec l'une de ces sources est un jour d'usage. */
export const MANUAL_SOURCES = Object.freeze([
  'app_food',
  'app_wellbeing',
  'app_gut',
  'app_habit',
  'app_stool',
  'app_weight',
  'app_cigarette',
  'app_cycle',
  'app_context',
  'manual',
])

/** Les mesures automatiques (montre, Health Connect, météo, visage) ne comptent pas : seul ce qui est noté. */
export function usageDaysFromEntries(entries) {
  return countUsageDays(
    (entries || []).filter((e) => e && MANUAL_SOURCES.includes(e.source) && e.at).map((e) => localDateKey(e.at)),
  )
}

/** Lever et coucher habituels (minutes depuis minuit) d'après le sommeil des dernières semaines, sinon null. */
export function habitualSleep(sleepEntries, now = new Date()) {
  const r = computeSleepRegularity(sleepEntries || [], now)
  if (!r || r.status !== 'ok') return { wake: null, bedtime: null }
  return { wake: Math.round(r.wake.mean), bedtime: Math.round(r.bedtime.mean) }
}

/**
 * Lever et coucher habituels seuls (35 nuits au plus) : la lecture légère dont la scène de l'Accueil a besoin.
 * Ne lève jamais : sans sommeil lisible, `{ wake: null, bedtime: null }` (7 h et 22 h 30).
 */
export async function loadSleepHabits({ now = new Date(), list = listEntries } = {}) {
  try {
    const since = new Date(now.getTime() - 35 * 86_400_000).toISOString()
    return habitualSleep(await list({ type: 'sleep', since, limit: 500 }), now)
  } catch {
    return { wake: null, bedtime: null }
  }
}

/**
 * @returns {Promise<{ daysOfUse: number, wake: number|null, bedtime: number|null, hemisphere: 'nord'|'sud',
 *   weather: object|null }>}
 * Ne lève jamais : en cas d'erreur de lecture, valeurs neutres (îlot de départ, heures par défaut).
 */
export async function loadWorldContext({ now = new Date(), list = listEntries, weatherSettings = getWeatherSettings } = {}) {
  let daysOfUse = 0
  let sleep
  try {
    const perSource = await Promise.all(MANUAL_SOURCES.map((source) => list({ source, limit: 5000 })))
    daysOfUse = usageDaysFromEntries(perSource.flat())
  } catch {
    /* lecture impossible : îlot de départ */
  }
  sleep = await loadSleepHabits({ now, list })
  let settings = {}
  try {
    settings = weatherSettings() || {}
  } catch {
    settings = {}
  }
  const lat = settings.location?.lat
  return {
    daysOfUse,
    wake: sleep.wake,
    bedtime: sleep.bedtime,
    hemisphere: typeof lat === 'number' && lat < 0 ? 'sud' : 'nord',
    weather: settings.enabled ? settings.current || null : null,
  }
}

let dayCache = null

/**
 * Le contexte du monde pour le jour de Pilou en cours (il change à 4 h), lu une seule fois par jour et partagé par
 * la scène de l'Accueil et le widget Android : les deux s'endorment et se réveillent donc à la même heure.
 * Ne lève jamais (voir `loadWorldContext`).
 */
export function worldContextForDay({ now = new Date(), load = loadWorldContext } = {}) {
  const day = worldDayKey(now)
  if (!dayCache || dayCache.day !== day) {
    dayCache = { day, value: Promise.resolve().then(() => load({ now })).catch(() => ({})) }
  }
  return dayCache.value
}

let habitsCache = null

/**
 * Lever et coucher habituels pour le jour de Pilou en cours, lus une fois par jour. La scène de l'Accueil s'en sert
 * au lieu de `worldContextForDay`, qui relit aussi toutes les notes pour compter les jours d'usage (trop lourd à
 * l'ouverture). Même calcul que le contexte du widget : l'île et le widget s'endorment à la même heure.
 */
export function sleepHabitsForDay({ now = new Date(), load = loadSleepHabits } = {}) {
  const day = worldDayKey(now)
  if (!habitsCache || habitsCache.day !== day) {
    habitsCache = { day, value: Promise.resolve().then(() => load({ now })).catch(() => ({ wake: null, bedtime: null })) }
  }
  return habitsCache.value
}

/** Dernier décompte des jours d'usage, gardé sur le téléphone : `{ day, days }` (jour de Pilou du décompte). */
export const USAGE_DAYS_KEY = 'halcya.world.usageDays'

function storage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

/** Le dernier décompte gardé, sans rien lire dans les notes (ouverture de l'Accueil). null s'il n'y en a pas. */
export function storedUsageDays() {
  try {
    const v = JSON.parse(storage()?.getItem(USAGE_DAYS_KEY) || 'null')
    return v && Number.isFinite(v.days) && v.days >= 0 ? { day: String(v.day || ''), days: Math.floor(v.days) } : null
  } catch {
    return null
  }
}

/**
 * Jours d'usage vus par l'îlot, lecture légère : une seule entrée par jour et par source notée (`listEntryDays`), et
 * pas au-delà de 90 jours, où l'îlot a fini de grandir. Le widget garde son décompte exact (`loadWorldContext`).
 * @returns {Promise<{ daysOfUse: number }>}
 */
export async function loadIslandUsageDays({ listDays = listEntryDays } = {}) {
  const days = await listDays({ sources: MANUAL_SOURCES, max: GROWTH_FULL_DAYS })
  return { daysOfUse: Math.min(GROWTH_FULL_DAYS, countUsageDays(days)) }
}

/**
 * Jours d'usage pour la croissance de l'îlot, recomptés au plus une fois par jour de Pilou : le même jour, le décompte
 * gardé suffit ; un nouveau jour, `loadIslandUsageDays` relit un jour par source (jamais toutes les notes), et le
 * résultat est gardé. Le décompte ne recule jamais (une lecture ratée ou des notes supprimées ne font pas rétrécir l'îlot).
 * Ne lève jamais.
 */
export async function usageDaysForDay({ now = new Date(), load = loadIslandUsageDays } = {}) {
  const stored = storedUsageDays()
  const day = worldDayKey(now)
  if (stored && stored.day === day) return stored.days
  let counted = null
  try {
    const ctx = await load({ now })
    counted = Number.isFinite(ctx?.daysOfUse) ? Math.floor(ctx.daysOfUse) : null
  } catch {
    counted = null
  }
  const days = Math.max(stored?.days ?? 0, counted ?? 0)
  if (counted != null) {
    try {
      storage()?.setItem(USAGE_DAYS_KEY, JSON.stringify({ day, days }))
    } catch {
      /* stockage plein ou interdit : on recomptera demain */
    }
  }
  return days
}

/** Pour les tests. */
export function resetWorldContextCache() {
  dayCache = null
  habitsCache = null
}

/** Ce que l'îlot montrait à la dernière nouvelle : `{ pond, neighbour, tree, season }`, pour ne la dire qu'une fois. */
export const WORLD_SEEN_KEY = 'halcya.world.seen'

/**
 * La nouvelle de l'îlot depuis la dernière visite (`worldNews` : mare, îlot voisin, petit arbre ou saison), dite une
 * seule fois : l'état vu est gardé sur le téléphone. Première visite ou état gardé illisible : rien n'est annoncé.
 * @param {{ growth: object|null, season?: string|null }} current
 * @returns {string|null}
 */
export function takeWorldNews(current) {
  const g = current?.growth
  if (!g) return null
  const seen = {
    pond: Boolean(g.pond),
    neighbour: Boolean(g.neighbourIsland ?? g.neighbor),
    tree: Boolean(g.tree),
    season: current.season ?? g.season ?? null,
  }
  const store = storage()
  let previous = null
  try {
    previous = JSON.parse(store?.getItem(WORLD_SEEN_KEY) || 'null')
  } catch {
    previous = null
  }
  try {
    store?.setItem(WORLD_SEEN_KEY, JSON.stringify(seen))
  } catch {
    // stockage plein ou refusé : la nouvelle reviendra, sans conséquence
  }
  if (!previous || typeof previous !== 'object') return null
  return worldNews(
    { growth: { pond: previous.pond, neighbourIsland: previous.neighbour, tree: previous.tree }, season: previous.season },
    { growth: { pond: seen.pond, neighbourIsland: seen.neighbour, tree: seen.tree }, season: seen.season },
  )
}
