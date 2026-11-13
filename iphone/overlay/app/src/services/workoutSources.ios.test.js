import { describe, it, expect } from 'vitest'
import { oneSourcePerWorkout } from './workoutSources'

// Version iOS (HealthTrack-iOS) : une séance écrite dans l'app Santé par deux sources (l'Apple Watch et une app de
// course) ne compte qu'une fois (workoutSources.js d'Android, v611). Entrées telles que le connecteur les écrit sur
// iPhone : source `health_connect` (même connecteur), `sourceName` = nom de la source HealthKit, `endDate` et
// `durationSeconds` rendus par le plugin Santé
const workout = (sourceName, start, minutes, totalCalories) => ({
  type: 'activity',
  source: 'health_connect',
  at: new Date(start).toISOString(),
  payload: {
    workoutType: 'running',
    durationSeconds: minutes * 60,
    totalCalories,
    endDate: new Date(new Date(start).getTime() + minutes * 60000).toISOString(),
    sourceName,
    connector: 'health_connect',
  },
})

describe('Séances de l’app Santé comptées une fois (iPhone)', () => {
  it('Apple Watch et une app de course sur la même séance : une seule, la plus longue', () => {
    const watch = workout('Apple Watch', '2026-10-20T18:00:00Z', 45, 420)
    const app = workout('Strava', '2026-10-20T18:01:00Z', 43, 400)
    expect(oneSourcePerWorkout([app, watch])).toEqual([watch])
  })

  it('deux séances d’une même source, le même soir, restent deux', () => {
    const a = workout('Apple Watch', '2026-10-20T18:00:00Z', 30, 250)
    const b = workout('Apple Watch', '2026-10-20T18:20:00Z', 30, 260)
    expect(oneSourcePerWorkout([a, b])).toEqual([a, b])
  })
})
