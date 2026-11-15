// creature.js — Pilou en « créature de film d'animation » : peau veloutée à sous-surface simulée, duvet en
// coques additives, yeux 3D (cornée vernie, iris réfracté avec profondeur, pupille réglable, paupières de peau),
// antenne translucide et point ambre bioluminescent, petite montre (verre bombé, aiguilles, bracelet souple).
// Silhouette, proportions et couleurs : celles de la planche (pilou.js de compagnon-1-personnage).
import * as THREE from 'three';
import { H, BY, bodyR, rAtY, PAL, FS, FY, clamp, lerp, sstep, mouthPath } from './pilou.js';
import { patchMat, skinNormalMap, canvasTex, radialSprite, rngF, K, NOISE, NOISE_U } from './matiere.js';

const C = h => new THREE.Color(h);
const SKIN_SSS = (k = 1) => ({ wrap: [.5, .36, .3], col: '#FFC896', amt: .62 * k, dist: .55, pow: 2.6 });

export function createPilou() {
  const skinN = skinNormalMap(); skinN.repeat.set(9, 6);
  const root = new THREE.Group();
  const body = new THREE.Group(); body.rotation.order = 'ZXY'; root.add(body);
  const updaters = [];

  /* ---------- matières de peau ---------- */
  const bodyU = { uBellyCol: { value: C(PAL.ventre) }, uCheekCol: { value: C('#FF7F7A') }, uBlush: { value: .5 }, uThick: { value: .9 }, uMouth: { value: null } };
  const bodyMat = patchMat(new THREE.MeshPhysicalMaterial({
    color: C(PAL.menthe), roughness: .56, sheen: .85, sheenRoughness: .38, sheenColor: C('#FFE4C8'), specularIntensity: .5,
    normalMap: skinN, normalScale: new THREE.Vector2(.1, .1),
  }), {
    key: 'pilou-corps', uniforms: bodyU, sss: SKIN_SSS(1),
    vDecl: 'varying vec3 vObj;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;']],
    fDecl: `varying vec3 vObj; uniform vec3 uBellyCol, uCheekCol; uniform float uBlush, uThick; uniform sampler2D uMouth;
            float mouthA = 0.; float cheekM = 0.; float bellyM = 0.;`,
    frep: [
      ['#include <color_fragment>', `#include <color_fragment>
      {
        float ph = atan(vObj.x, vObj.z);
        float eB = pow(ph / .9, 2.) + pow((vObj.y - .34) / .25, 2.);
        bellyM = 1. - smoothstep(.86, 1.06, eB);
        diffuseColor.rgb = mix(diffuseColor.rgb, uBellyCol, bellyM);
        float mot = fbm3(vObj * 7.3);
        diffuseColor.rgb *= .93 + .12 * mot;
        float front = smoothstep(.05, .25, vObj.z);
        vec2 cq = vec2(abs(vObj.x) - .345, (vObj.y - .79) / .72);
        cheekM = exp(-dot(cq, cq) / (.0036 + .0055 * uBlush)) * front * clamp(uBlush * 1.5, 0., 1.);
        diffuseColor.rgb = mix(diffuseColor.rgb, uCheekCol, cheekM * .55);
        vec2 fuv = vec2(.5 + vObj.x / ${(2 * FS).toFixed(3)}, .5 + (vObj.y - ${FY.toFixed(3)}) / ${(2 * FS).toFixed(3)});
        vec4 mo = texture2D(uMouth, fuv);
        mouthA = mo.a * front;
        diffuseColor.rgb = mix(diffuseColor.rgb, mo.rgb, mouthA);
        for (int i = 0; i < 2; i++) { float s = i == 0 ? -1. : 1.;
          vec2 e = vec2((vObj.x - s * .2) / .086, (vObj.y - .9) / .106);
          float d = length(e);
          diffuseColor.rgb *= 1. - .3 * exp(-pow((d - 1.12) * 3.6, 2.)) * front * (e.y > -.2 ? 1. : .55);
        }
        float ao = mix(.48, 1., smoothstep(.0, .34, vObj.y));
        vec2 ua = vec2((abs(vObj.x) - .52) / .1, (vObj.y - .42) / .2);
        ao *= 1. - .3 * exp(-dot(ua, ua)) * smoothstep(.55, .1, abs(vObj.z - .05));
        diffuseColor.rgb *= ao;
      }`],
      ['#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor * (.9 + .2 * vnoise(vObj * 40.)), .26, mouthA);`],
      ['#include <lights_fragment_begin>', `{ float ndv = saturate(dot(normal, normalize(vViewPosition)));
          sssK = uThick * .85 * pow(1. - ndv, 2.6) * (1. - mouthA);
          sssTint = mix(vec3(1.), vec3(1.3, .72, .66), clamp(cheekM * 1.2 + bellyM * .35, 0., 1.)); }
        #include <lights_fragment_begin>`],
    ],
  });
  function plainSkin(hex, key, thick, extra = {}) {
    const U = { uThick: { value: thick } };
    return patchMat(new THREE.MeshPhysicalMaterial(Object.assign({
      color: C(hex), roughness: .56, sheen: .8, sheenRoughness: .4, sheenColor: C('#FFE4C8'), specularIntensity: .5,
      normalMap: skinN, normalScale: new THREE.Vector2(.1, .1),
    }, extra)), {
      key, uniforms: U, sss: SKIN_SSS(1),
      vDecl: 'varying vec3 vObj;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;']],
      fDecl: 'varying vec3 vObj; uniform float uThick;',
      frep: [
        ['#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= .93 + .12 * fbm3(vObj * 9.);'],
        ['#include <lights_fragment_begin>', `{ float ndv = saturate(dot(normal, normalize(vViewPosition)));
            sssK = uThick * (.1 + .9 * pow(1. - ndv, 2.)) * .8; }
          #include <lights_fragment_begin>`],
      ],
    });
  }
  const armMat = plainSkin(PAL.menthe, 'pilou-bras', 1.25);
  const lidMat = plainSkin(PAL.menthe, 'pilou-paupiere', .7);
  const footMat = plainSkin(PAL.pieds, 'pilou-pied', .55, { roughness: .6 });
  const antMat = plainSkin(PAL.antenne, 'pilou-antenne', 1.7, { roughness: .45 });

  /* ---------- corps (profil de la planche, couture au dos) ---------- */
  const prof = []; for (let i = 0; i <= 110; i++) { const t = i / 110 * Math.PI; prof.push(new THREE.Vector2(Math.max(1e-4, bodyR(t)), (1 - Math.cos(t)) / 2 * H)); }
  const bodyMesh = new THREE.Mesh(new THREE.LatheGeometry(prof, 150, Math.PI, Math.PI * 2), bodyMat);
  bodyMesh.position.y = BY; bodyMesh.castShadow = true; body.add(bodyMesh);

  /* ---------- bouche : peinte sur canevas, projetée de face dans la matière du corps ---------- */
  const MS = 1024, mcv = document.createElement('canvas'); mcv.width = mcv.height = MS;
  const mctx = mcv.getContext('2d');
  const mouthTex = new THREE.CanvasTexture(mcv); mouthTex.colorSpace = THREE.SRGBColorSpace; mouthTex.anisotropy = 4;
  bodyU.uMouth.value = mouthTex;
  let mouthKey = '';
  function drawMouth(F) {
    const key = [F.mw, F.mU, F.mL, F.mA, F.mx, F.mSkew, F.tongue].map(v => v.toFixed(4)).join();
    if (key === mouthKey) return; mouthKey = key;
    const k = MS / (2 * FS), X = x => (x / (2 * FS) + .5) * MS, Y = y => (.5 - (y - FY) / (2 * FS)) * MS;
    const ctx = mctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, MS, MS); ctx.filter = 'none';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const m = mouthPath(ctx, X, Y, F), gap = m.dL - m.dU;
    if (gap > .003) {
      const top = Y(m.yc - m.dU * .6), bot = Y(m.yc - m.dL);
      const g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, '#2A0C0A'); g.addColorStop(.55, '#4A1714'); g.addColorStop(1, '#6A2622');
      ctx.beginPath(); m.upper(); m.lower(); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.beginPath(); m.upper(); m.lower(); ctx.closePath(); ctx.clip();
      if (F.tongue > .01) {
        const tx = X(m.mx + .08 * m.w), ty = Y(m.yc - m.dL + .16 * gap), rx = .62 * m.w * k, ry = .62 * gap * k;
        const tg = ctx.createRadialGradient(tx, ty - ry * .3, 0, tx, ty, rx);
        tg.addColorStop(0, `rgba(255,150,140,${clamp(F.tongue)})`); tg.addColorStop(.7, `rgba(226,104,100,${clamp(F.tongue)})`); tg.addColorStop(1, `rgba(170,62,60,${clamp(F.tongue) * .9})`);
        ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(150,50,50,${.5 * clamp(F.tongue)})`; ctx.lineWidth = .004 * k; ctx.beginPath(); ctx.moveTo(tx, ty - ry * .6); ctx.lineTo(tx, ty + ry * .2); ctx.stroke();
      }
      // ombre sous la lèvre du haut
      ctx.filter = `blur(${(.006 * k).toFixed(1)}px)`; ctx.strokeStyle = 'rgba(20,4,4,.85)'; ctx.lineWidth = .02 * k; ctx.beginPath(); m.upper(); ctx.stroke(); ctx.filter = 'none';
      ctx.restore();
      ctx.filter = `blur(${(.0025 * k).toFixed(1)}px)`;
      ctx.strokeStyle = 'rgba(70,32,28,.9)'; ctx.lineWidth = .011 * k; ctx.beginPath(); m.upper(); m.lower(); ctx.closePath(); ctx.stroke();
      ctx.filter = 'none';
    } else {
      ctx.filter = `blur(${(.003 * k).toFixed(1)}px)`;
      ctx.strokeStyle = 'rgba(66,30,26,.95)'; ctx.lineWidth = .016 * k; ctx.beginPath(); m.upper(); ctx.stroke();
      ctx.filter = 'none';
    }
    // fossettes aux coins (pli doux de la peau)
    const d = sstep(.03, .05, m.dU);
    if (d > .02) {
      ctx.filter = `blur(${(.004 * k).toFixed(1)}px)`;
      ctx.strokeStyle = `rgba(40,70,58,${.45 * d})`; ctx.lineWidth = .012 * k;
      for (const [P, s] of [[m.L, -1], [m.R, 1]]) { ctx.beginPath(); ctx.moveTo(X(P[0] - s * .004), Y(P[1] + .018)); ctx.quadraticCurveTo(X(P[0] + s * .014), Y(P[1] + .006), X(P[0] + s * .007), Y(P[1] - .01)); ctx.stroke(); }
      ctx.filter = 'none';
    }
    mouthTex.needsUpdate = true;
  }

  /* ---------- duvet : trois coques additives, visibles surtout en contre-jour ---------- */
  const fuzzU = { uSunV: { value: new THREE.Vector3() }, uSunCol: { value: C('#FFC98F').multiplyScalar(1) }, uFill: { value: C('#FFF0E0').multiplyScalar(.04) }, uAmt: { value: K * .6 } };
  const fuzzMats = [];
  [[.004, 1, 0], [.009, .7, 1], [.015, .42, 2]].forEach(([off, amt, layer]) => {
    const pts = []; for (let i = 0; i <= 80; i++) {
      const t = lerp(.02, Math.PI - .02, i / 80), r = bodyR(t), y = (1 - Math.cos(t)) / 2 * H;
      const dr = (bodyR(t + 1e-3) - bodyR(t - 1e-3)) / 2e-3, dy = Math.sin(t) / 2 * H, n = Math.hypot(dr, dy);
      pts.push(new THREE.Vector2(r + dy / n * off, y - dr / n * off));
    }
    const mat = new THREE.ShaderMaterial({
      uniforms: Object.assign({ uLayer: { value: layer }, uK: { value: amt } }, fuzzU, NOISE_U), transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vO;
        void main(){ vO = position; vec4 mv = modelViewMatrix * vec4(position, 1.); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vN; varying vec3 vV; varying vec3 vO;
        uniform vec3 uSunV, uSunCol, uFill; uniform float uAmt, uLayer, uK;
        ${NOISE}
        void main(){
          vec3 n = normalize(vN), v = normalize(vV);
          float ndv = abs(dot(n, v));
          float edge = pow(1. - ndv, 3.6);
          float lit = smoothstep(-.4, .45, dot(n, uSunV));
          float back = .3 + 1.6 * pow(max(dot(v, -uSunV), 0.), 2.5);
          float f = vnoise(vO * vec3(300., 110., 300.) + uLayer * 17.);
          f = smoothstep(.45 + .1 * uLayer, .92, f);
          float ph = atan(vO.x, vO.z); float eB = pow(ph / .9, 2.) + pow((vO.y - .34) / .25, 2.);
          vec3 tint = mix(vec3(.75, 1., .88), vec3(1., .96, .9), 1. - smoothstep(.86, 1.06, eB));
          vec3 c = (uSunCol * lit * back + uFill) * tint * edge * f * uAmt * uK;
          gl_FragColor = vec4(c, 1.);
          #include <colorspace_fragment>
        }`,
    });
    fuzzMats.push(mat);
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 120, Math.PI, Math.PI * 2), mat); m.position.y = BY; m.renderOrder = 3; body.add(m);
  });

  /* ---------- yeux ---------- */
  const irisTex = canvasTex(512, 512, (x, S) => {
    const c = S / 2, r = rngF(77);
    const g = x.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, '#6E4A2C'); g.addColorStop(.32, '#5C3C24'); g.addColorStop(.5, '#3E281A'); g.addColorStop(.78, '#281A12'); g.addColorStop(.93, '#170F0B'); g.addColorStop(1, '#0E0907');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 1400; i++) { // fibres radiales
      const a = r() * Math.PI * 2, r0 = (.3 + r() * .2) * c, r1 = (.6 + r() * .38) * c, w = .6 + r() * 1.6;
      const light = r() < .62;
      x.strokeStyle = light ? `rgba(255,${190 + r() * 40 | 0},${120 + r() * 50 | 0},${.04 + r() * .09})` : `rgba(15,6,2,${.08 + r() * .14})`;
      x.lineWidth = w; x.beginPath(); x.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
      const a2 = a + (r() - .5) * .08; x.quadraticCurveTo(c + Math.cos(a + .03) * (r0 + r1) / 2, c + Math.sin(a + .03) * (r0 + r1) / 2, c + Math.cos(a2) * r1, c + Math.sin(a2) * r1); x.stroke();
    }
    x.lineWidth = 3; // collerette
    x.strokeStyle = 'rgba(214,160,96,.35)'; x.beginPath();
    for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2, rr = c * (.47 + .035 * Math.sin(a * 13) + .02 * Math.sin(a * 29)); i ? x.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr) : x.moveTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); }
    x.closePath(); x.stroke();
    for (let i = 0; i < 46; i++) { const a = r() * Math.PI * 2, rr = (.55 + r() * .3) * c; x.fillStyle = `rgba(20,8,4,${.18 + r() * .2})`; x.beginPath(); x.ellipse(c + Math.cos(a) * rr, c + Math.sin(a) * rr, 2 + r() * 5, 1 + r() * 2.5, a, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 24; i++) { const a = r() * Math.PI * 2, rr = (.35 + r() * .45) * c; x.fillStyle = `rgba(255,190,90,${.12 + r() * .15})`; x.beginPath(); x.arc(c + Math.cos(a) * rr, c + Math.sin(a) * rr, 1 + r() * 2.2, 0, Math.PI * 2); x.fill(); }
  });
  const EX = .088, EY = .108, EZ = .07, SINK = .034;
  const insideBody = P => P.x * P.x + P.z * P.z < Math.pow(rAtY(P.y - BY), 2);
  const eyes = [-1, 1].map(s => {
    const yG = .9, r = rAtY(yG), x = s * .2, z = Math.sqrt(r * r - x * x);
    const dr = (rAtY(yG + 1e-3) - rAtY(yG - 1e-3)) / 2e-3;
    const n = new THREE.Vector3(x, -r * dr, z).normalize();
    const fwd = n.clone().lerp(new THREE.Vector3(0, 0, 1), .45).normalize();
    const xa = new THREE.Vector3(0, 1, 0).cross(fwd).normalize(), ya = fwd.clone().cross(xa);
    const g = new THREE.Group(); g.position.set(x, yG + BY, z).addScaledVector(fwd, -SINK);
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xa, ya, fwd)); body.add(g);
    const sc = new THREE.Group(); sc.scale.set(EX, EY, EZ); g.add(sc);
    const U = { uCamU: { value: new THREE.Vector3(0, 0, 10) }, uGaze: { value: new THREE.Matrix3() }, uPupil: { value: .4 }, uIris: { value: irisTex },
      uLidT: { value: .9 }, uLidB: { value: -.9 }, uCut: { value: .5 }, uKeyU: { value: new THREE.Vector2(0, 1) } };
    const mat = patchMat(new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .34, clearcoat: 1, clearcoatRoughness: .03, specularIntensity: .25, envMapIntensity: 1.25 }), {
      key: 'pilou-oeil', uniforms: U,
      vDecl: 'varying vec3 vU;', vrep: [['#include <begin_vertex>', '#include <begin_vertex>\nvU = position;']],
      fDecl: `varying vec3 vU; uniform vec3 uCamU; uniform mat3 uGaze; uniform float uPupil, uLidT, uLidB, uCut; uniform sampler2D uIris; uniform vec2 uKeyU;
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
          vec3 loc = transpose(uGaze) * hit;
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
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat); sc.add(ball);
    // jonction œil / peau : calculée, puis un fin bourrelet humide qui accroche la lumière
    const pts = []; let cut = 0; const tmp = new THREE.Vector3();
    for (let i = 0; i < 64; i++) {
      const ph = i / 64 * Math.PI * 2; let a = 0, b = Math.PI / 2;
      for (let it = 0; it < 26; it++) { const m = (a + b) / 2; tmp.set(Math.sin(m) * Math.cos(ph) * EX, Math.sin(m) * Math.sin(ph) * EY, Math.cos(m) * EZ).applyQuaternion(g.quaternion).add(g.position); if (insideBody(tmp)) b = m; else a = m; }
      const th = (a + b) / 2; cut += Math.cos(th);
      pts.push(new THREE.Vector3(Math.sin(th) * Math.cos(ph) * 1.0, Math.sin(th) * Math.sin(ph) * 1.0, Math.cos(th) * 1.0));
    }
    U.uCut.value = cut / 64;
    const wetMat = new THREE.MeshPhysicalMaterial({ color: C('#4E8E78'), roughness: .25, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.2 });
    const rimPts = pts.map(p => new THREE.Vector3(p.x * EX, p.y * EY, p.z * EZ));
    const wet = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, true), 96, .0042, 6, true), wetMat); g.add(wet);
    // paupières : coques de peau qui glissent sur l'œil (rotation autour de l'axe horizontal de l'œil)
    const lidGeoT = new THREE.SphereGeometry(1.075, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const lidGeoB = new THREE.SphereGeometry(1.075, 48, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const rimMat = new THREE.MeshPhysicalMaterial({ color: C('#3F6E5E'), roughness: .45, sheen: .4, sheenColor: C('#FFE4C8') });
    const mkLid = geo => { const pv = new THREE.Group(); sc.add(pv); pv.add(new THREE.Mesh(geo, lidMat)); const ring = new THREE.Mesh(new THREE.TorusGeometry(1.075, .04, 10, 80), rimMat); ring.rotation.x = Math.PI / 2; pv.add(ring); return pv; };
    const lidT = mkLid(lidGeoT), lidB = mkLid(lidGeoB);
    // élévation maximale visible de l'œil (bord de la jonction en haut / en bas)
    const elTop = Math.atan2(pts[16].y, pts[16].z), elBot = Math.atan2(pts[48].y, pts[48].z);
    return { s, g, sc, U, lidT, lidB, elTop, elBot, mat };
  });

  /* ---------- bras ---------- */
  const arms = [-1, 1].map(s => {
    const anchor = new THREE.Group(); anchor.position.set(s * .58, .66, .06); body.add(anchor);
    const pv = new THREE.Group(); anchor.add(pv);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(.085, .2, 12, 28), armMat); m.position.y = -.17; m.castShadow = true; pv.add(m);
    return { anchor, pv };
  });

  /* ---------- montre (poignet du bras 0, celui qui salue) ---------- */
  const watch = new THREE.Group(); watch.position.set(0, -.245, 0); arms[0].pv.add(watch);
  {
    const band = []; const bw = .024, r0 = .0855, r1 = .099;
    for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2; band.push(new THREE.Vector2(lerp(r0, r1, .5 + .5 * Math.cos(a)) + .0, bw * Math.sin(a))); }
    const bandMat = new THREE.MeshPhysicalMaterial({ color: C('#5B5F9E'), roughness: .62, sheen: .5, sheenColor: C('#C8C4FF'), sheenRoughness: .5 });
    const bandMesh = new THREE.Mesh(new THREE.LatheGeometry(band, 64), bandMat); bandMesh.castShadow = true; watch.add(bandMesh);
    // petites coutures du bracelet
    const stitchMat = new THREE.MeshStandardMaterial({ color: C('#8E92D0'), roughness: .7 });
    for (const yy of [-.016, .016]) { const st = new THREE.Mesh(new THREE.TorusGeometry(.0995, .0016, 4, 64), stitchMat); st.rotation.x = Math.PI / 2; st.position.y = yy; watch.add(st); }
    const head = new THREE.Group(); head.position.z = .094; watch.add(head);
    const caseProf = [[0, -.012], [.05, -.012], [.056, -.006], [.057, .004], [.053, .012], [.047, .014], [0, .014]].map(([a, b]) => new THREE.Vector2(a, b));
    const caseMesh = new THREE.Mesh(new THREE.LatheGeometry(caseProf, 64), new THREE.MeshPhysicalMaterial({ color: C('#43477E'), metalness: .55, roughness: .3, clearcoat: .6, clearcoatRoughness: .15 }));
    caseMesh.rotation.x = Math.PI / 2; caseMesh.castShadow = true; head.add(caseMesh);
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(.0475, .0045, 10, 64), new THREE.MeshPhysicalMaterial({ color: C('#D9D3F2'), metalness: 1, roughness: .22 }));
    bezel.position.z = .0135; head.add(bezel);
    const dialTex = canvasTex(256, 256, (x, S) => {
      const c = S / 2; x.fillStyle = '#16203A'; x.fillRect(0, 0, S, S);
      const g = x.createRadialGradient(c, c * .8, 0, c, c, c); g.addColorStop(0, 'rgba(127,240,196,.16)'); g.addColorStop(1, 'rgba(127,240,196,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, big = i % 5 === 0; x.strokeStyle = big ? 'rgba(160,255,215,.95)' : 'rgba(127,240,196,.45)'; x.lineWidth = big ? 5 : 2;
        const ra = c * (big ? .74 : .8), rb = c * .88; x.beginPath(); x.moveTo(c + Math.sin(a) * ra, c - Math.cos(a) * ra); x.lineTo(c + Math.sin(a) * rb, c - Math.cos(a) * rb); x.stroke(); }
      x.fillStyle = 'rgba(255,184,77,.95)'; x.beginPath(); x.arc(c, c * .42, 6, 0, Math.PI * 2); x.fill(); // petit point ambre à midi
    });
    const dial = new THREE.Mesh(new THREE.CircleGeometry(.0445, 48), new THREE.MeshStandardMaterial({ color: C('#1A2440'), roughness: .5, emissive: C('#ffffff'), emissiveMap: dialTex, emissiveIntensity: 1.25 * K, map: dialTex }));
    dial.position.z = .0142; head.add(dial);
    const handMat = new THREE.MeshStandardMaterial({ color: C('#BFFFE6'), emissive: C('#9CFFD6'), emissiveIntensity: 1.5 * K, roughness: .4 });
    const mkHand = (len, w, zz, mat = handMat) => { const pv = new THREE.Group(); pv.position.z = zz; head.add(pv); const hm = new THREE.Mesh(new THREE.BoxGeometry(w, len, .0016), mat); hm.position.y = len / 2 - .004; pv.add(hm); return pv; };
    const hH = mkHand(.022, .0042, .0158), hM = mkHand(.032, .0032, .0172);
    const hS = mkHand(.036, .0012, .0184, new THREE.MeshStandardMaterial({ color: C('#FFC870'), emissive: C('#FFB84D'), emissiveIntensity: 1.4 * K }));
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.0032, .0032, .002, 16), new THREE.MeshStandardMaterial({ color: C('#E8E2FF'), metalness: 1, roughness: .2 }));
    cap.rotation.x = Math.PI / 2; cap.position.z = .0195; head.add(cap);
    // verre bombé : uniquement des reflets (couleur noire, mélange additif)
    const glass = new THREE.Mesh(new THREE.SphereGeometry(.12, 48, 12, 0, Math.PI * 2, 0, .4), new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: .03, metalness: 0, specularIntensity: 1, ior: 1.6, envMapIntensity: 2.4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glass.rotation.x = Math.PI / 2; glass.position.z = .0135 - .12 * Math.cos(.4); head.add(glass); glass.renderOrder = 4;
    updaters.push(τ => { // 10 h 09, la trotteuse avance vraiment
      const sec = 25 + τ / 1000, min = 9 + sec / 60, hr = 10 + min / 60;
      hS.rotation.z = -sec / 60 * Math.PI * 2; hM.rotation.z = -min / 60 * Math.PI * 2; hH.rotation.z = -hr / 12 * Math.PI * 2;
    });
  }

  /* ---------- pieds ---------- */
  const feet = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .25, .05, .14); root.add(g); const m = new THREE.Mesh(new THREE.SphereGeometry(.17, 48, 28), footMat); m.scale.set(1, .55, 1.3); m.castShadow = true; g.add(m); return g; });

  /* ---------- antenne + point ambre ---------- */
  const antAnchor = new THREE.Group(); antAnchor.position.set(0, H + BY, 0); body.add(antAnchor);
  const ANT = [[0, -.07], [0, .02], [.012, .14], [.09, .25], [.2, .29]].map(([x, y]) => new THREE.Vector3(x, y, 0));
  const antLen = (() => { let L = 0; const a = [0]; for (let i = 1; i < ANT.length; i++) { L += ANT[i].distanceTo(ANT[i - 1]); a.push(L); } return a.map(v => v / L); })();
  const antMesh = new THREE.Mesh(new THREE.BufferGeometry(), antMat); antMesh.castShadow = true; antAnchor.add(antMesh);
  const beadU = { uGlow: { value: .6 }, uGlowCol: { value: C('#FF9F2E') } };
  const beadMat = patchMat(new THREE.MeshPhysicalMaterial({ color: C(PAL.ambre), roughness: .32, clearcoat: .7, clearcoatRoughness: .12, sheen: .3, sheenColor: C('#FFE0B0') }), {
    key: 'pilou-perle', uniforms: beadU, sss: { wrap: [.6, .5, .4], col: '#FFB050', amt: 1.4, dist: .4, pow: 2 },
    fDecl: 'uniform float uGlow; uniform vec3 uGlowCol;',
    frep: [['#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { float ndv = saturate(dot(normal, normalize(vViewPosition))); totalEmissiveRadiance = uGlowCol * uGlow * (.18 + 1.25 * pow(ndv, 1.8)); }`]],
  });
  const bead = new THREE.Mesh(new THREE.SphereGeometry(.078, 48, 32), beadMat); bead.castShadow = true; antAnchor.add(bead);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialSprite([[0, 'rgba(255,214,140,1)'], [.3, 'rgba(255,180,80,.45)'], [1, 'rgba(255,160,60,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  antAnchor.add(halo);
  const beadLight = new THREE.PointLight(C('#FFB45C'), .1, 1.1, 2); antAnchor.add(beadLight);
  const rot = (v, ax, az) => { const c = Math.cos(az), s = Math.sin(az); const x = v.x * c - v.y * s, y = v.x * s + v.y * c, z = v.z; const c2 = Math.cos(ax), s2 = Math.sin(ax); return new THREE.Vector3(x, y * c2 - z * s2, y * s2 + z * c2); };
  function setAntenna(ax, az) {
    const pts = ANT.map((p, i) => rot(p, ax * antLen[i], az * antLen[i]));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const SEG = 44, RAD = 14, geo = new THREE.TubeGeometry(curve, SEG, 1, RAD);
    const pos = geo.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG; curve.getPointAt(u, c); const rr = .029 - .006 * u + .03 * Math.exp(-u * 16);
      for (let j = 0; j <= RAD; j++) { const k = i * (RAD + 1) + j; v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(rr).add(c); pos.setXYZ(k, v.x, v.y, v.z); }
    }
    antMesh.geometry.dispose(); antMesh.geometry = geo;
    const tip = rot(new THREE.Vector3(.222, .292, 0), ax, az);
    bead.position.copy(tip); halo.position.copy(tip); beadLight.position.copy(tip);
  }
  setAntenna(0, 0);

  /* ---------- ombre de contact (occlusion au sol) ---------- */
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.5), new THREE.MeshBasicMaterial({ map: radialSprite([[0, 'rgba(24,30,10,.62)'], [.45, 'rgba(24,30,10,.3)'], [1, 'rgba(24,30,10,0)']]), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.set(0, .006, .06); contact.renderOrder = 1; root.add(contact);

  /* ---------- pose ---------- */
  const tv = new THREE.Vector3(), tq = new THREE.Quaternion(), tm = new THREE.Matrix4(), te = new THREE.Euler();
  function apply(P, τ, cam, sun, key) {
    root.position.set(P.x, P.y0 || 0, P.z); root.rotation.y = P.yaw; root.scale.setScalar(P.scale || 1);
    const sy = 1 + P.sq, sx = 1 / Math.sqrt(Math.max(.3, sy));
    body.position.set(0, P.lift, 0); body.rotation.set(P.leanX, P.twist, -P.leanZ); body.scale.set(sx, sy, sx);
    for (const g of [antAnchor, arms[0].anchor, arms[1].anchor]) g.scale.set(1 / sx, 1 / sy, 1 / sx);
    arms[0].pv.rotation.set(P.aLx, 0, -(P.aL + (P.armLag || 0)));
    arms[1].pv.rotation.set(P.aRx, 0, P.aR + (P.armLag || 0));
    feet.forEach((f, i) => { const s = i ? 1 : -1; f.position.set(s * .25, .05 + P.lift * .92, .14); });
    setAntenna(P.antX, P.antZ);
    const glow = P.glow;
    beadU.uGlow.value = (.25 + .9 * glow) * K; halo.material.color.setScalar(K); halo.material.opacity = clamp(glow - .2) * .55; halo.scale.setScalar(.3 + .2 * glow);
    beadLight.intensity = (.035 + .07 * glow) * K;
    bodyU.uBlush.value = clamp(P.f.blush);
    drawMouth(P.f);
    root.updateMatrixWorld(true);
    // yeux : regard (libre ou vers la caméra), pupille, paupières
    for (const e of eyes) {
      const F = P.f;
      tv.copy(cam.position); e.sc.worldToLocal(tv); e.U.uCamU.value.copy(tv);
      const d = tv.clone().normalize();
      const camYaw = Math.atan2(d.x, d.z), camPitch = Math.asin(clamp(d.y, -1, 1));
      const w = P.camW ?? 0;
      const yaw = clamp(lerp(F.lookX * .42, camYaw, w), -.55, .55), pitch = clamp(lerp(F.lookY * .32, camPitch, w), -.45, .45);
      tm.makeRotationFromEuler(te.set(-pitch, yaw, 0, 'YXZ')); e.U.uGaze.value.setFromMatrix4(tm);
      e.U.uPupil.value = P.pupil ?? .4;
      // lumière principale projetée dans le repère de l'œil (pour la caustique de l'iris)
      tv.copy(key).normalize(); e.g.getWorldQuaternion(tq); tv.applyQuaternion(tq.invert());
      e.U.uKeyU.value.set(tv.x, tv.y).multiplyScalar(.8);
      // paupières : bord exprimé en hauteur projetée de l'œil (comme les paupières dessinées de la planche)
      const yTop = Math.sin(e.elTop), yBot = Math.sin(e.elBot);
      const lt = clamp(F.lidTop + Math.max(0, -F.lookY * (1 - w)) * .22 * (1 - F.lidTop));
      const lb = clamp(F.lidBot) * (1 - sstep(.55, .98, lt));
      const eT = Math.asin(clamp(lerp(yTop + .06, -1.02, lt), -1, 1));
      const eB = Math.asin(clamp(lerp(yBot - .06, yTop * .25, lb * .6), -1, 1));
      e.lidT.rotation.x = -eT; e.lidB.rotation.x = -eB;
      e.U.uLidT.value = eT; e.U.uLidB.value = eB;
    }
    // duvet : direction du soleil dans le repère de la caméra
    fuzzU.uSunV.value.copy(sun).transformDirection(cam.matrixWorldInverse);
    for (const u of updaters) u(τ);
  }
  function headTop() { return antAnchor.getWorldPosition(new THREE.Vector3()); }
  return { root, body, apply, bead, halo, eyes, watch, headTop, fuzzU, bodyMat };
}
