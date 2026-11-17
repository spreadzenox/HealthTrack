import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
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

// MONDE-4b : passé la moitié de la croissance (g ≥ 0,5, 45 jours d'usage), l'arbuste du J1 devient un petit arbre.
describe('le petit arbre (MONDE-4b)', () => {
  const shapeOf = (gifts) => {
    const o = gifts.group.getObjectByName('arbuste')
    return { bush: o.getObjectByName('buisson').visible, tree: o.getObjectByName('arbre').visible }
  }

  it('growthAt donne l’arbre à 45 jours d’usage, pas à 44', () => {
    expect(growthAt(44).tree).toBe(false)
    expect(growthAt(45).tree).toBe(true)
  })

  it('remplace la forme de l’arbuste, posé avant ou après', () => {
    const before = createGifts()
    before.setItems(['arbuste'])
    expect(shapeOf(before)).toEqual({ bush: true, tree: false })
    before.setTree(growthAt(60).tree)
    expect(shapeOf(before)).toEqual({ bush: false, tree: true })
    expect(before.isTree).toBe(true)

    const after = createGifts()
    after.setTree(true)
    after.setItems(['arbuste'])
    expect(shapeOf(after)).toEqual({ bush: false, tree: true })
  })

  it('sans arbuste reçu, rien n’apparaît', () => {
    const gifts = createGifts()
    gifts.setTree(true)
    expect(gifts.group.getObjectByName('arbuste')).toBeUndefined()
  })

  it('le feuillage de l’arbre suit la saison comme celui de l’arbuste', () => {
    const gifts = createGifts()
    gifts.setItems(['arbuste'])
    gifts.setTree(true)
    gifts.setSeason('automne')
    const colors = new Set()
    gifts.group.getObjectByName('arbre').traverse((o) => {
      if (o.isMesh && o.name === 'feuillage') colors.add('#' + o.material.color.getHexString())
    })
    expect(colors.size).toBeGreaterThan(0)
    for (const c of colors) expect(['#d9702c', '#efa043']).toContain(c)
  })

  it('l’arbre adulte (90 jours) tient dans le cadre de 390 × 350, au-dessus et sur les côtés', () => {
    const gifts = createGifts()
    gifts.setItems(['arbuste'])
    gifts.setTree(true)
    gifts.setShrubScale(growthAt(90).shrubScale)
    gifts.update(0)
    const o = gifts.group.getObjectByName('arbuste')
    o.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(o.getObjectByName('arbre'))
    for (const p of [[box.min.x, box.max.y, box.min.z], [box.max.x, box.max.y, box.max.z], [box.min.x, box.min.y, box.max.z]]) {
      const s = projectPoint(p, 390, 350)
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeGreaterThanOrEqual(0)
    }
    // un petit arbre : plus haut que l'arbuste, sans dépasser deux fois sa hauteur
    const bush = new THREE.Box3().setFromObject(o.getObjectByName('buisson'))
    const h = box.max.y - box.min.y, hb = bush.max.y - bush.min.y
    expect(h).toBeGreaterThan(hb * 1.2)
    expect(h).toBeLessThan(hb * 2)
  })
})
