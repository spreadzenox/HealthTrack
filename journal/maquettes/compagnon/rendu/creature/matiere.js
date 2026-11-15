// matiere.js — briques de matière partagées : bruit GLSL, sous-surface simulée (wrap + transluminance),
// cartes procédurales générées sur canevas (aucune texture téléchargée). Tout est déterministe (graines).
import * as THREE from 'three';

// échelle HDR : la scène est rendue ×K dans une cible sRGB 8 bits multiéchantillonnée, puis remise à l'échelle (÷K)
export const K = .25;
export const rngF = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

/* ---------- bruit GLSL (fragment) ---------- */
/* ---------- bruit GLSL (fragment) ----------
   vnoise(vec3) : bruit de valeur lissé, lu dans une petite texture aléatoire (une seule lecture au lieu de 8 hachages :
   le canal G est le canal R décalé de (37, 17), l'astuce classique pour un bruit 3D à partir d'une texture 2D). */
const NS = 256;
export const noiseTex = (() => {
  const r = rngF(4242), R = new Uint8Array(NS * NS), d = new Uint8Array(NS * NS * 4);
  for (let i = 0; i < R.length; i++) R[i] = Math.floor(r() * 256);
  for (let y = 0; y < NS; y++) for (let x = 0; x < NS; x++) {
    const i = (y * NS + x) * 4; d[i] = R[y * NS + x]; d[i + 1] = R[((y - 17 + NS) % NS) * NS + (x - 37 + NS) % NS]; d[i + 2] = d[i]; d[i + 3] = 255;
  }
  const t = new THREE.DataTexture(d, NS, NS, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
})();
export const NOISE_U = { tNoise: { value: noiseTex } };
export const NOISE = /* glsl */`
uniform sampler2D tNoise;
float hash13(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 x){ vec3 p = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  vec2 uv = (p.xy + vec2(37., 17.) * p.z) + f.xy;
  vec2 rg = texture2D(tNoise, (uv + .5) / 256.).yx; return mix(rg.x, rg.y, f.z); }
float fbm3(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.07 + 1.7; a *= .5; } return s / .875; }
vec3 bumpN(vec3 sp, vec3 n, float h){ vec3 dx = dFdx(sp), dy = dFdy(sp); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dy, n), r2 = cross(n, dx); float det = dot(dx, r1); vec3 g = sign(det) * (hx * r1 + hy * r2);
  return normalize(abs(det) * n - g); }
`;

/* ---------- sous-surface simulée ----------
   Remplace le terme diffus direct du modèle physique de three.js :
   - « wrap lighting » par canal (le rouge déborde plus loin derrière le terminateur : bord chaud) ;
   - transluminance en contre-jour (la lumière qui traverse les parties fines : bords, bras, antenne, pétales).
   sssK (épaisseur, 0 = opaque) et sssTint (teinte locale) sont des globales fixées par chaque matière. */
const SSS_DECL = /* glsl */`
uniform vec3 uWrap; uniform vec3 uSssCol; uniform float uSssDist; uniform float uSssPow;
float sssK = 1.0; vec3 sssTint = vec3(1.0);
`;
const PHYS_SRC = THREE.ShaderChunk.lights_physical_pars_fragment;
const DIFF_LINE = 'reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );';
if (!PHYS_SRC.includes(DIFF_LINE)) console.error('matiere.js : ligne diffuse introuvable dans three.js');
const PHYS = PHYS_SRC.replace(DIFF_LINE, /* glsl */`{
    float ndlW = dot( geometryNormal, directLight.direction );
    vec3 wrapD = clamp( ( vec3( ndlW ) + uWrap ) / ( 1.0 + uWrap ), 0.0, 1.0 );
    reflectedLight.directDiffuse += wrapD * directLight.color * diffuseBRDF * ( 1.0 - F );
    vec3 Lt = normalize( directLight.direction + geometryNormal * uSssDist );
    float tr = pow( saturate( dot( geometryViewDir, - Lt ) ), uSssPow );
    reflectedLight.directDiffuse += directLight.color * tr * uSssCol * sssTint * sssK;
  }`);

/* patchMat : injection dans un matériau standard/physique.
   o = { key, uniforms, vDecl, fDecl, vrep:[[a,b]], frep:[[a,b]], sss:{ wrap:[r,g,b], col, amt, dist, pow } } */
export function patchMat(mat, o) {
  const U = Object.assign({}, NOISE_U, o.uniforms || {});
  if (o.sss) {
    U.uWrap = { value: new THREE.Vector3(...o.sss.wrap) };
    U.uSssCol = { value: new THREE.Color(o.sss.col).multiplyScalar(o.sss.amt ?? 1) };
    U.uSssDist = { value: o.sss.dist ?? .4 }; U.uSssPow = { value: o.sss.pow ?? 3 };
  }
  mat.userData.U = U;
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    let v = sh.vertexShader, f = sh.fragmentShader;
    v = v.replace('#include <common>', '#include <common>\n' + (o.vDecl || ''));
    f = f.replace('#include <common>', '#include <common>\n' + NOISE + (o.sss ? SSS_DECL : '') + (o.fDecl || ''));
    if (o.sss) f = f.replace('#include <lights_physical_pars_fragment>', PHYS);
    for (const [a, b] of o.vrep || []) { if (!v.includes(a)) console.error('patch v manquant', o.key, a); v = v.replace(a, b); }
    for (const [a, b] of o.frep || []) { if (!f.includes(a)) console.error('patch f manquant', o.key, a); f = f.replace(a, b); }
    sh.vertexShader = v; sh.fragmentShader = f;
  };
  mat.customProgramCacheKey = () => o.key;
  return mat;
}

/* ---------- bruit périodique (cartes qui se répètent sans couture) ---------- */
export function tileNoise(S, octaves, seed) {
  const out = new Float32Array(S * S);
  let amp = 1, tot = 0;
  for (const P of octaves) {
    const r = rngF(seed++), g = new Float32Array(P * P); for (let i = 0; i < g.length; i++) g[i] = r();
    for (let y = 0; y < S; y++) {
      const fy = y / S * P, iy = Math.floor(fy), ty = fy - iy, sy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < S; x++) {
        const fx = x / S * P, ix = Math.floor(fx), tx = fx - ix, sx = tx * tx * (3 - 2 * tx);
        const a = g[(iy % P) * P + ix % P], b = g[(iy % P) * P + (ix + 1) % P], c = g[((iy + 1) % P) * P + ix % P], d = g[((iy + 1) % P) * P + (ix + 1) % P];
        out[y * S + x] += amp * ((a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy);
      }
    }
    tot += amp; amp *= .5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
export function normalFromHeight(h, S, strength) {
  const d = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const L = h[y * S + (x - 1 + S) % S], R = h[y * S + (x + 1) % S], D = h[((y - 1 + S) % S) * S + x], U = h[((y + 1) % S) * S + x];
    let nx = (L - R) * strength, ny = (D - U) * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * S + x) * 4; d[i] = (nx * .5 + .5) * 255; d[i + 1] = (ny * .5 + .5) * 255; d[i + 2] = (nz * .5 + .5) * 255; d[i + 3] = 255;
  }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
  return t;
}
// peau : micro-relief (pores très doux + légères ondulations), répétable
export function skinNormalMap() {
  const S = 512, a = tileNoise(S, [64, 128, 256], 11), b = tileNoise(S, [8, 16], 23), h = new Float32Array(S * S);
  for (let i = 0; i < h.length; i++) h[i] = Math.pow(a[i], 1.6) * .8 + b[i] * .5;
  return normalFromHeight(h, S, 9);
}

export function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t;
}
export function radialSprite(stops, S = 128) {
  return canvasTex(S, S, (x) => { const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); for (const [o, c] of stops) g.addColorStop(o, c); x.fillStyle = g; x.fillRect(0, 0, S, S); });
}
