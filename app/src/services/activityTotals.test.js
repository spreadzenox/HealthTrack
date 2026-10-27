import { describe, it, expect } from 'vitest'
import { activityValue, isLegacyWatchCalories, totalOf } from './activityTotals'
import { buildDailyJournal } from './dailyJournal'

// Trames synthétiques : une journée du 26/10/2026 (heure locale de Paris dans l'environnement de test)
const at = (h, m = 0) => new Date(2026, 9, 26, h, m).toISOString()
const watch = (type, h, value, extra = {}) => ({ type, source: 'huawei_watch', at: at(h), payload: { value, endDate: at(h + 1), connector: 'huawei_watch', sourceName: 'HUAWEI WATCH GT 6 Pro-ABC', ...extra } })
const hc = (type, h, m, value, app = 'Samsung Health') => ({ type, source: 'health_connect', at: at(h, m), payload: { value, sourceName: app, connector: 'health_connect' } })

describe('activityTotals — pas', () => {
  it('montre et Health Connect qui comptent les mêmes pas ne sont jamais additionnés', () => {
    const entries = [
      watch('steps', 9, 4000), watch('steps', 10, 3000),
      hc('steps', 9, 0, 2000), hc('steps', 9, 30, 1800), hc('steps', 10, 0, 3100),
    ]
    // 09 h : montre 4 000 > téléphone 3 800 ; 10 h : téléphone 3 100 > montre 3 000
    expect(totalOf(entries, 'steps')).toBe(7100)
  })

  it('une source seule à certaines heures compte pour ces heures (téléphone le matin, montre l’après-midi)', () => {
    expect(totalOf([hc('steps', 8, 0, 1500), watch('steps', 14, 2500)], 'steps')).toBe(4000)
  })

  it('total du jour de la montre et ses tranches : le plus grand des deux, pas la somme', () => {
    const day = { ...watch('steps', 0, 9000), payload: { value: 9000, period: 'day', connector: 'huawei_watch' } }
    expect(totalOf([day, watch('steps', 9, 4000), watch('steps', 10, 3000)], 'steps')).toBe(9000)
    expect(totalOf([{ ...day, payload: { ...day.payload, value: 5000 } }, watch('steps', 9, 4000), watch('steps', 10, 3000)], 'steps')).toBe(7000)
  })

  it('deux apps Health Connect qui écrivent les mêmes pas : la plus grande par heure', () => {
    expect(totalOf([hc('steps', 9, 0, 2000, 'Samsung Health'), hc('steps', 9, 10, 2100, 'Google Fit')], 'steps')).toBe(2100)
  })

  it('garde-fou : un total hors de toute plausibilité n’est pas affiché', () => {
    expect(totalOf([watch('steps', 9, 150_000)], 'steps')).toBeNull()
    expect(totalOf([], 'steps')).toBeNull()
  })
})

describe('activityTotals — calories de la montre', () => {
  it('une ancienne tranche (petites calories, sans rawCal) est lue en kcal', () => {
    const legacy = watch('calories', 9, 54_321)
    expect(isLegacyWatchCalories(legacy)).toBe(true)
    expect(activityValue(legacy)).toBeCloseTo(54.321)
  })

  it('une tranche déjà convertie, un total du jour de la montre et Health Connect restent tels quels', () => {
    expect(activityValue(watch('calories', 9, 54.3, { rawCal: 54_321 }))).toBe(54.3)
    expect(activityValue({ ...watch('calories', 0, 650), payload: { value: 650, period: 'day' } })).toBe(650)
    expect(activityValue(hc('calories', 9, 0, 120))).toBe(120)
  })

  it('reproduit le signalement du 27/10 : une journée de 658 625 « kcal » devient ≈ 659 kcal', () => {
    // 16 heures actives dont la somme des minutes fait 658 625 petites calories
    const hours = Array.from({ length: 15 }, (_, i) => watch('calories', 7 + i, 41_164))
    hours.push(watch('calories', 22, 658_625 - 41_164 * 15))
    const [day] = buildDailyJournal(hours)
    expect(day.summary.burnedKcal).toBe(659)
  })
})

describe('buildDailyJournal — pas du signalement du 27/10', () => {
  it('montre + téléphone à la même heure : une seule fois', () => {
    const entries = []
    for (let h = 8; h < 20; h++) {
      entries.push(watch('steps', h, 1250))
      entries.push(hc('steps', h, 5, 1200))
    }
    const [day] = buildDailyJournal(entries)
    expect(day.summary.steps).toBe(15_000)
  })
})
