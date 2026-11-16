/**
 * Courbes du monde de Pilou (specs/ile.SPEC.md § 2), en fonctions pures : une fraction t ∈ [0, 1] donne une fraction
 * de progression. Mêmes noms que la SPEC, pour que la scène et le monde parlent la même langue.
 */

/** Courbe de Bézier cubique CSS (x1, y1, x2, y2) → fonction t ↦ y, résolue par Newton puis dichotomie. */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (s) => ((ax * s + bx) * s + cx) * s
  const sampleY = (s) => ((ay * s + by) * s + cy) * s
  const slopeX = (s) => (3 * ax * s + 2 * bx) * s + cx
  const solve = (x) => {
    let s = x
    for (let i = 0; i < 8; i += 1) {
      const err = sampleX(s) - x
      if (Math.abs(err) < 1e-6) return s
      const d = slopeX(s)
      if (Math.abs(d) < 1e-6) break
      s -= err / d
    }
    let lo = 0
    let hi = 1
    s = x
    for (let i = 0; i < 30; i += 1) {
      const v = sampleX(s)
      if (Math.abs(v - x) < 1e-6) return s
      if (v < x) lo = s
      else hi = s
      s = (lo + hi) / 2
    }
    return s
  }
  return (t) => {
    if (!(t > 0)) return 0
    if (t >= 1) return 1
    return sampleY(solve(t))
  }
}

export const EASE = Object.freeze({
  std: cubicBezier(0.2, 0, 0, 1),
  out: cubicBezier(0.22, 1, 0.36, 1),
  in: cubicBezier(0.55, 0, 0.8, 0.2),
  io: cubicBezier(0.65, 0, 0.35, 1),
  back: cubicBezier(0.34, 1.56, 0.64, 1),
  soft: cubicBezier(0.4, 0, 0.2, 1),
})

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

export const lerp = (a, b, t) => a + (b - a) * t

/** « #RRGGBB » → [r, g, b] entre 0 et 255. */
export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''))
  if (!m) throw new Error(`couleur invalide : ${hex}`)
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex([r, g, b]) {
  const h = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase()
}

/** Mélange de deux couleurs hexadécimales (dans l'espace sRGB, comme les maquettes). */
export function mixHex(a, b, t) {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return rgbToHex([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)])
}
