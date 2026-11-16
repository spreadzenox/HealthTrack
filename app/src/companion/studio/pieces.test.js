import { describe, it, expect, beforeAll } from 'vitest'
import * as THREE from 'three'
import { creerPieces } from './pieces'
import { tirer, normaliser, COUVRE_CHEFS, SCHEMA } from './traits'
import { FACE0 } from './profil'

// jsdom n'a pas de toile 2D : un contexte qui ne dessine rien suffit pour construire les textures
beforeAll(() => {
  const noop = () => {}
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: noop }) : noop), set: (t, k, v) => { t[k] = v; return true } })
  HTMLCanvasElement.prototype.getContext = () => ctx
})

function monter(fiche) {
  const body = new THREE.Group()
  const p = creerPieces({ THREE, body })
  p.set(fiche)
  p.update({ f: { ...FACE0 } })
  return { p, body }
}
function sansNaN(obj) {
  let ok = true
  obj.traverse((m) => {
    if (!m.isMesh) return
    const a = m.geometry.attributes.position.array
    for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) ok = false
  })
  return ok
}

describe('pièces 3D du double numérique (specs/double.SPEC.md § 4)', () => {
  it('Pilou d’origine : aucune pièce visible', () => {
    const { p } = monter(null)
    expect(p.stats()).toEqual({})
  })

  it('chaque pièce reste sous 2 000 triangles, pour toutes les coiffures, montures et couvre-chefs', () => {
    const base = normaliser({ cheveux: { longueur: 'longs' }, lunettes: { type: 'rondes' }, barbe: { type: 'longue' }, oreilles: { boucles: 'pendantes' } }).fiche
    const cas = [
      ...SCHEMA.cheveux.coiffure.map((c) => ({ ...base, cheveux: { ...base.cheveux, coiffure: c } })),
      ...SCHEMA.cheveux.texture.map((t) => ({ ...base, cheveux: { ...base.cheveux, texture: t } })),
      ...SCHEMA.lunettes.type.map((t) => ({ ...base, lunettes: { type: t } })),
      ...COUVRE_CHEFS.map((c) => ({ ...base, couvre_chef: c })),
    ]
    for (const f of cas) {
      const { p, body } = monter(normaliser(f).fiche)
      for (const [famille, tri] of Object.entries(p.stats())) expect(tri, `${famille} ${JSON.stringify(f.cheveux)} ${f.couvre_chef}`).toBeLessThanOrEqual(2000)
      expect(sansNaN(body)).toBe(true)
    }
  })

  it('construit les pièces de 60 fiches tirées au hasard sans erreur', () => {
    for (let i = 0; i < 60; i++) {
      const { p, body } = monter(tirer(i))
      expect(sansNaN(body)).toBe(true)
      const total = Object.values(p.stats()).reduce((a, b) => a + b, 0)
      expect(total).toBeLessThan(7000)
    }
  })

  it('ne reconstruit que ce qui change, et revient au Pilou d’origine', () => {
    const body = new THREE.Group()
    const p = creerPieces({ THREE, body })
    const f = normaliser({ cheveux: { longueur: 'courts' }, lunettes: { type: 'rondes' } }).fiche
    p.set(f)
    const avant = [...p.groupe.children]
    p.set({ ...f, yeux: { ...f.yeux, couleur: 'vert' } }) // peinture seulement : aucune pièce reconstruite
    expect(p.groupe.children).toEqual(avant)
    p.set({ ...f, lunettes: { type: 'aviateur' } }) // seules les lunettes changent
    expect(p.groupe.children.filter((o) => avant.includes(o))).toHaveLength(avant.length - 1)
    p.set(null)
    p.update({ f: { ...FACE0 } })
    p.groupe.children.forEach((o) => expect(o.visible).toBe(false))
  })
})

describe('brancherTraits (pour le Pilou du lot PILOU)', async () => {
  const { brancherTraits } = await import('./brancher')
  it('pose les pièces à l’échelle du corps, donne l’iris et se libère', () => {
    const body = new THREE.Group()
    const t = brancherTraits(THREE, { body, echelle: 0.9 })
    expect(t.iris()).toBeNull()
    t.setTraits(normaliser({ yeux: { couleur: 'vert' }, cheveux: { longueur: 'courts' } }).fiche)
    expect(t.iris().fonce).toBe('#3A6638')
    t.update({ chX: 0.01 })
    expect(t.support.scale.x).toBe(0.9)
    expect(Object.keys(t.pieces.stats())).toContain('cheveux')
    t.dispose()
    expect(body.children).toHaveLength(0)
  })
})
