import { describe, it, expect } from 'vitest'
import { trendDomain, MIN_SPAN } from './trendsAxis'

describe('trendDomain (axe d’une unité dans Tendances)', () => {
  it('notes : toujours 1 à 5', () => {
    expect(trendDomain('/5', [2, 3])).toEqual({ lo: 1, hi: 5, ticks: [1, 3, 5] })
  })

  it('aucune valeur : 0 à 1', () => {
    expect(trendDomain('kg', [])).toEqual({ lo: 0, hi: 1, ticks: [0, 1] })
  })

  it('poids de 77,05 à 77,25 kg : l’axe couvre au moins 2 kg, centré (POLISH-SIM-165)', () => {
    const { lo, hi } = trendDomain('kg', [77.05, 77.25, 77.1])
    expect(hi - lo).toBeGreaterThanOrEqual(MIN_SPAN.kg)
    expect(lo).toBeLessThanOrEqual(77.05)
    expect(hi).toBeGreaterThanOrEqual(77.25)
    expect(Math.abs((lo + hi) / 2 - 77.15)).toBeLessThan(1)
  })

  it('une vraie variation garde son échelle', () => {
    const { lo, hi } = trendDomain('kg', [70, 80])
    expect(lo).toBeLessThanOrEqual(70)
    expect(hi).toBeGreaterThanOrEqual(80)
    expect(hi - lo).toBeLessThanOrEqual(20)
  })

  it('chaque unité suivie a un écart minimal', () => {
    for (const u of ['kg', 'bpm', 'ms', 'h', 'pas']) {
      const { lo, hi } = trendDomain(u, [10, 10.01])
      expect(hi - lo).toBeGreaterThanOrEqual(MIN_SPAN[u])
    }
  })

  it('jamais sous zéro pour des valeurs positives', () => {
    expect(trendDomain('h', [0.2, 0.3]).lo).toBeGreaterThanOrEqual(0)
  })
})
