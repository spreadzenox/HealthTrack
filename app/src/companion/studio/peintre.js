/**
 * Peinture du visage de Pilou selon la fiche (sourcils, iris, forme des yeux, taches de rousseur, grain de beauté,
 * barbes courtes, moustache, piercing). Repris du kit (`double/traits.js` § 6) : de simples paramètres de dessin sur
 * une toile 2D, appelés par le visage (phases `sous`, `peau`, `sourcils`, `dessus`, et `iris()` dans l'œil). Le repère
 * est celui du visage de face (x ∈ [−0,52 ; 0,52], y ∈ [0,32 ; 1,36]) : tout visage projeté de face peut l'appeler,
 * celui de la figurine comme l'aperçu 2D du Studio.
 */
import { clamp, lerp } from './profil'
import { rng, PAL_YEUX, PAL_DIVERS, couleursCheveux, couleursBarbe } from './traits'

const FRK = (() => { // positions graine des taches de rousseur (unités du visage), triées du centre des joues vers l'extérieur
  const r = rng(4242), pts = [];
  for (let i = 0; i < 64; i++) {
    const s = i % 2 ? 1 : -1, a = r() * Math.PI * 2, d = Math.sqrt(r());
    const x = s * (.3 + Math.cos(a) * .135 * d), y = .8 + Math.sin(a) * .06 * d;
    const ex = (x - s * .2) / .095, ey = (y - .9) / .118; if (ex * ex + ey * ey < 1) continue; // pas sur les yeux
    pts.push({ x, y, rr: .0062 + r() * .0042, a: .55 + r() * .35, d, nez: false });
  }
  for (let i = 0; i < 14; i++) { const x = (r() * 2 - 1) * .11, y = .805 + r() * .035; pts.push({ x, y, rr: .005 + r() * .003, a: .5 + r() * .3, d: .5 + Math.abs(x) * 2, nez: true }); }
  return pts.sort((p, q) => p.d - q.d);
})();
const MOLE = { joue_gauche: [-.33, .72], joue_droite: [.33, .72], menton: [.07, .64], levre: [.105, .775] };

export function creerPeintre() {
  let f = null, rv = {};
  const P = {
    fiche: () => f,
    set(fiche, revelation) { f = fiche; rv = revelation || {}; },
    aSourcils: () => !!f && (rv.sourcils ?? 1) > .01,
    iris() {
      if (!f) return null; const a = clamp(rv.yeux ?? 1); if (a <= 0) return null;
      const [fonce, clair, anneau, reflet] = PAL_YEUX[f.yeux.couleur];
      return { a, fonce, clair, anneau, reflet };
    },
    // forme des yeux : appliquée aux paramètres du visage avant le dessin
    formeYeux(F) {
      if (!f) return; const a = clamp(rv.yeux ?? 1);
      const fo = f.yeux.forme, sx = fo === 'amande' ? 1.07 : fo === 'allonges' ? 1.14 : 1, sy = fo === 'amande' ? .9 : fo === 'allonges' ? .82 : 1;
      F.esx *= lerp(1, sx, a); F.esy *= lerp(1, sy, a);
      if (fo !== 'ronds') F.lidTop = Math.max(F.lidTop, lerp(F.lidTop, F.lidTop + .06, a));
    },
    peindre(ctx, X, Y, k, F, phase) {
      if (!f) return;
      if (phase === 'sous') peindreBarbe(ctx, X, Y, k, F, f, clamp(rv.barbe ?? 1), 'sous');
      else if (phase === 'peau') peindrePeau(ctx, X, Y, k, F, f, rv.taches ?? 1, rv.grain ?? 1);
      else if (phase === 'sourcils') peindreSourcils(ctx, X, Y, k, F, f, clamp(rv.sourcils ?? 1));
      else if (phase === 'dessus') { peindreBarbe(ctx, X, Y, k, F, f, clamp(rv.barbe ?? 1), 'dessus'); peindrePiercing(ctx, X, Y, k, f, clamp(rv.boucles ?? 1)); }
    },
  };
  return P;
}
const pop = p => p <= 0 ? 0 : p >= 1 ? 1 : 1 + 2.56 * Math.pow(p - 1, 3) + 1.56 * Math.pow(p - 1, 2); // « rebond » approché


function peindreSourcils(ctx, X, Y, k, F, f, a) {
  const col = couleursCheveux(f).sourcil;
  const T = { fins: .012, moyens: .018, epais: .026 }[f.sourcils.epaisseur];
  const fo = f.sourcils.forme;
  // profil vertical le long du sourcil (u = 0 côté nez → 1 côté tempe). Jamais l'intérieur plus haut que l'extérieur
  // relevé en pente (lecture « triste ») : l'extrémité intérieure reste la plus basse ou à égalité.
  const prof = u => fo === 'arques' ? .019 * Math.sin(Math.PI * Math.min(1, u * 1.08)) - .002 * u
    : fo === 'anguleux' ? (u < .64 ? .022 * u / .64 : .022 - .03 * (u - .64) / .36) : .005 * Math.sin(Math.PI * u) - .002 * u;
  const N = 18, L = .145;
  ctx.fillStyle = col;
  for (const s of [-1, 1]) {
    const ey = .9 + F.lookY * .036 + .098 * F.es * F.esy;
    const by = ey + .05 + (f.lunettes.type !== 'aucune' ? .026 : 0) + F.browY + (s < 0 ? F.browYL : F.browYR) + .004 * F.lookY;
    const bx = s * .207 + F.lookX * .015;
    ctx.save(); ctx.translate(X(bx), Y(by)); ctx.rotate(-F.browA * s);
    const up = [], lo = [];
    const n = Math.max(2, Math.round(N * a));
    for (let j = 0; j <= n; j++) {
      const u = (j / N), x = s * (-L / 2 + u * L), y = prof(u), w = T * (1.08 - .55 * u) * (u < .08 ? .75 + 3 * u : 1);
      up.push([x * k, -(y + w / 2) * k]); lo.push([x * k, -(y - w / 2) * k]);
    }
    ctx.beginPath(); up.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    for (let j = lo.length - 1; j >= 0; j--) ctx.lineTo(lo[j][0], lo[j][1]);
    ctx.closePath(); ctx.fill();
    // bout arrondi côté nez
    ctx.beginPath(); ctx.arc(up[0][0], (up[0][1] + lo[0][1]) / 2, Math.abs(up[0][1] - lo[0][1]) / 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function peindrePeau(ctx, X, Y, k, F, f, aT, aG) {
  const t = f.peau.taches_de_rousseur;
  if (t !== 'aucune' && aT > 0) {
    let i = 0; const n = t === 'legeres' ? 28 : 999;
    for (const p of FRK) {
      if (t === 'legeres' && p.nez) continue; if (i++ >= n) break;
      const q = clamp((aT - p.d * .5) / .5), sc = pop(q); if (sc <= .01) continue;
      ctx.fillStyle = PAL_DIVERS.taches + (p.a * (t === 'legeres' ? .8 : 1) * Math.min(1, q * 3)) + ')';
      ctx.beginPath(); ctx.ellipse(X(p.x), Y(p.y), p.rr * k * sc, p.rr * k * .86 * sc, .4, 0, Math.PI * 2); ctx.fill();
    }
  }
  const g = f.peau.grain_de_beaute;
  if (g !== 'aucun' && aG > 0) {
    const [x, y] = MOLE[g], sc = pop(clamp(aG));
    ctx.fillStyle = PAL_DIVERS.grain; ctx.beginPath(); ctx.arc(X(x), Y(y), .0105 * k * sc, 0, Math.PI * 2); ctx.fill();
  }
}

// régions de barbe (unités du visage) : contour extérieur commun, bord supérieur sous les joues (les joues restent)
function cheminBarbe(ctx, X, Y, type, my) {
  ctx.beginPath();
  if (type === 'bouc') { ctx.ellipse(X(0), Y(.654 + my * .6), .062 * (X(1) - X(0)), .04 * (X(1) - X(0)), 0, 0, Math.PI * 2); return; }
  ctx.moveTo(X(-.455), Y(.9));
  ctx.bezierCurveTo(X(-.47), Y(.72), X(-.31), Y(.605), X(0), Y(.592));
  ctx.bezierCurveTo(X(.31), Y(.605), X(.47), Y(.72), X(.455), Y(.9));
  if (type === 'collier') {
    ctx.lineTo(X(.425), Y(.9)); ctx.bezierCurveTo(X(.437), Y(.74), X(.29), Y(.628), X(0), Y(.622));
    ctx.bezierCurveTo(X(-.29), Y(.628), X(-.437), Y(.74), X(-.425), Y(.9));
  } else {
    ctx.lineTo(X(.405), Y(.9)); ctx.bezierCurveTo(X(.4), Y(.79), X(.35), Y(.712), X(.25), Y(.703));
    ctx.bezierCurveTo(X(.15), Y(.696), X(.1), Y(.752 + my), X(0), Y(.768 + my));
    ctx.bezierCurveTo(X(-.1), Y(.752 + my), X(-.15), Y(.696), X(-.25), Y(.703));
    ctx.bezierCurveTo(X(-.35), Y(.712), X(-.4), Y(.79), X(-.405), Y(.9));
  }
  ctx.closePath();
}
const STUB = (() => { const r = rng(777), a = []; for (let i = 0; i < 520; i++) a.push([(r() * 2 - 1) * .48, .57 + r() * .37, r()]); return a; })();
const POILS = (() => { const r = rng(91), a = []; for (let i = 0; i < 260; i++) a.push([(r() * 2 - 1) * .48, .57 + r() * .37, r() * 2 - 1, r()]); return a; })();
function peindreBarbe(ctx, X, Y, k, F, f, a, phase) {
  const ty = f.barbe.type; if (ty === 'aucune' || a <= 0) return;
  const c = couleursBarbe(f), my = F.my || 0;
  if (phase === 'sous') {
    if (ty === 'moustache') return;
    const region = ty === 'longue' ? 'courte' : ty === 'ombre' ? 'courte' : ty;
    ctx.save(); cheminBarbe(ctx, X, Y, region, my); ctx.clip();
    if (ty === 'ombre') {
      ctx.globalAlpha = .2 * a; ctx.fillStyle = c.ombre; ctx.fillRect(0, 0, X(1) * 2, X(1) * 2);
      ctx.globalAlpha = .55 * a; ctx.fillStyle = c.ombre;
      for (const [x, y, q] of STUB) if (q < a) { ctx.beginPath(); ctx.arc(X(x), Y(y), .0032 * k, 0, Math.PI * 2); ctx.fill(); }
    } else {
      ctx.globalAlpha = Math.min(1, a * 1.4); ctx.fillStyle = c.base; ctx.fillRect(0, 0, X(1) * 2, X(1) * 2);
      // petites mèches : ombre et reflet (texture lisible en gros plan, fondue en petit)
      ctx.lineWidth = .0075 * k; ctx.lineCap = 'round';
      for (const [x, y, d, q] of POILS) { if (q > a) continue; ctx.strokeStyle = q < .5 ? c.ombre : c.reflet; ctx.globalAlpha = .55 * a;
        ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x + d * .012), Y(y - .026)); ctx.stroke(); }
    }
    ctx.restore(); ctx.globalAlpha = 1;
    // contour doux du bord (même brun que le contour de Pilou, très léger) : seulement barbes pleines
    if (ty !== 'ombre') { ctx.save(); ctx.globalAlpha = .28 * a; ctx.strokeStyle = c.ombre; ctx.lineWidth = .008 * k; cheminBarbe(ctx, X, Y, region, my); ctx.stroke(); ctx.restore(); }
  } else if (['moustache', 'bouc', 'courte', 'longue'].includes(ty)) {
    // moustache, posée au-dessus de la bouche (elle suit le centre de la bouche)
    const mx = F.mx || 0, yc = .745 + my, sc = ty === 'bouc' ? .74 : 1;
    ctx.save(); ctx.globalAlpha = Math.min(1, a * 1.4);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(X(mx), Y(yc + .056 * sc));
      ctx.bezierCurveTo(X(mx + s * .05 * sc), Y(yc + .066 * sc), X(mx + s * .11 * sc), Y(yc + .05 * sc), X(mx + s * .13 * sc), Y(yc + .006));
      ctx.bezierCurveTo(X(mx + s * .1 * sc), Y(yc + .02), X(mx + s * .05 * sc), Y(yc + .027), X(mx), Y(yc + .032));
      ctx.closePath(); ctx.fillStyle = c.base; ctx.fill();
      ctx.strokeStyle = c.ombre; ctx.lineWidth = .007 * k; ctx.globalAlpha = .45 * a; ctx.stroke(); ctx.globalAlpha = Math.min(1, a * 1.4);
      ctx.strokeStyle = c.reflet; ctx.lineWidth = .006 * k; ctx.beginPath(); ctx.moveTo(X(mx + s * .03), Y(yc + .05 * sc)); ctx.quadraticCurveTo(X(mx + s * .07), Y(yc + .052 * sc), X(mx + s * .1 * sc), Y(yc + .03)); ctx.stroke();
    }
    ctx.restore();
  }
}
function peindrePiercing(ctx, X, Y, k, f, a) {
  if (!f.oreilles.piercing_nez || a <= 0) return;
  const sc = pop(clamp(a)), x = X(.05), y = Y(.818);
  ctx.fillStyle = PAL_DIVERS.bijou; ctx.beginPath(); ctx.arc(x, y, .0092 * k * sc, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PAL_DIVERS.bijouReflet; ctx.beginPath(); ctx.arc(x - .003 * k, y - .003 * k, .0035 * k * sc, 0, Math.PI * 2); ctx.fill();
}

/* =====================================================================================================================
   7. PIÈCES 3D
   Repère « tour » : celui du profil de révolution du corps (y = 0 en bas du galet, y = 1,38 au sommet, z vers l'avant).
   ===================================================================================================================== */
