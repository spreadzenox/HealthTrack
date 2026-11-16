import { describe, expect, it } from 'vitest'
import { EASE, cubicBezier, hexToRgb, mixHex } from './easing.js'
import {
  DEFAULT_BED_MINUTE,
  LIGHT_KEYS,
  dayPhase,
  lightAt,
  nextLightUpdate,
  sunDirection,
  worldDayKey,
} from './daylight.js'
import { formatTemperature, parseCurrentWeather, weatherDecor } from './weather.js'
import { countUsageDays, growthAt, islandGrowth, seasonOf, worldNews } from './growth.js'

const at = (h, m = 0) => h * 60 + m
const lum = (hex) => {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

describe('courbes', () => {
  it('commencent à 0, finissent à 1 et suivent la forme CSS', () => {
    for (const f of Object.values(EASE)) {
      expect(f(0)).toBe(0)
      expect(f(1)).toBe(1)
    }
    const linear = cubicBezier(0, 0, 1, 1)
    expect(linear(0.3)).toBeCloseTo(0.3, 4)
    expect(EASE.soft(0.5)).toBeGreaterThan(0.5)
    expect(EASE.back(0.6)).toBeGreaterThan(1) // léger dépassement
  })

  it('mélange les couleurs', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080')
    expect(mixHex('#78D8B4', '#78D8B4', 0.3)).toBe('#78D8B4')
  })
})

describe('cycle du jour', () => {
  it("rend à 15 h 30 exactement l'heure dorée réglée par la scène (GOLDEN de scene/light.js)", () => {
    // copie de GOLDEN (lot SCÈNE, 16/11) : le contre-jour doré du kit, à l'échelle de la scène de l'app
    const GOLDEN = {
      phase: 'midi',
      sky: { top: '#FFD7BA', bottom: '#FFF3E6' },
      sun: { color: '#FFCFA0', intensity: 2.6, elevationDeg: 15, azimuthDeg: -150 },
      fill: { color: '#FFE4D2', intensity: 1.35 },
      hemi: { sky: '#FFF1E4', ground: '#9DB87A', intensity: 0.8 },
      haze: '#FFC9A6',
      ambreGlow: 0.55,
      stars: 0,
    }
    expect(lightAt(at(15, 30))).toMatchObject(GOLDEN)
    expect(lightAt(at(15, 30)).env).toBe(0.62) // unités du kit
  })

  it('reprend les ciels de la SPEC aux heures clés', () => {
    expect(lightAt(at(6, 48)).sky).toEqual({ top: '#F2B6A6', bottom: '#FFE6CF' })
    expect(lightAt(at(8, 12)).sky).toEqual({ top: '#FFCCAE', bottom: '#FFF1E2' })
    expect(lightAt(at(12, 30)).sky).toEqual({ top: '#FFD7BA', bottom: '#FFF3E6' })
    expect(lightAt(at(18, 40))).toMatchObject({ sky: { top: '#C9A4E2', bottom: '#FFD9B0' }, sun: { color: '#FF9F72' } })
    expect(lightAt(at(21, 24))).toMatchObject({ sky: { top: '#1C2452', bottom: '#4A4A8C' }, sun: { color: '#CCD6FF' } })
  })

  it('le soleil reste toujours derrière Pilou (contre-jour, z < 0)', () => {
    for (let minute = 0; minute < 1440; minute += 7) {
      const { sunDirection: d, sun } = lightAt(minute)
      expect(sun.azimuthDeg).toBe(-150)
      expect(d[2]).toBeLessThan(0)
      expect(d[1]).toBeGreaterThan(0)
    }
  })

  it('matin plus pâle et plus haut, soir plus orangé et plus bas, nuit où le point ambre mène', () => {
    const matin = lightAt(at(8, 12))
    const apm = lightAt(at(15, 30))
    const soir = lightAt(at(18, 40))
    const nuit = lightAt(at(23))
    expect(matin.sun.elevationDeg).toBeGreaterThan(apm.sun.elevationDeg)
    expect(lum(matin.sun.color)).toBeGreaterThan(lum(apm.sun.color))
    expect(soir.sun.elevationDeg).toBeLessThan(apm.sun.elevationDeg)
    expect(hexToRgb(soir.sun.color)[2]).toBeLessThan(hexToRgb(apm.sun.color)[2]) // plus orangé : moins de bleu
    expect(nuit.ambreGlow).toBe(1)
    expect(nuit.sun.intensity).toBeLessThan(1)
    expect(nuit.ambreGlow).toBeGreaterThan(apm.ambreGlow)
    expect(nuit.hemi.ground).not.toBe(apm.hemi.ground)
    expect(nuit.stars).toBe(1)
    expect(apm.stars).toBe(0)
  })

  it('varie en douceur : aucune marche entre deux minutes voisines', () => {
    let prev = lightAt(0)
    for (let minute = 1; minute < 1440; minute += 1) {
      const cur = lightAt(minute)
      expect(Math.abs(cur.sun.intensity - prev.sun.intensity)).toBeLessThan(0.08)
      expect(Math.abs(cur.sun.elevationDeg - prev.sun.elevationDeg)).toBeLessThan(0.6)
      prev = cur
    }
    expect(lightAt(1439.99).sun.intensity).toBeCloseTo(lightAt(0).sun.intensity, 2)
  })

  it('accepte une date et ne dépend que de l’heure locale', () => {
    const d = new Date(2026, 10, 16, 15, 30)
    expect(lightAt(d)).toEqual(lightAt(at(15, 30)))
  })

  it('les clés sont ordonnées et couvrent la journée', () => {
    expect(LIGHT_KEYS[0].minute).toBe(0)
    expect(LIGHT_KEYS.at(-1).minute).toBe(1440)
    for (let i = 1; i < LIGHT_KEYS.length; i += 1) expect(LIGHT_KEYS[i].minute).toBeGreaterThan(LIGHT_KEYS[i - 1].minute)
  })

  it('donne la phase de Pilou selon son lever et son coucher', () => {
    expect(dayPhase(at(9))).toBe('matin')
    expect(dayPhase(at(14))).toBe('apres-midi')
    expect(dayPhase(at(18))).toBe('soir')
    expect(dayPhase(at(22, 29))).toBe('soir')
    expect(dayPhase(DEFAULT_BED_MINUTE)).toBe('nuit')
    expect(dayPhase(at(3))).toBe('nuit')
    expect(dayPhase(at(6, 59))).toBe('nuit')
    // couchée tard, levée tard (coucher après minuit)
    expect(dayPhase(at(0, 30), { bedMinute: at(1), wakeMinute: at(9) })).toBe('soir')
    expect(dayPhase(at(8), { bedMinute: at(1), wakeMinute: at(9) })).toBe('nuit')
    expect(dayPhase(at(23), { bedMinute: at(23, 30), wakeMinute: at(6) })).toBe('soir')
    expect(lightAt(at(23)).asleep).toBe(true)
    // phases du contrat (time:phase)
    expect(lightAt(at(7, 30)).phase).toBe('aube')
    expect(lightAt(at(9)).phase).toBe('matin')
    expect(lightAt(at(14)).phase).toBe('midi')
    expect(lightAt(at(19)).phase).toBe('soir')
    expect(lightAt(at(21, 50)).phase).toBe('soir') // ciel de nuit, mais Pilou veille à la lanterne
    expect(lightAt(at(23)).phase).toBe('nuit')
    expect(lightAt(at(22), { bedtime: at(21, 45) }).phase).toBe('nuit')
    expect(lightAt(at(8), { wake: at(9), bedtime: at(1) }).phase).toBe('nuit')
    expect(lightAt(at(19)).lantern).toBe(true)
    expect(lightAt(at(10)).lantern).toBe(false)
  })

  it('le jour de Pilou change à 4 h', () => {
    expect(worldDayKey(new Date(2026, 10, 17, 3, 59))).toBe('2026-11-16')
    expect(worldDayKey(new Date(2026, 10, 17, 4, 0))).toBe('2026-11-17')
  })

  it('direction du soleil et rythme de mise à jour', () => {
    const d = sunDirection(-150, 15)
    expect(Math.hypot(...d)).toBeCloseTo(1, 3)
    expect(nextLightUpdate(602)).toBe(605)
    expect(nextLightUpdate(605)).toBe(610)
  })
})

describe('météo sur l’îlot', () => {
  it('un seul effet, par priorité, avec son étiquette', () => {
    expect(weatherDecor({ temperature: 11.2, precipitation: 0.4, windGusts: 50, weatherCode: 61 })).toMatchObject({
      effect: 'pluie',
      label: 'Pluie fine · 11 °C',
      accessory: 'parapluie',
      particles: { kind: 'pluie', count: 40 },
    })
    expect(weatherDecor({ temperature: 0, precipitation: 1.2, weatherCode: 73 })).toMatchObject({ effect: 'neige', label: 'Neige · 0 °C', frost: true })
    expect(weatherDecor({ temperature: 14, precipitation: 0, windGusts: 38.4 })).toMatchObject({ effect: 'vent', label: 'Vent · 38 km/h' })
    expect(weatherDecor({ temperature: 31, precipitation: 0, windGusts: 10 })).toMatchObject({ effect: 'chaleur', label: 'Chaleur · 31 °C' })
    expect(weatherDecor({ temperature: 2, precipitation: 0, windGusts: 10 })).toMatchObject({
      effect: 'froid',
      label: 'Froid · 2 °C',
      gesture: 'frisson',
      accessory: 'echarpe',
      breath: true,
    })
  })

  it('respecte les seuils de la SPEC', () => {
    expect(weatherDecor({ temperature: 15, precipitation: 0.19 }).effect).toBeNull()
    expect(weatherDecor({ temperature: 15, precipitation: 0.2 }).effect).toBe('pluie')
    expect(weatherDecor({ temperature: 15, windGusts: 34.9 }).effect).toBeNull()
    expect(weatherDecor({ temperature: 27.9 }).effect).toBeNull()
    expect(weatherDecor({ temperature: 5 }).effect).toBe('froid')
    expect(weatherDecor({ temperature: 5.1 }).effect).toBeNull()
  })

  it('reste dans le budget de particules du téléphone', () => {
    const cases = [
      { precipitation: 5 },
      { weatherCode: 75 },
      { windGusts: 90 },
      { temperature: -10 },
    ]
    for (const c of cases) {
      const d = weatherDecor(c)
      expect(d.particles.count).toBeLessThanOrEqual(40)
      expect(d.split.back + d.split.front).toBe(d.particles.count)
      expect(d.particleOpacity).toBeLessThanOrEqual(0.9)
    }
    expect(weatherDecor({ precipitation: 5 }).particleOpacity).toBeLessThanOrEqual(0.45)
  })

  it('en mouvements réduits : aucune particule, l’étiquette dit toujours la météo', () => {
    for (const c of [{ precipitation: 3, temperature: 8 }, { weatherCode: 71, temperature: -1 }, { windGusts: 60 }, { temperature: 1 }]) {
      const d = weatherDecor(c, { reducedMotion: true })
      expect(d.particles).toEqual({ kind: null, count: 0 })
      expect(d.breath).toBe(false)
      expect(d.label).toBeTruthy()
    }
  })

  it('ciel calme : un mot simple, adapté à la nuit', () => {
    expect(weatherDecor({ temperature: 18, weatherCode: 0 }).label).toBe('Grand soleil · 18 °C')
    expect(weatherDecor({ temperature: 18, weatherCode: 0 }, { night: true }).label).toBe('Ciel dégagé · 18 °C')
    expect(weatherDecor({ temperature: 9, weatherCode: 45 }).label).toBe('Brouillard · 9 °C')
    expect(weatherDecor({ temperature: -2.6 }).label).toBe('Froid · −3 °C')
  })

  it('sans météo, ou trop ancienne : rien sur l’îlot', () => {
    expect(weatherDecor(null)).toMatchObject({ effect: null, label: null, accessory: null })
    const old = { temperature: 20, weatherCode: 0, at: '2026-11-16T08:00:00Z' }
    expect(weatherDecor(old, { now: new Date('2026-11-16T12:00:01Z') }).label).toBeNull()
    expect(weatherDecor(old, { now: new Date('2026-11-16T10:00:00Z') }).label).toBe('Grand soleil · 20 °C')
  })

  it('lit le bloc « current » d’Open-Meteo', () => {
    const w = parseCurrentWeather(
      { current: { temperature_2m: 11.3, precipitation: 0.3, weather_code: 61, wind_gusts_10m: 22 } },
      new Date('2026-11-16T19:00:00Z'),
    )
    expect(w).toEqual({ tempC: 11.3, precipMmH: 0.3, windKmH: 22, code: 61, at: '2026-11-16T19:00:00.000Z' })
    expect(weatherDecor(w).label).toBe('Pluie fine · 11 °C')
    expect(parseCurrentWeather({})).toBeNull()
    expect(formatTemperature(-0.4)).toBe('0 °C')
  })
})

describe('croissance de l’îlot', () => {
  it('commence petit, grandit jusqu’à 90 jours puis s’arrête', () => {
    expect(islandGrowth(0)).toMatchObject({ g: 0, widthScale: 1, heightScale: 1, tufts: 14, shrubScale: 1, neighbor: false, pond: false })
    expect(islandGrowth(90)).toMatchObject({ g: 1, widthScale: 1.3, heightScale: 1.12, tufts: 42, shrubScale: 1.45, tree: true, pond: true })
    expect(islandGrowth(400)).toEqual({ ...islandGrowth(90), days: 400 })
  })

  it('ne recule jamais quand les jours augmentent', () => {
    let prev = islandGrowth(0)
    for (let d = 1; d <= 120; d += 1) {
      const cur = islandGrowth(d)
      expect(cur.g).toBeGreaterThanOrEqual(prev.g)
      expect(cur.tufts).toBeGreaterThanOrEqual(prev.tufts)
      prev = cur
    }
  })

  it('îlot voisin au premier mois, mare au troisième', () => {
    expect(islandGrowth(29).neighbor).toBe(false)
    expect(islandGrowth(30).neighbor).toBe(true)
    expect(islandGrowth(89).pond).toBe(false)
    expect(islandGrowth(90).pond).toBe(true)
  })

  it('compte les jours d’usage distincts, sans compter les jours vides', () => {
    expect(countUsageDays(['2026-11-01', '2026-11-01', '2026-11-03', '', null, 'n’importe'])).toBe(2)
    expect(countUsageDays(undefined)).toBe(0)
  })

  it('suit les saisons, et l’hémisphère sud à six mois', () => {
    expect(seasonOf(new Date(2026, 10, 16))).toBe('automne')
    expect(seasonOf(new Date(2026, 11, 21))).toBe('hiver')
    expect(seasonOf(new Date(2027, 0, 31))).toBe('hiver')
    expect(seasonOf(new Date(2027, 1, 1))).toBe('fin-hiver')
    expect(seasonOf(new Date(2027, 2, 21))).toBe('printemps-ete')
    expect(seasonOf(new Date(2027, 8, 22))).toBe('automne')
    expect(seasonOf(new Date(2026, 10, 16), -33.9)).toBe('printemps-ete')
    expect(seasonOf(new Date(2026, 6, 1), -33.9)).toBe('hiver')
  })

  it('forme du contrat : growthAt', () => {
    expect(growthAt(30, new Date(2026, 10, 16))).toEqual({
      ...growthAt(30, new Date(2026, 10, 16)),
      neighbourIsland: true,
      pond: false,
      season: 'automne',
    })
    const g = growthAt(90, new Date(2026, 10, 16), { hemisphere: 'sud' })
    expect(g).toMatchObject({ g: 1, islandScaleXZ: 1.3, islandScaleY: 1.12, tufts: 42, shrubScale: 1.45, pond: true, season: 'printemps-ete' })
    expect(worldNews(growthAt(29), growthAt(30))).toBe('Un îlot voisin est apparu')
  })

  it('dit ce qui est nouveau, une seule phrase', () => {
    const s = (days, season = 'automne') => ({ growth: islandGrowth(days), season })
    expect(worldNews(s(29), s(30))).toBe('Un îlot voisin est apparu')
    expect(worldNews(s(89), s(90))).toBe("Une mare est apparue sur l'îlot")
    expect(worldNews(s(10), s(11))).toBeNull()
    expect(worldNews(s(10, 'automne'), s(10, 'hiver'))).toBe("L'hiver est arrivé sur l'îlot")
    expect(worldNews(null, s(3))).toBeNull()
  })
})
