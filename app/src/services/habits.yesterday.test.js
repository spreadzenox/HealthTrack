import { describe, it, expect, beforeEach } from 'vitest'
import { habitEntry, yesterdayCatchUp, skipYesterday } from './habits'

const MED = { id: 'meditation', label: 'Méditation' }
const READ = { id: 'reading', label: 'Lecture' }
// Lundi 16/11/2026, 9 h 30 : hier = dimanche 15, avant-hier = samedi 14
const NOW = new Date(2026, 10, 16, 9, 30)
const at = (e, i) => ({ ...e, id: i, created_at: e.at })

describe('« Hier » dans Ma journée (REFONTE-7c-2 (3))', () => {
  beforeEach(() => localStorage.clear())

  it('propose les habitudes sans réponse hier quand la personne répondait avant-hier', () => {
    const entries = [at(habitEntry(MED, '2026-11-14', true), 1)]
    const c = yesterdayCatchUp(entries, [MED, READ], NOW)
    expect(c.dateKey).toBe('2026-11-15')
    expect(c.title).toBe('Hier, dimanche')
    expect(c.pending.map((h) => h.id)).toEqual(['meditation', 'reading'])
  })

  it('ne repropose pas une habitude déjà répondue hier, Non compris', () => {
    const entries = [at(habitEntry(MED, '2026-11-15', false), 1)]
    expect(yesterdayCatchUp(entries, [MED, READ], NOW).pending.map((h) => h.id)).toEqual(['reading'])
    const all = [...entries, at(habitEntry(READ, '2026-11-15', true), 2)]
    expect(yesterdayCatchUp(all, [MED, READ], NOW)).toBeNull()
  })

  it('après deux jours sans réponse, ou sans habitude suivie, rien', () => {
    const old = [at(habitEntry(MED, '2026-11-13', true), 1)]
    expect(yesterdayCatchUp(old, [MED], NOW)).toBeNull()
    expect(yesterdayCatchUp([], [MED], NOW)).toBeNull()
    expect(yesterdayCatchUp([at(habitEntry(MED, '2026-11-14', true), 1)], [], NOW)).toBeNull()
  })

  it('« Passer » range la carte pour ce jour-là seulement', () => {
    const entries = [at(habitEntry(MED, '2026-11-14', true), 1)]
    skipYesterday('2026-11-15')
    expect(yesterdayCatchUp(entries, [MED], NOW)).toBeNull()
    const tomorrow = new Date(2026, 10, 17, 9, 0)
    const next = [...entries, at(habitEntry(MED, '2026-11-15', true), 2)]
    expect(yesterdayCatchUp(next, [MED, READ], tomorrow).pending.map((h) => h.id)).toEqual(['meditation', 'reading'])
  })
})
