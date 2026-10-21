/**
 * Temps d'écran et sommeil estimé par le téléphone : réglages (localStorage), accès au plugin natif
 * PhoneUsage et mise à jour à l'ouverture de l'app (au plus toutes les 30 min). Chaque mise à jour
 * relit les 10 derniers jours du journal d'Android : les journées terminées deviennent des entrées
 * `phone_usage` (sans doublon), la journée en cours reste dans les réglages pour l'affichage.
 * Même chose pour le temps par catégorie d'app (entrées `phone_apps`, I116) quand le plugin natif sait
 * le lire ; sinon (ancienne version de l'app) le temps d'écran est enregistré quand même.
 */
import { Capacitor, registerPlugin } from '@capacitor/core'
import { upsertEntries } from '../storage/localHealthStorage'
import { phoneUsageEntries, summarizePhoneDay, dateKeyOf } from './phoneUsage'
import { phoneAppsEntries, summarizeAppsDay } from './phoneApps'
import { APP_NAME } from '../config/brand'

const KEY = 'healthtrack_phone_usage'
export const PHONE_USAGE_STALE_MS = 30 * 60 * 1000
const LOOKBACK_MS = 10 * 24 * 3600 * 1000

const NativePhoneUsage = registerPlugin('PhoneUsage')

/** Faux plugin des captures (`npm run visual -- --phone`), sinon le plugin natif. */
function defaultPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakePhoneUsage) return window.__healthtrackFakePhoneUsage
  return NativePhoneUsage
}

const DEFAULTS = { enabled: false, lastSyncAt: null, lastError: null, today: null, todayApps: null }

export function getPhoneUsageSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* réglages illisibles : valeurs par défaut */
  }
  return { ...DEFAULTS }
}

function setPhoneUsageSettings(patch) {
  const next = { ...getPhoneUsageSettings(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* stockage plein ou indisponible */
  }
  window.dispatchEvent(new CustomEvent('phone-usage-settings-updated'))
  return next
}

export function enablePhoneUsage() {
  return setPhoneUsageSettings({ enabled: true, lastSyncAt: null, lastError: null })
}

/** Désactive (les journées déjà enregistrées restent dans l'historique). */
export function disablePhoneUsage() {
  return setPhoneUsageSettings({ ...DEFAULTS })
}

export function isPhoneUsageAvailable() {
  if (typeof window !== 'undefined' && window.__healthtrackFakePhoneUsage) return true
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

/** @returns {Promise<{ granted: boolean, supported: boolean }>} */
export async function checkPhoneUsageAccess(plugin = defaultPlugin()) {
  try {
    const res = await plugin.checkAccess()
    return { granted: !!res?.granted, supported: res?.supported !== false }
  } catch {
    // Ancienne version de l'app sans le plugin natif.
    return { granted: false, supported: false }
  }
}

export async function openPhoneUsageAccessSettings(plugin = defaultPlugin()) {
  await plugin.openAccessSettings()
}

let inFlight = null

/** Apps au premier plan (I116), ou null si le plugin ne sait pas les lire : jamais bloquant. */
async function readAppEvents(plugin, end) {
  if (typeof plugin.queryAppEvents !== 'function') return null
  try {
    const res = await plugin.queryAppEvents({ start: end - LOOKBACK_MS, end })
    return {
      events: Array.isArray(res?.events) ? res.events : [],
      apps: res?.apps && typeof res.apps === 'object' ? res.apps : {},
    }
  } catch {
    return null
  }
}

/**
 * Lit le journal d'Android et enregistre les journées terminées. Ne lève jamais.
 * @returns {Promise<{ ran: boolean, inserted?: number, error?: string, noAccess?: boolean }>}
 */
export async function syncPhoneUsage({ force = false, now = new Date(), plugin = defaultPlugin(), write = upsertEntries } = {}) {
  const settings = getPhoneUsageSettings()
  if (!settings.enabled) return { ran: false }
  if (!force && settings.lastSyncAt && now.getTime() - new Date(settings.lastSyncAt).getTime() < PHONE_USAGE_STALE_MS) {
    return { ran: false }
  }
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const access = await checkPhoneUsageAccess(plugin)
      if (!access.granted) {
        const error = access.supported
          ? 'Accès aux données d’utilisation pas encore accordé.'
          : `Mettez à jour ${APP_NAME} (ou Android 9+) pour cette fonction.`
        setPhoneUsageSettings({ lastError: error })
        return { ran: false, noAccess: true, error }
      }
      const end = now.getTime()
      const res = await plugin.queryScreenEvents({ start: end - LOOKBACK_MS, end })
      const events = Array.isArray(res?.events) ? res.events : []
      const apps = await readAppEvents(plugin, end)
      const entries = [
        ...phoneUsageEntries(events, { now: end }),
        ...(apps ? phoneAppsEntries(apps.events, apps.apps, { now: end }) : []),
      ]
      const result = entries.length ? await write(entries) : { inserted: 0 }
      setPhoneUsageSettings({
        lastSyncAt: now.toISOString(),
        lastError: null,
        today: events.length ? summarizePhoneDay(events, dateKeyOf(end), { now: end }) : null,
        todayApps: apps?.events.length ? summarizeAppsDay(apps.events, apps.apps, dateKeyOf(end), { now: end }) : null,
      })
      if (result?.inserted > 0) window.dispatchEvent(new CustomEvent('health-entries-updated'))
      return { ran: true, inserted: result?.inserted ?? 0 }
    } catch (e) {
      const error = e?.message || 'Lecture du temps d’écran impossible.'
      setPhoneUsageSettings({ lastError: error })
      return { ran: false, error }
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}
