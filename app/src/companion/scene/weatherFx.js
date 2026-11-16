/**
 * Les effets de météo sur l'île (SPEC île § 6) : un seul à la fois, dans le cadre de l'île, derrière le texte. Pluie
 * (traits, 40 au plus) et neige (flocons, 30 au plus) ; positions = fonctions du temps. Le décor (quel effet, combien)
 * vient de `weatherDecor` du lot MONDE ; en mouvements réduits, aucune particule.
 */
import * as THREE from 'three'
import { rng } from './noise'

const BOX = { x: 2.2, yTop: 2.4, yBottom: 0.05, z: 1.3 }

export function createWeatherFx() {
  const group = new THREE.Group()
  group.name = 'meteo'
  const r = rng(17)
  const N = 40
  const seeds = Array.from({ length: N }, () => [r() * 2 - 1, r(), r() * 2 - 1, 0.8 + r() * 0.4])
  const rainGeo = new THREE.BufferGeometry()
  rainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3))
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: '#8FA6C8', transparent: true, opacity: 0.45, depthWrite: false }))
  rain.frustumCulled = false
  const snowGeo = new THREE.BufferGeometry()
  snowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: '#F4F7FF', size: 0.075, transparent: true, opacity: 0.95, depthWrite: false }))
  snow.frustumCulled = false
  group.add(rain, snow)
  let kind = null
  let count = 0
  let rm = false

  return {
    group,
    /** `decor` = sortie de `weatherDecor` (ou `null`). */
    set(decor) {
      const k = decor?.particles?.kind || (decor?.effect === 'pluie' ? 'pluie' : decor?.effect === 'neige' || decor?.effect === 'froid' ? 'neige' : null)
      kind = k === 'pluie' || k === 'rain' ? 'pluie' : k === 'neige' || k === 'snow' ? 'neige' : null
      const max = kind === 'pluie' ? 40 : 30
      const asked = Number(decor?.particles?.count)
      count = kind ? Math.min(max, Number.isFinite(asked) && asked > 0 ? asked : decor?.effect === 'froid' ? 8 : max) : 0
    },
    setReducedMotion(v) {
      rm = Boolean(v)
    },
    get kind() {
      return rm ? null : kind
    },
    update(t) {
      rain.visible = !rm && kind === 'pluie'
      snow.visible = !rm && kind === 'neige'
      if (rm || !kind) return false
      const h = BOX.yTop - BOX.yBottom
      if (kind === 'pluie') {
        const a = rainGeo.attributes.position
        for (let i = 0; i < N; i++) {
          const [sx, sy, sz, sp] = seeds[i]
          const y = BOX.yTop - ((sy * h + (t / 1000) * 2.6 * sp) % h)
          const on = i < count
          a.setXYZ(i * 2, sx * BOX.x, on ? y : -50, sz * BOX.z)
          a.setXYZ(i * 2 + 1, sx * BOX.x - 0.01, on ? y - 0.12 : -50, sz * BOX.z)
        }
        a.needsUpdate = true
      } else {
        const a = snowGeo.attributes.position
        for (let i = 0; i < N; i++) {
          const [sx, sy, sz, sp] = seeds[i]
          const y = BOX.yTop - ((sy * h + (t / 1000) * 0.35 * sp) % h)
          const on = i < count
          a.setXYZ(i, sx * BOX.x + 0.06 * Math.sin(t / 900 + i), on ? y : -50, sz * BOX.z)
        }
        a.needsUpdate = true
      }
      return true
    },
  }
}
