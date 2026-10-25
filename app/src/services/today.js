/**
 * Accueil « Aujourd'hui » (maquette validée le 20/10/2026, journal/DESIGN.md §7) : les calculs simples derrière
 * les cartes, sans React. Tout est une lecture des données déjà enregistrées ; rien n'est déduit d'une norme (D6).
 *
 * - Ligne du haut et titre-résumé : le titre ne parle que du bien-être estimé du jour (Y), jamais d'un comportement.
 * - Écart à la moyenne : le jour estimé comparé aux jours estimés des 13 jours précédents (au moins 3).
 * - Ventre : Calme / Gêne / Douleur en un geste, horodaté (entrée `gut`, source `app_gut`, supprimable).
 * - Pistes : jours suivis (un repas ou une note du ventre ; une nuit et une mesure du bien-être si l'objectif est
 *   « Mon énergie et mon sommeil ») sur 21, le seuil avant de chercher des pistes.
 */
import { localDateKey } from './analysisEngine'
import { isDaytimeHrv } from './hrv'

export const GUT_TYPE = 'gut'
export const GUT_SOURCE = 'app_gut'

/** Les trois niveaux, dans l'ordre affiché. */
export const GUT_LEVELS = [
  { id: 'calm', label: 'Calme', plural: 'calmes' },
  { id: 'discomfort', label: 'Gêne', plural: 'gênes' },
  { id: 'pain', label: 'Douleur', plural: 'douleurs' },
]

/**
 * Bilan du soir (I170) : « Et votre ventre aujourd'hui ? », une note par jour, y compris les jours calmes que les
 * notes prises au fil de l'eau oublient. Elle porte `payload.scope = 'day'` : elle parle de la journée, pas d'un
 * instant, et l'analyse repas → ventre par fenêtres horaires (gutWindows.js) l'ignore.
 */
export const GUT_DAY_SCOPE = 'day'
/** Heure locale à partir de laquelle le bilan du jour est proposé. */
export const GUT_EVENING_FROM_HOUR = 18

export const isGutDayNote = (e) => e?.payload?.scope === GUT_DAY_SCOPE

/**
 * Bilan du soir : `ask` à partir de 18 h tant qu'aucun bilan n'existe ce jour-là ; `done` = le bilan du jour.
 * @returns {{ ask: boolean, done: object | null }}
 */
export function gutEveningCheck(gutEntries, now = new Date()) {
  const today = localDateKey(now.toISOString())
  const done = (gutEntries || [])
    .filter((e) => e?.type === GUT_TYPE && isGutDayNote(e) && GUT_LEVELS.some((l) => l.id === e.payload.level) && localDateKey(e.at) === today)
    .sort((a, b) => (a.at < b.at ? 1 : -1))[0] ?? null
  return { ask: !done && now.getHours() >= GUT_EVENING_FROM_HOUR, done }
}

export function gutLevelLabel(id) {
  return GUT_LEVELS.find((l) => l.id === id)?.label ?? null
}

/** Jours suivis avant de chercher des pistes (« Vos pistes arrivent dans N jours »). */
export const PISTES_MIN_DAYS = 21
/** Fenêtre du bien-être estimé (courbe et moyenne). */
export const TREND_DAYS = 14
/** Jours estimés nécessaires avant de se comparer à sa moyenne. */
export const TREND_MIN_PAST_DAYS = 3

const DAY_MS = 86_400_000

export const frDecimal = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** « mer. 21 oct. · Bonjour » (prénom ajouté quand l'onboarding le demandera). */
export function headerLine(now = new Date(), firstName = '') {
  const date = now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${date} · Bonjour${firstName ? ` ${firstName}` : ''}`
}

/**
 * Titre en phrase, d'après le bien-être estimé du jour seulement (une lecture d'hier ne décrit pas aujourd'hui).
 * @param {{ day?: { note: number } | null } | null} est  sortie de faceMoodEstimate
 */
export function daySummaryTitle(est) {
  const note = est?.day?.note
  if (typeof note !== 'number') return 'Votre journée'
  if (note > 3) return 'Plutôt une bonne journée'
  if (note < 2) return 'Une journée plus difficile'
  return 'Une journée moyenne'
}

/**
 * Courbe des 14 derniers jours et écart du jour à la moyenne des jours précédents.
 * @param {{ date: string, note: number }[]} days  faceMoodDays (jours d'au moins 3 lectures)
 * @param {number | null} todayNote  bien-être estimé du jour (même s'il a moins de 3 lectures)
 * @returns {{ series: { date: string, note: number }[], mean: number | null, pastDays: number,
 *   delta: number | null, phrase: string }}
 */
export function wellbeingTrend(days, todayNote, now = new Date()) {
  const today = localDateKey(now.toISOString())
  const from = localDateKey(new Date(now.getTime() - (TREND_DAYS - 1) * DAY_MS).toISOString())
  const past = (days || []).filter((d) => d.date >= from && d.date < today)
  const series = [...past]
  if (typeof todayNote === 'number') series.push({ date: today, note: todayNote })
  const mean = past.length ? past.reduce((s, d) => s + d.note, 0) / past.length : null
  const enough = past.length >= TREND_MIN_PAST_DAYS && typeof todayNote === 'number'
  const delta = enough ? Math.round((todayNote - mean) * 10) / 10 : null
  return { series, mean: mean == null ? null : Math.round(mean * 10) / 10, pastDays: past.length, delta, phrase: trendPhrase(delta) }
}

function trendPhrase(delta) {
  if (delta == null) return 'Encore quelques jours de lectures pour vous comparer à vous-même.'
  const ref = 'votre moyenne des 14 derniers jours'
  if (Math.abs(delta) < 0.3) return `Proche de ${ref}.`
  if (delta >= 0.8) return `Mieux que ${ref}.`
  if (delta > 0) return `Un peu mieux que ${ref}.`
  if (delta <= -0.8) return `Moins bien que ${ref}.`
  return `Un peu moins bien que ${ref}.`
}

/** « +0,3 » / « −0,4 » / « ±0,0 » (signe typographique). */
export function formatDelta(delta) {
  if (delta == null) return ''
  if (delta === 0) return '±0,0'
  return `${delta > 0 ? '+' : '−'}${frDecimal(Math.abs(delta))}`
}

/** Libellés des sources, pour dire d'où vient chaque chiffre. */
export const SOURCE_LABELS = {
  app_food: 'Alimentation (app)',
  app_wellbeing: 'Bien-être (app)',
  app_cigarette: 'Tabac (app)',
  app_gut: 'Ventre (app)',
  samsung_watch: 'Montre Samsung',
  health_connect: 'Health Connect',
  huawei_watch: 'Montre Huawei',
  ble: 'Capteur Bluetooth',
  withings: 'Withings Body Scan',
  scale: 'Balance connectée',
  phone_usage: 'Téléphone',
}

/** Source lisible d'une entrée : l'appli d'origine quand Health Connect la donne (« Health Connect · Garmin »). */
export function entrySourceLabel(e) {
  const base = SOURCE_LABELS[e?.source] || e?.source || 'inconnue'
  const origin = e?.payload?.sourceName
  return origin && origin !== base ? `${base} · ${origin}` : base
}

/** Jour d'une nuit : celui du réveil (même règle que le journal). */
function sleepDay(e) {
  const p = e.payload || {}
  if (p.endDate) return localDateKey(p.endDate)
  if (typeof p.durationMinutes === 'number') return localDateKey(new Date(Date.parse(e.at) + p.durationMinutes * 60000).toISOString())
  return localDateKey(e.at)
}

/**
 * Source d'une tuile : courte. La montre se nomme « Montre Huawei » sans le nom Bluetooth de l'appareil (suffixe
 * technique) ; Health Connect garde l'app d'origine (« Health Connect · Garmin »).
 */
const tileSourceLabel = (e) => (e?.source === 'huawei_watch' ? SOURCE_LABELS.huawei_watch : entrySourceLabel(e))

const TILE_MATCHERS = {
  sleep: (e, day) => e.type === 'sleep' && sleepDay(e) === day,
  hrv: (e, day) => e.type === 'heart_rate' && e.payload?.subtype === 'heartRateVariability' && !isDaytimeHrv(e.payload) && localDateKey(e.at) === day,
  steps: (e, day) => e.type === 'steps' && localDateKey(e.at) === day,
}

function formatSleep(minutes) {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

/**
 * Les trois tuiles de mesures du jour (sommeil, VFC de la nuit, pas), avec la source de chaque chiffre.
 * @param {object | null} summary  résumé du jour (buildDailyJournal) ou null
 * @param {object[]} entries       entrées lues par l'accueil (pour les sources)
 */
export function measureTiles(summary, entries, now = new Date()) {
  const day = localDateKey(now.toISOString())
  const s = summary || {}
  const sourcesOf = (key) => [...new Set((entries || []).filter((e) => e && TILE_MATCHERS[key](e, day)).map(tileSourceLabel))]
  return [
    {
      key: 'sleep',
      label: s.sleepEstimated ? 'Sommeil (estimé)' : 'Sommeil',
      value: s.sleepMinutes != null ? formatSleep(s.sleepMinutes) : null,
      sources: sourcesOf('sleep'),
    },
    { key: 'hrv', label: 'VFC nuit', value: s.hrv != null ? `${Math.round(s.hrv)} ms` : null, sources: sourcesOf('hrv') },
    {
      key: 'steps',
      label: 'Pas',
      value: s.steps != null ? Math.round(s.steps).toLocaleString('fr-FR') : null,
      sources: sourcesOf('steps'),
    },
  ]
}

/**
 * Ventre : dernière note et bilan des 7 derniers jours (aujourd'hui compris). Le bilan du soir compte dans les 7
 * jours, mais pas comme « dernière note » (il n'a pas d'heure qui compte).
 * @param {object[]} gutEntries  entrées `gut`
 * @returns {{ last: object | null, lastToday: boolean, week: Record<string, number>, daysNoted: number }}
 */
export function gutSummary(gutEntries, now = new Date()) {
  const list = (gutEntries || []).filter((e) => e?.type === GUT_TYPE && GUT_LEVELS.some((l) => l.id === e.payload?.level))
  const sorted = list.filter((e) => !isGutDayNote(e)).sort((a, b) => (a.at < b.at ? 1 : -1))
  const last = sorted[0] ?? null
  const today = localDateKey(now.toISOString())
  const from = localDateKey(new Date(now.getTime() - 6 * DAY_MS).toISOString())
  const week = Object.fromEntries(GUT_LEVELS.map((l) => [l.id, 0]))
  const days = new Set()
  for (const e of list) {
    const d = localDateKey(e.at)
    if (d < from || d > today) continue
    week[e.payload.level] += 1
    days.add(d)
  }
  return { last, lastToday: last ? localDateKey(last.at) === today : false, week, daysNoted: days.size }
}

/** « 7 jours · 6 notes : 3 calmes · 2 gênes · 1 douleur · 1 jour sans note » */
export function gutWeekLine({ week, daysNoted }) {
  const parts = GUT_LEVELS.filter((l) => week[l.id] > 0).map((l) => `${week[l.id]} ${week[l.id] > 1 ? l.plural : l.label.toLowerCase()}`)
  const missing = 7 - daysNoted
  if (missing > 0) parts.push(`${missing} jour${missing > 1 ? 's' : ''} sans note`)
  const notes = Object.values(week).reduce((a, b) => a + b, 0)
  return `7 jours${notes ? ` · ${notes} note${notes > 1 ? 's' : ''}` : ''} : ${parts.join(' · ')}`
}

/** Entrées qui mesurent le bien-être (Y) : notes et lectures du visage. */
const WELLBEING_TYPES = new Set(['wellbeing', 'face_burst'])

/**
 * Avancement vers les pistes, selon l'objectif choisi (I155) :
 * - `gut` (par défaut) : jours distincts avec un repas ou une note du ventre ;
 * - `energy` : jours où il y a à la fois une nuit (X, jour du réveil) et une mesure du bien-être (Y), seuls jours
 *   utiles à une piste sommeil → bien-être.
 * @param {object[]} entries  entrées `food` et `gut`, ou `sleep`, `wellbeing` et `face_burst`
 * @param {'gut'|'energy'} focus
 */
export function pistesProgress(entries, focus = 'gut') {
  const list = (entries || []).filter((e) => e?.at)
  let days
  if (focus === 'energy') {
    const nights = new Set(list.filter((e) => e.type === 'sleep').map(sleepDay))
    days = new Set(list.filter((e) => WELLBEING_TYPES.has(e.type)).map((e) => localDateKey(e.at)).filter((d) => nights.has(d)))
  } else {
    days = new Set(list.filter((e) => e.type === 'food' || e.type === GUT_TYPE).map((e) => localDateKey(e.at)))
  }
  const n = Math.min(days.size, PISTES_MIN_DAYS)
  return { days: n, target: PISTES_MIN_DAYS, remaining: PISTES_MIN_DAYS - n, ready: n >= PISTES_MIN_DAYS }
}

/** Ce que dit le modèle du bien-être, en clair (mode détails). */
export const MODEL_LABELS = {
  prior: 'expressions du visage (réglage de départ)',
  va: 'deux modèles valence / éveil (HSEmotion)',
  personal: 'calibré sur vos notes',
}
