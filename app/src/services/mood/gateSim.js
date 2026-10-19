/** Jeux simulés pour gate.test.js (pas dans l'app). */
export function rng(seed) {
  let a = seed >>> 0
  const u = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const normal = () => Math.sqrt(-2 * Math.log(u() || 1e-12)) * Math.cos(2 * Math.PI * u())
  return { u, normal }
}

const KEYS = ['smile', 'brow', 'eyes', 'mouth', 'valence', 'arousal']

/**
 * `nDays` jours dont ~80 % notés ; `rho(dayIndex)` = lien entre l'humeur du jour et l'indice `valence`
 * (0 = aucun lien, négatif = sens inverse). Notes entières 1–5.
 */
export function simulateDays({ seed, nDays = 120, rho = () => 0, start = '2026-01-01' }) {
  const { u, normal } = rng(seed)
  const t0 = Date.parse(`${start}T00:00:00Z`)
  const days = []
  for (let i = 0; i < nDays; i++) {
    const mood = normal()
    if (u() > 0.8) continue
    const note = Math.min(5, Math.max(1, Math.round(3 + 0.9 * mood + 0.5 * normal())))
    const r = rho(i)
    const face = {}
    for (const k of KEYS) face[k] = normal()
    face.valence = r * mood + Math.sqrt(1 - r * r) * normal()
    days.push({ date: new Date(t0 + i * 86400000).toISOString().slice(0, 10), note, face })
  }
  return days
}
