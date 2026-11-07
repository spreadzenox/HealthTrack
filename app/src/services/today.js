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
import { appLocale, localeDate } from '../i18n/locale.js'
import { faceModelTag } from './mood/modelName'
import { FEATURES } from '../config/distribution'
import { toDisplay, formatNote } from './mood/wellbeingScale'

export const GUT_TYPE = 'gut'
export const GUT_SOURCE = 'app_gut'

/**
 * « Quand consulter » (POL-PLAY-60, IDEES.md I198) : les signes qui ne sont pas du SII, d'après les synthèses
 * françaises. Phrase fixe, une seule source de texte (carte ventre, réintroduction, rapport PDF) : jamais déclenchée
 * par les données (ce serait une détection, donc une fonction médicale), jamais en rouge.
 */
export const WHEN_TO_SEE_DOCTOR =
  'Sang dans les selles, perte de poids sans raison, fièvre, réveils la nuit à cause du ventre, symptômes nouveaux après 50 ans, ou un proche (parent, frère, sœur) qui a eu un cancer du côlon ou une maladie inflammatoire de l’intestin : parlez-en rapidement à votre médecin.'

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

/** Jours suivis avant de chercher des pistes (« Vos analyses arrivent dans N jours »). */
export const PISTES_MIN_DAYS = 21
/**
 * Jours de notes du ventre avant les pistes repas → ventre (= `gutLinks.GUT_LINKS_MIN_DAYS`, vérifié par un test ;
 * recopié ici pour que l'Accueil n'embarque pas la table nutritionnelle).
 */
export const GUT_PISTES_MIN_NOTE_DAYS = 28
/** Fenêtre du bien-être estimé (courbe et moyenne). */
export const TREND_DAYS = 14
/** Jours estimés nécessaires avant de se comparer à sa moyenne. */
export const TREND_MIN_PAST_DAYS = 3

const DAY_MS = 86_400_000

export const frDecimal = (v) => v.toLocaleString(appLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * En-tête de l'Accueil : la date seule, en toutes lettres (« Samedi 7 novembre »), sans « Bonjour » (nouvel écran
 * Aujourd'hui, revue design du propriétaire du 07/11).
 */
export function headerLine(now = new Date()) {
  const date = localeDate(now, { weekday: 'long', day: 'numeric', month: 'long' })
  return { date: date.charAt(0).toUpperCase() + date.slice(1) }
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

const DAY_LEVELS = {
  good: 'Plutôt bonne',
  medium: 'Plutôt moyenne',
  hard: 'Plus difficile',
}

/** Niveau du jour sur l'échelle interne 0–5 : mêmes seuils que daySummaryTitle (> 3,4 et < 2,6 sur l'échelle 1 à 5). */
function dayLevel(note) {
  if (note > 3) return 'good'
  if (note < 2) return 'hard'
  return 'medium'
}

const hhmm = (iso) => new Date(iso).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`

/**
 * Statut du jour en tête de l'Accueil (TESTEUR-1c, maquette journal/maquettes/aujourdhui) : « Votre journée » et un
 * titre en deux mots, la position sur l'échelle 1 à 5, d'où il vient en une phrase et des étiquettes.
 *
 * Le statut ne parle que du bien-être (Y) : le visage du jour d'abord (faceMoodEstimate, où une gêne ou une douleur du
 * ventre compte un peu, VENTRE-BE-2) ; sans lecture du jour, la dernière note manuelle du jour ; sinon pas d'avis.
 * La note manuelle n'entre pas dans l'estimation du visage du jour : quand les deux existent, elle reste une étiquette.
 *
 * @param {object | null | undefined} est  sortie de faceMoodEstimate
 * @param {object[]} entries  entrées récentes (notes `wellbeing`, payload.score sur 0–5)
 * @returns {{ level: 'good'|'medium'|'hard'|null, title: string, segment: number | null, from: string | null,
 *   chips: string[], source: 'face'|'note'|null }}
 */
export function dayStatus(est, entries = [], now = new Date()) {
  const today = localDateKey(now.toISOString())
  const notes = (entries || [])
    .filter((e) => e?.type === 'wellbeing' && typeof e.payload?.score === 'number' && localDateKey(e.at) === today)
    .sort((a, b) => (a.at < b.at ? -1 : 1))
  const lastNote = notes[notes.length - 1] ?? null
  const segment = (score) => Math.min(5, Math.max(1, Math.round(toDisplay(score))))
  const noteChip = lastNote ? `votre note : ${segment(lastNote.payload.score)}/5` : null

  const day = est?.day
  if (day && typeof day.note === 'number') {
    const level = dayLevel(day.note)
    const chips = [plural(day.readings, 'lecture du visage', 'lectures du visage')]
    if (noteChip) chips.push(noteChip)
    if (day.gut) chips.push(`ventre : ${day.gut.level === 'pain' ? 'douleur' : 'gêne'} comptée`)
    if (est.confidence === 'faible') chips.push('estimation prudente')
    return {
      level,
      title: DAY_LEVELS[level],
      segment: segment(day.note),
      from: 'D’après votre visage aujourd’hui.',
      chips,
      source: 'face',
    }
  }
  if (lastNote) {
    const level = dayLevel(lastNote.payload.score)
    return {
      level,
      title: DAY_LEVELS[level],
      segment: segment(lastNote.payload.score),
      from: `D’après votre note de ${hhmm(lastNote.at)}.`,
      chips: [],
      source: 'note',
    }
  }
  return { level: null, title: 'Pas encore d’avis', segment: null, from: null, chips: [], source: null }
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
  app_stool: 'Selles (app)',
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
 * Un chiffre absent aujourd'hui (montre pas encore synchronisée, journée qui commence) reprend celui de la veille,
 * marqué `when: 'hier'`, plutôt qu'un « — » alors que la veille est connue (POL-PLAY-8).
 * @param {object | null} summary    résumé du jour (buildDailyJournal) ou null
 * @param {object[]} entries         entrées lues par l'accueil (pour les sources)
 * @param {object | null} yesterday  résumé de la veille ou null
 */
export function measureTiles(summary, entries, now = new Date(), yesterday = null) {
  const day = localDateKey(now.toISOString())
  const prevDay = localDateKey(new Date(now.getTime() - DAY_MS).toISOString())
  const sourcesOf = (key, d) => [...new Set((entries || []).filter((e) => e && TILE_MATCHERS[key](e, d)).map(tileSourceLabel))]
  const pick = (key, has) => {
    if (summary && has(summary)) return { s: summary, d: day, when: null }
    if (yesterday && has(yesterday)) return { s: yesterday, d: prevDay, when: 'hier' }
    return { s: {}, d: day, when: null }
  }
  const sleep = pick('sleep', (s) => s.sleepMinutes != null)
  const hrv = pick('hrv', (s) => s.hrv != null)
  const steps = pick('steps', (s) => s.steps != null)
  return [
    {
      key: 'sleep',
      label: sleep.s.sleepEstimated ? 'Sommeil (estimé)' : 'Sommeil',
      estimated: Boolean(sleep.s.sleepEstimated),
      value: sleep.s.sleepMinutes != null ? formatSleep(sleep.s.sleepMinutes) : null,
      // La nuit est rangée au jour du réveil : « cette nuit », comme VFC et pas disent « hier » (POL-PLAY-27)
      when: sleep.s.sleepMinutes == null ? null : sleep.when ? 'nuit d’avant' : 'cette nuit',
      sources: sourcesOf('sleep', sleep.d),
    },
    { key: 'hrv', label: 'VFC nuit', value: hrv.s.hrv != null ? `${Math.round(hrv.s.hrv)} ms` : null, when: hrv.when, sources: sourcesOf('hrv', hrv.d) },
    {
      key: 'steps',
      label: 'Pas',
      value: steps.s.steps != null ? Math.round(steps.s.steps).toLocaleString(appLocale()) : null,
      when: steps.when,
      sources: sourcesOf('steps', steps.d),
    },
  ]
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

const WATCH_LABELS = new Set([SOURCE_LABELS.huawei_watch, SOURCE_LABELS.samsung_watch])

/** « 2 h 15 », « 45 min » */
function formatMinutes(min) {
  const m = Math.round(min)
  return m < 60 ? `${m} min` : formatSleep(m)
}

/** Dernière entrée du jour d'un type, ou null. */
function lastOfDay(entries, type, day, ok = () => true) {
  let best = null
  for (const e of entries || []) {
    if (e?.type !== type || !e.at || localDateKey(e.at) !== day || !ok(e)) continue
    if (!best || e.at > best.at) best = e
  }
  return best
}

/**
 * « Vos données du jour » rangées par source (TESTEUR-1d-b, maquette journal/maquettes/aujourdhui §2.4) :
 * - `watch` (Montre) : sommeil, VFC de la nuit, FC au repos, et les pas quand ils viennent de la montre (montre
 *   connue, ou même appareil que la nuit) ;
 * - `phone` (Téléphone) : pas, nuit estimée par le téléphone, temps d'écran ;
 * - `noted` (Noté par vous) : dernière note du bien-être (menthe) et du ventre (pêche, seulement avec « Mon ventre »)
 *   du jour, repas et cigarettes du jour. Jamais une note d'hier.
 * Une source sans chiffre n'apparaît pas. Les tuiles viennent de `measureTiles` (même règle « aujourd'hui, sinon hier »).
 * @returns {Array<{ id: 'watch'|'phone'|'noted', title: string, items: object[] }>}
 */
export function todayBySource({ tiles = [], summary = null, entries = [], now = new Date(), showGut = false } = {}) {
  const s = summary || {}
  const watch = []
  const phone = []
  // Appareil d'une source : l'app d'origine quand Health Connect la donne (« Health Connect · Garmin » → « Garmin »)
  const device = (l) => l.split(' · ').pop()
  const shown = tiles.filter((t) => t.value != null)
  for (const t of shown) {
    if (t.key === 'sleep' && t.estimated) phone.push(t)
    else if (t.key !== 'steps') watch.push(t)
  }
  const watchDevices = new Set(watch.flatMap((t) => (t.sources || []).map(device)))
  for (const t of shown.filter((x) => x.key === 'steps')) {
    // Les pas vont avec la montre quand c'est elle qui les compte : montre connue, ou même appareil que la nuit
    const fromWatch = t.sources?.length > 0
      && t.sources.every((l) => WATCH_LABELS.has(l) || watchDevices.has(device(l)))
    ;(fromWatch ? watch : phone).push(t)
  }
  if (isNum(s.restingHr)) watch.push({ key: 'restingHr', label: 'FC au repos', value: `${Math.round(s.restingHr)} bpm`, when: null, sources: [] })
  if (isNum(s.screenMinutes)) phone.push({ key: 'screen', label: 'Temps d’écran', value: formatMinutes(s.screenMinutes), when: null, sources: [] })

  const day = localDateKey(now.toISOString())
  const noted = []
  const wb = lastOfDay(entries, 'wellbeing', day, (e) => isNum(e.payload?.score))
  if (wb) noted.push({ key: 'wellbeing', label: 'Bien-être', value: `${formatNote(wb.payload.score)}/5`, when: `à ${hhmm(wb.at)}`, theme: 'mint' })
  const gut = showGut ? lastOfDay(entries, GUT_TYPE, day, (e) => !isGutDayNote(e) && gutLevelLabel(e.payload?.level)) : null
  if (gut) noted.push({ key: 'gut', label: 'Ventre', value: gutLevelLabel(gut.payload.level), when: `à ${hhmm(gut.at)}`, theme: 'peach' })
  if (s.meals > 0) noted.push({ key: 'meals', label: 'Repas', value: String(s.meals), when: null })
  if (s.cigarettes > 0) noted.push({ key: 'cigarettes', label: s.cigarettes > 1 ? 'Cigarettes' : 'Cigarette', value: String(s.cigarettes), when: null })

  return [
    { id: 'watch', title: 'Montre', items: watch },
    { id: 'phone', title: 'Téléphone', items: phone },
    { id: 'noted', title: 'Noté par vous', items: noted },
  ].filter((g) => g.items.length)
}
todayBySource.hasWatch = (groups) => (groups || []).some((g) => g.id === 'watch')

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

/**
 * Objectif ventre, une fois les 21 jours suivis atteints : jours distincts avec une note du ventre, jusqu'au seuil
 * des pistes repas → ventre. Sans cela, la carte lilas disait « assez de jours » puis « il en faut 28 ».
 */
export function gutNotesProgress(entries) {
  const days = new Set((entries || []).filter((e) => e?.at && e.type === GUT_TYPE).map((e) => localDateKey(e.at)))
  const n = Math.min(days.size, GUT_PISTES_MIN_NOTE_DAYS)
  return { days: n, target: GUT_PISTES_MIN_NOTE_DAYS, remaining: GUT_PISTES_MIN_NOTE_DAYS - n, ready: n >= GUT_PISTES_MIN_NOTE_DAYS }
}

/** Ce que dit le modèle du bien-être, en clair (mode détails). */
export const MODEL_LABELS = {
  prior: 'expressions du visage (réglage de départ)',
  va: 'deux modèles valence / éveil',
  personal: 'calibré sur vos notes',
}

/** Libellé du modèle ; nom technique (« HSEmotion ») en sideload seulement (POL-PLAY-100). */
export function modelLabel(model, features = FEATURES) {
  const label = MODEL_LABELS[model]
  if (!label) return model
  return model === 'va' ? `${label}${faceModelTag(features)}` : label
}
