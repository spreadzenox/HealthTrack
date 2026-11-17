// Les six poses pré-rendues du widget de Pilou (specs/journee.SPEC.md § 9 ; brief § 7.9 : images pré-rendues depuis
// la scène, pas un second canevas). Rendues dans Chromium depuis le code du kit (rendu/figurine), puis cadrées,
// teintées (soir orangé, nuit bleutée), arrondies et écrites en WebP 288 px dans res/drawable-nodpi.
//
// Usage (depuis app/) : node scripts/companion/render-widget-poses.mjs [--three <dossier build de three@0.187.0>]
// Sans --three : node_modules/three/build. Demande ImageMagick (`convert`) et le Chromium de Playwright.
// Quand le module du lot PILOU (src/companion/pilou/) sera sur main, ce script pourra le prendre à la place du kit.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const KIT = path.resolve(APP, '../journal/maquettes/compagnon/rendu/figurine')
const OUT = path.join(APP, 'android/app/src/main/res/drawable-nodpi')
const args = process.argv.slice(2)
const threeDir = args.includes('--three') ? args[args.indexOf('--three') + 1] : path.join(APP, 'node_modules/three/build')

// pose du widget → expression de anim.js, instant de son animation propre (ms), lueur du point ambre
const POSES = {
  content: ['content', null, null],
  'se-reveille': ['reveil', 1150, null],
  rassasie: ['rassasie', 400, null],
  soir: ['tranquille', null, 0.9],
  dort: ['endormi', null, 1.0],
  fete: ['rayonnant', 300, null],
}
// teinte multipliée par-dessus (dégradé haut → bas), comme la lumière du cycle du jour (world/daylight.js)
const TINTS = { soir: ['#E8B4E0', '#FFD2A8', '100,105'], dort: ['#5E68A8', '#8C8CC8', '125,90'] }

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#F6E7D8}#c{width:390px;height:330px;display:block}</style></head>
<body><canvas id="c"></canvas><script type="module">
import { createFigurine } from './figurine.js';
import { preset, EXPR } from './anim.js';
const fig = createFigurine({ canvas: document.getElementById('c'), width: 390, height: 330, pixelRatio: 2, mode: 'petit' });
const az = -.1, el = .16, d = 7.2, look = [0, .8, 0];
const cam = { pos: [d * Math.cos(el) * Math.sin(az), look[1] + d * Math.sin(el), d * Math.cos(el) * Math.cos(az)], look, fov: 20 };
window.pose = (name, u, glow) => { const P = preset(name); if (u != null && EXPR[name].anim) EXPR[name].anim(P, u, 1); if (glow != null) P.glow = glow;
  fig.render({ t: 2, pose: P, cam, drop: { grow: 0, fall: -1 }, exposure: 1.02, shadowR: .23 }); return true; };
window.__ready = true;
</script></body></html>`

const work = mkdtempSync(path.join(tmpdir(), 'pilou-poses-'))
const site = path.join(work, 'site')
mkdirSync(path.join(site, '_partage/three-0.187.0/build'), { recursive: true })
for (const f of ['three.module.js', 'three.core.js']) copyFileSync(path.join(threeDir, f), path.join(site, '_partage/three-0.187.0/build', f))
cpSync(KIT, path.join(site, 'fig'), { recursive: true, filter: (p) => !/\.(mp4|jpg|png)$/.test(p) })
writeFileSync(path.join(site, 'fig/poses.html'), PAGE)

const server = createServer((req, res) => {
  try {
    const file = path.join(site, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    res.writeHead(200, { 'content-type': file.endsWith('.js') ? 'text/javascript' : 'text/html' })
    res.end(readFileSync(file))
  } catch {
    res.writeHead(404).end()
  }
}).listen(0, '127.0.0.1')
const port = await new Promise((r) => server.on('listening', () => r(server.address().port)))

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 390, height: 330 }, deviceScaleFactor: 2 })
page.on('pageerror', (e) => { throw e })
await page.goto(`http://127.0.0.1:${port}/fig/poses.html`)
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 })
mkdirSync(OUT, { recursive: true })
for (const [pose, [expr, u, glow]] of Object.entries(POSES)) {
  await page.evaluate(([n, uu, g]) => window.pose(n, uu, g), [expr, u, glow])
  const raw = path.join(work, `${pose}.png`)
  await page.locator('#c').screenshot({ path: raw })
  const sq = path.join(work, `${pose}-sq.png`)
  execFileSync('convert', [raw, '-crop', '540x540+120+40', '+repage', sq])
  if (TINTS[pose]) {
    const [top, bottom, mod] = TINTS[pose]
    execFileSync('convert', [sq, '(', '-size', '540x540', `gradient:${top}-${bottom}`, ')', '-compose', 'multiply', '-composite', '-modulate', mod, sq])
  }
  const out = path.join(OUT, `pilou_pose_${pose.replace(/-/g, '_')}.webp`)
  execFileSync('convert', [sq, '-filter', 'Lanczos', '-resize', '288x288', '-alpha', 'set',
    '(', '-size', '288x288', 'xc:none', '-fill', 'white', '-draw', 'roundrectangle 0,0,287,287,40,40', ')',
    '-compose', 'DstIn', '-composite', '-quality', '88', '-define', 'webp:method=6', out])
  console.log('pose', pose, '→', path.relative(APP, out))
}
await browser.close()
server.close()
rmSync(work, { recursive: true, force: true })
