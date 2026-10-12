/**
 * Téléphone → temps d'écran et sommeil estimé, sans montre ni saisie (calculs purs).
 *
 * Les événements viennent du plugin natif PhoneUsage (UsageStatsManager d'Android, rien ne sort du
 * téléphone) : `{ t: ms, e: 'on' | 'off' | 'unlock' }` (écran allumé / éteint / déverrouillé).
 *
 * Conventions :
 * - temps d'écran et déverrouillages : jour civil (00:00 → 24:00) ;
 * - « écran tard » (22:00 → 04:00) et sommeil estimé comptent pour le jour du **réveil**, comme le
 *   sommeil d'une montre (voir nightlySleep) : la soirée de la veille peut expliquer la journée.
 */

const MIN = 60000
const HOUR = 60 * MIN

/** Une session plus longue est tronquée (événement « éteint » perdu : redémarrage, batterie vide). */
export const MAX_SESSION_MS = 6 * HOUR
/** Coup d'œil (heure, notification) en pleine nuit : ne coupe pas la nuit. */
export const GLANCE_MAX_MS = 2 * MIN
/** Plage où un coup d'œil est ignoré (00:30 → 06:00) : avant, c'est encore la soirée. */
const GLANCE_FROM_MIN = 30
const GLANCE_TO_MIN = 6 * 60
/** Fenêtre de recherche de la nuit : 20:00 la veille → 12:00 le jour du réveil. */
const NIGHT_START_H = 20
const NIGHT_END_H = 12
export const MIN_SLEEP_MIN = 3 * 60
export const MAX_SLEEP_MIN = 14 * 60
/** Écran tard : 22:00 la veille → 04:00. */
const LATE_START_H = 22
const LATE_END_H = 4

function dayStart(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

/** Heure locale `h` du jour `dateKey` décalé de `dayOffset` jours (gère les changements d'heure). */
function at(dateKey, dayOffset, h, min = 0) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d + dayOffset, h, min).getTime()
}

export function dateKeyOf(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function overlap(s, a, b) {
  return Math.max(0, Math.min(s.end, b) - Math.max(s.start, a))
}

/**
 * Sessions d'écran allumé, triées, sans chevauchement.
 * Un « allumé » sans « éteint » est fermé au prochain « allumé » ou à `until` (écran encore allumé),
 * dans la limite de MAX_SESSION_MS.
 * @param {{ t: number, e: string }[]} events
 * @param {{ until?: number }} [options]
 * @returns {{ start: number, end: number }[]}
 */
export function screenSessions(events, { until } = {}) {
  const sorted = (events || [])
    .filter((ev) => ev && Number.isFinite(ev.t) && (ev.e === 'on' || ev.e === 'off'))
    .sort((a, b) => a.t - b.t)
  const out = []
  let open = null
  const close = (end) => {
    const capped = Math.min(end, open + MAX_SESSION_MS)
    if (capped > open) out.push({ start: open, end: capped })
    open = null
  }
  for (const ev of sorted) {
    if (ev.e === 'on') {
      if (open != null) close(ev.t)
      open = ev.t
    } else if (open != null) {
      close(ev.t)
    }
  }
  if (open != null && Number.isFinite(until) && until > open) close(until)
  return out
}

/**
 * Temps d'écran (minutes), écran tard la veille au soir et déverrouillages d'une journée.
 * @param {{ start: number, end: number }[]} sessions
 * @param {{ t: number, e: string }[]} events  pour compter les déverrouillages
 * @param {string} dateKey  YYYY-MM-DD
 */
export function dayScreenStats(sessions, events, dateKey) {
  const from = dayStart(dateKey)
  const to = at(dateKey, 1, 0)
  const lateFrom = at(dateKey, -1, LATE_START_H)
  const lateTo = at(dateKey, 0, LATE_END_H)
  let screenMs = 0
  let lateMs = 0
  for (const s of sessions || []) {
    screenMs += overlap(s, from, to)
    lateMs += overlap(s, lateFrom, lateTo)
  }
  const unlocks = (events || []).filter((ev) => ev?.e === 'unlock' && ev.t >= from && ev.t < to).length
  return {
    screenMinutes: Math.round(screenMs / MIN),
    lateScreenMinutes: Math.round(lateMs / MIN),
    unlocks,
  }
}

function isNightGlance(s, dateKey) {
  if (s.end - s.start > GLANCE_MAX_MS) return false
  return s.start >= at(dateKey, 0, 0, GLANCE_FROM_MIN) && s.start < at(dateKey, 0, 0, GLANCE_TO_MIN)
}

/**
 * Nuit estimée d'après le téléphone : la plus longue période sans écran entre 20:00 la veille et
 * 12:00 (coups d'œil de moins de 2 min entre 00:30 et 06:00 ignorés). Il faut un usage avant
 * (l'endormissement) et après (le réveil) dans la fenêtre : sinon on ne sait pas, donc null.
 * @param {{ start: number, end: number }[]} sessions
 * @param {string} dateKey  jour du réveil
 * @param {{ now?: number }} [options]  la nuit n'est connue qu'une fois le téléphone repris
 * @returns {{ start: string, end: string, minutes: number, glances: number } | null}
 */
export function estimatePhoneSleep(sessions, dateKey, { now = Infinity } = {}) {
  const winFrom = at(dateKey, -1, NIGHT_START_H)
  const winTo = Math.min(at(dateKey, 0, NIGHT_END_H), now)
  const inWindow = (sessions || []).filter((s) => s.end > winFrom && s.start < winTo)
  const active = inWindow.filter((s) => !isNightGlance(s, dateKey))
  let best = null
  for (let i = 0; i + 1 < active.length; i++) {
    const start = Math.max(active[i].end, winFrom)
    const end = Math.min(active[i + 1].start, winTo)
    if (end - start > (best ? best.end - best.start : 0)) best = { start, end }
  }
  if (!best) return null
  const glances = inWindow.filter((s) => isNightGlance(s, dateKey) && s.start >= best.start && s.end <= best.end)
  const glanceMs = glances.reduce((sum, s) => sum + (s.end - s.start), 0)
  const minutes = Math.round((best.end - best.start - glanceMs) / MIN)
  if (minutes < MIN_SLEEP_MIN || minutes > MAX_SLEEP_MIN) return null
  return {
    start: new Date(best.start).toISOString(),
    end: new Date(best.end).toISOString(),
    minutes,
    glances: glances.length,
  }
}

/**
 * Résumé d'une journée (stats d'écran + nuit qui s'y termine).
 * @returns {{ date: string, screenMinutes: number, lateScreenMinutes: number, unlocks: number, sleepEstimate: object|null }}
 */
export function summarizePhoneDay(events, dateKey, { now = Date.now() } = {}) {
  const sessions = screenSessions(events, { until: now })
  return {
    date: dateKey,
    ...dayScreenStats(sessions, events, dateKey),
    sleepEstimate: estimatePhoneSleep(sessions, dateKey, { now }),
  }
}

/**
 * Entrées `phone_usage` des journées **terminées** et entièrement couvertes par le journal d'Android
 * (premier événement avant 20:00 la veille) : une entrée par jour, jamais modifiée ensuite.
 * @param {{ t: number, e: string }[]} events
 * @param {{ now?: number }} [options]
 */
export function phoneUsageEntries(events, { now = Date.now() } = {}) {
  const valid = (events || []).filter((ev) => ev && Number.isFinite(ev.t))
  if (valid.length === 0) return []
  const first = Math.min(...valid.map((ev) => ev.t))
  const todayKey = dateKeyOf(now)
  const sessions = screenSessions(valid, { until: now })
  const out = []
  for (let key = dateKeyOf(first); key < todayKey; key = dateKeyOf(at(key, 1, 12))) {
    if (first > at(key, -1, NIGHT_START_H)) continue
    const stats = dayScreenStats(sessions, valid, key)
    out.push({
      type: 'phone_usage',
      source: 'phone',
      at: new Date(at(key, 0, 12)).toISOString(),
      payload: {
        date: key,
        ...stats,
        sleepEstimate: estimatePhoneSleep(sessions, key, { now }),
      },
    })
  }
  return out
}

/** « 2 h 05 », « 45 min ». */
export function formatScreenMinutes(mins) {
  if (!Number.isFinite(mins)) return ''
  const m = Math.round(mins)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`
}

