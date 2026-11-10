import { describe, it, expect } from 'vitest'
import {
  CYCLE_TYPE, cycleByDay, cycleLineParts, cycleVisible, daysBetween, hasCycleData, MAX_CYCLE_DAY,
  periodEntry, periodEntryOn, spottingEntry, symptomEntry,
} from './cycle'
import { localDateKey } from './analysisEngine'

const period = (key, flow) => periodEntry(key, flow)

describe('cycle : saisies', () => {
  it('une saisie tombe sur le jour voulu, en heure locale', () => {
    const e = periodEntry('2026-03-29', 'medium')
    expect(e.type).toBe(CYCLE_TYPE)
    expect(localDateKey(e.at)).toBe('2026-03-29')
    expect(e.payload).toEqual({ subtype: 'period', flow: 'medium' })
  })

  it('un flux inconnu devient « unknown » ; date ou symptôme invalide refusés', () => {
    expect(periodEntry('2026-11-01', 'énorme').payload.flow).toBe('unknown')
    expect(() => periodEntry('1/11/2026')).toThrow()
    expect(() => symptomEntry('2026-11-01', 'migraine-aura')).toThrow()
  })

  it('constipation et diarrhée en fin de liste : les minutes des symptômes existants ne bougent pas', async () => {
    const { SYMPTOMS, SYMPTOM_LABELS } = await import('./cycle')
    expect(SYMPTOMS.slice(0, 5)).toEqual(['cramps', 'pelvic_pain', 'bloating', 'headache', 'fatigue'])
    expect(SYMPTOMS.slice(5)).toEqual(['constipation', 'diarrhea'])
    expect(SYMPTOM_LABELS.constipation).toBe('Constipation')
    expect(SYMPTOM_LABELS.diarrhea).toBe('Diarrhée')
    expect(new Date(symptomEntry('2026-11-01', 'cramps').at).getMinutes()).toBe(2)
    const minutes = SYMPTOMS.map((s) => new Date(symptomEntry('2026-11-01', s).at).getMinutes())
    expect(new Set(minutes).size).toBe(SYMPTOMS.length)
  })

  it('daysBetween ignore le changement d’heure', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  })
})

describe('cycle : jour par jour', () => {
  const entries = [
    period('2026-10-01', 'heavy'), period('2026-10-02', 'medium'), period('2026-10-04', 'light'),
    period('2026-10-29', 'medium'), period('2026-10-30'),
    spottingEntry('2026-10-15'), symptomEntry('2026-10-01', 'cramps'), symptomEntry('2026-10-01', 'cramps'),
    { type: 'gut', at: '2026-10-02T10:00:00Z', payload: { level: 'calm' } },
  ]

  it('jour des règles, en tolérant un jour oublié', () => {
    const days = cycleByDay(entries)
    expect(days.get('2026-10-01')).toMatchObject({ period: true, flow: 'heavy', periodDay: 1, cycleDay: 1, symptoms: ['cramps'] })
    expect(days.get('2026-10-02')).toMatchObject({ periodDay: 2, flow: 'medium' })
    expect(days.get('2026-10-04')).toMatchObject({ periodDay: 4, cycleDay: 4 })
  })

  it('un nouveau cycle commence aux règles suivantes ; flux inconnu non affiché', () => {
    const days = cycleByDay(entries, ['2026-10-28'])
    expect(days.get('2026-10-28')).toMatchObject({ period: false, cycleDay: 28, periodDay: null })
    expect(days.get('2026-10-29')).toMatchObject({ periodDay: 1, cycleDay: 1 })
    expect(days.get('2026-10-30')).toMatchObject({ periodDay: 2, flow: null })
  })

  it('un saignement hors des règles ne commence pas de cycle', () => {
    expect(cycleByDay(entries).get('2026-10-15')).toMatchObject({ spotting: true, period: false, cycleDay: 15 })
  })

  it('pas de jour du cycle avant les premières règles ni trop longtemps après', () => {
    const days = cycleByDay([period('2026-01-01')], ['2025-12-31', '2026-03-01', '2026-03-02'])
    expect(days.get('2025-12-31').cycleDay).toBeNull()
    expect(days.get('2026-03-01').cycleDay).toBe(MAX_CYCLE_DAY)
    expect(days.get('2026-03-02').cycleDay).toBeNull()
  })

  it('deux saisies le même jour : la plus récente gagne', () => {
    const a = { ...period('2026-10-01', 'light'), created_at: '2026-10-01T08:00:00Z' }
    const b = { ...period('2026-10-01', 'heavy'), created_at: '2026-10-01T09:00:00Z' }
    expect(cycleByDay([b, a]).get('2026-10-01').flow).toBe('heavy')
  })

  it('aucune donnée de cycle : rien', () => {
    expect(cycleByDay([{ type: 'gut', at: '2026-10-02T10:00:00Z', payload: {} }]).size).toBe(0)
    expect(hasCycleData([])).toBe(false)
    expect(hasCycleData(entries)).toBe(true)
  })
})

describe('cycle : affichage', () => {
  it('rien tant que « Mon cycle » n’est pas coché et qu’il n’y a aucune donnée', () => {
    expect(cycleVisible(['gut'], false)).toBe(false)
    expect(cycleVisible(['gut', 'cycle'], false)).toBe(true)
    expect(cycleVisible([], true)).toBe(true)
  })

  it('ligne « Règles · 2e jour · flux moyen »', () => {
    expect(cycleLineParts({ period: true, periodDay: 2, flow: 'medium' })).toEqual({ label: 'Règles', periodDay: 2, flow: 'flux moyen' })
    expect(cycleLineParts({ period: false, spotting: true })).toEqual({ label: 'Saignement léger', periodDay: null, flow: null })
    expect(cycleLineParts({ period: false, spotting: false, cycleDay: 9 })).toBeNull()
  })
})

describe('cycle : dédoublonnage de l’import', () => {
  it('règles, saignement et chaque symptôme d’un même jour ont des clés (source, date, type) distinctes', () => {
    const day = '2026-10-01'
    const all = [periodEntry(day), spottingEntry(day), symptomEntry(day, 'cramps'), symptomEntry(day, 'fatigue')]
    expect(new Set(all.map((e) => `${e.source}|${e.at}|${e.type}`)).size).toBe(4)
    expect(all.every((e) => localDateKey(e.at) === day)).toBe(true)
  })
})

describe('periodEntryOn (CYCLE-2)', () => {
  it('rend la saisie de règles du jour, la plus récente, et rien d’autre', () => {
    const a = { ...periodEntry('2026-11-10', 'light'), id: 1, created_at: '2026-11-10T08:00:00Z' }
    const b = { ...periodEntry('2026-11-10', 'heavy'), id: 2, created_at: '2026-11-10T09:00:00Z' }
    const s = { ...symptomEntry('2026-11-10', 'cramps'), id: 3 }
    const y = { ...periodEntry('2026-11-09', 'medium'), id: 4 }
    expect(periodEntryOn([a, b, s, y], '2026-11-10').id).toBe(2)
    expect(periodEntryOn([s, y], '2026-11-10')).toBeNull()
    expect(periodEntryOn(null, '2026-11-10')).toBeNull()
  })
})
