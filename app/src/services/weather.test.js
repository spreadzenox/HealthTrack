import { describe, it, expect } from 'vitest'
import {
  roundCoord,
  forecastUrl,
  airQualityUrl,
  geocodeUrl,
  parseGeocoding,
  parseWeatherDays,
  weatherDaysToEntries,
  aqiLabel,
  pollenLabel,
  weatherSummaryParts,
} from './weather'

function hours(date, values) {
  return values.map((_, h) => `${date}T${String(h).padStart(2, '0')}:00`)
}

function forecastFixture() {
  const days = ['2026-10-10', '2026-10-11', '2026-10-12']
  const pressure = { '2026-10-10': 1020, '2026-10-11': 1014, '2026-10-12': 1008 }
  const time = []
  const pressure_msl = []
  const relative_humidity_2m = []
  for (const d of days) {
    const hs = hours(d, new Array(24).fill(0))
    time.push(...hs)
    pressure_msl.push(...hs.map(() => pressure[d]))
    relative_humidity_2m.push(...hs.map((_, i) => (i < 12 ? 60 : 80)))
  }
  return {
    latitude: 48.86,
    longitude: 2.35,
    timezone: 'Europe/Paris',
    hourly: { time, pressure_msl, relative_humidity_2m },
    daily: {
      time: days,
      temperature_2m_max: [18.4, 15.2, 12],
      temperature_2m_min: [9.1, 8, -1.5],
      precipitation_sum: [0, 4.2, 12.5],
      sunshine_duration: [28800, 3600, 0],
    },
  }
}

function airFixture() {
  const days = ['2026-10-10', '2026-10-11', '2026-10-12']
  const time = []
  const european_aqi = []
  const birch_pollen = []
  const grass_pollen = []
  for (const d of days) {
    const hs = hours(d, new Array(24).fill(0))
    time.push(...hs)
    european_aqi.push(...hs.map((_, i) => (d === '2026-10-11' ? 30 + i : 15)))
    birch_pollen.push(...hs.map(() => (d === '2026-10-10' ? 40 : 0)))
    grass_pollen.push(...hs.map(() => (d === '2026-10-10' ? 12 : null)))
  }
  return { hourly: { time, european_aqi, birch_pollen, grass_pollen } }
}

describe('roundCoord', () => {
  it('arrondit au dixième de degré (≈ 10 km) : la position exacte ne sort jamais', () => {
    expect(roundCoord(48.85661)).toBe(48.9)
    expect(roundCoord(2.35222)).toBe(2.4)
    expect(roundCoord(-0.04)).toBe(0)
    expect(roundCoord(-3.66)).toBe(-3.7)
  })
})

describe('URLs Open-Meteo', () => {
  it('prévision : position arrondie, fuseau local, 92 jours passés', () => {
    const url = new URL(forecastUrl({ lat: 48.85661, lon: 2.35222 }))
    expect(url.origin).toBe('https://api.open-meteo.com')
    expect(url.searchParams.get('latitude')).toBe('48.9')
    expect(url.searchParams.get('longitude')).toBe('2.4')
    expect(url.searchParams.get('timezone')).toBe('auto')
    expect(url.searchParams.get('past_days')).toBe('92')
    expect(url.searchParams.get('hourly')).toContain('pressure_msl')
    expect(url.searchParams.get('daily')).toContain('sunshine_duration')
  })

  it('qualité de l’air : indice européen et pollens', () => {
    const url = new URL(airQualityUrl({ lat: 48.85661, lon: 2.35222 }))
    expect(url.origin).toBe('https://air-quality-api.open-meteo.com')
    expect(url.searchParams.get('latitude')).toBe('48.9')
    expect(url.searchParams.get('hourly')).toContain('european_aqi')
    expect(url.searchParams.get('hourly')).toContain('grass_pollen')
  })

  it('recherche de ville en français', () => {
    const url = new URL(geocodeUrl('  Saint-Étienne '))
    expect(url.origin).toBe('https://geocoding-api.open-meteo.com')
    expect(url.searchParams.get('name')).toBe('Saint-Étienne')
    expect(url.searchParams.get('language')).toBe('fr')
  })
})

describe('parseGeocoding', () => {
  it('renvoie nom, région et pays, coordonnées arrondies', () => {
    const res = parseGeocoding({
      results: [
        { name: 'Lyon', admin1: 'Auvergne-Rhône-Alpes', country: 'France', latitude: 45.74846, longitude: 4.84671 },
        { name: 'Lyons', country: 'États-Unis', latitude: 43.06, longitude: -76.99 },
        { name: 'Sans coordonnées' },
      ],
    })
    expect(res).toEqual([
      { name: 'Lyon', detail: 'Auvergne-Rhône-Alpes, France', lat: 45.7, lon: 4.8 },
      { name: 'Lyons', detail: 'États-Unis', lat: 43.1, lon: -77 },
    ])
  })

  it('aucun résultat → liste vide', () => {
    expect(parseGeocoding({})).toEqual([])
    expect(parseGeocoding(null)).toEqual([])
  })
})

describe('parseWeatherDays', () => {
  it('un jour par date : températures, pluie, soleil, pression moyenne et sa variation', () => {
    const days = parseWeatherDays(forecastFixture(), airFixture())
    expect(days.map((d) => d.date)).toEqual(['2026-10-10', '2026-10-11', '2026-10-12'])
    expect(days[0]).toMatchObject({
      tempMaxC: 18.4,
      tempMinC: 9.1,
      precipMm: 0,
      sunshineH: 8,
      pressureHpa: 1020,
      pressureChangeHpa: null, // pas de veille connue
      humidityPct: 70,
    })
    expect(days[1].pressureChangeHpa).toBe(-6)
    expect(days[2]).toMatchObject({ tempMinC: -1.5, sunshineH: 0, pressureChangeHpa: -6 })
  })

  it('indice de l’air = pire heure du jour ; pollen = maximum par type et tous types confondus', () => {
    const days = parseWeatherDays(forecastFixture(), airFixture())
    expect(days[0].aqi).toBe(15)
    expect(days[1].aqi).toBe(53)
    expect(days[0].pollen).toEqual({ birch: 40, grass: 12 })
    expect(days[0].pollenMax).toBe(40)
    expect(days[2].pollenMax).toBe(0)
  })

  it('sans données d’air (hors zone couverte, échec) : champs inconnus, météo intacte', () => {
    const days = parseWeatherDays(forecastFixture(), null)
    expect(days[0].aqi).toBeNull()
    expect(days[0].pollenMax).toBeNull()
    expect(days[0].tempMaxC).toBe(18.4)
  })

  it('heures manquantes (null) ignorées ; journée sans aucune heure → pression inconnue', () => {
    const f = forecastFixture()
    f.hourly.pressure_msl = f.hourly.pressure_msl.map((v, i) => (i < 24 ? null : i === 30 ? null : v))
    const days = parseWeatherDays(f, null)
    expect(days[0].pressureHpa).toBeNull()
    expect(days[1].pressureHpa).toBe(1014)
    expect(days[1].pressureChangeHpa).toBeNull()
  })

  it('réponse illisible → aucun jour', () => {
    expect(parseWeatherDays(null, null)).toEqual([])
    expect(parseWeatherDays({ daily: {} }, null)).toEqual([])
  })
})

describe('weatherDaysToEntries', () => {
  it('seules les journées terminées sont enregistrées (le jour en cours changerait encore)', () => {
    const days = parseWeatherDays(forecastFixture(), airFixture())
    const entries = weatherDaysToEntries(days, { todayKey: '2026-10-12', place: 'Paris' })
    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({
      type: 'weather',
      source: 'open_meteo',
      payload: { date: '2026-10-10', tempMaxC: 18.4, pressureHpa: 1020, aqi: 15, place: 'Paris', connector: 'open_meteo' },
    })
    // Midi local : la journée tombe toujours sur la bonne date, quel que soit le fuseau.
    const at = new Date(entries[0].at)
    expect(at.getHours()).toBe(12)
    expect(at.getDate()).toBe(10)
  })

  it('jour sans aucune valeur météo ignoré', () => {
    const entries = weatherDaysToEntries([{ date: '2026-10-01', tempMaxC: null, tempMinC: null, pressureHpa: null }], {
      todayKey: '2026-10-12',
    })
    expect(entries).toEqual([])
  })
})

describe('libellés', () => {
  it('indice européen de qualité de l’air', () => {
    expect(aqiLabel(10)).toBe('bonne')
    expect(aqiLabel(35)).toBe('correcte')
    expect(aqiLabel(55)).toBe('moyenne')
    expect(aqiLabel(70)).toBe('médiocre')
    expect(aqiLabel(90)).toBe('très médiocre')
    expect(aqiLabel(120)).toBe('extrêmement médiocre')
    expect(aqiLabel(null)).toBeNull()
  })

  it('pollen', () => {
    expect(pollenLabel(0)).toBe('aucun')
    expect(pollenLabel(5)).toBe('faible')
    expect(pollenLabel(30)).toBe('modéré')
    expect(pollenLabel(120)).toBe('élevé')
    expect(pollenLabel(400)).toBe('très élevé')
    expect(pollenLabel(null)).toBeNull()
  })

  it('résumé lisible d’une journée', () => {
    const [d0, d1] = parseWeatherDays(forecastFixture(), airFixture())
    expect(weatherSummaryParts(d0)).toEqual([
      '18° / 9°',
      'soleil 8 h',
      '1020 hPa',
      'air : bonne',
      'pollen : modéré (bouleau)',
    ])
    expect(weatherSummaryParts(d1)).toContain('pluie 4,2 mm')
    expect(weatherSummaryParts(d1)).toContain('1014 hPa (−6)')
  })
})
