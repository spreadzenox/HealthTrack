/**
 * Bilan du ventre du soir par notification (I170 étape 2) : à l'heure habituelle des bilans (20 h par défaut), une
 * notification « Et votre ventre aujourd'hui ? » avec Calme / Gêne / Douleur en boutons (natif :
 * GutEveningNotice.java, règle gut/GutEvening.java). Le geste ne lance pas l'app : la réponse attend dans une boîte
 * native et devient, à l'ouverture suivante, le même bilan qu'un geste dans la carte « Votre ventre » (entrée `gut`,
 * `payload.scope = 'day'`, même export), écrit sans doublon.
 *
 * Jamais sans le choix de la personne (interrupteur gardé ici), jamais si l'Accueil n'a pas de carte ventre (objectif
 * autre que « Mon ventre », POL-4), jamais deux fois par soir, jamais si le bilan du jour est déjà fait. Le natif
 * reçoit l'état effectif ; le choix de la personne survit à un changement d'objectif.
 */
import { registerPlugin } from '@capacitor/core'
import { listEntries, upsertEntries } from '../storage/localHealthStorage'
import { localDateKey } from './wellbeingSeries'
import { GUT_DAY_SCOPE, GUT_LEVELS, GUT_SOURCE, GUT_TYPE, isGutDayNote } from './today'
import { drainNativeInbox, learnEveningMinute } from './eveningNote'
import { gutCardMode, loadOnboarding } from '../settings/onboarding'

export const GUT_DEFAULT_MINUTE = 20 * 60
const LEARN_DAYS = 14
const RECORD_VERSION = 1
const KEY = 'healthtrack_gut_evening'

const NativeGutEvening = registerPlugin('GutEvening')
const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

/** Plugin natif dans l'app, faux plugin des captures / tests, sinon aucun. */
export function gutEveningPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeGutEvening) return window.__healthtrackFakeGutEvening
  return isNative() ? NativeGutEvening : null
}

/** Choix de la personne (allumé / éteint), indépendant de l'objectif. */
export function isGutEveningWanted(storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage?.getItem(KEY) || '{}')?.enabled === true
  } catch {
    return false
  }
}

function saveWanted(enabled, storage) {
  try {
    storage?.setItem(KEY, JSON.stringify({ enabled: !!enabled }))
  } catch {
    /* le natif garde l'état effectif */
  }
}

/** La carte ventre existe-t-elle sur l'Accueil ? Sinon, pas de notification. */
export const gutEveningAllowed = (onboarding = loadOnboarding()) => gutCardMode(onboarding) !== 'hide'

const dayNotes = (entries) => (entries || []).filter((e) => e?.type === GUT_TYPE && isGutDayNote(e))

/** Heure de la notification : médiane des bilans du soir des 14 derniers jours, sinon 20 h. */
export function gutEveningMinute(entries, now = new Date()) {
  return learnEveningMinute(dayNotes(entries).map((e) => e.at), now, GUT_DEFAULT_MINUTE)
}

/** Jour local (AAAA-MM-JJ) du bilan le plus récent, ou null. */
export function latestGutDayNote(entries) {
  const last = dayNotes(entries).reduce((max, e) => (max == null || e.at > max ? e.at : max), null)
  return last ? localDateKey(last) : null
}

/** Bilan `gut` d'un JSON déposé par le natif ({ v, level, at }), ou null s'il n'est pas lisible. */
export function parseGutEvening(json) {
  let r
  try {
    r = JSON.parse(json)
  } catch {
    return null
  }
  if (!r || typeof r !== 'object' || r.v !== RECORD_VERSION) return null
  if (!GUT_LEVELS.some((l) => l.id === r.level)) return null
  if (typeof r.at !== 'number' || !Number.isFinite(r.at) || r.at <= 0) return null
  return { type: GUT_TYPE, source: GUT_SOURCE, at: new Date(r.at).toISOString(), payload: { level: r.level, scope: GUT_DAY_SCOPE } }
}

let inFlight = null

/** Range les bilans donnés depuis la notification. Rend { imported, inserted, dropped, kept }. Ne lève jamais. */
export function importPendingGutEvenings({ plugin = gutEveningPlugin(), write = upsertEntries, onInserted } = {}) {
  if (inFlight) return inFlight
  const opts = { plugin, parse: parseGutEvening, write }
  if (onInserted) opts.onInserted = onInserted
  inFlight = drainNativeInbox(opts).finally(() => {
    inFlight = null
  })
  return inFlight
}

async function learned({ list, now }) {
  const since = new Date(now.getTime() - LEARN_DAYS * 86_400_000).toISOString()
  const entries = await list({ type: GUT_TYPE, since, limit: 1000 })
  return { minuteOfDay: gutEveningMinute(entries, now), noteDay: latestGutDayNote(entries) }
}

const effective = (storage, onboarding) => isGutEveningWanted(storage) && gutEveningAllowed(onboarding)

/**
 * Transmet au natif l'état effectif (choix × carte ventre), l'heure apprise et le jour du dernier bilan. Rend l'état
 * natif, ou null hors de l'app Android. Ne lève jamais.
 */
export async function syncGutEvening({ plugin = gutEveningPlugin(), list = listEntries, now = new Date(), storage = globalThis.localStorage, onboarding = loadOnboarding() } = {}) {
  if (!plugin?.configure) return null
  try {
    const enabled = effective(storage, onboarding)
    let opts = { enabled }
    if (enabled) opts = { ...opts, ...(await learned({ list, now })) }
    return await plugin.configure(opts)
  } catch {
    return null
  }
}

/**
 * Allume ou éteint le rappel du bilan. Allumer demande d'abord l'autorisation des notifications (Android 13+).
 * Rend { enabled, notifications, blocked } (`blocked` : refusées sans que Android puisse encore les demander).
 */
export async function setGutEveningEnabled(enabled, { plugin = gutEveningPlugin(), list = listEntries, now = new Date(), storage = globalThis.localStorage, onboarding = loadOnboarding() } = {}) {
  if (!plugin?.configure) return { enabled: false, notifications: false, blocked: false }
  saveWanted(enabled, storage)
  let ask = null
  if (enabled && plugin.requestNotifications) {
    try {
      ask = await plugin.requestNotifications()
    } catch {
      ask = null
    }
  }
  const status = await syncGutEvening({ plugin, list, now, storage, onboarding })
  const notifications = status?.notifications ?? ask?.notifications ?? false
  return { enabled: !!status?.enabled, notifications: !!notifications, blocked: !!enabled && ask?.asked === false && !notifications }
}

/** État natif, ou null hors de l'app Android. Ne lève jamais. */
export async function getGutEveningStatus(plugin = gutEveningPlugin()) {
  if (!plugin?.status) return null
  try {
    return await plugin.status()
  } catch {
    return null
  }
}
