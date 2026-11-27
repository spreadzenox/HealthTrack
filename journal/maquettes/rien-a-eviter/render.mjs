// Rendu des captures de la maquette « Rien à éviter » (PROP-SIM-20). Depuis la racine du dépôt :
//   node journal/maquettes/rien-a-eviter/render.mjs
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
const require = createRequire(path.resolve('app/package.json'))
const { chromium } = require('playwright')
const dir = path.dirname(fileURLToPath(import.meta.url))
const url = pathToFileURL(path.join(dir, 'maquette.html')).href
const shots = [
  ['0-avant', 'state=avant-ouvert'], ['1-a', 'state=a'], ['1-a-sombre', 'state=a&theme=dark'],
  ['2-a-ouvert', 'state=a-ouvert'], ['3-b', 'state=b'],
]
const browser = await chromium.launch()
for (const [name, qs] of shots) {
  const page = await browser.newPage({ viewport: { width: 412, height: 851 }, deviceScaleFactor: 2 })
  await page.goto(`${url}?${qs}`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(dir, `${name}.png`), type: 'png' })
  await page.close()
}
await browser.close()
