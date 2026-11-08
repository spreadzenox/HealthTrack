/**
 * Graduations rondes d'un axe (POLISH-SIM-3b) : pas de 1, 2, 2,5 ou 5 × 10ⁿ, domaine étendu aux multiples du pas, de 3
 * à 5 graduations. Exemple : 4 651 à 11 759 pas → 4 000, 6 000, 8 000, 10 000, 12 000.
 */
const MANTISSAS = [1, 2, 2.5, 5, 10]

function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw))
  return MANTISSAS.find((m) => m * p >= raw - 1e-12) * p
}

const clean = (v) => +v.toFixed(10)

export function niceAxis(min, max) {
  let lo = min
  let hi = max
  if (!(hi - lo > 1e-9 * Math.max(1, Math.abs(hi)))) {
    const d = Math.abs(lo) * 0.1 || 1
    lo -= d
    hi += d
  }
  let step = niceStep((hi - lo) / 4)
  let a = Math.floor(lo / step) * step
  let b = Math.ceil(hi / step) * step
  while ((b - a) / step > 4 + 1e-9) {
    step = niceStep(step * 1.01)
    a = Math.floor(lo / step) * step
    b = Math.ceil(hi / step) * step
  }
  if (min >= 0 && a < 0) a = 0
  const n = Math.round((b - a) / step)
  const ticks = Array.from({ length: n + 1 }, (_, i) => clean(a + i * step))
  return { lo: clean(a), hi: clean(b), ticks }
}
