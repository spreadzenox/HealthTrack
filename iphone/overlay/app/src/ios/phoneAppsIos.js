/**
 * Version iOS (HealthTrack-iOS) — minutes par catégorie d'app depuis l'iPhone (I8, calculs purs), comme
 * `phoneApps.js` d'Android (I116).
 *
 * Le plugin natif `PhoneUsage` rend, dans chaque segment horaire, les apps utilisées :
 * `apps: [{ id, label, category, ms }]` (identifiant de l'app, nom, catégorie de Temps d'écran d'Apple dans la
 * langue du téléphone, durée en ms ; Apple peut taire le nom ou la catégorie). Ce module en tire les mêmes entrées
 * `phone_apps` qu'Android, avec les mêmes catégories. Mêmes règles (directives D5 / D6 du propriétaire) : des
 * minutes seulement, aucune app ni catégorie « bonne » ou « mauvaise ». Rien ne sort du téléphone.
 */
import { dateKeyOf } from '../services/phoneUsage'

const MIN = 60000
const TOP_APPS = 5

/** Messageries : écrire à ses proches n'est pas faire défiler un fil, comptées à part (comme sur Android). */
const MESSAGING = new Set([
  'net.whatsapp.WhatsApp', 'net.whatsapp.WhatsAppSMB', 'com.apple.MobileSMS', 'ph.telegra.Telegraph',
  'org.whispersystems.signal', 'com.facebook.Messenger', 'com.hammerandchisel.discord', 'com.google.Gmail',
  'com.apple.mobilemail', 'com.microsoft.skype.teams', 'com.tinyspeck.chatlyio',
])

/** Apps connues, quelle que soit leur catégorie de Temps d'écran (versions iPhone de la table d'Android). */
const KNOWN = {
  social: [
    'com.burbn.instagram', 'com.burbn.barcelona', 'com.zhiliaoapp.musically', 'com.facebook.Facebook',
    'com.atebits.Tweetie2', 'com.toyopagroup.picaboo', 'com.reddit.Reddit', 'com.linkedin.LinkedIn',
    'xyz.blueskyweb.app', 'pinterest', 'com.tumblr.tumblr', 'AlexisBarreyat.BeReal',
  ],
  video: [
    'com.google.ios.youtube', 'com.netflix.Netflix', 'com.disney.disneyplus', 'com.amazon.aiv.AIVApp', 'tv.twitch',
  ],
  audio: ['com.spotify.client', 'com.apple.Music', 'com.deezer.Deezer', 'com.apple.podcasts'],
}
const KNOWN_BY_ID = new Map(Object.entries(KNOWN).flatMap(([cat, ids]) => ids.map((id) => [id, cat])))

/**
 * Catégories de Temps d'écran qui ont un équivalent sur Android (`ApplicationInfo.category`) ; « Divertissement »
 * mêle vidéo, musique et jeux : il reste dans « autres apps », sauf apps connues ci-dessus.
 */
const SCREEN_TIME = new Map([
  ['réseaux sociaux', 'social'], ['social', 'social'], ['social networking', 'social'],
  ['jeux', 'game'], ['games', 'game'],
  ['information et lecture', 'news'], ['information & reading', 'news'],
])

/** Catégorie Halcya (celles d'Android) d'une app de l'iPhone. */
export function iosAppCategory(app) {
  if (MESSAGING.has(app?.id)) return 'messaging'
  if (KNOWN_BY_ID.has(app?.id)) return KNOWN_BY_ID.get(app.id)
  return SCREEN_TIME.get(String(app?.category ?? '').trim().toLowerCase()) ?? 'other'
}

function at(dateKey, dayOffset, h) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d + dayOffset, h).getTime()
}

/** Minutes par catégorie, par heure (24 cases) et apps les plus utilisées d'une journée, comme sur Android. */
function dayFromSegments(segments, dateKey) {
  const from = at(dateKey, 0, 0)
  const to = at(dateKey, 1, 0)
  const msByCat = {}
  const msByHour = {}
  const byApp = new Map()
  for (const s of segments || []) {
    if (!s || !Number.isFinite(s.start) || s.start < from || s.start >= to) continue
    const h = new Date(s.start).getHours()
    for (const app of s.apps || []) {
      const ms = Number(app?.ms) || 0
      if (ms <= 0) continue
      const cat = iosAppCategory(app)
      msByCat[cat] = (msByCat[cat] || 0) + ms
      if (!msByHour[cat]) msByHour[cat] = new Array(24).fill(0)
      msByHour[cat][h] += ms
      const key = app.id || app.label || '?'
      const seen = byApp.get(key) || { label: app.label || app.id || '?', category: cat, ms: 0 }
      seen.ms += ms
      byApp.set(key, seen)
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
  const topApps = [...byApp.values()]
    .map((a) => ({ label: a.label, category: a.category, minutes: Math.round(a.ms / MIN) }))
    .filter((a) => a.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, TOP_APPS)
  return { date: dateKey, minutes, byHour, topApps }
}

/** Résumé d'une journée (journée en cours pour l'affichage), comme `summarizeAppsDay` d'Android. */
export function summarizeSegmentsApps(segments, dateKey) {
  return dayFromSegments(segments, dateKey)
}

/**
 * Entrées `phone_apps` des journées terminées et couvertes depuis minuit (premier segment avant 00:00), comme
 * `phoneAppsEntries` d'Android : une par jour, jamais modifiée ensuite.
 */
export function phoneAppsEntriesFromSegments(segments, { now = Date.now() } = {}) {
  const starts = (segments || []).map((s) => s?.start).filter(Number.isFinite)
  if (starts.length === 0) return []
  const first = Math.min(...starts)
  const todayKey = dateKeyOf(now)
  const out = []
  for (let key = dateKeyOf(first); key < todayKey; key = dateKeyOf(at(key, 1, 12))) {
    if (first > at(key, 0, 0)) continue
    out.push({ type: 'phone_apps', source: 'phone', at: new Date(at(key, 0, 12)).toISOString(), payload: dayFromSegments(segments, key) })
  }
  return out
}
