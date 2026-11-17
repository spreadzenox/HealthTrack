/**
 * L'île de Pilou : un socle de figurine (brief § 7.6). Dessus en gazon trapu (touffes instanciées), bourrelet du bord,
 * coupe en couches de terre striées en terrasses avec des galets pris dedans, ombre de contact précalculée (une tache).
 * Tout est procédural et déterministe (graine) ; budget ≤ 12 000 triangles au palier haut (600 touffes), 300 au moyen.
 */
import * as THREE from 'three'
import { rng, valueNoise1 } from './noise'

export const ISLAND = Object.freeze({ R: 1.3, lip: 1.36 })

// couches de terre, du haut vers le bas : couleur et relief (érosion en terrasses)
const STRATA = [
  { y: -0.07, c: '#5A3F2C', rel: -0.01 },
  { y: -0.16, c: '#8A5D3E', rel: 0.012 },
  { y: -0.25, c: '#D9A86F', rel: -0.008 },
  { y: -0.37, c: '#CB7A50', rel: 0.02 },
  { y: -0.5, c: '#E0C197', rel: -0.02 },
  { y: -0.6, c: '#B06A48', rel: 0.012 },
  { y: -0.73, c: '#DFA07E', rel: -0.004 },
  { y: -0.86, c: '#9A5E43', rel: 0.016 },
  { y: -0.98, c: '#CFA173', rel: -0.014 },
  { y: -1.12, c: '#7B4B35', rel: 0.012 },
]
const PEBBLES = ['#E7DED0', '#B5ABA0', '#D2AD98', '#837A73', '#EFE2C8', '#A4ACA3']

/**
 * Couleurs du dessus de l'îlot par saison (SPEC île § 8) : `top` = [creux, bosses, bourrelet], `tufts` = teintes des
 * touffes. Printemps-été = l'herbe vive d'origine ; automne = herbe dorée ; hiver = calotte de neige (quelques touffes
 * vertes qui dépassent) ; fin d'hiver = herbe qui reverdit et petites fleurs blanches et roses d'amandier.
 */
export const SEASON_COLORS = Object.freeze({
  'printemps-ete': { top: ['#6AAE3E', '#8CC955', '#58993A'], tufts: ['#7DBE48', '#8FCF57', '#6DAF3E', '#9DD866', '#84C64F'] },
  automne: { top: ['#B39A3C', '#D1B650', '#977F32'], tufts: ['#C9A447', '#D8B65A', '#B38E3A', '#E0A048', '#C98A3C'] },
  hiver: { top: ['#E3EAF1', '#F6F8FB', '#C8D3DF'], tufts: ['#EEF2F6', '#DDE5EC', '#F7F9FB', '#8FAE84', '#E6ECF1'] },
  'fin-hiver': { top: ['#7AB24E', '#98CA66', '#649A42'], tufts: ['#8DC25A', '#9FD06B', '#F7EEF1', '#7DB64C', '#F3D3DF'] },
})
const DEFAULT_SEASON = 'printemps-ete'

function boundaryY(i, theta) {
  if (!i) return STRATA[0].y
  return STRATA[i].y + 0.035 * valueNoise1(theta * 0.8 + i * 3.3, 71 + i) - 0.02 * Math.sin(theta + i * 1.7)
}
function layerAt(theta, y) {
  let i = 0
  while (i + 1 < STRATA.length && y < boundaryY(i + 1, theta)) i++
  return i
}

/** Profil de la coupe : rayon en fonction de la hauteur, du bord (y ≈ −0,07) à la pointe (y ≈ −1,3). */
function sideProfile(points) {
  const ctl = [[1.345, -0.07], [1.33, -0.17], [1.27, -0.36], [1.15, -0.56], [0.98, -0.78], [0.77, -0.98], [0.52, -1.15], [0.26, -1.29], [0.0001, -1.38]]
  const curve = new THREE.SplineCurve(ctl.map(([r, y]) => new THREE.Vector2(r, y)).reverse())
  return curve.getSpacedPoints(points)
}

function islandSide(radial, rows) {
  const prof = sideProfile(rows)
  const geo = new THREE.LatheGeometry(prof, radial)
  geo.rotateY(Math.PI) // la couture du tour passe derrière
  const p = geo.attributes.position
  const colors = new Float32Array(p.count * 3)
  const c = new THREE.Color()
  const cols = STRATA.map((s) => new THREE.Color(s.c))
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), y = p.getY(k), z = p.getZ(k)
    const r = Math.hypot(x, z)
    const th = Math.atan2(x, z)
    const L = layerAt(th, y)
    if (r > 1e-3) {
      const fade = Math.min(1, (y + 1.38) / 0.3) * Math.min(1, r * 3)
      const lump = 0.03 * valueNoise1(th * 3 + y * 5, 81) + 0.012 * valueNoise1(th * 11 + y * 13, 83)
      const nr = r + (STRATA[L].rel * 2 + lump) * fade
      p.setX(k, (x / r) * nr)
      p.setZ(k, (z / r) * nr)
    }
    // couleur de la couche, légèrement marbrée ; liseré sombre à la jonction des couches
    const yb = boundaryY(L, th)
    const edge = Math.exp(-(((yb - y) / 0.012) ** 2)) * 0.22
    const mott = 0.08 * valueNoise1(th * 6 + y * 9, 91)
    c.copy(cols[L]).multiplyScalar(1 + mott - edge)
    colors.set([c.r, c.g, c.b], k * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return { geo, prof }
}

function islandTop(radial) {
  const pts = []
  for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector2(Math.max(1e-4, ISLAND.R * (i / 10) ** 0.8), 0.0))
  for (const [r, y] of [[1.325, -0.008], [1.352, -0.03], [1.362, -0.055], [1.348, -0.08]]) pts.push(new THREE.Vector2(r, y))
  pts.reverse()
  const geo = new THREE.LatheGeometry(pts, radial)
  geo.rotateY(Math.PI)
  const p = geo.attributes.position
  const colors = new Float32Array(p.count * 3)
  // mélange creux / bosses de chaque sommet (-1 = bourrelet), gardé pour recolorer à chaque saison
  const mix = new Float32Array(p.count)
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), y = p.getY(k), z = p.getZ(k)
    const r = Math.hypot(x, z)
    const th = Math.atan2(x, z)
    if (r < ISLAND.R) p.setY(k, y + 0.018 * (1 - (r / ISLAND.R) ** 2))
    mix[k] = r > ISLAND.R - 0.01 ? -1 : 0.5 + 0.5 * valueNoise1(th * 4 + r * 7, 63)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.userData.mix = mix
  geo.computeVertexNormals()
  return geo
}

function paintTop(geo, season) {
  const [a, b, rim] = SEASON_COLORS[season].top.map((h) => new THREE.Color(h))
  const mix = geo.userData.mix
  const col = geo.attributes.color
  const c = new THREE.Color()
  for (let k = 0; k < mix.length; k++) {
    if (mix[k] < 0) c.copy(rim)
    else c.copy(a).lerp(b, mix[k])
    col.setXYZ(k, c.r, c.g, c.b)
  }
  col.needsUpdate = true
}

/** Une touffe d'herbe trapue : 4 brins effilés et courbés (12 triangles). */
function tuftGeometry() {
  const pos = []
  const blades = 4
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2 + 0.4
    const lean = 0.35 + 0.15 * (i % 2)
    const w = 0.03, h = 0.042 + 0.012 * (i % 3)
    const dx = Math.cos(a), dz = Math.sin(a)
    const px = -dz * w, pz = dx * w
    const b0 = [-px, 0, -pz], b1 = [px, 0, pz]
    const m0 = [-px * 0.6 + dx * lean * h * 0.4, h * 0.55, -pz * 0.6 + dz * lean * h * 0.4]
    const m1 = [px * 0.6 + dx * lean * h * 0.4, h * 0.55, pz * 0.6 + dz * lean * h * 0.4]
    const tip = [dx * lean * h, h, dz * lean * h]
    pos.push(...b0, ...b1, ...m1, ...b0, ...m1, ...m0, ...m0, ...m1, ...tip)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  // pied plus sombre, pointe dorée par le contre-jour
  const col = []
  for (let i = 0; i < pos.length; i += 3) {
    const k = pos[i + 1] / 0.075
    col.push(0.62 + 0.5 * k, 0.66 + 0.46 * k, 0.6 + 0.25 * k)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  // normales vers le haut : un gazon trapu se lit mieux éclairé comme une surface
  const n = g.attributes.normal
  for (let i = 0; i < n.count; i++) n.setXYZ(i, n.getX(i) * 0.3, 1, n.getZ(i) * 0.3)
  g.normalizeNormals?.()
  return g
}

function blobTexture() {
  const S = 128
  const data = new Uint8Array(S * S * 4)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - S / 2 + 0.5, y - S / 2 + 0.5) / (S / 2)
      const a = Math.max(0, 1 - d) ** 1.8
      const i = (y * S + x) * 4
      data[i] = 40; data[i + 1] = 52; data[i + 2] = 20; data[i + 3] = Math.round(a * 255)
    }
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat)
  t.needsUpdate = true
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearFilter
  return t
}

/**
 * @param {{ quality: 'haut'|'moyen'|'bas', tufts: number, seed?: number }} opts
 */
export function createIsland({ quality = 'haut', tufts = 600, seed = 7, season = DEFAULT_SEASON } = {}) {
  let current = SEASON_COLORS[season] ? season : DEFAULT_SEASON
  const group = new THREE.Group()
  group.name = 'ile'
  const physical = quality === 'haut'
  const radial = quality === 'haut' ? 48 : 36

  const side = islandSide(radial, quality === 'haut' ? 28 : 22)
  const soilMat = physical
    ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.62, clearcoat: 0.35, clearcoatRoughness: 0.35 })
    : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 })
  const sideMesh = new THREE.Mesh(side.geo, soilMat)
  sideMesh.name = 'coupe'
  group.add(sideMesh)

  const topMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 })
  const topGeo = islandTop(radial)
  paintTop(topGeo, current)
  const top = new THREE.Mesh(topGeo, topMat)
  top.name = 'gazon'
  group.add(top)

  // galets pris dans la coupe (une seule géométrie instanciée)
  const r = rng(seed)
  const pebbleGeo = new THREE.IcosahedronGeometry(1, 0)
  const pebbleMat = new THREE.MeshStandardMaterial({ roughness: 0.35 })
  const nPeb = quality === 'bas' ? 0 : 22
  const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, Math.max(1, nPeb))
  pebbles.count = nPeb
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), e = new THREE.Euler()
  const profAt = (y) => {
    const pts = side.prof
    for (let i = 1; i < pts.length; i++) if (pts[i].y >= y) return pts[i - 1].x + ((pts[i].x - pts[i - 1].x) * (y - pts[i - 1].y)) / (pts[i].y - pts[i - 1].y || 1)
    return pts[pts.length - 1].x
  }
  for (let i = 0; i < nPeb; i++) {
    const y = -0.18 - r() * 0.85
    // surtout devant et sur les côtés (ce qu'on voit)
    const th = (r() - 0.5) * Math.PI * 1.6
    const rad = profAt(y) * 0.985
    const sz = 0.035 + r() * 0.04
    v.set(Math.sin(th) * rad, y, Math.cos(th) * rad)
    s.set(sz * (1.1 + r() * 0.4), sz * 0.8, sz)
    q.setFromEuler(e.set(r() * 3, r() * 3, r() * 3))
    m.compose(v, q, s)
    pebbles.setMatrixAt(i, m)
    pebbles.setColorAt(i, new THREE.Color(PEBBLES[Math.floor(r() * PEBBLES.length)]))
  }
  pebbles.name = 'galets'
  if (nPeb) group.add(pebbles)

  // touffes de gazon (instanciées), jamais sous les pieds de Pilou
  const tuftGeo = tuftGeometry()
  const tuftMat = new THREE.MeshStandardMaterial({ roughness: 0.78, side: THREE.DoubleSide, vertexColors: true })
  const tuftMesh = new THREE.InstancedMesh(tuftGeo, tuftMat, Math.max(1, tufts))
  const palette = (sea) => SEASON_COLORS[sea].tufts.map((h) => new THREE.Color(h))
  const greens = palette(current)
  const tuftTone = [] // indice de teinte de chaque touffe : la même touffe change de couleur avec la saison
  let placed = 0
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; placed < tufts && i < tufts * 3; i++) {
    const rr = Math.sqrt((i + 0.5) / (tufts * 1.15)) * (ISLAND.R - 0.03)
    if (rr > ISLAND.R - 0.03) break
    const th = i * golden + (r() - 0.5) * 0.3
    const x = Math.sin(th) * rr + (r() - 0.5) * 0.03
    const z = Math.cos(th) * rr + (r() - 0.5) * 0.03
    if (Math.hypot(x, z) < 0.42) continue
    const y = 0.018 * (1 - (Math.hypot(x, z) / ISLAND.R) ** 2)
    const k = 0.75 + r() * 0.6
    v.set(x, y - 0.004, z)
    q.setFromEuler(e.set(0, r() * Math.PI * 2, 0))
    s.set(k, k * (0.8 + r() * 0.5), k)
    m.compose(v, q, s)
    tuftMesh.setMatrixAt(placed, m)
    const tone = Math.floor(r() * greens.length)
    tuftTone.push(tone)
    tuftMesh.setColorAt(placed, greens[tone])
    placed++
  }
  tuftMesh.count = placed
  tuftMesh.name = 'herbe'
  if (placed) group.add(tuftMesh)

  // ombre de contact sous Pilou (tache précalculée, pas d'ombre portée)
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.85),
    new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.55 }),
  )
  blob.rotation.x = -Math.PI / 2
  blob.position.set(0, 0.021, 0.02)
  blob.renderOrder = 1
  blob.name = 'ombre'
  group.add(blob)

  return {
    group,
    get season() {
      return current
    },
    /** Change la saison (sortie de `seasonOf`) : recolore le dessus et les touffes, sans rien reconstruire. */
    setSeason(next) {
      if (!SEASON_COLORS[next] || next === current) return
      current = next
      paintTop(topGeo, current)
      const tones = palette(current)
      tuftTone.forEach((tone, i) => tuftMesh.setColorAt(i, tones[tone % tones.length]))
      if (tuftMesh.instanceColor) tuftMesh.instanceColor.needsUpdate = true
    },
    /**
     * Croissance de l'îlot (sortie de `growthAt`, SPEC île § 8) : largeur × `islandScaleXZ`, hauteur × `islandScaleY`.
     * Le dessus reste à la même hauteur (y ≈ 0) : Pilou ne bouge pas, la caméra non plus. Les brins d'herbe gardent leur
     * nombre et grandissent avec l'îlot. Jamais en dessous de l'îlot de départ (rien ne recule).
     */
    setGrowth(growth) {
      const xz = Math.max(1, Number(growth?.islandScaleXZ) || 1)
      const y = Math.max(1, Number(growth?.islandScaleY) || 1)
      group.scale.set(xz, y, xz)
    },
    get growthScale() {
      return { xz: group.scale.x, y: group.scale.y }
    },
    /** Hauteur du dessus de l'île en (x, z). */
    topY(x, z) {
      const rr = Math.hypot(x, z)
      return rr > ISLAND.R ? 0 : 0.018 * (1 - (rr / ISLAND.R) ** 2)
    },
    dispose() {
      group.traverse((o) => {
        o.geometry?.dispose?.()
        if (o.material) {
          o.material.map?.dispose?.()
          o.material.dispose?.()
        }
      })
    },
  }
}
