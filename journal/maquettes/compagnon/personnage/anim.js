// anim.js — comment Pilou bouge : expressions, boucle de repos, clignements, regard, réactions, ressorts.
// Toute pose est une fonction pure du temps τ (ms) et d'une graine : rejouable à l'image près.
import { clamp, lerp, seg, sstep, FACE0, H, BY } from './pilou.js';

/* ---------- courbes (identiques à celles de SPEC.md) ---------- */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s, dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let s = p; for (let i = 0; i < 8; i++) { const e = X(s) - p, d = dX(s); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; s -= e / d; }
    s = clamp(s); return Y(s);
  };
}
export const CURVES = {
  douce: [.45, 0, .55, 1],      // fondus d'expression, transitions d'humeur
  sortie: [.22, 1, .36, 1],     // apparitions, arrivées, saccades du regard
  entree: [.55, 0, .85, .4],    // anticipations, fermeture des paupières
  rebond: [.34, 1.56, .64, 1],  // petits « pop » (fleur, accessoire)
  elan: [.5, -.32, .36, 1.28],  // pirouette : contre-mouvement + dépassement dans une seule courbe
};
export const E = Object.fromEntries(Object.entries(CURVES).map(([k, v]) => [k, cubicBezier(...v)]));
export const SPRINGS = {
  vif: { k: 420, c: 16 },        // rebond après un toucher
  reception: { k: 300, c: 13 },  // retour après la réception d'un saut
  doux: { k: 170, c: 15 },       // retour après un câlin
  antenne: { k: 160, c: 4.5 },   // antenne (mouvement secondaire)
  bras: { k: 230, c: 11 },       // traîne des bras
};
// réponse indicielle d'un ressort (masse 1) : 0 → 1, t en ms
export function spring(sp, tms) {
  if (tms <= 0) return 0; const t = tms / 1000, w0 = Math.sqrt(sp.k), z = sp.c / (2 * w0);
  if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + z * w0 / wd * Math.sin(wd * t)); }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hop = p => (p <= 0 || p >= 1) ? 0 : 4 * p * (1 - p);
const TAU = Math.PI * 2;

/* ---------- pose de base ---------- */
export const BODY0 = {
  x: 0, z: 0, y0: 0, yaw: 0, scale: 1, lift: 0, sq: 0, leanX: 0, leanZ: 0, twist: 0,
  aL: .24, aR: .24, aLx: 0, aRx: 0, sit: 0, footTuck: 0, antX: 0, antZ: 0, glow: .45,
  book: 0, page: 0, scarf: 0, shadow: 1,
  breath: 1, breathT: 3600, sway: 1, idle: 1, bob: 0, gazeW: 1, headW: 1,
};
export function basePose() { return Object.assign({}, BODY0, { f: Object.assign({}, FACE0) }); }
export function mixPose(A, B, w) {
  if (w <= 0) return A; const o = {};
  for (const k in A) { if (k === 'f') continue; o[k] = typeof A[k] === 'number' ? lerp(A[k], B[k] ?? A[k], w) : (w < .5 ? A[k] : B[k]); }
  o.f = {}; for (const k in A.f) o.f[k] = lerp(A.f[k], B.f[k] ?? A.f[k], w);
  return o;
}
function over(P, o) { const f = o.f; for (const k in o) if (k !== 'f') P[k] = o[k]; if (f) Object.assign(P.f, f); return P; }
export function preset(name) { const P = basePose(); return over(P, EXPR[name].p); }

/* ---------- les expressions (valeurs + petite animation propre) ---------- */
export const EXPR = {
  tranquille: { nom: 'Tranquille', p: { aL: .22, aR: .22, glow: .4, f: { lidTop: .18, lidBot: .14, mw: .066, mU: .024, mL: .024, blush: .45 } } },
  content: { nom: 'Content', p: { aL: .42, aR: .42, glow: .62, bob: .5, f: { lidTop: .04, lidBot: .3, mw: .085, mU: .042, mL: .075, tongue: .5, blush: .7, sparkle: .15 } } },
  rayonnant: {
    nom: 'Rayonnant', p: { aL: 1.25, aR: 1.25, glow: 1.15, bob: 1, sq: .02, f: { lidTop: 0, lidBot: 1, mw: .1, mU: .046, mL: .15, tongue: .85, blush: 1, hatch: .8 } },
    anim(P, u, w) { P.aL += w * .28 * Math.sin(u / 125); P.aR += w * .28 * Math.sin(u / 125 + 1.9); P.lift += w * .035 * Math.abs(Math.sin(u / 190)); P.f.mL += w * .015 * Math.sin(u / 95); P.glow += w * .15 * Math.sin(u / 300); }
  },
  curieux: {
    nom: 'Curieux', p: { leanZ: -.16, leanX: .06, aL: .3, aR: .45, antZ: .22, antX: .25, glow: .55, f: { lidTop: 0, lidBot: .05, es: 1.1, lookX: .7, lookY: .25, brow: .9, browYR: .035, browYL: -.005, browA: .08, mw: .03, mU: -.022, mL: .034, mA: 0, blush: .32, sparkle: .25 } },
    anim(P, u, w) { const g = E.sortie(seg(u, 900, 1000)) - E.sortie(seg(u, 1900, 2000)); P.f.lookX += w * (-.9 * g); P.leanZ += w * .05 * Math.sin(u / 420); }
  },
  surpris: {
    nom: 'Surpris', p: { sq: .07, leanX: -.07, aL: .95, aR: .95, antZ: -.15, antX: -.12, glow: .7, f: { lidTop: 0, lidBot: 0, es: 1.24, brow: 1, browY: .035, mw: .044, mU: -.05, mL: .068, mA: 0, blush: .3, shine: .85 } },
    anim(P, u, w) { const a = seg(u, 0, 110), b = seg(u, 110, 260); P.sq += w * (-.1 * E.entree(a) * (1 - b) + .06 * hop(b)); }
  },
  concentre: {
    nom: 'Concentré', p: { aL: .5, aR: .5, aLx: -.55, aRx: -.55, glow: .55, breath: 1.7, breathT: 5200, sway: .4, gazeW: 0, headW: .3, f: { lidTop: 1, lidBot: .1, mw: .05, mU: .016, mL: .016, blush: .3 } },
    anim(P, u, w) { P.lift += w * (.07 + .018 * Math.sin(u / 830)); P.footTuck += w * .4; P.glow += w * .2 * Math.sin(u / 830); }
  },
  absorbe: {
    nom: 'Absorbé', p: { book: 1, aL: .42, aR: .42, aLx: -1.3, aRx: -1.3, leanX: .07, gazeW: 0, headW: .2, glow: .45, f: { lidTop: .26, lidBot: .1, lookY: -1, fy: -.06, mw: .045, mU: .012, mL: .012, blush: .35 } },
    anim(P, u, w) {
      const line = 1400, ph = (u % line) / line;
      const sx = ph < .86 ? lerp(-.45, .45, ph / .86) : lerp(.45, -.45, E.sortie((ph - .86) / .14));
      P.f.lookX += w * sx; P.f.lookY += w * -.06 * Math.floor((u % 4200) / line);
      const pt = (u - 2600) % 4200; P.page = w * E.douce(seg(pt, 0, 520));
      P.twist += w * .05 * sx;
    }
  },
  rassasie: {
    nom: 'Rassasié', p: { sq: -.03, leanX: -.08, aL: .1, aR: .1, aLx: -.62, aRx: -.62, glow: .6, breath: 1.4, f: { lidTop: .18, lidBot: .82, mw: .1, mU: .045, mL: .045, blush: .78 } },
    anim(P, u, w) { const a = u / 900 * TAU; P.aRx += w * .14 * Math.sin(a); P.aR += w * .1 * Math.cos(a); P.aLx += w * .14 * Math.sin(a + 2); P.aL += w * .1 * Math.cos(a + 2); P.sq += w * .008 * Math.sin(a); P.leanZ += w * .04 * Math.sin(u / 1800 * TAU); }
  },
  endormi: {
    nom: 'Endormi', p: { leanZ: .1, leanX: .07, aL: .1, aR: .1, antZ: -.55, antX: .1, glow: .15, breath: 2.2, breathT: 4200, sway: .3, gazeW: 0, headW: 0, f: { lidTop: 1, lidBot: .1, mw: .028, mU: -.012, mL: .022, mA: 0, blush: .42 } },
    anim(P, u, w) { const b = Math.sin(u / 4200 * TAU); P.f.mL += w * .006 * b; P.f.mw += w * .003 * b; }
  },
  reveil: {
    nom: 'Réveil', p: { aL: .25, aR: .25, glow: .5, f: { lidTop: .1, lidBot: .15, mw: .07, mU: .03, mL: .03, blush: .45 } },
    anim(P, u, w) {
      // 0–700 : paupières qui battent · 700–1700 : étirement + bâillement · 1700+ : sourire
      // battements : deux ouvertures brèves (yeux plissés de sommeil), jamais de paupière plate qui traîne
      const op = u < 700 ? Math.max(hop(seg(u, 60, 300)), hop(seg(u, 380, 640))) : 0;
      const fl = u < 700 ? 1 - .75 * op : 0;
      const st = Math.sin(clamp((u - 700) / 1000) * Math.PI);
      P.f.lidTop = lerp(P.f.lidTop, Math.max(fl, sstep(.1, .3, st)), w); P.f.lidBot += w * (.2 * op + .25 * sstep(.3, .6, st));
      const sl = 1 - sstep(600, 800, u); P.f.mw = lerp(P.f.mw, .034, w * sl); P.f.mU = lerp(P.f.mU, -.012, w * sl); P.f.mL = lerp(P.f.mL, .022, w * sl); P.f.mA = lerp(P.f.mA, 0, w * sl); P.leanZ += w * .08 * sl;
      P.aL += w * 2.3 * st; P.aR += w * 2.3 * st; P.sq += w * .1 * st; P.leanX += w * -.08 * st;
      P.f.mw += w * (-.02 * st); P.f.mU += w * (-.085 * st); P.f.mL += w * (.06 * st); P.f.mA += w * (-.12 * st);
      P.antZ += w * lerp(-.5, 0, E.douce(seg(u, 300, 1500)));
      P.glow += w * lerp(-.3, 0, E.douce(seg(u, 300, 1500)));
    }
  },
  fier: {
    nom: 'Fier', p: { leanX: -.12, sq: .045, aL: .62, aR: .62, aLx: .34, aRx: .34, glow: 1.0, f: { lidTop: 0, lidBot: .88, lookY: .2, mw: .094, mU: .05, mL: .05, mSkew: .7, mx: .01, blush: .8, hatch: .35 } },
    anim(P, u, w) { const a = seg(u, 0, 160), b = seg(u, 160, 700); P.sq += w * (-.06 * E.entree(a) * (1 - b) + .06 * (spring(SPRINGS.vif, u - 160) - 1) * (u > 160)); P.glow += w * .45 * hop(seg(u, 200, 900)); }
  },
  reconfortant: {
    nom: 'Réconfortant', p: { leanX: .08, leanZ: .1, aL: 1.05, aR: 1.05, aLx: -.75, aRx: -.75, glow: .7, gazeW: 0, f: { lidTop: .1, lidBot: .45, mw: .074, mU: .032, mL: .036, blush: .65 } },
    anim(P, u, w) { const c = E.douce(seg(u, 1300, 2300)) * (1 - E.douce(seg(u, 3300, 4200))); P.aL += w * -.6 * c; P.aR += w * -.6 * c; P.aLx += w * -.3 * c; P.aRx += w * -.3 * c; P.leanX += w * .05 * c; const cc = sstep(1350, 1600, u) * (1 - sstep(3400, 3650, u)); P.f.lidTop = lerp(P.f.lidTop, 1, w * cc); P.f.lidBot = lerp(P.f.lidBot, .2, w * cc); P.f.mU += w * .012 * c; P.f.blush += w * .25 * c; P.sq += w * -.02 * c; P.leanZ += w * .05 * Math.sin(u / 700) * c; }
  },
  salut: {
    nom: 'Salut', p: { aL: .35, aR: 2.45, glow: .65, f: { lidTop: .03, lidBot: .28, mw: .086, mU: .044, mL: .08, tongue: .5, blush: .6 } },
    anim(P, u, w) { P.aR += w * .38 * Math.sin(u / 150); P.leanZ += w * -.03 * Math.sin(u / 150); }
  },
};

/* ---------- piste d'expressions : [{ t, e, d (ms de fondu), c (courbe) }] ---------- */
export function exprAt(track, τ) {
  let i = -1; for (let j = 0; j < track.length; j++) if (track[j].t <= τ) i = j;
  if (i < 0) i = 0;
  const cur = track[i], prev = track[i - 1];
  const w = prev ? (E[cur.c || 'douce'])(seg(τ, cur.t, cur.t + (cur.d ?? 400))) : 1;
  let P = preset(cur.e);
  if (prev && w < 1) P = mixPose(preset(prev.e), P, w);
  const anims = [];
  if (EXPR[cur.e].anim) anims.push([EXPR[cur.e].anim, τ - cur.t, w]);
  if (prev && w < 1 && EXPR[prev.e].anim) anims.push([EXPR[prev.e].anim, τ - prev.t, 1 - w]);
  for (const [fn, u, ww] of anims) fn(P, u, ww);
  return P;
}

/* ---------- clignements (graine) ---------- */
const blinkCache = new Map();
export function blinkTimes(seed) {
  if (blinkCache.has(seed)) return blinkCache.get(seed);
  const r = rng(seed * 7919 + 13), out = []; let t = 600 + r() * 1800;
  while (t < 400000) { out.push(t); if (r() < 1 / 6) { t += 260; out.push(t); } t += 2500 + r() * 3500; }
  blinkCache.set(seed, out); return out;
}
export const BLINK = { ferme: 75, tenu: 35, ouvre: 130 };
export function blinkCurve(u) { // u : ms depuis le début du clignement → 0..1 (1 = fermé)
  if (u < 0 || u > BLINK.ferme + BLINK.tenu + BLINK.ouvre) return 0;
  if (u < BLINK.ferme) return E.entree(u / BLINK.ferme);
  if (u < BLINK.ferme + BLINK.tenu) return 1;
  return 1 - E.sortie((u - BLINK.ferme - BLINK.tenu) / BLINK.ouvre);
}
export function blinkAt(seed, τ, slow = 1) {
  const bt = blinkTimes(seed); let v = 0;
  for (let i = 0; i < bt.length; i++) { if (bt[i] > τ) break; if (τ - bt[i] < 400) v = Math.max(v, blinkCurve((τ - bt[i]) / slow)); }
  return v;
}

/* ---------- le regard qui se promène (graine) ---------- */
const gazeCache = new Map();
export function gazeEvents(seed) {
  if (gazeCache.has(seed)) return gazeCache.get(seed);
  const r = rng(seed * 104729 + 7), ev = [{ t: -1e9, x: 0, y: 0 }]; let t = 800 + r() * 900;
  while (t < 400000) { const back = r() < .38; ev.push({ t, x: back ? 0 : (r() * 1.5 - .75), y: back ? 0 : (r() * .7 - .3) }); t += 1500 + r() * 2500; }
  gazeCache.set(seed, ev); return ev;
}
export function gazeAt(seed, τ, dur = 90, curve = 'sortie') {
  const ev = gazeEvents(seed); let i = 0; while (i + 1 < ev.length && ev[i + 1].t <= τ) i++;
  const a = ev[Math.max(0, i - 1)], b = ev[i]; const p = E[curve](seg(τ, b.t, b.t + dur));
  return [lerp(a.x, b.x, p), lerp(a.y, b.y, p)];
}
// micro-actions (graine) : petit haussement, tête penchée, petit rebond
const microCache = new Map();
export function microEvents(seed) {
  if (microCache.has(seed)) return microCache.get(seed);
  const r = rng(seed * 31337 + 5), ev = []; let t = 3000 + r() * 3000;
  while (t < 400000) { ev.push({ t, k: ['hausse', 'penche', 'rebond'][Math.floor(r() * 3)], s: r() < .5 ? -1 : 1 }); t += 6000 + r() * 5000; }
  microCache.set(seed, ev); return ev;
}

/* ---------- boucle de repos : couches à périodes premières entre elles ---------- */
export const IDLE = { respiration: 3600, balancement: 5300, torsion: 9100, avant: 7700 };
export function breathWave(τ, T) { const φ = τ / T; return Math.sin(TAU * φ + .35 * Math.sin(TAU * φ)); } // inspiration un peu plus courte que l'expiration
export function applyIdle(P, τ, seed, amp = 1, kinOnly = false) {
  const a = amp * P.idle, ph = (seed % 97) * .37;
  const b = breathWave(τ + ph * 1000, P.breathT);
  P.sq += a * .013 * P.breath * b;
  P.aL += a * .035 * P.breath * b; P.aR += a * .035 * P.breath * b;
  P.leanZ += a * .024 * P.sway * Math.sin(TAU * τ / IDLE.balancement + 1.3 + ph);
  P.leanX += a * .012 * P.sway * Math.sin(TAU * τ / IDLE.avant + .4 + ph);
  P.twist += a * .065 * P.sway * Math.sin(TAU * τ / IDLE.torsion + 2.1 + ph);
  if (P.bob) P.lift += a * P.bob * .016 * Math.pow(Math.max(0, Math.sin(TAU * τ / 1150 + ph)), 2);
  // micro-actions
  for (const m of microEvents(seed)) {
    const u = τ - m.t; if (u < 0) break; if (u > 1400) continue;
    if (m.k === 'hausse') P.sq += a * .035 * hop(seg(u, 0, 380));
    if (m.k === 'penche') P.leanZ += a * m.s * .07 * Math.sin(Math.PI * E.douce(seg(u, 0, 1400)));
    if (m.k === 'rebond' && P.bob > .2) { P.lift += a * .06 * hop(seg(u, 120, 420)); P.sq += a * (-.04 * hop(seg(u, 0, 140)) - .04 * hop(seg(u, 420, 540))); }
  }
  if (kinOnly) return P;
  const [gx, gy] = gazeAt(seed, τ, 90, 'sortie');
  const [hx, hy] = gazeAt(seed, τ - 80, 450, 'douce');
  P.f.lookX += a * P.gazeW * gx; P.f.lookY += a * P.gazeW * gy;
  P.twist += a * P.headW * P.gazeW * .16 * hx; P.leanX += a * P.headW * P.gazeW * -.03 * hy;
  return P;
}
export function idleKin(P, τ, seed, amp = 1) { // partie « tête » du regard, utile aux ressorts
  const [hx] = gazeAt(seed, τ - 80, 450, 'douce'); P.twist += amp * P.idle * P.headW * P.gazeW * .16 * hx; return P;
}

/* ---------- réactions au toucher (u = ms depuis le geste) ---------- */
export const REACT = {
  toucher: { duree: 650, ecrase: 90 },
  appui: { seuil: 350, retour: 520 },
  saut: { anticipation: 130, envol: 440, reception: 90, amorti: 360 },
  glisser: { suivi: 600, pirouette: 760 },
  chatouille: { tremble: 8 },
};
export function tapReact(P, u, amt = 1, red = false) {
  if (u < 0 || u > 1100) return;
  const e = REACT.toucher.ecrase;
  const sq = u < e ? -.11 * E.sortie(u / e) : -.11 * (1 - spring(SPRINGS.vif, u - e));
  if (!red) { P.sq += amt * sq; P.leanX += amt * .5 * sq; }
  const hap = sstep(0, 60, u) * (1 - sstep(380, 600, u));
  P.f.lidBot = lerp(P.f.lidBot, 1, amt * hap); P.f.lidTop = lerp(P.f.lidTop, 0, amt * hap);
  P.f.mL += amt * .07 * hap; P.f.mU += amt * .015 * hap; P.f.tongue += amt * .6 * hap;
  P.f.blush += amt * .4 * (1 - sstep(200, 1100, u));
}
export function holdReact(P, u, dur, amt = 1, red = false) {
  if (u < 0) return; const { seuil, retour } = REACT.appui;
  if (u > dur + retour + 800) return;
  const inW = E.douce(seg(u, seuil, seuil + 420)), outW = E.douce(seg(u, dur, dur + retour)), w = amt * inW * (1 - outW);
  if (u < seuil + 200) tapReact(P, u, amt * .7, red);
  if (!red) {
    P.leanX += w * .13; P.leanZ += w * (.1 + .05 * Math.sin((u - seuil) / 260)); P.sq += w * -.035;
    P.aL += w * (-.05); P.aR += w * (-.05); P.aLx += w * -.95; P.aRx += w * -.95;
    P.lift += amt * .03 * hop(seg(u - dur, 0, 300));
  }
  P.f.lidTop = lerp(P.f.lidTop, .97, w); P.f.lidBot = lerp(P.f.lidBot, .25, w);
  P.f.mU += w * .02; P.f.mw += w * .01; P.f.blush = lerp(P.f.blush, 1, w); P.gazeW *= 1 - w;
  const after = amt * hop(seg(u - dur, 0, 700)); P.f.lidBot = lerp(P.f.lidBot, 1, after * .8);
}
export function jumpReact(P, u, amt = 1, red = false, h = .5) {
  const { anticipation: A, envol: F, reception: Rc } = REACT.saut;
  if (u < 0 || u > A + F + 1100) return;
  const happy = sstep(A, A + 60, u) * (1 - sstep(A + F + 250, A + F + 600, u));
  P.f.lidBot = lerp(P.f.lidBot, 1, amt * happy); P.f.lidTop = lerp(P.f.lidTop, 0, amt * happy);
  P.f.mL += amt * .09 * happy; P.f.tongue += amt * .7 * happy; P.f.blush += amt * .3 * happy;
  if (red) return;
  if (u < A) { const p = E.entree(u / A); P.sq += amt * -.17 * p; P.aL += amt * -.18 * p; P.aR += amt * -.18 * p; P.leanX += amt * .04 * p; return; }
  const v = u - A;
  if (v < F) {
    const p = v / F; P.lift += amt * h * hop(p);
    P.sq += amt * (.13 * (1 - E.sortie(clamp(p * 2.2))) + .05 * sstep(.75, 1, p) - .17 * (1 - sstep(0, .08, p)));
    const arms = Math.sin(Math.PI * clamp(p * 1.15)); P.aL += amt * 1.7 * arms; P.aR += amt * 1.7 * arms; P.footTuck += amt * hop(p);
    return;
  }
  const w = v - F; // réception
  P.sq += amt * (w < Rc ? -.15 * E.sortie(w / Rc) : -.15 * (1 - spring(SPRINGS.reception, w - Rc)));
  P.leanX += amt * .03 * (1 - sstep(0, 300, w));
}
export function swipeReact(P, u, amt = 1, red = false) {
  const { suivi, pirouette } = REACT.glisser;
  if (u < 0 || red) return;
  const v = u - suivi;
  if (v > pirouette + 900) { P.yaw += amt * TAU; return; }
  if (v > 0) {
    const p = clamp(v / pirouette); P.yaw += amt * TAU * E.elan(p);
    P.lift += amt * .14 * hop(seg(v, 60, pirouette - 80)); P.sq += amt * (.05 * hop(seg(v, 60, pirouette - 80)) - .08 * hop(seg(v, pirouette - 80, pirouette + 140)));
    const s = Math.sin(Math.PI * p); P.aL += amt * 1.1 * s; P.aR += amt * 1.1 * s;
    const hap = sstep(0, 100, v) * (1 - sstep(pirouette + 200, pirouette + 600, v)); P.f.lidBot = lerp(P.f.lidBot, 1, amt * hap); P.f.mL += amt * .08 * hap; P.f.tongue += amt * .6 * hap;
  }
}
export function tickleReact(P, u, dur, amt = 1, red = false) {
  if (u < 0 || u > dur + 1600) return;
  const on = sstep(80, 260, u) * (u < dur ? 1 : Math.exp(-(u - dur) / 420));
  const giggle = amt * on, t = u;
  P.f.lidBot = lerp(P.f.lidBot, 1, amt * Math.min(1, on * 1.4)); P.f.lidTop = lerp(P.f.lidTop, 0, amt * Math.min(1, on * 1.4));
  P.f.mL += giggle * (.11 + .04 * Math.sin(t / 22)); P.f.mU += giggle * .02; P.f.mw += giggle * .02; P.f.tongue += giggle * .9;
  P.f.blush += amt * on * .7; P.f.hatch += amt * on;
  P.gazeW *= 1 - amt * on;
  if (red) return;
  P.leanZ += giggle * .06 * Math.sin(t / 19); P.sq += giggle * (.03 * Math.sin(t / 23) - .03); P.twist += giggle * .14 * Math.sin(t / 53);
  P.aL += giggle * (.75 + .38 * Math.sin(t / 27)); P.aR += giggle * (.75 + .38 * Math.sin(t / 27 + 2));
  P.aLx += giggle * -.25; P.aRx += giggle * -.25;
}

/* ---------- ressorts : antenne et traîne des bras, simulés sur 1,5 s d'histoire ---------- */
// kin(τ) doit renvoyer la pose cinématique (sans visage). Le résultat ajoute antX/antZ/armLag à P.
export const ANT_GAIN = { lat: .7, vert: .62, avant: .7, rot: .3, lacet: .26 };
export function springs(kin, τ, P, τ0 = -1e9) {
  const dt = 1000 / 120, N = 180, sA = SPRINGS.antenne, sB = SPRINGS.bras;
  let tz = 0, vz = 0, tx = 0, vx = 0, al = 0, va = 0;
  const top = q => {
    const h = (H + BY) * (1 + q.sq) * (q.scale || 1), lx = q.leanX - .2 * (q.sit || 0), lz = q.leanZ;
    let x = h * Math.cos(lx) * Math.sin(lz), y = h * Math.cos(lx) * Math.cos(lz) + q.lift * (q.scale || 1), z = h * Math.sin(lx);
    const c = Math.cos(q.yaw), s = Math.sin(q.yaw);
    return [q.x + x * c + z * s, y, q.z - x * s + z * c, q.yaw + q.twist, lz, lx];
  };
  const S = []; for (let i = N + 2; i >= 0; i--) { const t = Math.max(τ0, τ - i * dt); S.push(top(kin(t))); }
  const dts = dt / 1000;
  for (let i = 2; i < S.length; i++) {
    const a = S[i], b = S[i - 1], c = S[i - 2];
    const acc = [0, 1, 2].map(j => (a[j] - 2 * b[j] + c[j]) / (dts * dts));
    const ang = [3, 4, 5].map(j => (a[j] - 2 * b[j] + c[j]) / (dts * dts));
    const yawT = a[3], cy = Math.cos(yawT), sy = Math.sin(yawT);
    const lxA = acc[0] * cy - acc[2] * sy, lzA = acc[0] * sy + acc[2] * cy, lyA = acc[1];
    const fz = -sA.k * tz - sA.c * vz + ANT_GAIN.lat * lxA - ANT_GAIN.vert * lyA + ANT_GAIN.rot * ang[1];
    const fx = -sA.k * tx - sA.c * vx - ANT_GAIN.avant * lzA - ANT_GAIN.rot * ang[2] + ANT_GAIN.lacet * ang[0];
    vz += fz * dts; tz += vz * dts; vx += fx * dts; tx += vx * dts;
    const fa = -sB.k * al - sB.c * va - .9 * lyA;
    va += fa * dts; al += va * dts;
  }
  const lim = (v, m) => m * Math.tanh(v / m);
  P.antZ += lim(tz, .75); P.antX += lim(tx, .6); P.armLag = lim(al, .6);
  return P;
}

/* ---------- mouvements réduits : on garde les visages, on retire les déplacements ---------- */
export function reduce(P) {
  P.lift = 0; P.sq = 0; P.leanX = 0; P.leanZ = 0; P.twist = 0; P.antX = 0; P.antZ = 0; P.armLag = 0; P.footTuck = 0;
  return P;
}
export { hop };
