/**
 * Pilou simple de l'étape 8 (« corps et yeux de base », brief § 10) : il tient la place du Pilou du lot PILOU tant que
 * `companion/pilou/index.js` n'existe pas, avec **la même API** (CONTRAT.md § 3). Silhouette et palette de la planche
 * (§ 7.2) : galet menthe en vinyle verni, ventre crème, joues, antenne et point ambre qui luit, montre au poignet.
 * Animation : fonctions du temps (respiration, balancement, clignements à graine, saut, toucher), jamais triste.
 */
import { rng } from './noise'
import { EASE, spring, seg } from './curves'

const PALETTE = {
  body: '#78D8B4',
  belly: '#FFF1DC',
  feet: '#4FC097',
  antenna: '#33B989',
  amber: '#FFB84D',
  cheek: '#FF8A8A',
  eye: '#2B1C14',
  mouth: '#7C3A35',
  strap: '#5B5F9E',
}

// silhouette (unités du monde) : corps de hauteur ≈ 1,0 posé sur les pieds, largeur 0,87
const BODY = { y0: 0.07, h: 1.0, w: 0.87 }
const EYE_Y = BODY.y0 + BODY.h * 0.66
const MOUTH_Y = BODY.y0 + BODY.h * 0.53

function bodyRadius(v) {
  // v ∈ [0, 1] du bas vers le haut : galet un peu plus large en bas
  // galet : bas plein, haut arrondi (pas de pointe)
  const x = 2 * v - 1
  const base = Math.sqrt(Math.max(0, 1 - x * x))
  const egg = 1 - 0.13 * Math.max(0, v - 0.4)
  return (BODY.w / 2) * Math.pow(base, 0.85) * egg
}

/** Mélange tranquille → content → rayonnant selon l'humeur (SPEC personnage § 9). */
export function moodSmile(m) {
  return 0.55 + 0.45 * Math.min(1, Math.max(0, m))
}

export function createPlaceholderPilou(THREE, { quality = 'haut', reducedMotion = false, seed = 3 } = {}) {
  const root = new THREE.Group()
  root.name = 'pilou'
  const body = new THREE.Group()
  root.add(body)
  const physical = quality !== 'bas'

  const mat = (opts) =>
    physical
      ? new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.72, clearcoatRoughness: 0.13, ...opts, ...(quality === 'haut' ? { sheen: 0.3, sheenColor: new THREE.Color('#E8FFF4') } : {}) })
      : new THREE.MeshStandardMaterial({ roughness: 0.45, ...opts })

  // --- corps : tour + couleurs peintes au sommet (ventre au bord irrégulier, joues à l'aérographe)
  const prof = []
  const rows = quality === 'haut' ? 40 : 28
  for (let i = 0; i <= rows; i++) {
    const v = i / rows
    prof.push(new THREE.Vector2(Math.max(1e-4, bodyRadius(v)), BODY.y0 + v * BODY.h))
  }
  const bodyGeo = new THREE.LatheGeometry(prof, quality === 'haut' ? 48 : 32)
  bodyGeo.rotateY(Math.PI) // couture derrière
  const pos = bodyGeo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const cBody = new THREE.Color(PALETTE.body), cBelly = new THREE.Color(PALETTE.belly), cCheek = new THREE.Color(PALETTE.cheek)
  const c = new THREE.Color()
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k)
    const v = (y - BODY.y0) / BODY.h
    const front = z / Math.max(1e-4, Math.hypot(x, z))
    // ventre : ellipse sur l'avant-bas, bord légèrement irrégulier
    const th = Math.atan2(x, z)
    const wob = 0.025 * Math.sin(th * 7 + 1.3) + 0.015 * Math.sin(th * 13)
    const belly = (th / 1.05) ** 2 + ((v - 0.2) / 0.3) ** 2
    const bellyMix = 1 - THREE.MathUtils.smoothstep(belly, 0.9 + wob, 1.02 + wob)
    c.copy(cBody).lerp(cBelly, front > 0 ? bellyMix : 0)
    // joues : deux taches douces de part et d'autre de la bouche
    for (const sx of [-1, 1]) {
      const d = Math.hypot((th - sx * 0.62) / 0.2, (v - 0.56) / 0.07)
      c.lerp(cCheek, 0.62 * Math.max(0, 1 - d) ** 1.6)
    }
    colors.set([c.r, c.g, c.b], k * 3)
  }
  bodyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  bodyGeo.computeVertexNormals()
  const bodyMesh = new THREE.Mesh(bodyGeo, mat({ vertexColors: true, color: '#ffffff' }))
  bodyMesh.name = 'corps'
  body.add(bodyMesh)

  const surfaceZ = (y, x) => {
    const v = (y - BODY.y0) / BODY.h
    const r = bodyRadius(v)
    return Math.sqrt(Math.max(0, r * r - x * x))
  }

  // --- yeux : grands globes sombres vernis, iris brun chaud, pupille, reflets (pas de blanc d'œil)
  const irisTex = (() => {
    const S = 128
    const cv = typeof document !== 'undefined' ? document.createElement('canvas') : null
    if (!cv?.getContext) return null
    cv.width = cv.height = S
    const g = cv.getContext('2d')
    if (!g) return null
    const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
    grad.addColorStop(0, '#0E0907')
    grad.addColorStop(0.36, '#0E0907')
    grad.addColorStop(0.42, '#6E4A2C')
    grad.addColorStop(0.75, '#4A2F1C')
    grad.addColorStop(0.95, '#140C08')
    grad.addColorStop(1, '#0E0907')
    g.fillStyle = grad
    g.fillRect(0, 0, S, S)
    g.strokeStyle = 'rgba(214,170,110,0.35)'
    g.lineWidth = 1.2
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2
      g.beginPath()
      g.moveTo(S / 2 + Math.cos(a) * S * 0.2, S / 2 + Math.sin(a) * S * 0.2)
      g.lineTo(S / 2 + Math.cos(a) * S * 0.4, S / 2 + Math.sin(a) * S * 0.4)
      g.stroke()
    }
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })()
  const eyeMat = physical
    ? new THREE.MeshPhysicalMaterial({ color: PALETTE.eye, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04 })
    : new THREE.MeshStandardMaterial({ color: PALETTE.eye, roughness: 0.2 })
  const irisMat = new THREE.MeshBasicMaterial({ map: irisTex, color: irisTex ? '#ffffff' : '#5A3A24', transparent: false })
  const glintMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
  const eyes = []
  for (const sx of [-1, 1]) {
    const ex = sx * 0.155
    const eye = new THREE.Group()
    eye.position.set(ex, EYE_Y, surfaceZ(EYE_Y, ex) - 0.035)
    eye.rotation.y = sx * 0.32
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), eyeMat)
    ball.scale.set(1, 1.12, 0.62)
    const pupilGroup = new THREE.Group()
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.052, 24), irisMat)
    iris.position.z = 0.0468
    const glint = new THREE.Mesh(new THREE.CircleGeometry(0.013, 10), glintMat)
    glint.position.set(-0.02, 0.026, 0.0475)
    const glint2 = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 8), glintMat)
    glint2.position.set(0.021, -0.02, 0.0475)
    pupilGroup.add(iris)
    eye.add(ball, pupilGroup, glint, glint2)
    body.add(eye)
    eyes.push({ group: eye, pupilGroup, iris, baseY: eye.scale.y })
  }

  // --- bouche (arc souriant)
  const mouthMat = new THREE.MeshStandardMaterial({ color: PALETTE.mouth, roughness: 0.5 })
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 18, Math.PI), mouthMat)
  mouth.rotation.z = Math.PI
  mouth.position.set(0, MOUTH_Y + 0.02, surfaceZ(MOUTH_Y, 0) - 0.004)
  body.add(mouth)

  // --- bras (0,26) et pieds plats
  const armGeo = new THREE.CapsuleGeometry(0.062, 0.15, 4, 10)
  const armMat = mat({ color: PALETTE.body })
  const arms = []
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group()
    pivot.position.set(sx * (BODY.w / 2 - 0.03), BODY.y0 + BODY.h * 0.42, 0.02)
    const arm = new THREE.Mesh(armGeo, armMat)
    arm.position.set(sx * 0.07, -0.08, 0)
    arm.rotation.z = sx * 0.55
    pivot.add(arm)
    body.add(pivot)
    arms.push({ pivot, arm, side: sx })
  }
  // montre au poignet gauche (de Pilou) : bracelet indigo, boîtier chromé
  const watch = new THREE.Group()
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.016, 6, 16), mat({ color: PALETTE.strap }))
  strap.rotation.x = Math.PI / 2
  const caseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.018, 16),
    physical ? new THREE.MeshPhysicalMaterial({ color: '#E6E8EE', metalness: 1, roughness: 0.18 }) : new THREE.MeshStandardMaterial({ color: '#D8DAE0', metalness: 0.8, roughness: 0.3 }),
  )
  caseMesh.rotation.x = Math.PI / 2
  caseMesh.position.z = 0.066
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.024, 16), new THREE.MeshBasicMaterial({ color: '#2E335C' }))
  face.position.z = 0.0755
  watch.add(strap, caseMesh, face)
  watch.position.set(-0.07 - 0.045, -0.15, 0)
  arms[0].pivot.add(watch)

  const footGeo = new THREE.SphereGeometry(0.13, 16, 10)
  footGeo.scale(1, 0.45, 1.25)
  const footMat = mat({ color: PALETTE.feet, roughness: 0.62, clearcoat: physical ? 0.4 : undefined })
  for (const sx of [-1, 1]) {
    const foot = new THREE.Mesh(footGeo, footMat)
    foot.position.set(sx * 0.17, 0.05, 0.06)
    root.add(foot)
  }

  // --- écharpe (cadeau du jour 3) : rayures orange et rouge, une queue qui pend
  const scarf = new THREE.Group()
  const stripeA = mat({ color: '#FF8A4C' }), stripeB = mat({ color: '#E8483F' })
  const scarfY = BODY.y0 + BODY.h * 0.42
  const scarfR = bodyRadius(0.42) + 0.012
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(scarfR, 0.022, 6, 32), i % 2 ? stripeB : stripeA)
    ring.rotation.x = Math.PI / 2
    ring.position.y = scarfY - 0.03 + i * 0.03
    scarf.add(ring)
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.02), stripeA)
  tail.position.set(0.14, scarfY - 0.11, scarfR - 0.03)
  tail.rotation.z = 0.15
  scarf.add(tail)
  scarf.visible = false
  body.add(scarf)

  // --- antenne laquée et point ambre qui luit de l'intérieur (halo en sprite additif)
  const antennaPivot = new THREE.Group()
  antennaPivot.position.set(0, BODY.y0 + BODY.h - 0.01, 0)
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.01, 0.12, 0),
    new THREE.Vector3(0.06, 0.22, 0.01),
    new THREE.Vector3(0.14, 0.255, 0.02),
  ])
  const antenna = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.018, 6), mat({ color: PALETTE.antenna, roughness: 0.3, clearcoat: physical ? 1 : undefined }))
  const amberMat = new THREE.MeshStandardMaterial({ color: PALETTE.amber, emissive: '#FF9A2E', emissiveIntensity: 0.9, roughness: 0.25 })
  const amber = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), amberMat)
  amber.position.copy(curve.getPoint(1)).add(new THREE.Vector3(0.03, 0.005, 0))
  const haloTex = (() => {
    const S = 64
    const d = new Uint8Array(S * S * 4)
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const r = Math.hypot(x - S / 2 + 0.5, y - S / 2 + 0.5) / (S / 2)
      const a = Math.max(0, 1 - r) ** 2.2
      const i = (y * S + x) * 4
      d[i] = 255; d[i + 1] = 200; d[i + 2] = 120; d[i + 3] = Math.round(a * 255)
    }
    const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat)
    t.needsUpdate = true
    t.magFilter = THREE.LinearFilter
    return t
  })()
  const haloMat = new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 })
  const halo = new THREE.Sprite(haloMat)
  halo.scale.setScalar(0.32)
  halo.position.copy(amber.position)
  antennaPivot.add(antenna, amber, halo)
  body.add(antennaPivot)

  // --- état et animation (fonctions du temps)
  const r = rng(seed)
  const blinks = []
  for (let t = 1200; t < 120000; t += 2700 + r() * 2400) {
    blinks.push(t)
    if (r() < 0.18) blinks.push(t + 260)
  }
  const BLINK_PERIOD = blinks[blinks.length - 1] + 3000
  let rm = Boolean(reducedMotion)
  let mood = 0
  let expression = 'tranquille'
  let sequence = null // { name, at, onEnd }
  let look = 'camera'
  let jumpAt = -Infinity
  let jumpSide = 0
  let tapAt = -Infinity
  let hugging = false
  let lastT = 0
  const tmp = new THREE.Vector3()

  function blinkAt(t) {
    const local = t % BLINK_PERIOD
    let v = 0
    for (const b of blinks) {
      const d = local - b
      if (d < -10) break
      if (d < 60) v = Math.max(v, EASE.in(seg(d, 0, 60)))
      else if (d < 85) v = 1
      else if (d < 170) v = Math.max(v, 1 - EASE.out(seg(d, 85, 170)))
    }
    return v
  }

  function eyeOpenness(t) {
    if (expression === 'endormi') return 0.08
    if (hugging) return 0.12
    const happy = expression === 'rayonnant' || expression === 'fier' ? 0.55 : mood > 0.85 ? 0.75 : 1
    return Math.max(0.06, happy * (1 - blinkAt(t)))
  }

  const api = {
    object3d: root,
    anchors: { head: antennaPivot, belly: bodyMesh, handLeft: arms[0].pivot, handRight: arms[1].pivot, antennaTip: amber },
    update(t) {
      lastT = t
      const calm = rm ? 0 : 1
      // respiration 3,5 s, balancement 8 s
      const breath = 1 + calm * (0.012 + 0.012 * mood) * Math.sin((t / 3500) * Math.PI * 2)
      let sq = 0
      let lift = 0
      // toucher : écrasement de 90 ms puis ressort vif
      const dtTap = t - tapAt
      if (!rm && dtTap >= 0 && dtTap < 700) sq += -0.11 * (dtTap < 90 ? EASE.out(dtTap / 90) : 1 - spring(dtTap - 90, 420, 14))
      // saut d'éclatement : anticipation 60–200, vol 220–600, atterrissage au ressort
      const dj = t - jumpAt
      let armLift = 0
      if (!rm && dj >= 0 && dj < 1200) {
        if (dj < 200) sq += -0.16 * EASE.in(seg(dj, 60, 200))
        else if (dj < 600) {
          const u = seg(dj, 220, 600)
          lift = 0.15 * 4 * u * (1 - u)
          sq += 0.06 * (1 - u)
        } else sq += -0.1 * (1 - spring(dj - 600, 320, 12))
        armLift = dj > 100 && dj < 900 ? EASE.out(seg(dj, 100, 260)) * (1 - seg(dj, 700, 900)) : 0
      }
      body.scale.set(1 - sq * 0.5, breath * (1 + sq), 1 - sq * 0.5)
      root.position.y = lift
      body.rotation.z = calm * 0.035 * Math.sin((t / 8000) * Math.PI * 2)
      // bras : repos, joie, bras du côté de la bulle qui se lève
      const joy = expression === 'rayonnant' ? 0.25 * Math.sin(t / 125) * calm : 0
      for (const a of arms) {
        const up = a.side === jumpSide ? armLift * 1.6 : 0
        a.pivot.rotation.z = a.side * (0.05 + 0.25 * mood + up) + joy * a.side + calm * 0.03 * Math.sin(t / 900 + a.side)
      }
      // antenne : suit le corps avec retard (ressort simple dans le temps)
      antennaPivot.rotation.z = calm * (0.06 * Math.sin((t - 110) / 8000 * Math.PI * 2) - 0.25 * lift)
      // yeux : clignements, regard
      const open = eyeOpenness(t)
      for (const e of eyes) e.group.scale.y = open
      let lx = 0, ly = 0
      if (look && look !== 'camera') {
        tmp.set(look.x ?? 0, look.y ?? 0, look.z ?? 0)
        lx = Math.max(-1, Math.min(1, tmp.x / 1.8))
        ly = Math.max(-1, Math.min(1, (tmp.y - EYE_Y) / 1.5))
      }
      for (const e of eyes) e.pupilGroup.position.set(lx * 0.016, ly * 0.014, 0)
      // bouche : sourire selon l'humeur
      const smile = expression === 'endormi' ? 0.4 : moodSmile(mood) + (expression === 'rayonnant' || expression === 'fier' ? 0.25 : 0)
      mouth.scale.set(smile, smile * (hugging ? 0.8 : 1), 1)
      // lueur du point ambre (2 400 ms)
      amberMat.emissiveIntensity = 0.75 + 0.25 * mood + 0.15 * Math.sin((t / 2400) * Math.PI * 2)
      haloMat.opacity = 0.45 + 0.25 * mood
      // séquences jouées une fois
      if (sequence && t - sequence.at > (sequence.name === 'reconfortant' ? 4200 : sequence.name === 'reveil' ? 2400 : 1000)) {
        const done = sequence
        sequence = null
        expression = done.prev
        done.onEnd?.()
      }
    },
    setExpression(name) {
      expression = name
    },
    play(name, { onEnd } = {}) {
      sequence = { name, at: lastT, onEnd, prev: expression === name ? 'tranquille' : expression }
      expression = name === 'reveil' ? 'content' : name
    },
    setMood(m) {
      mood = Math.min(1, Math.max(0, Number(m) || 0))
    },
    lookAt(target) {
      look = target
    },
    react(gesture) {
      if (gesture === 'tap' || gesture === 'doubletap' || gesture === 'tickle' || gesture === 'swipe') tapAt = lastT
      if (gesture === 'doubletap') { jumpAt = lastT; jumpSide = 0 }
      if (gesture === 'longpress-start') hugging = true
      if (gesture === 'longpress-end') hugging = false
    },
    jump({ side } = {}) {
      jumpAt = lastT
      jumpSide = side === 'left' ? -1 : side === 'right' ? 1 : 0
    },
    setReducedMotion(v) {
      rm = Boolean(v)
    },
    setTraits() { /* le double numérique arrive avec le Pilou du lot PILOU (étape 14) */ },
    setAccessory(name, on) {
      if (name === 'montre') watch.visible = on !== false
      if (name === 'echarpe') scarf.visible = on !== false
    },
    hitTest(ndcX, ndcY, camera) {
      const box = new THREE.Box3().setFromObject(root)
      const pts = [
        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z),
      ].map((p) => p.project(camera))
      const pad = 0.04
      return ndcX >= Math.min(pts[0].x, pts[1].x) - pad && ndcX <= Math.max(pts[0].x, pts[1].x) + pad && ndcY >= Math.min(pts[0].y, pts[1].y) - pad && ndcY <= Math.max(pts[0].y, pts[1].y) + pad
    },
    stats() {
      let triangles = 0, drawCalls = 0
      root.traverse((o) => {
        if (o.isMesh || o.isSprite) {
          drawCalls++
          const g = o.geometry
          triangles += g.index ? g.index.count / 3 : (g.attributes.position?.count || 0) / 3
        }
      })
      return { triangles: Math.round(triangles), drawCalls }
    },
    get expression() {
      return expression
    },
    dispose() {
      root.traverse((o) => {
        o.geometry?.dispose?.()
        if (o.material) {
          o.material.map?.dispose?.()
          o.material.dispose?.()
        }
      })
    },
  }
  return api
}

/** Même nom que l'export du lot PILOU (CONTRAT.md § 3). */
export const createPilou = createPlaceholderPilou
