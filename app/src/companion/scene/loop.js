/**
 * Boucle de rendu de la scène : 30 images par seconde au plus, 20 quand rien d'autre que la respiration ne bouge,
 * et 0 en pause (hors écran, application en arrière-plan, onglet caché). Le temps de la scène est le temps écoulé
 * hors pause : une animation reprend exactement là où elle s'était arrêtée.
 */
export function createLoop({ render, raf = (fn) => requestAnimationFrame(fn), caf = (id) => cancelAnimationFrame(id), now = () => performance.now() } = {}) {
  const reasons = new Set()
  let handle = null
  let last = null
  let sceneTime = 0
  let lastRender = -Infinity
  let fps = 30
  let running = false

  function tick() {
    handle = null
    if (!running || reasons.size) return
    const t = now()
    const dt = last == null ? 0 : Math.min(100, t - last)
    last = t
    sceneTime += dt
    if (sceneTime - lastRender >= 1000 / fps - 2 || lastRender < 0) {
      const frameStart = now()
      render({ t: sceneTime, dt: lastRender < 0 ? 0 : sceneTime - lastRender })
      lastRender = sceneTime
      loop.lastFrameMs = now() - frameStart
    }
    schedule()
  }

  function schedule() {
    if (handle == null && running && !reasons.size) handle = raf(tick)
  }

  const loop = {
    lastFrameMs: 0,
    start() {
      running = true
      last = null
      schedule()
    },
    stop() {
      running = false
      if (handle != null) caf(handle)
      handle = null
    },
    /** Met en pause pour une raison (« hors-ecran », « arriere-plan », « onglet »…) ; plusieurs raisons se cumulent. */
    pause(reason) {
      reasons.add(reason)
      if (handle != null) caf(handle)
      handle = null
    },
    resume(reason) {
      reasons.delete(reason)
      last = null
      schedule()
    },
    setFps(value) {
      fps = Math.max(1, Math.min(60, value))
    },
    get paused() {
      return reasons.size > 0 || !running
    },
    get time() {
      return sceneTime
    },
    get fps() {
      return fps
    },
  }
  return loop
}
