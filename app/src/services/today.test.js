import { describe, it, expect } from 'vitest'
import {
  daySummaryTitle,
  entrySourceLabel,
  formatDelta,
  gutSummary,
  gutWeekLine,
  headerLine,
  measureTiles,
  pistesProgress,
  wellbeingTrend,
} from './today'

// Mercredi 21 octobre 2026, 12 h (heure locale)
const NOW = new Date(2026, 9, 21, 12, 0)
const at = (d, h = 9) => new Date(2026, 9, d, h, 0).toISOString()
const key = (d) => `2026-10-${String(d).padStart(2, '0')}`

describe('headerLine', () => {
  it('écrit la date courte puis « Bonjour »', () => {
    expect(headerLine(NOW)).toBe('mer. 21 oct. · Bonjour')
    expect(headerLine(NOW, 'Julien')).toBe('mer. 21 oct. · Bonjour Julien')
  })
})

describe('daySummaryTitle', () => {
  it('résume la journée d’après le bien-être estimé du jour seulement', () => {
    expect(daySummaryTitle({ day: { note: 3.4 } })).toBe('Plutôt une bonne journée')
    expect(daySummaryTitle({ day: { note: 2.5 } })).toBe('Une journée moyenne')
    expect(daySummaryTitle({ day: { note: 1.5 } })).toBe('Une journée plus difficile')
  })

  it('reste neutre sans lecture aujourd’hui (une lecture d’hier ne décrit pas aujourd’hui)', () => {
    expect(daySummaryTitle(null)).toBe('Votre journée')
    expect(daySummaryTitle({ day: null, moment: { note: 4.5 } })).toBe('Votre journée')
  })
})

describe('wellbeingTrend', () => {
  const days = [
    { date: key(1), note: 1 }, // hors des 14 jours
    { date: key(15), note: 3 },
    { date: key(17), note: 2.8 },
    { date: key(19), note: 3.2 },
    { date: key(21), note: 9 }, // le jour lui-même vient de todayNote
  ]

  it('compare le jour à la moyenne des 13 jours précédents', () => {
    const t = wellbeingTrend(days, 3.4, NOW)
    expect(t.series.map((d) => d.date)).toEqual([key(15), key(17), key(19), key(21)])
    expect(t.series.at(-1).note).toBe(3.4)
    expect(t.mean).toBe(3)
    expect(t.pastDays).toBe(3)
    expect(t.delta).toBe(0.4)
    expect(t.phrase).toBe('Un peu mieux que votre moyenne des 14 derniers jours.')
  })

  it('dit les écarts dans les deux sens, sans jugement', () => {
    expect(wellbeingTrend(days, 3.1, NOW).phrase).toBe('Proche de votre moyenne des 14 derniers jours.')
    expect(wellbeingTrend(days, 2.5, NOW).phrase).toBe('Un peu moins bien que votre moyenne des 14 derniers jours.')
    expect(wellbeingTrend(days, 4, NOW).phrase).toBe('Mieux que votre moyenne des 14 derniers jours.')
    expect(wellbeingTrend(days, 2, NOW).phrase).toBe('Moins bien que votre moyenne des 14 derniers jours.')
  })

  it('attend 3 jours estimés avant de se comparer', () => {
    const t = wellbeingTrend(days.slice(0, 3), 3.4, NOW)
    expect(t.delta).toBeNull()
    expect(t.phrase).toBe('Encore quelques jours de lectures pour vous comparer à vous-même.')
    expect(wellbeingTrend(days, null, NOW).delta).toBeNull()
  })
})

describe('formatDelta', () => {
  it('utilise la virgule et le vrai signe moins', () => {
    expect(formatDelta(0.4)).toBe('+0,4')
    expect(formatDelta(-1.2)).toBe('−1,2')
    expect(formatDelta(0)).toBe('±0,0')
    expect(formatDelta(null)).toBe('')
  })
})

describe('measureTiles', () => {
  const entries = [
    { type: 'sleep', source: 'health_connect', at: at(20, 23), payload: { durationMinutes: 450, endDate: at(21, 6), sourceName: 'Garmin' } },
    { type: 'heart_rate', source: 'huawei_watch', at: at(21, 4), payload: { value: 41, subtype: 'heartRateVariability' } },
    { type: 'heart_rate', source: 'health_connect', at: at(21, 4), payload: { bpm: 60, subtype: 'restingHeartRate' } },
    { type: 'steps', source: 'health_connect', at: at(20), payload: { value: 9000 } }, // hier
  ]

  it('donne sommeil, VFC et pas du jour avec la source de chaque chiffre', () => {
    const tiles = measureTiles({ sleepMinutes: 452, hrv: 41.2, steps: 3456 }, entries, NOW)
    expect(tiles.map((t) => [t.label, t.value])).toEqual([['Sommeil', '7 h 32'], ['VFC nuit', '41 ms'], ['Pas', '3 456']])
    expect(tiles[0].sources).toEqual(['Health Connect · Garmin'])
    expect(tiles[1].sources).toEqual(['Montre Huawei'])
    expect(tiles[2].sources).toEqual([])
  })

  it('laisse une valeur vide quand rien n’est mesuré', () => {
    expect(measureTiles(null, [], NOW).map((t) => t.value)).toEqual([null, null, null])
    expect(measureTiles({ sleepMinutes: 420, sleepEstimated: true }, [], NOW)[0]).toMatchObject({ label: 'Sommeil (estimé)', value: '7 h' })
  })
})

describe('entrySourceLabel', () => {
  it('nomme la source et l’app d’origine', () => {
    expect(entrySourceLabel({ source: 'withings', payload: {} })).toBe('Withings Body Scan')
    expect(entrySourceLabel({ source: 'autre' })).toBe('autre')
  })
})

describe('gutSummary', () => {
  const gut = (d, level, h = 9) => ({ type: 'gut', source: 'app_gut', at: at(d, h), payload: { level } })

  it('rend la dernière note et le bilan des 7 jours', () => {
    const s = gutSummary([gut(14, 'pain'), gut(15, 'calm'), gut(18, 'discomfort'), gut(21, 'calm', 8), gut(21, 'pain', 11), gut(20, 'bad')], NOW)
    expect(s.last.payload.level).toBe('pain')
    expect(s.lastToday).toBe(true)
    expect(s.week).toEqual({ calm: 2, discomfort: 1, pain: 1 })
    expect(s.daysNoted).toBe(3)
    expect(gutWeekLine(s)).toBe('7 jours · 4 notes : 2 calmes · 1 gêne · 1 douleur · 4 jours sans note')
  })

  it('ne trouve rien sans note', () => {
    const s = gutSummary([], NOW)
    expect(s.last).toBeNull()
    expect(s.lastToday).toBe(false)
    expect(gutWeekLine(s)).toBe('7 jours : 7 jours sans note')
  })
})

describe('pistesProgress', () => {
  it('compte les jours avec un repas ou une note du ventre, jusqu’à 21', () => {
    const entries = [
      { type: 'food', at: at(1) }, { type: 'food', at: at(1, 20) }, { type: 'gut', at: at(2) },
      { type: 'steps', at: at(3) }, { type: 'wellbeing', at: at(4) },
    ]
    expect(pistesProgress(entries)).toEqual({ days: 2, target: 21, remaining: 19, ready: false })
    const many = Array.from({ length: 30 }, (_, i) => ({ type: 'food', at: new Date(2026, 8, i + 1, 12).toISOString() }))
    expect(pistesProgress(many)).toEqual({ days: 21, target: 21, remaining: 0, ready: true })
  })

  it('objectif énergie : compte les jours avec une nuit ET une mesure du bien-être', () => {
    const entries = [
      // nuit du 1 au 2 (réveil le 2) + note le 2 : compte
      { type: 'sleep', at: at(1, 23), payload: { endDate: at(2, 7) } }, { type: 'wellbeing', at: at(2, 20) },
      // lecture du visage le 3 avec une nuit finie le 3 : compte
      { type: 'sleep', at: at(3, 1), payload: { durationMinutes: 400 } }, { type: 'face_burst', at: at(3, 9) },
      // nuit seule, bien-être seul, repas : ne comptent pas
      { type: 'sleep', at: at(4, 1), payload: { endDate: at(4, 7) } }, { type: 'wellbeing', at: at(5) }, { type: 'food', at: at(6) },
    ]
    expect(pistesProgress(entries, 'energy')).toEqual({ days: 2, target: 21, remaining: 19, ready: false })
    expect(pistesProgress(entries, 'gut').days).toBe(1)
  })
})
