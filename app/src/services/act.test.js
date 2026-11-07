import { describe, it, expect } from 'vitest'
import { actSections, fodmapGroupsInPistes } from './act'
import { startChallenge, defaultPlan } from './fodmapChallenge'

const NOW = new Date(2026, 10, 7, 20)

describe('Agir (ORG-1, ORG-1b)', () => {
  it('rien du tout au départ : trois listes vides', () => {
    expect(actSections({ now: NOW })).toEqual({ current: [], proposed: [], done: [] })
  })

  it('propose un groupe FODMAP seulement quand une piste digestive le cite', () => {
    expect(fodmapGroupsInPistes(['Fructanes → digestion']).map((g) => g.id)).toEqual(['fructans'])
    expect(fodmapGroupsInPistes(['Café → digestion'])).toEqual([])
    const s = actSections({ pistes: { gut: ['Lactose → digestion'] }, now: NOW })
    expect(s.proposed).toEqual([expect.objectContaining({ id: 'fodmap-lactose', title: 'Tester le lactose', to: '/reintroduction' })])
  })

  it('un test en cours passe dans « En cours » et n’est plus proposé', () => {
    const payload = startChallenge({ group: 'lactose', food: 'milk', plan: defaultPlan('lactose', 'milk') }, new Date(2026, 10, 6, 9))
    const challenges = [{ type: 'fodmap_challenge', at: payload.startedAt, payload }]
    const s = actSections({ challenges, pistes: { gut: ['Lactose → digestion'] }, now: NOW })
    expect(s.current).toHaveLength(1)
    expect(s.current[0].title).toBe('Test FODMAP : Lactose')
    expect(s.proposed).toEqual([])
  })
})
