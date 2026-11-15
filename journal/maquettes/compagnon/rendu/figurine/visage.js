// visage.js — le visage de Pilou « figurine » : peint à la main, puis verni.
// Repris de compagnon-1-personnage/pilou.js (drawFace) ; deux toiles au lieu d'une :
//  - couleur (alpha prémultiplié au chargement) : yeux en émail noir + deux reflets peints, bouche, joues à l'aérographe ;
//  - matière : R = relief (l'œil est un petit cabochon bombé), G = brillance (émail), B = pigment mat (aérographe).
import { clamp, lerp, sstep, FS, FY, mouthPath, PAL } from './pilou.js';

export function drawFaceFig(cc, mc, S, F) {
  const k = S / (2 * FS);
  const X = x => (x / (2 * FS) + .5) * S, Y = y => (.5 - (y - FY) / (2 * FS)) * S;
  cc.setTransform(1, 0, 0, 1, 0, 0); mc.setTransform(1, 0, 0, 1, 0, 0);
  cc.clearRect(0, 0, S, S);
  mc.fillStyle = '#000'; mc.fillRect(0, 0, S, S);
  for (const c of [cc, mc]) { c.translate(F.fx * k, -F.fy * k); c.lineCap = 'round'; c.lineJoin = 'round'; }
  for (const s of [-1, 1]) cheek(cc, mc, X, Y, k, s, F);
  for (const s of [-1, 1]) eye(cc, mc, X, Y, k, s, F);
  mouth(cc, mc, X, Y, k, F);
}

// joues : deux voiles d'aérographe superposés, un peu décalés (le geste de la main n'est jamais parfait)
function cheek(cc, mc, X, Y, k, s, F) {
  const b = clamp(F.blush), a = .78 * Math.min(1, b * 3.2), r = (.056 + .056 * b) * k;
  if (a < .004) return;
  for (const [dx, dy, rr, aa] of [[0, 0, 1, 1], [s * .012, .006, .78, .55]]) {
    cc.save(); cc.translate(X(s * .345 + dx), Y(.785 + dy)); cc.scale(1, .62);
    const g = cc.createRadialGradient(0, 0, 0, 0, 0, r * rr);
    g.addColorStop(0, `rgba(255,128,124,${a * aa})`); g.addColorStop(.4, `rgba(255,134,128,${a * aa * .8})`);
    g.addColorStop(.75, `rgba(255,140,136,${a * aa * .3})`); g.addColorStop(1, 'rgba(255,140,140,0)');
    cc.fillStyle = g; cc.beginPath(); cc.arc(0, 0, r * rr, 0, Math.PI * 2); cc.fill(); cc.restore();
  }
  mc.save(); mc.translate(X(s * .345), Y(.785)); mc.scale(1, .62);
  const g = mc.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `rgba(0,0,255,${a})`); g.addColorStop(1, 'rgba(0,0,255,0)');
  mc.fillStyle = g; mc.beginPath(); mc.arc(0, 0, r, 0, Math.PI * 2); mc.fill(); mc.restore();
}

function eye(cc, mc, X, Y, k, s, F) {
  const L = s < 0;
  const rx = .078 * F.es * F.esx, ry = .098 * F.es * F.esy;
  const cx = s * .2 + F.lookX * .045, cy = .9 + F.lookY * .036;
  const lidTop = clamp(F.lidTop + (L ? F.lidTopL : F.lidTopR) + Math.max(0, -F.lookY) * .22 * (1 - F.lidTop));
  const lidBot = clamp(F.lidBot + (L ? F.lidBotL : F.lidBotR)) * (1 - sstep(.55, .98, lidTop));
  const ct = .026, N = 48, up = [], lo = [];
  for (let j = 0; j <= N; j++) {
    const u = -1 + 2 * j / N, x = cx + u * rx, e = Math.sqrt(Math.max(0, 1 - u * u)), se = Math.sqrt(e);
    const yT = cy + ry * e, yB = cy - ry * e;
    const lid = lerp(yT + .003, yB + ct * se, lidTop);
    const low = lerp(yB - .003, yT - ct * 1.15 * se, lidBot);
    let a = Math.min(yT, lid), b = Math.max(yB, low);
    if (a < b) { const m = (a + b) / 2; a = b = m; }
    up.push([X(x), Y(a)]); lo.push([X(x), Y(b)]);
  }
  const path = c => { c.beginPath(); up.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); for (let j = lo.length - 1; j >= 0; j--) c.lineTo(lo[j][0], lo[j][1]); c.closePath(); };
  // émail noir : très sombre, à peine chaud au centre (la profondeur de la couche de vernis)
  path(cc);
  const g = cc.createRadialGradient(X(cx + .1 * rx), Y(cy - .35 * ry), 0, X(cx), Y(cy), 1.2 * ry * k);
  g.addColorStop(0, '#3A2B26'); g.addColorStop(.6, '#211815'); g.addColorStop(1, '#120D0B');
  cc.fillStyle = g; cc.fill();
  // matière : cabochon bombé et brillant
  path(mc);
  const gm = mc.createRadialGradient(X(cx - .05 * rx), Y(cy + .1 * ry), 0, X(cx), Y(cy), 1.08 * ry * k);
  gm.addColorStop(0, 'rgb(255,255,0)'); gm.addColorStop(.7, 'rgb(190,255,0)'); gm.addColorStop(1, 'rgb(70,255,0)');
  mc.fillStyle = gm; mc.fill();
  // deux reflets peints (repris de la planche), un reflet chaud en bas
  cc.save(); path(cc); cc.clip();
  const sh = F.shine;
  cc.fillStyle = `rgba(255,206,170,${.16 * sh})`;
  cc.beginPath(); cc.ellipse(X(cx - .05 * rx), Y(cy - .64 * ry), .52 * rx * k, .18 * ry * k, 0, 0, Math.PI * 2); cc.fill();
  const hx = cx + .3 * rx - F.lookX * .012, hy = cy + .36 * ry - F.lookY * .01;
  cc.fillStyle = '#FFFDF8';
  cc.beginPath(); cc.ellipse(X(hx), Y(hy), .3 * rx * k * sh, .25 * ry * k * sh, -.35, 0, Math.PI * 2); cc.fill();
  cc.beginPath(); cc.arc(X(cx - .36 * rx - F.lookX * .008), Y(cy - .4 * ry), .12 * rx * k * sh, 0, Math.PI * 2); cc.fill();
  if (F.sparkle > .01) {
    const r = .6 * rx * k * F.sparkle, x0 = X(hx), y0 = Y(hy);
    cc.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * .22 : r; cc.lineTo(x0 + Math.cos(a) * rr, y0 + Math.sin(a) * rr); }
    cc.closePath(); cc.fill();
  }
  cc.restore();
  // trait de cils quand la paupière descend
  const la = sstep(.1, .3, lidTop) * (1 - sstep(.86, .99, lidTop));
  if (la > .01) {
    for (const [c, col] of [[cc, `rgba(30,22,19,${la})`], [mc, `rgba(0,200,0,${la})`]]) {
      c.strokeStyle = col; c.lineWidth = .013 * k; c.beginPath();
      let st = false; for (let j = 0; j <= N; j++) { const [x, y] = up[j]; const yT = Y(cy + ry * Math.sqrt(Math.max(0, 1 - (-1 + 2 * j / N) ** 2))); if (y > yT + .004 * k) { st ? c.lineTo(x, y) : c.moveTo(x, y); st = true; } }
      c.stroke();
    }
  }
}

function mouth(cc, mc, X, Y, k, F) {
  const m = mouthPath(cc, X, Y, F), mm = mouthPath(mc, X, Y, F);
  const gap = m.dL - m.dU;
  const lw = lerp(.03, .016, sstep(0, .03, gap)) * k;
  cc.strokeStyle = PAL.bouche; cc.lineWidth = lw;
  mc.strokeStyle = 'rgb(0,170,0)'; mc.fillStyle = 'rgb(0,150,0)'; mc.lineWidth = lw;
  if (gap > .002) {
    cc.beginPath(); m.upper(); m.lower(); cc.closePath(); cc.fillStyle = PAL.boucheInt; cc.fill();
    mc.beginPath(); mm.upper(); mm.lower(); mc.closePath(); mc.fill(); mc.stroke();
    if (F.tongue > .01) {
      cc.save(); cc.beginPath(); m.upper(); m.lower(); cc.closePath(); cc.clip();
      cc.fillStyle = `rgba(255,140,140,${clamp(F.tongue)})`;
      cc.beginPath(); cc.ellipse(X(m.mx + .1 * m.w), Y(m.yc - m.dL + .1 * gap), .62 * m.w * k, .55 * gap * k, 0, 0, Math.PI * 2); cc.fill();
      cc.restore();
    }
    cc.beginPath(); m.upper(); m.lower(); cc.closePath(); cc.stroke();
  } else { cc.beginPath(); m.upper(); cc.stroke(); mc.beginPath(); mm.upper(); mc.stroke(); }
  const d = sstep(.036, .05, m.dU) * (1 - sstep(0, .012, gap));
  if (d > .02) {
    cc.strokeStyle = PAL.bouche; cc.globalAlpha = d; cc.lineWidth = .013 * k;
    for (const [P, s] of [[m.L, -1], [m.R, 1]]) { cc.beginPath(); cc.moveTo(X(P[0] - s * .004), Y(P[1] + .016)); cc.quadraticCurveTo(X(P[0] + s * .012), Y(P[1] + .006), X(P[0] + s * .006), Y(P[1] - .008)); cc.stroke(); }
    cc.globalAlpha = 1;
  }
}
