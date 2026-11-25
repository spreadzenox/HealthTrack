// Rendu des captures de la maquette du rituel du soir (LANT-4, option A). Depuis la racine du dépôt :
//   node journal/maquettes/rituel-soir/render.mjs
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
const require = createRequire(path.resolve('app/package.json'))
const { chromium } = require('playwright')
const dir = path.dirname(fileURLToPath(import.meta.url))
const url = pathToFileURL(path.join(dir, 'maquette.html')).href
const shots = [
  ['1-bulle', 'state=bulle'], ['2-debut', 'state=debut'], ['3-range', 'state=range'], ['4-fin', 'state=fin'],
  ['4-fin-sombre', 'state=fin&theme=dark'], ['1-bulle-sombre', 'state=bulle&theme=dark'],
]
const browser = await chromium.launch()
for (const [name, qs] of shots) {
  const page = await browser.newPage({ viewport: { width: 412, height: 851 }, deviceScaleFactor: 2 })
  await page.goto(`${url}?${qs}`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(dir, `${name}.jpg`), type: 'jpeg', quality: 80 })
  await page.close()
}
await browser.close()
