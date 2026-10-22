#!/usr/bin/env node
// Images de la fiche Google Play (jalon 10, journal/PRODUIT.md), générées depuis l'app avec les données de démo
// synthétiques de `npm run visual` (aucune donnée réelle) :
//   - store/listing/fr-FR/phone-screenshots/0N-<page>.png : captures 1080 × 1920 (9:16, ratio ≤ 2 exigé par Play)
//     de la variante play, thème clair, premier écran de chaque page choisie ;
//   - store/listing/fr-FR/feature-graphic.png : image de présentation 1024 × 500 (glyphe « H nuit », nom, promesse).
// L'icône 512 reste produite par scripts/brand/render-icons.mjs (store/play-icon-512.png).
// Usage (depuis app/) : node scripts/store/build-store-assets.mjs   puis relire les images avant de committer.
// L'envoi sur Play se fait par la CI (workflow « Play — fiche du Store », scripts/play/listing.mjs).
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync, execSync } from 'node:child_process'
import { GLYPH } from '../brand/render-icons.mjs'
import { APP_NAME } from '../../src/config/brand.js'

const root = resolve(import.meta.dirname, '../..')
const listingDir = resolve(root, 'store/listing/fr-FR')
const shotsDir = resolve(listingDir, 'phone-screenshots')
const work = resolve(root, '.visual/store')

/** Captures retenues, dans l'ordre de la fiche : [route de l'app, nom de la capture visuelle, nom du fichier]. */
export const SCREENSHOTS = [
  ['/', 'dashboard', '01-aujourdhui'],
  ['/food', 'food', '02-repas'],
  ['/journal', 'journal', '03-jours'],
  ['/tendances', 'tendances', '04-tendances'],
  ['/recommendations', 'recommendations', '05-pistes'],
]

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim()
    return createRequire(resolve(globalRoot, 'noop.js'))('playwright')
  }
}

function screenshots() {
  rmSync(work, { recursive: true, force: true })
  execFileSync(
    process.execPath,
    ['scripts/visual/visual-check.mjs', '--play', '--size=360x640', '--dpr=3', '--out=.visual/store', `--routes=${SCREENSHOTS.map(([r]) => r).join(',')}`],
    { cwd: root, stdio: 'inherit' },
  )
  rmSync(shotsDir, { recursive: true, force: true })
  mkdirSync(shotsDir, { recursive: true })
  for (const [, name, file] of SCREENSHOTS) copyFileSync(resolve(work, 'tiles', `${name}-1.png`), resolve(shotsDir, `${file}.png`))
}

const font = (rel) => `data:font/woff2;base64,${readFileSync(resolve(root, 'node_modules', rel)).toString('base64')}`

function featureGraphicHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Figtree; src: url(${font('@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2')}) format('woff2'); font-weight: 300 900; }
@font-face { font-family: Plex; src: url(${font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2')}) format('woff2'); }
html, body { margin: 0; width: 1024px; height: 500px; background: #10231D; overflow: hidden; }
.wrap { display: flex; align-items: center; gap: 56px; height: 100%; padding: 0 88px; box-sizing: border-box; }
svg { width: 260px; height: 260px; flex: none; }
h1 { margin: 0; font: 800 92px/1 Figtree; color: #FFFFFF; letter-spacing: -1px; }
p { margin: 22px 0 0; font: 600 34px/1.25 Figtree; color: #E3F5EE; max-width: 560px; }
small { display: block; margin-top: 26px; font: 500 18px/1 Plex; color: #B9DCCD; white-space: nowrap; }
</style></head><body><div class="wrap">
<svg viewBox="12 12 84 84" xmlns="http://www.w3.org/2000/svg">${GLYPH}</svg>
<div><h1>${APP_NAME}</h1><p>Comprenez ce qui va avec vos bons et mauvais jours.</p>
<small>repas · ventre · sommeil · montres · bien-être</small></div>
</div></body></html>`
}

async function featureGraphic() {
  const { chromium } = await loadPlaywright()
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 })
  await page.setContent(featureGraphicHtml())
  await page.evaluate(() => document.fonts.ready)
  mkdirSync(listingDir, { recursive: true })
  writeFileSync(resolve(listingDir, 'feature-graphic.png'), await page.screenshot({ type: 'png' }))
  await browser.close()
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  if (!process.argv.includes('--feature-only')) screenshots()
  await featureGraphic()
  console.log(`Fiche Play : ${readdirSync(shotsDir).length} captures + image de présentation dans ${listingDir}`)
}
