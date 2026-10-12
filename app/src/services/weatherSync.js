/**
 * Météo automatique : réglages (localStorage) et mise à jour en arrière-plan, au plus toutes les 3 h,
 * à l'ouverture de l'app. Chaque mise à jour reprend les 92 derniers jours (sans doublon : une journée
 * déjà enregistrée est ignorée), donc quelques jours sans ouvrir l'app ne laissent pas de trou.
 */
import { upsertEntries } from '../storage/localHealthStorage'
import { localDateKey } from './analysisEngine'
import {
  roundCoord,
  forecastUrl,
  airQualityUrl,
  geocodeUrl,
  parseGeocoding,
  parseWeatherDays,
  weatherDaysToEntries,
} from './weather'

const KEY = 'healthtrack_weather'

export const WEATHER_STALE_MS = 3 * 3600 * 1000

const DEFAULTS = { enabled: false, location: null, lastSyncAt: null, lastError: null, today: null }

export function getWeatherSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* réglages illisibles : valeurs par défaut */
  }
  return { ...DEFAULTS }
}

function setWeatherSettings(patch) {
  const next = { ...getWeatherSettings(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* stockage plein ou indisponible */
  }
  window.dispatchEvent(new CustomEvent('weather-settings-updated'))
  return next
}

/** Active la météo pour un lieu ; seule une position arrondie (≈ 10 km) est gardée. */
export function enableWeather({ lat, lon, name }) {
  return setWeatherSettings({
    enabled: true,
    location: { lat: roundCoord(lat), lon: roundCoord(lon), name: name || null },
    lastSyncAt: null,
    lastError: null,
    today: null,
  })
}

/** Désactive et oublie le lieu (les journées déjà enregistrées restent dans l'historique). */
export function disableWeather() {
  return setWeatherSettings({ ...DEFAULTS })
}

export function isWeatherStale(lastSyncAt, now = new Date()) {
  if (!lastSyncAt) return true
  return now.getTime() - new Date(lastSyncAt).getTime() > WEATHER_STALE_MS
}

async function getJson(fetchImpl, url, what) {
  let res
  try {
    res = await fetchImpl(url)
  } catch {
    throw new Error('Pas de connexion internet : nouvel essai à la prochaine ouverture.')
  }
  if (!res.ok) throw new Error(`${what} indisponible pour le moment (erreur ${res.status}).`)
  return res.json()
}

let inFlight = null

/**
 * Met à jour la météo si elle est activée et que la dernière mise à jour date de plus de 3 h (ou `force`).
 * Ne lève jamais : l'erreur est notée dans les réglages pour l'affichage.
 * @returns {Promise<{ ran: boolean, saved?: number, error?: string }>}
 */
export async function syncWeather({ force = false, now = new Date(), fetchImpl, write = upsertEntries } = {}) {
  const settings = getWeatherSettings()
  if (!settings.enabled || !settings.location) return { ran: false }
  if (!force && !isWeatherStale(settings.lastSyncAt, now)) return { ran: false }
  if (inFlight) return inFlight
  const doFetch = fetchImpl || ((url) => fetch(url))
  inFlight = (async () => {
    try {
      const [forecast, air] = await Promise.all([
        getJson(doFetch, forecastUrl(settings.location), 'La météo'),
        getJson(doFetch, airQualityUrl(settings.location), 'La qualité de l’air'),
      ])
      const days = parseWeatherDays(forecast, air)
      if (days.length === 0) throw new Error('Réponse météo illisible : nouvel essai plus tard.')
      const todayKey = localDateKey(now.toISOString())
      const entries = weatherDaysToEntries(days, { todayKey, place: settings.location.name || undefined })
      const result = entries.length ? await write(entries) : { inserted: 0 }
      setWeatherSettings({
        lastSyncAt: now.toISOString(),
        lastError: null,
        today: days.find((d) => d.date === todayKey) || null,
      })
      if (result?.inserted > 0) window.dispatchEvent(new CustomEvent('health-entries-updated'))
      return { ran: true, saved: entries.length, inserted: result?.inserted ?? 0 }
    } catch (e) {
      const error = e?.message || 'Mise à jour météo impossible.'
      setWeatherSettings({ lastError: error })
      return { ran: false, error }
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

/** Recherche de ville (Open-Meteo, sans clé) : seul le nom tapé est envoyé. */
export async function searchPlaces(query, { fetchImpl } = {}) {
  const q = String(query || '').trim()
  if (q.length < 2) return []
  const doFetch = fetchImpl || ((url) => fetch(url))
  const json = await getJson(doFetch, geocodeUrl(q), 'La recherche de ville')
  return parseGeocoding(json)
}
