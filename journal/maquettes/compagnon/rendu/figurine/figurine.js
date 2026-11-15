// figurine.js — Pilou « figurine de collection » (esquisse 2) : vinyle verni peint à la main, socle en résine,
// studio photo produit. Tout est déterministe : la scène est une fonction de l'état passé à render().
import * as THREE from '../_partage/three-0.187.0/build/three.module.js';
import { clamp, lerp, sstep, H, BY, bodyR, PAL, FS, FY } from './pilou.js';
import { drawFaceFig } from './visage.js';
export { THREE };

/* ================= bruit déterministe ================= */
function h2(ix, iy, s) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul((s | 0) + 1, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
}
const sm = t => t * t * (3 - 2 * t);
export function vn2(x, y, s = 0, px = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = sm(x - ix), fy = sm(y - iy);
  const w = i => px ? ((i % px) + px) % px : i;
  const a = h2(w(ix), iy, s), b = h2(w(ix + 1), iy, s), c = h2(w(ix), iy + 1, s), d = h2(w(ix + 1), iy + 1, s);
  return (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy) * 2 - 1;
}
export function fbm2(x, y, o = 4, s = 0, px = 0) { let r = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { r += a * vn2(x * f, y * f, s + i * 31, px * f); a *= .5; f *= 2; } return r; }
function vn3(x, y, z, s = 0) {
  const iz = Math.floor(z), fz = sm(z - iz);
  return lerp(vn2(x + iz * 17.3, y - iz * 9.1, s), vn2(x + (iz + 1) * 17.3, y - (iz + 1) * 9.1, s), fz);
}
function fbm3(x, y, z, o = 3, s = 0) { let r = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { r += a * vn3(x * f, y * f, z * f, s + i * 13); a *= .5; f *= 2; } return r; }
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hex = c => new THREE.Color(c);
const srgb = c => { const k = new THREE.Color(c); k.convertLinearToSRGB(); return [k.r, k.g, k.b]; }; // composantes 0..1 affichées

/* ================= textures générées ================= */
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texFrom(c, { srgbSpace = false, repeat = null, mips = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgbSpace ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4; t.generateMipmaps = mips; t.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.needsUpdate = true; return t;
}
// carte de normales (espace tangent) à partir d'un champ de hauteur ; v vers le haut = ligne précédente
function normalsFrom(hgt, w, h, strength, wrapX = true, wrapY = false) {
  const c = makeCanvas(w, h), x = c.getContext('2d'), id = x.createImageData(w, h), d = id.data;
  const at = (i, j) => { if (wrapX) i = (i + w) % w; else i = clamp(i, 0, w - 1); if (wrapY) j = (j + h) % h; else j = clamp(j, 0, h - 1); return hgt[j * w + i]; };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = (at(i + 1, j) - at(i - 1, j)) * .5 * strength, dy = (at(i, j - 1) - at(i, j + 1)) * .5 * strength;
    const l = Math.hypot(dx, dy, 1), k = (j * w + i) * 4;
    d[k] = (-dx / l * .5 + .5) * 255; d[k + 1] = (-dy / l * .5 + .5) * 255; d[k + 2] = (1 / l * .5 + .5) * 255; d[k + 3] = 255;
  }
  x.putImageData(id, 0, 0); return c;
}

// ventre peint à la main : frontière légèrement irrégulière (φ = angle, front = 0 ; y = hauteur sur le corps)
function bellyMask(phi, y, u, v) {
  const e = (phi / .9) ** 2 + ((y - .34) / .25) ** 2;
  const th = .965 + .045 * fbm2(u * 9, v * 7, 3, 101, 9) + .012 * fbm2(u * 48, v * 30, 2, 103, 48);
  return 1 - sstep(th - .022, th + .006, e);
}
function bodyTextures(W = 2048, Hh = 1024) {
  const cc = makeCanvas(W, Hh), cx = cc.getContext('2d'), id = cx.createImageData(W, Hh), d = id.data;
  const hgt = new Float32Array(W * Hh);
  const M = srgb(hex(PAL.menthe)), Bv = srgb(hex(PAL.ventre)), Md = srgb(hex('#5CC69F')), Ml = srgb(hex('#8BE3C2'));
  for (let j = 0; j < Hh; j++) {
    const v = 1 - (j + .5) / Hh, t = v * Math.PI, y = (1 - Math.cos(t)) / 2 * H, yh = y / H;
    const dark = sstep(.5, .02, yh) * .55, light = sstep(.68, 1, yh) * .5;
    for (let i = 0; i < W; i++) {
      const u = (i + .5) / W, phi = (u - .5) * Math.PI * 2;
      const m = bellyMask(phi, y, u, v);
      const q = .012 * fbm2(u * 24, v * 14, 3, 7, 24);
      const st = .014 * fbm2(u * 10, v * 70, 2, 11, 10); // coups de pinceau horizontaux du ventre
      const k = (j * W + i) * 4;
      for (let c = 0; c < 3; c++) {
        let mint = M[c] + (Md[c] - M[c]) * dark + (Ml[c] - M[c]) * light; mint *= 1 + q;
        const cr = Bv[c] * (1 + st - .01 * dark);
        d[k + c] = clamp(mint + (cr - mint) * m) * 255;
      }
      d[k + 3] = 255;
      hgt[j * W + i] = m * (1 + 8 * st);
    }
  }
  cx.putImageData(id, 0, 0);
  const nrm = normalsFrom(hgt, W, Hh, 1.6);
  // micro-rugosité (G) : 512 × 256, variations lentes (doigts, poussière, vernis inégal) ; ventre un peu plus mat
  const sw = 512, shh = 256, sc = makeCanvas(sw, shh), sx = sc.getContext('2d'), sd = sx.createImageData(sw, shh);
  for (let j = 0; j < shh; j++) for (let i = 0; i < sw; i++) {
    const u = (i + .5) / sw, v = 1 - (j + .5) / shh, phi = (u - .5) * Math.PI * 2, y = (1 - Math.cos(v * Math.PI)) / 2 * H;
    const m = bellyMask(phi, y, u, v);
    const g = clamp(.92 + .28 * fbm2(u * 7, v * 5, 4, 21, 7) + .18 * Math.max(0, fbm2(u * 40, v * 26, 2, 23, 40)) + .22 * m, .55, 1.6);
    const k = (j * sw + i) * 4; sd.data[k] = 0; sd.data[k + 1] = clamp(g / 1.6) * 255; sd.data[k + 2] = 0; sd.data[k + 3] = 255;
  }
  sx.putImageData(sd, 0, 0);
  return { color: texFrom(cc, { srgbSpace: true }), normal: texFrom(nrm), surf: texFrom(sc) };
}
// « peau d'orange » du vernis : bruit fin périodique
function peelTexture(S = 256) {
  const hgt = new Float32Array(S * S);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) hgt[j * S + i] = fbm2(i / S * 12, j / S * 12, 3, 41, 12);
  return texFrom(normalsFrom(hgt, S, S, 2.4, true, true), { repeat: [5, 3.5] });
}

/* ================= le socle : géométrie et peinture des couches ================= */
const ISL = { R: 1.4, lip: 1.47 };
const PUD = { x: .34, z: .8, ax: .47, az: .3 };
export function puddleMask(x, z) {
  const dx = (x - PUD.x) / PUD.ax, dz = (z - PUD.z) / PUD.az, rho = Math.hypot(dx, dz), th = Math.atan2(dz, dx);
  const edge = 1 + .12 * Math.sin(3 * th + 1) + .07 * Math.sin(5 * th + 2.3);
  return 1 - sstep(edge - .2, edge + .05, rho);
}
export function groundY(x, z) {
  const r = Math.hypot(x, z);
  let y = .02 * (1 - Math.min(1, (r / ISL.R) ** 2)) + .007 * fbm2(x * 3.1 + 5, z * 3.1, 3, 61);
  y -= .02 * puddleMask(x, z);
  return y;
}
const WATER_Y = (() => { const r = Math.hypot(PUD.x, PUD.z); return .02 * (1 - (r / ISL.R) ** 2) - .008; })();
// couches de terre (du haut vers le bas) : couleur, relief (érosion), rugosité du vernis
const STRATA = [
  { y: -.06, c: '#5A3F2C', rel: -.012, ro: .8 },
  { y: -.15, c: '#8A5D3E', rel: .006, ro: .6, peb: .15 },
  { y: -.22, c: '#D9A86F', rel: -.01, ro: .5 },
  { y: -.34, c: '#CB7A50', rel: .022, ro: .36, peb: .3 },
  { y: -.47, c: '#E0C197', rel: -.024, ro: .7 },
  { y: -.52, c: '#B06A48', rel: .012, ro: .42 },
  { y: -.66, c: '#DFA07E', rel: -.004, ro: .55 },
  { y: -.78, c: '#9A5E43', rel: .018, ro: .4, peb: .4 },
  { y: -.86, c: '#CFA173', rel: -.016, ro: .62 },
  { y: -.97, c: '#7B4B35', rel: .02, ro: .34, peb: .25 },
  { y: -1.15, c: '#C98F57', rel: -.012, ro: .55 },
  { y: -1.3, c: '#5E3C2B', rel: .006, ro: .5 },
];
function boundaryY(i, theta) { return STRATA[i].y + (i ? .06 * vn2(theta / (Math.PI * 2) * 5, i * 3.3, 71 + i, 5) + .016 * vn2(theta / (Math.PI * 2) * 19, i, 73, 19) - .025 * Math.sin(theta + i * 1.7) : 0); }
function layerAt(theta, y) { let i = 0; while (i + 1 < STRATA.length && y < boundaryY(i + 1, theta)) i++; return i; }
function sideProfile() {
  const ctl = [[1.43, -.085], [1.415, -.18], [1.35, -.37], [1.23, -.59], [1.05, -.83], [.83, -1.05], [.57, -1.26], [.29, -1.44], [.0001, -1.57]].reverse()
    .map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.SplineCurve(ctl).getSpacedPoints(170);
}
function islandSide() {
  const prof = sideProfile();
  const geo = new THREE.LatheGeometry(prof, 240, Math.PI, Math.PI * 2);
  const p = geo.attributes.position, n = prof.length;
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), y = p.getY(k), z = p.getZ(k), r = Math.hypot(x, z);
    if (r < 1e-3) continue;
    const th = Math.atan2(x, z), L = layerAt(th, y);
    // relief en terrasses : chaque couche s'érode à sa façon, transitions courtes
    let rel = STRATA[L].rel;
    if (L + 1 < STRATA.length) { const yb = boundaryY(L + 1, th); rel = lerp(STRATA[L + 1].rel, rel, sstep(yb - .004, yb + .02, y)); }
    const lump = .042 * fbm3(x * 1.7, y * 2.4, z * 1.7, 3, 81) + .012 * fbm3(x * 5, y * 6, z * 5, 2, 83) - .014 * Math.pow(Math.abs(vn2(th * 9, y * 1.2, 85, 0)), .6);
    const fade = sstep(-1.57, -1.25, y) * (1 - sstep(-.12, -.085, y) * .8);
    const lobe = (.05 * vn2(th / (Math.PI * 2) * 4, y * .9, 87, 4) + .03 * vn2(th / (Math.PI * 2) * 9, y * 2.1, 89, 9)) * sstep(-.2, -.45, y);
    const nr = r + (rel * 2.1 + lump * 1.8 + lobe) * fade * Math.min(1, r * 3);
    p.setX(k, x / r * nr); p.setZ(k, z / r * nr);
  }
  geo.computeVertexNormals();
  // peinture : 2048 × 1024 (u autour, v le long du profil)
  const W = 2048, Hh = 1024;
  const cc = makeCanvas(W, Hh), cx = cc.getContext('2d'), id = cx.createImageData(W, Hh), d = id.data;
  const hgt = new Float32Array(W * Hh);
  const rc = makeCanvas(512, 256), rx = rc.getContext('2d'), rd = rx.createImageData(512, 256);
  const cols = STRATA.map(s => srgb(hex(s.c)));
  const PEB = ['#E7DED0', '#B5ABA0', '#D2AD98', '#837A73', '#EFE2C8', '#A4ACA3'].map(c => srgb(hex(c)));
  for (let j = 0; j < Hh; j++) {
    const v = 1 - (j + .5) / Hh, fi = v * (n - 1), i0 = Math.floor(fi), y = lerp(prof[i0].y, prof[Math.min(n - 1, i0 + 1)].y, fi - i0);
    for (let i = 0; i < W; i++) {
      const u = (i + .5) / W, th = Math.PI + u * Math.PI * 2, thw = Math.atan2(Math.sin(th), Math.cos(th));
      const L = layerAt(thw, y), c0 = cols[L];
      const yb = boundaryY(L, thw), yb1 = L + 1 < STRATA.length ? boundaryY(L + 1, thw) : -9;
      const dTop = yb - y, dBot = y - yb1;
      // sédiment : taches lentes, traînées horizontales irrégulières (pas de motif périodique), grains
      const mott = .08 * fbm2(u * 40, v * 22, 3, 91, 40);
      const streak = .055 * fbm2(u * 24, v * 210, 2, 93, 24);
      const gr = h2(i, j, 97), grain = gr > .982 ? .2 : gr < .014 ? -.16 : 0;
      const edge = Math.exp(-(((dTop) / .007) ** 2)) * .26 + Math.exp(-(((dBot) / .012) ** 2)) * .08;
      let lum = 1 + mott + streak + grain - edge, cr = c0[0], cg = c0[1], cb = c0[2], hp = 0;
      // galets pris dans la couche (bruit cellulaire), ombrés comme de petits dômes
      const A = thw * 1.32, cs = .07, gx = Math.floor(A / cs), gy = Math.floor(y / cs), dens = STRATA[L].peb ?? .03;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const qx = gx + ox, qy = gy + oy, hh = h2(qx, qy, 131);
        if (hh > dens) continue;
        const px = (qx + .15 + .7 * h2(qx, qy, 133)) * cs, py = (qy + .15 + .7 * h2(qx, qy, 135)) * cs, rr = .011 + .016 * h2(qx, qy, 137);
        const dx = (A - px) / rr, dy = (y - py) / (rr * .8), dd = dx * dx + dy * dy;
        if (dd < 1) {
          const pc = PEB[Math.floor(h2(qx, qy, 139) * PEB.length)], z = Math.sqrt(1 - dd);
          const sh = .78 + .3 * (-dx * .5 + dy * .75) + .22 * z, rim = sstep(.75, 1, dd);
          const mixc = .45 + .35 * h2(qx, qy, 143); cr = lerp(c0[0], pc[0], mixc); cg = lerp(c0[1], pc[1], mixc); cb = lerp(c0[2], pc[2], mixc); lum = sh * (1 - .35 * rim) + (h2(i, j, 141) - .5) * .04; hp = z * 2.4;
        }
      }
      const k = (j * W + i) * 4;
      d[k] = clamp(cr * lum) * 255; d[k + 1] = clamp(cg * lum) * 255; d[k + 2] = clamp(cb * lum) * 255; d[k + 3] = 255;
      hgt[j * W + i] = 2.5 * mott + 1.2 * streak + (gr > .982 ? .6 : 0) - edge * 3 + hp;
    }
  }
  cx.putImageData(id, 0, 0);
  for (let j = 0; j < 256; j++) {
    const v = 1 - (j + .5) / 256, fi = v * (n - 1), i0 = Math.floor(fi), y = lerp(prof[i0].y, prof[Math.min(n - 1, i0 + 1)].y, fi - i0);
    for (let i = 0; i < 512; i++) {
      const u = (i + .5) / 512, th = Math.PI + u * Math.PI * 2, thw = Math.atan2(Math.sin(th), Math.cos(th));
      const g = (.25 + .75 * STRATA[layerAt(thw, y)].ro) * (1 + .3 * fbm2(u * 30, v * 12, 2, 99, 30));
      const k = (j * 512 + i) * 4; rd.data[k] = 0; rd.data[k + 1] = clamp(g) * 255; rd.data[k + 2] = 0; rd.data[k + 3] = 255;
    }
  }
  rx.putImageData(rd, 0, 0);
  return { geo, map: texFrom(cc, { srgbSpace: true }), normal: texFrom(normalsFrom(hgt, W, Hh, 2.2)), rough: texFrom(rc), prof };
}
function islandTop() {
  // disque de terre peinte (sous l'herbe) + bourrelet de gazon ; seam à l'arrière
  const pts = [];
  for (let i = 0; i <= 70; i++) pts.push(new THREE.Vector2(Math.max(1e-4, ISL.R * Math.pow(i / 70, .85)), 0));
  for (const [r, y] of [[1.43, -.012], [1.462, -.04], [1.474, -.072], [1.455, -.104]]) pts.push(new THREE.Vector2(r, y));
  pts.reverse(); // du bord vers le centre : normales vers le haut
  const geo = new THREE.LatheGeometry(pts, 220, Math.PI, Math.PI * 2);
  const p = geo.attributes.position, col = [], c = new THREE.Color();
  const soil = hex('#3E5426'), wet = hex('#4A3A2A'), turf = hex('#4F8433'), moss = hex('#4A6A2A');
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), y = p.getY(k), z = p.getZ(k), r = Math.hypot(x, z);
    if (r <= ISL.R + 1e-4 && y > -.001) p.setY(k, groundY(x, z));
    else p.setY(k, y + .006 * fbm2(x * 4, z * 4, 2, 63));
    const pm = puddleMask(x, z), ring = sstep(.0, .35, pm) * (1 - sstep(.75, 1, pm));
    c.copy(soil).lerp(moss, .5 + .5 * fbm2(x * 5, z * 5, 2, 65)).lerp(wet, Math.min(.75, ring * .9 + pm * .4));
    if (r > ISL.R - .02) c.copy(turf).multiplyScalar(r > 1.46 && y < -.05 ? .55 : 1);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

/* ================= le rendu ================= */
export function createFigurine({ canvas, width = 1920, height = 1080, pixelRatio = 1, mode = 'video' }) {
  const small = mode === 'petit';
  const R = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  R.setPixelRatio(pixelRatio); R.setSize(width, height, false);
  R.outputColorSpace = THREE.LinearSRGBColorSpace; // la passe finale encode elle-même en sRGB
  R.toneMapping = THREE.NoToneMapping;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;
  
  const BW = Math.round(width * pixelRatio), BH = Math.round(height * pixelRatio);
  const mainRT = new THREE.WebGLRenderTarget(BW, BH, { type: THREE.HalfFloatType, samples: 4 });
  mainRT.depthTexture = new THREE.DepthTexture(BW, BH); mainRT.depthTexture.type = THREE.UnsignedIntType;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(20, width / height, .3, 80);

  /* ---------- environnement studio (PMREM) : boîte à lumière, deux bandes de contre-jour, réflecteur crème ---------- */
  {
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(30, 48, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `varying vec3 vD; void main(){ float y = vD.y;
        vec3 top = vec3(1., .9, .78) * .95, hor = vec3(1., .74, .56) * .62, bot = vec3(.82, .64, .5) * .62;
        vec3 c = y > 0. ? mix(hor, top, pow(y, .55)) : mix(hor, bot, pow(-y, .45));
        gl_FragColor = vec4(c, 1.); }`,
    })));
    const panel = (w, h, pos, col, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({
        side: THREE.DoubleSide, uniforms: { c: { value: new THREE.Vector3(...col).multiplyScalar(k) } },
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform vec3 c; varying vec2 vU; void main(){ vec2 q = min(vU, 1. - vU); float e = smoothstep(0., .05, min(q.x, q.y));
          float hot = 1. - .35 * length(vU - .5); gl_FragColor = vec4(c * e * hot, 1.); }`,
      }));
      m.position.set(...pos); m.lookAt(0, .7, 0); env.add(m); return m;
    };
    panel(6.5, 5, [-8, 9, 9], [1, .97, .92], 7.5);      // clé : grande boîte à lumière, en haut à gauche
    panel(1.4, 9, [9, 4.5, -8], [1, .95, .88], 7);      // contre-jour droit (bande)
    panel(1.2, 8, [-9.5, 3.5, -6.5], [1, .93, .85], 4.5); // contre-jour gauche
    panel(7, 5, [10, .8, 7.5], [1, .9, .76], 1.25);     // réflecteur crème, à droite
    panel(8, 8, [0, 14, 1], [1, .96, .9], 1.6);          // plafond diffus
    const pm = new THREE.PMREMGenerator(R);
    scene.environment = pm.fromScene(env, 0, .1, 100, { size: 256, position: new THREE.Vector3(0, .7, 0) }).texture;
    pm.dispose();
  }
  scene.environmentIntensity = .62;

  /* ---------- lumières directes (mêmes directions que les boîtes à lumière) ---------- */
  const key = new THREE.DirectionalLight(new THREE.Color(1, .955, .9), 3.3); key.position.set(-8, 9, 9); scene.add(key); scene.add(key.target);
  key.target.position.set(0, .4, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -2.1, right: 2.1, top: 2.2, bottom: -1.9, near: 4, far: 26 });
  key.shadow.bias = -.0004; key.shadow.normalBias = .012; key.shadow.radius = 3.2;
  const rimR = new THREE.DirectionalLight(new THREE.Color(1, .94, .86), 4.6); rimR.position.set(9, 4.5, -8); scene.add(rimR);
  const rimL = new THREE.DirectionalLight(new THREE.Color(1, .92, .84), 2.8); rimL.position.set(-9.5, 3.5, -6.5); scene.add(rimL);
  
  

  /* ---------- fond : papier sans fin crème-abricot (couleurs exactes à l'écran, inversées pour la passe finale) ---------- */
  const TONE_A = .78;
  const toneGLSL = `
    float shoulder(float x) { return x < ${TONE_A.toFixed(3)} ? x : ${TONE_A.toFixed(3)} + ${(1 - TONE_A).toFixed(3)} * (1. - exp(-(x - ${TONE_A.toFixed(3)}) / ${(1 - TONE_A).toFixed(3)})); }
    float shoulderInv(float y) { y = min(y, .9985); return y < ${TONE_A.toFixed(3)} ? y : ${TONE_A.toFixed(3)} - ${(1 - TONE_A).toFixed(3)} * log(1. - (y - ${TONE_A.toFixed(3)}) / ${(1 - TONE_A).toFixed(3)}); }
    vec3 s2l(vec3 c) { return mix(c / 12.92, pow((c + .055) / 1.055, vec3(2.4)), step(vec3(.04045), c)); }
    vec3 l2s(vec3 c) { c = max(c, vec3(0.)); return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(vec3(.0031308), c)); }`;
  const BG = small
    ? { c0: [1, .965, .925], c1: [1, .9, .82], c2: [.995, .87, .78], cen: [.5, .35] }      // fond de l'app : crème, ciel abricot
    : { c0: [1, .958, .905], c1: [.985, .855, .74], c2: [.95, .755, .62], cen: [.5, .6] }; // studio
  const bgU = {
    uRes: { value: new THREE.Vector2(BW, BH) }, uRefl: { value: 0 }, uExp: { value: 1 },
    c0: { value: new THREE.Vector3(...BG.c0) }, c1: { value: new THREE.Vector3(...BG.c1) }, c2: { value: new THREE.Vector3(...BG.c2) }, cen: { value: new THREE.Vector2(...BG.cen) },
    uShadow: { value: new THREE.Vector4(.5, .02, .2, 0) },
  };
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: bgU, depthWrite: true,
    vertexShader: 'varying vec2 vN; void main(){ vN = position.xy; gl_Position = vec4(position.xy, .99995, 1.); }',
    fragmentShader: `uniform vec2 uRes; uniform float uRefl, uExp; uniform vec3 c0, c1, c2; uniform vec2 cen; uniform vec4 uShadow; varying vec2 vN;
      ${toneGLSL}
      void main(){
        vec2 uv = vN * .5 + .5; vec3 c;
        if (uRefl > .5) c = c0 * .99;
        else {
          vec2 d = (uv - cen) * vec2(uRes.x / uRes.y, 1.);
          float r = length(d * vec2(.62, 1.));
          c = mix(c0, c1, smoothstep(.0, .62, r));
          c = mix(c, c2, smoothstep(.45, 1.15, r) * .9);
          c = mix(c, c2 * .96, smoothstep(.55, -.05, uv.y) * .55);   // le papier descend vers le sol
          vec2 s = (uv - uShadow.xy) / vec2(uShadow.z * 1.9, uShadow.z * .45);
          c *= 1. - uShadow.w * exp(-dot(s, s) * 1.6);                 // ombre douce du socle sur le papier
        }
        vec3 l = s2l(c);
        gl_FragColor = vec4(vec3(shoulderInv(l.r), shoulderInv(l.g), shoulderInv(l.b)) / uExp, 1.);
      }`,
  }));
  backdrop.frustumCulled = false; backdrop.renderOrder = -10; scene.add(backdrop);
  // couleur du « ciel » vu dans la flaque : le haut du papier, en valeurs linéaires d'avant la passe finale
  const shInv = y => { y = Math.min(y, .9985); return y < TONE_A ? y : TONE_A - (1 - TONE_A) * Math.log(1 - (y - TONE_A) / (1 - TONE_A)); };
  const s2l = c => c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
  const _rc = new THREE.Color();
  const reflClear = () => _rc.setRGB(...BG.c0.map(c => shInv(s2l(c * .985)) / bgU.uExp.value));

  /* ---------- matières ---------- */
  const BT = bodyTextures(small ? 1024 : 2048, small ? 512 : 1024);
  const PEEL = peelTexture();
  const FT = {};
  for (const S of [512, 1024]) {
    const c1 = makeCanvas(S, S), c2 = makeCanvas(S, S);
    const t1 = texFrom(c1), t2 = texFrom(c2); t1.premultiplyAlpha = true;
    FT[S] = { S, c1, c2, x1: c1.getContext('2d'), x2: c2.getContext('2d'), t1, t2 };
  }
  const faceS = small ? 512 : 1024;
  const SH = { sss: { value: new THREE.Vector3(.5, 1, .78).multiplyScalar(1.3) }, rimDir: { value: new THREE.Vector3() } };
  const vinylMats = [];
  function vinyl(color, o = {}) {
    const m = new THREE.MeshPhysicalMaterial({
      color: hex(color), map: o.map || null, roughness: o.rough ?? .52, roughnessMap: BT.surf, metalness: 0,
      normalMap: o.normalMap || null, normalScale: new THREE.Vector2(.35, .35),
      clearcoat: o.cc ?? .72, clearcoatRoughness: o.ccr ?? .13, clearcoatRoughnessMap: BT.surf,
      clearcoatNormalMap: PEEL, clearcoatNormalScale: new THREE.Vector2(.16, .16),
      sheen: o.sheen ?? .3, sheenColor: hex('#E9FFF6'), sheenRoughness: .5, specularIntensity: .55,
    });
    const U = {
      uFace: { value: FT[faceS].t1 }, uFaceMat: { value: FT[faceS].t2 }, uFaceOn: { value: o.face ? 1 : 0 }, uBump: { value: 1.3 },
      uAO: { value: new THREE.Vector3(...(o.ao || [1, 0, 1])) }, uSSS: SH.sss, uRimDir: SH.rimDir, uSSSk: { value: o.sss ?? 1 },
    };
    m.userData.U = U;
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec2 aFace; varying vec2 vFace; varying vec3 vObj; varying vec3 vObjN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFace = aFace; vObj = position; vObjN = normal;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform sampler2D uFace; uniform sampler2D uFaceMat; uniform float uFaceOn; uniform float uBump; uniform vec3 uAO; uniform vec3 uSSS; uniform vec3 uRimDir; uniform float uSSSk;
          varying vec2 vFace; varying vec3 vObj; varying vec3 vObjN;
          vec3 fS2L(vec3 c) { return mix(c / 12.92, pow((c + .055) / 1.055, vec3(2.4)), step(vec3(.04045), c)); }
          vec3 pNA(vec3 sp, vec3 sn, vec2 dH, float fd) {
            vec3 sx = normalize(dFdx(sp)), sy = normalize(dFdy(sp)); vec3 r1 = cross(sy, sn), r2 = cross(sn, sx);
            float det = dot(sx, r1) * fd; vec3 gr = sign(det) * (dH.x * r1 + dH.y * r2); return normalize(abs(det) * sn - gr); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
          float fFront = uFaceOn * smoothstep(.05, .3, vObjN.z) * step(abs(vFace.x - .5), .5) * step(abs(vFace.y - .5), .5);
          vec4 fCol = texture2D(uFace, vFace); vec4 fMat = texture2D(uFaceMat, vFace);
          if (fCol.a > .003) diffuseColor.rgb = mix(diffuseColor.rgb, fS2L(fCol.rgb / fCol.a), fCol.a * fFront);
          float fGloss = fMat.g * fFront, fMatte = fMat.b * fFront;`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, min(1., roughnessFactor + .3), fMatte);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          vec2 fdx = dFdx(vFace), fdy = dFdy(vFace);
          vec2 dH = vec2(texture2D(uFaceMat, vFace + fdx).r - fMat.r, texture2D(uFaceMat, vFace + fdy).r - fMat.r) * uBump * fFront;
          normal = pNA(-vViewPosition, normal, dH, faceDirection);`)
        .replace('#include <clearcoat_normal_fragment_maps>', `#include <clearcoat_normal_fragment_maps>
          clearcoatNormal = pNA(-vViewPosition, normalize(mix(clearcoatNormal, nonPerturbedNormal, fGloss)), dH, faceDirection);`)
        .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
          material.roughness = mix(material.roughness, .07, fGloss);
          #ifdef USE_CLEARCOAT
            material.clearcoatRoughness = mix(material.clearcoatRoughness, .03, fGloss);
          #endif`)
        .replace('#include <aomap_fragment>', `#include <aomap_fragment>
          { float occ = mix(uAO.x, 1., smoothstep(uAO.y, uAO.z, vObj.y));
            reflectedLight.indirectDiffuse *= occ; reflectedLight.indirectSpecular *= mix(1., occ, .6);
            reflectedLight.directDiffuse *= mix(1., occ, .35); }`)
        .replace('#include <opaque_fragment>', `{ vec3 Vv = normalize(vViewPosition); float ndv = saturate(dot(normal, Vv));
            vec3 Lb = normalize(uRimDir + normal * .45);
            float bt = pow(saturate(dot(Vv, -Lb)), 2.) * pow(1. - ndv, 1.6);
            outgoingLight += uSSS * uSSSk * bt * (.35 + diffuseColor.rgb); }
          #include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'vinyl' + (o.face ? 'F' : '');
    vinylMats.push(m); return m;
  }
  const glaze = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({
    color: hex(color), roughness: .28, clearcoat: 1, clearcoatRoughness: .045, specularIntensity: .7, envMapIntensity: 1,
  }, o));

  /* ---------- Pilou ---------- */
  const root = new THREE.Group(); scene.add(root);
  const body = new THREE.Group(); body.rotation.order = 'ZXY'; root.add(body);
  const prof = []; for (let i = 0; i <= 96; i++) { const t = i / 96 * Math.PI; prof.push(new THREE.Vector2(Math.max(.0001, bodyR(t)), (1 - Math.cos(t)) / 2 * H)); }
  const bodyGeo = new THREE.LatheGeometry(prof, 144, Math.PI, Math.PI * 2);
  {
    const p = bodyGeo.attributes.position, a = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { a[i * 2] = .5 + p.getX(i) / (2 * FS); a[i * 2 + 1] = .5 + (p.getY(i) - FY) / (2 * FS); }
    bodyGeo.setAttribute('aFace', new THREE.BufferAttribute(a, 2));
  }
  const bodyMat = vinyl('#ffffff', { map: BT.color, normalMap: BT.normal, face: true, ao: [.66, .0, .3] });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat); bodyMesh.position.y = BY; bodyMesh.castShadow = bodyMesh.receiveShadow = true; body.add(bodyMesh);
  const limbMat = vinyl(PAL.menthe, { ao: [1, 0, 1] });
  const footMat = vinyl(PAL.pieds, { ao: [.55, -.09, .02], sheen: .2, rough: .58 });
  const arms = [-1, 1].map(s => {
    const anchor = new THREE.Group(); anchor.position.set(s * .58, .66, .06); body.add(anchor);
    const pv = new THREE.Group(); anchor.add(pv);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(.085, .2, 12, 28), limbMat); m.position.y = -.17; m.castShadow = m.receiveShadow = true; pv.add(m);
    return { anchor, pv };
  });
  const feet = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * .25, .05, .14); root.add(g);
    const m = new THREE.Mesh(new THREE.SphereGeometry(.17, 48, 28), footMat); m.scale.set(1, .55, 1.3); m.castShadow = m.receiveShadow = true; g.add(m); return g;
  });
  // antenne laquée + point ambre en verre
  const antAnchor = new THREE.Group(); antAnchor.position.set(0, H + BY, 0); body.add(antAnchor);
  const antMat = new THREE.MeshPhysicalMaterial({ color: hex(PAL.antenne), roughness: .3, clearcoat: 1, clearcoatRoughness: .04, specularIntensity: .6 });
  const ANT = [[0, -.06], [0, .02], [.012, .14], [.09, .25], [.2, .29]].map(([x, y]) => new THREE.Vector3(x, y, 0));
  const antLen = (() => { let L = 0; const a = [0]; for (let i = 1; i < ANT.length; i++) { L += ANT[i].distanceTo(ANT[i - 1]); a.push(L); } return a.map(v => v / L); })();
  const antMesh = new THREE.Mesh(new THREE.BufferGeometry(), antMat); antMesh.castShadow = true; antAnchor.add(antMesh);
  const beadU = { uGlow: { value: .5 }, uKeyV: { value: new THREE.Vector3() }, uAmb: { value: new THREE.Vector3(1, .48, .074) } };
  const beadMat = new THREE.MeshPhysicalMaterial({ color: hex('#C86A12'), roughness: .05, metalness: 0, clearcoat: 1, clearcoatRoughness: .015, specularIntensity: 1, envMapIntensity: 1.2 });
  beadMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, beadU);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlow; uniform vec3 uKeyV; uniform vec3 uAmb;')
      .replace('#include <opaque_fragment>', `{ vec3 Vv = normalize(vViewPosition); float ndv = saturate(dot(normal, Vv));
          float inner = pow(ndv, 2.2);                                   // le cœur, vu à travers le verre
          float caus = pow(saturate(dot(normal, -uKeyV)), 3.);           // la lumière de la clé ressort de l'autre côté (caustique)
          float edge = pow(1. - ndv, 2.);
          vec3 glow = uAmb * (.16 + (.62 + .5 * uGlow) * inner) * (1. - .65 * edge) + vec3(1., .78, .42) * caus * .75;
          outgoingLight = outgoingLight * .55 + glow; }
        #include <opaque_fragment>`);
  };
  beadMat.customProgramCacheKey = () => 'bead';
  const bead = new THREE.Mesh(new THREE.SphereGeometry(.078, 64, 40), beadMat); bead.castShadow = true; antAnchor.add(bead);
  const haloTex = (() => { const c = makeCanvas(128, 128), x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,220,150,1)'); g.addColorStop(.3, 'rgba(255,190,100,.45)'); g.addColorStop(1, 'rgba(255,170,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return texFrom(c, { srgbSpace: true }); })();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1, .75, .4) })); antAnchor.add(halo);
  const rot = (v, ax, az) => { const c = Math.cos(az), s = Math.sin(az); const x = v.x * c - v.y * s, y = v.x * s + v.y * c, z = v.z; const c2 = Math.cos(ax), s2 = Math.sin(ax); return new THREE.Vector3(x, y * c2 - z * s2, y * s2 + z * c2); };
  function setAntenna(ax, az) {
    const pts = ANT.map((p, i) => rot(p, ax * antLen[i], az * antLen[i]));
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 48, .032, 18);
    antMesh.geometry.dispose(); antMesh.geometry = geo;
    bead.position.copy(rot(new THREE.Vector3(.222, .292, 0), ax, az)); halo.position.copy(bead.position);
  }
  // montre : boîtier chromé, verre bombé, bracelet en émail (poignet du bras 0, comme au chapitre 4)
  const watch = new THREE.Group(); watch.position.set(0, -.262, 0); watch.scale.setScalar(1.12); arms[0].pv.add(watch);
  {
    const chrome = new THREE.MeshPhysicalMaterial({ color: hex('#F2F3F5'), metalness: 1, roughness: .07, clearcoat: .4, clearcoatRoughness: .02 });
    const band = glaze('#5B5F9E', { roughness: .22, clearcoatRoughness: .03 });
    const strap = new THREE.Mesh(new THREE.TorusGeometry(.093, .019, 20, 64), band); strap.rotation.x = Math.PI / 2; strap.scale.set(1, 1, 1.25); watch.add(strap);
    const face = new THREE.Group(); face.position.z = .098; watch.add(face);
    const caseM = new THREE.Mesh(new THREE.CylinderGeometry(.05, .053, .026, 56), chrome); caseM.rotation.x = Math.PI / 2; face.add(caseM);
    const bez = new THREE.Mesh(new THREE.TorusGeometry(.047, .0075, 14, 56), chrome); bez.position.z = .013; face.add(bez);
    const sc = makeCanvas(256, 256), sx = sc.getContext('2d');
    sx.fillStyle = '#10141F'; sx.fillRect(0, 0, 256, 256);
    sx.lineCap = 'round'; sx.lineWidth = 16; sx.strokeStyle = '#1F3A36'; sx.beginPath(); sx.arc(128, 128, 92, 0, Math.PI * 2); sx.stroke();
    sx.strokeStyle = '#7FF0C4'; sx.beginPath(); sx.arc(128, 128, 92, -Math.PI / 2, Math.PI * .95); sx.stroke();
    sx.fillStyle = '#FFE2B0'; sx.font = '700 64px sans-serif'; sx.textAlign = 'center'; sx.textBaseline = 'middle'; sx.fillText('9:41', 128, 132);
    const scrT = texFrom(sc, { srgbSpace: true });
    const scr = new THREE.Mesh(new THREE.CircleGeometry(.043, 48), new THREE.MeshPhysicalMaterial({ color: hex('#0B0E15'), roughness: .05, clearcoat: 1, clearcoatRoughness: .01, emissive: hex('#ffffff'), emissiveMap: scrT, emissiveIntensity: .55 }));
    scr.position.z = .0136; face.add(scr);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .014, 16), chrome); crown.rotation.z = Math.PI / 2; crown.position.set(.058, 0, 0); face.add(crown);
    for (const sy of [-1, 1]) { const lug = new THREE.Mesh(new THREE.BoxGeometry(.05, .018, .02), chrome); lug.position.set(0, sy * .052, -.008); face.add(lug); }
    watch.traverse(o => { if (o.isMesh) o.castShadow = true; });
  }

  /* ---------- le socle en résine ---------- */
  const island = new THREE.Group(); scene.add(island);
  const SIDE = islandSide();
  const sideMat = new THREE.MeshStandardMaterial({ map: SIDE.map, normalMap: SIDE.normal, normalScale: new THREE.Vector2(.9, .9), roughness: 1, roughnessMap: SIDE.rough });
  const side = new THREE.Mesh(SIDE.geo, sideMat); side.receiveShadow = true; island.add(side);
  const topMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .78 });
  const top = new THREE.Mesh(islandTop(), topMat); top.receiveShadow = true; island.add(top);
  // racines sous la pointe
  {
    const rm = new THREE.MeshPhysicalMaterial({ color: hex('#7E583F'), roughness: .55, clearcoat: .5, clearcoatRoughness: .2 });
    const R0 = rng(5);
    for (let i = 0; i < 5; i++) {
      const th = i / 5 * Math.PI * 2 + .4 + R0() * .4, y0 = -1.22 - R0() * .22;
      const prof = SIDE.prof; let r0 = .2; for (const p of prof) if (Math.abs(p.y - y0) < .02) { r0 = p.x; break; }
      const p0 = new THREE.Vector3(Math.sin(th) * r0 * .92, y0, Math.cos(th) * r0 * .92);
      const out = new THREE.Vector3(Math.sin(th), 0, Math.cos(th));
      const L = .1 + R0() * .1;
      const pts = [p0, p0.clone().addScaledVector(out, .05).add(new THREE.Vector3(0, -L * .35, 0)), p0.clone().addScaledVector(out, .02 + R0() * .06).add(new THREE.Vector3((R0() - .5) * .06, -L * .75, (R0() - .5) * .06)), p0.clone().addScaledVector(out, -.02 + R0() * .05).add(new THREE.Vector3((R0() - .5) * .08, -L, (R0() - .5) * .08))];
      const curve = new THREE.CatmullRomCurve3(pts), TS = 24, RS = 8;
      const g = new THREE.TubeGeometry(curve, TS, .024, RS);
      const pp = g.attributes.position;
      for (let k = 0; k < pp.count; k++) { const ring = Math.floor(k / (RS + 1)), c = curve.getPointAt(ring / TS), tp = 1 - ring / TS * .9; pp.setXYZ(k, c.x + (pp.getX(k) - c.x) * tp, c.y + (pp.getY(k) - c.y) * tp, c.z + (pp.getZ(k) - c.z) * tp); }
      g.computeVertexNormals();
      island.add(new THREE.Mesh(g, rm));
    }
  }
  // galets polis : sur le dessus, au bord de la flaque, et pris dans les couches
  const pebbleGeo = (() => { const g = new THREE.SphereGeometry(1, 40, 26), p = g.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), f = 1 + .1 * fbm3(x * 1.3, y * 1.3, z * 1.3, 2, 151); p.setXYZ(k, x * f, y * f, z * f); } g.computeVertexNormals(); return g; })();
  const stoneMats = ['#E6DDCF', '#A99F95', '#CFA894', '#7E7670', '#EADCC2', '#9FA8A0'].map(c => new THREE.MeshPhysicalMaterial({ color: hex(c), roughness: .25, clearcoat: .85, clearcoatRoughness: .07 }));
  const pebble = (x, y, z, sx, sy, sz, m, ry = 0) => { const o = new THREE.Mesh(pebbleGeo, stoneMats[m]); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(.2 * Math.sin(m + ry), ry, .15 * Math.cos(m * 3 + ry)); o.castShadow = o.receiveShadow = true; island.add(o); return o; };
  for (const [x, z, s, m, ry] of [[.05, 1.0, .07, 0, .3], [.73, .58, .055, 2, 1.2], [.14, .6, .04, 4, 2], [-.36, 1.12, .06, 3, .7], [1.12, -.42, .075, 1, 2.6], [-1.15, .62, .05, 5, 1.9], [.84, 1.0, .035, 4, .4]]) pebble(x, groundY(x, z) + s * .25, z, s * 1.25, s * .62, s, m, ry);
  {
    const R1 = rng(17);
    for (let i = 0; i < 4; i++) {
      const th = -1.2 + i / 3 * 2.4 + (R1() - .5) * .3, y = -.3 - R1() * .85; let r0 = 1;
      for (const p of SIDE.prof) if (Math.abs(p.y - y) < .012) { r0 = p.x; break; }
      const s = .04 + R1() * .045;
      pebble(Math.sin(th) * (r0 - s * .6), y, Math.cos(th) * (r0 - s * .6), s * 1.4, s * .85, s, [1, 2, 3, 5][Math.floor(R1() * 4)], th);
    }
  }
  // l'arbuste (cadeau) : céramique émaillée
  {
    const shrub = new THREE.Group(); shrub.position.set(.6, groundY(.6, -.78), -.78); island.add(shrub);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, .3, 14), glaze('#8A5A3C', { roughness: .4 })); tr.position.y = .15; tr.castShadow = true; shrub.add(tr);
    const lg = (() => { const g = new THREE.SphereGeometry(1, 40, 28), p = g.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), f = 1 + .06 * vn3(x * 4, y * 4, z * 4, 171) + .03 * vn3(x * 9, y * 9, z * 9, 173); p.setXYZ(k, x * f, y * f, z * f); } g.computeVertexNormals(); return g; })();
    const lm = glaze('#5FAE4E', { roughness: .32 });
    for (const [x, y, z, r] of [[0, .44, 0, .2], [.15, .34, .07, .14], [-.15, .36, .05, .14], [.03, .58, -.03, .13], [-.06, .3, .14, .11], [.1, .5, -.1, .12]]) { const m = new THREE.Mesh(lg, lm); m.position.set(x, y, z); m.scale.setScalar(r); m.castShadow = m.receiveShadow = true; shrub.add(m); }
  }
  // fleurs en céramique aux couleurs des thèmes
  const petalGeo = (() => {
    const g = new THREE.SphereGeometry(1, 28, 16), p = g.attributes.position, col = [];
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); p.setY(k, y + .55 * x * x); const t = (x + 1) / 2; const v = .72 + .28 * sm(t); col.push(v, v, v); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  })();
  const centerGeo = (() => { const g = new THREE.SphereGeometry(1, 28, 18), p = g.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), f = 1 + .07 * Math.max(0, Math.sin(x * 20) * Math.sin(z * 20) * Math.sin(y * 20)); p.setXYZ(k, x * f, y * f, z * f); } g.computeVertexNormals(); return g; })();
  const stemMat = glaze('#4E9A45', { roughness: .3 }), leafMat = glaze('#5DAE4C', { roughness: .3 }), ctrMat = glaze('#FFD25E', { roughness: .45, clearcoat: .6 });
  const FLOWERS = [
    { x: -.96, z: .3, c: '#FF9C66', h: .28, lean: [.1, .18] }, { x: -.6, z: .9, c: '#FF8A73', h: .24, lean: [-.05, .28] },
    { x: .98, z: .2, c: '#A08CF7', h: .3, lean: [-.12, .14] }, { x: -1.06, z: -.22, c: '#6A84D6', h: .33, lean: [.06, .12] },
    { x: -.72, z: -.66, c: '#F27BA3', h: .31, lean: [.08, .2] }, { x: .8, z: .55, c: '#F2C85A', h: .28, lean: [-.95, .3], drop: true },
  ];
  const flowers = FLOWERS.map((F, i) => {
    const g = new THREE.Group(); g.position.set(F.x, groundY(F.x, F.z) - .01, F.z); island.add(g);
    const hx = F.lean[0] * F.h, hz = F.lean[1] * F.h, hy = F.h;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(hx * .15, hy * .4, hz * .2), new THREE.Vector3(hx * .6, hy * .82, hz * .6), new THREE.Vector3(hx, hy, hz)]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, .011, 10), stemMat); stem.castShadow = true; g.add(stem);
    for (const [t, a, s] of [[.3, .6 + i, 1], [.45, 3.5 + i, .8]]) {
      const lp = curve.getPointAt(t), lf = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), leafMat);
      lf.scale.set(.07 * s, .011, .028 * s); lf.position.copy(lp); lf.rotation.set(0, a, .45); lf.translateX(.055 * s); lf.castShadow = true; g.add(lf);
    }
    const head = new THREE.Group(); head.position.set(hx, hy, hz); head.rotation.set(.35 + F.lean[1] * .5, i * 1.3, -F.lean[0] * .8); g.add(head);
    const pm = glaze(F.c, { vertexColors: true });
    for (let k = 0; k < 5; k++) { const pv = new THREE.Group(); pv.rotation.y = k / 5 * Math.PI * 2; head.add(pv); const pt = new THREE.Mesh(petalGeo, pm); pt.scale.set(.06, .016, .04); pt.position.x = .052; pt.rotation.z = .32; pt.castShadow = true; pv.add(pt); }
    const ct = new THREE.Mesh(centerGeo, ctrMat); ct.scale.set(.03, .022, .03); ct.position.y = .012; head.add(ct);
    return { g, head, F, rest: head.rotation.clone() };
  });
  // goutte qui se forme sous la fleur penchée puis tombe dans la flaque
  const dropF = flowers.find(f => f.F.drop);
  const dropMat = new THREE.MeshPhysicalMaterial({ color: hex('#D6ECE6'), roughness: .01, clearcoat: 1, clearcoatRoughness: .01, specularIntensity: 1, transparent: true, opacity: .78, envMapIntensity: 2.2 });
  const drop = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), dropMat); island.add(drop);
  island.updateMatrixWorld(true);
  const dropStart = (() => { const v = new THREE.Vector3(.07, -.012, 0); dropF.head.updateMatrixWorld(true); return dropF.head.localToWorld(v); })();
  const DROP = { x: dropStart.x, z: dropStart.z, y0: dropStart.y - .022 };
  const dropPM = puddleMask(DROP.x, DROP.z);

  // la flaque : un miroir d'eau calme (réflexion rendue dans une sous-fenêtre de l'écran), rides et goutte
  const reflRT = new THREE.WebGLRenderTarget(small ? 384 : 720, small ? 160 : 300, { type: THREE.HalfFloatType, samples: 2 });
  const reflCam = new THREE.PerspectiveCamera();
  const waterU = {
    tRefl: { value: reflRT.texture }, uTexMat: { value: new THREE.Matrix4() }, uTime: { value: 0 }, uDrop: { value: new THREE.Vector3(DROP.x, DROP.z, -99) },
    uCamPos: { value: new THREE.Vector3() }, uKey: { value: new THREE.Vector3() }, uRim: { value: new THREE.Vector3() },
  };
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .72), new THREE.ShaderMaterial({
    uniforms: waterU,
    vertexShader: `uniform mat4 uTexMat; varying vec4 vT; varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vT = uTexMat * w; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D tRefl; uniform float uTime; uniform vec3 uDrop; uniform vec3 uCamPos, uKey, uRim; varying vec4 vT; varying vec3 vW;
      float rip(vec2 p) {
        float h = .00035 * sin(dot(p, vec2(41., 23.)) + uTime * 2.1) + .0003 * sin(dot(p, vec2(-29., 37.)) + uTime * 1.7) + .0002 * sin(dot(p, vec2(63., -12.)) + uTime * 2.9);
        float dt = uTime - uDrop.z;
        if (dt > 0. && dt < 4.) { float r = length(p - uDrop.xy);
          for (int i = 0; i < 3; i++) { float t = dt - float(i) * .16; if (t <= 0.) continue; float c = .26 * t + .01; float w = .018 + .025 * t;
            h += .0042 * exp(-pow((r - c) / w, 2.)) * cos((r - c) * 95.) * exp(-t * 1.1) / (1. + r * 5.); } }
        return h; }
      void main(){
        vec2 p = vW.xz; float e = .0025, h0 = rip(p);
        vec2 g = vec2(rip(p + vec2(e, 0.)) - h0, rip(p + vec2(0., e)) - h0) / e;
        vec3 n = normalize(vec3(-g.x, 1., -g.y)), V = normalize(uCamPos - vW);
        vec4 t = vT; t.xy += n.xz * .9 * t.w * .06;
        vec3 refl = texture2DProj(tRefl, t).rgb;
        float ct = max(dot(n, V), 0.), F = .02 + .98 * pow(1. - ct, 5.);
        F = mix(F, 1., .42);
        vec3 col = mix(vec3(.028, .024, .016), refl * .92, F);
        vec3 Hk = normalize(uKey + V), Hr = normalize(uRim + V);
        col += vec3(1., .96, .9) * (pow(max(dot(n, Hk), 0.), 900.) * 6. + pow(max(dot(n, Hr), 0.), 600.) * 3.);
        gl_FragColor = vec4(col, 1.); }`,
  }));
  water.rotation.x = -Math.PI / 2; water.position.set(PUD.x, WATER_Y, PUD.z); island.add(water);
  water.receiveShadow = false;

  // herbe en résine peinte : brins épais sculptés, en touffes penchées, peints du sombre au clair ; ils bougent au vent
  const grassU = { uTime: { value: 0 }, uWind: { value: small ? 0 : 1 }, uRimDir: SH.rimDir };
  const grass = (() => {
    // un brin = une lame épaisse, effilée et courbée (section en toit : deux pans et une arête)
    const hs = [0, .36, .7, 1], ws = [1, .82, .45, 0], W0 = .046;
    const pos = [], nor = [], idx = [];
    hs.forEach((h, i) => {
      const bend = .42 * h * h, wv = ws[i] * W0 / 2;   // z est mis à l'échelle de la hauteur du brin (instance)
      if (ws[i] > 0) { pos.push(-wv, h, bend, 0, h, bend + ws[i] * .16, wv, h, bend); for (const nx of [-1, 0, 1]) { const n = new THREE.Vector3(nx * .7, .25 - .2 * h, 1).normalize(); nor.push(n.x, n.y, n.z); } }
      else { pos.push(0, h, bend); nor.push(0, .2, 1); }
    });
    for (let i = 0; i < 2; i++) { const a = i * 3, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
    idx.push(6, 9, 7, 7, 9, 8);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx);
    const R2 = rng(23), list = [];
    const footD = (x, z) => Math.min(...[-1, 1].map(s => Math.hypot((x - s * .25) / .19, (z - .17) / .25)));
    const N = small ? 600 : 1050;
    for (let c = 0; c < N; c++) {
      const r = (ISL.R - .03) * Math.sqrt(R2()), a = R2() * Math.PI * 2, cx = Math.sin(a) * r, cz = Math.cos(a) * r;
      const pmk = puddleMask(cx, cz), fd = footD(cx, cz);
      if (pmk > .35 || fd < .85) continue;
      let ch = .058 + R2() * .045; if (fd < 1.7) ch *= .62; ch *= lerp(.4, 1, sstep(1.05, 1.6, Math.hypot((cx - PUD.x) / PUD.ax, (cz - PUD.z) / PUD.az))); ch *= 1 - .45 * sstep(ISL.R - .25, ISL.R, r);
      const inward = Math.atan2(-cx, -cz), edgeW = sstep(ISL.R - .35, ISL.R - .05, r);
      const lean0 = R2() * Math.PI * 2, lean = lean0 + Math.atan2(Math.sin(inward - lean0), Math.cos(inward - lean0)) * edgeW, n = 7 + Math.floor(R2() * 5);
      for (let k = 0; k < n; k++) {
        const rr = .038 * Math.sqrt(R2()), aa = R2() * Math.PI * 2, x = cx + Math.sin(aa) * rr, z = cz + Math.cos(aa) * rr;
        if (Math.hypot(x, z) > ISL.R - .01 || puddleMask(x, z) > .05 || footD(x, z) < 1) continue;
        // les brins d'une touffe s'ouvrent en éventail autour d'une direction commune
        list.push([x, z, ch * (.7 + R2() * .45), lean + ((aa - lean) * .35 + (R2() - .5) * .9) * (1 - .7 * edgeW), .25 + rr * 9 + R2() * .2]);
      }
    }
    const lipY = r => { const P = [[1.4, .004], [1.43, -.012], [1.462, -.04], [1.474, -.072]]; for (let k = 1; k < P.length; k++) if (r <= P[k][0]) return lerp(P[k - 1][1], P[k][1], (r - P[k - 1][0]) / (P[k][0] - P[k - 1][0])); return -.072; };
    const NL = small ? 400 : 750;
    for (let k = 0; k < NL; k++) { const a = R2() * Math.PI * 2, r = 1.395 + R2() * .06, x = Math.sin(a) * r, z = Math.cos(a) * r; list.push([x, z, .035 + R2() * .03, a + (R2() - .5) * 1.2, .5 + (r - 1.395) * 9 + R2() * .3, lipY(r) - .004]); }
    const mesh = new THREE.InstancedMesh(geo, null, list.length);
    const wind = new Float32Array(list.length * 3), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
    const WD = new THREE.Vector2(1, .35).normalize();
    list.forEach(([x, z, h, yaw, tilt, yl], i) => {
      const r = Math.hypot(x, z);
      const y = yl ?? groundY(x, z) - .006;
      const out = 0;
      e.set(tilt * .9, yaw, 0, 'YXZ'); q.setFromEuler(e);
      if (out > 0) { const th = Math.atan2(x, z); q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(Math.cos(th), 0, -Math.sin(th)), out)); }
      m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(.85 + R2() * .4, h, h));
      mesh.setMatrixAt(i, m4);
      const c = Math.cos(-yaw), s = Math.sin(-yaw);
      wind[i * 3] = WD.x * c + WD.y * s; wind[i * 3 + 1] = -WD.x * s + WD.y * c; wind[i * 3 + 2] = x * 5.5 + z * 2.2 + R2() * .6;
      const fd = footD(x, z), ao = lerp(.45, 1, sstep(1, 2.6, fd)) * lerp(.75, 1, sstep(0, .3, Math.hypot((x - PUD.x) / PUD.ax, (z - PUD.z) / PUD.az) - 1));
      col.setRGB(lerp(.85, 1.1, R2()), lerp(.9, 1.06, R2()), lerp(.8, 1.12, R2())).multiplyScalar(ao * (yl !== undefined ? .9 : 1));
      mesh.setColorAt(i, col);
    });
    geo.setAttribute('aWind', new THREE.InstancedBufferAttribute(wind, 3));
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .34, side: THREE.DoubleSide });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, grassU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aWind; uniform float uTime; uniform float uWind; varying float vH;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vH = position.y;`)
        .replace('#include <project_vertex>', `vec4 mvPosition = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
          #endif
          { float hw = position.y * position.y;
            float ww = sin(uTime * 1.7 + aWind.z) * .55 + sin(uTime * 3.1 + aWind.z * 1.7) * .22 + .3;
            mvPosition.xz += vec2(.94, .33) * ww * hw * .012 * uWind; }
          mvPosition = modelViewMatrix * mvPosition;
          gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vH; uniform vec3 uRimDir;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec3 gc = mix(vec3(.05, .15, .045), vec3(.2, .46, .1), smoothstep(0., .55, vH));
          gc = mix(gc, vec3(.52, .74, .22), smoothstep(.55, 1., vH));
          diffuseColor.rgb *= gc;`)
        .replace('#include <opaque_fragment>', `{ vec3 Vv = normalize(vViewPosition); float bt = pow(saturate(dot(Vv, -uRimDir)), 3.) * vH * vH;
            outgoingLight += vec3(.45, .7, .16) * bt * .3; }
          #include <opaque_fragment>`);
    };
    mesh.material = mat; mesh.receiveShadow = true; mesh.castShadow = false;
    island.add(mesh);
    // la flaque ne voit que l'herbe de sa berge : un petit maillage à part, rendu seulement dans la réflexion
    const near = []; list.forEach((L, i) => { if (Math.hypot((L[0] - PUD.x) / PUD.ax, (L[1] - PUD.z) / PUD.az) < 1.9) near.push(i); });
    const shore = new THREE.InstancedMesh(geo, mat, near.length);
    near.forEach((i, k) => { mesh.getMatrixAt(i, m4); shore.setMatrixAt(k, m4); mesh.getColorAt(i, col); shore.setColorAt(k, col); });
    shore.visible = false; island.add(shore); mesh.userData.shore = shore;
    return mesh;
  })();

  /* ---------- poussières dans la lumière ---------- */
  const DUST_N = small ? 0 : 90;
  const dust = (() => {
    const R3 = rng(31), base = [], pos = new Float32Array(Math.max(1, DUST_N) * 3), size = new Float32Array(Math.max(1, DUST_N)), bright = new Float32Array(Math.max(1, DUST_N));
    for (let i = 0; i < DUST_N; i++) { base.push([(R3() - .5) * 5, -.6 + R3() * 3.4, -1.6 + R3() * 5.2, R3() * 6.28, .02 + R3() * .05, R3()]); size[i] = 1.4 + R3() * 2.2; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); geo.setAttribute('aBright', new THREE.BufferAttribute(bright, 1));
    const U = { tDepth: { value: mainRT.depthTexture }, uRes: { value: new THREE.Vector2(BW, BH) }, uPx: { value: pixelRatio }, uFocus: { value: 9 }, uK: { value: 36 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aSize; attribute float aBright; uniform float uPx, uFocus, uK; varying float vB; varying float vSoft;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; float z = -mv.z;
          float coc = min(uK * abs(1. - uFocus / z), 26.); gl_PointSize = (aSize + coc * 1.5) * uPx;
          vB = aBright / (1. + coc * coc * .05); vSoft = clamp(coc / 5., 0., 1.); }`,
      fragmentShader: `uniform sampler2D tDepth; uniform vec2 uRes; varying float vB; varying float vSoft;
        void main(){ vec2 pc = gl_PointCoord * 2. - 1.; float d = length(pc); if (d > 1.) discard;
          if (gl_FragCoord.z > texture2D(tDepth, gl_FragCoord.xy / uRes).x + 1e-6) discard;
          float a = mix(exp(-d * d * 5.), smoothstep(1., .78, d) * .55 + .25 * smoothstep(1., .9, d) * smoothstep(.7, .9, d), vSoft);
          gl_FragColor = vec4(vec3(1., .94, .84) * a * vB, 1.); }`,
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
    const sc = new THREE.Scene(); sc.add(pts);
    return { base, pos, bright, geo, U, sc };
  })();

  /* ---------- passe finale : profondeur de champ, tonalité, sRGB, vignettage, grain ---------- */
  const finU = {
    tColor: { value: mainRT.texture }, tDepth: { value: mainRT.depthTexture }, uRes: { value: new THREE.Vector2(BW, BH) },
    uNear: { value: cam.near }, uFar: { value: cam.far }, uFocus: { value: 9 }, uK: { value: small ? 0 : 36 * pixelRatio }, uMaxC: { value: 10 * pixelRatio },
    uExp: { value: 1 }, uGrain: { value: small ? 0 : .016 }, uSeed: { value: 0 }, uVig: { value: small ? 0 : .09 },
  };
  const finScene = new THREE.Scene(), finCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const finMesh = new THREE.Mesh(tri, new THREE.ShaderMaterial({
    uniforms: finU, depthTest: false, depthWrite: false,
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tColor, tDepth; uniform vec2 uRes; uniform float uNear, uFar, uFocus, uK, uMaxC, uExp, uGrain, uSeed, uVig;
      ${toneGLSL}
      float linZ(float d) { float z = d * 2. - 1.; return 2. * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
      float coc(float d) { return d > .99990 ? uMaxC : min(uK * abs(1. - uFocus / linZ(d)), uMaxC); }
      float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715)))); }
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        float d0 = texture2D(tDepth, uv).x; vec3 col = texture2D(tColor, uv).rgb;
        float c0 = coc(d0);
        if (c0 > .7 && d0 < .9999) {
          float ph = ign(gl_FragCoord.xy) * 6.2832; vec3 acc = col; float ws = 1.;
          for (int i = 0; i < 16; i++) {
            float r = sqrt((float(i) + .5) / 16.), th = float(i) * 2.39996 + ph;
            vec2 o = vec2(cos(th), sin(th)) * r * c0;
            vec2 q = uv + o / uRes; float dq = texture2D(tDepth, q).x; float cq = coc(dq);
            float w = smoothstep(r * c0 - 1., r * c0 + .5, cq);
            acc += texture2D(tColor, q).rgb * w; ws += w;
          }
          col = acc / ws;
        }
        col *= uExp;
        col = vec3(shoulder(col.r), shoulder(col.g), shoulder(col.b));
        vec3 s = l2s(col);
        s = mix(s, s * s * (3. - 2. * s), .14);
        vec2 vq = (uv - .5) * vec2(uRes.x / uRes.y, 1.);
        s *= 1. - uVig * smoothstep(.35, 1.05, length(vq * vec2(.8, 1.)));
        float n = fract(sin(dot(gl_FragCoord.xy + uSeed * 17.31, vec2(12.9898, 78.233))) * 43758.5453) - .5;
        s += n * uGrain;
        gl_FragColor = vec4(s, 1.);
      }`,
  }));
  finMesh.frustumCulled = false; finScene.add(finMesh);

  /* ---------- pose ---------- */
  function applyPose(P) {
    root.position.set(P.x || 0, (P.y0 || 0), P.z || 0); root.rotation.y = P.yaw || 0;
    const sy = 1 + P.sq, sx = 1 / Math.sqrt(Math.max(.3, sy));
    body.position.set(0, P.lift, 0);
    body.rotation.set(P.leanX, P.twist, -P.leanZ);
    body.scale.set(sx, sy, sx);
    for (const g of [antAnchor, arms[0].anchor, arms[1].anchor]) g.scale.set(1 / sx, 1 / sy, 1 / sx);
    arms[0].pv.rotation.set(P.aLx, 0, -(P.aL + (P.armLag || 0)));
    arms[1].pv.rotation.set(P.aRx, 0, (P.aR + (P.armLag || 0)));
    feet.forEach((f, i) => { const s = i ? 1 : -1; f.position.set(s * .25, .05 + P.lift * .92, .14); });
    setAntenna(P.antX, P.antZ);
  }

  /* ---------- réflexion de la flaque : caméra miroir, restreinte à la sous-fenêtre de la flaque ---------- */
  const _v = new THREE.Vector3(), _w = new THREE.Vector3(), plane = new THREE.Plane(), clip = new THREE.Vector4(), qv = new THREE.Vector4();
  const corners = [[-.56, -.36], [.56, -.36], [-.56, .36], [.56, .36]].map(([x, z]) => new THREE.Vector3(PUD.x + x, WATER_Y, PUD.z + z));
  function renderReflection() {
    reflCam.position.copy(cam.position); reflCam.position.y = 2 * WATER_Y - cam.position.y;
    _v.set(0, 0, -1).applyQuaternion(cam.quaternion).add(cam.position); _v.y = 2 * WATER_Y - _v.y;
    _w.set(0, 1, 0).applyQuaternion(cam.quaternion); _w.y = -_w.y;
    reflCam.up.copy(_w); reflCam.fov = cam.fov; reflCam.aspect = cam.aspect; reflCam.near = cam.near; reflCam.far = cam.far;
    reflCam.lookAt(_v); reflCam.updateProjectionMatrix(); reflCam.updateMatrixWorld(); reflCam.matrixWorldInverse.copy(reflCam.matrixWorld).invert();
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (const c of corners) { _v.copy(c).applyMatrix4(reflCam.matrixWorldInverse).applyMatrix4(reflCam.projectionMatrix); x0 = Math.min(x0, _v.x); x1 = Math.max(x1, _v.x); y0 = Math.min(y0, _v.y); y1 = Math.max(y1, _v.y); }
    const mx = (x1 - x0) * .06, my = (y1 - y0) * .1; x0 -= mx; x1 += mx; y0 -= my; y1 += my;
    const S = new THREE.Matrix4().set(2 / (x1 - x0), 0, 0, -(x1 + x0) / (x1 - x0), 0, 2 / (y1 - y0), 0, -(y1 + y0) / (y1 - y0), 0, 0, 1, 0, 0, 0, 0, 1);
    const P = reflCam.projectionMatrix; P.premultiply(S);
    plane.setFromNormalAndCoplanarPoint(_w.set(0, 1, 0), _v.set(0, WATER_Y, 0)).applyMatrix4(reflCam.matrixWorldInverse);
    clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const e = P.elements;
    qv.x = (Math.sign(clip.x) + e[8]) / e[0]; qv.y = (Math.sign(clip.y) + e[9]) / e[5]; qv.z = -1; qv.w = (1 + e[10]) / e[14];
    clip.multiplyScalar(2 / clip.dot(qv));
    e[2] = clip.x; e[6] = clip.y; e[10] = clip.z + 1 - .002; e[14] = clip.w;
    reflCam.projectionMatrixInverse.copy(P).invert();
    waterU.uTexMat.value.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1).multiply(P).multiply(reflCam.matrixWorldInverse);
    water.visible = false; backdrop.visible = false; halo.visible = false; grass.visible = false; grass.userData.shore.visible = true;
    R.setRenderTarget(reflRT); R.setClearColor(reflClear(), 1); R.clear(); R.render(scene, reflCam);
    water.visible = true; backdrop.visible = true; halo.visible = true; grass.visible = true; grass.userData.shore.visible = false;
  }

  /* ---------- une image ---------- */
  const st = { t: 0 };
  function render(S) {
    const t = S.t; // secondes
    applyPose(S.pose);
    const glow = S.pose.glow;
    beadU.uGlow.value = clamp(glow, 0, 1.3);
    halo.material.opacity = clamp(.15 + .5 * glow) * .6; halo.scale.setScalar(.3 + .2 * glow);
    // vent : fleurs qui oscillent ; la goutte
    grassU.uTime.value = t;
    flowers.forEach((f, i) => {
      const w = Math.sin(t * 1.55 + i * 1.9) * .6 + Math.sin(t * 2.7 + i) * .25;
      f.g.rotation.set(.022 * w, 0, .03 * w);
      f.head.rotation.set(f.rest.x + .03 * Math.sin(t * 2.1 + i), f.rest.y, f.rest.z + .02 * w);
    });
    const D = S.drop || { grow: 0, fall: -1 };
    if (dropF) {
      // la fleur se redresse un peu quand la goutte la quitte
      const rec = D.fall > 0 ? Math.exp(-D.fall * 5) * Math.sin(D.fall * 22) * .06 : 0;
      dropF.g.rotation.z += rec;
    }
    if (D.grow > 0 && D.fall < 0) { const r = .006 + .018 * D.grow; drop.visible = true; drop.scale.set(r, r * (1 + .35 * D.grow), r); drop.position.set(DROP.x, DROP.y0 - r * .3, DROP.z); }
    else if (D.fall >= 0 && D.fallY > WATER_Y) { const r = .024; drop.visible = true; drop.scale.set(r * .92, r * 1.2, r * .92); drop.position.set(DROP.x, D.fallY, DROP.z); }
    else drop.visible = false;
    waterU.uTime.value = t; waterU.uDrop.value.z = D.impact ?? -99;
    // caméra
    const C = S.cam; cam.fov = C.fov; cam.aspect = width / height; cam.position.set(...C.pos); cam.up.set(0, 1, 0); cam.lookAt(new THREE.Vector3(...C.look));
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    scene.updateMatrixWorld(true);
    
    // directions de lumière dans le repère de vue (contre-jour pour la translucidité)
    SH.rimDir.value.copy(rimR.position).normalize().transformDirection(cam.matrixWorldInverse);
    beadU.uKeyV.value.copy(key.position).normalize().transformDirection(cam.matrixWorldInverse);
    waterU.uCamPos.value.copy(cam.position); waterU.uKey.value.copy(key.position).normalize(); waterU.uRim.value.copy(rimR.position).normalize();
    // visage
    const ft = FT[faceS]; drawFaceFig(ft.x1, ft.x2, ft.S, S.pose.f); ft.t1.needsUpdate = true; ft.t2.needsUpdate = true;
    // ombre du socle sur le papier (projetée sous le socle)
    _v.set(0, -2.9, 0).project(cam); bgU.uShadow.value.set(_v.x * .5 + .5, _v.y * .5 + .5, S.shadowR ?? .22, small ? 0 : .16);
    // passes
    finU.uExp.value = bgU.uExp.value = S.exposure ?? 1;
    R.shadowMap.autoUpdate = true;
    renderReflection();
    R.shadowMap.autoUpdate = false;
    R.setRenderTarget(mainRT); R.setClearColor(0x000000, 1); R.clear(); R.render(scene, cam);
    const focus = S.focus ?? cam.position.distanceTo(_w.set(0, .95, .42).applyMatrix4(body.matrixWorld));
    finU.uFocus.value = focus; finU.uSeed.value = Math.floor(t * 30) % 97;
    if (S.debug === 'refl') { finU.tColor.value = reflRT.texture; finU.uK.value = 0; }
    R.setRenderTarget(null); R.render(finScene, finCam);
    if (S.debug === 'refl') { finU.tColor.value = mainRT.texture; finU.uK.value = small ? 0 : 36 * pixelRatio; return; }
    if (DUST_N) {
      for (let i = 0; i < DUST_N; i++) {
        const [x, y, z, ph, sp, b] = dust.base[i];
        dust.pos[i * 3] = x + Math.sin(t * .23 + ph) * .25 + t * sp * .6; dust.pos[i * 3 + 1] = y + Math.sin(t * .31 + ph * 1.7) * .12 + t * sp * .25; dust.pos[i * 3 + 2] = z + Math.cos(t * .19 + ph) * .2;
        dust.bright[i] = (.25 + .55 * b) * (.55 + .45 * Math.sin(t * 1.3 + ph * 3)) * (S.dust ?? 1);
      }
      dust.geo.attributes.position.needsUpdate = true; dust.geo.attributes.aBright.needsUpdate = true;
      dust.U.uFocus.value = focus;
      R.autoClear = false; R.render(dust.sc, cam); R.autoClear = true;
    }
  }
  function stats() { let tris = 0, draws = 0; scene.traverse(o => { if (o.isMesh && o.visible) { const g = o.geometry; const n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += o.isInstancedMesh ? n * o.count : n; draws++; } }); return { tris: Math.round(tris), draws }; }
  function project(p) { _v.set(...p).project(cam); return [(_v.x + 1) / 2 * width, (1 - _v.y) / 2 * height]; }
  return { R, scene, cam, render, stats, project, WATER_Y, DROP, root, body, grass, top, side, island };
}
