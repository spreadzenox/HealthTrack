import { describe, it, expect } from 'vitest'
import { createIsland, ISLAND, POND, POND_WATER } from './island'
import { createNeighbour, neighbourArrival, NEIGHBOUR } from './neighbour'
import { GIFT_PLACES } from './gifts'
import { DAY_SLOTS } from '../bubbles/flowers'
import { orbitWorld, BUBBLE_RADIUS } from '../bubbles/bubbles'
import { projectPoint } from './camera'
import { growthAt } from '../world/growth.js'

// MONDE-4 : l'îlot voisin (mois 1) et la mare (mois 3), SPEC île § 8.
describe('la mare du 3e mois', () => {
  it('apparaît à 90 jours d’usage, pas avant', () => {
    const isl = createIsland({ quality: 'moyen', tufts: 300 })
    expect(isl.hasPond).toBe(false)
    isl.setGrowth(growthAt(89))
    expect(isl.hasPond).toBe(false)
    isl.setGrowth(growthAt(90))
    expect(isl.hasPond).toBe(true)
    expect(isl.group.getObjectByName('mare').visible).toBe(true)
  })

  it('gèle l’hiver et reprend sa couleur au printemps', () => {
    const isl = createIsland({ quality: 'moyen', tufts: 300, season: 'automne' })
    const water = isl.group.getObjectByName('eau')
    expect('#' + water.material.color.getHexString()).toBe(POND_WATER.automne.toLowerCase())
    isl.setSeason('hiver')
    expect('#' + water.material.color.getHexString()).toBe(POND_WATER.hiver.toLowerCase())
    isl.setSeason('printemps-ete')
    expect('#' + water.material.color.getHexString()).toBe(POND_WATER['printemps-ete'].toLowerCase())
  })

  it('ne touche ni Pilou, ni l’arbuste, ni la lanterne, ni les galets, ni les fleurs du jour', () => {
    const a = (POND.angleDeg * Math.PI) / 180
    const c = [Math.sin(a) * POND.r, Math.cos(a) * POND.r]
    const reach = POND.rx * 1.18 // bord de sable compris, en rayon du plateau
    expect(Math.hypot(...c) - reach).toBeGreaterThan(0.42 / ISLAND.R) // place de Pilou
    expect(Math.hypot(...c) + reach).toBeLessThan(1) // dans le plateau, avant la prairie du bord
    for (const [x, z] of Object.values(GIFT_PLACES)) expect(Math.hypot(x * 0.92 - c[0], z * 0.92 - c[1])).toBeGreaterThan(reach + 0.12)
    for (const s of DAY_SLOTS) {
      const fa = (s.angle * Math.PI) / 180
      expect(Math.hypot(Math.sin(fa) * s.r - c[0], Math.cos(fa) * s.r - c[1])).toBeGreaterThan(reach + 0.05)
    }
  })
})

describe('l’îlot voisin du 1er mois', () => {
  it('arrive en 900 ms avec un petit dépassement, d’un coup en mouvements réduits ou à l’ouverture', () => {
    expect(neighbourArrival(null)).toBe(1)
    expect(neighbourArrival(0)).toBe(0)
    expect(neighbourArrival(NEIGHBOUR.appearMs)).toBe(1)
    const samples = Array.from({ length: 18 }, (_, i) => neighbourArrival(i * 50))
    expect(Math.max(...samples)).toBeGreaterThan(1)
    expect(neighbourArrival(300, { reducedMotion: true })).toBe(1)
  })

  it('reste caché avant 30 jours, puis reste là ; suit la saison', () => {
    const n = createNeighbour({ quality: 'haut', season: 'automne' })
    expect(n.group.visible).toBe(false)
    expect(n.update(0)).toBe(false)
    n.show(true)
    expect(n.group.visible).toBe(true)
    expect(n.update(1000)).toBe(true)
    expect(n.group.scale.x).toBeLessThan(0.01)
    n.update(1450)
    n.update(1000 + NEIGHBOUR.appearMs)
    expect(n.group.scale.x).toBeCloseTo(NEIGHBOUR.scale, 5)
    expect(n.update(5000)).toBe(false)
    n.setSeason('hiver')
    expect(n.group.getObjectByName('ombre')).toBeUndefined()
    n.dispose()
  })

  it('flotte à droite dans le cadre de 390 × 350, sous l’orbite des bulles', () => {
    const [x, y, z] = NEIGHBOUR.position
    const r = ISLAND.lip * NEIGHBOUR.scale
    const pts = [[x + r, y, z], [x - r, y, z], [x, y + 0.05, z + r], [x, y - 1.38 * NEIGHBOUR.scale, z]]
    for (const p of pts) {
      const s = projectPoint(p, 390, 350)
      expect(s.x).toBeGreaterThan(195)
      expect(s.x).toBeLessThanOrEqual(390)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeLessThanOrEqual(350)
    }
    // aucune bulle (orbite de 1 à 8 bulles, tous déphasages) ne passe sur l'îlot voisin
    const top = projectPoint([x, y + 0.05, z], 390, 350)
    const centre = projectPoint([x, y - 0.12, z], 390, 350)
    const half = projectPoint([x + r, y, z], 390, 350).x - centre.x
    for (let n = 1; n <= 8; n++) {
      for (let k = 0; k < 24; k++) {
        for (const b of orbitWorld(n, (k / 24) * Math.PI * 2)) {
          const s = projectPoint([b.x, b.y, b.z], 390, 350)
          const br = (projectPoint([b.x + BUBBLE_RADIUS * b.size, b.y, b.z], 390, 350).x - s.x)
          const dx = Math.max(0, Math.abs(s.x - centre.x) - half)
          const dy = Math.max(0, top.y - s.y)
          expect(Math.hypot(dx, dy)).toBeGreaterThan(br * 0.6)
        }
      }
    }
  })
})
