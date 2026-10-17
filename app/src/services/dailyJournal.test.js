import { describe, it, expect } from 'vitest'
import { buildDailyJournal, dayHeading, groupMealsByDay, JOURNAL_SUMMARY_TYPES } from './dailyJournal'

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

  it('total du jour lu en cours de journée (montre) : la somme des heures, plus complète, l’emporte', () => {
    const [day] = buildDailyJournal([
      e('steps', '2026-10-08T00:00:50', { value: 603, period: 'day' }),
      e('steps', '2026-10-08T10:00:00', { value: 5000 }),
      e('steps', '2026-10-08T18:00:00', { value: 3000 }),
    ])
    expect(day.summary.steps).toBe(8000)
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

  it('compte une nuit enregistrée seulement « au lit » (comme le Radar et les Analyses)', () => {
    const [day] = buildDailyJournal([
      e('sleep', '2026-10-07T23:10:00', { durationMinutes: 430, sleepState: 'inBed', endDate: '2026-10-08T06:20:00' }),
    ])
    expect(day.summary.sleepMinutes).toBe(430)
  })

  it('ne double pas une nuit qui a à la fois « au lit » et des phases', () => {
    const [day] = buildDailyJournal([
      e('sleep', '2026-10-07T23:00:00', { durationMinutes: 480, sleepState: 'inBed', endDate: '2026-10-08T07:00:00' }),
      e('sleep', '2026-10-07T23:20:00', { durationMinutes: 420, sleepState: 'light', endDate: '2026-10-08T06:20:00' }),
    ])
    expect(day.summary.sleepMinutes).toBe(420)
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

  it('fusionne le poids et la composition corporelle d’une même pesée', () => {
    const [day] = buildDailyJournal([
      e('weight', '2026-10-08T07:30:00', { valueKg: 77.2, fatRatioPct: 24.1 }, 'withings'),
      e('body_composition', '2026-10-08T07:30:00', { valueKg: 77.2, fatRatioPct: 24.1 }, 'withings'),
      e('weight', '2026-10-08T19:00:00', { valueKg: 78 }, 'withings'),
    ])
    expect(day.items.map((i) => i.type)).toEqual(['weight', 'body_composition'])
  })

  it('reporte le poids sur la composition quand elle ne le contient pas', () => {
    const [day] = buildDailyJournal([
      e('weight', '2026-10-08T07:30:00', { valueKg: 77.2 }, 'withings'),
      e('body_composition', '2026-10-08T07:30:00', { fatRatioPct: 24.1 }, 'withings'),
    ])
    expect(day.items).toHaveLength(1)
    expect(day.items[0].payload).toEqual({ fatRatioPct: 24.1, valueKg: 77.2 })
  })

  it('garde deux pesées de sources différentes au même instant', () => {
    const [day] = buildDailyJournal([
      e('weight', '2026-10-08T07:30:00', { valueKg: 77.2 }, 'scale'),
      e('body_composition', '2026-10-08T07:30:00', { fatRatioPct: 24.1 }, 'withings'),
    ])
    expect(day.items).toHaveLength(2)
  })

  it('écarte la copie Health Connect d’une pesée déjà importée par Withings', () => {
    // Withings écrit aussi ses pesées dans Health Connect : sans cela, chaque pesée apparaîtrait deux fois.
    const [day] = buildDailyJournal([
      e('weight', '2026-10-08T07:30:00', { valueKg: 77.2 }, 'withings'),
      e('body_composition', '2026-10-08T07:30:00', { valueKg: 77.2, fatRatioPct: 24.1 }, 'withings'),
      e('weight', '2026-10-08T07:30:05', { valueKg: 77.2 }),
      e('body_composition', '2026-10-08T07:30:05', { fatRatioPct: 24.1 }),
    ])
    expect(day.items).toHaveLength(1)
    expect(day.items[0].source).toBe('withings')
  })

  it('garde une pesée Health Connect seule (balance d’une autre marque)', () => {
    const [day] = buildDailyJournal([
      e('weight', '2026-10-08T07:30:00', { valueKg: 77.2 }),
      e('body_composition', '2026-10-08T07:30:00', { fatRatioPct: 24.1 }),
    ])
    expect(day.items).toHaveLength(1)
    expect(day.items[0].payload).toMatchObject({ valueKg: 77.2, fatRatioPct: 24.1 })
  })

  it('résume respiration, température, tension et glycémie sans les lister ni les compter comme FC', () => {
    const [day] = buildDailyJournal([
      e('respiratory_rate', '2026-10-08T02:00:00', { value: 14 }),
      e('respiratory_rate', '2026-10-08T03:00:00', { value: 15 }),
      e('body_temperature', '2026-10-08T03:00:00', { valueC: 36.4 }),
      e('body_temperature', '2026-10-08T07:00:00', { valueC: 36.7 }),
      e('blood_pressure', '2026-10-08T08:00:00', { systolic: 124, diastolic: 79 }),
      e('blood_glucose', '2026-10-08T08:00:00', { mgDl: 95 }),
    ])
    expect(day.items).toEqual([])
    expect(day.summary.respiratoryRate).toBe(14.5)
    expect(day.summary.temperatureC).toBe(36.7)
    expect(day.summary.bloodPressure).toEqual({ systolic: 124, diastolic: 79 })
    expect(day.summary.glucoseMgDl).toBe(95)
    expect(day.summary.heartRate).toBeNull()
  })

  it('renvoie une liste vide sans entrées', () => {
    expect(buildDailyJournal([])).toEqual([])
    expect(buildDailyJournal(undefined)).toEqual([])
  })

  it('expose les types résumés (non listés individuellement)', () => {
    expect(JOURNAL_SUMMARY_TYPES).toEqual(expect.arrayContaining(['heart_rate', 'steps', 'calories', 'sleep']))
  })
})

describe('buildDailyJournal — météo', () => {
  const w = (date, payload) => e('weather', `${date}T10:00:00.000Z`, { date, tempMaxC: 14, tempMinC: 6, pressureHpa: 1012, ...payload }, 'open_meteo')

  it('la météo est résumée dans la journée, jamais listée comme une saisie', () => {
    const [day] = buildDailyJournal([w('2026-10-11', {}), e('steps', '2026-10-11T20:00:00.000Z', { value: 5000, period: 'day' })])
    expect(day.items).toEqual([])
    expect(day.summary.weather).toMatchObject({ tempMaxC: 14, pressureHpa: 1012 })
    expect(JOURNAL_SUMMARY_TYPES).toContain('weather')
  })

  it('une journée qui n’a que la météo n’apparaît pas (rien de vous ce jour-là)', () => {
    const days = buildDailyJournal([w('2026-10-10', {}), w('2026-10-11', {}), e('steps', '2026-10-11T20:00:00.000Z', { value: 5000, period: 'day' })])
    expect(days.map((d) => d.dateKey)).toEqual(['2026-10-11'])
  })
})

describe('buildDailyJournal — fuseau horaire', () => {
  it('l’entrée « context » (fuseau du jour) n’est ni listée ni ne fait apparaître une journée', () => {
    const ctx = (date) => e('context', `${date}T10:00:00.000Z`, { date, tz: 'Europe/Paris', tzOffset: 120 }, 'app_context')
    const days = buildDailyJournal([ctx('2026-10-10'), ctx('2026-10-11'), e('steps', '2026-10-11T20:00:00.000Z', { value: 5000, period: 'day' })])
    expect(days.map((d) => d.dateKey)).toEqual(['2026-10-11'])
    expect(days[0].items).toEqual([])
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

describe('groupMealsByDay', () => {
  const meal = (id, at, items = [{ ingredient: 'Abondance', quantity: '100 g', quantity_g: 100 }]) =>
    ({ id, type: 'food', at, payload: { items } })

  it('regroupe les repas par jour local, le plus récent en premier, avec le total de kcal', () => {
    const days = groupMealsByDay([
      meal('a', '2026-10-09T12:15:00'),
      meal('b', '2026-10-10T20:15:00'),
      meal('c', '2026-10-10T12:15:00'),
    ])
    expect(days.map((d) => d.dateKey)).toEqual(['2026-10-10', '2026-10-09'])
    expect(days[0].meals.map((m) => m.id)).toEqual(['b', 'c'])
    expect(days[0].kcal).toBe(786)
    expect(days[1].kcal).toBe(393)
  })

  it('ne garde que les maxDays jours les plus récents', () => {
    const meals = [meal('a', '2026-10-10T12:00:00'), meal('b', '2026-10-09T12:00:00'), meal('c', '2026-10-08T12:00:00')]
    expect(groupMealsByDay(meals, { maxDays: 2 }).map((d) => d.dateKey)).toEqual(['2026-10-10', '2026-10-09'])
  })

  it('un repas sans aliment reconnu compte 0 kcal sans faire échouer le total', () => {
    const [day] = groupMealsByDay([meal('a', '2026-10-10T12:00:00', []), { id: 'b', type: 'food', at: '2026-10-10T08:00:00' }])
    expect(day.meals).toHaveLength(2)
    expect(day.kcal).toBe(0)
  })

  it('ignore les entrées sans date valide', () => {
    expect(groupMealsByDay([{ id: 'x', type: 'food', at: 'n’importe quoi' }])).toEqual([])
  })
})

describe('buildDailyJournal — téléphone', () => {
  const ph = (date, payload) => e('phone_usage', `${date}T10:00:00.000Z`, { date, screenMinutes: 150, lateScreenMinutes: 20, unlocks: 40, ...payload }, 'phone')
  const steps = (date) => e('steps', `${date}T20:00:00.000Z`, { value: 5000, period: 'day' })

  it('temps d’écran résumé ; sans montre, la nuit estimée par le téléphone (marquée « estimé »)', () => {
    const [day] = buildDailyJournal([ph('2026-10-11', { sleepEstimate: { minutes: 430 } }), steps('2026-10-11')])
    expect(day.items).toEqual([])
    expect(day.summary).toMatchObject({ screenMinutes: 150, sleepMinutes: 430, sleepEstimated: true })
    expect(JOURNAL_SUMMARY_TYPES).toContain('phone_usage')
  })

  it('la nuit de la montre prime sur l’estimation', () => {
    const sleep = e('sleep', '2026-10-10T23:00:00.000', { durationMinutes: 400, endDate: '2026-10-11T06:00:00.000', sleepState: 'light' })
    const [day] = buildDailyJournal([ph('2026-10-11', { sleepEstimate: { minutes: 430 } }), sleep])
    expect(day.summary).toMatchObject({ sleepMinutes: 400, sleepEstimated: false })
  })

  it('une journée qui n’a que le téléphone n’apparaît pas', () => {
    const days = buildDailyJournal([ph('2026-10-10', {}), ph('2026-10-11', {}), steps('2026-10-11')])
    expect(days.map((d) => d.dateKey)).toEqual(['2026-10-11'])
  })
})
