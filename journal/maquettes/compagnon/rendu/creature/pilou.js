// pilou.js — le personnage Pilou (Halcya · Compagnon) : géométrie, matières, visage dessiné, rendu.
// Référence d'implémentation pour SPEC.md. Tout est déterministe : la pose est une donnée, le rendu une fonction de la pose.
import * as THREE from '../_partage/three-0.187.0/build/three.module.js';
export { THREE };

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ---------- proportions (unités du modèle : le corps fait 1,38 de haut) ---------- */
export const H = 1.38, W = .62, BY = .06;
export const bodyR = t => Math.sin(t) * W * (1 + .12 * Math.cos(t));
export const rAtY = y => bodyR(Math.acos(clamp(1 - 2 * y / H, -1, 1)));

/* ---------- palette ---------- */
export const PAL = {
  menthe: '#78D8B4', ventre: '#FFF1DC', pieds: '#4FC097', antenne: '#33B989', ambre: '#FFB84D', ambreLueur: '#FF9F2E',
  contour: '#4A332B', oeil: '#2B2320', bouche: '#552822', boucheInt: '#6E2A26', langue: '#FF8C8C', joue: '#FF8D80',
};

/* ---------- visage : texture dessinée, projetée de face sur le corps ---------- */
export const FS = .52, FY = .84; // la texture couvre x ∈ [-0,52 ; 0,52], y ∈ [0,32 ; 1,36]
export const FACE0 = {
  lookX: 0, lookY: 0, es: 1, esx: 1, esy: 1,
  lidTop: .12, lidBot: .1, lidTilt: 0, lidTopL: 0, lidTopR: 0, lidBotL: 0, lidBotR: 0,
  brow: 0, browY: 0, browA: 0, browYL: 0, browYR: 0,
  mw: .08, mU: .03, mL: .03, mA: .12, mx: 0, my: 0, mSkew: 0, tongue: 0,
  blush: .45, hatch: 0, sparkle: 0, shine: 1, fx: 0, fy: 0,
};

export function drawFace(ctx, S, F) {
  const k = S / (2 * FS);
  const X = x => (x / (2 * FS) + .5) * S, Y = y => (.5 - (y - FY) / (2 * FS)) * S;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, S, S);
  ctx.translate(F.fx * k, -F.fy * k); // la tête (= le corps) qui pivote : tout le visage glisse sur la surface
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // joues
  for (const s of [-1, 1]) {
    const b = clamp(F.blush), a = .86 * Math.min(1, b * 3.5), r = (.05 + .055 * b) * k;
    if (a > .004) {
      ctx.save(); ctx.translate(X(s * .345), Y(.785)); ctx.scale(1, .6);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, `rgba(255,140,140,${a})`); g.addColorStop(.55, `rgba(255,140,140,${a * .92})`); g.addColorStop(1, 'rgba(255,140,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    const h = clamp(F.hatch);
    if (h > .01) {
      ctx.save(); ctx.translate(X(s * .345), Y(.79)); ctx.strokeStyle = `rgba(226,92,84,${h * .9})`; ctx.lineWidth = .009 * k;
      for (let j = -1; j <= 1; j++) { const ox = j * .03 * k; ctx.beginPath(); ctx.moveTo(ox - .011 * k, .013 * k); ctx.lineTo(ox + .011 * k, -.013 * k); ctx.stroke(); }
      ctx.restore();
    }
  }
  // yeux
  for (const s of [-1, 1]) drawEye(ctx, X, Y, k, s, F);
  // sourcils (discrets, seulement pour quelques expressions)
  if (F.brow > .01) for (const s of [-1, 1]) {
    const by = .9 + .098 * F.es * F.esy + .055 + F.browY + (s < 0 ? F.browYL : F.browYR) + F.lookY * .01;
    ctx.save(); ctx.translate(X(s * .205 + F.lookX * .015), Y(by)); ctx.rotate(-F.browA * s);
    ctx.strokeStyle = `rgba(74,51,43,${clamp(F.brow)})`; ctx.lineWidth = .02 * k;
    ctx.beginPath(); ctx.moveTo(-.042 * k, .006 * k); ctx.quadraticCurveTo(0, -.012 * k, .042 * k, .006 * k); ctx.stroke(); ctx.restore();
  }
  drawMouth(ctx, X, Y, k, F);
}

function drawEye(ctx, X, Y, k, s, F) {
  const L = s < 0;
  const rx = .078 * F.es * F.esx, ry = .098 * F.es * F.esy;
  const cx = s * .2 + F.lookX * .045, cy = .9 + F.lookY * .036;
  const lidTop = clamp(F.lidTop + (L ? F.lidTopL : F.lidTopR) + Math.max(0, -F.lookY) * .22 * (1 - F.lidTop)), lidBot = clamp(F.lidBot + (L ? F.lidBotL : F.lidBotR)) * (1 - sstep(.55, .98, lidTop));
  const tilt = F.lidTilt * s, ct = .026;
  const N = 40, up = [], lo = [];
  for (let j = 0; j <= N; j++) {
    const u = -1 + 2 * j / N, x = cx + u * rx, e = Math.sqrt(Math.max(0, 1 - u * u)), se = Math.sqrt(e);
    const yT = cy + ry * e, yB = cy - ry * e;
    const lid = lerp(yT + .003, yB + ct * se, lidTop) - tilt * u * ry * .45 * Math.min(1, lidTop * 3);
    const low = lerp(yB - .003, yT - ct * 1.15 * se, lidBot);
    let a = Math.min(yT, lid), b = Math.max(yB, low);
    if (a < b) { const m = (a + b) / 2; a = b = m; }
    up.push([X(x), Y(a)]); lo.push([X(x), Y(b)]);
  }
  const path = () => { ctx.beginPath(); up.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let j = lo.length - 1; j >= 0; j--) ctx.lineTo(lo[j][0], lo[j][1]); ctx.closePath(); };
  path();
  const g = ctx.createRadialGradient(X(cx + .15 * rx), Y(cy - .45 * ry), 0, X(cx), Y(cy), 1.25 * ry * k);
  g.addColorStop(0, '#5A4038'); g.addColorStop(.55, '#33261F'); g.addColorStop(1, '#221A17');
  ctx.fillStyle = g; ctx.fill();
  // reflets (découpés par les paupières)
  ctx.save(); path(); ctx.clip();
  const sh = F.shine;
  ctx.fillStyle = `rgba(255,214,180,${.22 * sh})`;
  ctx.beginPath(); ctx.ellipse(X(cx - .05 * rx), Y(cy - .62 * ry), .55 * rx * k, .2 * ry * k, 0, 0, Math.PI * 2); ctx.fill();
  const hx = cx + .3 * rx - F.lookX * .012, hy = cy + .36 * ry - F.lookY * .01;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.ellipse(X(hx), Y(hy), .32 * rx * k * sh, .27 * ry * k * sh, -.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(X(cx - .36 * rx - F.lookX * .008), Y(cy - .4 * ry), .13 * rx * k * sh, 0, Math.PI * 2); ctx.fill();
  if (F.sparkle > .01) {
    const r = .62 * rx * k * F.sparkle, x0 = X(hx), y0 = Y(hy);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * .22 : r; ctx.lineTo(x0 + Math.cos(a) * rr, y0 + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // ligne de cils quand la paupière descend
  const la = sstep(.1, .3, lidTop) * (1 - sstep(.86, .99, lidTop));
  if (la > .01) {
    ctx.strokeStyle = `rgba(43,35,32,${la})`; ctx.lineWidth = .013 * k; ctx.beginPath();
    let st = false; for (let j = 0; j <= N; j++) { const [x, y] = up[j]; const yT = Y(cy + ry * Math.sqrt(Math.max(0, 1 - (-1 + 2 * j / N) ** 2))); if (y > yT + .004 * k) { st ? ctx.lineTo(x, y) : ctx.moveTo(x, y); st = true; } }
    ctx.stroke();
  }
}

export function mouthPath(ctx, X, Y, F) {
  const w = F.mw, yc = .745 + F.my, mx = F.mx, a = F.mA;
  const dU = F.mU, dL = Math.max(F.mL, F.mU);
  const Ly = yc + F.mSkew * .02, Ry = yc - F.mSkew * .02;
  const L = [mx - w, Ly], R = [mx + w, Ry];
  return {
    L, R, dU, dL, yc, w, mx,
    upper() { ctx.moveTo(X(L[0]), Y(L[1])); ctx.bezierCurveTo(X(L[0] + w * a), Y(L[1] - 4 / 3 * dU), X(R[0] - w * a), Y(R[1] - 4 / 3 * dU), X(R[0]), Y(R[1])); },
    lower() { ctx.bezierCurveTo(X(R[0] - w * a), Y(R[1] - 4 / 3 * dL), X(L[0] + w * a), Y(L[1] - 4 / 3 * dL), X(L[0]), Y(L[1])); },
  };
}
function drawMouth(ctx, X, Y, k, F) {
  const m = mouthPath(ctx, X, Y, F);
  const gap = m.dL - m.dU;
  const lw = lerp(.034, .017, sstep(0, .03, gap)) * k;
  ctx.strokeStyle = PAL.bouche; ctx.lineWidth = lw;
  if (gap > .002) {
    ctx.beginPath(); m.upper(); m.lower(); ctx.closePath();
    ctx.fillStyle = PAL.boucheInt; ctx.fill();
    if (F.tongue > .01) {
      ctx.save(); ctx.beginPath(); m.upper(); m.lower(); ctx.closePath(); ctx.clip();
      ctx.fillStyle = `rgba(255,140,140,${clamp(F.tongue)})`;
      ctx.beginPath(); ctx.ellipse(X(m.mx + .1 * m.w), Y(m.yc - m.dL + .1 * gap), .62 * m.w * k, .55 * gap * k, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.beginPath(); m.upper(); m.lower(); ctx.closePath(); ctx.stroke();
  } else { ctx.beginPath(); m.upper(); ctx.stroke(); }
  // fossettes aux coins quand le sourire est franc
  const d = sstep(.036, .05, m.dU) * (1 - sstep(0, .012, gap));
  if (d > .02) {
    ctx.strokeStyle = PAL.bouche; ctx.globalAlpha = d; ctx.lineWidth = .014 * k;
    for (const [P, s] of [[m.L, -1], [m.R, 1]]) { ctx.beginPath(); ctx.moveTo(X(P[0] - s * .004), Y(P[1] + .016)); ctx.quadraticCurveTo(X(P[0] + s * .012), Y(P[1] + .006), X(P[0] + s * .006), Y(P[1] - .008)); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
}

/* ---------- le studio : rendu three.js partagé ---------- */
export function createStudio({ w = 1000, h = 1000 } = {}) {
  const R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(w, h, false); R.setClearColor(0x000000, 0);
  R.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(25, 1, .05, 80);
  const hemi = new THREE.HemisphereLight(0xFFF0E0, 0xBFAEEA, 1.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xFFFFFF, 2.3); sun.position.set(2.6, 4.6, 4.2); scene.add(sun);

  // dégradés : « toon doux » (4 paliers fondus, comme le prototype) et « lisse » (démonstration)
  const ramp = arr => { const d = new Uint8Array(arr); const t = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; };
  const GRAD = { toon: ramp([120, 120, 178, 178, 228, 228, 255, 255]), lisse: ramp(Array.from({ length: 64 }, (_, i) => Math.round(120 + 135 * Math.pow(i / 63, .9)))) };

  const U = { uRim: { value: .42 }, uRimCol: { value: new THREE.Color('#FFF2D6') }, olPx: { value: 3 }, olRes: { value: new THREE.Vector2(w, h) } };
  const toonMats = [];
  function toon(hex, o = {}) {
    const belly = !!o.belly; delete o.belly;
    const m = new THREE.MeshToonMaterial(Object.assign({ color: new THREE.Color(hex), gradientMap: GRAD.toon }, o));
    const uB = { value: belly ? 1 : 0 };
    m.onBeforeCompile = sh => {
      sh.uniforms.uRim = U.uRim; sh.uniforms.uRimCol = U.uRimCol; sh.uniforms.uBellyOn = uB; sh.uniforms.uBelly = { value: new THREE.Color(PAL.ventre) };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObj; uniform float uRim; uniform vec3 uRimCol; uniform float uBellyOn; uniform vec3 uBelly;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          if (uBellyOn > .5) { float ph = atan(vObj.x, vObj.z); float e = pow(ph / .9, 2.) + pow((vObj.y - .34) / .25, 2.); diffuseColor.rgb = mix(diffuseColor.rgb, uBelly, 1. - smoothstep(.86, 1.06, e)); }`)
        .replace('#include <opaque_fragment>', `{ vec3 nn = normalize(normal); vec3 vv = normalize(vViewPosition); float f = 1. - max(dot(nn, vv), 0.);
            outgoingLight += uRimCol * smoothstep(.58, .86, f) * (.6 + .4 * nn.y) * uRim; }
          #include <opaque_fragment>`);
    };
    toonMats.push(m); return m;
  }
  const olMats = {};
  function olMat(mul) {
    if (olMats[mul]) return olMats[mul];
    return olMats[mul] = new THREE.ShaderMaterial({
      uniforms: { px: U.olPx, res: U.olRes, mul: { value: mul }, col: { value: new THREE.Color(PAL.contour) } }, side: THREE.BackSide,
      vertexShader: `uniform float px; uniform vec2 res; uniform float mul;
        void main(){ vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vec3 n = normalize(normalMatrix * normal);
          vec2 d = (projectionMatrix * vec4(n, 0.0)).xy; float l = length(d); d = l > 1e-5 ? d / l : vec2(0.0);
          c.xy += d * px * mul * 2.0 / res * c.w; c.z += 0.0004 * c.w; gl_Position = c; }`,
      fragmentShader: 'uniform vec3 col; void main(){ gl_FragColor = vec4(col, 1.0);\n#include <colorspace_fragment>\n}',
    });
  }
  const outlines = [];
  function ol(m, mul = 1) { const o = new THREE.Mesh(m.geometry, olMat(mul)); o.renderOrder = -1; m.add(o); outlines.push(o); return m; }
  function mesh(geo, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }

  /* ----- Pilou ----- */
  const root = new THREE.Group(); scene.add(root);
  const body = new THREE.Group(); body.rotation.order = 'ZXY'; root.add(body);
  const prof = []; for (let i = 0; i <= 64; i++) { const t = i / 64 * Math.PI; prof.push(new THREE.Vector2(Math.max(.0001, bodyR(t)), (1 - Math.cos(t)) / 2 * H)); }
  const bodyMesh = ol(mesh(new THREE.LatheGeometry(prof, 72), toon(PAL.menthe, { belly: true }), 0, BY, 0, body), 1);
  // coque du visage : même profil, décalé de 4 millièmes vers l'extérieur, UV en projection de face
  const faceGeo = (() => {
    const pts = [], t0 = Math.acos(1 - 2 * .3 / H), t1 = Math.acos(1 - 2 * 1.34 / H);
    for (let i = 0; i <= 44; i++) {
      const t = lerp(t0, t1, i / 44), r = bodyR(t), y = (1 - Math.cos(t)) / 2 * H;
      const dr = (bodyR(t + 1e-3) - bodyR(t - 1e-3)) / 2e-3, dy = Math.sin(t) / 2 * H; const n = Math.hypot(dr, dy);
      pts.push(new THREE.Vector2(r + dy / n * .004, y - dr / n * .004));
    }
    const g = new THREE.LatheGeometry(pts, 56, -1.32, 2.64);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, .5 + p.getX(i) / (2 * FS), .5 + (p.getY(i) - FY) / (2 * FS));
    uv.needsUpdate = true; return g;
  })();
  const FT = {};
  for (const S of [256, 512, 1024]) {
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
    tx.minFilter = THREE.LinearMipmapLinearFilter; tx.magFilter = THREE.LinearFilter; tx.generateMipmaps = true;
    FT[S] = { S, cv, ctx: cv.getContext('2d'), tx };
  }
  const faceMat = new THREE.MeshBasicMaterial({ map: FT[1024].tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const faceMesh = mesh(faceGeo, faceMat, 0, BY, 0, body); faceMesh.renderOrder = 2;

  const counter = new THREE.Group(); body.add(counter); // groupe qui annule l'écrasement (bras, antenne)
  const arms = [-1, 1].map(s => {
    const anchor = new THREE.Group(); anchor.position.set(s * .58, .66, .06); body.add(anchor);
    const pv = new THREE.Group(); anchor.add(pv);
    ol(mesh(new THREE.CapsuleGeometry(.085, .2, 8, 16), toon(PAL.menthe), 0, -.17, 0, pv), 1);
    return { anchor, pv };
  });
  const feet = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .25, .05, .14); root.add(g); const m = ol(mesh(new THREE.SphereGeometry(.17, 28, 18), toon(PAL.pieds), 0, 0, 0, g), 1); m.scale.set(1, .55, 1.3); return g; });
  // antenne : courbe montante du logo + point ambre, regénérée à chaque image (ressort)
  const antAnchor = new THREE.Group(); antAnchor.position.set(0, H + BY, 0); body.add(antAnchor);
  const antMat = toon(PAL.antenne);
  const ANT = [[0, -.06], [0, .02], [.012, .14], [.09, .25], [.2, .29]].map(([x, y]) => new THREE.Vector3(x, y, 0));
  const antLen = (() => { let L = 0; const a = [0]; for (let i = 1; i < ANT.length; i++) { L += ANT[i].distanceTo(ANT[i - 1]); a.push(L); } return a.map(v => v / L); })();
  let antMesh = null;
  const beadMat = toon(PAL.ambre, { emissive: new THREE.Color(PAL.ambreLueur), emissiveIntensity: .35 });
  const bead = ol(mesh(new THREE.SphereGeometry(.078, 28, 18), beadMat, 0, 0, 0, antAnchor), .8);
  const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,214,140,1)'); g.addColorStop(.35, 'rgba(255,190,90,.55)'); g.addColorStop(1, 'rgba(255,170,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); antAnchor.add(halo);
  const rot = (v, ax, az) => { const c = Math.cos(az), s = Math.sin(az); let x = v.x * c - v.y * s, y = v.x * s + v.y * c, z = v.z; const c2 = Math.cos(ax), s2 = Math.sin(ax); return new THREE.Vector3(x, y * c2 - z * s2, y * s2 + z * c2); };
  function setAntenna(ax, az) {
    const pts = ANT.map((p, i) => rot(p, ax * antLen[i], az * antLen[i]));
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 30, .032, 12);
    if (!antMesh) { antMesh = ol(mesh(geo, antMat, 0, 0, 0, antAnchor), .8); }
    else { antMesh.geometry.dispose(); antMesh.geometry = geo; antMesh.children[0].geometry = geo; }
    const tip = rot(new THREE.Vector3(.222, .292, 0), ax, az);
    bead.position.copy(tip); halo.position.copy(tip);
  }
  setAntenna(0, 0);
  // ombre portée douce
  const shTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(110,60,30,.5)'); g.addColorStop(.6, 'rgba(110,60,30,.22)'); g.addColorStop(1, 'rgba(110,60,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t; })();
  const shadow = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }), 0, .004, 0, root);
  shadow.rotation.x = -Math.PI / 2; shadow.renderOrder = -2;

  // accessoires : écharpe (cadeau du jour 3) et livre (lecture)
  const scarf = new THREE.Group(); body.add(scarf); scarf.position.y = BY;
  {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 8; const cx = cv.getContext('2d');
    for (let i = 0; i < 32; i++) { cx.fillStyle = ['#FF7457', '#FF7457', '#FFC24F'][i % 3]; cx.fillRect(i * 4, 0, 4, 8); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping;
    const ring = ol(mesh(new THREE.TorusGeometry(rAtY(.57) + .012, .068, 14, 64), toon('#ffffff', { map: tx }), 0, .57, 0, scarf), .8);
    ring.rotation.x = Math.PI / 2; ring.rotation.y = .06;
    const tail = new THREE.Group(); tail.position.set(.27, .41, rAtY(.41) * .92); tail.rotation.set(-.15, .3, 0); scarf.add(tail);
    const tm = ol(mesh(new THREE.CapsuleGeometry(.06, .2, 6, 12), toon('#FF7457'), 0, 0, 0, tail), .8); tm.scale.set(1, 1, .42); tm.rotation.z = -.22;
  }
  const book = new THREE.Group(); body.add(book); book.position.set(0, .6, .78); book.rotation.set(-.9, 0, 0);
  const pageG = new THREE.Group(); book.add(pageG);
  const BOOK_A = .42;
  {
    const cover = toon('#3B54A8'), paper = toon('#FFF6E4'), band = toon('#FFB84D');
    for (const s of [-1, 1]) {
      const half = new THREE.Group(); half.rotation.z = s * BOOK_A; book.add(half);
      ol(mesh(new THREE.BoxGeometry(.24, .014, .29), cover, s * .12, -.013, 0, half), .7);
      mesh(new THREE.BoxGeometry(.24, .016, .032), band, s * .12, -.014, -.075, half);
      ol(mesh(new THREE.BoxGeometry(.226, .024, .27), paper, s * .114, .006, 0, half), .6);
      for (let l = 0; l < 5; l++) mesh(new THREE.BoxGeometry(.15, .002, .009), toon('#CDBFAA'), s * .12, .019, -.085 + l * .042, half);
    }
    const pv = new THREE.Group(); pageG.add(pv);
    ol(mesh(new THREE.BoxGeometry(.22, .004, .26), paper, .112, .02, 0, pv), .5);
  }
/* ----- îlot (repris du prototype de la direction 2) ----- */
  const island = new THREE.Group(); scene.add(island); island.scale.setScalar(1 / .9);
  const CAPY = .14, flowers = [], gifts = {};
  {
    const cap = [[.0001, CAPY], [1.0, CAPY], [1.17, CAPY - .015], [1.26, .07], [1.3, 0], [1.27, -.06], [1.18, -.1]].reverse().map(([x, y]) => new THREE.Vector2(x, y));
    ol(mesh(new THREE.LatheGeometry(cap, 72), toon('#9AD46C'), 0, 0, 0, island), 1);
    const soilP = [[1.2, -.08], [1.22, -.2], [1.1, -.44], [.92, -.7], [.64, -.98], [.32, -1.18], [.0001, -1.27]].reverse().map(([x, y]) => new THREE.Vector2(x, y));
    const sg = new THREE.LatheGeometry(soilP, 72);
    const cols = [], pos = sg.attributes.position, ca = new THREE.Color('#E0A06C'), cb = new THREE.Color('#B06E47'), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); c.copy(ca).lerp(cb, clamp((-y - .1) / 1.1)); if (y < -.38 && y > -.5) c.multiplyScalar(.86); cols.push(c.r, c.g, c.b); }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    ol(mesh(sg, toon('#ffffff', { vertexColors: true }), 0, 0, 0, island), 1);
    [[.35, -.85, .1], [-.95, .55, .08]].forEach(([x, z, r]) => { const m = mesh(new THREE.SphereGeometry(r, 16, 10), toon('#EADCCB'), x, CAPY + .01, z, island); m.scale.set(1.2, .5, 1); });
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + .2; const m = mesh(new THREE.SphereGeometry(.09, 14, 10), toon('#9AD46C'), Math.cos(a) * 1.22, -.06, Math.sin(a) * 1.22, island); m.scale.set(1, 1.5 + (i % 3) * .4, 1); }
    const FP = [[-.98, .3], [-.66, .74], [-.2, 1.04], [.62, .8], [.98, .3], [-1.05, -.3], [1.05, -.26]];
    const FC = ['#FF9C66', '#3CCB9C', '#FF8A73', '#A08CF7', '#6A84D6', '#FF9C66', '#F27BA3'];
    FP.forEach(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, CAPY, z); island.add(g);
      mesh(new THREE.CylinderGeometry(.014, .018, .24, 6), toon('#5DAA4E'), 0, .12, 0, g);
      const head = new THREE.Group(); head.position.y = .25; g.add(head);
      const leaf = mesh(new THREE.SphereGeometry(.05, 10, 8), toon('#6CB955'), .05, .08, 0, g); leaf.scale.set(1.4, .4, .7); leaf.rotation.z = .5;
      const ctr = mesh(new THREE.SphereGeometry(.045, 12, 10), toon('#FFE08A'), 0, .01, 0, head);
      const petals = [];
      for (let k = 0; k < 5; k++) { const pv = new THREE.Group(); pv.rotation.y = k / 5 * Math.PI * 2 + i; head.add(pv); const tl = new THREE.Group(); pv.add(tl); const pm = mesh(new THREE.SphereGeometry(.055, 12, 8), toon(FC[i]), .065, 0, 0, tl); pm.scale.set(1.5, .38, 1); petals.push(tl); }
      const bud = mesh(new THREE.SphereGeometry(.05, 12, 10), toon('#7CC35E'), 0, 0, 0, head); bud.scale.set(.9, 1.3, .9);
      flowers.push({ g, head, ctr, petals, bud });
    });
    const tree = new THREE.Group(); tree.position.set(-.66, CAPY, -.72); island.add(tree);
    ol(mesh(new THREE.CylinderGeometry(.05, .075, .44, 8), toon('#9A6440'), 0, .22, 0, tree), .8);
    [[0, .62, 0, .27], [.17, .5, .08, .19], [-.16, .52, .04, .18]].forEach(([x, y, z, r]) => ol(mesh(new THREE.SphereGeometry(r, 18, 14), toon('#6DB650'), x, y, z, tree), .8));
    const lantern = new THREE.Group(); lantern.position.set(.7, CAPY, -.74); island.add(lantern);
    ol(mesh(new THREE.CylinderGeometry(.026, .03, .62, 8), toon('#7A5240'), 0, .31, 0, lantern), .7);
    ol(mesh(new THREE.CylinderGeometry(.012, .012, .2, 6), toon('#7A5240'), .09, .6, 0, lantern), .6).rotation.z = Math.PI / 2;
    mesh(new THREE.SphereGeometry(.085, 16, 12), toon('#FFD27A', { emissive: new THREE.Color('#FFB84D'), emissiveIntensity: .9 }), .18, .5, 0, lantern);
    ol(mesh(new THREE.ConeGeometry(.1, .08, 12), toon('#7A5240'), .18, .61, 0, lantern), .6);
    gifts.tree = tree; gifts.lantern = lantern;
  }
  function setFlower(f, b) {
    const p = clamp(b);
    f.bud.visible = p < .5; f.bud.scale.set(.9 * (1 - p * .8), 1.3 * (1 - p * .8), .9 * (1 - p * .8));
    for (const tl of f.petals) { tl.rotation.z = lerp(1.35, .22, p); tl.scale.setScalar(lerp(.2, 1, Math.max(0, b))); tl.visible = p > .05; }
    f.ctr.scale.setScalar(lerp(.3, 1, p)); f.ctr.visible = p > .05; f.head.position.y = lerp(.2, .25, p);
  }
  const ISLAND_Y = CAPY / .9;

  /* ----- pose ----- */
  const v3 = new THREE.Vector3();
  function applyPose(P) {
    root.position.set(P.x, P.y0 || 0, P.z); root.rotation.y = P.yaw; root.scale.setScalar(P.scale || 1);
    const sy = 1 + P.sq, sx = 1 / Math.sqrt(Math.max(.3, sy));
    const sit = P.sit || 0;
    body.position.set(0, P.lift - .1 * sit, -.04 * sit);
    body.rotation.set(P.leanX - .2 * sit, P.twist, -P.leanZ);
    body.scale.set(sx, sy, sx);
    const inv = [1 / sx, 1 / sy, 1 / sx];
    for (const g of [antAnchor, arms[0].anchor, arms[1].anchor]) g.scale.set(...inv);
    const [aL, aR] = arms;
    aL.pv.rotation.set(P.aLx, 0, -(P.aL + (P.armLag || 0) + (P.armLagL || 0)));
    aR.pv.rotation.set(P.aRx, 0, (P.aR + (P.armLag || 0) + (P.armLagR || 0)));
    // pieds : restent au sol pendant l'écrasement, suivent le saut, avancent quand il s'assoit
    const tuck = P.footTuck || 0;
    feet.forEach((f, i) => {
      const s = i ? 1 : -1;
      f.position.set(s * (.25 - .04 * tuck + .05 * sit), .05 + P.lift * .92 + .05 * sit, .14 + .36 * sit);
      f.rotation.set(-1.0 * sit - .35 * tuck, 0, s * .25 * sit);
      f.scale.setScalar(1);
    });
    setAntenna(P.antX, P.antZ);
    const glow = P.glow;
    beadMat.emissiveIntensity = .2 + .55 * glow;
    halo.material.opacity = clamp(glow - .35) * .75; halo.scale.setScalar(.34 + .22 * glow);
    shadow.scale.set(1.5 * (1 - .35 * clamp(P.lift)) * (1 + .1 * sit), 1.25 * (1 - .35 * clamp(P.lift)) * (1 + .25 * sit), 1);
    shadow.material.opacity = (1 - .55 * clamp(P.lift * 1.5)) * (P.shadow ?? 1);
    shadow.position.z = .04 + .08 * sit;
    scarf.visible = P.scarf > .01; scarf.scale.setScalar(Math.max(.01, P.scarf));
    book.visible = P.book > .01; book.scale.setScalar(Math.max(.01, P.book));
    pageG.rotation.z = lerp(BOOK_A, Math.PI - BOOK_A, P.page);
  }

  /* ----- rendu d'une vue ----- */
  // view : { canvas (2D, taille d'affichage), bw, bh (pixels rendus), cam:{pos,look,fov}, island, flowers:[0..1]x7, gifts:{tree,lantern}, outline px }
  const outCtx = new Map();
  let curGrad = 'toon';
  function setMaterial({ grad = 'toon', rim = .42, outline = true } = {}) {
    if (grad !== curGrad) { for (const m of toonMats) m.gradientMap = GRAD[grad]; curGrad = grad; }
    U.uRim.value = rim; for (const o of outlines) o.visible = outline;
  }
  function setCam(view) {
    cam.fov = view.cam.fov; cam.aspect = view.bw / view.bh; cam.position.set(...view.cam.pos); cam.up.set(0, 1, 0);
    cam.lookAt(v3.set(...view.cam.look)); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  }
  function ppu(view) { const d = Math.hypot(...view.cam.pos.map((p, i) => p - view.cam.look[i])); return view.bh / (2 * d * Math.tan(view.cam.fov * Math.PI / 360)); }
  function render(view, P, opts = {}) {
    applyPose(P);
    island.visible = !!view.island;
    if (view.island) { flowers.forEach((f, i) => setFlower(f, (view.flowers || [])[i] ?? 1)); gifts.tree.visible = view.gifts?.tree ?? true; gifts.lantern.visible = view.gifts?.lantern ?? true; }
    root.visible = view.pilou !== false;
    shadow.visible = !view.island;
    setCam(view);
    const k = ppu(view) * (P.scale || 1);
    U.olPx.value = view.olPx ?? clamp(1.7 + k * .0032, 2, 5.6); U.olRes.value.set(view.bw, view.bh);
    // visage : taille de texture selon la taille à l'écran
    const need = k * 2 * FS; const S = need > 420 ? 1024 : need > 190 ? 512 : 256;
    const ft = FT[S]; drawFace(ft.ctx, S, P.f); ft.tx.needsUpdate = true; faceMat.map = ft.tx;
    scene.updateMatrixWorld(true);
    const { bw, bh } = view;
    R.setViewport(0, 0, bw, bh); R.setScissor(0, 0, bw, bh); R.setScissorTest(true);
    if (opts.split) { // écran partagé dans la même vue : deux matières de part et d'autre d'une ligne
      const xs = Math.round(clamp(opts.split.x) * bw);
      R.setClearColor(0, 0); R.clear();
      setMaterial(opts.split.left); R.setScissor(0, 0, xs, bh); R.render(scene, cam);
      setMaterial(opts.split.right); R.setScissor(xs, 0, bw - xs, bh); R.render(scene, cam);
      setMaterial({});
    } else R.render(scene, cam);
    R.setScissorTest(false);
    let ctx = outCtx.get(view.canvas); if (!ctx) { ctx = view.canvas.getContext('2d'); outCtx.set(view.canvas, ctx); }
    ctx.clearRect(0, 0, view.canvas.width, view.canvas.height);
    ctx.drawImage(R.domElement, 0, R.domElement.height - bh, bw, bh, 0, 0, view.canvas.width, view.canvas.height);
  }
  // projection d'un point (repère du corps ou du monde) vers les pixels de la vue
  function project(view, p, space = 'body') {
    v3.set(...p);
    if (space === 'body') body.localToWorld(v3); else if (space === 'root') root.localToWorld(v3); else if (space === 'bead') bead.getWorldPosition(v3);
    v3.project(cam);
    return [(v3.x + 1) / 2 * view.canvas.width, (1 - v3.y) / 2 * view.canvas.height];
  }
  function stats() { let tris = 0; scene.traverse(o => { if (o.isMesh && o.visible) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return Math.round(tris); }
  return { R, scene, cam, render, project, setMaterial, setCam, applyPose, root, body, island, ISLAND_Y, stats, FT, GRAD };
}
