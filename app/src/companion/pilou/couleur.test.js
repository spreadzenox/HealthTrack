import { describe, it, expect } from 'vitest'
import { deltaE2000, rgbToLab, hexToRgb, ecartMenthe } from './couleur.js'
import { PAL } from './forme.js'

describe('Pilou — écart de couleur CIEDE2000', () => {
  it('rend les valeurs de référence de Sharma, Wu et Dalal (2005)', () => {
    expect(deltaE2000([50, 2.6772, -79.7751], [50, 0, -82.7485])).toBeCloseTo(2.0425, 3)
    expect(deltaE2000([50, -1.3802, -84.2814], [50, 0, -82.7485])).toBeCloseTo(1.0, 3)
    expect(deltaE2000([50, 2.5, 0], [56, -27, -3])).toBeCloseTo(31.903, 2)
    expect(deltaE2000([2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514])).toBeCloseTo(0.9082, 3)
  })
  it('convertit le blanc et le noir sRGB', () => {
    const [L, a, b] = rgbToLab([255, 255, 255])
    expect(L).toBeCloseTo(100, 1)
    expect(Math.abs(a) + Math.abs(b)).toBeLessThan(0.05)
    expect(rgbToLab([0, 0, 0])[0]).toBeCloseTo(0, 5)
  })
  it('le menthe de la planche est à 0 de lui-même, le sauge en est loin', () => {
    expect(ecartMenthe(hexToRgb(PAL.menthe))).toBeCloseTo(0, 5)
    expect(ecartMenthe(hexToRgb('#9CB89A'))).toBeGreaterThan(6) // sauge : le défaut vu sur l'esquisse créature
  })
})
