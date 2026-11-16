/**
 * La nuit sur l'îlot (refonte « Compagnon », étape 10 ; specs/ile.SPEC.md § 5) : dès l'heure du coucher, les bulles
 * qui restent deviennent des lucioles qui flânent autour de l'îlot, toujours touchables ; rien ne s'accumule.
 * L'heure vient de la scène (`time:phase` = `nuit`, cycle du jour du lot MONDE) ; sans elle, de 22 h 30 à 5 h.
 */
export const NIGHT_FROM_MIN = 22 * 60 + 30
export const NIGHT_UNTIL_MIN = 5 * 60

export function isNight(now = new Date(), phase = null) {
  if (phase) return phase === 'nuit'
  const m = now.getHours() * 60 + now.getMinutes()
  return m >= NIGHT_FROM_MIN || m < NIGHT_UNTIL_MIN
}

/**
 * Trajet d'une luciole (unités du monde, comme l'orbite) : Lissajous lent, périodes de 24 à 45 s, propre à chaque
 * bulle ; fonction du temps seulement (reprise exacte après une pause).
 */
export function fireflyAt(i, n, tMs) {
  const tx = 24_000 + ((i * 7_919) % 21_000)
  const ty = 31_000 + ((i * 4_271) % 14_000)
  const phi = (2 * Math.PI * i) / Math.max(1, n)
  const a = (2 * Math.PI * tMs) / tx + phi
  const b = (2 * Math.PI * tMs) / ty + phi * 1.7
  return { x: 1.55 * Math.sin(a), y: 1.0 + 0.55 * Math.sin(b), z: 0.9 * Math.cos(a) }
}

export const NIGHT_LABEL = (name) => `${name} dort. Le reste peut attendre demain.`
