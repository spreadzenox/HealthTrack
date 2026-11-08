import { describe, it, expect } from 'vitest'
import { niceAxis } from './niceAxis'

describe('niceAxis (POLISH-SIM-3b) : graduations rondes', () => {
  it('pas : 4 651 à 11 759 donne des milliers ronds', () => {
    const { lo, hi, ticks } = niceAxis(4651, 11759)
    expect(lo).toBeLessThanOrEqual(4651)
    expect(hi).toBeGreaterThanOrEqual(11759)
    expect(ticks[0]).toBe(lo)
    expect(ticks.at(-1)).toBe(hi)
    for (const t of ticks) expect(t % 1000).toBe(0)
    expect(ticks.length).toBeGreaterThanOrEqual(3)
    expect(ticks.length).toBeLessThanOrEqual(5)
  })

  it('heures : nuits de 6,3 à 8,7 h donnent des heures pleines régulières', () => {
    const { ticks } = niceAxis(6.3, 8.7)
    const steps = ticks.slice(1).map((t, i) => +(t - ticks[i]).toFixed(6))
    expect(new Set(steps).size).toBe(1)
    for (const t of ticks) expect(Number.isInteger(t * 2)).toBe(true)
    expect(ticks[0]).toBeLessThanOrEqual(6.3)
    expect(ticks.at(-1)).toBeGreaterThanOrEqual(8.7)
  })

  it('ne descend jamais sous zéro pour des valeurs positives, et tient une plage nulle', () => {
    expect(niceAxis(0, 12).lo).toBe(0)
    const flat = niceAxis(60, 60)
    expect(flat.lo).toBeLessThan(60)
    expect(flat.hi).toBeGreaterThan(60)
    expect(flat.ticks.length).toBeGreaterThanOrEqual(2)
  })
})

describe('niceAxis : bords', () => {
  it('plage infime (bruit de calcul) traitée comme plate, sans boucle', () => {
    const r = niceAxis(6.7, 6.7 + 1e-14)
    expect(r.ticks.length).toBeGreaterThanOrEqual(2)
    expect(r.ticks.length).toBeLessThanOrEqual(5)
  })
})
