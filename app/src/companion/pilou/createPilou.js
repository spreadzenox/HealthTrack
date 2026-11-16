// createPilou.js — Pilou en 3D : corps de figurine en vinyle verni (brief § 7.3), yeux de la créature (§ 7.4),
// antenne laquée et point ambre en verre qui luit, montre à l'heure réelle, ombre de contact facultative.
// createPilou(THREE, options) → { object, update(τ, camera), setExpression, react, geste, regarderPoint, … }
// Le module ne crée ni rendu, ni scène, ni lumière : la scène (lot SCÈNE) l'ajoute et l'éclaire ; il lui faut
// seulement scene.environment (PMREM) pour les reflets du vernis et des yeux.
// Références : journal/maquettes/compagnon/rendu/figurine/figurine.js et rendu/creature/creature.js.
import { clamp, lerp, sstep, H, BY, bodyR, rAtY, PAL, FS, FY } from './forme.js'
import { makeMatiere, rngF } from './matiere.js'
import { drawVisage, faceKey } from './visage.js'
import { createAnimateur } from './animateur.js'
import { HAPTIQUE } from './gestes.js'

// Paliers de qualité (brief § 7.9) : « haut » ≤ 10 000 triangles ; « moyen » sans sheen, moins de segments.
// Le palier « bas » n'a pas de 3D : images pré-rendues (images/).
export const QUALITE = {
  haut: { corps: [34, 50], oeil: [22, 16], paupiere: [22, 5], membre: [4, 12], pied: [18, 10], antenne: [20, 8], perle: [16, 12], montre: 24, jonction: 32, sheen: 0.3, visage: 512, iris: 512 },
  moyen: { corps: [26, 38], oeil: [16, 12], paupiere: [16, 4], membre: [3, 10], pied: [14, 8], antenne: [14, 6], perle: [12, 8], montre: 18, jonction: 24, sheen: 0, visage: 512, iris: 256 },
}
export const IRIS_DEFAUT = '#6E4A2C'

// Équilibre des blancs de la peinture : sous la lumière dorée, le menthe vire au sauge (brief § 7.2, § 11) ;
// la peinture est donc un peu plus froide que la planche, pour que la zone éclairée reste à ΔE ≤ 6 de #78D8B4.
export const BALANCE = [0.5, 0.88, 1.12]
const SSS = { wrap: [0.42, 0.3, 0.26], col: '#FFC896', amt: 0.42, dist: 0.55, pow: 2.6 }

export function createPilou(THREE, options = {}) {
  const {
    qualite = 'haut', seed = 7, nom = 'Pilou', reduit = false, iris = IRIS_DEFAUT, ombre = true,
    document: doc = globalThis.document, maintenant = () => new Date(),
  } = options
  const Q = QUALITE[qualite] || QUALITE.haut
  const makeCanvas = (w, h) => {
    const c = doc.createElement('canvas')
    c.width = w
    c.height = h
    return c
  }
  const ctx2d = (c) => { try { return c.getContext('2d') } catch { return null } }
  const M = makeMatiere(THREE, makeCanvas)
  const C = (h) => new THREE.Color(h)
  const V2 = (x, y) => new THREE.Vector2(x, y)
  const anim = createAnimateur({ seed, reduit, nom })
  const disposables = []
  const keep = (x) => { disposables.push(x); return x }

  const root = new THREE.Group()
  root.name = 'pilou'
  const body = new THREE.Group()
  body.rotation.order = 'ZXY'
  root.add(body)

  const balU = { value: new THREE.Vector3(...(options.balance || BALANCE)) }

  /* ---------- vinyle verni : la matière commune ---------- */
  function vinyl(hex, o = {}) {
    return keep(new THREE.MeshPhysicalMaterial({
      envMap: options.envMap || null,
      color: C(hex), roughness: o.rough ?? 0.52, metalness: 0,
      clearcoat: o.cc ?? 0.72, clearcoatRoughness: o.ccr ?? 0.13,
      clearcoatNormalMap: M.peel, clearcoatNormalScale: V2(0.16, 0.16),
      sheen: Q.sheen * (o.sheenK ?? 1), sheenColor: C('#E9FFF6'), sheenRoughness: 0.5, specularIntensity: 0.55,
    }))
  }
  // la peau de vinyle des bras, des paupières, des pieds : sous-surface douce (bord chaud en contre-jour)
  function vinylSSS(hex, key, thick, o = {}) {
    return M.patchMat(vinyl(hex, o), {
      key: `${key}-${qualite}`, uniforms: { uThick: { value: thick }, uBal: balU }, sss: SSS,
      vDecl: 'varying vec3 vObj;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;']],
      fDecl: 'varying vec3 vObj; uniform float uThick; uniform vec3 uBal;',
      frep: [
        ['#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= uBal * (.96 + .06 * fbm3(vObj * 9.));'],
        ['#include <lights_fragment_begin>', `{ float ndv = saturate(dot(normal, normalize(vViewPosition)));
            sssK = uThick * (.1 + .9 * pow(1. - ndv, 2.)) * .8; }
          #include <lights_fragment_begin>`],
      ],
    })
  }

  /* ---------- le corps : ventre peint au bord irrégulier, visage peint et projeté, sous-surface ---------- */
  const FACE_S = Q.visage
  const faceCv = makeCanvas(FACE_S, FACE_S)
  const faceCtx = ctx2d(faceCv)
  const faceTex = keep(new THREE.CanvasTexture(faceCv))
  faceTex.colorSpace = THREE.SRGBColorSpace
  faceTex.generateMipmaps = false
  faceTex.minFilter = THREE.LinearFilter
  const bodyU = {
    uFace: { value: faceTex }, uBellyCol: { value: C(PAL.belly) },
    uDark: { value: C('#5CC69F') }, uLight: { value: C('#8BE3C2') }, uThick: { value: 0.9 }, uBal: balU,
  }
  const bodyMat = M.patchMat(vinyl(PAL.menthe), {
    key: `pilou-corps-${qualite}`, uniforms: bodyU, sss: SSS,
    vDecl: 'varying vec3 vObj; varying vec3 vObjN;',
    vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvObj = position; vObjN = normal;']],
    fDecl: `varying vec3 vObj; varying vec3 vObjN; uniform sampler2D uFace; uniform vec3 uBellyCol, uDark, uLight, uBal; uniform float uThick;
            float bellyM = 0.; float faceA = 0.;`,
    frep: [
      ['#include <color_fragment>', `#include <color_fragment>
      {
        float yh = vObj.y / ${H.toFixed(3)};
        vec3 mint = mix(diffuseColor.rgb, uDark, smoothstep(.5, .02, yh) * .55);
        mint = mix(mint, uLight, smoothstep(.68, 1., yh) * .5);
        mint *= uBal * (1. + .03 * (fbm3(vObj * 6.) - .5));
        float ph = atan(vObj.x, vObj.z);
        float eB = pow(ph / .9, 2.) + pow((vObj.y - .34) / .25, 2.);
        float th = .965 + .06 * (fbm3(vObj * vec3(5., 6., 5.)) - .5) + .016 * (vnoise(vObj * 40.) - .5);
        bellyM = 1. - smoothstep(th - .022, th + .006, eB);
        vec3 belly = uBellyCol * (1. + .03 * (vnoise(vObj * vec3(10., 70., 10.)) - .5));
        diffuseColor.rgb = mix(mint, belly * mix(vec3(1.), uBal, .12), bellyM);
        float front = smoothstep(.05, .3, vObjN.z);
        vec2 fuv = vec2(.5 + vObj.x / ${(2 * FS).toFixed(3)}, .5 + (vObj.y - ${FY.toFixed(3)}) / ${(2 * FS).toFixed(3)});
        vec4 fc = texture2D(uFace, fuv);
        float inF = step(abs(fuv.x - .5), .5) * step(abs(fuv.y - .5), .5);
        faceA = fc.a * front * inF;
        diffuseColor.rgb = mix(diffuseColor.rgb, fc.rgb, faceA);
        diffuseColor.rgb *= mix(.86, 1., smoothstep(.0, .3, vObj.y));
      }`],
      ['#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = roughnessFactor * (.88 + .24 * fbm3(vObj * 7.)) + .06 * bellyM;`],
      ['#include <lights_fragment_begin>', `{ float ndv = saturate(dot(normal, normalize(vViewPosition)));
          sssK = uThick * .85 * pow(1. - ndv, 2.6) * (1. - faceA);
          sssTint = mix(vec3(1.), vec3(1.1, .92, .88), bellyM * .4); }
        #include <lights_fragment_begin>`],
    ],
  })
  const [cRows, cSegs] = Q.corps
  const prof = []
  for (let i = 0; i <= cRows; i++) {
    const t = (i / cRows) * Math.PI
    prof.push(V2(Math.max(1e-4, bodyR(t)), ((1 - Math.cos(t)) / 2) * H))
  }
  const bodyGeo = keep(new THREE.LatheGeometry(prof, cSegs, Math.PI, Math.PI * 2))
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
  bodyMesh.position.y = BY
  bodyMesh.name = 'pilou-corps'
  body.add(bodyMesh)

  let lastFace = ''
  function paintFace(F) {
    if (!faceCtx) return
    const k = faceKey(F)
    if (k === lastFace) return
    lastFace = k
    drawVisage(faceCtx, FACE_S, F)
    faceTex.needsUpdate = true
  }

  /* ---------- les yeux de la créature : globes 3D, cornée vernie, iris réfracté, pupille vivante ---------- */
  const irisCv = makeCanvas(Q.iris, Q.iris)
  const irisCtx = ctx2d(irisCv)
  const irisTex = keep(new THREE.CanvasTexture(irisCv))
  irisTex.colorSpace = THREE.SRGBColorSpace
  function paintIris(hex) {
    if (!irisCtx) return
    const S = Q.iris
    const c = S / 2
    const x = irisCtx
    const r = rngF(77)
    const base = C(hex)
    const dark = C('#0E0907')
    const stop = (k) => '#' + base.clone().lerp(dark, k).getHexString()
    x.setTransform(1, 0, 0, 1, 0, 0)
    const g = x.createRadialGradient(c, c, 0, c, c, c)
    g.addColorStop(0, stop(0)); g.addColorStop(0.32, stop(0.18)); g.addColorStop(0.5, stop(0.45))
    g.addColorStop(0.78, stop(0.7)); g.addColorStop(0.93, stop(0.9)); g.addColorStop(1, stop(1))
    x.fillStyle = g
    x.fillRect(0, 0, S, S)
    const sc = S / 512
    for (let i = 0; i < 1100; i++) { // fibres radiales
      const a = r() * Math.PI * 2, r0 = (0.3 + r() * 0.2) * c, r1 = (0.6 + r() * 0.38) * c, w = (0.6 + r() * 1.6) * sc
      const light = r() < 0.62
      x.strokeStyle = light ? `rgba(255,${(190 + r() * 40) | 0},${(120 + r() * 50) | 0},${0.04 + r() * 0.09})` : `rgba(15,6,2,${0.08 + r() * 0.14})`
      x.lineWidth = w
      x.beginPath()
      x.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0)
      const a2 = a + (r() - 0.5) * 0.08
      x.quadraticCurveTo(c + Math.cos(a + 0.03) * (r0 + r1) / 2, c + Math.sin(a + 0.03) * (r0 + r1) / 2, c + Math.cos(a2) * r1, c + Math.sin(a2) * r1)
      x.stroke()
    }
    x.lineWidth = 3 * sc // collerette dorée
    x.strokeStyle = 'rgba(214,160,96,.35)'
    x.beginPath()
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2, rr = c * (0.47 + 0.035 * Math.sin(a * 13) + 0.02 * Math.sin(a * 29))
      if (i) x.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr)
      else x.moveTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr)
    }
    x.closePath()
    x.stroke()
    irisTex.needsUpdate = true
  }
  paintIris(iris)

  const EX = 0.088, EY = 0.108, EZ = 0.07, SINK = 0.034
  const insideBody = (P) => P.x * P.x + P.z * P.z < Math.pow(rAtY(P.y - BY), 2)
  const lidMat = vinylSSS(PAL.menthe, 'pilou-paupiere', 0.7)
  const rimMat = keep(new THREE.MeshPhysicalMaterial({ color: C('#4F8E78'), roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.2 }))
  // bord de la paupière du haut : il fonce quand l'œil se ferme (le trait « ‿ » des yeux fermés)
  const lashMat = keep(rimMat.clone())
  const RIM_OUVERT = C('#4F8E78'), RIM_FERME = C('#24342E')
  const wetMat = keep(new THREE.MeshPhysicalMaterial({ color: C('#4E8E78'), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.04 }))
  const [oS, oR] = Q.oeil
  const ballGeo = keep(new THREE.SphereGeometry(1, oS, oR))
  const [pS, pR] = Q.paupiere
  const lidGeoT = keep(new THREE.SphereGeometry(1.075, pS, pR, 0, Math.PI * 2, 0, Math.PI / 2))
  const lidGeoB = keep(new THREE.SphereGeometry(1.075, pS, pR, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2))
  const ringGeo = keep(new THREE.TorusGeometry(1.075, 0.026, 3, pS))
  const eyes = [-1, 1].map((s) => {
    const yG = 0.9, r = rAtY(yG), x = s * 0.2, z = Math.sqrt(r * r - x * x)
    const dr = (rAtY(yG + 1e-3) - rAtY(yG - 1e-3)) / 2e-3
    const n = new THREE.Vector3(x, -r * dr, z).normalize()
    const fwd = n.clone().lerp(new THREE.Vector3(0, 0, 1), 0.45).normalize()
    const xa = new THREE.Vector3(0, 1, 0).cross(fwd).normalize()
    const ya = fwd.clone().cross(xa)
    const g = new THREE.Group()
    g.position.set(x, yG + BY, z).addScaledVector(fwd, -SINK)
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xa, ya, fwd))
    body.add(g)
    const sc = new THREE.Group()
    sc.scale.set(EX, EY, EZ)
    g.add(sc)
    const U = {
      uCamU: { value: new THREE.Vector3(0, 0, 10) }, uGaze: { value: new THREE.Matrix3() }, uGazeT: { value: new THREE.Matrix3() }, uPupil: { value: 0.4 }, uIris: { value: irisTex },
      uLidT: { value: 0.9 }, uLidB: { value: -0.9 }, uCut: { value: 0.5 }, uKeyU: { value: V2(0, 1) },
    }
    const mat = M.patchMat(keep(new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 0.25, envMapIntensity: 1.25 })), {
      key: 'pilou-oeil', uniforms: U,
      vDecl: 'varying vec3 vU;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvU = position;']],
      fDecl: `varying vec3 vU; uniform vec3 uCamU; uniform mat3 uGaze, uGazeT; uniform float uPupil, uLidT, uLidB, uCut; uniform sampler2D uIris; uniform vec2 uKeyU;
              float eyeOcc = 1.;`,
      frep: [
        ['#include <color_fragment>', `#include <color_fragment>
        {
          vec3 p = normalize(vU);
          vec3 V = normalize(uCamU - vU);
          vec3 rr = refract(-V, p, 1. / 1.34);
          vec3 g = uGaze[2];
          float zI = .6, pg = dot(p, g);
          float den = min(dot(rr, g), -1e-3);
          vec3 hit = p + rr * ((zI - pg) / den);
          vec3 loc = uGazeT * hit;
          vec2 q = loc.xy / .8;
          float rho = pg > zI ? length(q) : 1.3;
          vec2 dir = q / max(rho, 1e-4);
          float tr = mix(.3, 1., clamp((rho - uPupil) / (1. - uPupil), 0., 1.));
          vec3 ic = texture2D(uIris, .5 + .5 * min(tr, 1.) * dir).rgb;
          float pm = 1. - smoothstep(uPupil - .018, uPupil + .018, rho);
          vec3 col = mix(ic, vec3(.006, .004, .004), pm);
          col = mix(col, vec3(.016, .011, .009), smoothstep(.92, 1.06, rho));
          float kl = length(uKeyU);
          float ca = smoothstep(.3, .85, rho) * (1. - smoothstep(.86, 1., rho)) * pow(max(0., dot(dir, -uKeyU / max(kl, 1e-3))), 2.);
          col *= 1. + 3.2 * ca * kl;
          float el = atan(p.y, p.z);
          float sT = smoothstep(uLidT - .55, uLidT + .02, el);
          float sB = 1. - smoothstep(uLidB - .02, uLidB + .3, el);
          float sock = smoothstep(uCut - .03, uCut + .2, p.z);
          eyeOcc = (1. - .82 * sT) * (1. - .4 * sB) * mix(.3, 1., sock);
          diffuseColor.rgb = col;
        }`],
        ['#include <opaque_fragment>', 'outgoingLight *= mix(1., eyeOcc, .88);\n#include <opaque_fragment>'],
      ],
    })
    const ball = new THREE.Mesh(ballGeo, mat)
    ball.name = 'pilou-oeil'
    sc.add(ball)
    // jonction œil / peau : calculée, puis un fin liseré humide qui accroche la lumière
    const pts = []
    let cut = 0
    const tmp = new THREE.Vector3()
    const NJ = 48
    for (let i = 0; i < NJ; i++) {
      const ph = (i / NJ) * Math.PI * 2
      let a = 0, b = Math.PI / 2
      for (let it = 0; it < 22; it++) {
        const m = (a + b) / 2
        tmp.set(Math.sin(m) * Math.cos(ph) * EX, Math.sin(m) * Math.sin(ph) * EY, Math.cos(m) * EZ).applyQuaternion(g.quaternion).add(g.position)
        if (insideBody(tmp)) b = m
        else a = m
      }
      const th = (a + b) / 2
      cut += Math.cos(th)
      pts.push(new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)))
    }
    U.uCut.value = cut / NJ
    const rimPts = pts.map((p) => new THREE.Vector3(p.x * EX, p.y * EY, p.z * EZ))
    const wet = new THREE.Mesh(keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, true), Q.jonction, 0.0042, 4, true)), wetMat)
    g.add(wet)
    // paupières : coques de peau qui glissent sur l'œil, avec une petite ombre et un bord
    const mkLid = (geo, haut) => {
      const pv = new THREE.Group()
      sc.add(pv)
      pv.add(new THREE.Mesh(geo, lidMat))
      const ring = new THREE.Mesh(ringGeo, haut ? lashMat : rimMat)
      ring.rotation.x = Math.PI / 2
      pv.add(ring)
      return pv
    }
    const lidT = mkLid(lidGeoT, true)
    const lidB = mkLid(lidGeoB)
    const q4 = NJ / 4
    const elTop = Math.atan2(pts[q4].y, pts[q4].z)
    const elBot = Math.atan2(pts[3 * q4].y, pts[3 * q4].z)
    return { s, g, sc, U, lidT, lidB, elTop, elBot, ball }
  })

  /* ---------- bras (ressort de traîne) ---------- */
  const limbMat = vinylSSS(PAL.menthe, 'pilou-bras', 1.2)
  const [mR, mS] = Q.membre
  const armGeo = keep(new THREE.CapsuleGeometry(0.085, 0.2, mR, mS))
  const arms = [-1, 1].map((s) => {
    const anchor = new THREE.Group()
    anchor.position.set(s * 0.58, 0.66, 0.06)
    body.add(anchor)
    const pv = new THREE.Group()
    anchor.add(pv)
    const m = new THREE.Mesh(armGeo, limbMat)
    m.position.y = -0.17
    m.name = 'pilou-bras'
    pv.add(m)
    return { anchor, pv }
  })

  /* ---------- la montre (poignet du bras qui salue) : chrome, verre bombé, bracelet émail indigo, heure réelle ---------- */
  const watch = new THREE.Group()
  watch.position.set(0, -0.262, 0)
  watch.scale.setScalar(1.12)
  arms[0].pv.add(watch)
  const hands = (() => {
    const N = Q.montre
    const chrome = keep(new THREE.MeshPhysicalMaterial({ color: C('#F2F3F5'), metalness: 1, roughness: 0.07, clearcoat: 0.4, clearcoatRoughness: 0.02 }))
    const band = keep(new THREE.MeshPhysicalMaterial({ color: C(PAL.bracelet), roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 0.7 }))
    const strap = new THREE.Mesh(keep(new THREE.TorusGeometry(0.093, 0.019, 6, N)), band)
    strap.rotation.x = Math.PI / 2
    strap.scale.set(1, 1, 1.25)
    watch.add(strap)
    const face = new THREE.Group()
    face.position.z = 0.098
    watch.add(face)
    const caseM = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.05, 0.053, 0.026, N)), chrome)
    caseM.rotation.x = Math.PI / 2
    face.add(caseM)
    const bez = new THREE.Mesh(keep(new THREE.TorusGeometry(0.047, 0.0075, 4, N)), chrome)
    bez.position.z = 0.013
    face.add(bez)
    const dialTex = keep(M.canvasTex(128, 128, (x, S) => {
      const c = S / 2
      x.fillStyle = '#16203A'
      x.fillRect(0, 0, S, S)
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        x.strokeStyle = i % 3 === 0 ? 'rgba(160,255,215,.95)' : 'rgba(127,240,196,.5)'
        x.lineWidth = i % 3 === 0 ? 5 : 3
        x.beginPath()
        x.moveTo(c + Math.sin(a) * c * 0.72, c - Math.cos(a) * c * 0.72)
        x.lineTo(c + Math.sin(a) * c * 0.88, c - Math.cos(a) * c * 0.88)
        x.stroke()
      }
      x.fillStyle = 'rgba(255,184,77,.95)'
      x.beginPath()
      x.arc(c, c * 0.42, 5, 0, Math.PI * 2)
      x.fill()
    }))
    const dial = new THREE.Mesh(keep(new THREE.CircleGeometry(0.0445, N)), keep(new THREE.MeshStandardMaterial({ color: C('#1A2440'), roughness: 0.4, emissive: C('#ffffff'), emissiveMap: dialTex, emissiveIntensity: 0.55, map: dialTex })))
    dial.position.z = 0.0142
    face.add(dial)
    const handMat = keep(new THREE.MeshStandardMaterial({ color: C('#BFFFE6'), emissive: C('#9CFFD6'), emissiveIntensity: 0.6, roughness: 0.4 }))
    const mkHand = (len, w, zz, mat = handMat) => {
      const pv = new THREE.Group()
      pv.position.z = zz
      face.add(pv)
      const hm = new THREE.Mesh(keep(new THREE.BoxGeometry(w, len, 0.0016)), mat)
      hm.position.y = len / 2 - 0.004
      pv.add(hm)
      return pv
    }
    const hH = mkHand(0.022, 0.0045, 0.0158)
    const hM = mkHand(0.032, 0.0034, 0.0172)
    const glass = new THREE.Mesh(keep(new THREE.SphereGeometry(0.12, N, 3, 0, Math.PI * 2, 0, 0.4)), keep(new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.03, specularIntensity: 1, envMapIntensity: 2.4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })))
    glass.rotation.x = Math.PI / 2
    glass.position.z = 0.0135 - 0.12 * Math.cos(0.4)
    glass.renderOrder = 4
    face.add(glass)
    return { hH, hM }
  })()
  function setClock() {
    const d = maintenant()
    const min = d.getMinutes() + d.getSeconds() / 60
    const hr = (d.getHours() % 12) + min / 60
    hands.hM.rotation.z = -(min / 60) * Math.PI * 2
    hands.hH.rotation.z = -(hr / 12) * Math.PI * 2
  }

  /* ---------- pieds, un peu plus mats ---------- */
  const footMat = vinylSSS(PAL.pieds, 'pilou-pied', 0.55, { rough: 0.6, ccr: 0.2, cc: 0.55, sheenK: 0.6 })
  const [fS, fR] = Q.pied
  const footGeo = keep(new THREE.SphereGeometry(0.17, fS, fR))
  const feet = [-1, 1].map((s) => {
    const g = new THREE.Group()
    g.position.set(s * 0.25, 0.05, 0.14)
    root.add(g)
    const m = new THREE.Mesh(footGeo, footMat)
    m.scale.set(1, 0.55, 1.3)
    g.add(m)
    return g
  })

  /* ---------- antenne laquée + point ambre en verre qui luit de l'intérieur ---------- */
  const antAnchor = new THREE.Group()
  antAnchor.position.set(0, H + BY, 0)
  body.add(antAnchor)
  const antMat = vinylSSS(PAL.antenne, 'pilou-antenne', 1.4, { rough: 0.3, cc: 1, ccr: 0.04 })
  const ANT = [[0, -0.07], [0, 0.02], [0.012, 0.14], [0.09, 0.25], [0.2, 0.29]].map(([x, y]) => new THREE.Vector3(x, y, 0))
  const antLen = (() => {
    let L = 0
    const a = [0]
    for (let i = 1; i < ANT.length; i++) { L += ANT[i].distanceTo(ANT[i - 1]); a.push(L) }
    return a.map((v) => v / L)
  })()
  const antMesh = new THREE.Mesh(new THREE.BufferGeometry(), antMat)
  antAnchor.add(antMesh)
  const beadU = { uGlow: { value: 0.5 }, uKeyV: { value: new THREE.Vector3(0, 0, 1) }, uAmb: { value: new THREE.Vector3(1, 0.48, 0.074) } }
  const beadMat = keep(new THREE.MeshPhysicalMaterial({ color: C('#C86A12'), roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.015, specularIntensity: 1, envMapIntensity: 1.2 }))
  if (0) beadMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, beadU)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uGlow; uniform vec3 uKeyV; uniform vec3 uAmb;')
      .replace('#include <opaque_fragment>', `{ vec3 Vv = normalize(vViewPosition); float ndv = saturate(dot(normal, Vv));
          float inner = pow(ndv, 2.2);
          float caus = pow(saturate(dot(normal, -uKeyV)), 3.);
          float edge = pow(1. - ndv, 2.);
          vec3 glow = uAmb * (.16 + (.62 + .5 * uGlow) * inner) * (1. - .65 * edge) + vec3(1., .78, .42) * caus * .75;
          outgoingLight = outgoingLight * .55 + glow; }
        #include <opaque_fragment>`)
  }
  beadMat.customProgramCacheKey = () => 'pilou-perle'
  const [bS, bR] = Q.perle
  const bead = new THREE.Mesh(keep(new THREE.SphereGeometry(0.078, bS, bR)), beadMat)
  bead.name = 'pilou-perle'
  antAnchor.add(bead)
  const halo = new THREE.Sprite(keep(new THREE.SpriteMaterial({
    map: keep(M.radialSprite([[0, 'rgba(255,220,150,1)'], [0.3, 'rgba(255,190,100,.45)'], [1, 'rgba(255,170,60,0)']])),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: C('#FFBF66'), opacity: 0,
  })))
  antAnchor.add(halo)
  const rot = (v, ax, az) => {
    const c = Math.cos(az), s = Math.sin(az)
    const x = v.x * c - v.y * s, y = v.x * s + v.y * c, z = v.z
    const c2 = Math.cos(ax), s2 = Math.sin(ax)
    return new THREE.Vector3(x, y * c2 - z * s2, y * s2 + z * c2)
  }
  let antKey = null
  const [aSeg, aRad] = Q.antenne
  function setAntenna(ax, az) {
    const k = `${Math.round(ax / 0.004)},${Math.round(az / 0.004)}` // on ne refait le tube que si elle a bougé
    if (k === antKey) return
    antKey = k
    const pts = ANT.map((p, i) => rot(p, ax * antLen[i], az * antLen[i]))
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    const geo = new THREE.TubeGeometry(curve, aSeg, 1, aRad)
    const pos = geo.attributes.position
    const c = new THREE.Vector3(), v = new THREE.Vector3()
    for (let i = 0; i <= aSeg; i++) { // effilée, plus épaisse à la base
      const u = i / aSeg
      curve.getPointAt(u, c)
      const rr = 0.03 - 0.006 * u + 0.026 * Math.exp(-u * 16)
      for (let j = 0; j <= aRad; j++) {
        const kk = i * (aRad + 1) + j
        v.fromBufferAttribute(pos, kk).sub(c).multiplyScalar(rr).add(c)
        pos.setXYZ(kk, v.x, v.y, v.z)
      }
    }
    // on garde les mêmes tampons GPU : seules les positions et normales sont réécrites (aucune création par image)
    if (!antMesh.geometry.index) antMesh.geometry = geo
    else {
      antMesh.geometry.attributes.position.array.set(geo.attributes.position.array)
      antMesh.geometry.attributes.normal.array.set(geo.attributes.normal.array)
      antMesh.geometry.attributes.position.needsUpdate = true
      antMesh.geometry.attributes.normal.needsUpdate = true
      antMesh.geometry.computeBoundingSphere()
      geo.dispose()
    }
    const tip = rot(new THREE.Vector3(0.222, 0.292, 0), ax, az)
    bead.position.copy(tip)
    halo.position.copy(tip)
  }
  setAntenna(0, 0)

  /* ---------- accessoires : livre (lecture), écharpe (cadeau du jour 3), parapluie, éventail ---------- */
  const glaze = (hex, o = {}) => keep(new THREE.MeshPhysicalMaterial(Object.assign({ color: C(hex), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 0.7 }, o)))
  const acc = { livre: false, echarpe: false, parapluie: false, eventail: false }
  const BOOK_A = 0.42
  const book = new THREE.Group()
  book.position.set(0, 0.6, 0.78)
  book.rotation.set(-0.9, 0, 0)
  body.add(book)
  const pageG = new THREE.Group()
  book.add(pageG)
  {
    const cover = glaze('#3B54A8'), paper = glaze('#FFF6E4', { clearcoat: 0.2, roughness: 0.7 }), band = glaze('#FFB84D')
    const box = (w, h, d) => keep(new THREE.BoxGeometry(w, h, d))
    for (const sd of [-1, 1]) {
      const half = new THREE.Group()
      half.rotation.z = sd * BOOK_A
      book.add(half)
      const cv = new THREE.Mesh(box(0.24, 0.014, 0.29), cover); cv.position.set(sd * 0.12, -0.013, 0); half.add(cv)
      const bd = new THREE.Mesh(box(0.24, 0.016, 0.032), band); bd.position.set(sd * 0.12, -0.014, -0.075); half.add(bd)
      const pp = new THREE.Mesh(box(0.226, 0.024, 0.27), paper); pp.position.set(sd * 0.114, 0.006, 0); half.add(pp)
    }
    const pv = new THREE.Group()
    pageG.add(pv)
    const pg = new THREE.Mesh(box(0.22, 0.004, 0.26), paper); pg.position.set(0.112, 0.02, 0); pv.add(pg)
  }
  const scarf = new THREE.Group()
  scarf.position.y = BY
  body.add(scarf)
  {
    const tx = keep(M.canvasTex(128, 8, (x) => { for (let i = 0; i < 32; i++) { x.fillStyle = ['#FF7457', '#FF7457', '#FFC24F'][i % 3]; x.fillRect(i * 4, 0, 4, 8) } }))
    tx.wrapS = THREE.RepeatWrapping
    const knit = keep(new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: tx, roughness: 0.85, sheen: 0.6, sheenColor: C('#FFD6C8') }))
    const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(rAtY(0.57) + 0.012, 0.068, 8, 40)), knit)
    ring.position.y = 0.57
    ring.rotation.x = Math.PI / 2
    scarf.add(ring)
    const tail = new THREE.Group()
    tail.position.set(0.27, 0.41, rAtY(0.41) * 0.92)
    tail.rotation.set(-0.15, 0.3, -0.22)
    scarf.add(tail)
    const tm2 = new THREE.Mesh(keep(new THREE.CapsuleGeometry(0.06, 0.2, 3, 8)), glaze('#FF7457', { clearcoat: 0, roughness: 0.85 }))
    tm2.scale.set(1, 1, 0.42)
    tail.add(tm2)
  }
  const umbrella = new THREE.Group()
  arms[1].pv.add(umbrella)
  umbrella.position.set(0, -0.28, 0.02)
  {
    const stick = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 6)), glaze('#7A5240'))
    stick.position.y = 0.5
    umbrella.add(stick)
    const canopy = new THREE.Mesh(keep(new THREE.ConeGeometry(0.62, 0.26, 16, 1, true)), glaze('#A08CF7', { side: THREE.DoubleSide }))
    canopy.position.y = 1.08
    umbrella.add(canopy)
  }
  const fan = new THREE.Group()
  arms[1].pv.add(fan)
  fan.position.set(0, -0.3, 0.05)
  {
    const leaf = new THREE.Mesh(keep(new THREE.CircleGeometry(0.2, 12, 0, Math.PI)), glaze('#FF9C66', { side: THREE.DoubleSide }))
    leaf.rotation.x = -Math.PI / 2
    leaf.position.y = -0.02
    fan.add(leaf)
  }
  function setAccessoires(Pz) {
    book.visible = acc.livre || Pz.book > 0.01
    book.scale.setScalar(acc.livre ? 1 : Math.max(0.01, Pz.book))
    pageG.rotation.z = lerp(BOOK_A, Math.PI - BOOK_A, Pz.page || 0)
    scarf.visible = acc.echarpe || Pz.scarf > 0.01
    scarf.scale.setScalar(acc.echarpe ? 1 : Math.max(0.01, Pz.scarf))
    umbrella.visible = acc.parapluie
    fan.visible = acc.eventail
    // le bras qui tient le parapluie reste levé (sans écraser son animation)
  }

  /* ---------- points d'attache pour la scène et les autres lots ---------- */
  const anchors = {
    head: Object.assign(new THREE.Object3D(), { name: 'pilou-tete' }),
    belly: Object.assign(new THREE.Object3D(), { name: 'pilou-belly' }),
    handLeft: Object.assign(new THREE.Object3D(), { name: 'pilou-main-gauche' }),
    handRight: Object.assign(new THREE.Object3D(), { name: 'pilou-main-droite' }),
    antennaTip: Object.assign(new THREE.Object3D(), { name: 'pilou-point-ambre' }),
  }
  anchors.head.position.set(0, H + BY, 0); body.add(anchors.head)
  anchors.belly.position.set(0, 0.34 + BY, rAtY(0.34) + 0.02); body.add(anchors.belly)
  anchors.handLeft.position.set(0, -0.3, 0); arms[0].pv.add(anchors.handLeft)
  anchors.handRight.position.set(0, -0.3, 0); arms[1].pv.add(anchors.handRight)
  bead.add(anchors.antennaTip)

  /* ---------- ombre de contact (une tache, pas d'ombre portée) ---------- */
  let contact = null
  if (ombre) {
    contact = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.5, 1.3)), keep(new THREE.MeshBasicMaterial({
      map: keep(M.radialSprite([[0, 'rgba(60,40,20,.55)'], [0.5, 'rgba(60,40,20,.25)'], [1, 'rgba(60,40,20,0)']])),
      transparent: true, depthWrite: false,
    })))
    contact.rotation.x = -Math.PI / 2
    contact.position.set(0, 0.004, 0.06)
    contact.renderOrder = -1
    root.add(contact)
  }

  /* ---------- appliquer une pose ---------- */
  const tv = new THREE.Vector3(), tq = new THREE.Quaternion(), tm = new THREE.Matrix4(), te = new THREE.Euler()
  const keyDir = new THREE.Vector3(-0.6, 0.35, -0.7).normalize() // contre-jour par défaut (la scène le remplace)
  let τLast = 0
  let P = null

  function apply(Pz, τ, cam) {
    root.position.set(Pz.x, Pz.y0 || 0, Pz.z)
    root.rotation.y = Pz.yaw
    const sy = 1 + Pz.sq, sx = 1 / Math.sqrt(Math.max(0.3, sy))
    const sit = Pz.sit || 0
    body.position.set(0, Pz.lift - 0.1 * sit, -0.04 * sit)
    body.rotation.set(Pz.leanX - 0.2 * sit, Pz.twist, -Pz.leanZ)
    body.scale.set(sx, sy, sx)
    for (const g of [antAnchor, arms[0].anchor, arms[1].anchor]) g.scale.set(1 / sx, 1 / sy, 1 / sx)
    arms[0].pv.rotation.set(Pz.aLx, 0, -(Pz.aL + (Pz.armLag || 0)))
    arms[1].pv.rotation.set(Pz.aRx, 0, Pz.aR + (Pz.armLag || 0))
    const tuck = Pz.footTuck || 0
    feet.forEach((f, i) => {
      const s = i ? 1 : -1
      f.position.set(s * (0.25 - 0.04 * tuck + 0.05 * sit), 0.05 + Pz.lift * 0.92 + 0.05 * sit, 0.14 + 0.36 * sit)
      f.rotation.set(-1.0 * sit - 0.35 * tuck, 0, s * 0.25 * sit)
    })
    setAntenna(Pz.antX, Pz.antZ)
    // le point ambre luit (cycle de 2 400 ms), il ne clignote jamais
    const glow = Pz.glow * (1 + (anim.reduit ? 0 : 0.1 * Math.sin((τ / 2400) * Math.PI * 2)))
    beadU.uGlow.value = glow
    halo.material.opacity = clamp(glow - 0.35) * 0.75
    halo.scale.setScalar(0.34 + 0.22 * glow)
    if (contact) {
      const l = clamp(Pz.lift)
      contact.scale.set(1 - 0.35 * l, 1 - 0.35 * l, 1)
      contact.material.opacity = 1 - 0.55 * clamp(Pz.lift * 1.5)
    }
    setAccessoires(Pz)
    if (acc.parapluie) arms[1].pv.rotation.set(-0.3, 0, 2.3)
    paintFace(Pz.f)
    root.updateMatrixWorld(true)
    for (const e of eyes) {
      const F = Pz.f
      const w = Pz.camW ?? 0
      e.U.uPupil.value = (Pz.pupil ?? 0.4) * (F.es > 1.15 ? 1.08 : 1)
      // paupières : yeux qui sourient avec une paupière basse ≤ 0,32 (pas de « poches »)
      const yTop = Math.sin(e.elTop), yBot = Math.sin(e.elBot)
      const lt = clamp(F.lidTop + Math.max(0, -F.lookY * (1 - w)) * 0.22 * (1 - F.lidTop))
      const lb = Math.min(0.32, clamp(F.lidBot) * 0.6) * (1 - sstep(0.55, 0.98, lt))
      const eT = Math.asin(clamp(lerp(yTop + 0.06, -1.02, lt), -1, 1))
      const eB = Math.asin(clamp(lerp(yBot - 0.06, yTop * 0.25, lb / 0.6), -1, 1))
      if (e.s < 0) lashMat.color.copy(RIM_OUVERT).lerp(RIM_FERME, sstep(0.55, 0.95, lt))
      e.lidT.rotation.x = -eT
      e.lidB.rotation.x = -eB
      e.U.uLidT.value = eT
      e.U.uLidB.value = eB
      // taille des yeux (surpris, curieux)
      e.sc.scale.set(EX * F.es * F.esx, EY * F.es * F.esy, EZ)
    }
    // yeux et point ambre : la partie qui dépend de la caméra se fait au rendu (onBeforeRender), la scène n'a
    // donc pas à nous passer sa caméra ; si on nous la passe, on la prend tout de suite.
    if (cam) camPart(cam)
    setClock()
  }

  function camPart(cam) {
    const Pz = P
    if (!Pz) return
    cam.updateMatrixWorld()
    // le point ambre : la lumière principale ressort du côté opposé (dans le repère de la vue)
    beadU.uKeyV.value.copy(keyDir).transformDirection(cam.matrixWorldInverse)
    for (const e of eyes) {
      const F = Pz.f
      tv.setFromMatrixPosition(cam.matrixWorld)
      e.sc.worldToLocal(tv)
      e.U.uCamU.value.copy(tv)
      const d = tv.clone().normalize()
      const camYaw = Math.atan2(d.x, d.z)
      const camPitch = Math.asin(clamp(d.y, -1, 1))
      const w = Pz.camW ?? 0
      const yaw = clamp(lerp(F.lookX * 0.42, camYaw, w), -0.55, 0.55)
      const pitch = clamp(lerp(F.lookY * 0.32, camPitch, w), -0.45, 0.45)
      tm.makeRotationFromEuler(te.set(-pitch, yaw, 0, 'YXZ'))
      e.U.uGaze.value.setFromMatrix4(tm)
      e.U.uGazeT.value.copy(e.U.uGaze.value).transpose()
      tv.copy(keyDir)
      e.g.getWorldQuaternion(tq)
      tv.applyQuaternion(tq.invert())
      e.U.uKeyU.value.set(tv.x, tv.y).multiplyScalar(0.8)
    }
  }
  let lastCamFrame = -1
  // sans setLumiere(), la lumière principale est la plus forte lumière directionnelle de la scène (le soleil)
  let lumiereFixee = false
  let soleil = null
  const lv = new THREE.Vector3()
  eyes[0].ball.onBeforeRender = (_r, scn, cam) => {
    if (!lumiereFixee && scn) {
      if (!soleil || !soleil.parent) {
        soleil = null
        scn.traverse((o) => { if (o.isDirectionalLight && (!soleil || o.intensity > soleil.intensity)) soleil = o })
      }
      if (soleil) {
        lv.setFromMatrixPosition(soleil.matrixWorld).sub(soleil.target.getWorldPosition(tv))
        if (lv.lengthSq() > 1e-8) keyDir.copy(lv.normalize())
      }
    }
    if (cam.id === lastCamFrame && P === camPart.lastP) return
    lastCamFrame = cam.id
    camPart.lastP = P
    camPart(cam)
  }

  const ray = new THREE.Raycaster()
  const api = {
    object: root,
    animateur: anim,
    qualite,
    /** Image τ (ms, horloge croissante) vue par camera. Rend le texte de l'état (pour l'écran et le lecteur d'écran). */
    update(τ, camera) {
      τLast = τ
      P = anim.poseAt(τ)
      apply(P, τ, camera)
      return anim.etat(τ)
    },
    pose: () => P,
    etat: (τ = τLast) => anim.etat(τ),
    setExpression(e, τ = τLast) { anim.setExpression(e, τ) },
    suivreHumeur(τ = τLast) { anim.suivreHumeur(τ) },
    setHumeur(m, τ = τLast) { anim.setHumeur(m, τ) },
    nouvelleJournee(τ = τLast) { anim.nouvelleJournee(τ) },
    react(kind, τ = τLast, o) { return anim.react(kind, τ, o) },
    lueur(τ = τLast) { anim.lueur(τ) },
    setNom(n) { anim.setNom(n) },
    setReduit(v) { anim.setReduit(v) },
    regarderCamera(on, τ = τLast) { anim.regarderCamera(on, τ) },
    /** Regard dirigé vers un point du monde (une bulle qui éclate, un papillon, le doigt), ou null. */
    regarderPoint(p, τ = τLast) {
      if (!p) { anim.regarder(null, τ); return }
      tv.copy(p)
      body.worldToLocal(tv)
      anim.regarder({ dx: tv.x, dy: tv.y - (0.9 + BY) }, τ)
    },
    /** Un geste reconnu par createGestes() → la réaction, et les vibrations à jouer (HAPTIQUE). */
    geste(g, τ = τLast) {
      switch (g.geste) {
        case 'toucher': anim.react('toucher', τ); return HAPTIQUE.toucher
        case 'saut': anim.react('saut', τ); return HAPTIQUE.saut
        case 'appui': anim.tenir('appui', τ); return HAPTIQUE.appui
        case 'chatouille': anim.tenir('chatouille', τ); return HAPTIQUE.chatouille
        case 'fin-appui':
        case 'fin-chatouille': anim.relacher(τ); return []
        case 'glisser': anim.react('glisser', τ, { dir: g.dir || 1 }); return HAPTIQUE.glisser
        default: return []
      }
    },
    /** Le doigt touche-t-il Pilou ? 'belly', 'corps' ou null (raycaster déjà réglé par la scène). */
    toucher(raycaster) {
      const r = raycaster || ray
      const hits = r.intersectObject(root, true).filter((h) => h.object.isMesh && h.object !== contact && !h.object.isSprite)
      if (!hits.length) return null
      const h = hits[0]
      if (h.object === bodyMesh) {
        tv.copy(h.point)
        bodyMesh.worldToLocal(tv)
        const ph = Math.atan2(tv.x, tv.z)
        const e = (ph / 0.9) ** 2 + ((tv.y - 0.34) / 0.25) ** 2
        if (e < 1) return 'belly'
      }
      return 'corps'
    },
    /** Lumière principale (direction vers la lumière, repère du monde) : caustique de l'iris et du point ambre. */
    setLumiere(dir) { lumiereFixee = !!dir; if (dir) keyDir.copy(dir).normalize() },
    /** Couleur de l'iris (fiche du double numérique, brief § 7.4). */
    setIris(hex) { paintIris(hex || IRIS_DEFAUT) },
    /** Équilibre des blancs de la peinture (la scène peut l'ajuster à sa lumière ; test du menthe). */
    setBalance(rgb) { balU.value.set(...rgb) },
    /** Pièces 3D du double numérique (lot STUDIO) : groupe du corps, matière vinyle. */
    kit: { body, corps: bodyMesh, antAnchor, vinyl, arms: arms.map((a) => a.pv) },
    anchors,
    /** Accessoire porté : livre, echarpe, parapluie, eventail, montre (portée par défaut). */
    setAccessoire(nom, on) {
      if (nom === 'montre') watch.visible = !!on
      else if (nom in acc) acc[nom] = !!on
    },
    stats() {
      let tris = 0, draws = 0
      root.traverseVisible((o) => {
        if (o.isMesh || o.isSprite) {
          const g = o.geometry
          tris += o.isSprite ? 2 : (g.index ? g.index.count : g.attributes.position.count) / 3
          draws++
        }
      })
      return { triangles: Math.round(tris), dessins: draws }
    },
    dispose() {
      antMesh.geometry.dispose()
      for (const d of disposables) d.dispose?.()
      M.dispose()
      root.removeFromParent()
    },
  }
  return api
}
