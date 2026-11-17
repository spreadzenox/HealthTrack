// effets.js — les petits effets dessinés des expressions (SPEC personnage § 8) : étincelles de Rayonnant, anneaux
// lilas de Concentré, « z » d'Endormi, cœurs de Réconfortant et du câlin, trois traits de Surpris. Des sprites peints
// sur une toile ; ils ne dessinent rien quand ils ne servent pas (invisibles = aucun appel de dessin).
import { clamp, sstep, H, BY } from './forme.js'

const hop = (p) => (p <= 0 || p >= 1 ? 0 : 4 * p * (1 - p))

export function createEffets(THREE, M, parent) {
  const group = new THREE.Group()
  group.name = 'pilou-effets'
  parent.add(group)
  const owned = []
  const tex = (S, draw) => { const t = M.canvasTex(S, S, draw); owned.push(t); return t }
  const sprite = (map, color = '#ffffff') => {
    const m = new THREE.SpriteMaterial({ map, color: new THREE.Color(color), transparent: true, depthWrite: false, opacity: 0 })
    owned.push(m)
    const s = new THREE.Sprite(m)
    s.visible = false
    group.add(s)
    return s
  }
  const etoile = tex(64, (x, S) => {
    const c = S / 2
    x.fillStyle = '#FFE08A'
    x.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2, r = i % 2 ? c * 0.22 : c * 0.95
      x.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r)
    }
    x.closePath()
    x.fill()
  })
  const coeur = tex(64, (x, S) => {
    x.fillStyle = '#FF8A8A'
    x.beginPath()
    x.moveTo(S / 2, S * 0.84)
    x.bezierCurveTo(S * 0.05, S * 0.52, S * 0.12, S * 0.12, S / 2, S * 0.32)
    x.bezierCurveTo(S * 0.88, S * 0.12, S * 0.95, S * 0.52, S / 2, S * 0.84)
    x.fill()
  })
  const zz = tex(64, (x, S) => {
    x.strokeStyle = '#6A84D6'
    x.lineWidth = S * 0.12
    x.lineCap = 'round'
    x.lineJoin = 'round'
    x.beginPath()
    x.moveTo(S * 0.24, S * 0.26); x.lineTo(S * 0.76, S * 0.26); x.lineTo(S * 0.24, S * 0.74); x.lineTo(S * 0.76, S * 0.74)
    x.stroke()
  })
  const trait = tex(64, (x, S) => {
    x.strokeStyle = '#4A332B'
    x.lineWidth = S * 0.14
    x.lineCap = 'round'
    x.beginPath()
    x.moveTo(S / 2, S * 0.15); x.lineTo(S / 2, S * 0.85)
    x.stroke()
  })
  const stars = Array.from({ length: 6 }, () => sprite(etoile))
  const hearts = Array.from({ length: 3 }, () => sprite(coeur))
  const zs = Array.from({ length: 3 }, () => sprite(zz))
  const lines = Array.from({ length: 3 }, () => sprite(trait))
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#A08CF7'), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0 })
  const ringGeo = new THREE.RingGeometry(0.58, 0.62, 40)
  owned.push(ringMat, ringGeo)
  const rings = Array.from({ length: 3 }, () => {
    const r = new THREE.Mesh(ringGeo, ringMat.clone())
    owned.push(r.material)
    r.rotation.x = -Math.PI / 2
    r.visible = false
    group.add(r)
    return r
  })
  const all = [...stars, ...hearts, ...zs, ...lines, ...rings]
  const top = H + BY

  function show(o, op, scale) {
    o.visible = op > 0.01
    o.material.opacity = clamp(op)
    if (scale !== undefined) o.scale.setScalar(scale)
  }

  /** eff = animateur.effets(τ) ; lift = hauteur de Pilou (lévitation, saut). */
  function update(eff, τ, lift = 0) {
    for (const o of all) o.visible = false
    const s = eff.etincelles
    if (s) {
      stars.forEach((o, i) => {
        const a = (i / stars.length) * Math.PI * 2 + τ / 3000
        const tw = 0.5 + 0.5 * Math.sin(τ / 260 + i * 1.7)
        o.position.set(Math.cos(a) * 0.95, 0.95 + 0.32 * Math.sin(a * 2 + i) + lift, Math.sin(a) * 0.5 + 0.25)
        show(o, s.w * (0.35 + 0.65 * tw), 0.09 + 0.07 * tw)
      })
    }
    const r = eff.anneaux
    if (r) {
      rings.forEach((o, i) => {
        const p = (((r.u + i * 900) % 2700) + 2700) % 2700 / 2700
        o.position.set(0, 0.32 + lift, 0)
        o.scale.setScalar(0.9 + 1.3 * p)
        show(o, r.w * 0.55 * (1 - p) * sstep(0, 0.1, p))
      })
    }
    const z = eff.z
    if (z) {
      zs.forEach((o, i) => {
        const p = (((z.u + i * 700) % 2100) + 2100) % 2100 / 2100
        o.position.set(0.28 + 0.3 * p, top + 0.05 + 0.6 * p, 0.2)
        show(o, z.w * hop(p) * 1.4, 0.1 + 0.1 * p)
      })
    }
    const c = eff.coeurs
    if (c) {
      if (c.fixe) {
        hearts[0].position.set(0.45, top - 0.1, 0.45)
        show(hearts[0], c.w, 0.16)
      } else {
        hearts.forEach((o, i) => {
          const p = (((c.u + i * 650) % 1950) + 1950) % 1950 / 1950
          o.position.set(-0.3 + 0.3 * i + 0.08 * Math.sin(p * 6 + i), top - 0.35 + 0.7 * p + lift, 0.5)
          show(o, c.w * hop(p) * 1.3, 0.15 + 0.07 * p)
        })
      }
    }
    const t = eff.traits
    if (t) {
      const p = clamp(t.u / 520)
      lines.forEach((o, i) => {
        const a = (i - 1) * 0.5
        o.position.set(Math.sin(a) * (0.42 + 0.08 * p), top + 0.1 + Math.cos(a) * (0.12 + 0.08 * p) + lift, 0.2)
        o.material.rotation = -a
        show(o, t.w * sstep(0, 0.15, p), 0.12)
      })
    }
  }
  function dispose() { for (const o of owned) o.dispose?.(); group.removeFromParent() }
  return { group, update, dispose }
}
