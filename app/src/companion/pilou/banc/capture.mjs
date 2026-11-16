#!/usr/bin/env node
/**
 * Banc d'essai de Pilou dans Chromium (Playwright) : captures, test du menthe, images pré-rendues.
 *
 *   node src/companion/pilou/banc/capture.mjs                 # planche des 12 expressions + test du menthe
 *   node src/companion/pilou/banc/capture.mjs --petits        # images pré-rendues (≈ 240 px) dans pilou/images/
 *   node src/companion/pilou/banc/capture.mjs --out=dossier   # où ranger les captures (défaut : .visual/pilou)
 *
 * Échoue si le menthe éclairé s'écarte de #78D8B4 de plus de ΔE 6 (brief § 7.2) ou si une erreur JS survient.
 */
import { createServer } from 'vite'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'

// Playwright : celui du projet s'il existe, sinon celui installé globalement (comme scripts/visual)
async function loadPlaywright() {
  try { return await import('playwright') } catch {
    const root = execSync('npm root -g').toString().trim()
    return createRequire(resolve(root, 'noop.js'))('playwright')
  }
}
const { chromium } = await loadPlaywright()

const here = dirname(fileURLToPath(import.meta.url))
const app = resolve(here, '../../../..')
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true] }))
const out = resolve(app, args.out || '.visual/pilou')
mkdirSync(out, { recursive: true })

const server = await createServer({ root: app, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } })
await server.listen()
const base = server.resolvedUrls.local[0].replace(/\/$/, '')
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const errors = []
const page = await browser.newPage({ viewport: { width: 420, height: 520 }, deviceScaleFactor: 1 })
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
const url = (p) => `${base}/src/companion/pilou/banc/index.html?${new URLSearchParams(p)}`
const open = async (p) => {
  await page.goto(url(p))
  await page.waitForFunction(() => window.banc?.pret, null, { timeout: 60000 })
}

const EXPR = ['tranquille', 'content', 'rayonnant', 'curieux', 'surpris', 'concentre', 'absorbe', 'rassasie', 'endormi', 'fier', 'reconfortant', 'salut']
// instant de chaque expression où elle se lit le mieux (séquences : leur moment fort)
const AT = { surpris: 450, fier: 600, reconfortant: 2000, salut: 1200 }
let code = 0

if (args.scene) {
  // Pilou dans la vraie scène de l'Accueil : captures et test du menthe sous la lumière de la scène
  await page.setViewportSize({ width: 360, height: 320 })
  const res = {}
  for (const [nom, p] of [['haut', { q: 'haut' }], ['moyen', { q: 'moyen' }], ['reduit', { q: 'haut', rm: '1' }], ['rayonnant', { q: 'haut', mood: '1' }]]) {
    await page.goto(`${base}/src/companion/pilou/banc/scene.html?${new URLSearchParams({ t: 2000, camera: 1, ...p, ...(args.bal ? { bal: args.bal } : {}) })}`)
    await page.waitForFunction(() => window.ready, null, { timeout: 60000 })
    await page.screenshot({ path: resolve(out, `scene-${nom}.png`) })
    res[nom] = { menthe: await page.evaluate(() => window.mesureMenthe()), temps: await page.evaluate(() => window.bench(30)) }
  }
  writeFileSync(resolve(out, 'scene.json'), JSON.stringify(res, null, 2))
  for (const [k, r] of Object.entries(res)) console.log(k, 'ΔE moyen', r.menthe.moyen, 'max', r.menthe.max, 'image', r.temps.median?.toFixed?.(1), 'ms', JSON.stringify(r.temps.pilou))
  if (res.haut.menthe.max > 6) { console.error('Menthe dans la scène : ΔE > 6'); code = 1 }
} else if (args.mesure) {
  await open({ expr: 'tranquille', t: 2000, taille: 360, dpr: 2, ...(args.bal ? { bal: args.bal } : {}) })
  console.log(JSON.stringify(await page.evaluate(() => window.banc.mesureMenthe())))
  await page.locator('#vue').screenshot({ path: resolve(out, 'mesure.png') })
} else if (args.petits) {
  // images pré-rendues des petits Pilou (CONTRAT § 3) : sprites/<expression>.webp, 240 px de haut, fond transparent
  const dir = resolve(app, 'src/companion/pilou/sprites')
  mkdirSync(dir, { recursive: true })
  await page.setViewportSize({ width: 240, height: 240 })
  for (const e of EXPR) {
    await open({ expr: e, t: 1600 + (AT[e] ?? 600), taille: 218, dpr: 1, capture: 1, camera: 1, cadre: 'serre' })
    const data = await page.evaluate(() => document.getElementById('vue').toDataURL('image/webp', 0.86))
    const buf = Buffer.from(data.split(',')[1], 'base64')
    writeFileSync(resolve(dir, `${e}.webp`), buf)
    console.log('petit', e, buf.length, 'octets')
  }
} else {
  for (const [nom, p] of [['haut', {}], ['moyen', { qualite: 'moyen' }], ['reduit', { reduit: 1 }]]) {
    for (const e of nom === 'haut' ? EXPR : ['tranquille', 'rayonnant']) {
      await open({ ...p, expr: e, t: 1600 + (AT[e] ?? 600), taille: 360, dpr: 2, camera: 1 })
      await page.locator('#vue').screenshot({ path: resolve(out, `pilou-${nom}-${e}.png`) })
    }
  }
  await open({ expr: 'tranquille', t: 2000, taille: 360, dpr: 2 })
  const m = await page.evaluate(() => window.banc.mesureMenthe())
  const s = await page.evaluate(() => window.banc.stats())
  await open({ qualite: 'moyen', expr: 'tranquille', t: 2000, taille: 360, dpr: 2 })
  const sm = await page.evaluate(() => window.banc.stats())
  const rapport = { menthe: m, haut: s, moyen: sm }
  writeFileSync(resolve(out, 'mesures.json'), JSON.stringify(rapport, null, 2))
  console.log(JSON.stringify(rapport, null, 2))
  if (m.max > 6) { console.error(`Menthe : ΔE max ${m.max} > 6`); code = 1 }
  if (s.triangles > 10000) { console.error(`Pilou : ${s.triangles} triangles > 10 000`); code = 1 }
}
if (errors.length) { console.error('Erreurs JS :', errors); code = 1 }
await browser.close()
await server.close()
process.exit(code)
