// Pilou (lot PILOU) dans la vraie scène de l'Accueil (lot SCÈNE) : captures face aux aperçus du kit, test du menthe
// sous la lumière de la scène, temps d'image. Développement seulement (hors build).
import * as THREE from 'three'
import { createStage } from '../../scene/stage.js'
import { createPilou } from '../index.js'
import { rAtY, BY } from '../forme.js'
import { ecartMenthe } from '../couleur.js'
import { CAMERA } from '../../scene/camera.js'

const Q = new URLSearchParams(location.search)
const canvas = document.getElementById('c')
const w = +(Q.get('w') || 360), h = +(Q.get('h') || 320)
canvas.style.width = `${w}px`
canvas.style.height = `${h}px`
const stage = createStage(canvas, {
  width: w, height: h, tier: Q.get('q') || 'haut', reducedMotion: Q.get('rm') === '1',
  createPilou: (T, o) => createPilou(T, { ...o, balance: Q.get('bal') ? Q.get('bal').split(',').map(Number) : undefined, now: () => new Date(2026, 10, 16, 10, 9, 30) }),
})
const pilou = stage.pilou
if (Q.get('expr')) pilou.setExpression(Q.get('expr'))
if (Q.get('camera')) pilou.lookAt('camera')
if (Q.get('mood')) pilou.setMood(+Q.get('mood'))
window.seek = (t) => {
  window.t = t
  for (let s = Math.max(0, t - 1500); s < t; s += 33) pilou.update(s, 0)
  stage.render(t)
  return stage.stats()
}
window.bench = (n = 60) => {
  const times = []
  for (let i = 0; i < n; i++) { const t0 = performance.now(); stage.renderSynced(i * 33); times.push(performance.now() - t0) }
  times.sort((a, b) => a - b)
  return { median: times[n >> 1], p90: times[Math.floor(n * 0.9)], ...stage.stats() }
}
window.mesureMenthe = () => {
  stage.render(window.t ?? 2000) // lecture dans la même tâche que le rendu (preserveDrawingBuffer est faux)
  const gl = stage.renderer.getContext()
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight
  const cam = new THREE.PerspectiveCamera(CAMERA.fov, w / h, CAMERA.near, CAMERA.far)
  cam.position.set(...CAMERA.position)
  cam.lookAt(new THREE.Vector3(...CAMERA.target))
  cam.updateMatrixWorld()
  const pts = []
  for (const [y, phi] of [[1.12, -0.55], [1.12, 0.55], [1.25, -0.3], [1.25, 0.3], [0.98, -0.8], [0.98, 0.8]]) {
    const r = rAtY(y)
    const p = new THREE.Vector3(Math.sin(phi) * r, y + BY, Math.cos(phi) * r)
    pilou.kit.body.localToWorld(p)
    p.project(cam)
    const px = Math.round((p.x * 0.5 + 0.5) * W), py = Math.round((p.y * 0.5 + 0.5) * H)
    const buf = new Uint8Array(3 * 3 * 4)
    gl.readPixels(px - 1, py - 1, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, buf)
    const rgb = [0, 0, 0]
    for (let i = 0; i < 9; i++) for (let c = 0; c < 3; c++) rgb[c] += buf[i * 4 + c] / 9
    pts.push({ y, phi, rgb: rgb.map(Math.round), dE: +ecartMenthe(rgb).toFixed(2) })
  }
  return { points: pts, moyen: +(pts.reduce((s, p) => s + p.dE, 0) / pts.length).toFixed(2), max: Math.max(...pts.map((p) => p.dE)) }
}
window.stage = stage
window.seek(+(Q.get('t') || 2000))
window.ready = true
