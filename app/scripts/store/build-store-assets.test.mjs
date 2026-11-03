// Garde-fou des captures de la fiche Play : les images commitées sont exactement celles de SCREENSHOTS, chaque route
// existe encore dans l'app, et aucun nom ne reprend un onglet renommé (« Pistes » → « Analyses », 24/10).
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SCREENSHOTS, SCREENSHOT_ARGS } from './screenshots.mjs'
import { pngSize, LIMITS } from '../play/listing.mjs'

const root = resolve(import.meta.dirname, '../..')
const shotsDir = resolve(root, 'store/listing/fr-FR/phone-screenshots')

describe('captures de la fiche Play', () => {
  it('les fichiers commités correspondent à la liste SCREENSHOTS, dans l’ordre', () => {
    const files = readdirSync(shotsDir).filter((f) => f.endsWith('.png')).sort()
    expect(files).toEqual(SCREENSHOTS.map(([, , file]) => `${file}.png`))
    expect(files.length).toBeGreaterThanOrEqual(LIMITS.screenshotsMin)
    expect(files.length).toBeLessThanOrEqual(LIMITS.screenshotsMax)
  })

  it('chaque capture est en 1080 × 1920', () => {
    for (const [, , file] of SCREENSHOTS) {
      expect(pngSize(readFileSync(resolve(shotsDir, `${file}.png`)))).toEqual({ width: 1080, height: 1920 })
    }
  })

  it('chaque route existe dans l’app', () => {
    const app = readFileSync(resolve(root, 'src/App.jsx'), 'utf8')
    const paths = new Set([...app.matchAll(/path="([^"]+)"/g)].map((m) => `/${m[1]}`.replace(/^\/\//, '/')))
    for (const [route] of SCREENSHOTS) expect(paths, route).toContain(route)
  })

  it('aucun nom d’onglet périmé et des captures de la variante play avec un abonnement', () => {
    for (const [, , file] of SCREENSHOTS) expect(file).not.toMatch(/pistes/)
    expect(SCREENSHOT_ARGS).toContain('--play')
    expect(SCREENSHOT_ARGS.some((a) => a.startsWith('--subscription='))).toBe(true)
  })
})
