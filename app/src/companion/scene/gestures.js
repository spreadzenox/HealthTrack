/**
 * Reconnaissance des gestes sur Pilou (SPEC personnage § 7) : toucher, appui long, double toucher, glisser,
 * chatouiller. Pure : on lui passe des points `{ x, y, t }` (px, ms) et elle rend les gestes reconnus.
 */
export const TAP_MS = 250
export const TAP_PX = 10
export const LONG_MS = 350
export const DOUBLE_MS = 300
export const DOUBLE_PX = 30
export const SWIPE_PX = 60
export const TICKLE_TURNS = 3
export const TICKLE_MS = 900

export function createGestureRecognizer() {
  let down = null
  let lastTap = null
  let longFired = false
  let turns = []
  let lastDx = 0
  let prev = null
  let swiped = false
  let tickled = false

  return {
    down(p) {
      down = p
      prev = p
      longFired = false
      turns = []
      lastDx = 0
      swiped = false
      tickled = false
      return []
    },
    move(p) {
      if (!down) return []
      const out = []
      const dx = p.x - prev.x
      if (Math.abs(dx) > 2) {
        if (lastDx && Math.sign(dx) !== Math.sign(lastDx)) {
          turns.push(p.t)
          turns = turns.filter((t) => p.t - t <= TICKLE_MS)
          if (turns.length >= TICKLE_TURNS && !tickled) {
            tickled = true
            out.push({ gesture: 'tickle', x: p.x, y: p.y })
          }
        }
        lastDx = dx
      }
      prev = p
      if (!swiped && !tickled && Math.abs(p.x - down.x) > SWIPE_PX && turns.length === 0) {
        swiped = true
        out.push({ gesture: 'swipe', x: p.x, y: p.y, dir: p.x > down.x ? 'right' : 'left' })
      }
      return out
    },
    /** À appeler régulièrement pendant l'appui (ou au relâchement) pour l'appui long. */
    hold(t) {
      if (!down || longFired || swiped || tickled) return []
      if (t - down.t >= LONG_MS && Math.hypot(prev.x - down.x, prev.y - down.y) < TAP_PX) {
        longFired = true
        return [{ gesture: 'longpress-start', x: down.x, y: down.y }]
      }
      return []
    },
    up(p) {
      if (!down) return []
      const out = [...this.hold(p.t)]
      const dist = Math.hypot(p.x - down.x, p.y - down.y)
      if (longFired) out.push({ gesture: 'longpress-end', x: p.x, y: p.y })
      else if (!swiped && !tickled && p.t - down.t < TAP_MS && dist < TAP_PX) {
        if (lastTap && p.t - lastTap.t < DOUBLE_MS && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < DOUBLE_PX) {
          out.push({ gesture: 'doubletap', x: p.x, y: p.y })
          lastTap = null
        } else {
          out.push({ gesture: 'tap', x: p.x, y: p.y })
          lastTap = p
        }
      }
      down = null
      return out
    },
    cancel() {
      down = null
    },
  }
}
