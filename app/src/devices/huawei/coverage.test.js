import { describe, it, expect } from 'vitest'
import { coverageSummary, readOutcome, WATCH_DATA_KINDS, watchCoverage } from './coverage'
import { watchEntries, totalsEntries } from './sync'

// Données synthétiques (aucune mesure réelle) : 2 nuits détaillées, une sieste, minutes, VFC de journée, peau, séance
const NOW = new Date(2026, 9, 22, 14, 0).getTime()
const t = (dayOffset, h, m = 0) => new Date(2026, 9, 22 + dayOffset, h, m).getTime()
const night = (d, extra = {}) => ({
  start: t(d - 1, 23),
  end: t(d, 7),
  stages: [
    { start: t(d - 1, 23), minutes: 240, stage: 'light' },
    { start: t(d, 3), minutes: 30, stage: 'awake' },
    { start: t(d, 3, 30), minutes: 210, stage: 'deep' },
  ],
  ...extra,
})

function sample() {
  const minutes = []
  for (let i = 0; i < 60; i++) minutes.push({ t: t(0, 9) + i * 60_000, steps: 20, kcal: 2, hr: 70, ...(i === 5 ? { spo2: 97 } : {}) })
  minutes.push({ t: t(-1, 18), restingHr: 55 })
  const data = {
    minutes,
    nights: [night(-1, { hrvMs: 41, respAvg: 14.2, score: 78 }), night(0, { hrvMs: 48, score: 82 }), { start: t(-1, 14), end: t(-1, 14, 40), nap: true, stages: [{ start: t(-1, 14), minutes: 40, stage: 'light' }] }],
    hrvDay: [{ start: t(0, 10), value: 35 }],
    skinTemp: [{ start: t(0, 4), value: 33.74 }],
    stress: [{ start: t(0, 11), end: t(0, 11, 5), score: 31, level: 2 }, { start: t(-1, 16), end: t(-1, 16, 5), score: 58, level: 2 }],
    workouts: [{ start: t(-2, 18), end: t(-2, 18, 45), sport: 'running', durationSec: 2700, hrAvg: 142, hrCurve: { stepSeconds: 60, bpm: [130, 150] }, paceSplits: [324] }],
  }
  return [...watchEntries(data, { until: NOW }), ...totalsEntries({ steps: 4321, kcal: 210 }, NOW)].map((e) => ({ ...e }))
}

const row = (rows, id) => rows.find((r) => r.id === id)

describe('watchCoverage (écran « Montre », M5)', () => {
  it('rend une ligne par type, dans l’ordre de valeur (sommeil et VFC d’abord)', () => {
    const rows = watchCoverage([], { now: NOW })
    expect(rows.map((r) => r.id)).toEqual(WATCH_DATA_KINDS.map((k) => k.id))
    expect(rows.slice(0, 3).map((r) => r.id)).toEqual(['sleep', 'nap', 'hrvNight'])
    expect(rows.every((r) => r.status === 'none')).toBe(true)
    expect(row(rows, 'stress').status).toBe('none')
  })

  it('dernière valeur, date et nombre sur 7 jours pour chaque type reçu', () => {
    const rows = watchCoverage(sample(), { now: NOW })
    expect(row(rows, 'sleep')).toMatchObject({ status: 'ok', count: 2, unit: 'nuits', last: { value: '7 h 30 · score 82', at: new Date(t(0, 7)).toISOString() } })
    expect(row(rows, 'nap')).toMatchObject({ status: 'ok', count: 1, last: { value: '40 min' } })
    expect(row(rows, 'hrvNight')).toMatchObject({ count: 2, last: { value: '48 ms' } })
    expect(row(rows, 'hrvDay')).toMatchObject({ count: 1, last: { value: '35 ms' } })
    expect(row(rows, 'skinTemp').last.value).toBe('33,7 °C')
    expect(row(rows, 'resp').last.value).toBe('14,2 /min')
    expect(row(rows, 'spo2').last.value).toBe('97 %')
    expect(row(rows, 'stress')).toMatchObject({ status: 'ok', count: 2, last: { value: '31 · normal' } })
    expect(row(rows, 'hr')).toMatchObject({ status: 'ok', last: { value: '70 bpm' } })
    expect(row(rows, 'restingHr').last.value).toBe('55 bpm')
    // Le total du jour rendu par la montre l'emporte sur la somme des heures
    expect(row(rows, 'steps')).toMatchObject({ count: 1, unit: 'jour', last: { value: '4 321 pas' } })
    expect(row(rows, 'calories').last.value).toBe('210 kcal')
    expect(row(rows, 'workouts').last.value).toBe('Course à pied · 45 min · FC moy. 142 bpm · 5:24 /km')
  })

  it('ne compte que la montre en direct, et dit « plus ancien » au-delà de 7 jours', () => {
    const old = { type: 'heart_rate', source: 'huawei_watch', at: new Date(t(-12, 3)).toISOString(), payload: { value: 30, subtype: 'heartRateVariability', during: 'day' } }
    const hc = { type: 'heart_rate', source: 'health_connect', at: new Date(t(0, 3)).toISOString(), payload: { value: 60, subtype: 'heartRateVariability' } }
    const rows = watchCoverage([old, hc], { now: NOW })
    expect(row(rows, 'hrvDay')).toMatchObject({ status: 'stale', count: 0, last: { value: '30 ms' } })
    expect(row(rows, 'hrvNight').status).toBe('none')
  })

  it('issue de la dernière lecture : « reçu » si l’une des lectures du type a rendu quelque chose', () => {
    const reads = [
      { id: 'sleepFile', outcome: 'timeout' },
      { id: 'sleep', outcome: 'ok', count: 3 },
      { id: 'hrvDay', outcome: 'unsupported' },
      { id: 'skinTemp', outcome: 'empty' },
    ]
    const rows = watchCoverage([], { now: NOW, reads })
    expect(row(rows, 'sleep').read).toEqual({ outcome: 'ok', label: 'reçu (3)' })
    expect(row(rows, 'hrvNight').read).toEqual({ outcome: 'timeout', label: 'sans réponse' })
    expect(row(rows, 'hrvDay').read.label).toBe('non pris en charge')
    expect(row(rows, 'skinTemp').read.label).toBe('vide')
    expect(row(rows, 'workouts').read).toBeNull()
    expect(readOutcome(WATCH_DATA_KINDS.find((k) => k.id === 'stress'), reads)).toBeNull()
    expect(row(watchCoverage([], { now: NOW, reads: [{ id: 'stress', outcome: 'ok', count: 4 }] }), 'stress').read.label).toBe('reçu (4)')
  })

  it('résumé : types reçus ces 7 jours, sans compter ceux pas encore lus', () => {
    expect(coverageSummary(watchCoverage(sample(), { now: NOW }))).toBe('13 types sur 13 reçus ces 7 derniers jours')
    expect(coverageSummary(watchCoverage([], { now: NOW }))).toBe('0 type sur 13 reçu ces 7 derniers jours')
  })
})
