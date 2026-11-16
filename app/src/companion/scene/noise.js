/** Hasard à graine et bruit 1D lissé (sans dépendance), pour une scène déterministe. */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash1(i, seed) {
  let h = Math.imul(i | 0, 374761393) + Math.imul(seed | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (((h ^ (h >>> 16)) >>> 0) / 4294967296) * 2 - 1
}

/** Bruit de valeur 1D lissé, dans [−1, 1]. */
export function valueNoise1(x, seed = 0) {
  const i = Math.floor(x)
  const f = x - i
  const s = f * f * (3 - 2 * f)
  return hash1(i, seed) * (1 - s) + hash1(i + 1, seed) * s
}
