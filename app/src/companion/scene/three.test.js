import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { createIsland, ISLAND } from './island'
import { createFlowerBed, THEME_COLORS } from './flowers'
import { createPlaceholderPilou } from './placeholderPilou'
import { EXPRESSIONS, THEMES } from '../bus'

function triangles(obj) {
  let n = 0
  obj.traverse((o) => {
    if (o.isMesh && o.visible) {
      const g = o.geometry
      n += ((g.index ? g.index.count : g.attributes.position.count) / 3) * (o.isInstancedMesh ? o.count : 1)
    }
  })
  return Math.round(n)
}

describe('l’île (brief § 7.6)', () => {
  it('tient le budget : ≤ 12 000 triangles au palier haut, ≤ 600 touffes', () => {
    const haut = createIsland({ quality: 'haut', tufts: 600 })
    expect(triangles(haut.group)).toBeLessThanOrEqual(12000)
    const herbe = haut.group.getObjectByName('herbe')
    expect(herbe.count).toBeLessThanOrEqual(600)
    const moyen = createIsland({ quality: 'moyen', tufts: 300 })
    expect(moyen.group.getObjectByName('herbe').count).toBeLessThanOrEqual(300)
    expect(triangles(moyen.group)).toBeLessThan(triangles(haut.group))
  })

  it('a une ombre de contact précalculée et aucune touffe sous les pieds de Pilou', () => {
    const isl = createIsland({ quality: 'haut', tufts: 600 })
    expect(isl.group.getObjectByName('ombre')).toBeTruthy()
    const herbe = isl.group.getObjectByName('herbe')
    const m = new THREE.Matrix4(), p = new THREE.Vector3()
    for (let i = 0; i < herbe.count; i++) {
      herbe.getMatrixAt(i, m)
      p.setFromMatrixPosition(m)
      expect(Math.hypot(p.x, p.z)).toBeGreaterThan(0.4)
      expect(Math.hypot(p.x, p.z)).toBeLessThan(ISLAND.R)
    }
  })

  it('est déterministe (même graine, même île)', () => {
    const a = createIsland({ tufts: 100, seed: 5 }).group.getObjectByName('herbe')
    const b = createIsland({ tufts: 100, seed: 5 }).group.getObjectByName('herbe')
    expect(Array.from(a.instanceMatrix.array)).toEqual(Array.from(b.instanceMatrix.array))
  })
})

describe('les fleurs', () => {
  it('une couleur par thème', () => {
    for (const t of THEMES) expect(THEME_COLORS[t]).toMatch(/^#[0-9A-F]{6}$/i)
  })

  it('pousse une fois par identifiant, et « flowers:set » remplace tout', () => {
    const bed = createFlowerBed()
    bed.grow({ id: 'a', theme: 'peche', angleDeg: -74, radius: 0.9 }, 0)
    bed.grow({ id: 'a', theme: 'peche', angleDeg: -74, radius: 0.9 }, 10)
    expect(bed.size).toBe(1)
    expect(bed.update(200)).toBe(true) // elle pousse encore
    expect(bed.update(5000)).toBe(false)
    bed.set([{ id: 'x', theme: 'miel', angleDeg: 30 }, { id: 'y', theme: 'lilas', angleDeg: 58 }])
    expect(bed.size).toBe(2)
  })
})

describe('le Pilou simple (même API que le lot PILOU, CONTRAT § 3)', () => {
  const pilou = createPlaceholderPilou(THREE, { quality: 'haut' })

  it('expose l’API du contrat', () => {
    for (const k of ['update', 'setExpression', 'play', 'setMood', 'lookAt', 'react', 'jump', 'setReducedMotion', 'setTraits', 'setAccessory', 'hitTest', 'stats', 'dispose']) {
      expect(typeof pilou[k]).toBe('function')
    }
    expect(pilou.object3d.isObject3D).toBe(true)
    expect(Object.keys(pilou.anchors)).toEqual(['head', 'belly', 'handLeft', 'handRight', 'antennaTip'])
  })

  it('tient le budget (≤ 10 000 triangles) et mesure ≈ 1,24 de haut, antenne comprise', () => {
    expect(pilou.stats().triangles).toBeLessThanOrEqual(10000)
    pilou.update(0)
    const box = new THREE.Box3()
    pilou.object3d.updateMatrixWorld(true)
    pilou.object3d.traverse((o) => { if (o.isMesh) box.expandByObject(o) })
    expect(box.max.y).toBeGreaterThan(1.2)
    expect(box.max.y).toBeLessThan(1.45)
    expect(box.min.y).toBeGreaterThanOrEqual(-0.01)
  })

  it('porte la palette de la planche (menthe #78D8B4)', () => {
    const corps = pilou.object3d.getObjectByName('corps')
    const col = corps.geometry.attributes.color
    const menthe = new THREE.Color('#78D8B4')
    let found = false
    for (let i = 0; i < col.count && !found; i++) found = Math.abs(col.getX(i) - menthe.r) < 1e-3 && Math.abs(col.getY(i) - menthe.g) < 1e-3
    expect(found).toBe(true)
  })

  it('animation = fonction du temps : même t, même pose', () => {
    const p = createPlaceholderPilou(THREE, { quality: 'moyen' })
    p.update(4321)
    const a = p.object3d.children[0].scale.toArray()
    p.update(100)
    p.update(4321)
    expect(p.object3d.children[0].scale.toArray()).toEqual(a)
  })

  it('accepte les 12 expressions et les séquences, jamais triste', () => {
    const p = createPlaceholderPilou(THREE, { quality: 'moyen' })
    for (const e of EXPRESSIONS) {
      p.setExpression(e)
      p.update(1000)
      expect(p.expression).toBe(e)
    }
    p.setExpression('content')
    p.update(0)
    p.play('surpris')
    p.update(500)
    expect(p.expression).toBe('surpris')
    p.update(1600)
    expect(p.expression).toBe('content')
  })

  it('en mouvements réduits, ne flotte ni ne saute, mais cligne toujours', () => {
    const p = createPlaceholderPilou(THREE, { quality: 'moyen', reducedMotion: true })
    p.update(0)
    p.jump({ side: 'left' })
    p.update(400)
    expect(p.object3d.position.y).toBe(0)
    // un clignement à graine se produit dans les 10 premières secondes
    let closed = false
    for (let t = 0; t < 10000 && !closed; t += 10) {
      p.update(t)
      const eye = p.object3d.children[0].children.find((c) => c.isGroup && c.children.length >= 3)
      if (eye && eye.scale.y < 0.5) closed = true
    }
    expect(closed).toBe(true)
  })
})

describe('les cadeaux de la première semaine (SPEC île § 7)', async () => {
  const { createGifts, giftArrival, GIFT_ITEMS } = await import('./gifts')
  it('pose chaque cadeau une fois, l’écharpe sur Pilou', () => {
    const p = createPlaceholderPilou(THREE, { quality: 'moyen' })
    const g = createGifts({ pilou: () => p })
    g.setItems(['arbuste', 'lanterne'])
    g.place('echarpe', 0)
    g.place('echarpe', 10)
    expect(g.items).toEqual(['arbuste', 'lanterne', 'echarpe'])
    expect(g.group.getObjectByName('arbuste')).toBeTruthy()
    let scarfVisible = false
    p.object3d.traverse((o) => { if (o.isGroup && o.visible && o.children.length === 4 && o.children[3].geometry?.type === 'BoxGeometry') scarfVisible = true })
    expect(scarfVisible).toBe(true)
    for (const it of GIFT_ITEMS) g.place(it, 0)
    expect(g.items).toHaveLength(7)
    expect(g.update(100)).toBe(true)
    expect(g.update(10000)).toBe(false)
  })

  it('arrivées : fonctions du temps, entières à la fin, fondu en mouvements réduits', () => {
    for (const it of GIFT_ITEMS) {
      expect(giftArrival(it, 5000).k).toBe(1)
      expect(giftArrival(it, null).opacity).toBe(1)
    }
    expect(giftArrival('lanterne', 0).y).toBeGreaterThan(1)
    expect(giftArrival('arbuste', 0).k).toBe(0)
    expect(giftArrival('arbuste', 100, { reducedMotion: true })).toEqual({ k: 1, y: 0, opacity: 0.5 })
  })

  it('la lanterne s’allume le soir', () => {
    const g = createGifts()
    g.setItems(['lanterne'])
    g.update(0)
    const mat = g.group.getObjectByName('lanterne').userData.lightMat
    const day = mat.emissiveIntensity
    g.setEvening(1)
    g.update(0)
    expect(mat.emissiveIntensity).toBeGreaterThan(day + 1)
  })
})
