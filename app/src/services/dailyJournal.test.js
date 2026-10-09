import { describe, it, expect } from 'vitest'
import { buildDailyJournal, dayHeading, JOURNAL_SUMMARY_TYPES } from './dailyJournal'

let nextId = 1
function e(type, at, payload = {}, source = 'health_connect') {
  return { id: nextId++, type, source, at, payload }
}

describe('buildDailyJournal', () => {
  it('regroupe les entrées par jour local, le plus récent en premier', () => {
    const days = buildDailyJournal([
      e('cigarette', '2026-10-07T09:00:00', { count: 1 }, 'app_cigarette'),
      e('cigarette', '2026-10-08T09:00:00', { count: 1 }, 'app_cigarette'),
      e('cigarette', '2026-10-08T15:00:00', { count: 2 }, 'app_cigarette'),
    ])
    expect(days.map((d) => d.dateKey)).toEqual(['2026-10-08', '2026-10-07'])
    expect(days[0].summary.cigarettes).toBe(3)
    expect(days[1].summary.cigarettes).toBe(1)
  })

  it('résume les mesures de la montre au lieu de les lister une par une', () => {
    const [day] = buildDailyJournal([
      e('heart_rate', '2026-10-08T09:00:00', { bpm: 69, subtype: 'heartRate' }),
      e('heart_rate', '2026-10-08T14:00:00', { bpm: 83, subtype: 'heartRate' }),
      e('heart_rate', '2026-10-08T19:00:00', { bpm: 62 }),
      e('heart_rate', '2026-10-08T07:00:00', { bpm: 61, subtype: 'restingHeartRate' }),
      e('heart_rate', '2026-10-08T06:30:00', { value: 46, unit: 'millisecond', subtype: 'heartRateVariability' }),
      e('heart_rate', '2026-10-08T06:31:00', { value: 97, unit: 'percent', subtype: 'oxygenSaturation' }),
      e('steps', '2026-10-08T00:00:00', { value: 10085, period: 'day' }),
      e('calories', '2026-10-08T00:00:00', { value: 2352.4, period: 'day' }),
    ])
    expect(day.summary.heartRate).toEqual({ min: 62, max: 83, count: 3 })
    expect(day.summary.restingHr).toBe(61)
    expect(day.summary.hrv).toBe(46)
    expect(day.summary.spo2).toBe(97)
    expect(day.summary.steps).toBe(10085)
    expect(day.summary.burnedKcal).toBe(2352)
    expect(day.items).toEqual([])
  })

  it('ne compte pas deux fois les pas quand un total journalier existe', () => {
    const [day] = buildDailyJournal([
      e('steps', '2026-10-08T00:00:00', { value: 8000, period: 'day' }),
      e('steps', '2026-10-08T00:00:00', { value: 8200, period: 'day' }),
      e('steps', '2026-10-08T10:00:00', { value: 500 }),
    ])
    expect(day.summary.steps).toBe(8200)
  })

  it('additionne les pas partiels sans total journalier', () => {
    const [day] = buildDailyJournal([
      e('steps', '2026-10-08T10:00:00', { value: 500 }),
      e('steps', '2026-10-08T11:00:00', { value: 700 }),
    ])
    expect(day.summary.steps).toBe(1200)
  })

  it('range la nuit au jour du réveil et ignore les phases éveillées', () => {
    const days = buildDailyJournal([
      e('sleep', '2026-10-07T23:05:00', { durationMinutes: 461, sleepState: 'asleep', endDate: '2026-10-08T06:46:00' }),
      e('sleep', '2026-10-08T03:00:00', { durationMinutes: 10, sleepState: 'awake' }),
    ])
    expect(days).toHaveLength(1)
    expect(days[0].dateKey).toBe('2026-10-08')
    expect(days[0].summary.sleepMinutes).toBe(461)
  })

  it('déduit le réveil de la durée quand la fin manque', () => {
    const [day] = buildDailyJournal([
      e('sleep', '2026-10-07T23:00:00', { durationMinutes: 480 }),
    ])
    expect(day.dateKey).toBe('2026-10-08')
  })

  it('moyenne le bien-être et compte les repas avec leurs kcal connues', () => {
    const [day] = buildDailyJournal([
      e('wellbeing', '2026-10-08T09:00:00', { score: 3 }, 'app_wellbeing'),
      e('wellbeing', '2026-10-08T21:00:00', { score: 4 }, 'app_wellbeing'),
      e('food', '2026-10-08T12:15:00', { items: [{ ingredient: 'Inconnu au bataillon', quantity: '1 bol' }] }, 'app_food'),
      e('food', '2026-10-08T20:15:00', { items: [] }, 'app_food'),
    ])
    expect(day.summary.wellbeing).toEqual({ average: 3.5, count: 2 })
    expect(day.summary.meals).toBe(2)
    expect(day.summary.mealKcal).toBe(0)
  })

  it('garde les saisies et événements dans la liste du jour, du plus récent au plus ancien', () => {
    const [day] = buildDailyJournal([
      e('food', '2026-10-08T12:15:00', { items: [] }, 'app_food'),
      e('activity', '2026-10-08T18:00:00', { workoutType: 'cycling' }),
      e('weight', '2026-10-08T07:10:00', { valueKg: 77.2 }, 'withings'),
      e('heart_rate', '2026-10-08T09:00:00', { bpm: 70 }),
      e('mystery', '2026-10-08T08:00:00', { x: 1 }, 'other'),
    ])
    expect(day.items.map((i) => i.type)).toEqual(['activity', 'food', 'mystery', 'weight'])
  })

  it('n’affiche pas de valeur absente (null) et ignore les entrées sans date', () => {
    const days = buildDailyJournal([
      e('cigarette', '2026-10-08T09:00:00', {}, 'app_cigarette'),
      { id: 999, type: 'food', source: 'app_food', payload: {} },
    ])
    expect(days).toHaveLength(1)
    const s = days[0].summary
    expect(s.cigarettes).toBe(1)
    expect(s.steps).toBeNull()
    expect(s.sleepMinutes).toBeNull()
    expect(s.restingHr).toBeNull()
    expect(s.heartRate).toBeNull()
    expect(s.wellbeing).toBeNull()
    expect(s.burnedKcal).toBeNull()
  })

  it('renvoie une liste vide sans entrées', () => {
    expect(buildDailyJournal([])).toEqual([])
    expect(buildDailyJournal(undefined)).toEqual([])
  })

  it('expose les types résumés (non listés individuellement)', () => {
    expect(JOURNAL_SUMMARY_TYPES).toEqual(expect.arrayContaining(['heart_rate', 'steps', 'calories', 'sleep']))
  })
})

describe('dayHeading', () => {
  const now = new Date('2026-10-09T18:30:00')

  it('dit « Aujourd’hui » et « Hier »', () => {
    expect(dayHeading('2026-10-09', now).title).toBe('Aujourd’hui')
    expect(dayHeading('2026-10-08', now).title).toBe('Hier')
  })

  it('donne le jour de la semaine pour les jours plus anciens', () => {
    const h = dayHeading('2026-10-06', now)
    expect(h.title).toBe('Mardi')
    expect(h.date).toBe('6 octobre')
  })

  it('ajoute l’année quand elle diffère', () => {
    expect(dayHeading('2025-12-31', now).date).toBe('31 décembre 2025')
  })
})
