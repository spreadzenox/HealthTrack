// ile.js — l'île naturaliste : herbe instanciée (milliers de brins au vent), trèfles, fleurs aux pétales
// translucides, graminées, arbuste, galets, terre stratifiée en coupe avec cailloux, mousse, racines qui pendent.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { patchMat, canvasTex, rngF } from './matiere.js';

const C = h => new THREE.Color(h);
const lerp = (a, b, p) => a + (b - a) * p;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ---------- bruit 3D côté JS (déplacements de géométrie) ---------- */
function noise3(seed) {
  const r = rngF(seed), perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  const P = new Uint8Array(512); for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
  const G = new Float32Array(256); for (let i = 0; i < 256; i++) G[i] = r();
  const h = (x, y, z) => G[P[P[P[x & 255] + (y & 255)] + (z & 255)]], f = t => t * t * (3 - 2 * t);
  return (x, y, z) => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = f(x - ix), fy = f(y - iy), fz = f(z - iz);
    return lerp(lerp(lerp(h(ix, iy, iz), h(ix + 1, iy, iz), fx), lerp(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), fx), fy),
      lerp(lerp(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), fx), lerp(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), fx), fy), fz);
  };
}
const N3 = noise3(5), N3b = noise3(9);

/* ---------- vent (même champ en GLSL et en JS) ---------- */
const WIND_GLSL = /* glsl */`
uniform float uTime; uniform float uWindAmp;
vec2 windAt(vec2 p, float t) {
  float gust = .5 + .5 * sin(t * .55 + p.x * .9 - p.y * .6);
  float w = sin(t * 1.9 + p.x * 3.3 + p.y * 1.9) * .5 + sin(t * 3.1 + p.x * 6.1 - p.y * 4.7) * .22 + sin(t * 1.15 - p.y * 2.6) * .28;
  return vec2(.86, .5) * (.25 + .75 * gust) * (.5 + .5 * w) + vec2(-.5, .86) * .18 * sin(t * 2.3 + p.x * 4.1 + p.y * 2.);
}`;
export function windJS(x, z, t) {
  const gust = .5 + .5 * Math.sin(t * .55 + x * .9 - z * .6);
  const w = Math.sin(t * 1.9 + x * 3.3 + z * 1.9) * .5 + Math.sin(t * 3.1 + x * 6.1 - z * 4.7) * .22 + Math.sin(t * 1.15 - z * 2.6) * .28;
  const m = (.25 + .75 * gust) * (.5 + .5 * w), p = .18 * Math.sin(t * 2.3 + x * 4.1 + z * 2);
  return [.86 * m - .5 * p, .5 * m + .86 * p];
}

/* ---------- profil de l'île ---------- */
export const R_TOP = 1.5;
const TOP = [[0, .035], [.3, .034], [.6, .03], [.9, .022], [1.2, .012], [1.38, .004], [1.46, -.008], [1.505, -.03], [1.53, -.06], [1.54, -.1]];
const UNDER = [[1.54, -.1], [1.555, -.2], [1.535, -.32], [1.46, -.5], [1.33, -.7], [1.13, -.92], [.9, -1.12], [.66, -1.3], [.42, -1.45], [.2, -1.56], [.0001, -1.6]];
export function yTop(r) { for (let i = 1; i < TOP.length; i++) if (r <= TOP[i][0]) { const [r0, y0] = TOP[i - 1], [r1, y1] = TOP[i]; return lerp(y0, y1, (r - r0) / (r1 - r0)); } return -.1; }
const underSpline = new THREE.SplineCurve(UNDER.map(([x, y]) => new THREE.Vector2(x, y)));
const underPts = underSpline.getSpacedPoints(70);
function rUnder(y) { for (let i = 1; i < underPts.length; i++) { const a = underPts[i - 1], b = underPts[i]; if ((y <= a.y && y >= b.y)) return lerp(a.x, b.x, (y - a.y) / (b.y - a.y || 1)); } return 0; }
function dispUnder(x, y, z) { // déplacement radial du talus (même fonction pour la géométrie et pour poser cailloux et racines)
  const k = sstep(-.1, -.24, y);
  return k * ((N3(x * 2.2 + 7, y * 2.2, z * 2.2) - .5) * .2 + (N3b(x * 6, y * 6, z * 6) - .5) * .06 + (N3(x * 14, y * 3, z * 14) - .5) * .025);
}
export function surfaceUnder(a, y) { // point du talus à l'angle a et à la hauteur y
  const r = rUnder(y), x = Math.cos(a) * r, z = Math.sin(a) * r, d = dispUnder(x, y, z);
  return new THREE.Vector3(x + Math.cos(a) * d, y, z + Math.sin(a) * d);
}

/* ---------- matières végétales : vent + transluminance ---------- */
function plantMat(key, params, { wind = true, blade = false, flipBack = false, vColor = false, petalTint = false, sssAmt = 1, extraFrag = '' } = {}, shared) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: .62, side: THREE.DoubleSide }, params));
  const vrep = [];
  const bladeCode = blade ? `
      transformed.x *= aShape.x; transformed.y *= aShape.y;
      transformed.z += aShape.z * hB * hB * aShape.y;` : '';
  if (wind) vrep.push(['#include <begin_vertex>', `#include <begin_vertex>
    float hB = clamp(position.y, 0., 1.); vH = hB;
    ${bladeCode}
    #ifdef USE_INSTANCING
      vec3 ip = instanceMatrix[3].xyz; mat3 imW = mat3(instanceMatrix); float sc2 = dot(imW[0], imW[0]);
      vec2 wv = windAt(ip.xz, uTime + ${blade ? 'aShape.w' : 'fract(ip.x * 7.13 + ip.z * 3.7) * 6.'});
      float bend = hB * hB * uWindAmp * ${blade ? 'aShape.y' : 'sqrt(sc2)'};
      transformed += transpose(imW) * vec3(wv.x, -.3 * length(wv), wv.y) * bend / sc2;
    #endif`]);
  if (blade) vrep.push(['#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = normalize(objectNormal + vec3(0., 1.3, 0.));']);
  if (petalTint) vrep.push(['#include <color_vertex>', `vColor = vec4(1.0);
    #ifdef USE_COLOR
      vColor.rgb *= color;
    #endif
    #ifdef USE_INSTANCING_COLOR
      vColor.rgb *= mix(vec3(1.), instanceColor.rgb, uv.x);
    #endif`]);
  const frep = [
    ['#include <color_fragment>', `#include <color_fragment>
      diffuseColor.rgb *= mix(.42, 1., smoothstep(0., .5, vH));
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.22, 1.12, .66), smoothstep(.55, 1., vH) * ${blade ? '.55' : '0.'});
      ${extraFrag}`],
    ['#include <lights_fragment_begin>', `sssK = ${sssAmt.toFixed(2)} * (.15 + .85 * smoothstep(.05, .7, vH)); sssTint = diffuseColor.rgb * 1.35;
      #include <lights_fragment_begin>`],
  ];
  if (flipBack) frep.push(['#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal *= faceDirection;\n#endif']);
  const vDecl = (wind ? WIND_GLSL : '') + 'varying float vH;' + (blade ? 'attribute vec4 aShape;' : '');
  const U = shared;
  patchMat(m, { key, uniforms: U, sss: { wrap: [.6, .6, .5], col: '#ffffff', amt: 1, dist: .3, pow: 2.2 }, vDecl, vrep: wind ? vrep : vrep.concat([['#include <begin_vertex>', '#include <begin_vertex>\nvH = 1.;']]), fDecl: 'varying float vH;', frep });
  if (vColor) m.vertexColors = true;
  if (wind) { // ombre portée qui suit le vent
    const d = new THREE.MeshDepthMaterial();
    patchMat(d, { key: key + '-ombre', uniforms: U, vDecl, vrep: vrep.filter(r => r[0] === '#include <begin_vertex>') });
    m.userData.depth = d;
  }
  return m;
}

export function createIsland({ quality = 1 } = {}) {
  const group = new THREE.Group();
  const shared = { uTime: { value: 0 }, uWindAmp: { value: .16 } };
  const r = rngF(2024);
  const updaters = [];

  /* ----- dessus : sol sous l'herbe ----- */
  {
    const pts = TOP.map(([x, y]) => new THREE.Vector2(Math.max(1e-4, x), y)).reverse();
    const g = new THREE.LatheGeometry(pts, 180);
    const m = patchMat(new THREE.MeshStandardMaterial({ color: C('#ffffff'), roughness: .95 }), {
      key: 'ile-sol', vDecl: 'varying vec3 vW;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvW = position;']], fDecl: 'varying vec3 vW;',
      frep: [['#include <color_fragment>', `#include <color_fragment>
        float n1 = fbm3(vW * 6.), n2 = vnoise(vW * 40.);
        vec3 soil = vec3(.13, .085, .05), moss = vec3(.16, .26, .06), dry = vec3(.36, .3, .14);
        diffuseColor.rgb = mix(mix(soil, moss, smoothstep(.35, .7, n1)), dry, smoothstep(.6, .9, n2) * .5);`],
      ['#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = bumpN(-vViewPosition, normal, (fbm3(vW * 18.) * .006 + vnoise(vW * 60.) * .002));']],
    });
    const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.userData.tag = 'sol'; group.add(mesh);
  }

  /* ----- talus : terre stratifiée, déplacée ----- */
  {
    const g = new THREE.LatheGeometry(underPts.map(p => new THREE.Vector2(Math.max(1e-4, p.x), p.y)).reverse(), 200);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), rr = Math.hypot(x, z);
      if (rr < 1e-3) continue; const d = dispUnder(x, y, z);
      pos.setXYZ(i, x + x / rr * d, y + (y < -1.3 ? -d * .5 : 0), z + z / rr * d);
    }
    g.computeVertexNormals();
    const m = patchMat(new THREE.MeshStandardMaterial({ color: C('#ffffff'), roughness: .9 }), {
      key: 'ile-talus', sss: { wrap: [.25, .2, .18], col: '#000000', amt: 0 },
      vDecl: 'varying vec3 vW;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvW = position;']],
      fDecl: `varying vec3 vW; float below(float y, float e){ return 1. - smoothstep(e - .02, e + .02, y); }`,
      frep: [['#include <color_fragment>', `#include <color_fragment>
        float yy = vW.y + .06 * (fbm3(vW * 2.6) - .5) + .025 * sin(atan(vW.z, vW.x) * 3. + 1.);
        vec3 humus = vec3(.085, .05, .03), clay = vec3(.42, .22, .1), sand = vec3(.62, .44, .25), red = vec3(.3, .13, .06), pale = vec3(.55, .42, .3), deep = vec3(.17, .11, .075);
        vec3 c = humus;
        c = mix(c, clay, below(yy, -.24));
        c = mix(c, sand, below(yy, -.5) * (1. - below(yy, -.565)));
        c = mix(c, red, below(yy, -.6));
        c = mix(c, pale, below(yy, -.86) * (1. - below(yy, -.895)));
        c = mix(c, deep, below(yy, -.98));
        c *= .72 + .5 * fbm3(vW * vec3(9., 22., 9.));
        float sp = vnoise(vW * 70.);
        c = mix(c, vec3(.8, .72, .6), smoothstep(.83, .9, sp) * .55);
        c *= 1. - .45 * smoothstep(.78, .95, vnoise(vW * 48. + 3.));
        float fib = smoothstep(.72, .92, vnoise(vec3(vW.x * 90., vW.y * 7., vW.z * 90.))) * (1. - below(yy, -.3));
        c = mix(c, vec3(.5, .38, .25), fib * .5);
        float mossM = smoothstep(-.24, -.08, vW.y) * smoothstep(.42, .66, fbm3(vW * 5.));
        c = mix(c, vec3(.12, .2, .045), mossM);
        diffuseColor.rgb = c;`],
      ['#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float hh = fbm3(vW * 7.) * .03 + vnoise(vW * 26.) * .008 + sin(vW.y * 70. + fbm3(vW * 3.) * 6.) * .003;
        normal = bumpN(-vViewPosition, normal, hh);`]],
    });
    const tm = new THREE.Mesh(g, m); tm.userData.tag = 'talus'; group.add(tm);
  }

  /* ----- herbe : brins instanciés (dessus + bord qui retombe) ----- */
  const exclude = (x, z) => Math.pow(x / .5, 2) + Math.pow((z - .08) / .42, 2); // pieds de Pilou
  {
    const S = 5, P = [], I = [], UV = [];
    for (let i = 0; i <= S; i++) { const t = i / S, w = .5 * Math.pow(1 - t, .85) * (1 - .15 * t); if (i < S) { P.push(-w, t, 0, w, t, 0); UV.push(0, t, 1, t); } else { P.push(0, 1, 0); UV.push(.5, 1); } }
    for (let i = 0; i < S - 1; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const L = (S - 1) * 2; I.push(L, L + 1, L + 2);
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); bg.setIndex(I); bg.computeVertexNormals();
    const NT = Math.round(15000 * quality), NR = Math.round(2600 * quality), N = NT + NR;
    const shape = new Float32Array(N * 4);
    const mesh = new THREE.InstancedMesh(bg, plantMat('ile-herbe', { color: C('#ffffff'), roughness: .55 }, { blade: true, flipBack: true, sssAmt: .75 }, shared), N);
    const pal = ['#6FA83F', '#86B848', '#9DC254', '#5E9A3A', '#78AE44', '#B8B862', '#4F8A35'].map(C);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), col = new THREE.Color();
    let i = 0;
    while (i < NT) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 1.47, x = Math.cos(a) * d, z = Math.sin(a) * d;
      const ex = exclude(x, z); if (ex < 1) continue;
      const clump = N3(x * 3.1, 0, z * 3.1), patch = N3b(x * 1.3 + 4, 0, z * 1.3);
      if (r() > .45 + .7 * clump) continue;
      const short = ex < 1.9 ? .55 : 1;
      const h = (.065 + .1 * Math.pow(r(), 1.4) + .05 * clump) * short * (d > 1.3 ? .8 : 1);
      shape.set([.012 + .011 * r(), h, .12 + .5 * r(), r() * 6.28], i * 4);
      e.set((r() - .5) * .5, r() * Math.PI * 2, (r() - .5) * .5, 'YXZ'); q.setFromEuler(e);
      m4.compose(v.set(x, yTop(d) - .004, z), q, one); mesh.setMatrixAt(i, m4);
      col.copy(pal[Math.floor(r() * pal.length)]).lerp(C('#C9B66A'), patch > .62 ? .35 * r() : 0).multiplyScalar(.85 + .3 * r());
      mesh.setColorAt(i, col); i++;
    }
    const qt = new THREE.Quaternion(), qy = new THREE.Quaternion(), ax = new THREE.Vector3();
    while (i < N) {
      const a = r() * Math.PI * 2, d = 1.43 + .1 * r();
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const y = d < 1.46 ? yTop(d) : lerp(-.008, -.09, (d - 1.46) / .08);
      const h = .07 + .1 * r();
      shape.set([.012 + .01 * r(), h, .2 + .5 * r(), r() * 6.28], i * 4);
      ax.set(-Math.sin(a), 0, Math.cos(a)); qt.setFromAxisAngle(ax, -(.5 + 1.1 * Math.pow(r(), .8))); qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28);
      q.copy(qt).multiply(qy);
      m4.compose(v.set(x, y, z), q, one); mesh.setMatrixAt(i, m4);
      col.copy(pal[Math.floor(r() * pal.length)]).multiplyScalar(.8 + .3 * r()); mesh.setColorAt(i, col); i++;
    }
    bg.setAttribute('aShape', new THREE.InstancedBufferAttribute(shape, 4));
    mesh.castShadow = false; mesh.receiveShadow = true; mesh.customDepthMaterial = mesh.material.userData.depth;
    mesh.frustumCulled = false; mesh.userData.tag = 'herbe'; group.add(mesh);
  }

  /* ----- graminées à épis (elles s'allument en contre-jour) ----- */
  {
    const parts = [];
    const stem = new THREE.CylinderGeometry(.006, .01, 1, 4, 6, true); stem.translate(0, .5, 0); parts.push(stem);
    for (let k = 0; k < 9; k++) { const s = new THREE.SphereGeometry(.022, 6, 5); s.scale(.8, 2.2, .8); const t = .78 + k * .026; s.rotateZ((k % 2 ? 1 : -1) * .35); s.translate((k % 2 ? 1 : -1) * .012, t, (k % 3 - 1) * .008); parts.push(s); }
    parts.forEach(p => { p.deleteAttribute('uv'); p.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(p.attributes.position.count * 2), 2)); });
    const geo = mergeGeometries(parts);
    const N = Math.round(70 * quality);
    const mesh = new THREE.InstancedMesh(geo, plantMat('ile-epis', { color: C('#ffffff'), roughness: .6 }, { sssAmt: 1.3 }, shared), N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), col = new THREE.Color();
    for (let i = 0; i < N; i++) {
      let a, d; do { a = r() * Math.PI * 2; d = .75 + .7 * r(); } while (Math.sin(a) > .35 && r() < .85);
      const x = Math.cos(a) * d, z = Math.sin(a) * d, h = .2 + .17 * r();
      e.set((r() - .5) * .35, r() * 6.28, (r() - .5) * .35, 'YXZ'); q.setFromEuler(e);
      m4.compose(v.set(x, yTop(d) - .004, z), q, new THREE.Vector3(h, h, h)); mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, col.set(r() < .5 ? '#D8C47E' : '#C9C27A').multiplyScalar(.85 + .25 * r()));
    }
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.customDepthMaterial = mesh.material.userData.depth; mesh.frustumCulled = false; group.add(mesh);
  }

  /* ----- trèfles ----- */
  {
    const parts = [];
    const heart = new THREE.Shape(); heart.moveTo(0, 0); heart.bezierCurveTo(.15, .12, .45, .35, .38, .62); heart.bezierCurveTo(.33, .8, .12, .82, 0, .68); heart.bezierCurveTo(-.12, .82, -.33, .8, -.38, .62); heart.bezierCurveTo(-.45, .35, -.15, .12, 0, 0);
    for (let k = 0; k < 3; k++) {
      const lg = new THREE.ShapeGeometry(heart, 6); const p = lg.attributes.position; const cols = [];
      for (let j = 0; j < p.count; j++) { const x = p.getX(j), y = p.getY(j); p.setZ(j, -.18 * x * x - .05 * y); const ch = Math.abs(Math.abs(x) * 1.2 - (y - .25)) < .07 && y > .25 && y < .6 ? 1 : 0; const c = ch ? [.85, .95, .8] : [.75 + .25 * y, .9 + .1 * y, .7]; cols.push(...c); }
      lg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      lg.scale(.42, .42, .42); lg.rotateX(-Math.PI / 2 + .35); lg.rotateY(k / 3 * Math.PI * 2); lg.translate(0, .85, 0); parts.push(lg);
    }
    const st = new THREE.CylinderGeometry(.02, .025, .88, 4, 3, true); st.translate(0, .44, 0); st.setAttribute('color', new THREE.Float32BufferAttribute(new Array(st.attributes.position.count * 3).fill(.7), 3)); parts.push(st);
    parts.forEach(p => { if (p.index) { } p.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(p.attributes.position.count * 2), 2)); });
    const geo = mergeGeometries(parts.map(p => p.index ? p.toNonIndexed() : p));
    const N = Math.round(300 * quality);
    const mesh = new THREE.InstancedMesh(geo, plantMat('ile-trefle', { color: C('#ffffff'), roughness: .5 }, { vColor: true, sssAmt: .9 }, shared), N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), col = new THREE.Color();
    let i = 0;
    while (i < N) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 1.42, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (exclude(x, z) < 1.15) continue; if (N3(x * 2.3 + 11, 1, z * 2.3) < .55) continue;
      const s = .05 + .035 * r();
      e.set((r() - .5) * .3, r() * 6.28, (r() - .5) * .3, 'YXZ'); q.setFromEuler(e);
      m4.compose(v.set(x, yTop(d) - .003, z), q, new THREE.Vector3(s, s * (.9 + .5 * r()), s)); mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, col.set(r() < .5 ? '#4E8F3A' : '#5FA046').multiplyScalar(.85 + .25 * r())); i++;
    }
    mesh.castShadow = false; mesh.receiveShadow = true; mesh.customDepthMaterial = mesh.material.userData.depth; mesh.frustumCulled = false; group.add(mesh);
  }

  /* ----- petites fleurs sauvages (pétales teintés par instance) ----- */
  {
    const parts = [], pet = new THREE.SphereGeometry(.11, 8, 4); pet.scale(1.6, .18, .8);
    for (let k = 0; k < 5; k++) { const g = pet.clone(); g.translate(.16, 0, 0); g.rotateZ(.25); g.rotateY(k / 5 * Math.PI * 2); g.translate(0, 1, 0); g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count * 3).fill(1), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count * 2).fill(1), 2)); parts.push(g); }
    const ctr = new THREE.SphereGeometry(.07, 8, 6); ctr.scale(1, .6, 1); ctr.translate(0, 1.02, 0); ctr.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: ctr.attributes.position.count }, () => [1, .72, .2]).flat(), 3)); ctr.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(ctr.attributes.position.count * 2).fill(0), 2)); parts.push(ctr);
    const st = new THREE.CylinderGeometry(.018, .025, 1, 4, 4, true); st.translate(0, .5, 0); st.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: st.attributes.position.count }, () => [.32, .55, .22]).flat(), 3)); st.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(st.attributes.position.count * 2).fill(0), 2)); parts.push(st);
    const geo = mergeGeometries(parts.map(p => p.index ? p.toNonIndexed() : p));
    const N = Math.round(150 * quality);
    const mesh = new THREE.InstancedMesh(geo, plantMat('ile-fleurettes', { color: C('#ffffff'), roughness: .5 }, { vColor: true, petalTint: true, sssAmt: 1.3 }, shared), N);
    const tints = ['#FFFFFF', '#FFF6D8', '#E3D8FF', '#FFE0E8', '#FFFFFF', '#FFF0B0'].map(C);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3();
    let i = 0;
    while (i < N) {
      const a = r() * Math.PI * 2, d = .45 + Math.sqrt(r()) * 1.0, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (exclude(x, z) < 1.3) continue; if (N3b(x * 2 + 3, 2, z * 2) < .45) continue;
      const s = .1 + .07 * r();
      e.set((r() - .5) * .4, r() * 6.28, (r() - .5) * .4, 'YXZ'); q.setFromEuler(e);
      m4.compose(v.set(x, yTop(d) - .004, z), q, new THREE.Vector3(s * .5, s, s * .5)); mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, tints[Math.floor(r() * tints.length)]); i++;
    }
    mesh.castShadow = false; mesh.receiveShadow = true; mesh.customDepthMaterial = mesh.material.userData.depth; mesh.frustumCulled = false; group.add(mesh);
  }

  /* ----- fleurs des thèmes : pétales nervurés et translucides ----- */
  const veinTex = canvasTex(256, 128, (x, W, Hh) => {
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#FFF3C4'); g.addColorStop(.25, '#FFFFFF'); g.addColorStop(.85, '#FFFFFF'); g.addColorStop(1, '#F2F2F2');
    x.fillStyle = g; x.fillRect(0, 0, W, Hh);
    const rr = rngF(3);
    for (let k = 0; k < 26; k++) { const t = (k + .5) / 26, yEnd = Hh * (.08 + .84 * t); x.strokeStyle = `rgba(120,60,60,${.07 + .07 * rr()})`; x.lineWidth = .8 + rr() * .8; x.beginPath(); x.moveTo(0, Hh / 2); x.bezierCurveTo(W * .3, Hh / 2 + (yEnd - Hh / 2) * .4, W * .6, yEnd, W, yEnd); x.stroke(); }
  });
  const petalGeo = (() => {
    const g = new THREE.PlaneGeometry(1, 1, 8, 5), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const t = p.getX(i) + .5, u = p.getY(i) * 2; // t le long du pétale, u en travers
      const w = .5 * Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1.08, 2))) * (.55 + .45 * t) + .04;
      const z = u * w;
      p.setXYZ(i, t, .55 * z * z + .12 * t * t - .03 * Math.sin(t * Math.PI) * Math.cos(u * 3), z);
      uv.setXY(i, t, .5 + u * .5);
    }
    g.computeVertexNormals(); return g;
  })();
  const FL = [[-1.0, .36, '#FF9C66'], [-.62, .84, '#3CCB9C'], [-.18, 1.12, '#FF8A73'], [.66, .86, '#A08CF7'], [1.04, .3, '#6A84D6'], [-1.12, -.3, '#FF9C66'], [1.1, -.26, '#F27BA3']];
  const stemMat = plantMat('ile-tige', { color: C('#5C9A45'), roughness: .6 }, { wind: false, sssAmt: .8 }, shared);
  const leafMat = plantMat('ile-feuille', { color: C('#5FA048'), roughness: .5 }, { wind: false, sssAmt: 1 }, shared);
  const ctrMat = patchMat(new THREE.MeshStandardMaterial({ color: C('#FFC23A'), roughness: .7 }), {
    key: 'ile-coeur', vDecl: 'varying vec3 vO;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvO = position;']], fDecl: 'varying vec3 vO;',
    frep: [['#include <color_fragment>', '#include <color_fragment>\n float st = vnoise(vO * 900.); diffuseColor.rgb *= mix(vec3(.75, .45, .15), vec3(1.05, 1., .9), smoothstep(.3, .8, st)) * mix(.6, 1., smoothstep(0., .02, vO.y));'],
    ['#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = bumpN(-vViewPosition, normal, vnoise(vO * 900.) * .0015);']],
  });
  const leafGeo = (() => { const g = new THREE.PlaneGeometry(1, 1, 6, 3), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = p.getX(i) + .5, u = p.getY(i) * 2, w = .5 * Math.sin(Math.PI * Math.pow(t, .8)) * .45; p.setXYZ(i, t, Math.abs(u) * w * .6 + .25 * t * t, u * w); } g.computeVertexNormals(); return g; })();
  const flowers = FL.map(([x, z, hex], i) => {
    const d = Math.hypot(x, z), base = new THREE.Group(); base.position.set(x, yTop(d) - .006, z); base.userData.tag = 'fleurs'; group.add(base);
    const hgt = .2 + .08 * ((i * 37) % 10) / 10, size = .085 + .02 * ((i * 53) % 7) / 7;
    const bendX = (r() - .5) * .08, bendZ = (r() - .5) * .08;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(bendX * .5, hgt * .4, bendZ * .3), new THREE.Vector3(bendX, hgt * .8, bendZ), new THREE.Vector3(bendX * .8, hgt, bendZ * .8)]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .0065, 6), stemMat); stem.castShadow = true; base.add(stem);
    for (let k = 0; k < 2; k++) { const lf = new THREE.Mesh(leafGeo, leafMat); lf.scale.setScalar(.11 + .03 * k); lf.position.set(0, .02 + .05 * k, 0); lf.rotation.set(0, k * 2.6 + i, .5 + .2 * k); lf.castShadow = true; base.add(lf); }
    const head = new THREE.Group(); head.position.copy(curve.getPoint(1)); base.add(head);
    head.rotation.set((r() - .5) * .3, r() * 6, (r() - .5) * .3);
    const col = C(hex);
    const pm = plantMat('ile-petale', { color: col, map: veinTex, roughness: .5 }, { wind: false, sssAmt: 1.6 }, shared);
    const n = i % 2 ? 6 : 5;
    for (let k = 0; k < n; k++) {
      const pv = new THREE.Group(); pv.rotation.y = k / n * Math.PI * 2 + (r() - .5) * .2; head.add(pv);
      const pt = new THREE.Mesh(petalGeo, pm); pt.scale.set(size, size, size * (n === 6 ? .85 : 1)); pt.rotation.z = .32 + .12 * r(); pt.position.y = .003 * (k % 2); pt.castShadow = true; pv.add(pt);
    }
    const ctr = new THREE.Mesh(new THREE.SphereGeometry(.026, 20, 12), ctrMat); ctr.scale.set(1, .5, 1); ctr.position.y = .012; head.add(ctr);
    return { base, head, x, z, ph: r() * 6 };
  });
  updaters.push(t => { for (const f of flowers) { const [wx, wz] = windJS(f.x, f.z, t + f.ph * .2); f.base.rotation.set(wz * .09, 0, -wx * .09); } });

  /* ----- arbuste (cadeau), derrière à gauche ----- */
  {
    const tree = new THREE.Group(); tree.position.set(-.98, yTop(1.12) - .01, -.58); tree.userData.tag = 'arbuste'; group.add(tree);
    const barkMat = patchMat(new THREE.MeshStandardMaterial({ color: C('#6A4A33'), roughness: .9 }), { key: 'ile-ecorce', vDecl: 'varying vec3 vO;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvO = position;']], fDecl: 'varying vec3 vO;', frep: [['#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = bumpN(-vViewPosition, normal, vnoise(vO * vec3(160., 20., 160.)) * .004);']] });
    const branch = (pts, r0, r1) => { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const g = new THREE.TubeGeometry(c, 20, 1, 8); const P = g.attributes.position, cc = new THREE.Vector3(), vv = new THREE.Vector3(); for (let i = 0; i <= 20; i++) { c.getPointAt(i / 20, cc); const rr = lerp(r0, r1, i / 20); for (let j = 0; j <= 8; j++) { const k = i * 9 + j; vv.fromBufferAttribute(P, k).sub(cc).multiplyScalar(rr).add(cc); P.setXYZ(k, vv.x, vv.y, vv.z); } } const m = new THREE.Mesh(g, barkMat); m.castShadow = true; tree.add(m); };
    branch([[0, -.02, 0], [.01, .18, 0], [-.02, .32, .01], [-.05, .44, .02]], .032, .014);
    branch([[.0, .2, 0], [.08, .3, .03], [.15, .38, .05]], .016, .007);
    branch([[0, .26, 0], [-.07, .34, -.06], [-.13, .4, -.1]], .014, .006);
    const clusters = [[-.05, .5, .02, .2], [.16, .43, .06, .15], [-.15, .44, -.11, .14], [.04, .36, -.08, .13]];
    const lg = new THREE.PlaneGeometry(1, 1, 3, 2), lp = lg.attributes.position;
    for (let i = 0; i < lp.count; i++) { const t = lp.getX(i) + .5, u = lp.getY(i) * 2, w = .5 * Math.sin(Math.PI * Math.pow(t, .8)) * .55; lp.setXYZ(i, t, Math.abs(u) * w * .4, u * w); }
    lg.computeVertexNormals();
    const N = Math.round(900 * quality);
    const lm = new THREE.InstancedMesh(lg, plantMat('ile-arbuste', { color: C('#ffffff'), roughness: .55 }, { wind: false, sssAmt: 1.2 }, shared), N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), nn = new THREE.Vector3(), col = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const [cx, cy, cz, cr] = clusters[i % clusters.length];
      nn.set(r() - .5, r() - .35, r() - .5).normalize(); const rr = cr * (.55 + .45 * Math.pow(r(), .5));
      v.set(cx, cy, cz).addScaledVector(nn, rr);
      q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), nn.clone().add(new THREE.Vector3((r() - .5) * .8, .3, (r() - .5) * .8)).normalize());
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), r() * 6.28));
      const s = .05 + .03 * r(); m4.compose(v, q, new THREE.Vector3(s, s, s)); lm.setMatrixAt(i, m4);
      lm.setColorAt(i, col.set(r() < .5 ? '#4E8A36' : '#679F42').multiplyScalar(.8 + .35 * r()));
    }
    lm.castShadow = true; lm.receiveShadow = true; tree.add(lm);
    updaters.push(t => { const [wx, wz] = windJS(-.98, -.58, t); tree.rotation.set(wz * .025, 0, -wx * .025); });
  }

  /* ----- galets (cadeaux) : grès pêche, schiste lilas, ardoise bleutée ----- */
  {
    const gal = [[.86, .52, .075, '#E9B08A'], [1.0, .32, .058, '#A99BD6'], [.74, .74, .05, '#7E92C8']];
    for (const [x, z, s, hex] of gal) {
      const g = new THREE.SphereGeometry(1, 40, 24), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), k = 1 + .06 * (N3(vx * 2 + x * 9, vy * 2, vz * 2) - .5); p.setXYZ(i, vx * k * 1.25, vy * k * .62, vz * k); }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, patchMat(new THREE.MeshPhysicalMaterial({ color: C(hex), roughness: .5, clearcoat: .25, clearcoatRoughness: .4 }), { key: 'ile-galet', vDecl: 'varying vec3 vO;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvO = position;']], fDecl: 'varying vec3 vO;', frep: [['#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= .85 + .25 * fbm3(vO * 6.) - .12 * smoothstep(.75, .9, vnoise(vO * 30.));']] }));
      m.scale.setScalar(s); m.position.set(x, yTop(Math.hypot(x, z)) + s * .3, z); m.rotation.y = x * 5; m.castShadow = true; m.receiveShadow = true; group.add(m);
    }
  }

  /* ----- cailloux pris dans le talus ----- */
  {
    const stoneMat = patchMat(new THREE.MeshStandardMaterial({ color: C('#ffffff'), roughness: .82 }), {
      key: 'ile-caillou', vDecl: 'varying vec3 vO; varying vec3 vWN;',
      vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvO = position;\n#ifdef USE_INSTANCING\nvWN = normalize(mat3(instanceMatrix) * objectNormal);\n#else\nvWN = objectNormal;\n#endif']],
      fDecl: 'varying vec3 vO; varying vec3 vWN;',
      frep: [['#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= .75 + .45 * fbm3(vO * 5.);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.14, .22, .05), smoothstep(.35, .7, vWN.y) * smoothstep(.4, .65, fbm3(vO * 4. + 2.)) * .9);`],
      ['#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = bumpN(-vViewPosition, normal, fbm3(vO * 9.) * .012 * (1. / 12.));']],
    });
    const pal = ['#9A918A', '#B5A898', '#7E7570', '#C8B79F', '#8A7B6E', '#A8A39D'].map(C);
    for (let gk = 0; gk < 3; gk++) {
      const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, nz = noise3(40 + gk);
      for (let i = 0; i < p.count; i++) { const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), k = 1 + .32 * (nz(vx * 1.4, vy * 1.4, vz * 1.4) - .5) + .1 * (nz(vx * 4, vy * 4, vz * 4) - .5); p.setXYZ(i, vx * k, vy * k * (.7 + .1 * gk), vz * k); }
      g.computeVertexNormals();
      const N = 26, mesh = new THREE.InstancedMesh(g, stoneMat, N);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      for (let i = 0; i < N; i++) {
        const a = r() < .72 ? Math.PI / 2 + (r() - .5) * 2.4 : r() * Math.PI * 2;
        const y = lerp(-.2, -1.4, Math.pow(r(), .85)), s = (.022 + .05 * Math.pow(r(), 1.5)) * (1 + .6 * (-y - .2));
        const sp = surfaceUnder(a, y), out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        sp.addScaledVector(out, -s * .35);
        e.set(r() * 6, r() * 6, r() * 6); q.setFromEuler(e);
        m4.compose(sp, q, new THREE.Vector3(s, s, s)); mesh.setMatrixAt(i, m4); mesh.setColorAt(i, pal[Math.floor(r() * pal.length)]);
      }
      group.add(mesh);
    }
  }

  /* ----- mousse : coussinets veloutés au bord ----- */
  {
    const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position, nz = noise3(77);
    for (let i = 0; i < p.count; i++) { const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i), k = 1 + .25 * (nz(vx * 3, vy * 3, vz * 3) - .5); p.setXYZ(i, vx * k, vy * k * .6, vz * k); }
    g.computeVertexNormals();
    const mm = patchMat(new THREE.MeshPhysicalMaterial({ color: C('#ffffff'), roughness: .95, sheen: .6, sheenColor: C('#B8D890'), sheenRoughness: .6 }), {
      key: 'ile-mousse', sss: { wrap: [.6, .6, .5], col: '#A8C060', amt: .18, dist: .3, pow: 2 }, vDecl: 'varying vec3 vO;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvO = position;']], fDecl: 'varying vec3 vO;',
      frep: [['#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= .7 + .5 * vnoise(vO * 14.);'],
      ['#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = bumpN(-vViewPosition, normal, vnoise(vO * 40.) * .003);']],
    });
    const N = 60, mesh = new THREE.InstancedMesh(g, mm, N), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const a = r() < .75 ? Math.PI / 2 + (r() - .5) * 2.6 : r() * Math.PI * 2, y = -.05 - .14 * r();
      const sp = y > -.1 ? new THREE.Vector3(Math.cos(a) * 1.53, y, Math.sin(a) * 1.53) : surfaceUnder(a, y);
      const s = .01 + .014 * r(); q.setFromAxisAngle(new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)), -.5 - .5 * r());
      m4.compose(sp, q, new THREE.Vector3(s * 1.5, s * .7, s * 1.5)); mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, col.set(r() < .5 ? '#3E6222' : '#4F722A').multiplyScalar(.7 + .3 * r()));
    }
    mesh.receiveShadow = true; mesh.userData.tag = 'mousse'; group.add(mesh);
  }

  /* ----- racines qui pendent ----- */
  {
    const rootMat = patchMat(new THREE.MeshStandardMaterial({ color: C('#ffffff'), roughness: .85 }), {
      key: 'ile-racine', sss: { wrap: [.4, .3, .25], col: '#C08A50', amt: .5, dist: .3, pow: 2 },
      vDecl: 'varying vec3 vO; varying float vT; attribute float aT;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvO = position; vT = aT;']], fDecl: 'varying vec3 vO; varying float vT;',
      frep: [['#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb = mix(vec3(.2, .13, .08), vec3(.55, .42, .3), smoothstep(.2, 1., vT)) * (.75 + .45 * vnoise(vO * vec3(30., 120., 30.)));`],
      ['#include <lights_fragment_begin>', 'sssK = smoothstep(.4, 1., vT);\n#include <lights_fragment_begin>'],
      ['#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = bumpN(-vViewPosition, normal, vnoise(vO * vec3(60., 300., 60.)) * .0012);']],
    });
    const roots = [];
    const mkRoot = (pts, r0, r1, parent, ph) => {
      const c = new THREE.CatmullRomCurve3(pts), SEG = Math.max(8, Math.round(c.getLength() * 60)), RAD = 6;
      const g = new THREE.TubeGeometry(c, SEG, 1, RAD), P = g.attributes.position, aT = new Float32Array(P.count), cc = new THREE.Vector3(), vv = new THREE.Vector3();
      for (let i = 0; i <= SEG; i++) { const u = i / SEG; c.getPointAt(u, cc); const rr = lerp(r0, r1, Math.pow(u, .7)); for (let j = 0; j <= RAD; j++) { const k = i * (RAD + 1) + j; vv.fromBufferAttribute(P, k).sub(cc).multiplyScalar(rr).add(cc); P.setXYZ(k, vv.x, vv.y, vv.z); aT[k] = u; } }
      g.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
      const m = new THREE.Mesh(g, rootMat); parent.add(m); return { m, c };
    };
    const NR = 40;
    for (let i = 0; i < NR; i++) {
      const front = r() < .7, a = front ? Math.PI / 2 + (r() - .5) * 2.4 : r() * Math.PI * 2;
      const longOne = i < 7;
      const y0 = longOne ? lerp(-1.25, -1.58, r()) : lerp(-.45, -1.45, r());
      const sp = surfaceUnder(a, y0), out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const pivot = new THREE.Group(); pivot.position.copy(sp).addScaledVector(out, -.03); pivot.userData.tag = 'racines'; group.add(pivot);
      const L = longOne ? .55 + .6 * r() : .15 + .45 * r(), nSeg = 6; const pts = [new THREE.Vector3(0, 0, 0)];
      let p = new THREE.Vector3().addScaledVector(out, .05).add(new THREE.Vector3(0, -.03, 0)); pts.push(p.clone());
      const lat = new THREE.Vector3(-out.z, 0, out.x);
      for (let k = 0; k < nSeg; k++) { p = p.clone().add(new THREE.Vector3(0, -L / nSeg, 0)).addScaledVector(out, (.04 - .03 * k / nSeg) * (r() - .2)).addScaledVector(lat, (r() - .5) * .05); pts.push(p); }
      const r0 = longOne ? .012 : .006 + .012 * r();
      const { c } = mkRoot(pts, r0, .0015, pivot);
      const nb = longOne ? 3 : Math.floor(r() * 3);
      for (let b = 0; b < nb; b++) {
        const u = .25 + .55 * r(), sp2 = c.getPointAt(u), dir = new THREE.Vector3(r() - .5, -.6, r() - .5).normalize(), l2 = .06 + .14 * r();
        mkRoot([sp2, sp2.clone().addScaledVector(dir, l2 * .5).add(new THREE.Vector3((r() - .5) * .02, 0, (r() - .5) * .02)), sp2.clone().addScaledVector(dir, l2)], r0 * .45, .0008, pivot);
      }
      roots.push({ pivot, ph: r() * 6, amp: (longOne ? .045 : .025) });
    }
    updaters.push(t => { for (const rt of roots) { rt.pivot.rotation.set(rt.amp * Math.sin(t * .8 + rt.ph), 0, rt.amp * .8 * Math.sin(t * .63 + rt.ph * 1.7)); } });
  }

  function update(τ) { const t = τ / 1000; shared.uTime.value = t; for (const u of updaters) u(t); }
  return { group, update, shared, yTop };
}
