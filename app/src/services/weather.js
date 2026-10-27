/**
 * Contexte météo et air (Open-Meteo : gratuit, sans compte ni clé).
 *
 * Seule une position arrondie au dixième de degré (≈ 10 km) quitte le téléphone ; aucune donnée de santé.
 * Une journée = une entrée `weather` (source `open_meteo`) : températures, pluie, ensoleillement,
 * pression moyenne et sa variation depuis la veille, humidité, indice européen de qualité de l'air et
 * pollens. Seules les journées terminées sont enregistrées : celle en cours changerait encore.
 */
import { decimalMark } from '../i18n/locale.js'

const FORECAST_API = 'https://api.open-meteo.com/v1/forecast'
const AIR_API = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search'

/** Historique récupéré à chaque mise à jour (maximum accepté par Open-Meteo sans l'API d'archives). */
export const WEATHER_PAST_DAYS = 92

export const POLLEN_TYPES = {
  alder: 'aulne',
  birch: 'bouleau',
  grass: 'graminées',
  mugwort: 'armoise',
  olive: 'olivier',
  ragweed: 'ambroisie',
}

const round1 = (v) => Math.round(v * 10) / 10
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

/** Arrondi au dixième de degré (≈ 10 km) : la position exacte ne quitte jamais le téléphone. */
export function roundCoord(v) {
  const r = Math.round(v * 10) / 10
  return r === 0 ? 0 : r // pas de « -0 »
}

function coordParams({ lat, lon }) {
  return { latitude: String(roundCoord(lat)), longitude: String(roundCoord(lon)), timezone: 'auto' }
}

export function forecastUrl(location) {
  const params = new URLSearchParams({
    ...coordParams(location),
    hourly: 'pressure_msl,relative_humidity_2m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration',
    past_days: String(WEATHER_PAST_DAYS),
    forecast_days: '1',
  })
  return `${FORECAST_API}?${params}`
}

export function airQualityUrl(location) {
  const params = new URLSearchParams({
    ...coordParams(location),
    hourly: ['european_aqi', ...Object.keys(POLLEN_TYPES).map((k) => `${k}_pollen`)].join(','),
    past_days: String(WEATHER_PAST_DAYS),
    forecast_days: '1',
  })
  return `${AIR_API}?${params}`
}

export function geocodeUrl(query) {
  const params = new URLSearchParams({ name: String(query || '').trim(), count: '5', language: 'fr', format: 'json' })
  return `${GEOCODING_API}?${params}`
}

/** Résultats de la recherche de ville : nom, région / pays, coordonnées arrondies. */
export function parseGeocoding(json) {
  const results = Array.isArray(json?.results) ? json.results : []
  return results
    .filter((r) => r?.name && isNum(r.latitude) && isNum(r.longitude))
    .map((r) => ({
      name: r.name,
      detail: [r.admin1, r.country].filter(Boolean).join(', '),
      lat: roundCoord(r.latitude),
      lon: roundCoord(r.longitude),
    }))
}

/** Valeurs horaires regroupées par date locale (« 2026-10-12T14:00 » → « 2026-10-12 »). */
function hourlyByDate(hourly, key) {
  const out = new Map()
  const times = hourly?.time
  const values = hourly?.[key]
  if (!Array.isArray(times) || !Array.isArray(values)) return out
  times.forEach((t, i) => {
    const v = values[i]
    if (typeof t !== 'string' || !isNum(v)) return
    const date = t.slice(0, 10)
    if (!out.has(date)) out.set(date, [])
    out.get(date).push(v)
  })
  return out
}

const meanOf = (vs) => (vs && vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null)
const maxOf = (vs) => (vs && vs.length ? Math.max(...vs) : null)
const valueAt = (arr, i) => (Array.isArray(arr) && isNum(arr[i]) ? arr[i] : null)

/**
 * Une journée par date de la prévision (passé compris).
 * @returns {Array<{ date, tempMaxC, tempMinC, precipMm, sunshineH, pressureHpa, pressureChangeHpa, humidityPct,
 *   aqi, pollen, pollenMax }>}
 */
export function parseWeatherDays(forecast, air) {
  const daily = forecast?.daily
  if (!daily || !Array.isArray(daily.time)) return []
  const pressure = hourlyByDate(forecast.hourly, 'pressure_msl')
  const humidity = hourlyByDate(forecast.hourly, 'relative_humidity_2m')
  const aqi = hourlyByDate(air?.hourly, 'european_aqi')
  const pollens = Object.keys(POLLEN_TYPES).map((k) => [k, hourlyByDate(air?.hourly, `${k}_pollen`)])
  const hasAir = Boolean(air?.hourly)

  const days = daily.time.map((date, i) => {
    const p = meanOf(pressure.get(date))
    const h = meanOf(humidity.get(date))
    const sunshine = valueAt(daily.sunshine_duration, i)
    const pollen = {}
    for (const [k, byDate] of pollens) {
      const m = maxOf(byDate.get(date))
      if (m !== null) pollen[k] = round1(m)
    }
    const pollenValues = Object.values(pollen)
    return {
      date,
      tempMaxC: valueAt(daily.temperature_2m_max, i),
      tempMinC: valueAt(daily.temperature_2m_min, i),
      precipMm: valueAt(daily.precipitation_sum, i),
      sunshineH: sunshine === null ? null : round1(sunshine / 3600),
      pressureHpa: p === null ? null : round1(p),
      pressureChangeHpa: null,
      humidityPct: h === null ? null : Math.round(h),
      aqi: hasAir ? maxOf(aqi.get(date)) : null,
      pollen: hasAir ? pollen : {},
      pollenMax: hasAir && pollenValues.length ? Math.max(...pollenValues) : hasAir && pollens.some(([, m]) => m.size) ? 0 : null,
    }
  })
  // Variation de pression depuis la veille (une chute franche est un déclencheur classique de migraine).
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1].pressureHpa
    const cur = days[i].pressureHpa
    if (prev !== null && cur !== null) days[i].pressureChangeHpa = round1(cur - prev)
  }
  return days
}

function localNoonIso(date) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d, 12).toISOString()
}

/**
 * Entrées `weather` des journées terminées (avant `todayKey`), datées de midi heure locale.
 * @param {ReturnType<typeof parseWeatherDays>} days
 * @param {{ todayKey: string, place?: string }} opts
 */
export function weatherDaysToEntries(days, { todayKey, place } = {}) {
  return (days || [])
    .filter((d) => d?.date && d.date < todayKey)
    .filter((d) => [d.tempMaxC, d.tempMinC, d.pressureHpa].some(isNum))
    .map((d) => ({
      type: 'weather',
      source: 'open_meteo',
      at: localNoonIso(d.date),
      payload: { ...d, ...(place && { place }), connector: 'open_meteo' },
    }))
}

/** Indice européen de qualité de l'air (bandes de l'Agence européenne pour l'environnement). */
export function aqiLabel(aqi) {
  if (!isNum(aqi)) return null
  if (aqi <= 20) return 'bonne'
  if (aqi <= 40) return 'correcte'
  if (aqi <= 60) return 'moyenne'
  if (aqi <= 80) return 'médiocre'
  if (aqi <= 100) return 'très médiocre'
  return 'extrêmement médiocre'
}

/** Niveau de pollen indicatif (grains / m³, tous types confondus). */
export function pollenLabel(v) {
  if (!isNum(v)) return null
  if (v < 1) return 'aucun'
  if (v < 10) return 'faible'
  if (v < 50) return 'modéré'
  if (v < 200) return 'élevé'
  return 'très élevé'
}

const fr = (v) => String(v).replace('.', decimalMark())

/** Résumé court d'une journée (« 18° / 9° », « 1014 hPa (−6) », « air : bonne »…). */
export function weatherSummaryParts(d) {
  if (!d) return []
  const parts = []
  if (isNum(d.tempMaxC) && isNum(d.tempMinC)) parts.push(`${Math.round(d.tempMaxC)}° / ${Math.round(d.tempMinC)}°`)
  else if (isNum(d.tempMaxC)) parts.push(`${Math.round(d.tempMaxC)}°`)
  if (isNum(d.precipMm) && d.precipMm >= 0.5) parts.push(`pluie ${fr(round1(d.precipMm))} mm`)
  if (isNum(d.sunshineH) && d.sunshineH >= 0.5) parts.push(`soleil ${fr(Math.round(d.sunshineH))} h`)
  if (isNum(d.pressureHpa)) {
    const change = d.pressureChangeHpa
    const delta = isNum(change) && Math.abs(change) >= 3 ? ` (${change > 0 ? '+' : '−'}${fr(Math.round(Math.abs(change)))})` : ''
    parts.push(`${Math.round(d.pressureHpa)} hPa${delta}`)
  }
  const air = aqiLabel(d.aqi)
  if (air) parts.push(`air : ${air}`)
  const pollen = pollenLabel(d.pollenMax)
  if (pollen && pollen !== 'aucun') {
    const top = Object.entries(d.pollen || {}).sort((a, b) => b[1] - a[1])[0]
    parts.push(`pollen : ${pollen}${top ? ` (${POLLEN_TYPES[top[0]]})` : ''}`)
  }
  return parts
}
