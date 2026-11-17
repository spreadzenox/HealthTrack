import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { createIsland, SEASON_COLORS } from './island'
import { createGifts, SHRUB_LEAVES } from './gifts'

const SEASONS = ['printemps-ete', 'automne', 'hiver', 'fin-hiver']

function meanTopColor(island) {
  const col = island.group.getObjectByName('gazon').geometry.attributes.color
  const c = new THREE.Color(0, 0, 0)
  for (let i = 0; i < col.count; i++) c.r += col.getX(i), c.g += col.getY(i), c.b += col.getZ(i)
  return c.multiplyScalar(1 / col.count)
}
function tuftColors(island) {
  const herbe = island.group.getObjectByName('herbe')
  const out = []
  const c = new THREE.Color()
  for (let i = 0; i < herbe.count; i++) {
    herbe.getColorAt(i, c)
    out.push(c.getHexString())
  }
  return out
}

describe("la saison sur l'îlot (SPEC île § 8)", () => {
  it('par défaut, l’îlot garde son herbe de printemps-été, au pixel près', () => {
    const a = createIsland({ tufts: 80, seed: 5 })
    const b = createIsland({ tufts: 80, seed: 5, season: 'printemps-ete' })
    expect(a.season).toBe('printemps-ete')
    expect(meanTopColor(a).getHexString()).toBe(meanTopColor(b).getHexString())
    expect(tuftColors(a)).toEqual(tuftColors(b))
  })

  it('a une palette pour chacune des quatre saisons', () => {
    for (const s of SEASONS) {
      expect(SEASON_COLORS[s].top).toHaveLength(3)
      expect(SEASON_COLORS[s].tufts.length).toBeGreaterThanOrEqual(4)
      expect(SHRUB_LEAVES[s]).toHaveLength(2)
    }
  })

  it('automne : herbe dorée (plus de rouge que de vert relatif au printemps)', () => {
    const ete = meanTopColor(createIsland({ tufts: 40 }))
    const automne = meanTopColor(createIsland({ tufts: 40, season: 'automne' }))
    expect(automne.r / automne.g).toBeGreaterThan(ete.r / ete.g + 0.2)
  })

  it('hiver : calotte de neige claire sur le dessus', () => {
    const hiver = meanTopColor(createIsland({ tufts: 40, season: 'hiver' }))
    expect(Math.min(hiver.r, hiver.g, hiver.b)).toBeGreaterThan(0.7)
  })

  it('setSeason recolore le dessus et les touffes sans reconstruire l’îlot, et revient à l’identique', () => {
    const isl = createIsland({ tufts: 80, seed: 5 })
    const herbe = isl.group.getObjectByName('herbe')
    const before = { top: meanTopColor(isl).getHexString(), tufts: tuftColors(isl) }
    isl.setSeason('automne')
    expect(isl.season).toBe('automne')
    expect(isl.group.getObjectByName('herbe')).toBe(herbe)
    expect(meanTopColor(isl).getHexString()).not.toBe(before.top)
    expect(tuftColors(isl)).not.toEqual(before.tufts)
    isl.setSeason('printemps-ete')
    expect(meanTopColor(isl).getHexString()).toBe(before.top)
    expect(tuftColors(isl)).toEqual(before.tufts)
  })

  it('une saison inconnue est ignorée', () => {
    const isl = createIsland({ tufts: 20, season: 'mousson' })
    expect(isl.season).toBe('printemps-ete')
    isl.setSeason('automne')
    isl.setSeason(null)
    expect(isl.season).toBe('automne')
  })

  it("le feuillage de l'arbuste suit la saison, posé avant ou après", () => {
    const leaves = (g) => {
      const out = new Set()
      g.group.getObjectByName('arbuste')?.traverse((o) => {
        if (o.isMesh && o.geometry.type === 'IcosahedronGeometry') out.add(o.material.color.getHexString())
      })
      return [...out].sort()
    }
    const g = createGifts()
    g.setSeason('automne')
    g.setItems(['arbuste'])
    expect(leaves(g)).toEqual(SHRUB_LEAVES.automne.map((h) => h.slice(1).toLowerCase()).sort())
    g.setSeason('hiver')
    expect(leaves(g)).toEqual(SHRUB_LEAVES.hiver.map((h) => h.slice(1).toLowerCase()).sort())
  })
})
