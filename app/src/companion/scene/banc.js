// Banc d'essai de la scène (développement seulement) : rendu fixe à t, mesure du temps d'image et des triangles.
import { createStage } from './stage.js'

const Q = new URLSearchParams(location.search)
const canvas = document.getElementById('c')
const w = +(Q.get('w') || 360), h = +(Q.get('h') || 320)
canvas.style.width = `${w}px`
canvas.style.height = `${h}px`
// le Pilou du lot PILOU s'il est là (comme la vraie scène), sinon le Pilou simple
const pilouMods = import.meta.glob('../pilou/index.js')
const pilouMod = Q.get('simple') === '1' ? null : await pilouMods['../pilou/index.js']?.().catch(() => null)
const stage = createStage(canvas, { width: w, height: h, tier: Q.get('q') || 'haut', reducedMotion: Q.get('rm') === '1', createPilou: pilouMod?.createPilou })
if (Q.get('flowers') === '1') {
  const angles = [-74, -44, -14, 30, 58, 84]
  const themes = ['peche', 'menthe', 'miel', 'lilas', 'rose', 'nuit']
  stage.flowers.set(angles.map((a, i) => ({ id: i, theme: themes[i], angleDeg: a, radius: 0.9 })))
}
if (Q.get('gifts') === '1') stage.gifts.setItems(['arbuste', 'lanterne', 'echarpe', 'galets', 'papillon', 'nuage', ...(Q.get('j7') === '1' ? [] : ['arc-en-ciel'])])
if (Q.get('j7') === '1') stage.gifts.place('arc-en-ciel', 0)
if (Q.get('soir') === '1') stage.applyLight({ phase: 'soir', sun: { color: '#FF9F72', intensity: 2.2 } })
if (Q.get('pluie') === '1') stage.setWeather({ effect: 'pluie', particles: { kind: 'pluie', count: 40 } })
if (Q.get('neige') === '1') stage.setWeather({ effect: 'neige', particles: { kind: 'neige', count: 30 }, accessory: 'echarpe' })
if (Q.get('saison')) stage.setSeason(Q.get('saison'))
if (Q.get('box')) stage.gifts.openBox(0)
if (Q.get('heure')) {
  const { lightAt } = await import('../world/index.js')
  const [hh, mm] = Q.get('heure').split(':').map(Number)
  const l = lightAt(hh * 60 + (mm || 0))
  stage.applyLight(l)
  if (l.asleep) stage.pilou.setExpression('endormi')
  document.body.style.background = Q.get('fond') === '1' ? `linear-gradient(${l.sky.top}, ${l.sky.bottom})` : 'transparent'
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
if (Q.get('box')) window.seek(+Q.get('box'))
window.ready = true
