/**
 * « Note du soir d'un geste » (journal/IDEES.md I113) : une notification à l'heure habituelle des notes de
 * bien-être, avec les 5 notes de l'échelle (1 à 5) en boutons (natif : EveningNoteNotice.java, règle mood/EveningNote.java).
 * Le geste ne lance pas l'app : la note attend dans une boîte native et devient, à l'ouverture suivante, une note
 * `wellbeing` de la même forme qu'une note saisie (même source, même export), écrite sans doublon.
 *
 * C'est de l'auto-déclaration : Y, la vérité terrain de la porte du visage (mood/gate.js). Jamais obligatoire,
 * jamais deux fois par soir, jamais si une note existe déjà ce jour-là ; l'heure suit vos notes du soir (médiane
 * des 14 derniers jours), 21 h par défaut. L'interrupteur est gardé côté natif ; ce module en garde un miroir.
 */
import { registerPlugin } from '@capacitor/core'
import { listEntries, upsertEntries } from '../storage/localHealthStorage'
import { localDateKey } from './wellbeingSeries'
import { choiceToScore } from './mood/wellbeingScale'

export const DEFAULT_MINUTE = 21 * 60
const EARLIEST_MINUTE = 18 * 60
const LATEST_MINUTE = 23 * 60
/** Une note « du soir » : saisie à partir de 17 h. */
const EVENING_FROM_MINUTE = 17 * 60
/** Il faut au moins 3 notes du soir récentes pour déplacer l'heure. */
const MIN_EVENING_NOTES = 3
const LEARN_DAYS = 14
/** v1 : « score » 0 à 5 (ancienne échelle, gardé tel quel) ; v2 : « choice » 1 à 5 (TESTEUR-2c). */
const RECORD_VERSIONS = [1, 2]
const KEY = 'healthtrack_evening_note'
const MINUTE_KEY = 'healthtrack_evening_note_minute'

const NativeEveningNote = registerPlugin('EveningNote')
const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

/** Plugin natif dans l'app, faux plugin des captures / tests, sinon aucun. */
export function eveningNotePlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeEveningNote) return window.__healthtrackFakeEveningNote
  return isNative() ? NativeEveningNote : null
}

const minuteOf = (iso) => {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * Heure habituelle du soir (minute du jour) : médiane des heures données (ISO) à partir de 17 h sur les 14 derniers
 * jours, ramenée entre 18 h et 23 h ; `fallback` avec moins de 3 heures du soir. Sert aussi au bilan du ventre.
 */
export function learnEveningMinute(ats, now = new Date(), fallback = DEFAULT_MINUTE) {
  const since = now.getTime() - LEARN_DAYS * 86_400_000
  const minutes = (ats || [])
    .filter((at) => at && new Date(at).getTime() >= since)
    .map(minuteOf)
    .filter((m) => m >= EVENING_FROM_MINUTE)
    .sort((a, b) => a - b)
  if (minutes.length < MIN_EVENING_NOTES) return fallback
  const mid = minutes.length >> 1
  const median = minutes.length % 2 ? minutes[mid] : Math.round((minutes[mid - 1] + minutes[mid]) / 2)
  return Math.max(EARLIEST_MINUTE, Math.min(LATEST_MINUTE, median))
}

/** Heure de la notification (minute du jour) : médiane des notes du soir des 14 derniers jours, sinon 21 h. */
export function eveningNoteMinute(notes, now = new Date()) {
  return learnEveningMinute((notes || []).filter((n) => n?.type === 'wellbeing').map((n) => n.at), now)
}

/** Jour local (AAAA-MM-JJ) de la note la plus récente, ou null. */
export function latestNoteDay(notes) {
  const last = (notes || []).reduce((max, n) => (n?.at && (max == null || n.at > max) ? n.at : max), null)
  return last ? localDateKey(last) : null
}

export function formatMinute(minute) {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

/** Miroir local de l'interrupteur (le natif fait foi). */
export function isEveningNoteEnabled(storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage?.getItem(KEY) || '{}')?.enabled === true
  } catch {
    return false
  }
}

function mirror(enabled, storage) {
  try {
    storage?.setItem(KEY, JSON.stringify({ enabled: !!enabled }))
  } catch {
    /* seul l'affichage initial en pâtit */
  }
}

/** Note `wellbeing` d'un JSON déposé par le natif, ou null s'il n'est pas lisible. */
export function parseEveningNote(json) {
  let r
  try {
    r = JSON.parse(json)
  } catch {
    return null
  }
  if (!r || typeof r !== 'object' || !RECORD_VERSIONS.includes(r.v)) return null
  let score
  if (r.v === 1) {
    if (!Number.isInteger(r.score) || r.score < 0 || r.score > 5) return null
    score = r.score
  } else {
    score = choiceToScore(r.choice)
    if (score == null) return null
  }
  if (typeof r.at !== 'number' || !Number.isFinite(r.at) || r.at <= 0) return null
  return { type: 'wellbeing', source: 'app_wellbeing', at: new Date(r.at).toISOString(), payload: { score } }
}

function notifyEntriesUpdated() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('health-entries-updated'))
}

let inFlight = null

/**
 * Range les notes données depuis la notification. Rend { imported, inserted, dropped, kept }. Ne lève jamais.
 */
export function importPendingEveningNotes({ plugin = eveningNotePlugin(), write = upsertEntries, onInserted = notifyEntriesUpdated } = {}) {
  if (inFlight) return inFlight
  inFlight = drainNativeInbox({ plugin, parse: parseEveningNote, write, onInserted }).finally(() => {
    inFlight = null
  })
  return inFlight
}

/**
 * Vide une boîte native (`list` → { notes: [{ name, json }] }, `remove`) : chaque JSON lisible devient une entrée
 * écrite sans doublon, les illisibles sont retirées, celles qu'on n'a pas pu écrire restent pour la prochaine fois.
 * Sert aussi au bilan du ventre (gutEvening.js). Ne lève jamais.
 */
export async function drainNativeInbox({ plugin, parse, write = upsertEntries, onInserted = notifyEntriesUpdated }) {
  const out = { imported: 0, inserted: 0, dropped: 0, kept: 0 }
  if (!plugin?.list) return out
  let items = []
  try {
    items = (await plugin.list())?.notes || []
  } catch {
    return out
  }
  const entries = []
  const read = []
  const dropped = []
  for (const it of items) {
    const entry = parse(it?.json)
    if (entry) {
      entries.push(entry)
      read.push(it.name)
    } else {
      dropped.push(it?.name)
    }
  }
  out.dropped = dropped.length
  let done = dropped
  if (entries.length) {
    try {
      const res = await write(entries)
      out.imported = entries.length
      out.inserted = res?.inserted ?? 0
      done = [...read, ...dropped]
    } catch {
      out.kept = entries.length
    }
  }
  const names = done.filter(Boolean)
  if (names.length && plugin.remove) {
    try {
      await plugin.remove({ names })
    } catch {
      /* retirées à la prochaine ouverture : l'écriture est sans doublon */
    }
  }
  if (out.inserted > 0) onInserted?.()
  return out
}

/** Heure choisie par l'utilisateur (minute du jour, 18 h à 23 h), ou null : l'heure apprise s'applique alors. */
export function getEveningNoteMinute(storage = globalThis.localStorage) {
  try {
    const m = JSON.parse(storage?.getItem(MINUTE_KEY) || 'null')
    return Number.isInteger(m) && m >= EARLIEST_MINUTE && m <= LATEST_MINUTE ? m : null
  } catch {
    return null
  }
}

/** Garde l'heure choisie (ramenée entre 18 h et 23 h) ; null l'oublie. Rend la minute gardée, ou null. */
export function setEveningNoteMinute(minute, storage = globalThis.localStorage) {
  const m = Number.isInteger(minute) ? Math.max(EARLIEST_MINUTE, Math.min(LATEST_MINUTE, minute)) : null
  try {
    if (m == null) storage?.removeItem(MINUTE_KEY)
    else storage?.setItem(MINUTE_KEY, JSON.stringify(m))
  } catch {
    /* l'heure apprise s'appliquera */
  }
  return m
}

async function learned({ list, now, storage }) {
  const since = new Date(now.getTime() - LEARN_DAYS * 86_400_000).toISOString()
  const notes = await list({ type: 'wellbeing', since, limit: 500 })
  return { minuteOfDay: getEveningNoteMinute(storage) ?? eveningNoteMinute(notes, now), noteDay: latestNoteDay(notes) }
}

/**
 * Transmet au natif l'heure apprise et le jour de la dernière note (pas de notification ce soir-là s'il y en a
 * une). Rend l'état natif, ou null hors de l'app Android. Ne lève jamais.
 */
export async function syncEveningNote({ plugin = eveningNotePlugin(), list = listEntries, now = new Date(), storage = globalThis.localStorage } = {}) {
  if (!plugin?.configure) return null
  try {
    const status = await plugin.configure(await learned({ list, now, storage }))
    mirror(status?.enabled, storage)
    return status
  } catch {
    return null
  }
}

/**
 * Allume ou éteint la note du soir (à l'heure choisie, sinon apprise). Allumer demande d'abord l'autorisation des notifications (Android 13+).
 * Rend { enabled, notifications, blocked } : `blocked` quand les notifications restent refusées sans que
 * Android puisse encore les demander (à autoriser dans les réglages).
 */
export async function setEveningNoteEnabled(enabled, { plugin = eveningNotePlugin(), list = listEntries, now = new Date(), storage = globalThis.localStorage } = {}) {
  if (!plugin?.configure) return { enabled: false, notifications: false, blocked: false }
  let ask = null
  if (enabled && plugin.requestNotifications) {
    try {
      ask = await plugin.requestNotifications()
    } catch {
      ask = null
    }
  }
  let opts = { enabled: !!enabled }
  if (enabled) {
    try {
      opts = { ...opts, ...(await learned({ list, now, storage })) }
    } catch {
      /* l'heure par défaut suffit */
    }
  }
  const status = await plugin.configure(opts)
  mirror(status?.enabled, storage)
  const notifications = status?.notifications ?? ask?.notifications ?? false
  return { enabled: !!status?.enabled, notifications: !!notifications, blocked: !!enabled && ask?.asked === false && !notifications }
}

/** État natif, ou null hors de l'app Android. Ne lève jamais. */
export async function getEveningNoteStatus(plugin = eveningNotePlugin()) {
  if (!plugin?.status) return null
  try {
    return await plugin.status()
  } catch {
    return null
  }
}

const iso = (ms) => (ms ? new Date(ms).toISOString() : null)

/** Bloc du diagnostic exportable : réglages, compteurs et raisons, jamais une note. */
export function eveningNoteDiagnostic(s) {
  if (!s) return null
  return {
    enabled: !!s.enabled,
    time: formatMinute(s.minuteOfDay ?? DEFAULT_MINUTE),
    nextAt: iso(s.nextAt),
    notifications: !!s.notifications,
    pending: s.pending ?? 0,
    asked: s.asked ?? 0,
    answers: s.answers ?? 0,
    lastAskedDay: s.askedDay ?? null,
    lastCheck: s.check ?? null,
    lastCheckAt: iso(s.checkAt),
    lastError: s.lastError ?? null,
  }
}
