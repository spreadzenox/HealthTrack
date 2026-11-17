/**
 * Le visage peint de Pilou (planche du chapitre 1, repris du kit `double/pilou.js`) : joues, yeux, bouche, avec les
 * crochets du peintre de traits (`peintre.js`). Sert à l'aperçu 2D du Studio et à la toile du visage de la figurine.
 * `drawFace(ctx, S, F, T)` dessine sur une toile carrée S × S dans le repère du visage ; `drawFaceAt` dessine le même
 * visage dans un repère donné (X, Y, k), pour l'aperçu 2D.
 */
import { clamp, lerp, sstep, PAL, FS, FY } from './profil'

export function drawFace(ctx, S, F, T) {
  const k = S / (2 * FS)
  const X = (x) => (x / (2 * FS) + 0.5) * S, Y = (y) => (0.5 - (y - FY) / (2 * FS)) * S
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, S, S)
  ctx.translate(F.fx * k, -F.fy * k)
  drawFaceAt(ctx, X, Y, k, F, T)
}

export function drawFaceAt(ctx, X, Y, k, F, T) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  if (T) T.peindre(ctx, X, Y, k, F, 'sous') // barbe peinte (sous les joues : Pilou garde ses joues)
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
  if (T) T.peindre(ctx, X, Y, k, F, 'peau');  // taches de rousseur, grain de beauté
  // yeux
  for (const s of [-1, 1]) drawEye(ctx, X, Y, k, s, F, T && T.iris());
  // sourcils : ceux de la personne (traits.js) s'ils existent, sinon les sourcils discrets des expressions
  if (T && T.aSourcils()) T.peindre(ctx, X, Y, k, F, 'sourcils');
  else if (F.brow > .01) for (const s of [-1, 1]) {
    const by = .9 + .098 * F.es * F.esy + .055 + F.browY + (s < 0 ? F.browYL : F.browYR) + F.lookY * .01;
    ctx.save(); ctx.translate(X(s * .205 + F.lookX * .015), Y(by)); ctx.rotate(-F.browA * s);
    ctx.strokeStyle = `rgba(74,51,43,${clamp(F.brow)})`; ctx.lineWidth = .02 * k;
    ctx.beginPath(); ctx.moveTo(-.042 * k, .006 * k); ctx.quadraticCurveTo(0, -.012 * k, .042 * k, .006 * k); ctx.stroke(); ctx.restore();
  }
  drawMouth(ctx, X, Y, k, F);
  if (T) T.peindre(ctx, X, Y, k, F, 'dessus');  // moustache, piercing
}

function drawEye(ctx, X, Y, k, s, F, iris) {
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
  // iris (traits.js) : anneau coloré autour d'une grande pupille ; il s'étend depuis la pupille quand il apparaît
  if (iris && iris.a > .004) {
    const ro = lerp(.6, .93, iris.a), ri = .56;
    const gi = ctx.createLinearGradient(0, Y(cy + ry), 0, Y(cy - ry));
    gi.addColorStop(0, iris.fonce); gi.addColorStop(.42, iris.fonce); gi.addColorStop(1, iris.clair);
    ctx.globalAlpha = Math.min(1, iris.a * 1.6);
    ctx.beginPath(); ctx.ellipse(X(cx), Y(cy), ro * rx * k, ro * ry * k, 0, 0, Math.PI * 2);
    ctx.ellipse(X(cx), Y(cy), ri * rx * k, ri * ry * k, 0, 0, Math.PI * 2, true); ctx.fillStyle = gi; ctx.fill('evenodd');
    ctx.strokeStyle = iris.anneau; ctx.lineWidth = .009 * k; ctx.beginPath(); ctx.ellipse(X(cx), Y(cy), ro * rx * k, ro * ry * k, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const sh = F.shine;
  ctx.fillStyle = iris && iris.a > .004 ? iris.reflet : `rgba(255,214,180,${.22 * sh})`;
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

function mouthPath(ctx, X, Y, F) {
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
