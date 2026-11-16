// Banc d'essai de la scène (développement seulement) : rendu fixe à t, mesure du temps d'image et des triangles.
import { createStage } from './stage.js'

const Q = new URLSearchParams(location.search)
const canvas = document.getElementById('c')
const w = +(Q.get('w') || 360), h = +(Q.get('h') || 320)
canvas.style.width = `${w}px`
canvas.style.height = `${h}px`
const stage = createStage(canvas, { width: w, height: h, tier: Q.get('q') || 'haut', reducedMotion: Q.get('rm') === '1' })
if (Q.get('flowers') === '1') {
  const angles = [-74, -44, -14, 30, 58, 84]
  const themes = ['peche', 'menthe', 'miel', 'lilas', 'rose', 'nuit']
  stage.flowers.set(angles.map((a, i) => ({ id: i, theme: themes[i], angleDeg: a, radius: 0.9 })))
}
window.seek = (t) => { stage.render(t); return stage.stats() }
window.bench = (n = 60) => {
  const times = []
  for (let i = 0; i < n; i++) { const t0 = performance.now(); stage.renderSynced(i * 33); times.push(performance.now() - t0) }
  times.sort((a, b) => a - b)
  return { median: times[n >> 1], p90: times[Math.floor(n * 0.9)], ...stage.stats() }
}
window.stage = stage
window.seek(+(Q.get('t') || 0))
window.ready = true
