// Rendu des captures de la maquette « noter son poids » (PROP-POIDS). Depuis la racine du dépôt :
//   node journal/maquettes/poids/render.mjs
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
const require = createRequire(path.resolve('app/package.json'))
const { chromium } = require('playwright')
const dir = path.dirname(fileURLToPath(import.meta.url))
const url = pathToFileURL(path.join(dir, 'maquette.html')).href
const shots = [
  ['1-autre-chose', 'state=autre'], ['2-saisie', 'state=saisie'], ['2-saisie-sombre', 'state=saisie&theme=dark'],
  ['3-tendances', 'state=tendances'], ['3-tendances-sombre', 'state=tendances&theme=dark'], ['4-deux-pesees', 'state=tendances2'],
]
const browser = await chromium.launch()
for (const [name, qs] of shots) {
  const page = await browser.newPage({ viewport: { width: 412, height: 851 }, deviceScaleFactor: 2 })
  await page.goto(`${url}?${qs}`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(dir, `${name}.jpg`), type: 'jpeg', quality: 80 })
  await page.close()
}
await browser.close()
