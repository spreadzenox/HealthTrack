import { describe, it, expect } from 'vitest'
import {
  daySummaryTitle,
  dayWellbeing,
  entrySourceLabel,
  formatDelta,
  gutEveningCheck,
  gutSummary,
  gutWeekLine,
  headerLine,
  measureTiles,
  todayBySource,
  pistesProgress,
  gutNotesProgress,
  GUT_PISTES_MIN_NOTE_DAYS,
  wellbeingTrend,
} from './today'
import { GUT_LINKS_MIN_DAYS } from './gutLinks'

// Mercredi 21 octobre 2026, 12 h (heure locale)
const NOW = new Date(2026, 9, 21, 12, 0)
const at = (d, h = 9) => new Date(2026, 9, d, h, 0).toISOString()
const key = (d) => `2026-10-${String(d).padStart(2, '0')}`

describe('headerLine', () => {
  it('la date seule, en toutes lettres, sans « Bonjour » (nouvel écran Aujourd’hui du 07/11)', () => {
    expect(headerLine(NOW)).toEqual({ date: 'Mercredi 21 octobre' })
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

describe('dayWellbeing (AUJ-2)', () => {
  const now = new Date(2026, 10, 7, 12, 0)
  const at = (h, m = 0) => new Date(2026, 10, 7, h, m).toISOString()
  const yesterday = new Date(2026, 10, 6, 20).toISOString()
  const note = (score, iso) => ({ type: 'wellbeing', at: iso, payload: { score } })

  it('visage du jour : la valeur sur 1 à 5, le nombre de lectures, les points et la tendance du jour seulement', () => {
    const data = {
      est: { day: { note: 3, readings: 4, gut: null }, confidence: 'faible' },
      today: {
        points: [{ at: yesterday, note: 1 }, { at: at(8), note: 2.5 }, { at: at(11), note: 3.5 }],
        trend: [{ at: at(8), note: 2.8 }, { at: at(11), note: 3.2 }],
      },
    }
    const w = dayWellbeing(data, [note(5, at(9))], now)
    expect(w).toMatchObject({ source: 'face', value: '3,4', from: 'D’après 4 lectures du visage' })
    expect(w.points).toEqual([{ at: at(8), note: 2.5 }, { at: at(11), note: 3.5 }])
    expect(w.trend).toHaveLength(2)
    // Ni verdict ni « estimation prudente »
    expect(JSON.stringify(w)).not.toMatch(/Plutôt|difficile|prudente/)
  })

  it('TS-1 : la valeur du jour est l’estimation du modèle à espace d’états ; plus rien de VENTRE-BE-2', () => {
    const data = { est: { day: { note: 2.5, readings: 3, gut: { level: 'pain' } } }, state: { mean: 3.75, low: 3, high: 4.5 } }
    const w = dayWellbeing(data, [], now)
    expect(w.value).toBe(dayWellbeing({ est: { day: { note: 3.75, readings: 3 } } }, [], now).value)
    expect(w.from).toBe('D’après 3 lectures du visage')
    // une note du jour entre dans l'estimation TS-1 : elle est dite
    expect(dayWellbeing(data, [note(4, at(9))], now).from).toBe('D’après 3 lectures du visage et votre note')
    // sans estimation TS-1 : la médiane des lectures du jour, sans mention de la digestion
    const old = dayWellbeing({ est: { day: { note: 2.5, readings: 1, gut: { level: 'pain' } } } }, [], now)
    expect(old.from).toBe('D’après 1 lecture du visage')
    expect(old.value).toBe(dayWellbeing({ est: { day: { note: 2.5, readings: 1 } } }, [], now).value)
  })

  it('sans lecture du jour : les notes du jour en points, la dernière en valeur ; jamais une note d’hier', () => {
    const w = dayWellbeing({ est: { day: null } }, [note(1.25, at(9, 5)), note(5, at(7))], now)
    expect(w).toMatchObject({ source: 'note', value: '2', trend: [] })
    expect(w.from).toMatch(/^Votre dernière note, à 09:05$/)
    expect(w.points.map((p) => p.note)).toEqual([5, 1.25])
    expect(dayWellbeing(null, [note(3.75, at(10))], now).from).toMatch(/^Votre note de 10:00$/)
    expect(dayWellbeing(null, [note(5, yesterday)], now)).toMatchObject({ source: null, value: null, points: [] })
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
    expect(tiles.map((t) => [t.label, t.value])).toEqual([['Sommeil', '7 h 32'], ['Variabilité cardiaque', '41 ms'], ['Pas', '3 456']])
    expect(tiles[0].sources).toEqual(['Health Connect · Garmin'])
    expect(tiles[1].sources).toEqual(['Montre Huawei'])
    expect(tiles[2].sources).toEqual([])
  })

  it('laisse une valeur vide quand rien n’est mesuré', () => {
    expect(measureTiles(null, [], NOW).map((t) => t.value)).toEqual([null, null, null])
    expect(measureTiles({ sleepMinutes: 420, sleepEstimated: true }, [], NOW)[0]).toMatchObject({ label: 'Sommeil (estimé)', value: '7 h' })
  })

  it('dit de quelle nuit vient le sommeil, comme VFC et pas disent « hier » (POL-PLAY-27)', () => {
    expect(measureTiles({ sleepMinutes: 452 }, entries, NOW)[0].when).toBe('cette nuit')
    expect(measureTiles({}, entries, NOW, { sleepMinutes: 400 })[0]).toMatchObject({ value: '6 h 40', when: 'nuit d’avant' })
  })

  it('reprend la veille, marquée « hier », quand aujourd’hui n’a pas encore le chiffre de la nuit (POL-PLAY-8)', () => {
    const tiles = measureTiles({ sleepMinutes: 452 }, entries, NOW, { sleepMinutes: 400, hrv: 38, steps: 9000 })
    expect(tiles.map((t) => [t.value, t.when])).toEqual([['7 h 32', 'cette nuit'], ['38 ms', 'hier'], [null, null]])
    expect(measureTiles(null, [], NOW, null).map((t) => t.when)).toEqual([null, null, null])
  })

  it('ne montre jamais les pas d’hier parmi les données du jour (POLISH-SIM-2c)', () => {
    // Les pas sont un total de la journée : ceux d’hier laissaient chercher ceux d’aujourd’hui
    const [, , steps] = measureTiles({}, entries, NOW, { steps: 9000 })
    expect(steps).toMatchObject({ value: null, when: null, sources: [] })
    expect(measureTiles({ steps: 1200 }, entries, NOW, { steps: 9000 })[2]).toMatchObject({ value: '1\u202f200', when: null })
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

  it('le bilan du soir compte dans les 7 jours mais n’est jamais « la dernière note » (I170)', () => {
    const day = { ...gut(21, 'calm', 20), payload: { level: 'calm', scope: 'day' } }
    const s = gutSummary([gut(20, 'pain', 10), day], NOW)
    expect(s.last.payload.level).toBe('pain')
    expect(s.lastToday).toBe(false)
    expect(s.week).toEqual({ calm: 1, discomfort: 0, pain: 1 })
    expect(s.daysNoted).toBe(2)
  })

  it('ne trouve rien sans note', () => {
    const s = gutSummary([], NOW)
    expect(s.last).toBeNull()
    expect(s.lastToday).toBe(false)
    expect(gutWeekLine(s)).toBe('7 jours : 7 jours sans note')
  })
})

describe('pistesProgress', () => {
  it('compte les jours avec un repas ou une note digestive, jusqu’au jour des premiers résultats (14)', () => {
    const entries = [
      { type: 'food', at: at(1) }, { type: 'food', at: at(1, 20) }, { type: 'gut', at: at(2) },
      { type: 'steps', at: at(3) }, { type: 'wellbeing', at: at(4) },
    ]
    expect(pistesProgress(entries)).toEqual({ days: 2, target: 14, remaining: 12, ready: false })
    const many = Array.from({ length: 30 }, (_, i) => ({ type: 'food', at: new Date(2026, 8, i + 1, 12).toISOString() }))
    expect(pistesProgress(many)).toEqual({ days: 14, target: 14, remaining: 0, ready: true })
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
    expect(pistesProgress(entries, 'energy')).toEqual({ days: 2, target: 14, remaining: 12, ready: false })
    expect(pistesProgress(entries, 'gut').days).toBe(1)
  })
})

describe('gutNotesProgress', () => {
  it('compte les jours avec une note digestive, jusqu’au seuil des pistes repas → digestion', () => {
    const entries = [{ type: 'gut', at: at(1) }, { type: 'gut', at: at(1, 20) }, { type: 'gut', at: at(2) }, { type: 'food', at: at(3) }]
    expect(gutNotesProgress(entries)).toEqual({ days: 2, target: 28, remaining: 26, ready: false })
    const many = Array.from({ length: 30 }, (_, i) => ({ type: 'gut', at: new Date(2026, 8, i + 1, 21).toISOString() }))
    expect(gutNotesProgress(many).ready).toBe(true)
  })

  it('suit le seuil de l’analyse du ventre', () => {
    expect(GUT_PISTES_MIN_NOTE_DAYS).toBe(GUT_LINKS_MIN_DAYS)
  })
})

describe('gutEveningCheck (bilan du soir, I170)', () => {
  const evening = new Date(2026, 9, 21, 20, 30)
  const day = (d, level, h = 21) => ({ type: 'gut', at: at(d, h), payload: { level, scope: 'day' } })

  it('ne demande rien avant 18 h', () => {
    expect(gutEveningCheck([], NOW)).toEqual({ ask: false, done: null })
    expect(gutEveningCheck([], new Date(2026, 9, 21, 17, 59)).ask).toBe(false)
    expect(gutEveningCheck([], new Date(2026, 9, 21, 18, 0)).ask).toBe(true)
  })

  it('demande le soir même si des notes horodatées existent, jamais deux fois', () => {
    const timed = { type: 'gut', at: at(21, 13), payload: { level: 'pain' } }
    expect(gutEveningCheck([timed], evening).ask).toBe(true)
    const r = gutEveningCheck([timed, day(21, 'discomfort', 19)], evening)
    expect(r.ask).toBe(false)
    expect(r.done.payload.level).toBe('discomfort')
  })

  it('le bilan de la veille ne compte pas pour ce soir', () => {
    expect(gutEveningCheck([day(20, 'calm')], evening)).toEqual({ ask: true, done: null })
  })
})

describe('todayBySource (TESTEUR-1d-b)', () => {
  const tiles = (over = {}) => [
    { key: 'sleep', label: 'Sommeil', value: '7 h 32', when: 'cette nuit', sources: ['Montre Huawei'], ...over.sleep },
    { key: 'hrv', label: 'Variabilité cardiaque', value: '41 ms', when: null, sources: ['Montre Huawei'], ...over.hrv },
    { key: 'steps', label: 'Pas', value: '3 456', when: null, sources: ['Health Connect'], ...over.steps },
  ]
  const ids = (groups) => groups.map((g) => g.id)
  const keys = (g) => g.items.map((i) => i.key)

  it('range les chiffres par source : montre (sommeil, VFC, FC au repos), téléphone (pas, écran)', () => {
    const groups = todayBySource({ tiles: tiles(), summary: { restingHr: 52, screenMinutes: 135 }, entries: [], now: NOW })
    expect(ids(groups)).toEqual(['watch', 'phone'])
    expect(groups[0].title).toBe('Montre')
    expect(keys(groups[0])).toEqual(['sleep', 'hrv', 'restingHr'])
    expect(groups[0].items[2]).toMatchObject({ label: 'FC au repos', value: '52 bpm' })
    expect(groups[1].title).toBe('Téléphone')
    expect(keys(groups[1])).toEqual(['steps', 'screen'])
    expect(groups[1].items[1]).toMatchObject({ label: 'Temps d’écran', value: '2 h 15' })
  })

  it('une source sans chiffre ne s’affiche pas ; sans montre, hasWatch est faux', () => {
    const none = { value: null, sources: [] }
    const groups = todayBySource({ tiles: tiles({ sleep: none, hrv: none }), summary: {}, entries: [], now: NOW })
    expect(ids(groups)).toEqual(['phone'])
    expect(todayBySource.hasWatch(groups)).toBe(false)
    expect(todayBySource({ tiles: tiles({ sleep: none, hrv: none, steps: none }), summary: null, entries: [], now: NOW })).toEqual([])
  })

  it('la nuit estimée par le téléphone va avec le téléphone, les pas d’une montre seule avec la montre', () => {
    const groups = todayBySource({
      tiles: tiles({ sleep: { label: 'Sommeil (estimé)', estimated: true, sources: [] }, hrv: { value: null, sources: [] }, steps: { sources: ['Montre Huawei'] } }),
      summary: {}, entries: [], now: NOW,
    })
    expect(groups.map((g) => [g.id, keys(g)])).toEqual([['watch', ['steps']], ['phone', ['sleep']]])
  })

  it('les pas du même appareil que la nuit vont avec la montre ; ceux de Health Connect seul avec le téléphone', () => {
    const same = todayBySource({
      tiles: tiles({ sleep: { sources: ['Health Connect · Garmin'] }, hrv: { value: null, sources: [] }, steps: { sources: ['Health Connect · Garmin'] } }),
      summary: {}, entries: [], now: NOW,
    })
    expect(same.map((g) => [g.id, keys(g)])).toEqual([['watch', ['sleep', 'steps']]])
    const other = todayBySource({ tiles: tiles({ sleep: { sources: ['Health Connect · Garmin'] } }), summary: {}, entries: [], now: NOW })
    expect(other.map((g) => [g.id, keys(g)])).toEqual([['watch', ['sleep', 'hrv']], ['phone', ['steps']]])
  })

  it('« Noté par vous » : dernière note du bien-être et du ventre du jour, repas et cigarettes ; jamais hier', () => {
    const entries = [
      { type: 'wellbeing', at: at(21, 8), payload: { score: 2.5 } },
      { type: 'wellbeing', at: at(21, 10), payload: { score: 5 } },
      { type: 'wellbeing', at: at(20, 20), payload: { score: 0 } },
      { type: 'gut', at: at(21, 9), payload: { level: 'discomfort' } },
      { type: 'gut', at: at(20, 9), payload: { level: 'pain' } },
    ]
    const g = todayBySource({ tiles: [], summary: { meals: 2, cigarettes: 1 }, entries, now: NOW, showGut: true })
    expect(ids(g)).toEqual(['noted'])
    expect(g[0].title).toBe('Noté par vous')
    expect(g[0].items.map((i) => [i.key, i.value, i.theme ?? null])).toEqual([
      ['wellbeing', '5/5', 'mint'], ['gut', 'Gêne', 'peach'], ['meals', '2', null], ['cigarettes', '1', null],
    ])
    expect(g[0].items[0].when).toBe('à 10:00')
  })

  it('le ventre seulement avec « Ma digestion » ; rien de noté aujourd’hui : pas de groupe', () => {
    const entries = [{ type: 'gut', at: at(21, 9), payload: { level: 'calm' } }]
    expect(todayBySource({ tiles: [], summary: {}, entries, now: NOW, showGut: false })).toEqual([])
    expect(todayBySource({ tiles: [], summary: { meals: 0, cigarettes: 0 }, entries: [{ type: 'gut', at: at(20, 9), payload: { level: 'calm' } }], now: NOW, showGut: true })).toEqual([])
  })
})
