/**
 * Version iOS (HealthTrack-iOS) — temps d'écran et nuit estimée depuis l'iPhone (I8, calculs purs).
 *
 * Android lit les allumages d'écran un à un (`phoneUsage.js`). L'iPhone ne donne que des totaux par heure
 * (`DeviceActivityData.activityData`, iOS 26.4+, appareils de l'UE, avec l'accord de la personne) : le plugin natif
 * `PhoneUsage` les rend en segments `{ start, end, activeMs, pickups, firstPickup }` (ms). Ce module en tire les
 * mêmes entrées `phone_usage` que sur Android, avec les mêmes conventions (jour civil ; écran tard 22:00 → 04:00 et
 * nuit comptés pour le jour du réveil) ; la nuit est estimée à l'heure près (fin de la dernière heure d'usage du
 * soir), la reprise du matin à la minute (première prise en main). Rien ne sort du téléphone.
 */
import { Capacitor } from '@capacitor/core'
import { MIN_SLEEP_MIN, MAX_SLEEP_MIN, GLANCE_MAX_MS, dateKeyOf } from '../services/phoneUsage'
import { phoneAppsEntriesFromSegments, summarizeSegmentsApps } from './phoneAppsIos'

const MIN = 60000
const NIGHT_START_H = 20
const NIGHT_END_H = 12
const LATE_START_H = 22
const LATE_END_H = 4
/** Heures où un coup d'œil (≤ 2 min) ne coupe pas la nuit : de 01:00 à 06:00, comme 00:30 → 06:00 sur Android. */
const GLANCE_FROM_H = 1
const GLANCE_TO_H = 6

function at(dateKey, dayOffset, h, min = 0) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d + dayOffset, h, min).getTime()
}

/**
 * Segments valides, triés, un par heure : la même heure vue sur un autre iPhone du même compte (Temps d'écran partagé
 * entre appareils) est additionnée, et sa première prise en main est la plus tôt des deux.
 */
function valid(segments) {
  const byStart = new Map()
  for (const s of segments || []) {
    if (!s || !Number.isFinite(s.start) || !Number.isFinite(s.end) || !(s.end > s.start)) continue
    const seen = byStart.get(s.start)
    if (!seen) {
      byStart.set(s.start, { ...s })
      continue
    }
    seen.activeMs = (seen.activeMs || 0) + (s.activeMs || 0)
    seen.pickups = (seen.pickups || 0) + (s.pickups || 0)
    if (Number.isFinite(s.firstPickup) && !(seen.firstPickup <= s.firstPickup)) seen.firstPickup = s.firstPickup
  }
  return [...byStart.values()].sort((a, b) => a.start - b.start)
}

const within = (s, from, to) => s.start >= from && s.start < to

function isGlance(s) {
  const h = new Date(s.start).getHours()
  return (s.activeMs || 0) > 0 && (s.activeMs || 0) <= GLANCE_MAX_MS && h >= GLANCE_FROM_H && h < GLANCE_TO_H
}

/** Minutes d'écran, écran tard la veille au soir et prises en main d'une journée. */
function dayStats(segments, dateKey) {
  const from = at(dateKey, 0, 0)
  const to = at(dateKey, 1, 0)
  const lateFrom = at(dateKey, -1, LATE_START_H)
  const lateTo = at(dateKey, 0, LATE_END_H)
  let screenMs = 0
  let lateMs = 0
  let unlocks = 0
  for (const s of segments) {
    if (within(s, from, to)) {
      screenMs += s.activeMs || 0
      unlocks += s.pickups || 0
    }
    if (within(s, lateFrom, lateTo)) lateMs += s.activeMs || 0
  }
  return { screenMinutes: Math.round(screenMs / MIN), lateScreenMinutes: Math.round(lateMs / MIN), unlocks }
}

/**
 * Nuit estimée (jour du réveil) : la plus longue suite d'heures sans usage entre 20:00 la veille et 12:00, coups d'œil
 * nocturnes ignorés, avec un usage avant et après. Début : fin de la dernière heure d'usage ; fin : première prise en
 * main de l'heure de reprise (sinon son début). Comme sur Android : null hors de 3 h à 14 h.
 */
export function estimateSegmentsSleep(segments, dateKey, { now = Infinity } = {}) {
  const winFrom = at(dateKey, -1, NIGHT_START_H)
  const winTo = Math.min(at(dateKey, 0, NIGHT_END_H), now)
  const hours = valid(segments).filter((s) => s.start >= winFrom && s.end <= winTo)
  const quiet = (s) => !(s.activeMs > 0) || isGlance(s)
  let best = null
  for (let i = 0; i < hours.length; i++) {
    if (quiet(hours[i]) || i + 1 >= hours.length || !quiet(hours[i + 1])) continue
    let j = i + 1
    while (j < hours.length && quiet(hours[j])) j++
    if (j >= hours.length) break // pas encore de reprise : nuit inconnue
    const run = hours.slice(i + 1, j)
    const start = hours[i].end
    const next = hours[j]
    const end = Number.isFinite(next.firstPickup) && next.firstPickup >= next.start ? next.firstPickup : next.start
    if (!best || end - start > best.end - best.start) best = { start, end, run }
    i = j - 1
  }
  if (!best) return null
  const glances = best.run.filter(isGlance)
  const glanceMs = glances.reduce((sum, s) => sum + (s.activeMs || 0), 0)
  const minutes = Math.round((best.end - best.start - glanceMs) / MIN)
  if (minutes < MIN_SLEEP_MIN || minutes > MAX_SLEEP_MIN) return null
  return { start: new Date(best.start).toISOString(), end: new Date(best.end).toISOString(), minutes, glances: glances.length }
}

/** Résumé d'une journée, comme `summarizePhoneDay` d'Android. */
export function summarizeSegmentsDay(segments, dateKey, { now = Date.now() } = {}) {
  const list = valid(segments)
  return { date: dateKey, ...dayStats(list, dateKey), sleepEstimate: estimateSegmentsSleep(list, dateKey, { now }) }
}

/**
 * Entrées `phone_usage` des journées terminées et couvertes (premier segment avant 20:00 la veille), comme
 * `phoneUsageEntries` d'Android : une par jour, jamais modifiée ensuite.
 */
export function phoneUsageEntriesFromSegments(segments, { now = Date.now() } = {}) {
  const list = valid(segments)
  if (list.length === 0) return []
  const first = list[0].start
  const todayKey = dateKeyOf(now)
  const out = []
  for (let key = dateKeyOf(first); key < todayKey; key = dateKeyOf(at(key, 1, 12))) {
    if (first > at(key, -1, NIGHT_START_H)) continue
    out.push({
      type: 'phone_usage',
      source: 'phone',
      at: new Date(at(key, 0, 12)).toISOString(),
      payload: { date: key, ...dayStats(list, key), sleepEstimate: estimateSegmentsSleep(list, key, { now }) },
    })
  }
  return out
}

/**
 * Le plugin rend-il des segments horaires (iPhone) plutôt que les événements d'Android ? Le plugin natif est un proxy
 * de Capacitor (toute méthode « existe ») : la plateforme décide ; un faux plugin (tests, captures) se reconnaît à ses
 * méthodes.
 */
export function readsSegments(plugin, platform = Capacitor.getPlatform()) {
  if (platform === 'ios') return true
  return typeof plugin?.queryUsageSegments === 'function' && typeof plugin?.queryScreenEvents !== 'function'
}

/** Message quand l'autorisation Temps d'écran manque (`{ supported }` de `checkAccess`). */
export function segmentsAccessError(access) {
  return access?.supported === false
    ? 'Le temps d’écran demande iOS 26.4 ou plus : mettez à jour l’iPhone.'
    : 'Accès au temps d’écran pas encore accordé.'
}

/**
 * Lecture iPhone de `syncPhoneUsage` (accès déjà vérifié) : segments des `lookbackMs` dernières millisecondes, journées
 * terminées enregistrées (sans doublon), minutes par catégorie d'app comprises quand le plugin rend les apps de
 * chaque heure (`phoneAppsIos.js`), journée en cours gardée dans les réglages par `save`. Peut lever : l'appelant
 * rattrape.
 */
export async function syncSegments({ plugin, now, write, save, lookbackMs }) {
  const end = now.getTime()
  const res = await plugin.queryUsageSegments({ start: end - lookbackMs, end })
  const segments = Array.isArray(res?.segments) ? res.segments : []
  // Apps de chaque heure : seulement si le plugin sait les lire (pas de journées vides sinon)
  const withApps = segments.some((s) => Array.isArray(s?.apps))
  const entries = [
    ...phoneUsageEntriesFromSegments(segments, { now: end }),
    ...(withApps ? phoneAppsEntriesFromSegments(segments, { now: end }) : []),
  ]
  const result = entries.length ? await write(entries) : { inserted: 0 }
  save({
    lastSyncAt: now.toISOString(),
    lastError: null,
    today: segments.length ? summarizeSegmentsDay(segments, dateKeyOf(end), { now: end }) : null,
    todayApps: withApps ? summarizeSegmentsApps(segments, dateKeyOf(end)) : null,
  })
  if (result?.inserted > 0) window.dispatchEvent(new CustomEvent('health-entries-updated'))
  return { ran: true, inserted: result?.inserted ?? 0 }
}
