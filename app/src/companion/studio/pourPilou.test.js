import { describe, it, expect, beforeAll } from 'vitest'
import * as THREE from 'three'
import { equiperPilou } from './pourPilou'
import { normaliser } from './traits'

const pilouModules = import.meta.glob('../pilou/index.js', { eager: true })
const createPilou = pilouModules['../pilou/index.js']?.createPilou

beforeAll(() => {
  const noop = () => {}
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: noop }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : noop), set: (t, k, v) => { t[k] = v; return true } })
  HTMLCanvasElement.prototype.getContext = () => ctx
})

const lea = normaliser({ cheveux: { longueur: 'mi_longs', coiffure: 'raie_cote', couleur: 'chatain' }, yeux: { couleur: 'noisette' }, lunettes: { type: 'rondes', couleur: 'ecaille' }, couvre_chef: 'bonnet' }).fiche

describe('traits portés par un Pilou qui expose son kit', () => {
  function fauxPilou() {
    const body = new THREE.Group()
    const vus = []
    return {
      kit: { body, vinyl: (hex, o) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: o.rough }) },
      setTraits: (f) => vus.push(f),
      update: () => 'etat',
      dispose: () => vus.push('dispose'),
      stats: () => ({ triangles: 100, drawCalls: 3 }),
      vus,
    }
  }
  it('pose les pièces en vinyle satiné, garde ce que faisait Pilou, et les retire', () => {
    const p = equiperPilou(THREE, fauxPilou())
    p.setTraits(lea)
    expect(p.vus).toEqual([lea])
    const s = p.stats()
    expect(Object.keys(s.traits)).toEqual(expect.arrayContaining(['cheveux', 'lunettes', 'couvre']))
    expect(s.triangles).toBeGreaterThan(100)
    expect(p.update(0)).toBe('etat')
    let mat = null
    p.kit.body.traverse((o) => { if (o.isMesh && !mat && o.material.isMeshPhysicalMaterial) mat = o.material })
    expect(mat.roughness).toBe(0.6)
    p.setTraits(null)
    expect(p.stats().traits).toEqual({})
    p.dispose()
    expect(p.vus.at(-1)).toBe('dispose')
    expect(p.kit.body.children).toHaveLength(0)
  })
  it('ne touche pas un Pilou sans kit', () => {
    const p = { setTraits: () => {} }
    expect(equiperPilou(THREE, p)).toBe(p)
  })
})

describe.runIf(!!createPilou)('sur le Pilou figurine du lot PILOU', () => {
  it('les pièces se posent sur son corps, sous le budget', () => {
    const p = equiperPilou(THREE, createPilou(THREE, { traits: lea }))
    p.update(0)
    const s = p.stats()
    for (const n of Object.values(s.traits)) expect(n).toBeLessThanOrEqual(2000)
    expect(s.traits.cheveux).toBeGreaterThan(0)
    const b = new THREE.Box3().setFromObject(p.traits3d.support)
    expect(b.max.y).toBeGreaterThan(1.3) // les cheveux et le bonnet sont sur la tête
    p.dispose()
  })
})
