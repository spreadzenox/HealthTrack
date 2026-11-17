// visage.js — ce qui se peint sur le visage de la figurine : joues à l'aérographe, rayures « /// », sourcils
// discrets et bouche (six bouches de référence, SPEC § 2). Les yeux, eux, sont de vrais globes 3D (createPilou).
// La toile est projetée de face sur le corps (x ∈ [−0,52 ; 0,52], y ∈ [0,32 ; 1,36]) ; on ne la redessine que si
// un paramètre change (clé de cache).
import { clamp, lerp, sstep, FS, FY, mouthPath, PAL } from './forme.js'

const KEYS = ['ferme', 'blush', 'hatch', 'brow', 'mw', 'mU', 'mL', 'mA', 'mx', 'my', 'mSkew', 'tongue', 'fx', 'fy']
const BROW = ['browY', 'browA', 'browYL', 'browYR', 'lookX', 'lookY', 'es', 'esy']
export function faceKey(F) {
  let k = ''
  for (const n of KEYS) k += Math.round((F[n] ?? 0) * 250) + ',' // pas de 0,004 : on ne renvoie la toile au GPU que si ça se voit
  if (F.brow > 0.01) for (const n of BROW) k += (F[n] ?? 0).toFixed(3) + ','
  return k
}

export function drawVisage(ctx, S, F) {
  const k = S / (2 * FS)
  const X = (x) => (x / (2 * FS) + 0.5) * S
  const Y = (y) => (0.5 - (y - FY) / (2 * FS)) * S
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, S, S)
  ctx.translate(F.fx * k, -F.fy * k)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const s of [-1, 1]) cheek(ctx, X, Y, k, s, F)
  if (F.brow > 0.01) for (const s of [-1, 1]) brow(ctx, X, Y, k, s, F)
  if (F.ferme > 0.01) for (const s of [-1, 1]) cils(ctx, X, Y, k, s, F)
  mouth(ctx, X, Y, k, F)
}

// joues : deux voiles d'aérographe un peu décalés (le geste de la main n'est jamais parfait)
function cheek(c, X, Y, k, s, F) {
  const b = clamp(F.blush)
  const a = 0.74 * Math.min(1, b * 3.2)
  const r = (0.056 + 0.056 * b) * k
  if (a > 0.004) {
    for (const [dx, dy, rr, aa] of [[0, 0, 1, 1], [s * 0.012, 0.006, 0.78, 0.55]]) {
      c.save()
      c.translate(X(s * 0.345 + dx), Y(0.785 + dy))
      c.scale(1, 0.62)
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r * rr)
      g.addColorStop(0, `rgba(255,128,124,${a * aa})`)
      g.addColorStop(0.4, `rgba(255,134,128,${a * aa * 0.8})`)
      g.addColorStop(0.75, `rgba(255,140,136,${a * aa * 0.3})`)
      g.addColorStop(1, 'rgba(255,140,140,0)')
      c.fillStyle = g
      c.beginPath()
      c.arc(0, 0, r * rr, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }
  }
  const h = clamp(F.hatch)
  if (h > 0.01) {
    c.save()
    c.translate(X(s * 0.345), Y(0.79))
    c.strokeStyle = `rgba(226,92,84,${h * 0.9})`
    c.lineWidth = 0.009 * k
    for (let j = -1; j <= 1; j++) {
      const ox = j * 0.03 * k
      c.beginPath()
      c.moveTo(ox - 0.011 * k, 0.013 * k)
      c.lineTo(ox + 0.011 * k, -0.013 * k)
      c.stroke()
    }
    c.restore()
  }
}

// yeux fermés : le trait « ‿ » de la planche, qui suit le bas de l'œil (l'œil 3D s'enfonce sous la paupière)
function cils(c, X, Y, k, s, F) {
  const rx = 0.078 * F.es, ry = 0.098 * F.es
  const cx = s * 0.2, cy = 0.9
  c.strokeStyle = `rgba(43,35,32,${clamp(F.ferme)})`
  c.lineWidth = 0.024 * k
  c.beginPath()
  c.moveTo(X(cx - rx * 0.95), Y(cy - ry * 0.15))
  c.quadraticCurveTo(X(cx), Y(cy - ry * 1.05), X(cx + rx * 0.95), Y(cy - ry * 0.15))
  c.stroke()
}

// sourcils : seulement curieux et surpris ; jamais relevés au centre (= tristesse)
function brow(c, X, Y, k, s, F) {
  const by = 0.9 + 0.098 * F.es * F.esy + 0.07 + F.browY + (s < 0 ? F.browYL : F.browYR) + F.lookY * 0.01
  c.save()
  c.translate(X(s * 0.205 + F.lookX * 0.015), Y(by))
  c.rotate(-F.browA * s)
  c.strokeStyle = `rgba(52,82,70,${clamp(F.brow) * 0.85})`
  c.lineWidth = 0.02 * k
  c.beginPath()
  c.moveTo(-0.042 * k, 0.006 * k)
  c.quadraticCurveTo(0, -0.012 * k, 0.042 * k, 0.006 * k)
  c.stroke()
  c.restore()
}

function mouth(c, X, Y, k, F) {
  const m = mouthPath(c, X, Y, F)
  const gap = m.dL - m.dU
  const lw = lerp(0.03, 0.016, sstep(0, 0.03, gap)) * k
  c.strokeStyle = PAL.bouche
  c.lineWidth = lw
  if (gap > 0.002) {
    const top = Y(m.yc - m.dU * 0.6)
    const bot = Y(m.yc - m.dL)
    const g = c.createLinearGradient(0, top, 0, bot)
    g.addColorStop(0, '#2A0C0A')
    g.addColorStop(0.55, '#4A1714')
    g.addColorStop(1, '#6A2622')
    c.beginPath(); m.upper(); m.lower(); c.closePath()
    c.fillStyle = g
    c.fill()
    if (F.tongue > 0.01) {
      c.save()
      c.beginPath(); m.upper(); m.lower(); c.closePath()
      c.clip()
      const tx = X(m.mx + 0.08 * m.w)
      const ty = Y(m.yc - m.dL + 0.16 * gap)
      const rx = 0.62 * m.w * k
      const ry = Math.max(1, 0.62 * gap * k)
      const tg = c.createRadialGradient(tx, ty - ry * 0.3, 0, tx, ty, rx)
      tg.addColorStop(0, `rgba(255,150,140,${clamp(F.tongue)})`)
      tg.addColorStop(0.7, `rgba(226,104,100,${clamp(F.tongue)})`)
      tg.addColorStop(1, `rgba(170,62,60,${clamp(F.tongue) * 0.9})`)
      c.fillStyle = tg
      c.beginPath()
      c.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }
    c.beginPath(); m.upper(); m.lower(); c.closePath()
    c.stroke()
  } else {
    c.beginPath(); m.upper()
    c.stroke()
  }
  // fossettes aux coins quand le sourire est franc
  const d = sstep(0.036, 0.05, m.dU) * (1 - sstep(0, 0.012, gap))
  if (d > 0.02) {
    c.strokeStyle = PAL.bouche
    c.globalAlpha = d
    c.lineWidth = 0.013 * k
    for (const [P, s] of [[m.L, -1], [m.R, 1]]) {
      c.beginPath()
      c.moveTo(X(P[0] - s * 0.004), Y(P[1] + 0.016))
      c.quadraticCurveTo(X(P[0] + s * 0.012), Y(P[1] + 0.006), X(P[0] + s * 0.006), Y(P[1] - 0.008))
      c.stroke()
    }
    c.globalAlpha = 1
  }
}
