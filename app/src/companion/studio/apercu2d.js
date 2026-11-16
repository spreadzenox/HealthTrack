/**
 * Aperçu de Pilou en 2D, de face, avec les traits de la fiche : le repli du Studio quand la scène 3D n'est pas là
 * (palier bas, WebGL absent, scène éteinte) et la vignette des listes. Pilou garde toujours son corps menthe, son
 * ventre crème, son antenne et son point ambre, ses joues et sa montre (PILOU-DOUBLE.md § 1) ; seuls les traits
 * changent. Le visage est le même que celui de la figurine (`visage.js`, `peintre.js`).
 *
 * `dessinerPilou(ctx, largeur, hauteur, fiche, options)` : tout est déterministe (même fiche → même image).
 */
import { lerp, sstep, clamp, H, rAtY, bodyR, PAL, FACE0, MONTURES } from './profil'
import { drawFaceAt } from './visage'
import { creerPeintre } from './peintre'
import { couleursCheveux, PAL_MONTURE, PAL_COUVRE, PAL_DIVERS } from './traits'

const OREILLE_Y = 0.83

/* ---------- forme des cheveux vue de face (zones du kit : front, cadre, oreille, côtés, dos) ---------- */
const LONG = {
  rases: [1.0, 1.0, 0.98, 0.95, 0], tres_courts: [1.02, 1.0, 0.99, 0.965, 0.032], courts: [0.94, 0.955, 0.93, 0.9, 0.046],
  mi_longs: [0.79, 0.93, 0.79, 0.62, 0.054], longs: [0.74, 0.93, 0.78, 0.4, 0.058], tres_longs: [0.72, 0.93, 0.78, 0.17, 0.058],
}
const TEX = {
  raides: { n: 14, vol: 1, tip: 0.035, bosse: 0 }, ondules: { n: 12, vol: 1.12, tip: 0.04, bosse: 0.012 },
  boucles: { n: 13, vol: 1.3, tip: 0.04, bosse: 0.03 }, frises: { n: 18, vol: 1.55, tip: 0.035, bosse: 0.03 },
  crepus: { n: 22, vol: 2.0, tip: 0.02, bosse: 0.026 },
}
const VOL = { plat: 0.72, moyen: 1, volumineux: 1.42 }
const RASSEMBLEES = ['queue_de_cheval', 'chignon', 'tresses']

export function formeCheveux2d(f) {
  const c = f.cheveux, Lg = LONG[c.longueur]
  if (!Lg) return null
  const tx = TEX[c.texture] || TEX.raides, co = c.coiffure, ras = c.longueur === 'rases'
  const rassemble = RASSEMBLEES.includes(co)
  let [cadre, oreille, cote, dos, T] = Lg
  if (rassemble) { cadre = 1.0; oreille = 0.99; cote = 0.96; dos = 0.9 }
  if (co === 'locks') { cadre = 1.0; oreille = 0.99; cote = 0.97; dos = 0.95; T = 0.034 }
  if (co === 'cotes_rases') { cadre = 0.99; oreille = 0.99; cote = 0.97; dos = 0.93 }
  const afro = c.texture === 'crepus' && !rassemble && co !== 'locks' && !ras
  if (afro) { cadre = Math.max(cadre, 0.86); oreille = Math.max(oreille, 0.9); cote = Math.max(cote, 0.84); dos = Math.max(dos, 0.74) }
  if (c.texture === 'frises' && !rassemble && !ras) { cadre = Math.max(cadre, 0.8); dos = Math.max(dos, 0.5) }
  const court = ['rases', 'tres_courts'].includes(c.longueur)
  let front
  if (ras || court) front = (p) => 1.19 + 0.015 * sstep(0, 1, Math.abs(p))
  else if (co === 'frange') front = (p) => 1.118 + 0.016 * sstep(0.4, 0.9, Math.abs(p))
  else if (co === 'raie_milieu') front = (p) => 1.25 - 0.12 * sstep(0, 0.7, Math.abs(p))
  else if (co === 'raie_cote') front = (p) => (p > 0.39 ? lerp(1.26, 1.175, sstep(0.39, 0.95, p)) : lerp(1.27, 1.14, sstep(0.39, -0.5, p)))
  else if (rassemble || co === 'en_arriere') front = (p) => 1.235 - 0.02 * sstep(0.4, 1.1, Math.abs(p))
  else if (co === 'locks') front = (p) => 1.175 - 0.015 * Math.cos(p * 9)
  else if (co === 'cotes_rases') front = () => 1.16
  else front = (p) => 1.16 + 0.012 * sstep(0, 0.9, Math.abs(p)) - 0.008 * Math.cos(p * 6)
  let vol = (ras ? 0 : VOL[c.volume] || 1) * (court ? Math.min(1.25, tx.vol) : tx.vol)
  if (rassemble) vol *= 0.6
  if (['bonnet', 'chapeau', 'casquette'].includes(f.couvre_chef)) vol = Math.min(vol, 1.15)
  return { c, tx, co, ras, court, rassemble, afro, cadre, oreille, cote, dos, T, vol, front }
}
function yFin(p, sh) {
  const a = Math.abs(p)
  let y = lerp(sh.front(p), sh.cadre, sstep(0.84, 1.1, a))
  y = lerp(y, sh.oreille, sstep(1.26, 1.36, a))
  y = lerp(y, sh.cote, sstep(1.5, 1.62, a))
  return lerp(y, sh.dos, sstep(1.7, 1.86, a))
}
export function enveloppe(sh) {
  if (!sh) return 0
  return sh.ras ? 0.008 : 0.0065 + sh.T * sh.vol + sh.tx.bosse * 0.6
}

/* ---------- le dessin ---------- */
/** Points du profil du galet décalés de `e` le long de la normale, du côté droit (y = yBas) au sommet puis à gauche. */
function profilDecale(yBas, e, bosse = () => 0) {
  const tBas = Math.acos(clamp(1 - (2 * yBas) / H, -1, 1)), N = 40, droite = []
  for (let i = 0; i <= N; i++) {
    const t = lerp(tBas, Math.PI, i / N), r = bodyR(t), y = ((1 - Math.cos(t)) / 2) * H
    const dr = (bodyR(t + 1e-4) - bodyR(t - 1e-4)) / 2e-4, dy = (Math.sin(t) * H) / 2, n = Math.hypot(dr, dy) || 1
    const ee = e + bosse(i)
    droite.push([r + (dy / n) * ee, y + (-dr / n) * ee])
  }
  const gauche = droite.slice(0, -1).reverse().map(([x, y]) => [-x, y])
  return [...droite, ...gauche]
}

function contourCorps(ctx, X, Y, marge = 0) {
  ctx.beginPath()
  const N = 48
  for (let i = 0; i <= N; i++) {
    const y = (i / N) * H
    const x = rAtY(y) + marge
    i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))
  }
  for (let i = N; i >= 0; i--) {
    const y = (i / N) * H
    ctx.lineTo(X(-(rAtY(y) + marge)), Y(y))
  }
  ctx.closePath()
}

function dessinerCorps(ctx, X, Y, k) {
  // pieds
  ctx.fillStyle = PAL.pieds
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(X(s * 0.2), Y(0.03), 0.17 * k, 0.065 * k, 0, 0, Math.PI * 2); ctx.fill()
  }
  // bras (la montre au poignet gauche de l'écran)
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(X(s * (rAtY(0.5) - 0.02)), Y(0.5)); ctx.rotate(s * 0.5)
    ctx.fillStyle = '#6CCCA8'; ctx.beginPath(); ctx.ellipse(s * 0.06 * k, 0, 0.13 * k, 0.075 * k, 0, 0, Math.PI * 2); ctx.fill()
    if (s < 0) {
      ctx.fillStyle = PAL.montre; ctx.fillRect(-0.02 * k - 0.03 * k, -0.075 * k, 0.05 * k, 0.15 * k)
      ctx.fillStyle = '#DDE7F0'; ctx.beginPath(); ctx.arc(-0.025 * k, 0, 0.032 * k, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = PAL.menthe; ctx.beginPath(); ctx.arc(-0.025 * k, 0, 0.022 * k, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }
  // corps : vinyle menthe, lumière en haut à gauche
  contourCorps(ctx, X, Y)
  const g = ctx.createRadialGradient(X(-0.2), Y(1.05), 0.05 * k, X(0), Y(0.6), 0.95 * k)
  g.addColorStop(0, '#9BE6C9'); g.addColorStop(0.55, PAL.menthe); g.addColorStop(1, '#5DC39C')
  ctx.fillStyle = g; ctx.fill()
  // le bas du corps peint en crème
  ctx.save(); contourCorps(ctx, X, Y); ctx.clip()
  ctx.fillStyle = PAL.creme
  ctx.beginPath(); ctx.ellipse(X(0), Y(0.32), 0.78 * rAtY(0.34) * k, 0.27 * k, 0, 0, Math.PI * 2); ctx.fill()
  // reflet du vernis
  ctx.fillStyle = 'rgba(255,255,255,.28)'
  ctx.beginPath(); ctx.ellipse(X(-0.25), Y(1.12), 0.09 * k, 0.05 * k, -0.6, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function dessinerAntenne(ctx, X, Y, k, t) {
  ctx.strokeStyle = PAL.antenne; ctx.lineWidth = 0.035 * k; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(X(0), Y(H - 0.02)); ctx.quadraticCurveTo(X(0.02), Y(H + 0.16), X(0.07), Y(H + 0.27)); ctx.stroke()
  const lueur = 0.5 + 0.5 * Math.sin((t / 2400) * Math.PI * 2)
  const g = ctx.createRadialGradient(X(0.07), Y(H + 0.3), 0, X(0.07), Y(H + 0.3), 0.14 * k)
  g.addColorStop(0, `rgba(255,190,90,${0.35 + 0.15 * lueur})`); g.addColorStop(1, 'rgba(255,190,90,0)')
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X(0.07), Y(H + 0.3), 0.14 * k, 0, Math.PI * 2); ctx.fill()
  const b = ctx.createRadialGradient(X(0.06), Y(H + 0.31), 0, X(0.07), Y(H + 0.3), 0.065 * k)
  b.addColorStop(0, '#FFE2A8'); b.addColorStop(0.6, PAL.ambre); b.addColorStop(1, PAL.ambreLueur)
  ctx.fillStyle = b; ctx.beginPath(); ctx.arc(X(0.07), Y(H + 0.3), 0.06 * k, 0, Math.PI * 2); ctx.fill()
}

/** Cheveux qui pendent derrière le corps (longueurs, volume « nuage », chignon, tresses). */
function dessinerCheveuxDerriere(ctx, X, Y, k, sh, cols) {
  if (!sh || sh.ras) return
  const e = enveloppe(sh)
  ctx.fillStyle = cols.ombre
  if (sh.afro) {
    const R = 0.42 + 0.08 * sh.vol, cy = 1.06
    ctx.fillStyle = cols.base
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2, x = Math.cos(a) * R * 1.02, y = cy + Math.sin(a) * R * 0.86
      if (y < sh.cote - 0.02) continue
      ctx.beginPath(); ctx.arc(X(x), Y(y), (0.13 + 0.02 * Math.cos(i * 2.3)) * k, 0, Math.PI * 2); ctx.fill()
    }
    ctx.beginPath(); ctx.ellipse(X(0), Y(cy), R * 1.02 * k, R * 0.86 * k, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = cols.ombre; ctx.globalAlpha = 0.3
    for (let i = 0; i < 46; i++) {
      const a = i * 2.4, r = R * (0.5 + 0.55 * (((i * 37) % 10) / 10))
      ctx.beginPath(); ctx.arc(X(Math.cos(a) * r), Y(cy + Math.sin(a) * r * 0.86), 0.03 * k, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    return
  }
  if (sh.co === 'chignon') {
    ctx.fillStyle = cols.base; ctx.beginPath(); ctx.arc(X(0), Y(H + 0.04), 0.16 * k, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = cols.ombre; ctx.lineWidth = 0.012 * k
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(X(0), Y(H + 0.04), (0.05 + i * 0.04) * k, 3.6 + i, 5.6 + i); ctx.stroke() }
  }
  if (sh.co === 'tresses') {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const y = 0.95 - i * 0.065, x = s * (rAtY(Math.max(y, 0.55)) + 0.03) + ((i % 2) * 2 - 1) * 0.012
        ctx.fillStyle = i % 2 ? cols.base : cols.ombre
        ctx.beginPath(); ctx.ellipse(X(x), Y(y), 0.05 * k, 0.042 * k, s * 0.4, 0, Math.PI * 2); ctx.fill()
      }
      ctx.fillStyle = '#E0557A'; ctx.beginPath(); ctx.arc(X(s * (rAtY(0.55) + 0.03)), Y(0.36), 0.025 * k, 0, Math.PI * 2); ctx.fill()
    }
  }
  if (sh.co === 'locks') {
    ctx.lineCap = 'round'
    for (let i = 0; i < 7; i++) {
      for (const s of [-1, 1]) {
        const x0 = s * (rAtY(1.1) - 0.02 - i * 0.01), len = 0.34 + ((i * 7) % 5) * 0.03
        ctx.strokeStyle = i % 2 ? cols.base : cols.ombre; ctx.lineWidth = 0.05 * k
        ctx.beginPath(); ctx.moveTo(X(x0 + s * (0.02 + i * 0.03)), Y(1.12 - i * 0.02)); ctx.lineTo(X(s * (rAtY(0.85) + 0.02 + i * 0.012)), Y(1.12 - i * 0.02 - len)); ctx.stroke()
      }
    }
  }
  // longueurs qui tombent dans le dos (visibles autour du corps)
  if (sh.dos < 0.88 && !sh.rassemble && sh.co !== 'locks') {
    const rW = rAtY(H / 2)
    ctx.fillStyle = cols.ombre
    ctx.beginPath()
    const N = 20
    for (let i = 0; i <= N; i++) {
      const y = lerp(1.1, sh.dos, i / N), fl = (0.05 + 0.1 * sh.vol) * Math.max(0, 0.92 - y)
      const x = Math.max(rAtY(Math.max(y, 0.6)), y < 0.69 ? rW * 0.98 : 0) + e + fl
      i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))
    }
    for (let i = N; i >= 0; i--) {
      const y = lerp(1.1, sh.dos, i / N), fl = (0.05 + 0.1 * sh.vol) * Math.max(0, 0.92 - y)
      const x = Math.max(rAtY(Math.max(y, 0.6)), y < 0.69 ? rW * 0.98 : 0) + e + fl
      ctx.lineTo(X(-x), Y(y))
    }
    ctx.closePath(); ctx.fill()
  }
}

/** La calotte vue de face : du bord du front (et des mèches qui encadrent) jusqu'au sommet, l'antenne au milieu. */
function cheminCalotte(ctx, X, Y, sh, e, pmax = 1.5) {
  const N = 60, tip = sh.ras ? 0 : sh.tx.tip
  ctx.beginPath()
  for (let i = 0; i <= N; i++) {
    const p = -pmax + (2 * pmax * i) / N
    let y = Math.min(H - 0.03, yFin(p, sh))
    const zone = Math.abs(p) < 0.84 ? 0.55 : 1.1
    y -= tip * zone * Math.abs(Math.sin((p * sh.tx.n) / 2)) * (sh.co === 'frange' ? 0.4 : 1)
    const x = rAtY(Math.min(y, H - 0.03)) * Math.sin(p) * (1 + e * 0.6)
    i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))
  }
  const yBas = Math.min(H - 0.03, yFin(pmax, sh))
  const b = sh.afro ? () => 0 : (i) => sh.tx.bosse * Math.abs(Math.sin(i * 1.7))
  for (const [x, y] of profilDecale(yBas, e, b)) ctx.lineTo(X(x), Y(y))
  ctx.closePath()
}

function dessinerCheveuxDevant(ctx, X, Y, k, sh, cols) {
  if (!sh) return
  const e = enveloppe(sh)
  if (sh.ras) {
    ctx.save(); cheminCalotte(ctx, X, Y, sh, 0.008); ctx.clip()
    ctx.fillStyle = cols.base; ctx.globalAlpha = 0.3; ctx.fillRect(X(-1), Y(H + 0.1), 2 * k, 0.6 * k)
    ctx.globalAlpha = 0.6
    for (let i = 0; i < 160; i++) {
      const x = (((i * 73) % 100) / 100 - 0.5) * 1.2, y = 1.05 + ((i * 41) % 100) / 100 * 0.36
      ctx.beginPath(); ctx.arc(X(x), Y(y), 0.006 * k, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore(); ctx.globalAlpha = 1
    return
  }
  const cote = sh.co === 'cotes_rases' ? 0.7 : 1.5
  cheminCalotte(ctx, X, Y, sh, e, cote)
  const g = ctx.createLinearGradient(X(-0.4), Y(H + 0.1), X(0.3), Y(0.9))
  g.addColorStop(0, cols.reflet); g.addColorStop(0.35, cols.base); g.addColorStop(1, cols.ombre)
  ctx.fillStyle = g; ctx.fill()
  ctx.strokeStyle = cols.ombre; ctx.globalAlpha = 0.55; ctx.lineWidth = 0.008 * k; ctx.stroke(); ctx.globalAlpha = 1
  // mèches : lignes depuis la couronne (l'antenne sort entre les mèches)
  ctx.save(); cheminCalotte(ctx, X, Y, sh, e, cote); ctx.clip()
  ctx.lineWidth = 0.009 * k; ctx.lineCap = 'round'
  const n = sh.tx.n
  for (let i = 0; i < n; i++) {
    const p = -1.45 + (2.9 * (i + 0.5)) / n, yb = yFin(p, sh) + 0.02, xb = rAtY(Math.min(yb, H - 0.03)) * Math.sin(p)
    ctx.strokeStyle = i % 3 === 0 && sh.c.meches !== 'aucune' ? cols.meche : cols.ombre
    ctx.globalAlpha = i % 3 === 0 && sh.c.meches !== 'aucune' ? 0.9 : 0.35
    if (i % 3 === 0 && sh.c.meches !== 'aucune') ctx.lineWidth = 0.022 * k
    else ctx.lineWidth = 0.009 * k
    ctx.beginPath(); ctx.moveTo(X(xb * 0.15), Y(H + e * 0.5))
    if (sh.tx.bosse > 0.02) {
      for (let j = 1; j <= 6; j++) { const u = j / 6; ctx.lineTo(X(lerp(xb * 0.15, xb, u) + Math.sin(u * 12 + i) * 0.015), Y(lerp(H + e * 0.5, yb, u))) }
    } else ctx.quadraticCurveTo(X(xb * 0.9), Y(H - 0.02), X(xb), Y(yb))
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  // reflet : une bande dentelée sur le dessus, côté lumière
  ctx.strokeStyle = cols.reflet; ctx.globalAlpha = 0.75; ctx.lineWidth = 0.03 * k
  ctx.beginPath(); ctx.arc(X(-0.05), Y(1.02), 0.32 * k, 3.75, 4.5); ctx.stroke()
  ctx.restore(); ctx.globalAlpha = 1
  if (sh.co === 'cotes_rases') {
    ctx.fillStyle = cols.base; ctx.globalAlpha = 0.45
    for (let i = 0; i < 80; i++) {
      const s = i % 2 ? 1 : -1, y = 0.98 + ((i * 29) % 100) / 100 * 0.17, x = s * (rAtY(y) - 0.02 - ((i * 13) % 10) / 100)
      ctx.beginPath(); ctx.arc(X(x), Y(y), 0.006 * k, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  if (sh.co === 'queue_de_cheval') {
    ctx.strokeStyle = cols.base; ctx.lineWidth = 0.1 * k; ctx.lineCap = 'round'
    const x0 = rAtY(1.12) * 0.9
    ctx.beginPath(); ctx.moveTo(X(x0), Y(1.12)); ctx.quadraticCurveTo(X(x0 + 0.2), Y(1.05), X(x0 + 0.12), Y(0.62)); ctx.stroke()
    ctx.strokeStyle = cols.ombre; ctx.lineWidth = 0.012 * k; ctx.globalAlpha = 0.5
    ctx.beginPath(); ctx.moveTo(X(x0 + 0.02), Y(1.1)); ctx.quadraticCurveTo(X(x0 + 0.2), Y(1.0), X(x0 + 0.12), Y(0.66)); ctx.stroke(); ctx.globalAlpha = 1
    ctx.fillStyle = '#E0557A'; ctx.beginPath(); ctx.ellipse(X(x0 + 0.02), Y(1.11), 0.04 * k, 0.03 * k, 0.4, 0, Math.PI * 2); ctx.fill()
  }
}

function dessinerLunettes(ctx, X, Y, k, f) {
  const ty = f.lunettes.type
  if (ty === 'aucune' || !MONTURES[ty]) return
  const M = MONTURES[ty], pts = M.pts(), [base] = PAL_MONTURE[f.lunettes.couleur || 'noir']
  const cy = 0.9 + M.dy
  for (const s of [-1, 1]) {
    ctx.beginPath()
    pts.forEach(([x, y], i) => { const px = X(s * 0.2 + s * x), py = Y(cy + y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py) })
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill()
    ctx.strokeStyle = base; ctx.globalAlpha = f.lunettes.couleur === 'transparent' ? 0.8 : 1
    ctx.lineWidth = Math.max(1, M.r * 2 * k); ctx.stroke(); ctx.globalAlpha = 1
    // reflet du verre
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.012 * k
    ctx.beginPath(); ctx.moveTo(X(s * 0.2 - 0.06), Y(cy + 0.05)); ctx.lineTo(X(s * 0.2 - 0.01), Y(cy + 0.09)); ctx.stroke()
    // branche vers l'oreille
    ctx.strokeStyle = base; ctx.lineWidth = Math.max(1, M.r * 1.6 * k)
    const bx = s * (0.2 + pts.reduce((m, [x]) => Math.max(m, x), 0))
    ctx.beginPath(); ctx.moveTo(X(bx), Y(cy + 0.03)); ctx.lineTo(X(s * rAtY(cy + 0.03) * 0.98), Y(cy + 0.04)); ctx.stroke()
  }
  ctx.strokeStyle = base; ctx.lineWidth = Math.max(1, M.r * 1.6 * k)
  const xin = 0.2 - pts.reduce((m, [x]) => Math.max(m, -x), 0)
  ctx.beginPath(); ctx.moveTo(X(-xin), Y(cy + 0.02)); ctx.quadraticCurveTo(X(0), Y(cy + 0.05), X(xin), Y(cy + 0.02)); ctx.stroke()
  if (ty === 'aviateur') { ctx.beginPath(); ctx.moveTo(X(-xin - 0.01), Y(cy + 0.09)); ctx.lineTo(X(xin + 0.01), Y(cy + 0.09)); ctx.stroke() }
}

function dessinerBoucles(ctx, X, Y, k, f) {
  const ty = f.oreilles.boucles
  if (ty === 'aucune' || f.couvre_chef === 'foulard') return
  for (const s of [-1, 1]) {
    const x = X(s * (rAtY(OREILLE_Y) * 0.99)), y = Y(OREILLE_Y)
    ctx.fillStyle = PAL_DIVERS.bijou; ctx.strokeStyle = PAL_DIVERS.bijou
    if (ty === 'puces') { ctx.beginPath(); ctx.arc(x, y, 0.028 * k, 0, Math.PI * 2); ctx.fill() }
    else if (ty === 'anneaux') { ctx.lineWidth = 0.016 * k; ctx.beginPath(); ctx.arc(x, y + 0.045 * k, 0.045 * k, 0, Math.PI * 2); ctx.stroke() }
    else {
      ctx.lineWidth = 0.012 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 0.06 * k); ctx.stroke()
      ctx.fillStyle = PAL_DIVERS.goutte; ctx.beginPath(); ctx.ellipse(x, y + 0.09 * k, 0.03 * k, 0.04 * k, 0, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = PAL_DIVERS.bijouReflet; ctx.beginPath(); ctx.arc(x - 0.008 * k, y - 0.008 * k, 0.009 * k, 0, Math.PI * 2); ctx.fill()
  }
}

function dome(ctx, X, Y, yBas, ep) {
  ctx.beginPath()
  profilDecale(yBas, ep).forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))))
  ctx.closePath()
}

function dessinerCouvreChef(ctx, X, Y, k, f, e) {
  const cc = f.couvre_chef
  if (!cc || cc === 'aucun') return
  const col = PAL_COUVRE[cc], ep = e + 0.03
  if (cc === 'bonnet') {
    dome(ctx, X, Y, 1.08, ep + 0.02); ctx.fillStyle = col; ctx.fill()
    ctx.strokeStyle = 'rgba(120,70,10,.25)'; ctx.lineWidth = 0.012 * k
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(X(i * 0.11), Y(1.1)); ctx.quadraticCurveTo(X(i * 0.09), Y(1.3), X(i * 0.02), Y(H + ep)); ctx.stroke() }
    ctx.fillStyle = '#D18F25'; ctx.beginPath()
    ctx.moveTo(X(-(rAtY(1.08) + ep + 0.03)), Y(1.07)); ctx.lineTo(X(rAtY(1.08) + ep + 0.03), Y(1.07))
    ctx.lineTo(X(rAtY(1.17) + ep + 0.03), Y(1.17)); ctx.lineTo(X(-(rAtY(1.17) + ep + 0.03)), Y(1.17)); ctx.closePath(); ctx.fill()
  } else if (cc === 'casquette') {
    dome(ctx, X, Y, 1.14, ep); ctx.fillStyle = col; ctx.fill()
    ctx.fillStyle = '#3E54A8'; ctx.beginPath(); ctx.ellipse(X(0.05), Y(1.14), 0.52 * k, 0.06 * k, -0.05, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(X(0), Y(H + ep), 0.025 * k, 0, Math.PI * 2); ctx.fill()
  } else if (cc === 'bandeau') {
    ctx.fillStyle = col; ctx.beginPath()
    ctx.moveTo(X(-(rAtY(1.16) + ep)), Y(1.16)); ctx.quadraticCurveTo(X(0), Y(1.2), X(rAtY(1.16) + ep), Y(1.16))
    ctx.lineTo(X(rAtY(1.25) + ep), Y(1.25)); ctx.quadraticCurveTo(X(0), Y(1.29), X(-(rAtY(1.25) + ep)), Y(1.25)); ctx.closePath(); ctx.fill()
  } else if (cc === 'foulard') {
    // encadre le visage, cache cheveux et oreilles
    ctx.beginPath()
    const N = 30
    for (let i = 0; i <= N; i++) { const y = lerp(0.5, H, i / N); ctx.lineTo(X(rAtY(Math.max(y, 0.62)) + 0.06), Y(y + (i === N ? 0.06 : 0))) }
    for (let i = N; i >= 0; i--) { const y = lerp(0.5, H, i / N); ctx.lineTo(X(-(rAtY(Math.max(y, 0.62)) + 0.06)), Y(y + (i === N ? 0.06 : 0))) }
    ctx.closePath()
    ctx.moveTo(X(0.4), Y(0.66))
    ctx.bezierCurveTo(X(0.47), Y(0.9), X(0.36), Y(1.14), X(0), Y(1.14))
    ctx.bezierCurveTo(X(-0.36), Y(1.14), X(-0.47), Y(0.9), X(-0.4), Y(0.66))
    ctx.quadraticCurveTo(X(0), Y(0.56), X(0.4), Y(0.66))
    ctx.fillStyle = col; ctx.fill('evenodd')
    ctx.fillStyle = 'rgba(255,248,235,.55)'
    for (let i = 0; i < 40; i++) {
      const x = (((i * 37) % 100) / 100 - 0.5) * 1.3, y = 1.17 + ((i * 53) % 100) / 100 * 0.22
      if (Math.abs(x) < rAtY(y)) { ctx.beginPath(); ctx.arc(X(x), Y(y), 0.012 * k, 0, Math.PI * 2); ctx.fill() }
    }
  } else if (cc === 'chapeau') {
    ctx.fillStyle = col
    ctx.beginPath(); ctx.ellipse(X(0), Y(1.2), (rAtY(1.2) + ep + 0.2) * k, 0.07 * k, 0.04, 0, Math.PI * 2); ctx.fill()
    dome(ctx, X, Y, 1.2, ep + 0.04); ctx.fill()
    ctx.fillStyle = '#C25B3F'; ctx.fillRect(X(-(rAtY(1.24) + ep + 0.03)), Y(1.28), 2 * (rAtY(1.24) + ep + 0.03) * k, 0.05 * k)
  } else if (cc === 'serre_tete') {
    ctx.strokeStyle = col; ctx.lineWidth = 0.035 * k; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(X(-(rAtY(1.08) + ep * 0.5)), Y(1.08)); ctx.bezierCurveTo(X(-0.45), Y(1.4), X(0.45), Y(1.4), X(rAtY(1.08) + ep * 0.5), Y(1.08)); ctx.stroke()
  }
}

/**
 * Dessine Pilou (et ses traits) dans un rectangle. `t` (ms) fait seulement pulser le point ambre.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ t?: number, face?: object }} [opts]
 */
export function dessinerPilou(ctx, largeur, hauteur, fiche, opts = {}) {
  const t = opts.t || 0
  const k = Math.min(hauteur / 2.05, largeur / 1.75)
  const cx = largeur / 2, base = hauteur - 0.08 * k
  const X = (x) => cx + x * k, Y = (y) => base - y * k
  ctx.save()
  ctx.clearRect(0, 0, largeur, hauteur)
  // ombre de contact
  const og = ctx.createRadialGradient(X(0), Y(0), 0, X(0), Y(0), 0.7 * k)
  og.addColorStop(0, 'rgba(60,80,60,.22)'); og.addColorStop(1, 'rgba(60,80,60,0)')
  ctx.fillStyle = og; ctx.beginPath(); ctx.ellipse(X(0), Y(0), 0.7 * k, 0.12 * k, 0, 0, Math.PI * 2); ctx.fill()

  const f = fiche || null
  const foulard = f?.couvre_chef === 'foulard'
  const sh = f && !foulard ? formeCheveux2d(f) : null
  const cols = f ? couleursCheveux(f) : null
  if (sh) dessinerCheveuxDerriere(ctx, X, Y, k, sh, cols)
  dessinerCorps(ctx, X, Y, k)
  const peintre = creerPeintre()
  peintre.set(f, {})
  const F = { ...FACE0, mU: 0.034, mL: 0.034, blush: 0.5, ...(opts.face || {}) }
  if (f) peintre.formeYeux(F)
  drawFaceAt(ctx, X, Y, k, F, f ? peintre : null)
  if (f) {
    dessinerLunettes(ctx, X, Y, k, f)
    if (sh) dessinerCheveuxDevant(ctx, X, Y, k, sh, cols)
    dessinerBoucles(ctx, X, Y, k, f)
  }
  if (f) dessinerCouvreChef(ctx, X, Y, k, f, sh ? enveloppe(sh) : 0)
  dessinerAntenne(ctx, X, Y, k, t) // elle sort toujours entre les mèches (et par le trou des couvre-chefs)
  ctx.restore()
  return k
}
