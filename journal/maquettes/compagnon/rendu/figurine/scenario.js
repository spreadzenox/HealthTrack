// scenario.js — les 10 s du plan : Pilou respire, regarde la caméra, salue avec le bras de la montre,
// une goutte tombe dans la flaque, il la regarde, puis revient vers vous. Fonction pure du temps (ms).
import { clamp, lerp, seg, sstep } from './pilou.js';
import { EXPR, E, exprAt, applyIdle, blinkCurve, springs, hop } from './anim.js';

export const DURATION = 10000;
const SEED = 7;

// salut avec le bras 0, celui qui porte la montre (le salut de la planche utilise l'autre bras)
EXPR.salutMontre = {
  nom: 'Salut (montre)', p: { aL: 2.3, aR: .38, aLx: -.28, glow: .7, f: { lidTop: .03, lidBot: .3, mw: .086, mU: .044, mL: .078, tongue: .5, blush: .66 } },
  anim(P, u, w) { const ph = Math.max(0, u - 260); P.aL += w * .36 * Math.sin(ph / 150) * sstep(0, 300, ph); P.leanZ += w * .025 * Math.sin(ph / 150); P.lift += w * .045 * hop(seg(u, 40, 360)); P.sq += w * (-.04 * hop(seg(u, 0, 120)) + .03 * hop(seg(u, 120, 380))); },
};
const TRACK = [
  { t: 0, e: 'tranquille' },
  { t: 1900, e: 'content', d: 600 },
  { t: 3150, e: 'salutMontre', d: 340 },
  { t: 6300, e: 'content', d: 620 },
];

/* ---------- caméra : orbite lente de 30°, léger travelling avant ---------- */
export function camAt(ms) {
  const u = clamp(ms / DURATION), p = .45 * u + .55 * E.douce(u);
  const az = lerp(-.3, .22, p), el = lerp(.3, .22, p), d = lerp(12.6, 9.3, p), ty = lerp(.32, .8, p);
  const look = [lerp(.02, .06, p), ty, 0];
  return { pos: [look[0] + d * Math.cos(el) * Math.sin(az), ty + d * Math.sin(el), d * Math.cos(el) * Math.cos(az)], look, fov: 20, az, el, d };
}

/* ---------- la goutte ---------- */
const DROP = { grow0: 4600, release: 7050, g: 9.8 };
export function dropAt(ms, y0, yW) {
  const grow = clamp((ms - DROP.grow0) / (DROP.release - DROP.grow0));
  const fs = (ms - DROP.release) / 1000;
  const tFall = Math.sqrt(2 * (y0 - yW) / DROP.g);
  return { grow: grow * grow * (3 - 2 * grow), fall: fs, fallY: fs >= 0 ? y0 - .5 * DROP.g * fs * fs : y0, impact: DROP.release / 1000 + tFall };
}

/* ---------- regard : cibles en angles (lacet, tangage) depuis le visage de Pilou ---------- */
const EYE = [0, .98, .3];
function camDir(ms) {
  const c = camAt(ms); const dx = c.pos[0] - EYE[0], dy = c.pos[1] - EYE[1], dz = c.pos[2] - EYE[2];
  return [Math.atan2(dx, dz), Math.atan2(dy, Math.hypot(dx, dz))];
}
function pointDir(p) { const dx = p[0] - EYE[0], dy = p[1] - EYE[1], dz = p[2] - EYE[2]; return [Math.atan2(dx, dz), Math.atan2(dy, Math.hypot(dx, dz))]; }
let PUDDLE_PT = [.55, 0, .8];
export function setPuddlePoint(p) { PUDDLE_PT = p; }
const GAZE = [
  { t: -1e9, f: () => [-.32, -.22] },          // une fleur à gauche
  { t: 750, f: () => [.42, .12] },             // une poussière qui passe, à droite
  { t: 1750, f: camDir },                      // vous
  { t: 7330, f: () => pointDir(PUDDLE_PT) },   // la goutte qui tombe dans la flaque
  { t: 8650, f: camDir },                      // de nouveau vous
];
function gazeBlend(ms, dur, curve) {
  let i = 0; while (i + 1 < GAZE.length && GAZE[i + 1].t <= ms) i++;
  const b = GAZE[i], a = GAZE[Math.max(0, i - 1)], p = E[curve](seg(ms, b.t, b.t + dur));
  const A = a.f(ms), B = b.f(ms);
  return [lerp(A[0], B[0], p), lerp(A[1], B[1], p)];
}
function headTurn(P, ms) {
  const [hx, hy] = gazeBlend(ms - 250, 450, 'douce');
  const [bx, by] = gazeBlend(ms - 400, 600, 'douce');
  P.twist += clamp(.55 * hx, -.42, .42);
  P.leanX += clamp(-.1 * hy, -.06, .1) + clamp(-.05 * by, -.03, .06);
  P.leanZ += .03 * clamp(bx, -1, 1);
  return [hx, hy];
}

/* ---------- clignements choisis (un double) ---------- */
const BLINKS = [1180, 4420, 7600, 7860, 9520];
function blinkAt(ms) { let v = 0; for (const b of BLINKS) v = Math.max(v, blinkCurve(ms - b)); return v; }

function kin(ms) {
  const P = exprAt(TRACK, ms);
  applyIdle(P, ms, SEED, 1, true);
  headTurn(P, ms);
  return P;
}
export function poseAt(ms) {
  const P = exprAt(TRACK, ms);
  applyIdle(P, ms, SEED, 1, true);
  headTurn(P, ms);
  // yeux : saccade (90 ms) vers la cible, corrigée de ce que la tête a déjà tourné
  const [ex, ey] = gazeBlend(ms, 90, 'sortie');
  const yawDone = P.twist, pitchDone = -P.leanX * .8;
  P.f.lookX = clamp((ex - yawDone) / .5, -1, 1);
  P.f.lookY = clamp((ey - pitchDone) / .42, -1, 1);
  P.f.fx += .03 * P.f.lookX; P.f.fy += .02 * P.f.lookY;
  // clignement
  const bl = blinkAt(ms);
  P.f.lidTop = Math.max(P.f.lidTop, bl * (1 - sstep(.6, .9, P.f.lidBot)));
  // ressorts : antenne et traîne des bras
  springs(kin, ms, P);
  // le point ambre luit (2 400 ms)
  P.glow = P.glow + .22 * Math.sin(ms / 2400 * Math.PI * 2);
  return P;
}
