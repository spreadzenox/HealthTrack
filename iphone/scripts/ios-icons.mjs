#!/usr/bin/env node
// Icône « H nuit » et écran de démarrage de la version iOS, depuis le glyphe de référence d'Android
// (upstream/app/scripts/brand/render-icons.mjs, journal/DESIGN.md de HealthTrack) : rien n'est recopié.
//   - AppIcon 1024 × 1024, carré plein et opaque (iOS applique lui-même l'arrondi) ;
//   - écran de démarrage 2732 × 2732 : fond encre, glyphe au centre (recadré par iOS selon l'écran).
// Usage : scripts/upstream.sh puis node scripts/ios-icons.mjs   (Playwright/Chromium)
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const { GLYPH } = await import(resolve(root, 'upstream/app/scripts/brand/render-icons.mjs'))
const INK = '#10231D'
const assets = resolve(root, 'ios/App/App/Assets.xcassets')

function svg(size, scale) {
  const t = `translate(54 54) scale(${scale}) translate(-54 -54)`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="${size}" height="${size}"><rect width="108" height="108" fill="${INK}"/><g transform="${t}">${GLYPH}</g></svg>`
}

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim()
    return createRequire(resolve(globalRoot, 'noop.js'))('playwright')
  }
}

const { chromium } = await loadPlaywright()
const browser = await chromium.launch()
const page = await browser.newPage()
async function png(size, scale, out) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0">${svg(size, scale)}</body></html>`)
  await page.locator('svg').screenshot({ path: out })
}
await png(1024, 1.1, resolve(assets, 'AppIcon.appiconset/AppIcon-512@2x.png'))
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
  await png(2732, 0.45, resolve(assets, 'Splash.imageset', name))
}
await browser.close()
console.log('Icône et écran de démarrage iOS générés.')
