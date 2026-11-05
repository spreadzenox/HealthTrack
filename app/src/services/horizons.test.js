import { describe, it, expect } from 'vitest'
import { HORIZONS, gutLinkHorizon, groupByHorizon } from './horizons'

describe('horizons d’effet (ANALYSES-ONGLETS-3)', () => {
  it('trois horizons, dans l’ordre heures, jours, semaines', () => {
    expect(HORIZONS.map((h) => h.id)).toEqual(['hours', 'days', 'weeks'])
    for (const h of HORIZONS) {
      expect(h.title).toBeTruthy()
      expect(h.hint).toBeTruthy()
    }
  })

  it('une piste repas → ventre dans les 24 h est « dans les heures »', () => {
    expect(gutLinkHorizon({ kind: 'window', when: '0-4' })).toBe('hours')
    expect(gutLinkHorizon({ kind: 'window', when: '4-24' })).toBe('hours')
  })

  it('24–48 h, le jour même et la veille sont « sur quelques jours »', () => {
    expect(gutLinkHorizon({ kind: 'window', when: '24-48' })).toBe('days')
    expect(gutLinkHorizon({ kind: 'day', when: 'jour' })).toBe('days')
    expect(gutLinkHorizon({ kind: 'day', when: 'veille' })).toBe('days')
  })

  it('regroupe en gardant l’ordre des horizons et celui des pistes, sans groupe vide', () => {
    const links = [
      { id: 'a', h: 'days' },
      { id: 'b', h: 'hours' },
      { id: 'c', h: 'days' },
    ]
    const groups = groupByHorizon(links, (l) => l.h)
    expect(groups.map((g) => g.horizon.id)).toEqual(['hours', 'days'])
    expect(groups[1].items.map((l) => l.id)).toEqual(['a', 'c'])
    expect(groupByHorizon([], (l) => l.h)).toEqual([])
  })
})
