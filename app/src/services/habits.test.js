import { describe, it, expect } from 'vitest'
import { HABIT_TYPE, HABIT_SOURCE, SUGGESTED_HABITS, customHabit, habitEntry, habitAnswers } from './habits'
import { localDateKey } from './analysisEngine'

describe('habitudes (refonte étape 4)', () => {
  it('propose méditation, étirements, relaxation et lecture', () => {
    expect(SUGGESTED_HABITS.map((h) => h.label)).toEqual(['Méditation', 'Étirements', 'Relaxation', 'Lecture'])
  })

  it('fait une habitude libre à partir d’un nom, avec un identifiant stable', () => {
    expect(customHabit('  Marche du soir ')).toEqual({ id: 'custom:marche-du-soir', label: 'Marche du soir' })
    expect(customHabit('Été à vélo !').id).toBe('custom:ete-a-velo')
    expect(customHabit('   ')).toBeNull()
    expect(customHabit('x'.repeat(80)).label).toHaveLength(40)
  })

  it('range une réponse dans une entrée ordinaire, le bon jour, oui comme non', () => {
    const e = habitEntry(SUGGESTED_HABITS[0], '2026-11-15', true)
    expect(e).toMatchObject({ type: HABIT_TYPE, source: HABIT_SOURCE, payload: { habit: 'meditation', label: 'Méditation', done: true } })
    expect(localDateKey(e.at)).toBe('2026-11-15')
    expect(habitEntry(SUGGESTED_HABITS[0], '2026-11-15', false).payload.done).toBe(false)
  })

  it('donne à chaque habitude sa minute : l’import ne confond pas deux habitudes du même jour', () => {
    const all = [...SUGGESTED_HABITS, customHabit('Marche du soir')]
    const ats = all.map((h) => habitEntry(h, '2026-11-15', true).at)
    expect(new Set(ats).size).toBe(all.length)
    expect(habitEntry(all[4], '2026-11-15', false).at).toBe(ats[4])
  })

  it('lit la réponse du jour de chaque habitude (la plus récente saisie gagne)', () => {
    const [med, str] = SUGGESTED_HABITS
    const entries = [
      { id: 1, ...habitEntry(med, '2026-11-15', false), created_at: '2026-11-15T08:00:00Z' },
      { id: 2, ...habitEntry(med, '2026-11-15', true), created_at: '2026-11-15T09:00:00Z' },
      { id: 3, ...habitEntry(str, '2026-11-14', true), created_at: '2026-11-14T09:00:00Z' },
      { id: 4, type: 'food', at: habitEntry(med, '2026-11-15', true).at, payload: {} },
    ]
    const answers = habitAnswers(entries, '2026-11-15')
    expect(answers.get('meditation').id).toBe(2)
    expect(answers.has('stretching')).toBe(false)
  })
})
