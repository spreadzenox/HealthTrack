/**
 * Les 7 cadeaux de la première semaine sur l'île (SPEC île § 7) : J1 arbuste, J2 lanterne, J3 écharpe (portée par
 * Pilou), J4 galets, J5 papillon (posé sur la perle de l'antenne), J6 nuage de compagnie, J7 arc-en-ciel. Le lot
 * BULLES décide quand un cadeau est reçu (`gift:placed`) ; la scène le pose, avec une petite arrivée (fonction du
 * temps), ou d'un coup à l'ouverture (`items`). Céramique émaillée, comme les fleurs.
 */
import * as THREE from 'three'
import { EASE, spring, seg } from './curves'
import { ISLAND } from './island'

export const GIFT_ITEMS = ['arbuste', 'lanterne', 'echarpe', 'galets', 'papillon', 'nuage', 'arc-en-ciel']

/** Places (repère de l'île, rayon du plateau = 1) : SPEC île § 7. */
export const GIFT_PLACES = Object.freeze({
  arbuste: [-0.72, -0.62],
  lanterne: [0.8, -0.55],
  galets: [0.98, 0.22],
})

/** Arrivée d'un cadeau, 0 → 1 (ms depuis la pose) ; en mouvements réduits, fondu de 200 ms. */
export function giftArrival(item, ms, { reducedMotion = false } = {}) {
  if (ms == null || ms >= 3000) return { k: 1, y: 0, opacity: 1 }
  if (ms < 0) return { k: 0, y: 0, opacity: 0 }
  if (reducedMotion) return { k: 1, y: 0, opacity: Math.min(1, ms / 200) }
  switch (item) {
    case 'arbuste': // pousse de la terre (700 ms, back)
      return { k: EASE.back(seg(ms, 0, 700)), y: 0, opacity: 1 }
    case 'lanterne': // tombe (450 ms, in) puis rebondit (ressort 380 / 12)
      return { k: 1, y: ms < 450 ? 1.2 * (1 - EASE.in(seg(ms, 0, 450))) : 0.06 * (1 - spring(ms - 450, 380, 12)) * -1, opacity: 1 }
    case 'galets': // trois pierres l'une sur l'autre, 300 ms chacune
      return { k: 1, y: 0, opacity: 1, stones: [0, 1, 2].map((i) => 1 - EASE.in(seg(ms, i * 300, i * 300 + 300))) }
    case 'papillon': // arrive en vol (700 ms)
      return { k: 1, y: 0, opacity: 1, fly: 1 - EASE.io(seg(ms, 0, 700)) }
    default: // nuage, arc-en-ciel, écharpe : apparaissent (back / io)
      return { k: (item === 'arc-en-ciel' ? EASE.io : EASE.back)(seg(ms, 0, item === 'arc-en-ciel' ? 1000 : 500)), y: 0, opacity: 1 }
  }
}

function glaze(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, ...extra })
}

/** Feuillage de l'arbuste du J1 par saison (SPEC île § 8) : automne orangé, neige en hiver, amandier en fleur. */
export const SHRUB_LEAVES = Object.freeze({
  'printemps-ete': ['#5FB24A', '#7CC75A'],
  automne: ['#D9702C', '#EFA043'],
  hiver: ['#EEF3F7', '#5E9A62'],
  'fin-hiver': ['#F7E6EC', '#EFB9CB'],
})

function paintShrub(obj, season) {
  const leaves = SHRUB_LEAVES[season]
  if (!obj || !leaves) return
  obj.userData.leaves?.forEach((m, i) => m.color.set(leaves[i]))
}

function buildShrub() {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.22, 6), glaze('#8A5D3E', { clearcoat: 0.4 }))
  trunk.position.y = 0.11
  g.add(trunk)
  const leaf = glaze(SHRUB_LEAVES['printemps-ete'][0])
  const leaf2 = glaze(SHRUB_LEAVES['printemps-ete'][1])
  g.userData.leaves = [leaf, leaf2]
  for (const [x, y, z, r, m] of [[0, 0.3, 0, 0.13, leaf], [0.09, 0.25, 0.04, 0.09, leaf2], [-0.08, 0.26, 0.03, 0.095, leaf2], [0.02, 0.38, -0.02, 0.085, leaf]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m)
    b.position.set(x, y, z)
    g.add(b)
  }
  return g
}

function buildLantern() {
  const g = new THREE.Group()
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.34, 6), glaze('#5B5F9E'))
  post.position.y = 0.17
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 5), glaze('#5B5F9E'))
  arm.rotation.z = Math.PI / 2
  arm.position.set(0.04, 0.33, 0)
  const lightMat = new THREE.MeshStandardMaterial({ color: '#FFE2A8', emissive: '#FFB84D', emissiveIntensity: 0.15, roughness: 0.3 })
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 8), lightMat)
  lamp.position.set(0.08, 0.28, 0)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.03, 8), glaze('#5B5F9E'))
  cap.position.set(0.08, 0.33, 0)
  g.add(post, arm, lamp, cap)
  g.userData.lightMat = lightMat
  return g
}

function buildStones() {
  const g = new THREE.Group()
  const cols = ['#D9CFC2', '#B5ABA0', '#EFE2C8']
  const stones = [[0.075, 0.03], [0.058, 0.085], [0.04, 0.13]].map(([r, y], i) => {
    const geo = new THREE.SphereGeometry(r, 12, 8)
    geo.scale(1.25, 0.6, 1)
    const m = new THREE.Mesh(geo, glaze(cols[i], { roughness: 0.2 }))
    m.position.y = y
    m.userData.restY = y
    g.add(m)
    return m
  })
  g.userData.stones = stones
  return g
}

function buildButterfly() {
  const g = new THREE.Group()
  const wingGeo = new THREE.SphereGeometry(1, 8, 4)
  wingGeo.scale(0.045, 0.004, 0.035)
  const wingMat = glaze('#FF8FB1', { side: THREE.DoubleSide })
  const wings = [-1, 1].map((s) => {
    const pivot = new THREE.Group()
    const w = new THREE.Mesh(wingGeo, wingMat)
    w.position.x = s * 0.042
    pivot.add(w)
    g.add(pivot)
    return { pivot, s }
  })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.04, 2, 6), glaze('#3E3870'))
  body.rotation.x = Math.PI / 2
  g.add(body)
  g.userData.wings = wings
  return g
}

function buildCloud() {
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9, emissive: '#FFF1E4', emissiveIntensity: 0.35 })
  for (const [x, y, r] of [[0, 0, 0.14], [0.13, -0.02, 0.1], [-0.13, -0.025, 0.1], [0.05, 0.07, 0.1]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), m)
    b.position.set(x, y, 0)
    g.add(b)
  }
  return g
}

function buildRainbow() {
  const g = new THREE.Group()
  const cols = ['#FF8FB1', '#FF9F7A', '#F5C451', '#6FD3AE', '#7484DA', '#B49CF0']
  cols.forEach((c, i) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(1.95 - i * 0.07, 0.035, 6, 48, Math.PI),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, depthWrite: false }),
    )
    g.add(arc)
  })
  return g
}

const SIZE = { arbuste: 1.45, lanterne: 1.5, galets: 1.5, papillon: 1.9, nuage: 1, 'arc-en-ciel': 1 }
const RAINBOW_SMALL = 0.13

/** L'arc-en-ciel : 0 = grand derrière l'île, 1 = petit au-dessus du nuage (ms depuis la pose, `null` = posé avant). */
export function rainbowShrink(ms, { reducedMotion = false } = {}) {
  if (ms == null) return 1
  if (reducedMotion) return ms < 6000 ? 0 : 1
  return EASE.io(seg(ms, 6000, 7300))
}

/**
 * La boîte de la cérémonie du cadeau (SPEC île § 7), t = 0 au toucher de la bulle dorée : elle tombe (200–620 ms) et
 * atterrit au ressort 380 / 12, le ruban est tiré (1 400–1 700), le couvercle saute en arc (1 900–2 420), rayons dorés
 * jusqu'à 2 900, puis la boîte se range (4 000–4 450). Mouvements réduits : fondus, pas de rayons.
 */
export const BOX_MS = 4500
export function boxPose(ms, { reducedMotion = false } = {}) {
  if (ms == null || ms < 0 || ms >= BOX_MS) return { visible: false }
  if (reducedMotion) {
    const fadeIn = seg(ms, 0, 200)
    const fadeOut = 1 - seg(ms, 4000, 4200)
    return { visible: true, y: 0, squash: 0, lid: ms < 1900 ? 0 : 1, lidOpacity: ms < 1900 ? 1 : 0, rays: 0, scale: 1, opacity: Math.min(fadeIn, fadeOut) }
  }
  const fall = ms < 620 ? 1.4 * (1 - EASE.in(seg(ms, 200, 620))) : 0
  const land = ms >= 620 && ms < 1400 ? 0.18 * (1 - spring(ms - 620, 380, 12)) : 0
  const tug = ms >= 1400 && ms < 1900 ? 0.08 * Math.sin(Math.PI * seg(ms, 1400, 1700)) : 0
  const lid = EASE.out(seg(ms, 1900, 2420))
  const rays = ms >= 1900 && ms < 2900 ? Math.sin(Math.PI * seg(ms, 1900, 2900)) : 0
  const scale = 1 - EASE.in(seg(ms, 4000, 4450))
  return { visible: true, y: fall, squash: land - tug, lid, lidOpacity: 1 - seg(ms, 3000, 3600), rays, scale, opacity: 1 }
}

function buildBox() {
  const g = new THREE.Group()
  const gold = glaze('#F5C451', { roughness: 0.25 })
  const ribbon = glaze('#E8483F')
  const body = new THREE.Group()
  body.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.17, 0.22), gold))
  const rb1 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.172, 0.224), ribbon)
  const rb2 = new THREE.Mesh(new THREE.BoxGeometry(0.224, 0.172, 0.035), ribbon)
  body.add(rb1, rb2)
  body.position.y = 0.085
  const lid = new THREE.Group()
  lid.add(new THREE.Mesh(new THREE.BoxGeometry(0.245, 0.05, 0.245), gold))
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 12), ribbon)
  bow.position.y = 0.04
  lid.add(bow)
  lid.position.y = 0.195
  const S = 64
  const d = new Uint8Array(S * S * 4)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x - S / 2 + 0.5, dy = y - S / 2 + 0.5
    const r = Math.hypot(dx, dy) / (S / 2)
    const spokes = 0.55 + 0.45 * Math.cos(Math.atan2(dy, dx) * 8)
    const a = Math.max(0, 1 - r) ** 1.5 * spokes
    const i = (y * S + x) * 4
    d[i] = 255; d[i + 1] = 220; d[i + 2] = 140; d[i + 3] = Math.round(a * 255)
  }
  const rayTex = new THREE.DataTexture(d, S, S, THREE.RGBAFormat)
  rayTex.needsUpdate = true
  rayTex.magFilter = THREE.LinearFilter
  const rayMat = new THREE.SpriteMaterial({ map: rayTex, color: '#FFD98A', blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false })
  const rays = new THREE.Sprite(rayMat)
  rays.position.y = 0.3
  g.add(body, lid, rays)
  g.userData = { body, lid, rays, rayMat }
  return g
}

const BUILDERS = { arbuste: buildShrub, lanterne: buildLantern, galets: buildStones, papillon: buildButterfly, nuage: buildCloud, 'arc-en-ciel': buildRainbow }

/**
 * @param {{ topY: (x: number, z: number) => number, pilou: () => object, reducedMotion?: boolean }} opts
 */
export function createGifts({ topY = () => 0, pilou = () => null, reducedMotion = false } = {}) {
  const group = new THREE.Group()
  group.name = 'cadeaux'
  const placed = new Map()
  let rm = reducedMotion
  let evening = 0
  let season = 'printemps-ete'
  let shrubScale = 1

  function add(item, t) {
    if (!GIFT_ITEMS.includes(item) || placed.has(item)) return
    if (item === 'echarpe') {
      pilou()?.setAccessory?.('echarpe', true)
      placed.set(item, { item, bornAt: t, obj: null })
      return
    }
    const obj = BUILDERS[item]()
    if (item === 'arbuste') paintShrub(obj, season)
    const place = GIFT_PLACES[item]
    if (place) {
      const x = place[0] * ISLAND.R * 0.92, z = place[1] * ISLAND.R * 0.92
      obj.position.set(x, topY(x, z), z)
      obj.userData.base = obj.position.clone()
    } else if (item === 'nuage') {
      obj.position.set(-1.75, -0.35, 0.2)
      obj.userData.base = obj.position.clone()
    } else if (item === 'arc-en-ciel') {
      // grand derrière l'île pendant la cérémonie du jour 7, puis en petit au-dessus du nuage
      obj.userData.big = new THREE.Vector3(0, -0.55, -1.6)
      obj.userData.small = new THREE.Vector3(-1.75, -0.28, 0.1)
      obj.userData.base = obj.userData.small.clone()
    }
    if (!obj.userData.base) obj.userData.base = obj.position.clone()
    obj.name = item
    group.add(obj)
    placed.set(item, { item, bornAt: t, obj })
  }

  let box = null
  let boxAt = null

  return {
    group,
    /** Cérémonie : la boîte dorée tombe devant Pilou et s'ouvre (`gift:opened`, t = temps de la scène). */
    openBox(t) {
      if (!box) {
        box = buildBox()
        box.name = 'boite'
        box.position.set(0.05, topY(0.05, 0.62), 0.62)
        group.add(box)
      }
      boxAt = t
    },
    /** Un cadeau reçu maintenant (`t` = temps de la scène) : il arrive avec son animation. */
    place(item, t) {
      add(item, t)
    },
    /** Tous les cadeaux reçus, posés sans animation (ouverture de l'app). */
    setItems(items = []) {
      for (const it of items) if (!placed.has(it)) { add(it, null); const p = placed.get(it); if (p) p.bornAt = null }
    },
    /** Saison de l'îlot : le feuillage de l'arbuste la suit (posé avant ou après). */
    setSeason(next) {
      if (!SHRUB_LEAVES[next]) return
      season = next
      paintShrub(placed.get('arbuste')?.obj, season)
    },
    /** L'arbuste grandit avec l'îlot (× 1 → × 1,45 à 90 jours d'usage, SPEC île § 8). */
    setShrubScale(k) {
      shrubScale = Math.max(1, Number(k) || 1)
    },
    get shrubScale() {
      return shrubScale
    },
    setEvening(v) {
      evening = Math.max(0, Math.min(1, v))
    },
    setReducedMotion(v) {
      rm = Boolean(v)
    },
    update(t) {
      let moving = false
      if (box) {
        const b = boxPose(boxAt == null ? null : t - boxAt, { reducedMotion: rm })
        box.visible = b.visible
        if (b.visible) {
          moving = true
          const { body, lid, rays, rayMat } = box.userData
          box.position.y = topY(0.05, 0.62) + b.y
          box.scale.setScalar(Math.max(0.001, b.scale) * 1.6)
          body.scale.set(1 + b.squash * 0.5, 1 - b.squash, 1 + b.squash * 0.5)
          lid.position.set(0.32 * b.lid, 0.195 + 0.5 * Math.sin(Math.PI * Math.min(1, b.lid)) * (b.lid < 1 ? 1 : 0) + (b.lid >= 1 ? -0.17 : 0) * 1, 0)
          lid.rotation.z = -1.4 * b.lid
          lid.visible = b.lidOpacity > 0
          rayMat.opacity = 0.8 * b.rays
          rays.scale.setScalar(0.25 + 0.55 * b.rays)
          box.traverse((m) => { if (m.isMesh && !m.isSprite) { m.material.transparent = b.opacity < 1; m.material.opacity = b.opacity } })
        }
      }
      for (const p of placed.values()) {
        if (!p.obj) continue
        const ms = p.bornAt == null ? null : t - p.bornAt
        const a = giftArrival(p.item, ms, { reducedMotion: rm })
        if (ms != null && ms < 3000) moving = true
        const o = p.obj
        const base = o.userData.base
        o.scale.setScalar(Math.max(0.001, a.k) * SIZE[p.item] * (p.item === 'arbuste' ? shrubScale : 1))
        o.position.y = base.y + (a.y || 0)
        if (p.item === 'arc-en-ciel') {
          const sh = rainbowShrink(ms, { reducedMotion: rm })
          if (ms != null && ms < 7400) moving = true
          o.position.lerpVectors(o.userData.big, o.userData.small, sh)
          o.scale.setScalar(Math.max(0.001, ms == null || ms > 1000 ? 1 : a.k) * (1 + (RAINBOW_SMALL - 1) * sh))
        }
        o.traverse((m) => { if (m.material && 'opacity' in m.material && p.item !== 'arc-en-ciel') { m.material.transparent = a.opacity < 1; m.material.opacity = a.opacity } })
        if (a.stones) o.userData.stones.forEach((s, i) => { s.position.y = s.userData.restY + 0.5 * a.stones[i] })
        if (p.item === 'lanterne') {
          // le soir, la lanterne s'allume ; scintillement ±8 %
          const flick = rm ? 1 : 1 + 0.08 * Math.sin(t / 130) * Math.sin(t / 370)
          o.userData.lightMat.emissiveIntensity = 0.15 + 1.4 * evening * flick
        }
        if (p.item === 'papillon') {
          const tip = pilou()?.anchors?.antennaTip
          if (tip) {
            tip.getWorldPosition(o.position)
            o.parent?.worldToLocal(o.position)
            o.position.y += 0.06
          }
          const fly = a.fly || 0
          o.position.x += fly * 1.4
          o.position.y += fly * 0.6
          const flap = rm ? 0.3 : 0.25 + (fly > 0 ? 0.9 : 0.35) * Math.abs(Math.sin(t / (fly > 0 ? 60 : 900)))
          o.userData.wings.forEach(({ pivot, s }) => { pivot.rotation.z = s * flap })
        }
        if (p.item === 'nuage' && !rm) o.position.y = base.y + 0.04 * Math.sin(t / 2600)
        if (p.item === 'arc-en-ciel') o.children.forEach((arc) => { arc.material.opacity = ms == null || ms > 1000 ? 0.75 : 0.75 * a.k })
      }
      return moving
    },
    has(item) {
      return placed.has(item)
    },
    get items() {
      return [...placed.keys()]
    },
  }
}
