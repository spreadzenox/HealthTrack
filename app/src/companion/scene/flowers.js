/**
 * Les fleurs de l'île (SPEC île § 4) : céramique émaillée aux couleurs des thèmes (brief § 7.6). La scène les fait
 * pousser à la place que donne le lot BULLES (`flower:grow`) ou les pose d'un coup (`flowers:set`). Une fleur ne fane
 * jamais. Géométries partagées : tige, corolle de 5 pétales fusionnée, cœur.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { flowerPose, flowerPosition } from './flowerGrowth'
import { ISLAND } from './island'

export const THEME_COLORS = Object.freeze({
  menthe: '#6FD3AE',
  peche: '#FF9F7A',
  lilas: '#B49CF0',
  nuit: '#7484DA',
  rose: '#FF8FB1',
  gris: '#CFC6BD',
  miel: '#F5C451',
})

const STEM_H = 0.26

let shared = null
function sharedParts() {
  if (shared) return shared
  const stem = new THREE.CylinderGeometry(0.011, 0.015, 1, 5, 1)
  stem.translate(0, 0.5, 0)
  const petals = []
  for (let i = 0; i < 5; i++) {
    const p = new THREE.SphereGeometry(1, 6, 4)
    p.scale(0.06, 0.018, 0.04)
    p.translate(0.062, 0, 0)
    p.rotateZ(0.25)
    p.rotateY((i / 5) * Math.PI * 2)
    petals.push(p)
  }
  const corolla = mergeGeometries(petals)
  const heart = new THREE.SphereGeometry(0.028, 8, 6)
  heart.scale(1, 0.7, 1)
  const leaf = new THREE.SphereGeometry(1, 6, 4)
  leaf.scale(0.05, 0.009, 0.02)
  leaf.translate(0.045, 0, 0)
  shared = {
    stem,
    corolla,
    heart,
    leaf,
    stemMat: new THREE.MeshStandardMaterial({ color: '#4E9A3A', roughness: 0.5 }),
    heartMat: new THREE.MeshPhysicalMaterial({ color: '#FFD45C', roughness: 0.3, clearcoat: 0.8 }),
    petalMats: {},
  }
  return shared
}

function petalMat(theme) {
  const s = sharedParts()
  if (!s.petalMats[theme]) {
    s.petalMats[theme] = new THREE.MeshPhysicalMaterial({
      color: THEME_COLORS[theme] || THEME_COLORS.menthe,
      roughness: 0.28,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    })
  }
  return s.petalMats[theme]
}

function buildFlower(theme) {
  const s = sharedParts()
  const g = new THREE.Group()
  const stem = new THREE.Mesh(s.stem, s.stemMat)
  const leaf = new THREE.Mesh(s.leaf, s.stemMat)
  leaf.position.y = STEM_H * 0.35
  leaf.rotation.z = 0.5
  const head = new THREE.Group()
  const corolla = new THREE.Mesh(s.corolla, petalMat(theme))
  const heart = new THREE.Mesh(s.heart, s.heartMat)
  heart.position.y = 0.006
  head.add(corolla, heart)
  head.rotation.x = 0.35 // la corolle regarde un peu vers l'écran
  g.add(stem, leaf, head)
  return { group: g, stem, leaf, head, corolla }
}

export function createFlowerBed({ topY = () => 0, reducedMotion = false } = {}) {
  const group = new THREE.Group()
  group.name = 'fleurs'
  const flowers = new Map()
  let rm = reducedMotion

  function place(f) {
    const [x, z] = flowerPosition(f.angleDeg, f.radius, ISLAND.R)
    f.parts.group.position.set(x, topY(x, z), z)
    f.parts.group.rotation.y = ((f.angleDeg * 7) % 360) * (Math.PI / 180)
    f.parts.group.scale.setScalar(f.scale || 1)
  }

  function pose(f, t) {
    const p = flowerPose(f.bornAt == null ? Infinity : t - f.bornAt, { reducedMotion: rm })
    const { stem, leaf, head, corolla } = f.parts
    const h = STEM_H * Math.max(0.05, p.stem)
    stem.scale.set(1, h, 1)
    stem.visible = p.sprout > 0
    leaf.scale.setScalar(Math.max(0.001, p.sprout))
    head.position.y = h
    const b = Math.max(0.001, p.bud * 0.45 + p.bloom * 0.55)
    head.scale.set(b, b * p.bounce, b)
    corolla.material.opacity = p.opacity
    corolla.material.transparent = p.opacity < 1
    // balancement léger, jamais de flétrissement
    if (!rm) head.rotation.z = 0.04 * Math.sin(t / 1700 + f.angleDeg)
    return p.done
  }

  return {
    group,
    grow({ id, theme, angleDeg, radius = 0.9, scale = 1 }, t) {
      if (flowers.has(id)) return
      const f = { id, theme, angleDeg, radius, scale, bornAt: t, parts: buildFlower(theme) }
      place(f)
      flowers.set(id, f)
      group.add(f.parts.group)
      pose(f, t)
    },
    set(list = [], t = 0) {
      for (const f of flowers.values()) group.remove(f.parts.group)
      flowers.clear()
      for (const item of list) {
        const f = { ...item, radius: item.radius ?? 0.9, bornAt: null, parts: buildFlower(item.theme) }
        place(f)
        flowers.set(f.id, f)
        group.add(f.parts.group)
        pose(f, t)
      }
    },
    /** Avance les fleurs qui poussent ; rend vrai si l'une d'elles bouge encore. */
    update(t) {
      let moving = false
      for (const f of flowers.values()) if (!pose(f, t)) moving = true
      return moving
    },
    setReducedMotion(v) {
      rm = Boolean(v)
    },
    get size() {
      return flowers.size
    },
  }
}
