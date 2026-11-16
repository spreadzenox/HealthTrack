/**
 * Courbes et ressorts nommés de la SPEC île (§ 2). Fonctions pures du temps : aucune n'accumule d'état.
 */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t) => ((ax * t + bx) * t + cx) * t
  const sy = (t) => ((ay * t + by) * t + cy) * t
  const dsx = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x
      const d = dsx(t)
      if (Math.abs(err) < 1e-6 || Math.abs(d) < 1e-6) break
      t -= err / d
    }
    t = Math.min(1, Math.max(0, t))
    return sy(t)
  }
}

export const EASE = {
  std: cubicBezier(0.2, 0, 0, 1),
  out: cubicBezier(0.22, 1, 0.36, 1),
  in: cubicBezier(0.55, 0, 0.8, 0.2),
  io: cubicBezier(0.65, 0, 0.35, 1),
  back: cubicBezier(0.34, 1.56, 0.64, 1),
  soft: cubicBezier(0.4, 0, 0.2, 1),
}

/** Réponse d'un ressort (masse 1) à un échelon, t en ms : 0 au départ, tend vers 1. */
export function spring(t, stiffness, damping) {
  if (t <= 0) return 0
  const s = t / 1000
  const w0 = Math.sqrt(stiffness)
  const zeta = damping / (2 * w0)
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    return 1 - Math.exp(-zeta * w0 * s) * (Math.cos(wd * s) + ((zeta * w0) / wd) * Math.sin(wd * s))
  }
  return 1 - Math.exp(-w0 * s) * (1 + w0 * s)
}

export const SPRINGS = {
  fleur: [260, 9],
  atterrissage: [320, 12],
  humeur: [200, 16],
  retour: [170, 22],
}

export const clamp01 = (x) => Math.min(1, Math.max(0, x))
/** Avancement 0…1 de t dans [a, b]. */
export const seg = (t, a, b) => clamp01((t - a) / (b - a))
