import { describe, it, expect, vi, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  getWeatherSettings,
  enableWeather,
  disableWeather,
  syncWeather,
  isWeatherStale,
  WEATHER_STALE_MS,
  searchPlaces,
} from './weatherSync'

function response(json, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => json }
}

const FORECAST = {
  hourly: {
    time: ['2026-10-10T00:00', '2026-10-11T00:00', '2026-10-12T00:00'],
    pressure_msl: [1020, 1012, 1010],
    relative_humidity_2m: [70, 80, 75],
  },
  daily: {
    time: ['2026-10-10', '2026-10-11', '2026-10-12'],
    temperature_2m_max: [18, 15, 14],
    temperature_2m_min: [9, 8, 7],
    precipitation_sum: [0, 3, 1],
    sunshine_duration: [3600, 0, 7200],
  },
}
const AIR = {
  hourly: { time: ['2026-10-10T00:00', '2026-10-11T00:00', '2026-10-12T00:00'], european_aqi: [12, 25, 30], grass_pollen: [5, 0, 0] },
}

function fakeFetch({ air = AIR, failForecast = false } = {}) {
  return vi.fn(async (url) => {
    if (url.includes('air-quality')) return air ? response(air) : response({}, false)
    if (url.includes('geocoding')) return response({ results: [{ name: 'Nantes', country: 'France', latitude: 47.218, longitude: -1.553 }] })
    return failForecast ? response({}, false) : response(FORECAST)
  })
}

const NOW = new Date(2026, 9, 12, 9, 30)

beforeEach(() => {
  localStorage.clear()
})

describe('réglages météo', () => {
  it('désactivée par défaut, sans position', () => {
    expect(getWeatherSettings()).toMatchObject({ enabled: false, location: null, lastSyncAt: null })
  })

  it('activer garde seulement une position arrondie', () => {
    enableWeather({ lat: 48.85661, lon: 2.35222, name: 'Paris' })
    expect(getWeatherSettings()).toMatchObject({ enabled: true, location: { lat: 48.9, lon: 2.4, name: 'Paris' } })
    expect(localStorage.getItem('healthtrack_weather')).not.toContain('48.856')
  })

  it('désactiver efface la position', () => {
    enableWeather({ lat: 48.8, lon: 2.3, name: 'Paris' })
    disableWeather()
    expect(getWeatherSettings()).toMatchObject({ enabled: false, location: null })
  })

  it('mise à jour au plus toutes les 3 heures', () => {
    expect(WEATHER_STALE_MS).toBe(3 * 3600 * 1000)
    expect(isWeatherStale(null)).toBe(true)
    expect(isWeatherStale(new Date(NOW.getTime() - 3600 * 1000).toISOString(), NOW)).toBe(false)
    expect(isWeatherStale(new Date(NOW.getTime() - 4 * 3600 * 1000).toISOString(), NOW)).toBe(true)
  })
})

describe('syncWeather', () => {
  it('ne fait rien tant que la météo n’est pas activée', async () => {
    const fetchImpl = fakeFetch()
    expect(await syncWeather({ fetchImpl, now: NOW })).toMatchObject({ ran: false })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('enregistre les journées terminées, garde aujourd’hui pour l’affichage, puis ne refait rien avant 3 h', async () => {
    enableWeather({ lat: 47.2, lon: -1.6, name: 'Nantes' })
    const write = vi.fn(async (entries) => ({ inserted: entries.length, skipped: 0 }))
    const fetchImpl = fakeFetch()
    const onUpdated = vi.fn()
    window.addEventListener('health-entries-updated', onUpdated)
    const res = await syncWeather({ fetchImpl, now: NOW, write })
    window.removeEventListener('health-entries-updated', onUpdated)
    expect(res).toMatchObject({ ran: true, saved: 2 })
    const entries = write.mock.calls[0][0]
    expect(entries.map((e) => e.payload.date)).toEqual(['2026-10-10', '2026-10-11'])
    expect(entries[1].payload).toMatchObject({ pressureChangeHpa: -8, aqi: 25, place: 'Nantes' })
    const s = getWeatherSettings()
    expect(s.today).toMatchObject({ date: '2026-10-12', tempMaxC: 14 })
    expect(s.lastSyncAt).toBe(NOW.toISOString())
    expect(s.lastError).toBeNull()
    expect(onUpdated).toHaveBeenCalled()
    // Requêtes : position arrondie seulement.
    for (const [url] of fetchImpl.mock.calls) expect(url).toContain('latitude=47.2')

    fetchImpl.mockClear()
    expect(await syncWeather({ fetchImpl, now: new Date(NOW.getTime() + 3600 * 1000), write })).toMatchObject({ ran: false })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('« Mettre à jour » force la requête même si la dernière est récente', async () => {
    enableWeather({ lat: 47.2, lon: -1.6, name: 'Nantes' })
    const write = vi.fn(async () => ({ inserted: 0, skipped: 2 }))
    await syncWeather({ fetchImpl: fakeFetch(), now: NOW, write })
    const fetchImpl = fakeFetch()
    expect(await syncWeather({ fetchImpl, now: NOW, write, force: true })).toMatchObject({ ran: true })
    expect(fetchImpl).toHaveBeenCalled()
  })

  it('qualité de l’air indisponible : rien n’est enregistré (réessai plus tard), erreur notée', async () => {
    enableWeather({ lat: 47.2, lon: -1.6, name: 'Nantes' })
    const write = vi.fn()
    const res = await syncWeather({ fetchImpl: fakeFetch({ air: null }), now: NOW, write })
    expect(res).toMatchObject({ ran: false, error: expect.any(String) })
    expect(write).not.toHaveBeenCalled()
    expect(getWeatherSettings().lastError).toMatch(/indisponible/)
    expect(getWeatherSettings().lastSyncAt).toBeNull()
  })

  it('hors ligne : erreur notée, pas d’exception', async () => {
    enableWeather({ lat: 47.2, lon: -1.6, name: 'Nantes' })
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    const res = await syncWeather({ fetchImpl, now: NOW, write: vi.fn() })
    expect(res.ran).toBe(false)
    expect(getWeatherSettings().lastError).toMatch(/connexion/)
  })

  it('écrit vraiment dans IndexedDB sans doublon d’une mise à jour à l’autre', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    enableWeather({ lat: 47.2, lon: -1.6, name: 'Nantes' })
    await syncWeather({ fetchImpl: fakeFetch(), now: NOW })
    await syncWeather({ fetchImpl: fakeFetch(), now: NOW, force: true })
    const weather = (await listEntries({ limit: 100 })).filter((e) => e.type === 'weather')
    expect(weather).toHaveLength(2)
  })
})

describe('searchPlaces', () => {
  it('cherche une ville (≥ 2 caractères)', async () => {
    const fetchImpl = fakeFetch()
    expect(await searchPlaces('N', { fetchImpl })).toEqual([])
    expect(await searchPlaces('Nantes', { fetchImpl })).toEqual([{ name: 'Nantes', detail: 'France', lat: 47.2, lon: -1.6 }])
  })
})
