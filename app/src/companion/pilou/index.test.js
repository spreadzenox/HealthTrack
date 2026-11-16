import { describe, it, expect, vi, beforeAll } from 'vitest'
import * as THREE from 'three'
import { createPilou, ECHELLE, irisDeFiche } from './index.js'
import { DOUZE } from './animateur.js'

// jsdom n'a ni WebGL ni toile 2D : on construit tout (géométries, matières), sans rendu
beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

function cam() {
  const c = new THREE.PerspectiveCamera(24, 1, 0.1, 50)
  c.position.set(0, 0.9, 5)
  c.lookAt(0, 0.75, 0)
  c.updateMatrixWorld()
  return c
}

describe('Pilou — module 3D (contrat § 3)', () => {
  it('rend un groupe aux pieds en y = 0, de 1,24 de haut sans l\'antenne', () => {
    const p = createPilou(THREE)
    p.update(0)
    const b = new THREE.Box3().setFromObject(p.kit.body)
    expect(b.min.y * ECHELLE).toBeGreaterThan(0.03)
    expect(p.object3d.scale.x).toBeCloseTo(1.24 / 1.44)
    const all = new THREE.Box3().setFromObject(p.object3d)
    expect(all.min.y).toBeGreaterThanOrEqual(-0.05) // pieds plats, un peu enfoncés dans l'herbe
    expect(all.max.y / 1.24).toBeGreaterThan(1.15)
    expect(all.max.y / 1.24).toBeLessThan(1.35)
    p.dispose()
  })

  it('tient le budget : ≤ 10 000 triangles au palier haut, moins au palier moyen', () => {
    const h = createPilou(THREE, { quality: 'haut' })
    const m = createPilou(THREE, { quality: 'moyen' })
    h.update(0); m.update(0)
    expect(h.stats().triangles).toBeLessThanOrEqual(10000)
    expect(m.stats().triangles).toBeLessThan(h.stats().triangles * 0.75)
    expect(h.stats().drawCalls).toBeLessThanOrEqual(40)
  })

  it('update(t) deux fois de suite donne la même pose', () => {
    const p = createPilou(THREE, { seed: 3 })
    for (let t = 0; t < 2000; t += 33) p.update(t)
    p.react('doubletap')
    p.update(2100)
    const a = p.object3d.children[0].children[0].matrixWorld.clone()
    p.update(2100)
    expect(p.object3d.children[0].children[0].matrixWorld.equals(a)).toBe(true)
  })

  it('accepte les 12 expressions, les séquences et rend toujours un texte', () => {
    const p = createPilou(THREE, { nom: 'Mochi' })
    let t = 0
    for (const e of [...DOUZE, 'reveil', 'humeur']) {
      p.setExpression(e)
      t += 500
      const s = p.update(t, 16)
      expect(s.texte, e).toMatch(/\S/)
    }
    const fin = vi.fn()
    p.play('fier', { onEnd: fin })
    p.update(t + 500)
    expect(fin).not.toHaveBeenCalled()
    p.update(t + 1100)
    expect(fin).toHaveBeenCalledOnce()
    expect(p.etat().texte).toMatch(/Mochi/)
  })

  it('l\'humeur ne redescend pas, les gestes et le saut répondent', () => {
    const p = createPilou(THREE)
    p.update(0)
    p.setMood(0.8)
    p.update(1500)
    p.setMood(0.1)
    p.update(3000)
    expect(p.etat().texte).toBe('Pilou est content')
    expect(p.react('tap')).toEqual([{ style: 'LIGHT', at: 0 }])
    expect(p.react('swipe', { dir: -1 })).toEqual([])
    p.jump({ side: 'left' })
    expect(() => p.update(3100)).not.toThrow()
  })

  it('regarde la caméra, un point, ou librement ; touché ou non', () => {
    const p = createPilou(THREE)
    const c = cam()
    p.update(0, 16, c)
    p.lookAt('camera')
    p.update(800, 16, c)
    p.lookAt({ x: 1, y: 1, z: 0.5 })
    p.update(1600, 16, c)
    p.lookAt(null)
    p.update(2400, 16, c)
    p.object3d.updateMatrixWorld(true)
    expect(p.hitTest(0, -0.05, c)).toBe(true)
    expect(p.hitTest(0.95, 0.95, c)).toBe(false)
    expect(['ventre', 'corps']).toContain(p.hitZone(0, -0.25, c))
  })

  it('porte la couleur des yeux de la fiche, et ses accessoires', () => {
    expect(irisDeFiche({ yeux: { couleur: 'bleu' } })).toBe('#3A68AA')
    expect(irisDeFiche(null)).toBe('#6E4A2C')
    const p = createPilou(THREE, { traits: { yeux: { couleur: 'vert' } } })
    p.update(0)
    const avant = p.stats().triangles
    p.setAccessory('echarpe', true)
    p.setAccessory('montre', false)
    p.update(33)
    expect(p.stats().triangles).not.toBe(avant)
    p.setTraits(null)
    expect(p.traits).toBe(null)
    for (const k of ['head', 'belly', 'handLeft', 'handRight', 'antennaTip']) expect(p.anchors[k].isObject3D).toBe(true)
  })

  it('mouvements réduits : il ne quitte pas le sol', () => {
    const p = createPilou(THREE, { reducedMotion: true })
    p.update(0)
    p.react('doubletap')
    let maxY = 0
    for (let t = 0; t < 1500; t += 33) { p.update(t); maxY = Math.max(maxY, p.kit.body.position.y) }
    expect(maxY).toBe(0)
  })
})
