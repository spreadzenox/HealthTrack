// scene.js — la mise en scène : heure dorée (soleil bas en contre-jour, ciel abricot, brume), environnement PMREM,
// ombres douces, rayons de lumière (flou radial depuis le soleil), poussières en suspension, profondeur de champ,
// halo lumineux, grain. Toute l'image est une fonction pure du temps : window.seek(ms).
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { clamp, lerp, seg, sstep } from './pilou.js';
import { EXPR, E, exprAt, applyIdle, springs, blinkCurve } from './anim.js';
import { createPilou } from './creature.js';
import { createIsland, yTop } from './ile.js';
import { canvasTex, rngF, K } from './matiere.js';

const C = h => new THREE.Color(h);
const Q = new URLSearchParams(location.search);
const OFF = new Set((Q.get('off') || '').split(','));
export const DURATION = 10000;

export async function createWorld(canvas, { w = 1920, h = 1080, ss = +(Q.get('ss') || .75), petit = Q.get('petit') === '1', samples = +(Q.get('msaa') || 4) } = {}) {
  const R = new THREE.WebGLRenderer({ canvas, antialias: samples > 0, alpha: petit, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  R.setPixelRatio(ss); R.setSize(w, h, false);
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.NoToneMapping; // la courbe de tonalité est appliquée dans la dernière passe
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap; R.shadowMap.autoUpdate = false;
  const W = Math.round(w * ss), Hh = Math.round(h * ss);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(24, w / h, .1, 200);

  /* ---------- lumière : soleil bas derrière à gauche, contre-jour ---------- */
  const sunAz = THREE.MathUtils.degToRad(+(Q.get('sunaz') || -150)), sunEl = THREE.MathUtils.degToRad(+(Q.get('sunel') || 15));
  const sunDir = new THREE.Vector3(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), Math.cos(sunAz) * Math.cos(sunEl)).normalize();
  const sun = new THREE.DirectionalLight(C('#FFCFA0'), 3.6 * K);
  sun.position.copy(sunDir).multiplyScalar(8); sun.target.position.set(0, 0, 0); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 3.5; sun.shadow.bias = -.0004; sun.shadow.normalBias = .012;
  Object.assign(sun.shadow.camera, { left: -2.1, right: 2.1, top: 2.1, bottom: -2.1, near: 2, far: 16 }); sun.shadow.camera.updateProjectionMatrix();
  const fillDir = new THREE.Vector3(.55, .5, .67).normalize();
  const fill = new THREE.DirectionalLight(C('#FFE4D2'), 1.15 * K); fill.position.copy(fillDir).multiplyScalar(8); scene.add(fill);

  /* ---------- ciel (fond) et environnement (reflets, lumière ambiante) ---------- */
  const SKY = /* glsl */`
    uniform vec3 uSun; uniform vec3 uFill; uniform float uEnv;
    vec3 skyCol(vec3 d){
      float hh = d.y;
      vec3 hor = vec3(.95, .5, .27), up = vec3(.9, .66, .5), zen = vec3(.78, .66, .7);
      vec3 c = mix(hor, up, smoothstep(.0, .3, hh)); c = mix(c, zen, smoothstep(.3, .9, hh));
      vec3 below = mix(vec3(.95, .6, .42), vec3(.62, .48, .55), smoothstep(-.05, -.6, hh));
      c = mix(below, c, smoothstep(-.06, .02, hh));
      c += vec3(1., .66, .38) * .3 * exp(-abs(hh) * 12.);
      float s = max(dot(d, uSun), 0.);
      c += vec3(1., .72, .42) * (pow(s, 5.) * .32 + pow(s, 48.) * 1.2) + vec3(1., .86, .6) * smoothstep(.99955, .9998, s) * 40.;
      if (uEnv > .5) {
        c = mix(c, vec3(.16, .2, .07), smoothstep(.0, -.2, hh));       // l'herbe sous le personnage
        float f = max(dot(d, uFill), 0.); c += vec3(1., .9, .8) * smoothstep(.93, .975, f) * 2.2;   // nuage clair : reflet dans l'œil
      }
      return c;
    }`;
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: sunDir }, uFill: { value: fillDir }, uEnv: { value: 0 }, uK: { value: K } }, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }',
    fragmentShader: SKY + 'uniform float uK; varying vec3 vD; void main(){ gl_FragColor = vec4(skyCol(normalize(vD)) * uK, 1.);\n#include <colorspace_fragment>\n}',
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), skyMat); skyDome.renderOrder = -10; skyDome.frustumCulled = false;
  {
    const envScene = new THREE.Scene();
    const em = skyMat.clone(); em.uniforms = { uSun: { value: sunDir }, uFill: { value: fillDir }, uEnv: { value: 1 }, uK: { value: 1 } }; em.vertexShader = 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), em));
    const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(envScene, .01, .1, 100, { size: 256 }).texture; pm.dispose();
    scene.environmentIntensity = .62 * K;
  }
  const backdrop = new THREE.Group(); scene.add(backdrop); backdrop.add(skyDome);
  scene.fog = new THREE.Fog(C('#FFC9A6'), 14, 60);

  // nuages lointains et brume (peints sur canevas)
  const cloudTex = canvasTex(512, 256, (x, Wc, Hc) => {
    const r = rngF(8);
    for (let i = 0; i < 26; i++) { const cx = Wc * (.15 + .7 * r()), cy = Hc * (.45 + .3 * r()), rr = Hc * (.12 + .22 * r()); const g = x.createRadialGradient(cx, cy - rr * .2, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,236,218,.55)'); g.addColorStop(.6, 'rgba(255,214,190,.22)'); g.addColorStop(1, 'rgba(255,200,170,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rr, 0, Math.PI * 2); x.fill(); }
  });
  const clouds = [];
  [[-34, -6, -32, 26, .75], [18, -9, -40, 34, .7], [-8, -16, -30, 40, .8], [40, 2, -26, 22, .5], [-46, 6, -18, 22, .45], [6, -4, -46, 30, .55]].forEach(([x, y, z, s, o]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * .5), new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: o, fog: false, color: C('#FFE2CC').multiplyScalar(K) }));
    m.position.set(x, y, z); m.lookAt(0, y * .3, 0); backdrop.add(m); clouds.push(m);
  });

  /* ---------- l'île et Pilou ---------- */
  const island = createIsland({ quality: +(Q.get('q') || .55) }); scene.add(island.group);
  const pilou = createPilou(); scene.add(pilou.root);
  if (OFF.has('shadow')) R.shadowMap.enabled = false;
  if (OFF.has('pilou')) pilou.root.visible = false;
  if (OFF.has('ile')) island.group.visible = false;
  if (OFF.has('herbe')) island.group.children.filter(o => o.isInstancedMesh).forEach(o => o.visible = false);
  const instanced = island.group.children.filter(o => o.isInstancedMesh);
  island.group.children.forEach(o => { if (o.userData.tag && OFF.has(o.userData.tag)) o.visible = false; });
  if (OFF.has('autres')) instanced.forEach(o => { if (o.userData.tag !== 'herbe') o.visible = false; });
  if (OFF.has('herbeombre')) instanced.forEach(o => o.castShadow = false);
  if (OFF.has('fuzz')) pilou.body.children.filter(o => o.material && o.material.isShaderMaterial).forEach(o => o.visible = false);

  /* ---------- poussières en suspension (diffusion vers l'avant en contre-jour) ---------- */
  const dust = (() => {
    const N = 340, r = rngF(99), P = new Float32Array(N * 3), A = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) { P.set([(r() - .5) * 5.4, -.4 + r() * 3.2, -2.4 + r() * 5.2], i * 3); A.set([r() * 6.28, .3 + r() * .7, .004 + .006 * Math.pow(r(), 2), r()], i * 4); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aD', new THREE.BufferAttribute(A, 4));
    const m = new THREE.ShaderMaterial({
      uniforms: { uK: { value: K }, uT: { value: 0 }, uSun: { value: sunDir }, uFocus: { value: 6 }, uPx: { value: Hh / (2 * Math.tan(12 * Math.PI / 180)) }, uCoc: { value: 26 * ss } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uT, uFocus, uPx, uCoc; uniform vec3 uSun; attribute vec4 aD; varying float vI; varying float vS;
        void main(){
          vec3 p = position + vec3(.07 * sin(uT * .31 * aD.y + aD.x), .03 * uT * aD.y + .05 * sin(uT * .5 + aD.x * 2.), .07 * cos(uT * .27 * aD.y + aD.x * 1.3));
          vec4 wp = modelMatrix * vec4(p, 1.); vec4 mv = viewMatrix * wp;
          float dist = -mv.z; vec3 toCam = normalize(cameraPosition - wp.xyz);
          float phase = .18 + 3.2 * pow(max(dot(-uSun, toCam), 0.), 6.);
          float base = max(aD.z * uPx / dist, 1.2);
          float coc = clamp(abs(1. / uFocus - 1. / dist) * uCoc * 6., 0., 34.);
          float sz = base + coc; vS = sz;
          vI = phase * (.6 + .8 * aD.w) * (base * base) / (sz * sz) * smoothstep(.5, 1.5, dist);
          gl_PointSize = sz; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uK; varying float vI; varying float vS;
        void main(){ vec2 q = gl_PointCoord * 2. - 1.; float d = length(q); float a = 1. - smoothstep(.65, 1., d); a *= .75 + .25 * smoothstep(.3, .95, d) * step(4., vS); gl_FragColor = vec4(vec3(1., .82, .55) * vI * a * 1.1 * uK, 1.);
#include <colorspace_fragment>
}`,
    });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts); return pts;
  })();

  /* ---------- post-traitement ----------
     Le multiéchantillonnage du canevas (antialias) est bien moins coûteux en rendu logiciel que celui d'une cible :
     la scène est donc rendue dans le canevas (sRGB 8 bits, ×K), copiée dans une texture, puis remise à l'échelle,
     éclairée de rayons, voilée de halo et de grain, et passée dans la courbe de tonalité. */
  const copyTex = new THREE.FramebufferTexture(W, Hh);
  const rtA = new THREE.WebGLRenderTarget(W, Hh, { type: THREE.HalfFloatType });
  const RW = Math.round(W / 4), RH = Math.round(Hh / 4);
  const rtOcc = new THREE.WebGLRenderTarget(RW, RH), rtRay = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType });
  const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
  const rayQuad = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { tOcc: { value: rtOcc.texture }, uSun: { value: new THREE.Vector2() }, uAsp: { value: w / h }, uOn: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tOcc; uniform vec2 uSun; uniform float uAsp, uOn; varying vec2 vUv;
      void main(){ vec2 d = vUv - uSun; vec2 st = d / 56. * .9; vec2 uv = vUv; float acc = 0., dec = 1.;
        for (int i = 0; i < 56; i++) { uv -= st; vec2 q = (uv - uSun) * vec2(uAsp, 1.); float glow = exp(-length(q) * 2.6);
          acc += texture2D(tOcc, clamp(uv, .001, .999)).r * glow * dec; dec *= .972; }
        gl_FragColor = vec4(vec3(acc / 56. * uOn), 1.); }`,
  }));
  const gradeQuad = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { tCol: { value: copyTex }, tRay: { value: rtRay.texture }, uK: { value: K }, uRayCol: { value: C('#FFC080').multiplyScalar(.2) },
      uRes: { value: new THREE.Vector2(W, Hh) }, uSeed: { value: 0 }, uVig: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tCol, tRay; uniform float uK, uSeed, uVig; uniform vec3 uRayCol; uniform vec2 uRes; varying vec2 vUv;
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32 + uSeed); return fract(p.x * p.y); }
      vec3 dec(vec3 c){ return mix(pow(c * .9478672986 + .0521327014, vec3(2.4)), c * .0773993808, vec3(lessThanEqual(c, vec3(.04045)))); }
      void main(){
        vec4 s = texture2D(tCol, vUv);
        vec3 c = dec(s.rgb) / uK;
        c += texture2D(tRay, vUv).rgb * uRayCol;
        vec2 q = vUv - .5; c *= 1. - .28 * uVig * smoothstep(.25, .85, length(q * vec2(1.1, 1.)));
        c *= 1. + (hash(vUv * uRes + 1.7) - .5) * .045 * uVig;
        gl_FragColor = vec4(c, s.a);
      }`,
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(Math.round(W / 2), Math.round(Hh / 2)), .32, .55, 1.15);
  const TM = Q.get('tm') === 'agx' ? 'AgXToneMapping' : Q.get('tm') === 'aces' ? 'ACESFilmicToneMapping' : 'NeutralToneMapping';
  const finalQuad = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { tA: { value: rtA.texture }, tAl: { value: copyTex }, uPetit: { value: petit ? 1 : 0 }, uBg: { value: new THREE.Vector3(1, 241 / 255, 226 / 255) }, toneMappingExposure: { value: +(Q.get('expo') || 1) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: THREE.ShaderChunk.tonemapping_pars_fragment + `
      uniform sampler2D tA, tAl; uniform float uPetit; uniform vec3 uBg; varying vec2 vUv;
      void main(){ vec4 s = texture2D(tA, vUv); gl_FragColor = vec4(${TM}(s.rgb), 1.);
        #include <colorspace_fragment>
        if (uPetit > .5) { float a = clamp(texture2D(tAl, vUv).a, 0., 1.); gl_FragColor.rgb = min(gl_FragColor.rgb + uBg * (1. - a), vec3(1.)); }
      }`,
  }));

  /* ---------- caméra : grue + orbite lente (≈ 32°), courbe douce ---------- */
  function camAt(τ) {
    const u = clamp(τ / DURATION), e = u * u * u * (u * (u * 6 - 15) + 10);
    const az = THREE.MathUtils.degToRad(lerp(-22, 10, e)), dist = lerp(8.6, 5.1, e);
    return { pos: [Math.sin(az) * dist, lerp(.5, 1.12, e), Math.cos(az) * dist], look: [0, lerp(.05, .8, e), 0], fov: 24, az };
  }

  /* ---------- Pilou : piste d'expressions, regard, clignements ---------- */
  EXPR.salutM = {
    nom: 'Salut', p: { aL: 2.3, aR: .3, glow: .78, f: { lidTop: .02, lidBot: .32, mw: .086, mU: .044, mL: .08, tongue: .5, blush: .72 } },
    anim(P, u, w) { const ww = w * sstep(220, 560, u), ph = (u - 320) / 150; P.aL += ww * .36 * Math.sin(ph); P.leanZ += w * .028 + ww * .03 * Math.sin(ph); P.sq += w * .012; },
  };
  const TRACK = [{ t: 0, e: 'tranquille' }, { t: 2350, e: 'content', d: 900 }, { t: 4300, e: 'salutM', d: 520, c: 'sortie' }, { t: 7250, e: 'content', d: 760 }];
  const SEED = 3;
  const GAZE = [[0, -.55, .3], [1500, .38, -.42], [2350, 'cam'], [8250, -.55, .28], [9150, 'cam']];
  const BLINKS = [1150, 3650, 6300, 9350, 9600];
  function gazeAt(τ, delay = 0, dur = 90, curve = 'sortie') {
    const t = τ - delay; let i = 0; while (i + 1 < GAZE.length && GAZE[i + 1][0] <= t) i++;
    const val = g => g[1] === 'cam' ? [0, 0, 1] : [g[1], g[2], 0];
    const a = val(GAZE[Math.max(0, i - 1)]), b = val(GAZE[i]), p = i ? E[curve](seg(t, GAZE[i][0], GAZE[i][0] + dur)) : 1;
    return [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
  }
  function kinAt(τ) {
    const P = exprAt(TRACK, τ); P.gazeW = 0; applyIdle(P, τ, SEED, 1, true);
    const c = camAt(τ);
    const [hx, hy, hc] = gazeAt(τ, 80, 450, 'douce');
    const camAz = Math.atan2(c.pos[0], c.pos[2]);
    P.twist += lerp(.16 * hx, .5 * camAz, hc); P.leanX += lerp(-.03 * hy, .015, hc);
    const [bx] = gazeAt(τ, 400, 600, 'douce'); P.leanZ += .05 * bx;
    P.y0 = yTop(0) - .004; P.z = .04;
    return P;
  }
  function poseAt(τ) {
    const P = kinAt(τ);
    applyIdle(P, τ, SEED, 1, false); // (regard libre désactivé : gazeW = 0 ; seules les couches du corps comptent)
    const [gx, gy, gc] = gazeAt(τ, 0, 90, 'sortie');
    P.f.lookX += gx; P.f.lookY += gy; P.camW = gc;
    let b = 0; for (const t0 of BLINKS) b = Math.max(b, blinkCurve(τ - t0));
    P.f.lidTop = Math.max(P.f.lidTop, b * (1 - sstep(.6, .9, P.f.lidBot)));
    const sunLook = sstep(8250, 8550, τ) * (1 - sstep(9150, 9450, τ));
    P.pupil = .4 + .07 * sstep(2350, 2900, τ) - .1 * sunLook + .01 * Math.sin(τ / 900);
    P.glow *= .9 + .12 * Math.sin(τ / 2400 * Math.PI * 2);
    springs(kinAt, τ, P);
    return P;
  }

  /* ---------- une image ---------- */
  const v3 = new THREE.Vector3(), eyeW = new THREE.Vector3();
  let petitMode = petit;
  if (petitMode) { backdrop.visible = false; dust.visible = false; scene.fog = null; pilou.halo.visible = false; }
  const PROF = Q.get('prof') === '1'; const gl = R.getContext(); let tp = 0; const prof = {};
  const px1 = new Uint8Array(4); const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1);
  const mark = k => { if (!PROF) return; sync(); const n = performance.now(); prof[k] = (prof[k] || 0) + n - tp; tp = n; };
  window.__prof = prof;
  function frame(τ) {
    if (PROF) { sync(); tp = performance.now(); }
    const c = petitMode ? { pos: [1.3, 1.15, 6.75], look: [0, .66, 0], fov: 24 } : camAt(τ);
    cam.fov = c.fov; cam.position.set(...c.pos); cam.lookAt(v3.set(...c.look)); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    island.update(τ);
    const P = poseAt(τ); mark('pose');
    pilou.apply(P, τ, cam, sunDir, fillDir); mark('apply');
    dust.material.uniforms.uT.value = τ / 1000;
    pilou.eyes[0].g.getWorldPosition(eyeW); const focus = eyeW.distanceTo(cam.position);
    dust.material.uniforms.uFocus.value = focus;
    gradeQuad.material.uniforms.uSeed.value = (τ * .37) % 17;
    // rendu principal
    R.shadowMap.needsUpdate = true;
    R.setRenderTarget(null); R.setClearColor(0x000000, petitMode ? 0 : 1); R.clear(); R.render(scene, cam); R.copyFramebufferToTexture(copyTex); mark('main');
    // rayons : masque d'occlusion (silhouettes noires sur ciel blanc), puis flou radial vers le soleil
    v3.copy(cam.position).addScaledVector(sunDir, 80).project(cam);
    const sunUv = new THREE.Vector2(v3.x * .5 + .5, v3.y * .5 + .5);
    const facing = sunDir.dot(cam.getWorldDirection(new THREE.Vector3()));
    rayQuad.material.uniforms.uSun.value.copy(sunUv); rayQuad.material.uniforms.uOn.value = petitMode ? 0 : sstep(-.2, .3, facing);
    if (!petitMode && !OFF.has('rays')) {
      const vis = [backdrop.visible, dust.visible]; backdrop.visible = false; dust.visible = false;
      const fz = scene.fog; scene.fog = null; scene.overrideMaterial = blackMat; instanced.forEach(o => o.visible = false); const halo = pilou.halo; halo.visible = false;
      R.setRenderTarget(rtOcc); R.setClearColor(0xffffff, 1); R.clear(); R.render(scene, cam);
      scene.overrideMaterial = null; scene.fog = fz; instanced.forEach(o => o.visible = true); [backdrop.visible, dust.visible] = vis; halo.visible = true;
      R.setRenderTarget(rtRay); rayQuad.render(R); mark('rays');
    }
    R.setRenderTarget(rtA); gradeQuad.material.uniforms.uVig.value = petitMode ? 0 : 1; gradeQuad.render(R); mark('grade');
    if (!OFF.has('bloom') && !petitMode) bloom.render(R, null, rtA, 0, false); mark('bloom');
    R.setRenderTarget(null); finalQuad.render(R); mark('final');
    return P;
  }
  function stats() { let tris = 0, n = 0; scene.traverse(o => { if ((o.isMesh) && o.visible) { const g = o.geometry; const t = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += t * (o.isInstancedMesh ? o.count : 1); n++; } }); return { tris: Math.round(tris), meshes: n, calls: R.info.render.calls }; }
  return { R, scene, cam, frame, stats, pilou, island, camAt, sunDir };
}
