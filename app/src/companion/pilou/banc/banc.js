// Banc d'essai de Pilou, hors de l'Accueil (servi par Vite : /src/companion/pilou/banc/index.html).
// Paramètres d'adresse : expr, t (ms : image figée), taille (px CSS), dpr, capture (fond transparent),
// qualite (haut | moyen), reduit, iris (#hex), camera (il vous regarde), nom.
// window.banc : seek(τ), expression(e), mesureMenthe(), stats(), pret.
import * as THREE from 'three'
import { createPilou } from '../createPilou.js'
import { createGestes } from '../gestes.js'
import { lumiereReference } from '../lumiereReference.js'
import { rAtY, BY } from '../forme.js'
import { ecartMenthe } from '../couleur.js'

const q = new URLSearchParams(location.search)
const capture = q.has('capture')
if (capture) document.body.classList.add('capture')
const taille = Number(q.get('taille') || 360)
const dpr = Number(q.get('dpr') || Math.min(2, devicePixelRatio || 1))
const fige = q.has('t')

const canvas = document.getElementById('vue')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(dpr)
renderer.setSize(taille, taille * 1.1)
renderer.setClearColor(0x000000, 0)
const scene = new THREE.Scene()
if (!capture) {
  // ciel abricot avec brume chaude, comme derrière l'île
  const bg = document.createElement('canvas')
  bg.width = 4; bg.height = 256
  const x = bg.getContext('2d')
  const g = x.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#FFE2C4'); g.addColorStop(0.6, '#FFC9A6'); g.addColorStop(1, '#F7D9B8')
  x.fillStyle = g; x.fillRect(0, 0, 4, 256)
  const t = new THREE.CanvasTexture(bg); t.colorSpace = THREE.SRGBColorSpace
  scene.background = t
}
const lum = lumiereReference(THREE, renderer, scene)
const cam = new THREE.PerspectiveCamera(24, 1 / 1.1, 0.1, 50)
if (q.get('cadre') === 'serre') { cam.position.set(0, 1.0, 4.9); cam.lookAt(0, 0.9, 0) } else { cam.position.set(0, 1.0, 5.6); cam.lookAt(0, 0.86, 0) }

const pilou = createPilou(THREE, {
  qualite: q.get('qualite') || 'haut',
  reduit: q.has('reduit'),
  iris: q.get('iris') || undefined,
  nom: q.get('nom') || 'Pilou',
  balance: q.get('bal') ? q.get('bal').split(',').map(Number) : undefined,
  maintenant: fige ? () => new Date(2026, 10, 16, 10, 9, 30) : undefined,
})
pilou.setLumiere(lum.dirSoleil)
scene.add(pilou.object)
if (q.get('expr')) pilou.setExpression(q.get('expr'), 0)
if (q.has('camera')) pilou.regarderCamera(true, 0)

const etat = document.getElementById('etat')
function render(τ) {
  const e = pilou.update(τ, cam)
  renderer.render(scene, cam)
  if (etat.textContent !== e.texte) etat.textContent = e.texte
}

// gestes au doigt sur Pilou
const gestes = createGestes()
const ray = new THREE.Raycaster()
const ndc = new THREE.Vector2()
let clock = 0
const t0 = performance.now()
const now = () => (fige ? clock : performance.now() - t0)
function zone(ev) {
  const r = canvas.getBoundingClientRect()
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(ndc, cam)
  return pilou.toucher(ray)
}
const jouer = (gs) => { for (const g of gs) pilou.geste(g, now()) }
canvas.addEventListener('pointerdown', (ev) => {
  const z = zone(ev)
  if (!z) return
  canvas.setPointerCapture(ev.pointerId)
  jouer(gestes.down(ev.clientX, ev.clientY, now(), z === 'belly'))
})
canvas.addEventListener('pointermove', (ev) => jouer(gestes.move(ev.clientX, ev.clientY, now())))
canvas.addEventListener('pointerup', (ev) => jouer(gestes.up(ev.clientX, ev.clientY, now())))
canvas.addEventListener('pointercancel', () => jouer(gestes.cancel(now())))

// boutons : les expressions et les réactions
const outils = document.getElementById('outils')
const bouton = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; outils.append(b) }
for (const e of ['tranquille', 'content', 'rayonnant', 'curieux', 'surpris', 'concentre', 'absorbe', 'mange', 'endormi', 'fier', 'reconfortant', 'salut', 'reveil']) bouton(e, () => pilou.setExpression(e, now()))
bouton('humeur ↑', () => { pilou.suivreHumeur(now()); pilou.setHumeur(Math.min(1, pilou.animateur.humeur(now()) + 0.34), now()); pilou.react('sautille', now()); pilou.lueur(now()) })
bouton('il vous regarde', () => pilou.regarderCamera(!(pilou.pose()?.camW > 0.5), now()))
bouton('mouvements réduits', () => pilou.setReduit(!pilou.animateur.reduit))

if (!fige) {
  const loop = () => { render(now()); requestAnimationFrame(loop) }
  requestAnimationFrame(loop)
} else {
  // image figée : on rejoue les secondes qui précèdent pour que les ressorts soient dans leur état
  const τ = Number(q.get('t'))
  for (let s = Math.max(0, τ - 1500); s < τ; s += 1000 / 30) pilou.update(s, cam)
  clock = τ
  render(τ)
}

// le test du menthe : moyenne de petites zones éclairées du corps (flancs du haut, hors ventre et visage)
function mesureMenthe() {
  render(now())
  const gl = renderer.getContext()
  const W = gl.drawingBufferWidth, Hh = gl.drawingBufferHeight
  const pts = []
  for (const [y, phi] of [[1.12, -0.55], [1.12, 0.55], [1.25, -0.3], [1.25, 0.3], [0.98, -0.8], [0.98, 0.8]]) {
    const r = rAtY(y)
    const p = new THREE.Vector3(Math.sin(phi) * r, y + BY, Math.cos(phi) * r)
    pilou.kit.body.localToWorld(p)
    p.project(cam)
    const px = Math.round((p.x * 0.5 + 0.5) * W), py = Math.round((p.y * 0.5 + 0.5) * Hh)
    const buf = new Uint8Array(5 * 5 * 4)
    gl.readPixels(px - 2, py - 2, 5, 5, gl.RGBA, gl.UNSIGNED_BYTE, buf)
    const rgb = [0, 0, 0]
    for (let i = 0; i < 25; i++) for (let c = 0; c < 3; c++) rgb[c] += buf[i * 4 + c] / 25
    pts.push({ y, phi, rgb: rgb.map(Math.round), dE: +ecartMenthe(rgb).toFixed(2) })
  }
  const moyen = pts.reduce((s, p) => s + p.dE, 0) / pts.length
  return { points: pts, moyen: +moyen.toFixed(2), max: Math.max(...pts.map((p) => p.dE)) }
}

window.banc = {
  seek(τ) { clock = τ; render(τ) },
  expression(e, τ = now()) { pilou.setExpression(e, τ) },
  mesureMenthe,
  stats: () => pilou.stats(),
  pilou,
  pret: true,
}
