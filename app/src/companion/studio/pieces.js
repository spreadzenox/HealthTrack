/**
 * Les pièces 3D du double numérique (cheveux, montures, barbe longue, boucles d'oreilles, couvre-chefs), reprises du
 * kit (`double/traits.js` § 7, specs/double.SPEC.md § 4) et rebranchées par un « kit » : `creerPieces({ THREE, toon,
 * ol, body })`. `THREE` est le module three.js passé par la scène (contrat du compagnon § 3) ; `toon(hex, opts)` rend
 * la matière du rendu qui les porte (par défaut un vinyle satiné, comme les cheveux amovibles d'une figurine) ; `ol`
 * pose un contour (rien sur la figurine) ; `body` est le groupe du corps de Pilou (pieds à y = 0, H = 1,38).
 * Au plus une pièce par famille, ≤ 2 000 triangles chacune, construites seulement quand la fiche change.
 *
 * API : `set(fiche)`, `update(P, view)` (P.f = paramètres du visage : fx, fy ; P.chX, P.chZ, P.pend : ressorts),
 * `revelation` (apparitions), `peintre` (à appeler dans la toile du visage), `stats()`, `dispose()`.
 */
import { clamp, lerp, sstep, bodyR, rAtY, H, BY, MONTURES } from './profil'
import { rng, normaliser, couleursCheveux, couleursBarbe, mixHex, PAL_MONTURE, PAL_COUVRE, PAL_DIVERS } from './traits'
import { creerPeintre } from './peintre'

const pop = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 + 2.56 * Math.pow(p - 1, 3) + 1.56 * Math.pow(p - 1, 2))

/** Matière par défaut : vinyle satiné (rugosité ≈ 0,45, pas de métal). */
export function vinyleSatine(THREE) {
  return (hex, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex), roughness: 0.45, metalness: 0 }, o))
}

export function creerPieces(kitBrut) {
  const THREE = kitBrut.THREE
  const kit = { toon: vinyleSatine(THREE), ol: () => {}, ...kitBrut }
  const CR = (() => {
    const tTop = Math.PI - .095, tW = 1.4543, N = 360, pts = [];
    let L = 0, pr = null, py = null;
    for (let i = 0; i <= N; i++) {
      const t = lerp(tTop, tW, i / N), r = bodyR(t), y = (1 - Math.cos(t)) / 2 * H;
      const dr = (bodyR(t + 1e-4) - bodyR(t - 1e-4)) / 2e-4, dy = Math.sin(t) * H / 2, n = Math.hypot(dr, dy);
      if (pr !== null) L += Math.hypot(r - pr, y - py);
      pts.push([L, r, y, dy / n, -dr / n]); pr = r; py = y;
    }
    return { pts, Lw: L, rW: pts[N][1], yW: pts[N][2], N };
  })();
  const CRANE = CR;
  function crane(l, o) {
    if (l <= 0) { const p = CR.pts[0]; o[0] = p[1]; o[1] = p[2]; o[2] = p[3]; o[3] = p[4]; return o; }
    if (l >= CR.Lw) { o[0] = CR.rW; o[1] = CR.yW - (l - CR.Lw); o[2] = 1; o[3] = 0; return o; }
    let lo = 0, hi = CR.N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (CR.pts[m][0] < l) lo = m; else hi = m; }
    const a = CR.pts[lo], b = CR.pts[hi], p = (l - a[0]) / (b[0] - a[0] || 1);
    o[0] = lerp(a[1], b[1], p); o[1] = lerp(a[2], b[2], p); o[2] = lerp(a[3], b[3], p); o[3] = lerp(a[4], b[4], p); return o;
  }
  function lDeY(y) {
    if (y <= CR.yW) return CR.Lw + (CR.yW - y);
    let lo = 0, hi = CR.N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (CR.pts[m][2] > y) lo = m; else hi = m; }
    const a = CR.pts[lo], b = CR.pts[hi]; return lerp(a[0], b[0], clamp((y - a[2]) / (b[2] - a[2] || 1)));
  }
  // point de la surface du corps vu de face (projection plane du visage) : x, y → [x, y, z] + normale
  function surface(x, y, out = 0) {
    const r = rAtY(y), z = Math.sqrt(Math.max(1e-6, r * r - x * x));
    const t = Math.acos(clamp(1 - 2 * y / H, -1, 1));
    const dr = (bodyR(t + 1e-4) - bodyR(t - 1e-4)) / 2e-4, dy = Math.sin(t) * H / 2, n = Math.hypot(dr, dy);
    const nr = dy / n, ny = -dr / n;
    const N = [x / r * nr, ny, z / r * nr];
    return { p: [x + N[0] * out, y + N[1] * out, z + N[2] * out], n: N };
  }

  /* ---------- cheveux : la forme ---------- */
  const LONG = { // y de fin de mèche : cadre (mèches qui encadrent le visage), oreille (dégagée), côtés (au-dessus des bras), dos ; épaisseur
    rases: [1.0, 1.0, .98, .95, 0], tres_courts: [1.02, 1.0, .99, .965, .032], courts: [.94, .955, .93, .9, .046],
    mi_longs: [.79, .93, .79, .62, .054], longs: [.74, .93, .78, .4, .058], tres_longs: [.72, .93, .78, .17, .058],
  };
  const TEX = { // n : mèches sur le tour · amp : relief · wf/wa : ondulation · bump/bf : boucles · vol : gonflant · tip : pointes · bul : volume sur les côtés
    raides: { n: 14, amp: .01, wf: 0, wa: 0, bump: 0, bf: 0, vol: 1, tip: .035, pointe: 1, bul: .12 },
    ondules: { n: 12, amp: .011, wf: 9, wa: 1.0, bump: 0, bf: 0, vol: 1.12, tip: .04, pointe: .5, bul: .3 },
    boucles: { n: 13, amp: .006, wf: 0, wa: 0, bump: .048, bf: 15, vol: 1.3, tip: .05, pointe: 0, bul: .45 },
    frises: { n: 18, amp: .005, wf: 0, wa: 0, bump: .042, bf: 21, vol: 1.55, tip: .035, pointe: 0, bul: .55 },
    crepus: { n: 22, amp: .003, wf: 0, wa: 0, bump: .034, bf: 24, vol: 2.0, tip: .02, pointe: 0, bul: .65 },
  };
  const VOL = { plat: .72, moyen: 1, volumineux: 1.42 };
  const RAIE = 2 * Math.PI * 3 / 48; // la raie sur le côté tombe sur une colonne du maillage
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function formeCheveux(f, couvre) {
    const c = f.cheveux, Lg = LONG[c.longueur]; if (!Lg) return null;
    const tx = TEX[c.texture], co = c.coiffure, ras = c.longueur === 'rases';
    const rassemble = ['queue_de_cheval', 'chignon', 'tresses'].includes(co);
    let [cadre, oreille, cote, dos, T] = Lg;
    if (rassemble) { cadre = 1.0; oreille = .99; cote = .96; dos = .9; }
    if (co === 'locks') { cadre = 1.0; oreille = .99; cote = .97; dos = .95; T = .034; }
    if (co === 'cotes_rases') { cadre = .99; oreille = .99; cote = .97; dos = .93; }
    const afro = c.texture === 'crepus' && !rassemble && co !== 'locks' && !ras;
    if (afro) { cadre = Math.max(cadre, .86); oreille = Math.max(oreille, .9); cote = Math.max(cote, .84); dos = Math.max(dos, .74); }
    if (c.texture === 'frises' && !rassemble && !ras) { cadre = Math.max(cadre, .8); dos = Math.max(dos, .5); }
    const court = ['rases', 'tres_courts'].includes(c.longueur);
    let front;
    if (ras || court) front = φ => 1.19 + .015 * sstep(0, 1, Math.abs(φ));
    else switch (co) {
      case 'frange': front = φ => 1.118 + .016 * sstep(.4, .9, Math.abs(φ)); break;
      case 'raie_milieu': front = φ => 1.25 - .12 * sstep(0, .7, Math.abs(φ)); break;
      case 'raie_cote': front = φ => φ > RAIE ? lerp(1.26, 1.175, sstep(RAIE, .95, φ)) : lerp(1.27, 1.14, sstep(RAIE, -.5, φ)); break;
      case 'en_arriere': case 'queue_de_cheval': case 'chignon': case 'tresses': front = φ => 1.235 - .02 * sstep(.4, 1.1, Math.abs(φ)); break;
      case 'locks': front = φ => 1.175 - .015 * Math.cos(φ * 9); break;
      case 'cotes_rases': front = () => 1.16; break;
      default: front = φ => 1.16 + .012 * sstep(0, .9, Math.abs(φ)) - .008 * Math.cos(φ * 6);
    }
    let vol = (ras ? 0 : VOL[c.volume]) * (court ? Math.min(1.25, tx.vol) : tx.vol);
    if (rassemble) vol *= .6;
    if (['bonnet', 'chapeau', 'casquette'].includes(couvre)) vol = Math.min(vol, 1.15);
    return { f, c, tx, co, ras, court, rassemble, afro, cadre, oreille, cote, dos, T, vol, front, raie: co === 'raie_milieu' ? 0 : co === 'raie_cote' ? RAIE : null,
      cotesRases: co === 'cotes_rases', couvre };
  }
  function yFin(φ, sh) {
    const a = Math.abs(φ);
    let y = lerp(sh.front(φ), sh.cadre, sstep(.84, 1.1, a));   // mèches qui encadrent le visage (devant la joue, jamais dessus)
    y = lerp(y, sh.oreille, sstep(1.26, 1.36, a));             // dégagé au-dessus de l'oreille : les boucles restent visibles
    y = lerp(y, sh.cote, sstep(1.5, 1.62, a));                 // côtés, au-dessus des bras
    return lerp(y, sh.dos, sstep(1.7, 1.86, a));               // dos
  }
  // zone d'une colonne : 0 frange, 1 cadre, 2 oreille, 3 dos (pour l'amplitude des pointes)
  const zonePointe = a => a < .84 ? .55 : a < 1.26 ? 1.25 : a < 1.5 ? .5 : 1.1;
  // épaisseur (enveloppe) au-dessus du crâne à l'azimut φ : sert aux couvre-chefs pour se poser SUR les cheveux
  function enveloppeCheveux(sh) { if (!sh) return 0; return sh.ras ? .008 : .0065 + sh.T * sh.vol + sh.tx.amp + sh.tx.bump; }

  /* ---------- géométrie d'une calotte : grille NU × NV refermée autour de l'antenne et sur le crâne aux pointes ---------- */
  function grille(NU, NV) {
    const g = new THREE.BufferGeometry(), nv = NU * (NV + 1);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    g.setAttribute('aHair', new THREE.BufferAttribute(new Float32Array(nv * 4), 4));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(nv * 2), 2));
    const idx = [];
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j, b = ((i + 1) % NU) * (NV + 1) + j, c = b + 1, d = a + 1;
      idx.push(a, d, b, b, d, c);
    }
    g.setIndex(idx); g.userData = { NU, NV }; return g;
  }
  const _o = [0, 0, 0, 0];
  // remplit la calotte. dyn : { g (pousse 0..1+), sx, sz (balancement des mèches qui pendent) }
  function remplirCalotte(geo, sh, dyn) {
    const { NU, NV } = geo.userData, P = geo.attributes.position.array, A = geo.attributes.aHair.array, UV = geo.attributes.uv.array;
    const tx = sh.tx, g = Math.max(.001, dyn.g), gT = sstep(0, .55, g) * (1 + .12 * Math.max(0, g - 1) / .06);
    const flare = sh.c.longueur === 'longs' || sh.c.longueur === 'tres_longs' ? .2 : sh.c.longueur === 'mi_longs' ? .17 : .05;
    const nT = Math.max(5, Math.round(tx.n * .5)); // les pointes forment de grosses mèches (≈ 6 à 11 sur le tour)
    for (let i = 0; i < NU; i++) {
      let φ = 2 * Math.PI * i / NU; if (φ > Math.PI) φ -= 2 * Math.PI;
      const a = Math.abs(φ);
      // pointes : festons selon la texture (pointus pour les raides, arrondis pour les bouclés), plus marqués sur les mèches
      // qui encadrent le visage, discrets sur la frange, nuls si les cheveux sont attachés
      const cl = Math.cos(φ * nT + (sh.raie !== null ? .9 : 0));
      let pointe = tx.pointe ? Math.pow(.5 - .5 * cl, 1 + 1.5 * tx.pointe) : .5 - .5 * Math.abs(Math.cos(φ * nT * .5));
      if (sh.co === 'raie_cote' && a < 1.3) { const q = ((φ - RAIE) * nT / (2 * Math.PI) % 1 + 1) % 1; pointe = φ < RAIE ? Math.pow(q, 1.6) : Math.pow(1 - q, 1.6); }
      const amp = sh.ras ? 0 : tx.tip * zonePointe(a) * (sh.rassemble && a > 1.3 ? 0 : 1) * (sh.co === 'frange' && a < .84 ? .4 : 1);
      const ye = yFin(φ, sh) - amp * pointe;
      const Lend = lDeY(ye) * g;
      const tipLen = Math.min(sh.afro ? .16 : sh.tx.bump ? .11 : .085, Lend * .4);
      const dR = sh.raie !== null ? Math.abs(φ - sh.raie) : 9, isRaie = dR < 1e-3, presRaie = dR < .14;
      const meche = sh.c.meches !== 'aucune' && hash(Math.round(φ * tx.n / (2 * Math.PI)) + 7) > .58 ? 1 : 0;
      for (let j = 0; j <= NV; j++) {
        // rangées : uniformes jusqu'à la zone de pointe, puis 3 rangées pour l'arrondi
        const jj = NV - 3, l = j <= jj ? (Lend - tipLen) * (j / jj) : Lend - tipLen + tipLen * Math.sin((j - jj) / 3 * Math.PI / 2);
        crane(l, _o); const r0 = _o[0], y0 = _o[1], nr = _o[2], ny = _o[3];
        const dT = Lend - l, tip = dT >= tipLen ? 1 : Math.sqrt(Math.max(0, 1 - ((tipLen - dT) / tipLen) ** 2));
        const crown = sh.afro ? .75 + .25 * sstep(0, .08, l) : .35 + .65 * sstep(0, .1, l), relief = sstep(.03, .22, l); // la couronne reste lisse autour de l'antenne
        const ph = φ * tx.n + (tx.wa ? tx.wa * Math.sin(l * tx.wf + φ) : 0) + (sh.raie !== null ? Math.sign(φ - sh.raie) * l * 2.4 : 0);
        const c0 = Math.cos(ph), c = Math.sign(c0) * Math.pow(Math.abs(c0), .65);
        let disp = tx.amp * c * relief, ridge = .5 + .5 * c * relief;
        if (tx.wf) disp += .012 * Math.sin(l * tx.wf + φ * 2) * relief;
        if (tx.bump) { const b = Math.cos(φ * tx.n * .55 + Math.sin(l * 7) * 1.3) * Math.cos(l * tx.bf + φ * 2.3); disp += tx.bump * (.5 + .5 * b) * relief; ridge = .3 + .7 * (.5 + .5 * b * relief); }
        // volume : les cheveux gonflent sur les côtés du crâne (pas un casque à épaisseur constante)
        const bulge = 1 + tx.bul * sstep(.82, 1.02, y0) * (1 - sstep(1.2, 1.34, y0)) * (sh.rassemble ? .3 : 1);
        let T = sh.T * sh.vol * gT * bulge * (sh.afro ? 1 + .45 * sstep(.95, 1.25, y0) : 1);
        let rasW = sh.ras ? 1 : 0;
        if (sh.cotesRases) { const w = sstep(.7, .95, a) * (1 - sstep(1.1, 1.15, y0)); T *= 1 - w; disp *= 1 - w; rasW = w; }
        const hang = Math.max(0, .92 - y0);
        let off = .0068 + (T + flare * hang * gT + (sh.ras ? 0 : disp * gT)) * crown * tip;
        if (isRaie && y0 > sh.front(φ) - .02) { off = .0068 + (off - .0068) * .15; ridge = 0; }
        else if (presRaie && y0 > sh.front(φ) - .02) { off *= 1.12; ridge = Math.max(ridge, .8); } // ça gonfle de part et d'autre de la raie
        let x = (r0 + nr * off) * Math.sin(φ), y = y0 + ny * off, z = (r0 + nr * off) * Math.cos(φ);
        if (hang > 0 && dyn.sx !== undefined) { const w = Math.pow(Math.max(0, .96 - y0), 1.5) * 1.5; x += dyn.sx * w; z += dyn.sz * w; }
        const k = (i * (NV + 1) + j);
        P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z;
        // reflet : une bande dentelée sur le haut de la tête, côté lumière (lisible même en petit)
        const jag = .014 * Math.cos(φ * tx.n * 2) + .008 * Math.cos(φ * 5);
        const band = sstep(1.17, 1.2, y0 + jag) * (1 - sstep(1.255, 1.29, y0 + jag * .8));
        const hl = sh.ras ? 0 : band * sstep(-.25, .5, Math.cos(φ - .35)) * (tx.bump ? .6 : 1) * (.6 + .4 * ridge);
        A[k * 4] = rasW > .5 ? .5 : ridge; A[k * 4 + 1] = hl; A[k * 4 + 2] = meche * sstep(.25, .7, ridge); A[k * 4 + 3] = rasW;
        UV[k * 2] = i / NU; UV[k * 2 + 1] = l;
      }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.aHair.needsUpdate = true; geo.attributes.uv.needsUpdate = true;
    geo.computeVertexNormals(); geo.computeBoundingSphere();
  }

  /* ---------- tubes (queue de cheval, tresses, locks) : une géométrie fusionnée, mise à jour à chaque image ---------- */
  function tubes(specs, RAD) { // specs : [{ segs }] → géométrie avec les bons index
    let nv = 0; const idx = [];
    for (const s of specs) {
      s.v0 = nv; const n = s.segs + 1;
      for (let j = 0; j < s.segs; j++) for (let i = 0; i < RAD; i++) {
        const a = s.v0 + j * RAD + i, b = s.v0 + j * RAD + (i + 1) % RAD, c = b + RAD, d = a + RAD;
        idx.push(a, b, d, b, c, d);
      }
      nv += n * RAD;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    g.setAttribute('aHair', new THREE.BufferAttribute(new Float32Array(nv * 4), 4));
    g.setIndex(idx); g.userData = { specs, RAD }; return g;
  }
  const _v = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3();
  // centre(u) → [x,y,z] ; rayon(u) ; motif(u, θ) → [ridge, lien]
  function remplirTube(geo, s, centre, rayon, motif) {
    const { RAD } = geo.userData, P = geo.attributes.position.array, A = geo.attributes.aHair.array;
    for (let j = 0; j <= s.segs; j++) {
      const u = j / s.segs, c = centre(u), c2 = centre(Math.min(1, u + .02)), c1 = centre(Math.max(0, u - .02));
      _t.set(c2[0] - c1[0], c2[1] - c1[1], c2[2] - c1[2]).normalize();
      _up.set(0, 0, 1); if (Math.abs(_t.z) > .9) _up.set(1, 0, 0);
      _n.crossVectors(_t, _up).normalize(); _b.crossVectors(_t, _n).normalize();
      const r = rayon(u);
      for (let i = 0; i < RAD; i++) {
        const θ = 2 * Math.PI * i / RAD, k = s.v0 + j * RAD + i;
        const [ridge, lien, rr] = motif(u, θ);
        const R = r * (rr ?? 1);
        P[k * 3] = c[0] + (_n.x * Math.cos(θ) + _b.x * Math.sin(θ)) * R; P[k * 3 + 1] = c[1] + (_n.y * Math.cos(θ) + _b.y * Math.sin(θ)) * R; P[k * 3 + 2] = c[2] + (_n.z * Math.cos(θ) + _b.z * Math.sin(θ)) * R;
        A[k * 4] = ridge; A[k * 4 + 1] = 0; A[k * 4 + 2] = 0; A[k * 4 + 3] = lien ? 2 : 0;
      }
    }
  }
  const bez2 = (a, b, c, u) => [0, 1, 2].map(i => (1 - u) * (1 - u) * a[i] + 2 * u * (1 - u) * b[i] + u * u * c[i]);

  /* ---------- matière des cheveux : toon de Pilou + couleurs (base, ombre, reflet, mèches, ras, élastique) ---------- */
  function matiereCheveux(kit) {
    const m = kit.toon('#ffffff');
    const u = { hBase: { value: new THREE.Color() }, hOmbre: { value: new THREE.Color() }, hReflet: { value: new THREE.Color() }, hMeche: { value: new THREE.Color() },
      hRas: { value: new THREE.Color(PAL_DIVERS.ras) }, hLien: { value: new THREE.Color('#E0557A') }, hMecheOn: { value: 0 },
      hFin: { value: new THREE.Vector4(0, 0, 0, 0) } }; // carte de relief peinte : (mèches fines sur le tour, fréquence d'ondulation, amplitude, type 0 rien · 1 lignes · 2 boucles)
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = sh => {
      prev(sh); Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aHair; varying vec4 vHair; varying vec2 vHuv; varying vec3 vHObj;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHair = aHair; vHuv = uv; vHObj = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 hBase; uniform vec3 hOmbre; uniform vec3 hReflet; uniform vec3 hMeche; uniform vec3 hRas; uniform vec3 hLien; uniform float hMecheOn; uniform vec4 hFin; varying vec4 vHair; varying vec2 vHuv; varying vec3 vHObj;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          { vec3 hc = mix(hOmbre, hBase, .12 + .88 * smoothstep(.12, .72, vHair.x));
            hc = mix(hc, hReflet, clamp(vHair.y, 0., 1.) * .75);
            hc = mix(hc, hMeche, clamp(vHair.z, 0., 1.) * hMecheOn);
            float ras = clamp(vHair.w, 0., 1.);
            if (ras > .001) { float n = fract(sin(dot(floor(vHObj * 150.), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
              vec3 st = mix(hRas, hOmbre, .3 + .4 * step(.45, n)); hc = mix(hc, st, ras); }
            if (hFin.w > .5 && ras < .5 && vHuv.y > .02) {
              float fs, w, ln;
              if (hFin.w < 1.5) { fs = sin(vHuv.x * 6.2832 * hFin.x + sin(vHuv.y * hFin.y + vHuv.x * 6.2832 * 2.) * hFin.z); }
              else { fs = sin(vHuv.x * 6.2832 * hFin.x + sin(vHuv.y * hFin.y * .7) * 1.5) * sin(vHuv.y * hFin.y + vHuv.x * 6.2832 * 3.); }
              w = fwidth(fs); ln = smoothstep(.62 - w, .62 + w, fs) * (1. - smoothstep(.35, .9, w));
              hc = mix(hc, mix(hOmbre, hBase, .25), ln * .55);
            }
            if (vHair.w > 1.5) hc = hLien;
            diffuseColor.rgb = hc; }`);
    };
    m.side = THREE.DoubleSide;
    m.userData.u = u; return m;
  }
  function couleurMatiere(m, cols) {
    const u = m.userData.u; u.hBase.value.set(cols.base); u.hOmbre.value.set(cols.ombre); u.hReflet.value.set(cols.reflet); if (cols.meche) u.hMeche.value.set(cols.meche);
  }

  function texEcaille() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d'), r = rng(31); if (!x) return null; // pas de toile 2D (certains Android) : couleurs unies
    x.fillStyle = '#8A5530'; x.fillRect(0, 0, 256, 32);
    for (let i = 0; i < 60; i++) { x.fillStyle = r() < .5 ? 'rgba(52,28,16,.75)' : 'rgba(214,150,80,.7)'; x.beginPath(); x.ellipse(r() * 256, r() * 32, 4 + r() * 10, 3 + r() * 6, r() * 3, 0, Math.PI * 2); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
  }
  function texReflet() { // verre : léger voile + une bande de reflet qu'on fait glisser (uv.x)
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); if (!x) return null; // pas de toile 2D (certains Android) : couleurs unies
    const g = x.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(.42, 'rgba(255,255,255,.1)'); g.addColorStop(.47, 'rgba(255,255,255,.75)'); g.addColorStop(.53, 'rgba(255,255,255,.75)'); g.addColorStop(.56, 'rgba(255,255,255,.12)'); g.addColorStop(.62, 'rgba(255,255,255,.45)'); g.addColorStop(.65, 'rgba(255,255,255,.1)'); g.addColorStop(1, 'rgba(255,255,255,.08)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.ClampToEdgeWrapping; return t;
  }
  function texFoulard(col) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); if (!x) return null; // pas de toile 2D (certains Android) : couleurs unies
    x.fillStyle = col; x.fillRect(0, 0, 256, 128); x.fillStyle = 'rgba(255,248,235,.55)';
    for (let j = 0; j < 8; j++) for (let i = 0; i < 16; i++) { x.beginPath(); x.arc(i * 16 + (j % 2) * 8 + 4, j * 16 + 8, 2.6, 0, Math.PI * 2); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3); return t;
  }

  /* =====================================================================================================================
     creerPieces(kit) : toutes les pièces, posées sur le corps. set(fiche) les construit (à la demande, une par famille),
     update(P, revelation) les anime. Rien n'est chargé tant que la famille est vide.
     ===================================================================================================================== */
  const { toon, ol, body } = kit;
  const tete = new THREE.Group(); tete.position.set(0, BY + .85, 0); body.add(tete); // pivot de la tête : suit fx / fy du visage
  const T0 = new THREE.Group(); T0.position.set(0, -.85, 0); tete.add(T0);         // repère « tour »
  const peintre = creerPeintre();
  const matCh = matiereCheveux(kit), matBarbe = matiereCheveux(kit);
  let fiche = null, sh = null, cleCh = '', cleLu = '', cleCo = '', cleBo = '', cleBa = '';
  const G = {}; // pièces courantes
  const tri = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
  function vider(nom) { const p = G[nom]; if (!p) return; T0.remove(p.obj); p.obj.traverse(o => { if (o.isMesh && o.geometry && !o.userData.partage) o.geometry.dispose(); }); delete G[nom]; }

  /* ----- cheveux ----- */
  function construireCheveux() {
    vider('cheveux'); if (!sh) return;
    const co = sh.co, extra = co === 'tresses' ? 700 : co === 'queue_de_cheval' ? 420 : co === 'chignon' ? 640 : co === 'locks' ? 1180 : 0;
    // budget : ≤ 2 000 triangles pour la pièce entière (calotte + ce qui pend)
    let NU = 48, NV = 16; while (NU * NV * 2 + extra > 2000) { if (NU > 32) NU -= 4; else NV -= 1; }
    if (sh.ras) { NU = 32; NV = 10; }
    const obj = new THREE.Group(), cal = grille(NU, NV), m = new THREE.Mesh(cal, matCh); obj.add(m); ol(m, .8);
    const p = { obj, cal, mesh: m, extra: null };
    if (co === 'queue_de_cheval') {
      const g = tubes([{ segs: 16 }, { segs: 3 }], 8), mq = new THREE.Mesh(g, matCh); obj.add(mq); ol(mq, .8); p.extra = { k: 'queue', g };
    } else if (co === 'tresses') {
      const g = tubes([{ segs: 26 }, { segs: 26 }], 6), mt = new THREE.Mesh(g, matCh); obj.add(mt); ol(mt, .8); p.extra = { k: 'tresses', g };
    } else if (co === 'locks') {
      const n = 14, g = tubes(Array.from({ length: n }, () => ({ segs: 7 })), 6), ml = new THREE.Mesh(g, matCh); obj.add(ml); ol(ml, .8); p.extra = { k: 'locks', g, n };
    } else if (co === 'chignon') {
      const gs = new THREE.SphereGeometry(.15, 18, 12), pos = gs.attributes.position, a = new Float32Array(pos.count * 4);
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), th = Math.atan2(z, x), ph = Math.acos(clamp(y / .15, -1, 1));
        const sw = Math.cos(th * 3 + ph * 5) * (sh.tx.bump ? Math.cos(ph * 14 + th * 6) : 1); const s = 1 + .07 * sw; pos.setXYZ(i, x * s, y * s * .92, z * s); a[i * 4] = .5 + .5 * sw; }
      gs.setAttribute('aHair', new THREE.BufferAttribute(a, 4)); gs.computeVertexNormals();
      const mb = new THREE.Mesh(gs, matCh); obj.add(mb); ol(mb, .8);
      const tg = new THREE.TorusGeometry(.105, .022, 6, 20), ta = new Float32Array(tg.attributes.position.count * 4).fill(0); for (let i = 0; i < tg.attributes.position.count; i++) ta[i * 4 + 3] = 2;
      tg.setAttribute('aHair', new THREE.BufferAttribute(ta, 4)); const mt = new THREE.Mesh(tg, matCh); obj.add(mt); ol(mt, .7);
      const yb = 1.255, zb = -Math.sqrt(Math.max(0, rAtY(yb) ** 2)) - .06 - .55 * sh.T * sh.vol;
      mb.position.set(0, yb + .02, zb - .07); mt.position.set(0, yb + .005, zb + .02); mt.rotation.x = -.5; p.extra = { k: 'chignon', mb, mt };
    }
    T0.add(obj); G.cheveux = p;
  }
  function majCheveux(P, rv) {
    const p = G.cheveux; if (!p) return;
    const g = rv.cheveux ?? 1; p.obj.visible = g > .003 && fiche.couvre_chef !== 'foulard';
    if (!p.obj.visible) return;
    const sx = (P.chZ || 0) * .55, sz = -(P.chX || 0) * .45;
    remplirCalotte(p.cal, sh, { g, sx, sz });
    const e = p.extra; if (!e) return;
    const gE = sstep(.45, 1, g); // ce qui pend arrive après la calotte
    const Tt = sh.T * sh.vol;
    if (e.k === 'queue') {
      const L = { mi_longs: .52, longs: .78, tres_longs: 1.02 }[sh.c.longueur] || .5;
      const r0 = rAtY(1.12), root = [0, 1.12, -r0 - Tt - .01], tipY = 1.12 - L * gE;
      const c = u => { const q = bez2(root, [.3, 1.24, root[2] - .34], [.6, tipY, root[2] + .2], u); const w = u * u; q[0] += sx * 1.5 * w; q[2] += sz * 1.5 * w; return q; };
      const s0 = e.g.userData.specs[0], s1 = e.g.userData.specs[1];
      remplirTube(e.g, s0, c, u => Math.max(.004, .085 * gE * (u < .12 ? .7 + 2.5 * u : 1 - .62 * Math.pow((u - .12) / .88, 1.4)) * (u > .93 ? Math.sqrt(Math.max(0, 1 - ((u - .93) / .07) ** 2)) : 1)),
        (u, θ) => [.5 + .5 * Math.cos(θ * 3 + u * 5 + (sh.tx.wf ? Math.sin(u * 14) * 1.5 : 0)), 0, 1 + (sh.tx.bump ? .1 * Math.cos(u * 30 + θ * 2) : sh.tx.wf ? .06 * Math.sin(u * 16) : 0)]);
      remplirTube(e.g, s1, u => [0, 1.12 + .005, root[2] - .03 + u * .1], () => .062 * gE + .001, () => [0, 1]);
    } else if (e.k === 'tresses') {
      const L = { mi_longs: .55, longs: .75, tres_longs: .92 }[sh.c.longueur] || .55;
      e.g.userData.specs.forEach((s, bi) => {
        const sg = bi ? 1 : -1, φ = sg * 1.74, rr = rAtY(.98) + Tt * .8 + .035, root = [Math.sin(φ) * rr, .98, Math.cos(φ) * rr];
        const out = [Math.sin(φ) * .07, 0, Math.cos(φ) * .07];
        const c = u => { const q = [root[0] + out[0] * Math.sin(u * 2), .98 - L * gE * u, root[2] + out[2] * Math.sin(u * 2)]; const w = u * u; q[0] += sx * 1.4 * w; q[2] += sz * 1.4 * w; return q; };
        const nL = 9;
        remplirTube(e.g, s, c, u => Math.max(.004, .052 * gE * (u < .86 ? .74 + .26 * Math.abs(Math.sin(Math.PI * u / .86 * nL)) : u < .9 ? .6 : .75 * (1 - Math.pow((u - .9) / .1, 2)))),
          (u, θ) => { const lobe = Math.floor(u / .86 * nL * 2); return [u > .86 && u < .9 ? 0 : .5 + .5 * Math.cos(θ * 2 + lobe * Math.PI * .5), u > .855 && u < .905, 1]; });
      });
    } else if (e.k === 'locks') {
      const L = { courts: .26, mi_longs: .46, longs: .7, tres_longs: .92 }[sh.c.longueur] || .3;
      e.g.userData.specs.forEach((s, li) => {
        const row = li % 2, q = Math.floor(li / 2), sg = q % 2 ? 1 : -1, qq = Math.floor(q / 2);
        const φ = sg * (1.02 + qq * .36 + row * .18), y0 = (row ? .97 : 1.04) + .01 * hash(li), rr = rAtY(y0) + Tt + .015;
        const Ll = L * (.85 + .3 * hash(li + 3)) * gE;
        const c = u => { const fl = .05 + .1 * u; const q = [Math.sin(φ) * (rr + fl * u), y0 - Ll * u, Math.cos(φ) * (rr + fl * u)]; const w = u * u; q[0] += sx * 1.3 * w; q[2] += sz * 1.3 * w; return q; };
        remplirTube(e.g, s, c, u => Math.max(.004, .034 * gE * (u > .85 ? Math.sqrt(Math.max(0, 1 - ((u - .85) / .15) ** 2)) : 1) * (1 + .12 * Math.sin(u * 25 + li))), (u, θ) => [.5 + .5 * Math.cos(θ * 2 + u * 9), 0, 1]);
      });
    } else if (e.k === 'chignon') {
      const s = pop(clamp(gE * 1.05)); e.mb.scale.setScalar(Math.max(.01, s)); e.mt.scale.setScalar(Math.max(.01, s));
      e.mb.visible = e.mt.visible = !['bonnet', 'chapeau', 'casquette', 'foulard'].includes(fiche.couvre_chef);
      return;
    }
    if (e.g) { e.g.attributes.position.needsUpdate = true; e.g.attributes.aHair.needsUpdate = true; e.g.computeVertexNormals(); e.g.computeBoundingSphere(); }
  }

  /* ----- lunettes ----- */
  const texVerre = texReflet(), matVerre = new THREE.MeshBasicMaterial({ map: texVerre, color: 0xffffff, opacity: texVerre ? 1 : 0.15, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  let ecaille = null;
  function construireLunettes() {
    vider('lunettes'); if (!fiche || fiche.lunettes.type === 'aucune') return;
    const ty = fiche.lunettes.type, M = MONTURES[ty], col = fiche.lunettes.couleur || 'noir';
    const gap = .052, ey = .9 + M.dy;
    const sur = (x, y, o = gap) => new THREE.Vector3(...surface(x, y, o).p);
    let mat;
    if (col === 'ecaille') { ecaille = ecaille || texEcaille(); mat = ecaille ? toon('#ffffff', { map: ecaille }) : toon(PAL_MONTURE.ecaille[0]); }
    else mat = toon(PAL_MONTURE[col][0], col === 'transparent' ? { transparent: true, opacity: .8 } : {});
    const obj = new THREE.Group(), drop = new THREE.Group(); obj.add(drop);
    const R = M.r;
    for (const s of [-1, 1]) {
      const pts = M.pts().map(([x, y]) => sur(s * (.2 + x), ey + y));
      if (s < 0) pts.reverse();
      const ring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), 44, R, 6, true), mat); drop.add(ring); ol(ring, .55);
      // verre : un disque à la forme de la monture, légèrement en retrait
      const sh2 = M.pts(), cx = s * .2, verts = [cx, ey], uv = [.5, .5];
      for (const [x, y] of sh2) { verts.push(s * (.2 + x), ey + y); uv.push(.5 + x / .32, .5 + y / .3); }
      const pos = [], uvs = [], idx = [];
      for (let i = 0; i < verts.length / 2; i++) { const v = sur(verts[i * 2], verts[i * 2 + 1], gap - .003); pos.push(v.x, v.y, v.z); uvs.push(uv[i * 2], uv[i * 2 + 1]); }
      const n = sh2.length; for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + (i + 1) % n);
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); lg.setIndex(idx);
      const lens = new THREE.Mesh(lg, matVerre); lens.renderOrder = 4; drop.add(lens);
      // branche : du bord extérieur vers la tempe, en suivant la tête
      const ex = .2 + Math.max(...sh2.map(p => p[0])) - .004, bp = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8, φ = lerp(Math.asin(clamp(ex / rAtY(ey + .02), -1, 1)), 1.5, u), y = ey + .02 + .015 * u, r = rAtY(y) + lerp(gap, .018, u);
        bp.push(new THREE.Vector3(s * Math.sin(φ) * r, y, Math.cos(φ) * r)); }
      const br = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp), 10, R * .7 + .002, 5), mat); drop.add(br); ol(br, .5);
    }
    // pont
    const top = Math.max(...M.pts().map(p => p[1])) * .55, ix = .2 + Math.min(...M.pts().map(p => p[0])) + .006;
    const bpts = [sur(-ix, ey + top), sur(-.035, ey + top + .02, gap + .01), sur(.035, ey + top + .02, gap + .01), sur(ix, ey + top)];
    const pont = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bpts), 12, R * .85 + .002, 5), mat); drop.add(pont); ol(pont, .5);
    if (ty === 'aviateur') { const tp = [sur(-ix + .01, ey + .085), sur(0, ey + .095, gap + .012), sur(ix - .01, ey + .085)]; const t2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tp), 10, R * .8, 5), mat); drop.add(t2); ol(t2, .5); }
    T0.add(obj); G.lunettes = { obj, drop, mat };
  }
  function majLunettes(P, rv) {
    const p = G.lunettes; if (!p) return;
    const a = rv.lunettes ?? 1; p.obj.visible = a > .001; if (!p.obj.visible) return;
    // apparition : descend de 0,55 avec la courbe « rebond », petit balancement, puis le reflet balaie le verre
    const e = pop(clamp(a)), fall = (1 - e) * .55;
    p.drop.position.set(0, fall, (1 - e) * .08); p.drop.rotation.z = (1 - e) * .25 * Math.sin(a * 9);
    if (matVerre.map) matVerre.map.offset.x = lerp(.55, -.6, clamp((rv.reflet ?? 1)));
    matVerre.opacity = Math.min(1, a * 2) * (matVerre.map ? 1 : 0.15);
  }

  /* ----- boucles d'oreilles (et l'oreille est un point, Pilou n'a pas d'oreilles) ----- */
  const matBijou = toon(PAL_DIVERS.bijou, { emissive: new THREE.Color('#7A5A10'), emissiveIntensity: .25 });
  const OREILLE = .83, PHI_O = 1.42;
  function construireBoucles() {
    vider('boucles'); if (!fiche || fiche.oreilles.boucles === 'aucune') return;
    const ty = fiche.oreilles.boucles, obj = new THREE.Group(), side = [];
    for (const s of [-1, 1]) {
      const r = rAtY(OREILLE), x = s * Math.sin(PHI_O) * r, z = Math.cos(PHI_O) * r;
      const piv = new THREE.Group(); piv.position.set(x, OREILLE, z); piv.rotation.y = s * PHI_O; obj.add(piv);
      const g = new THREE.Group(); piv.add(g);
      if (ty === 'puces') { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.03, 1), matBijou); m.position.z = .018; g.add(m); ol(m, .5); }
      else if (ty === 'anneaux') { const m = new THREE.Mesh(new THREE.TorusGeometry(.05, .009, 6, 24), matBijou); m.position.set(0, -.045, .022); m.rotation.y = Math.PI / 2; g.add(m); ol(m, .45); }
      else { const c = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .06, 5), matBijou); c.position.set(0, -.03, .018); g.add(c);
        const d = new THREE.Mesh(new THREE.SphereGeometry(.03, 12, 8), toon('#7FD0F0', { emissive: new THREE.Color('#2A7090'), emissiveIntensity: .3 })); d.scale.set(1, 1.35, 1); d.position.set(0, -.085, .018); g.add(d); ol(d, .5);
        const k = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), matBijou); k.position.set(0, 0, .016); g.add(k); }
      side.push({ piv, g, s });
    }
    T0.add(obj); G.boucles = { obj, side, ty };
  }
  function majBoucles(P, rv) {
    const p = G.boucles; if (!p) return;
    const a = rv.boucles ?? 1; p.obj.visible = a > .001 && fiche.couvre_chef !== 'foulard'; if (!p.obj.visible) return;
    const sc = pop(clamp(a)) * (1 + .35 * Math.sin(Math.PI * clamp(a)) * (a < 1 ? 1 : 0));
    for (const q of p.side) { q.g.scale.setScalar(Math.max(.01, sc)); q.g.rotation.z = p.ty === 'puces' ? 0 : (P.pend || 0) * .9 * q.s + (P.chZ || 0) * .2; q.g.rotation.x = p.ty === 'puces' ? 0 : -(P.chX || 0) * .5; }
  }

  /* ----- barbe longue (volume) ----- */
  function construireBarbe() {
    vider('barbe'); if (!fiche || fiche.barbe.type !== 'longue') return;
    const g = grille(16, 12), m = new THREE.Mesh(g, matBarbe); ol(m, .7); g.userData.ouvert = true;
    T0.add(m); G.barbe = { obj: m, g };
  }
  function majBarbe(P, rv) {
    const p = G.barbe; if (!p) return;
    const a = rv.barbe ?? 1; p.obj.visible = a > .01; if (!p.obj.visible) return;
    const { NU, NV } = p.g.userData, Pz = p.g.attributes.position.array, A = p.g.attributes.aHair.array;
    const drop = Math.max(0, (P.f.mL || .03) - .03) * 1.3, yTop = .655 - drop, L = .21 * E1(a);
    for (let i = 0; i < NU; i++) {
      const u = (i / (NU - 1)) * 2 - 1; // −1 … 1 sur la largeur
      for (let j = 0; j <= NV; j++) {
        const v = j / NV, w = lerp(.36, .17, Math.pow(v, 1.6)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, v - .7) / .3, 2) * .6)), x = u * w;
        const y = lerp(yTop + .1 * u * u, yTop - L * (1 - .35 * u * u), v);
        const S = surface(x + (P.chZ || 0) * .08 * v * v, y, 0), th = .07 * Math.pow(Math.max(0, 1 - u * u), .5) * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.12 + .02)), .55) * a;
        const wv = (.012 * Math.cos(u * 11) * Math.cos(v * 14) + .006 * Math.cos(u * 23 + v * 5)) * (1 - u * u) * Math.sin(Math.PI * Math.min(1, v * 1.1));
        const k = i * (NV + 1) + j;
        Pz[k * 3] = S.p[0] + S.n[0] * (th + wv + .006); Pz[k * 3 + 1] = S.p[1] + S.n[1] * (th + wv + .006); Pz[k * 3 + 2] = S.p[2] + S.n[2] * (th + wv + .006) + .004;
        A[k * 4] = .55 + .45 * Math.cos(u * 11) * Math.cos(v * 14); A[k * 4 + 1] = 0; A[k * 4 + 2] = 0; A[k * 4 + 3] = 0;
      }
    }
    p.g.attributes.position.needsUpdate = true; p.g.attributes.aHair.needsUpdate = true; p.g.computeVertexNormals(); p.g.computeBoundingSphere();
  }
  const E1 = x => 1 - Math.pow(1 - clamp(x), 3);

  /* ----- couvre-chefs (choisis seulement à la main) : percés pour l'antenne ----- */
  // coque : du sommet (trou de l'antenne) jusqu'à fnY(φ) ; fnOff(φ, v, l) épaisseur ; fnR(φ, v) relief (ridge)
  function coque(NU, NV, fnY, fnOff, fnR = () => 1) {
    const g = grille(NU, NV), P = g.attributes.position.array, A = g.attributes.aHair.array, UV = g.attributes.uv.array;
    for (let i = 0; i < NU; i++) { let φ = 2 * Math.PI * i / NU; if (φ > Math.PI) φ -= 2 * Math.PI;
      const L = lDeY(fnY(φ));
      for (let j = 0; j <= NV; j++) { const l = L * j / NV; crane(l, _o); const r0 = _o[0], y0 = _o[1], nr = _o[2], ny = _o[3]; const off = fnOff(φ, j / NV, l, y0); const k = i * (NV + 1) + j;
        P[k * 3] = (r0 + nr * off) * Math.sin(φ); P[k * 3 + 1] = y0 + ny * off; P[k * 3 + 2] = (r0 + nr * off) * Math.cos(φ);
        A[k * 4] = fnR(φ, j / NV); UV[k * 2] = i / NU; UV[k * 2 + 1] = l; } }
    g.computeVertexNormals(); return g;
  }
  // anneau fermé autour de la tête : profil [[y, épaisseur], …] parcouru en boucle (section pleine)
  function anneau(NU, prof, fnR = () => 1, yOf = () => 0) {
    const g = new THREE.BufferGeometry(), pos = [], aa = [], idx = [], n = prof.length;
    for (let i = 0; i <= NU; i++) { const φ = 2 * Math.PI * i / NU;
      for (const [y, off] of prof) { const yy = y + yOf(φ), r = rAtY(yy) + off; pos.push(Math.sin(φ) * r, yy, Math.cos(φ) * r); aa.push(fnR(φ), 0, 0, 0); } }
    for (let i = 0; i < NU; i++) for (let q = 0; q < n; q++) { const a = i * n + q, b = (i + 1) * n + q, c = i * n + (q + 1) % n, d = (i + 1) * n + (q + 1) % n; idx.push(a, c, b, c, d, b); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aHair', new THREE.Float32BufferAttribute(aa, 4)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  const withA = (geo, r = 1) => { const n = geo.attributes.position.count, a = new Float32Array(n * 4); for (let i = 0; i < n; i++) a[i * 4] = r; geo.setAttribute('aHair', new THREE.BufferAttribute(a, 4)); return geo; };
  function matCouvre(col, tex) {
    if (tex) return toon('#ffffff', { map: tex });
    const m = matiereCheveux(kit); m.side = THREE.FrontSide;
    couleurMatiere(m, { base: col, ombre: mixHex(col, '#4A2A20', .28), reflet: mixHex(col, '#FFFFFF', .35), meche: col }); return m;
  }
  function construireCouvre() {
    vider('couvre'); if (!fiche || fiche.couvre_chef === 'aucun') return;
    const ty = fiche.couvre_chef, col = PAL_COUVRE[ty], env = Math.max(.02, enveloppeCheveux(sh)), obj = new THREE.Group(), drop = new THREE.Group(); obj.add(drop);
    const add = (geo, mat, w = .8) => { const m = new THREE.Mesh(geo, mat); drop.add(m); ol(m, w); return m; };
    if (ty === 'bonnet') { // bonnet tricoté : côtes, revers, l'antenne fait le pompon
      const mat = matCouvre(col), y0 = φ => 1.06 + .03 * Math.cos(φ);
      add(coque(40, 10, y0, (φ, v) => env + .03 + .085 * Math.pow(1 - v, 1.6) + .01 * sstep(.75, 1, v), (φ) => .5 + .5 * Math.cos(φ * 20)), mat);
      add(anneau(40, [[-.012, env + .022], [-.012, env + .062], [.082, env + .066], [.082, env + .03]], φ => .5 + .5 * Math.cos(φ * 20), φ => y0(φ) - .012 + .012), mat, .7);
    } else if (ty === 'casquette') {
      const mat = matCouvre(col);
      add(coque(36, 9, φ => 1.12 - .05 * sstep(1.2, 2.6, Math.abs(φ)), (φ, v) => env + .024 + .02 * Math.pow(1 - v, 2), (φ) => .75 + .25 * Math.cos(φ * 6)), mat);
      const rI = rAtY(1.12) + env + .02, vis = withA(new THREE.CylinderGeometry(rI + .24, rI + .24, .028, 28, 1, false, -.95, 1.9));
      const v = add(vis, matCouvre(mixHex(col, '#1E2A5A', .22)), .7); v.position.set(0, 1.125, .02); v.rotation.x = .2; v.scale.set(1, 1, .9);
      const bt = add(withA(new THREE.TorusGeometry(.05, .016, 6, 16)), matCouvre(mixHex(col, '#FFFFFF', .25)), .5); bt.position.set(0, H + .004 + env * .6, 0); bt.rotation.x = Math.PI / 2;
    } else if (ty === 'bandeau') {
      add(anneau(44, [[-.045, env + .004], [-.045, env + .026], [.045, env + .026], [.045, env + .004]], φ => .85 + .15 * Math.cos(φ * 3), φ => 1.15 - .025 * (1 - Math.cos(φ))), matCouvre(col), .7);
    } else if (ty === 'foulard') { // encadre le visage, couvre cheveux et oreilles, tombe dans le dos ; percé pour l'antenne
      const mat = matCouvre(col, texFoulard(col));
      add(coque(44, 14, φ => { const a = Math.abs(φ); return lerp(lerp(1.13, .63, sstep(.76, .98, a)), .48, sstep(1.5, 2.4, a)); },
        (φ, v, l, y0) => { const a = Math.abs(φ), base = .032 + env * .35; const close = v > .9 ? 1 - (v - .9) * 7 : 1;
          return (base + .02 * sstep(.75, 1, a) + .012 * Math.cos(φ * 8 + l * 3) * sstep(.25, .7, v) + .16 * Math.max(0, .88 - y0) * sstep(.9, 1.4, a)) * Math.max(.15, close); }), mat);
      // pli qui borde le visage
      const bord = []; for (let i = 0; i <= 26; i++) { const u = i / 26, φ = lerp(-1.02, 1.02, u), a = Math.abs(φ), y = lerp(1.13, .65, sstep(.76, .98, a)) + .01, r = rAtY(y) + .04 + env * .35;
        const φ2 = Math.sign(φ) * Math.min(a, .8 + .2 * sstep(.76, 1, a)); bord.push(new THREE.Vector3(Math.sin(φ2) * r, y, Math.cos(φ2) * r)); }
      add(withA(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bord), 40, .022, 6)), mat, .6);
    } else if (ty === 'chapeau') { // chapeau de paille : bord incliné vers le bas, ruban ; percé pour l'antenne
      const mat = matCouvre(col), hat = new THREE.Group(); drop.add(hat); hat.position.set(0, 1.16, 0); hat.rotation.x = -.16;
      const addH = (geo, m, w = .8) => { const o = new THREE.Mesh(geo, m); hat.add(o); ol(o, w); return o; };
      const cr = coque(36, 8, () => 1.16, (φ, v) => env + .035 + .07 * sstep(0, .6, 1 - v), (φ, v) => .7 + .3 * Math.cos(v * 30)); cr.translate(0, -1.16, 0); addH(cr, mat);
      const rI = rAtY(1.16) + env + .03, W = .2, NB = 40, pos = [], idx = [], aa = [];
      for (let i = 0; i <= NB; i++) { const φ = 2 * Math.PI * i / NB; for (const [d, h] of [[0, 0], [.5, -.012], [1, -.05], [1, -.068], [.5, -.03], [0, -.02]]) { const r = rI + W * d * (1 + .1 * Math.cos(φ)); pos.push(Math.sin(φ) * r, h - .015 * d * Math.cos(2 * φ) * 0, Math.cos(φ) * r); aa.push(.7 + .3 * Math.cos(d * 9), 0, 0, 0); } }
      for (let i = 0; i < NB; i++) for (let q = 0; q < 6; q++) { const a = i * 6 + q, b = (i + 1) * 6 + q, c = i * 6 + (q + 1) % 6, d = (i + 1) * 6 + (q + 1) % 6; idx.push(a, b, c, c, b, d); }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('aHair', new THREE.Float32BufferAttribute(aa, 4)); bg.setIndex(idx); bg.computeVertexNormals();
      addH(bg, mat);
      const rb = anneau(36, [[1.165, env + .03], [1.165, env + .068], [1.222, env + .062], [1.222, env + .026]], () => 1); rb.translate(0, -1.16, 0);
      addH(rb, matCouvre('#C25B3F'), .6);
    } else if (ty === 'serre_tete') {
      const pts = []; for (let i = 0; i <= 24; i++) { const a = lerp(-1.3, 1.3, i / 24), yy = .96 + (H - .96) * Math.pow(Math.cos(a), 1.1), zz = .06 + .06 * Math.cos(a);
        const r = rAtY(Math.min(H - .015, yy)), R = Math.sqrt(Math.max(.0004, r * r - zz * zz)) * Math.sign(a), S = new THREE.Vector3(R * Math.abs(Math.sin(a)) / Math.max(.05, Math.abs(Math.sin(a))), yy, zz);
        const n = S.clone().setY(S.y - .55).normalize(); pts.push(S.addScaledVector(n, env + .01)); }
      add(withA(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .02, 6)), matCouvre(col), .6);
    }
    T0.add(obj); G.couvre = { obj, drop };
  }
  function majCouvre(P, rv) {
    const p = G.couvre; if (!p) return;
    const a = rv.couvre ?? 1; p.obj.visible = a > .001; if (!p.obj.visible) return;
    const e = pop(clamp(a)); p.drop.position.y = (1 - e) * .5; p.drop.scale.set(1 + .06 * Math.sin(Math.PI * clamp(a * 1.4 - .4)), 1 - .05 * Math.sin(Math.PI * clamp(a * 1.4 - .4)), 1 + .06 * Math.sin(Math.PI * clamp(a * 1.4 - .4)));
  }

  /* ----- API ----- */
  const api = {
    peintre: peintre, tete, groupe: T0,
    get fiche() { return fiche; },
    set(f) {
      fiche = f ? normaliser(f).fiche : null;
      sh = fiche ? formeCheveux(fiche, fiche.couvre_chef) : null;
      const kCh = fiche ? JSON.stringify([fiche.cheveux, fiche.couvre_chef]) : '', kLu = fiche ? JSON.stringify(fiche.lunettes) : '', kCo = fiche ? fiche.couvre_chef + JSON.stringify(fiche.cheveux) : '', kBo = fiche ? fiche.oreilles.boucles : '', kBa = fiche ? fiche.barbe.type : '';
      if (kCh !== cleCh) { construireCheveux(); cleCh = kCh; }
      if (kLu !== cleLu) { construireLunettes(); cleLu = kLu; }
      if (kCo !== cleCo) { construireCouvre(); cleCo = kCo; }
      if (kBo !== cleBo) { construireBoucles(); cleBo = kBo; }
      if (kBa !== cleBa) { construireBarbe(); cleBa = kBa; }
      if (fiche) { const ch = couleursCheveux(fiche); couleurMatiere(matCh, ch); matCh.userData.u.hMecheOn.value = fiche.cheveux.meches === 'aucune' ? 0 : 1; couleurMatiere(matBarbe, couleursBarbe(fiche));
        const tx = fiche.cheveux.texture, F = { raides: [44, 0, 0, 1], ondules: [36, 9, 1.1, 1], boucles: [26, 30, 0, 2], frises: [34, 40, 0, 2], crepus: [44, 54, 0, 2] }[tx];
        matCh.userData.u.hFin.value.set(...F); matBarbe.userData.u.hFin.value.set(30, 0, 0, 1); }
      return api;
    },
    // couleurs en transition (Studio) : mélange de deux palettes
    couleursCheveux(a, b, p) { const A = couleursCheveux(a), B = couleursCheveux(b); couleurMatiere(matCh, { base: mixHex(A.base, B.base, p), ombre: mixHex(A.ombre, B.ombre, p), reflet: mixHex(A.reflet, B.reflet, p), meche: B.meche }); },
    couleurMonture(c) { const p = G.lunettes; if (p && !p.mat.map) p.mat.color.set(c); },
    revelation: {},
    update(P) {
      const rv = api.revelation || {};
      peintre.set(fiche, rv);
      if (fiche) peintre.formeYeux(P.f);
      const f = P.f || {};
      tete.rotation.y = (f.fx || 0) / .55; tete.rotation.x = -(f.fy || 0) / .55;
      if (!fiche) { for (const k in G) G[k].obj.visible = false; return; }
      majCheveux(P, rv); majLunettes(P, rv); majBoucles(P, rv); majBarbe(P, rv); majCouvre(P, rv);
    },
    /** Libère géométries, matières et textures (la scène s'en va). */
    dispose() {
      for (const k of Object.keys(G)) vider(k)
      T0.traverse((o) => { if (o.isMesh) { o.geometry?.dispose?.(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m?.map?.dispose?.(); m?.dispose?.() }) } })
      tete.parent?.remove(tete)
    },
    stats() { const o = {}; for (const k in G) { let t = 0; G[k].obj.traverse(m => { if (m.isMesh && !m.material.isShaderMaterial) t += tri(m.geometry); }); o[k] = Math.round(t); } return o; },
  };
  return api;
}
