// Rendu des captures de la maquette « Aujourd'hui » (TESTEUR-1b). Usage, depuis la racine du dépôt :
//   node journal/maquettes/aujourdhui/render.mjs
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
const require = createRequire(path.resolve('app/package.json'))
const { chromium } = require('playwright')
const dir = path.dirname(fileURLToPath(import.meta.url))
const page_ = pathToFileURL(path.join(dir, 'maquette.html')).href
const shots = [
  ['demo-clair', 'state=demo'],
  ['demo-sombre', 'state=demo&theme=dark'],
  ['vierge-clair', 'state=empty'],
  ['bonne-journee-haut', 'state=good', true],
  ['journee-difficile-haut-sombre', 'state=hard&theme=dark', true],
]
const browser = await chromium.launch()
for (const [name, qs, top] of shots) {
  const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 })
  await page.goto(`${page_}?${qs}&motion=off${top ? '' : '&full=1'}`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(dir, `${name}.jpg`), type: 'jpeg', quality: 80, fullPage: !top,
    ...(top ? { clip: { x: 0, y: 0, width: 412, height: 420 } } : {}) })
  await page.close()
}
await browser.close()
