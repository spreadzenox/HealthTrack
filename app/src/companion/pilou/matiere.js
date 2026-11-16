// matiere.js — briques de matière de Pilou : bruit GLSL, sous-surface simulée (wrap lighting par canal et
// transluminance de contre-jour), petites cartes générées sur une toile (aucune texture téléchargée).
// Repris de journal/maquettes/compagnon/rendu/creature/matiere.js (brief § 7.5), rendu indépendant de l'import de
// three.js : tout passe par le THREE reçu (createPilou(THREE, …)).

export const rngF = (seed) => {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const NOISE = /* glsl */ `
uniform sampler2D tNoise;
float vnoise(vec3 x){ vec3 p = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  vec2 uv = (p.xy + vec2(37., 17.) * p.z) + f.xy;
  vec2 rg = texture2D(tNoise, (uv + .5) / 256.).yx; return mix(rg.x, rg.y, f.z); }
float fbm3(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.07 + 1.7; a *= .5; } return s / .875; }
`

const SSS_DECL = /* glsl */ `
uniform vec3 uWrap; uniform vec3 uSssCol; uniform float uSssDist; uniform float uSssPow;
float sssK = 1.0; vec3 sssTint = vec3(1.0);
`
const DIFF_LINE = 'reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );'

/** Fabrique de matières liée à une instance de three.js. */
export function makeMatiere(THREE, makeCanvas) {
  const NS = 256
  const noiseTex = (() => {
    const r = rngF(4242)
    const R = new Uint8Array(NS * NS)
    const d = new Uint8Array(NS * NS * 4)
    for (let i = 0; i < R.length; i++) R[i] = Math.floor(r() * 256)
    for (let y = 0; y < NS; y++) for (let x = 0; x < NS; x++) {
      const i = (y * NS + x) * 4
      d[i] = R[y * NS + x]
      d[i + 1] = R[((y - 17 + NS) % NS) * NS + ((x - 37 + NS) % NS)]
      d[i + 2] = d[i]
      d[i + 3] = 255
    }
    const t = new THREE.DataTexture(d, NS, NS, THREE.RGBAFormat)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.minFilter = t.magFilter = THREE.LinearFilter
    t.generateMipmaps = false
    t.needsUpdate = true
    return t
  })()
  const NOISE_U = { tNoise: { value: noiseTex } }

  const PHYS_SRC = THREE.ShaderChunk.lights_physical_pars_fragment
  const physOk = PHYS_SRC.includes(DIFF_LINE)
  const PHYS = PHYS_SRC.replace(DIFF_LINE, /* glsl */ `{
    float ndlW = dot( geometryNormal, directLight.direction );
    vec3 wrapD = clamp( ( vec3( ndlW ) + uWrap ) / ( 1.0 + uWrap ), 0.0, 1.0 );
    reflectedLight.directDiffuse += wrapD * directLight.color * diffuseBRDF * ( 1.0 - F );
    vec3 Lt = normalize( directLight.direction + geometryNormal * uSssDist );
    float tr = pow( saturate( dot( geometryViewDir, - Lt ) ), uSssPow );
    reflectedLight.directDiffuse += directLight.color * tr * uSssCol * sssTint * sssK;
  }`)

  /** Injection dans une matière standard/physique : { key, uniforms, vDecl, fDecl, vrep, frep, sss }. */
  function patchMat(mat, o) {
    if (mat) return mat // ESSAI
    const U = Object.assign({}, NOISE_U, o.uniforms || {})
    if (o.sss) {
      U.uWrap = { value: new THREE.Vector3(...o.sss.wrap) }
      U.uSssCol = { value: new THREE.Color(o.sss.col).multiplyScalar(o.sss.amt ?? 1) }
      U.uSssDist = { value: o.sss.dist ?? 0.4 }
      U.uSssPow = { value: o.sss.pow ?? 3 }
    }
    mat.userData.U = U
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U)
      let v = sh.vertexShader
      let f = sh.fragmentShader
      v = v.replace('#include <common>', '#include <common>\n' + (o.vDecl || ''))
      f = f.replace('#include <common>', '#include <common>\n' + NOISE + (o.sss ? SSS_DECL : '') + (o.fDecl || ''))
      if (o.sss && physOk) f = f.replace('#include <lights_physical_pars_fragment>', PHYS)
      for (const [a, b] of o.vrep || []) v = v.replace(a, b)
      for (const [a, b] of o.frep || []) f = f.replace(a, b)
      sh.vertexShader = v
      sh.fragmentShader = f
    }
    mat.customProgramCacheKey = () => o.key
    return mat
  }

  function tileNoise(S, octaves, seed) {
    const out = new Float32Array(S * S)
    let amp = 1
    let tot = 0
    for (const P of octaves) {
      const r = rngF(seed++)
      const g = new Float32Array(P * P)
      for (let i = 0; i < g.length; i++) g[i] = r()
      for (let y = 0; y < S; y++) {
        const fy = (y / S) * P, iy = Math.floor(fy), ty = fy - iy, sy = ty * ty * (3 - 2 * ty)
        for (let x = 0; x < S; x++) {
          const fx = (x / S) * P, ix = Math.floor(fx), tx = fx - ix, sx = tx * tx * (3 - 2 * tx)
          const a = g[(iy % P) * P + (ix % P)], b = g[(iy % P) * P + ((ix + 1) % P)]
          const c = g[((iy + 1) % P) * P + (ix % P)], d = g[((iy + 1) % P) * P + ((ix + 1) % P)]
          out[y * S + x] += amp * (a + (b - a) * sx + (c + (d - c) * sx - (a + (b - a) * sx)) * sy)
        }
      }
      tot += amp
      amp *= 0.5
    }
    for (let i = 0; i < out.length; i++) out[i] /= tot
    return out
  }
  function normalFromHeight(h, S, strength) {
    const d = new Uint8Array(S * S * 4)
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const L = h[y * S + ((x - 1 + S) % S)], R = h[y * S + ((x + 1) % S)]
      const D = h[((y - 1 + S) % S) * S + x], Up = h[((y + 1) % S) * S + x]
      let nx = (L - R) * strength, ny = (D - Up) * strength, nz = 1
      const l = Math.hypot(nx, ny, nz)
      nx /= l; ny /= l; nz /= l
      const i = (y * S + x) * 4
      d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255
    }
    const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.minFilter = THREE.LinearMipmapLinearFilter
    t.magFilter = THREE.LinearFilter
    t.generateMipmaps = true
    t.needsUpdate = true
    return t
  }
  // « peau d'orange » du vernis : bruit fin périodique (128², généré une fois)
  const peel = (() => normalFromHeight(tileNoise(128, [16, 32], 41), 128, 2.2))()

  function canvasTex(w, h, draw, srgb = true) {
    const c = makeCanvas(w, h)
    const x = c.getContext('2d')
    if (x) draw(x, w, h)
    const t = new THREE.CanvasTexture(c)
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
    return t
  }
  function radialSprite(stops, S = 64) {
    return canvasTex(S, S, (x) => {
      const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
      for (const [o, c] of stops) g.addColorStop(o, c)
      x.fillStyle = g
      x.fillRect(0, 0, S, S)
    })
  }
  function dispose() { noiseTex.dispose(); peel.dispose() }

  return { patchMat, NOISE_U, noiseTex, peel, canvasTex, radialSprite, tileNoise, normalFromHeight, physOk, dispose }
}
