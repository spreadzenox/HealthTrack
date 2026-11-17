import { describe, it, expect } from 'vitest'
import { isNight, fireflyAt, NIGHT_LABEL } from './night'

const at = (h, m = 0) => new Date(2026, 10, 16, h, m)

describe('la nuit', () => {
  it('de 22 h 30 à 5 h sans la scène ; la phase de la scène prime', () => {
    expect(isNight(at(22, 29))).toBe(false)
    expect(isNight(at(22, 30))).toBe(true)
    expect(isNight(at(3))).toBe(true)
    expect(isNight(at(5))).toBe(false)
    expect(isNight(at(14), 'nuit')).toBe(true)
    expect(isNight(at(23), 'soir')).toBe(false)
  })

  it('les lucioles flânent autour de l’îlot, chacune à son rythme, en fonction du temps seul', () => {
    const a = fireflyAt(0, 3, 10_000)
    expect(fireflyAt(0, 3, 10_000)).toEqual(a)
    expect(fireflyAt(1, 3, 10_000)).not.toEqual(a)
    for (let t = 0; t < 90_000; t += 1_500) {
      for (let i = 0; i < 5; i++) {
        const p = fireflyAt(i, 5, t)
        expect(Math.abs(p.x)).toBeLessThanOrEqual(1.55)
        expect(p.y).toBeGreaterThanOrEqual(0.45)
        expect(p.y).toBeLessThanOrEqual(1.55)
      }
    }
  })

  it('le texte de la nuit, sans reproche', () => {
    expect(NIGHT_LABEL('Pilou')).toBe('Pilou dort. Le reste peut attendre demain.')
  })
})
