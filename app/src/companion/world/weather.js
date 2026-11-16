/**
 * La météo réelle sur l'îlot (specs/ile.SPEC.md § 6), en fonction pure : la météo du moment (celle que Halcya lit
 * déjà chez Open-Meteo, position arrondie à ≈ 10 km) donne UN seul effet, par priorité, avec ce que fait Pilou et
 * l'étiquette qui le dit en mots. Aucune information ne passe seulement par l'image : l'étiquette est toujours là.
 *
 * Entrée, forme du contrat : { tempC, precipMmH, windKmH (rafales), code (WMO) }.
 */

/** Seuils de la SPEC § 6. */
export const RAIN_MM_H = 0.2
export const GUST_KMH = 35
export const HOT_C = 28
export const COLD_C = 5
/** Une météo plus vieille que 3 h ne s'affiche plus sur l'îlot (elle se relit à l'ouverture). */
export const WEATHER_MAX_AGE_MS = 3 * 3600 * 1000
/** Entrée d'un effet : fondu de 1 200 ms (SPEC § 6). */
export const WEATHER_FADE_MS = 1200

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86])
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])
const FOG_CODES = new Set([45, 48])

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** « 11 °C », « −2 °C » (arrondi à l'unité, signe moins typographique). */
export function formatTemperature(c) {
  const v = Math.round(c)
  return `${v < 0 ? '−' : ''}${Math.abs(v)} °C`
}

function rainWord(mmh) {
  if (mmh == null || mmh < 1) return 'Pluie fine'
  if (mmh < 4) return 'Pluie'
  return 'Forte pluie'
}

function calmWord(code, night) {
  if (FOG_CODES.has(code)) return 'Brouillard'
  if (code === 3) return 'Couvert'
  if (code === 1 || code === 2) return 'Quelques nuages'
  if (code === 0) return night ? 'Ciel dégagé' : 'Grand soleil'
  return null
}

const label = (word, tail) => (tail ? `${word} · ${tail}` : word)

/** Lit les deux formes d'entrée : celle du contrat ({ tempC, precipMmH, windKmH, code }) et celle de weatherSync. */
function readWeather(w) {
  return {
    temp: num(w.tempC ?? w.temperature),
    precip: num(w.precipMmH ?? w.precipitation),
    gusts: num(w.windKmH ?? w.windGusts),
    code: num(w.code ?? w.weatherCode),
  }
}

/**
 * Effet météo de l'îlot, forme du contrat (CONTRAT.md § 5) : `{ effect, label, particles: { kind, count }, accessory,
 * skyVeil }`, `effect` ∈ pluie, neige, vent, chaleur, froid ou null (un seul à la fois) ; `accessory` ∈ parapluie,
 * echarpe, eventail ou null. En ajout : `gesture` (joué une fois à l'entrée de l'effet : leve-les-yeux, se-penche,
 * s-evente, frisson), `split` ({ back, front } : particules derrière et devant), `particleOpacity`, `frost` (herbe
 * givrée), `breath` (buée), `wind` (0…1, penche les fleurs), `cloudSpeed`, `warmth` (0…1), `fadeMs`.
 * Entrée : `{ tempC, precipMmH, windKmH, code }` (ou `{ temperature, precipitation, windGusts, weatherCode, at }`).
 * `options.night` change le mot du ciel clair ; `options.reducedMotion` retire toutes les particules (l'accessoire
 * apparaît en fondu, l'étiquette dit la météo) ; avec `options.now`, une météo lue il y a plus de 3 h est ignorée.
 */
export function weatherDecor(weather, { night = false, reducedMotion = false, now = null } = {}) {
  const w = weather || {}
  const { temp, precip, gusts, code } = readWeather(w)
  const stale = now != null && w.at && (now instanceof Date ? now.getTime() : now) - new Date(w.at).getTime() > WEATHER_MAX_AGE_MS
  const base = {
    effect: null,
    label: null,
    particles: { kind: null, count: 0 },
    accessory: null,
    skyVeil: 0,
    gesture: null,
    split: { back: 0, front: 0 },
    particleOpacity: 0,
    frost: false,
    breath: false,
    wind: 0,
    cloudSpeed: 1,
    warmth: 0,
    fadeMs: WEATHER_FADE_MS,
  }
  if (stale || (temp == null && precip == null && gusts == null && code == null)) return base
  const t = temp == null ? null : formatTemperature(temp)
  const parts = (kind, back, front) =>
    reducedMotion
      ? { particles: { kind: null, count: 0 }, split: { back: 0, front: 0 } }
      : { particles: { kind, count: back + front }, split: { back, front } }

  const snowing = code != null && SNOW_CODES.has(code)
  const raining = !snowing && (precip != null ? precip >= RAIN_MM_H : code != null && RAIN_CODES.has(code))
  if (raining) {
    return { ...base, ...parts('pluie', 30, 10), effect: 'pluie', label: label(rainWord(precip), t), accessory: 'parapluie', gesture: 'leve-les-yeux', particleOpacity: 0.45, skyVeil: 0.35 }
  }
  if (snowing) {
    return { ...base, ...parts('neige', 22, 8), effect: 'neige', label: label('Neige', t), accessory: 'echarpe', particleOpacity: 0.8, skyVeil: 0.2, frost: true }
  }
  if (gusts != null && gusts >= GUST_KMH) {
    return { ...base, ...parts('feuilles', 0, 6), effect: 'vent', label: `Vent · ${Math.round(gusts)} km/h`, gesture: 'se-penche', particleOpacity: 0.9, wind: Math.min(1, (gusts - GUST_KMH) / 30 + 0.5), cloudSpeed: reducedMotion ? 1 : 5 }
  }
  if (temp != null && temp >= HOT_C) {
    return { ...base, effect: 'chaleur', label: label('Chaleur', t), accessory: 'eventail', gesture: 's-evente', warmth: Math.min(1, (temp - HOT_C) / 8 + 0.5) }
  }
  if (temp != null && temp <= COLD_C) {
    return { ...base, ...parts('flocons', 6, 2), effect: 'froid', label: label('Froid', t), accessory: 'echarpe', gesture: 'frisson', particleOpacity: 0.6, frost: true, breath: !reducedMotion }
  }
  const word = calmWord(code, night)
  return { ...base, label: word ? label(word, t) : t }
}

/** Les champs `current` d'Open-Meteo demandés pour l'îlot (ajoutés à la lecture météo existante). */
export const CURRENT_FIELDS = 'temperature_2m,precipitation,weather_code,wind_gusts_10m'

/** Lecture du bloc `current` d'une réponse Open-Meteo → `{ tempC, precipMmH, windKmH, code, at }` (forme du contrat), ou null. */
export function parseCurrentWeather(forecast, fetchedAt = new Date()) {
  const c = forecast?.current
  if (!c || typeof c !== 'object') return null
  const out = {
    tempC: num(c.temperature_2m),
    precipMmH: num(c.precipitation),
    windKmH: num(c.wind_gusts_10m),
    code: num(c.weather_code),
    at: (fetchedAt instanceof Date ? fetchedAt : new Date(fetchedAt)).toISOString(),
  }
  if (out.tempC == null && out.precipMmH == null && out.code == null && out.windKmH == null) return null
  return out
}
