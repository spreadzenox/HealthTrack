/**
 * Téléphone → minutes par catégorie d'app (réseaux sociaux, vidéo, jeux…), calculs purs (I116).
 *
 * Les événements viennent du plugin natif PhoneUsage (`queryAppEvents`, journal d'utilisation
 * d'Android, rien ne sort du téléphone) : `{ t: ms, e: 'fg' | 'bg', p: paquet }` (app au premier plan /
 * en arrière-plan) et `{ t, e: 'off' }` (écran éteint). `apps` donne, une fois par paquet,
 * `{ label, category }` où `category` est `ApplicationInfo.category` (−1 si l'app n'en déclare pas).
 *
 * Règles (directives D5 / D6 du propriétaire) :
 * - ces minutes sont des **facteurs X** : elles servent à expliquer l'humeur, jamais à l'estimer
 *   (voir mood/estimatorInputs.js) ;
 * - aucune app ni catégorie n'est « bonne » ou « mauvaise » : on ne compte que des minutes, et les
 *   Analyses disent ce qu'il en est chez l'utilisateur ;
 * - jour civil (00:00 → 24:00) ; les minutes par heure gardent l'ordre temporel pour comparer plus
 *   tard une lecture du visage à l'heure qui la précède (I120).
 */

const MIN = 60000
const HOUR = 60 * MIN

/** Une session plus longue est tronquée (fin perdue : redémarrage, app tuée). */
export const MAX_APP_SESSION_MS = 2 * HOUR
const TOP_APPS = 5

export const APP_CATEGORIES = ['social', 'messaging', 'video', 'game', 'news', 'audio', 'other']

/** `ApplicationInfo.CATEGORY_*` (API 26). */
const ANDROID_CATEGORIES = { 0: 'game', 1: 'audio', 2: 'video', 4: 'social', 5: 'news' }

/** Messageries : écrire à ses proches n'est pas faire défiler un fil, on les compte à part. */
const MESSAGING = new Set([
  'com.whatsapp', 'com.whatsapp.w4b', 'com.google.android.apps.messaging', 'com.samsung.android.messaging',
  'org.thoughtcrime.securesms', 'org.telegram.messenger', 'com.facebook.orca', 'com.discord', 'com.viber.voip',
  'com.google.android.gm', 'com.samsung.android.email.provider', 'com.microsoft.teams', 'com.Slack',
])

/** Repli pour les apps qui ne déclarent pas de catégorie (ou une autre). */
const FALLBACK = {
  social: [
    'com.instagram.android', 'com.instagram.barcelona', 'com.zhiliaoapp.musically', 'com.ss.android.ugc.trill',
    'com.facebook.katana', 'com.facebook.lite', 'com.twitter.android', 'com.snapchat.android',
    'com.reddit.frontpage', 'com.linkedin.android', 'xyz.blueskyweb.app', 'com.pinterest', 'com.tumblr',
    'org.joinmastodon.android', 'com.bereal.ft',
  ],
  video: [
    'com.google.android.youtube', 'com.netflix.mediaclient', 'com.disney.disneyplus',
    'com.amazon.avod.thirdpartyclient', 'tv.twitch.android.app', 'com.canal.android.canal',
  ],
}
const FALLBACK_BY_PACKAGE = new Map(
  Object.entries(FALLBACK).flatMap(([cat, packages]) => packages.map((p) => [p, cat])),
)

/**
 * Catégorie d'une app : messageries d'abord, puis table de repli, puis catégorie déclarée par l'app.
 * @param {string} pkg
 * @param {{ category?: number }} [info]
 */
export function appCategory(pkg, info) {
  if (MESSAGING.has(pkg)) return 'messaging'
  if (FALLBACK_BY_PACKAGE.has(pkg)) return FALLBACK_BY_PACKAGE.get(pkg)
  return ANDROID_CATEGORIES[info?.category] ?? 'other'
}

/**
 * Sessions au premier plan, triées, sans chevauchement : une app est fermée à son passage en
 * arrière-plan, au premier plan d'une autre app ou à l'écran éteint, dans la limite de MAX_APP_SESSION_MS.
 * @param {{ t: number, e: string, p?: string }[]} events
 * @param {{ until?: number }} [options]  ferme l'app encore ouverte (écran encore allumé)
 * @returns {{ p: string, start: number, end: number }[]}
 */
export function appSessions(events, { until } = {}) {
  const sorted = (events || [])
    .filter((ev) => ev && Number.isFinite(ev.t) && (ev.e === 'off' || ((ev.e === 'fg' || ev.e === 'bg') && ev.p)))
    .sort((a, b) => a.t - b.t)
  const out = []
  let open = null
  const close = (end) => {
    const capped = Math.min(end, open.start + MAX_APP_SESSION_MS)
    if (capped > open.start) out.push({ p: open.p, start: open.start, end: capped })
    open = null
  }
  for (const ev of sorted) {
    if (ev.e === 'fg') {
      if (open?.p === ev.p) continue
      if (open) close(ev.t)
      open = { p: ev.p, start: ev.t }
    } else if (open && (ev.e === 'off' || ev.p === open.p)) {
      close(ev.t)
    }
  }
  if (open && Number.isFinite(until) && until > open.start) close(until)
  return out
}

function at(dateKey, dayOffset, h) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d + dayOffset, h).getTime()
}

function dateKeyOf(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Minutes par catégorie (seulement celles utilisées), par heure (24 cases par catégorie) et les apps les
 * plus utilisées d'une journée, à partir de sessions déjà construites.
 */
function dayFromSessions(sessions, apps, dateKey) {
  const msByCat = {}
  const msByHour = {}
  const msByApp = new Map()
  for (let h = 0; h < 24; h++) {
    const from = at(dateKey, 0, h)
    const to = at(dateKey, 0, h + 1)
    for (const s of sessions) {
      const ms = Math.max(0, Math.min(s.end, to) - Math.max(s.start, from))
      if (ms <= 0) continue
      const cat = appCategory(s.p, apps?.[s.p])
      msByCat[cat] = (msByCat[cat] || 0) + ms
      if (!msByHour[cat]) msByHour[cat] = new Array(24).fill(0)
      msByHour[cat][h] += ms
      msByApp.set(s.p, (msByApp.get(s.p) || 0) + ms)
    }
  }
  const minutes = {}
  const byHour = {}
  for (const [cat, ms] of Object.entries(msByCat)) {
    const m = Math.round(ms / MIN)
    if (m <= 0) continue
    minutes[cat] = m
    byHour[cat] = msByHour[cat].map((v) => Math.round(v / MIN))
  }
  const topApps = [...msByApp.entries()]
    .map(([p, ms]) => ({ label: apps?.[p]?.label || p, category: appCategory(p, apps?.[p]), minutes: Math.round(ms / MIN) }))
    .filter((a) => a.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, TOP_APPS)
  return { date: dateKey, minutes, byHour, topApps }
}

/**
 * Résumé d'une journée.
 * @returns {{ date: string, minutes: Record<string, number>, byHour: Record<string, number[]>, topApps: { label: string, category: string, minutes: number }[] }}
 */
export function summarizeAppsDay(events, apps, dateKey, { now } = {}) {
  return dayFromSessions(appSessions(events, { until: now }), apps, dateKey)
}

/**
 * Entrées `phone_apps` des journées **terminées** et entièrement couvertes par le journal d'Android
 * (premier événement avant minuit) : une par jour, jamais modifiée ensuite.
 * @param {{ t: number, e: string, p?: string }[]} events
 * @param {Record<string, { label?: string, category?: number }>} apps
 * @param {{ now?: number }} [options]
 */
export function phoneAppsEntries(events, apps, { now = Date.now() } = {}) {
  const valid = (events || []).filter((ev) => ev && Number.isFinite(ev.t))
  if (valid.length === 0) return []
  const first = Math.min(...valid.map((ev) => ev.t))
  const todayKey = dateKeyOf(now)
  const sessions = appSessions(valid, { until: now })
  const out = []
  for (let key = dateKeyOf(first); key < todayKey; key = dateKeyOf(at(key, 1, 12))) {
    if (first > at(key, 0, 0)) continue
    out.push({
      type: 'phone_apps',
      source: 'phone',
      at: new Date(at(key, 0, 12)).toISOString(),
      payload: dayFromSessions(sessions, apps, key),
    })
  }
  return out
}

/** Libellés des catégories (affichage). */
export const APP_CATEGORY_LABELS = {
  social: 'réseaux sociaux',
  messaging: 'messageries',
  video: 'vidéo',
  game: 'jeux',
  news: 'actualités',
  audio: 'musique et audio',
  other: 'autres apps',
}
