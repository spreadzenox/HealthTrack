#!/usr/bin/env node
// Génère les images de l'icône « H nuit » (journal/DESIGN.md) à partir du SVG de référence :
//   - public/favicon.svg (logo de l'en-tête et onglet du navigateur) ;
//   - android/.../mipmap-*/ic_launcher(_round).png (icône classique, secours des lanceurs sans icône adaptative) ;
//   - store/play-icon-512.png (fiche Google Play : carré plein, Google applique lui-même le masque).
// Les vecteurs Android (avant-plan, monochrome, notification) sont écrits à la main dans res/drawable.
// Usage : node scripts/brand/render-icons.mjs   (Playwright/Chromium, comme npm run visual)
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '../..')
const res = resolve(root, 'android/app/src/main/res')

const INK = '#10231D'
// Glyphe de référence, grille 108 des icônes adaptatives (ne pas modifier sans DESIGN.md).
export const GLYPH = [
  '<rect x="30" y="28" width="11" height="52" rx="5.5" fill="#FFFFFF"/>',
  '<rect x="67" y="28" width="11" height="52" rx="5.5" fill="#FFFFFF"/>',
  '<path d="M36 64 C46 64 46 50 54 50 C62 50 62 42 72 42" fill="none" stroke="#5EE0B5" stroke-width="7" stroke-linecap="round"/>',
  '<circle cx="54" cy="50" r="5.5" fill="#FFB84D"/>',
].join('')

// shape : 'square' (plein cadre), 'rounded' (favicon), 'circle' (ic_launcher_round)
function svg(shape, scale = 1) {
  const bg =
    shape === 'circle'
      ? `<circle cx="54" cy="54" r="54" fill="${INK}"/>`
      : `<rect width="108" height="108" rx="${shape === 'rounded' ? 24 : 0}" fill="${INK}"/>`
  const t = `translate(54 54) scale(${scale}) translate(-54 -54)`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">${bg}<g transform="${t}">${GLYPH}</g></svg>`
}

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim()
    return createRequire(resolve(globalRoot, 'noop.js'))('playwright')
  }
}

async function main() {
  writeFileSync(resolve(root, 'public/favicon.svg'), svg('rounded', 1.1) + '\n')
  const { chromium } = await loadPlaywright()
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const png = async (markup, size, out) => {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${markup.replace('width="108" height="108"', `width="${size}" height="${size}"`)}</body></html>`,
    )
    mkdirSync(dirname(out), { recursive: true })
    await page.locator('svg').screenshot({ path: out, omitBackground: true })
  }
  // L'icône classique montre tout le carré : le glyphe peut être un peu plus grand que dans la zone sûre adaptative.
  const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
  for (const [d, size] of Object.entries(densities)) {
    await png(svg('rounded', 1.1), size, resolve(res, `mipmap-${d}/ic_launcher.png`))
    await png(svg('circle', 1.0), size, resolve(res, `mipmap-${d}/ic_launcher_round.png`))
  }
  await png(svg('square', 1.0), 512, resolve(root, 'store/play-icon-512.png'))
  await browser.close()
  console.log('Icônes « H nuit » générées.')
}

if (import.meta.url === `file://${process.argv[1]}`) main()
