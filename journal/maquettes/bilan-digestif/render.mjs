// Rendu des captures de la maquette « bilan digestif avant le 28e jour » (PROP-SIM-17). Depuis la racine du dépôt :
//   node journal/maquettes/bilan-digestif/render.mjs
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
const require = createRequire(path.resolve('app/package.json'))
const { chromium } = require('playwright')
const dir = path.dirname(fileURLToPath(import.meta.url))
const url = pathToFileURL(path.join(dir, 'maquette.html')).href
const shots = [['j14-clair', 'state=j14'], ['j14-sombre', 'state=j14&theme=dark'], ['j5-clair', 'state=j5']]
const browser = await chromium.launch()
for (const [name, qs] of shots) {
  const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 })
  await page.goto(`${url}?${qs}`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(dir, `${name}.jpg`), type: 'jpeg', quality: 80, fullPage: true })
  await page.close()
}
await browser.close()
