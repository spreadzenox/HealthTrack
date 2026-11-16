// gestes.js — reconnaître les gestes sur Pilou (SPEC personnage § 7), sans DOM ni three.js.
// On lui passe les événements du doigt déjà rapportés à la zone du personnage ; il rend des gestes :
//   { geste: 'toucher' | 'saut' | 'appui' | 'fin-appui' | 'glisser' | 'chatouille' | 'fin-chatouille', t, dir? }
// La scène appelle ensuite pilou.react(...) et la vibration de HAPTIQUE.

export const SEUILS = {
  toucherMs: 250, // appui court
  toucherPx: 10,
  appuiMs: 350, // appui long sans bouger
  doubleMs: 300, // deux touchers rapprochés
  doublePx: 30,
  glisserPx: 60, // glissé horizontal
  chatouilleSens: 3, // changements de sens…
  chatouilleMs: 900, // … en moins de 900 ms, sur le bedon
  chatouillePause: 2000, // pause avant un nouveau fou rire
}

// Vibrations (Capacitor Haptics) : style et nombre de coups, par geste ; réglage de l'app respecté par l'appelant
export const HAPTIQUE = {
  toucher: [{ style: 'LIGHT', at: 0 }],
  appui: [{ style: 'LIGHT', at: 0 }, { style: 'LIGHT', at: 400 }, { style: 'LIGHT', at: 800 }],
  saut: [{ style: 'MEDIUM', at: 660 }], // à la réception (anticipation 130 + vol 440 + 90)
  glisser: [],
  chatouille: [{ style: 'LIGHT', at: 0 }, { style: 'LIGHT', at: 120 }, { style: 'LIGHT', at: 240 }],
}

export function createGestes(seuils = SEUILS) {
  let down = null // { x, y, t, belly }
  let lastTap = null // { x, y, t }
  let holding = false
  let swiped = false
  let tickle = null // { dirs: [{t, s}], on }
  let lastTickleEnd = -1e9
  let tickling = false

  function reset() { down = null; holding = false; swiped = false; tickle = null }

  return {
    /** Doigt posé. belly = le doigt est sur le bedon de Pilou. */
    down(x, y, t, belly = false) {
      down = { x, y, t, belly, lastX: x }
      holding = false
      swiped = false
      tickle = { dirs: [], sens: 0 }
      return []
    },
    move(x, y, t) {
      if (!down) return []
      const out = []
      const dx = x - down.x
      // chatouillis : changements de sens horizontaux rapides sur le ventre
      if (down.belly) {
        const step = x - down.lastX
        if (Math.abs(step) > 2) {
          const s = Math.sign(step)
          if (tickle.sens && s !== tickle.sens) tickle.dirs.push(t)
          tickle.sens = s
          tickle.dirs = tickle.dirs.filter((u) => t - u <= seuils.chatouilleMs)
          if (!tickling && tickle.dirs.length >= seuils.chatouilleSens && t - lastTickleEnd >= seuils.chatouillePause) {
            tickling = true
            out.push({ geste: 'chatouille', t })
          }
        }
        down.lastX = x
      }
      if (!tickling && !swiped && !holding && Math.abs(dx) > seuils.glisserPx && Math.abs(dx) > Math.abs(y - down.y)) {
        swiped = true
        out.push({ geste: 'glisser', t, dir: Math.sign(dx) })
      }
      return out
    },
    /** À appeler à chaque image : détecte l'appui long (≥ 350 ms sans bouger). */
    tick(t, x = down?.x, y = down?.y) {
      if (!down || holding || swiped || tickling) return []
      if (t - down.t >= seuils.appuiMs && Math.hypot(x - down.x, y - down.y) < seuils.toucherPx) {
        holding = true
        return [{ geste: 'appui', t }]
      }
      return []
    },
    up(x, y, t) {
      if (!down) return []
      const out = []
      const dist = Math.hypot(x - down.x, y - down.y)
      if (tickling) {
        tickling = false
        lastTickleEnd = t
        out.push({ geste: 'fin-chatouille', t })
      } else if (holding) out.push({ geste: 'fin-appui', t })
      else if (!swiped && t - down.t < seuils.toucherMs && dist < seuils.toucherPx) {
        // le premier toucher réagit tout de suite ; le second, s'il est rapproché, déclenche le saut
        if (lastTap && t - lastTap.t < seuils.doubleMs && Math.hypot(x - lastTap.x, y - lastTap.y) < seuils.doublePx) {
          out.push({ geste: 'saut', t })
          lastTap = null
        } else {
          out.push({ geste: 'toucher', t })
          lastTap = { x, y, t }
        }
      }
      reset()
      return out
    },
    cancel(t) {
      const out = tickling ? [{ geste: 'fin-chatouille', t }] : holding ? [{ geste: 'fin-appui', t }] : []
      if (tickling) { tickling = false; lastTickleEnd = t }
      reset()
      return out
    },
  }
}
