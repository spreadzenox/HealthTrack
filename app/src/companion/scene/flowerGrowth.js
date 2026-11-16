/**
 * Une fleur par geste (SPEC île § 4) : 1 400 ms, une variable de croissance par partie. Fonction pure du temps écoulé
 * depuis la naissance de la fleur (ms). Mouvements réduits : fondu de 200 ms, la fleur apparaît entière.
 */
import { EASE, spring, seg, SPRINGS } from './curves'

export const FLOWER_MS = 1400

export function flowerPose(ms, { reducedMotion = false } = {}) {
  if (ms < 0) return { sprout: 0, stem: 0, bud: 0, bloom: 0, bounce: 1, opacity: 0, done: false }
  if (ms >= FLOWER_MS + 2000) return { sprout: 1, stem: 1, bud: 1, bloom: 1, bounce: 1, opacity: 1, done: true }
  if (reducedMotion) {
    return { sprout: 1, stem: 1, bud: 1, bloom: 1, bounce: 1, opacity: Math.min(1, ms / 200), done: ms >= 200 }
  }
  const u = ms / FLOWER_MS
  const bloomEnd = 0.85 * FLOWER_MS
  return {
    sprout: EASE.out(seg(u, 0, 0.2)),
    stem: EASE.back(seg(u, 0.15, 0.45)),
    bud: EASE.back(seg(u, 0.4, 0.6)),
    bloom: EASE.back(seg(u, 0.58, 0.85)),
    // rebond de la tête (ressort « fleur ») après l'éclosion : 1 = au repos
    bounce: ms < bloomEnd ? 1 : 0.86 + 0.14 * spring(ms - bloomEnd, ...SPRINGS.fleur),
    opacity: 1,
    done: ms >= FLOWER_MS + 600,
  }
}

/** Position d'une fleur dans le repère de l'île (centre = Pilou, +z vers l'écran, rayon du plateau = 1). */
export function flowerPosition(angleDeg, radius, plateauRadius) {
  const a = (angleDeg * Math.PI) / 180
  return [Math.sin(a) * radius * plateauRadius, Math.cos(a) * radius * plateauRadius]
}
