// Images fixes de la scène (palier bas et attente du premier rendu, SPEC île § 11) : une par étape de croissance de
// l'îlot (0, 30 et 90 jours d'usage : îlot nu, îlot voisin, mare) et par saison, plus l'image de nuit.
// Rendues dans Chromium (SwiftShader) depuis le banc de la scène (scene/banc.html, vrai Pilou), 360 × 320 à ×2, fond
// transparent, écrites en WebP dans src/companion/scene/stills/. Le choix de l'image : scene/stills.js.
//
// Usage (depuis app/) : node scripts/companion/render-scene-stills.mjs
// Demande ImageMagick (`convert`) et le Chromium de Playwright.
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { STILL_STAGES, STILL_SEASONS, stillName } from '../../src/companion/scene/stills.js'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(APP, 'src/companion/scene/stills')

const server = await createServer({ root: APP, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } })
await server.listen()
const { port } = server.httpServer.address()
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 360, height: 320 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(e))
const work = mkdtempSync(path.join(tmpdir(), 'scene-stills-'))
mkdirSync(OUT, { recursive: true })

async function shoot(query, name) {
  await page.goto(`http://127.0.0.1:${port}/src/companion/scene/banc.html?w=360&h=320&${query}`)
  await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 })
  if (errors.length) throw errors[0]
  const raw = path.join(work, `${name}.png`)
  await page.locator('#c').screenshot({ path: raw, omitBackground: true })
  execFileSync('convert', [raw, '-quality', '82', '-define', 'webp:method=6', '-define', 'webp:alpha-quality=90', path.join(OUT, `${name}.webp`)])
  console.log(name)
}

for (const days of STILL_STAGES) {
  for (const season of STILL_SEASONS) await shoot(`jours=${days}&saison=${season}`, stillName(days, season))
}
await shoot('jours=0&heure=02:00&t=4000', 'nuit')
await browser.close()
await server.close()
