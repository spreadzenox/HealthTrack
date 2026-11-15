import { describe, it, expect } from 'vitest'
import { actSections, fodmapGroupsInPistes, reintroLine } from './act'
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
    expect(s.proposed).toEqual([expect.objectContaining({ id: 'fodmap-lactose', title: 'Réintroduction : le lactose', to: '/reintroduction' })])
  })

  it('un test en cours passe dans « En cours » et n’est plus proposé', () => {
    const payload = startChallenge({ group: 'lactose', food: 'milk', plan: defaultPlan('lactose', 'milk') }, new Date(2026, 10, 6, 9))
    const challenges = [{ type: 'fodmap_challenge', at: payload.startedAt, payload }]
    const s = actSections({ challenges, pistes: { gut: ['Lactose → digestion'] }, now: NOW })
    expect(s.current).toHaveLength(1)
    expect(s.current[0].title).toBe('Réintroduction : le lactose')
    expect(s.proposed).toEqual([])
  })

  describe('REFONTE-6e : la ligne « Réintroduction guidée » du détail du confort digestif', () => {
    it('rien à dire tant qu’aucun test n’existe et qu’aucune analyse ne cite un groupe (leçon 17)', () => {
      expect(reintroLine(actSections({ now: NOW }))).toBeNull()
      expect(reintroLine(actSections({ pistes: { gut: ['Café → digestion'] }, now: NOW }))).toBeNull()
    })

    it('un groupe cité par une analyse digestive : la ligne le nomme', () => {
      expect(reintroLine(actSections({ pistes: { gut: ['Lactose → digestion', 'Fructanes → digestion'] }, now: NOW })))
        .toBe('À tester d’après vos analyses : les fructanes, le lactose')
    })

    it('un test en cours passe avant tout le reste', () => {
      const payload = startChallenge({ group: 'lactose', food: 'milk', plan: defaultPlan('lactose', 'milk') }, new Date(2026, 10, 6, 9))
      const challenges = [{ type: 'fodmap_challenge', at: payload.startedAt, payload }]
      expect(reintroLine(actSections({ challenges, pistes: { gut: ['Fructanes → digestion'] }, now: NOW }))).toBe('Test en cours : le lactose')
    })

    it('des groupes déjà testés, rien d’autre : leur nombre', () => {
      expect(reintroLine({ current: [], proposed: [], done: [{ name: 'le lactose' }] })).toBe('1 groupe testé')
      expect(reintroLine({ current: [], proposed: [], done: [{ name: 'le lactose' }, { name: 'les GOS' }] })).toBe('2 groupes testés')
    })
  })
})
