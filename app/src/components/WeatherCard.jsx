/**
 * « Météo, pression et air » (page Connecteurs) : un seul geste pour activer, ensuite tout arrive seul
 * (température, ensoleillement, pression et sa variation, qualité de l'air, pollens → Analyses).
 * Seule une position arrondie (≈ 10 km) est envoyée à Open-Meteo. Logique dans services/weather*.js.
 */
import { useEffect, useState } from 'react'
import MethodNote from './MethodNote'
import { getWeatherSettings, enableWeather, disableWeather, syncWeather, searchPlaces } from '../services/weatherSync'
import { weatherSummaryParts } from '../services/weather'
import { formatAgo } from '../utils/timeAgo'
import useDisclosure from '../hooks/useDisclosure'
import './MyDevices.css'
import './WeatherCard.css'

/** Chute de pression (hPa en un jour) signalée sur la carte. */
const PRESSURE_DROP_HPA = 6

function defaultGetPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 3600 * 1000 },
    )
  })
}

/**
 * @param {{ sync?: Function, getPosition?: () => Promise<{lat, lon}>, search?: (q: string) => Promise<object[]>, now?: Date }} props
 */
export default function WeatherCard({ sync = syncWeather, getPosition = defaultGetPosition, search = searchPlaces, now }) {
  const [settings, setSettings] = useState(getWeatherSettings)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState(null)
  const [disclosure, askConsent] = useDisclosure()

  useEffect(() => {
    const reload = () => setSettings(getWeatherSettings())
    window.addEventListener('weather-settings-updated', reload)
    return () => window.removeEventListener('weather-settings-updated', reload)
  }, [])

  async function activate(location) {
    enableWeather(location)
    setSettings(getWeatherSettings())
    setPlaces(null)
    setQuery('')
    setMessage(null)
    setBusy(true)
    try {
      await sync({ force: true })
    } finally {
      setSettings(getWeatherSettings())
      setBusy(false)
    }
  }

  async function usePosition() {
    setMessage(null)
    if (!(await askConsent('location'))) return
    setBusy(true)
    let pos
    try {
      pos = await getPosition()
    } catch {
      setBusy(false)
      setMessage('Position indisponible (autorisation refusée ou localisation coupée). Choisissez plutôt une ville.')
      return
    }
    await activate({ ...pos, name: null })
  }

  async function runSearch(e) {
    e?.preventDefault()
    setMessage(null)
    try {
      const found = await search(query)
      setPlaces(found)
      if (found.length === 0) setMessage('Aucune ville trouvée.')
    } catch (err) {
      setPlaces(null)
      setMessage(err?.message || 'Recherche impossible pour le moment.')
    }
  }

  async function refresh() {
    setBusy(true)
    try {
      await sync({ force: true })
    } finally {
      setSettings(getWeatherSettings())
      setBusy(false)
    }
  }

  function turnOff() {
    disableWeather()
    setSettings(getWeatherSettings())
  }

  const on = settings.enabled && settings.location
  const today = settings.today
  const parts = weatherSummaryParts(today)
  const drop = today?.pressureChangeHpa != null && today.pressureChangeHpa <= -PRESSURE_DROP_HPA

  return (
    <section className="weather-card" aria-labelledby="weather-card-title">
      <div className="my-device-head">
        <h3 id="weather-card-title" className="my-devices-title">Météo, pression et air</h3>
        {on && <span className="my-device-status device-status-ok">Automatique</span>}
      </div>

      {!on && (
        <>
          <p className="my-devices-intro">
            Météo, air et pollens chaque jour, sans rien saisir. Seule une position arrondie (≈ 10 km) est envoyée
            au service gratuit Open-Meteo : aucune donnée de santé.
          </p>
          <MethodNote summary="Détails">
            Température, soleil, pression atmosphérique, qualité de l’air et pollens arrivent tout seuls chaque jour
            (et les 3 derniers mois d’un coup). Vos Analyses vérifient s’ils pèsent sur <em>votre</em> bien-être.
          </MethodNote>
          <button type="button" className="btn btn-primary connector-btn" onClick={usePosition} disabled={busy}>
            Utiliser ma position approximative
          </button>
          <form className="weather-search" onSubmit={runSearch}>
            <label className="weather-search-label" htmlFor="weather-city">Ou choisissez une ville</label>
            <div className="weather-search-row">
              <input
                id="weather-city"
                type="search"
                className="weather-search-input"
                placeholder="ex. Lyon"
                value={query}
                autoComplete="off"
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary connector-btn" disabled={query.trim().length < 2}>
                Chercher
              </button>
            </div>
          </form>
          {places && places.length > 0 && (
            <ul className="weather-places">
              {places.map((p) => (
                <li key={`${p.name}|${p.lat}|${p.lon}`}>
                  <button type="button" className="weather-place" onClick={() => activate(p)} disabled={busy}>
                    <span className="weather-place-name">{p.name}</span>
                    {p.detail && <span className="weather-place-detail">{p.detail}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {on && (
        <div className="weather-on">
          <p className="weather-place-current">{settings.location.name || 'Votre position (à ≈ 10 km près)'}</p>
          {parts.length > 0 ? (
            <p className="weather-today">
              <span className="weather-today-label">Aujourd’hui</span> {parts.join(' · ')}
            </p>
          ) : (
            !settings.lastError && <p className="my-device-message">{busy ? 'Récupération de la météo…' : 'Météo du jour pas encore reçue.'}</p>
          )}
          {drop && (
            <p className="weather-note">
              Pression en forte baisse : souvent citée comme déclencheur de maux de tête chez les personnes sensibles.
              Vos Analyses vérifient si c’est votre cas.
            </p>
          )}
          {settings.lastError && <p className="weather-error">{settings.lastError}</p>}
          {settings.lastSyncAt && (
            <p className="my-device-meta">Mis à jour {formatAgo(settings.lastSyncAt, now || new Date())} · Open-Meteo</p>
          )}
          <div className="my-device-actions">
            {/* Tout arrive seul à chaque ouverture : le bouton ne sert qu'après un échec ou sans météo du jour. */}
            {(settings.lastError || parts.length === 0) && (
              <button type="button" className="btn btn-secondary connector-btn" onClick={refresh} disabled={busy}>
                {busy ? 'Mise à jour…' : 'Réessayer'}
              </button>
            )}
            <button type="button" className="btn btn-secondary connector-btn" onClick={turnOff} disabled={busy}>
              Désactiver
            </button>
          </div>
        </div>
      )}

      {message && <p className="weather-error">{message}</p>}
      {disclosure}
    </section>
  )
}
