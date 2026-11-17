import { describe, it, expect } from 'vitest'
import { createIsland, ISLAND } from './island'
import { createGifts } from './gifts'
import { CAMERA, projectPoint } from './camera'
import { growthAt } from '../world/growth.js'

// MONDE-3 : l'îlot grandit avec les jours d'usage (SPEC île § 8), la caméra et Pilou ne bougent pas.
describe("la croissance de l'îlot (MONDE-3)", () => {
  it('élargit et rehausse l’îlot selon growthAt, sans jamais le réduire', () => {
    const isl = createIsland({ quality: 'moyen', tufts: 300 })
    expect(isl.growthScale).toEqual({ xz: 1, y: 1 })
    isl.setGrowth(growthAt(90))
    expect(isl.growthScale.xz).toBeCloseTo(1.3, 3)
    expect(isl.growthScale.y).toBeCloseTo(1.12, 3)
    isl.setGrowth(growthAt(45))
    expect(isl.growthScale.xz).toBeGreaterThan(1)
    expect(isl.growthScale.xz).toBeLessThan(1.3)
    isl.setGrowth({ islandScaleXZ: 0.5, islandScaleY: 0.5 })
    expect(isl.growthScale).toEqual({ xz: 1, y: 1 })
    isl.setGrowth(null)
    expect(isl.growthScale).toEqual({ xz: 1, y: 1 })
  })

  it('garde le dessus à la même hauteur : Pilou reste posé, à la même taille', () => {
    const isl = createIsland({ quality: 'moyen', tufts: 300 })
    isl.setGrowth(growthAt(90))
    // le dessus est à y ≈ 0,018 avant mise à l'échelle : × 1,12 reste sous 0,021
    expect(0.018 * isl.growthScale.y).toBeLessThan(0.021)
    expect(CAMERA.position).toEqual([0, 1.25, 7.4])
  })

  it('fait grandir l’arbuste du J1 (× 1,45 à 90 jours), posé avant ou après', () => {
    const gifts = createGifts()
    gifts.setItems(['arbuste'])
    gifts.update(0)
    const before = gifts.group.getObjectByName('arbuste').scale.x
    gifts.setShrubScale(growthAt(90).shrubScale)
    gifts.update(0)
    expect(gifts.group.getObjectByName('arbuste').scale.x).toBeCloseTo(before * 1.45, 3)
    gifts.setShrubScale(0.2)
    expect(gifts.shrubScale).toBe(1)
  })

  it('l’îlot adulte tient encore dans le cadre de 390 × 350 avec la même caméra', () => {
    const g = growthAt(90)
    const R = ISLAND.lip * g.islandScaleXZ
    const bottom = -1.12 * g.islandScaleY
    for (const p of [[R, 0, 0], [-R, 0, 0], [0, 0, R], [0, bottom, 0.4]]) {
      const s = projectPoint(p, 390, 350)
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.x).toBeLessThanOrEqual(390)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeLessThanOrEqual(350)
    }
  })
})
