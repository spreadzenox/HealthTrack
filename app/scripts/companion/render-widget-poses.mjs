// Les six poses pré-rendues du widget de Pilou (specs/journee.SPEC.md § 9 ; brief § 7.9 : images pré-rendues depuis
// la scène, pas un second canevas). Rendues dans Chromium depuis le vrai modèle (src/companion/pilou/createPilou.js,
// par son banc d'essai servi par Vite), puis posées sur le fond crème, cadrées, teintées (soir orangé, nuit bleutée),
// arrondies et écrites en WebP 288 px dans res/drawable-nodpi (WIDGET-POSES). Les deux vignettes des notifications de
// l'iPhone (public/companion/pilou_pose_content.jpg et pilou_pose_soir.jpg) sont tirées des mêmes images.
// Le widget garde le Pilou d'origine (sans les traits du Studio) tant que l'aperçu 3D du Studio n'est pas tranché.
//
// Usage (depuis app/) :
//   node scripts/companion/render-widget-poses.mjs           # écrit les 6 WebP et les 2 JPEG
//   node scripts/companion/render-widget-poses.mjs --check   # rend deux fois sans rien écrire : mêmes octets ?
// Demande ImageMagick (`convert`) et le Chromium de Playwright.
import { createRequire } from 'node:module'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(APP, 'android/app/src/main/res/drawable-nodpi')
const JPEG = path.join(APP, 'public/companion')
const check = process.argv.includes('--check')

// pose du widget → expression de animateur.js, instant de l'image figée (ms depuis le début de l'expression)
const POSES = {
  content: ['content', 2200],
  'se-reveille': ['reveil', 1150],
  rassasie: ['rassasie', 2200],
  soir: ['tranquille', 2200],
  dort: ['endormi', 2200],
  fete: ['rayonnant', 1900],
}
// teinte multipliée par-dessus (dégradé haut → bas), comme la lumière du cycle du jour (world/daylight.js)
const TINTS = { soir: ['#E8B4E0', '#FFD2A8', '100,105'], dort: ['#5E68A8', '#8C8CC8', '125,90'] }
const FOND = '#F6E7D8'
const TAILLE = 288 // px CSS du canevas du banc ; rendu en dpr 2 → 576 × 634

async function renderAll(dir) {
  const server = await createServer({ root: APP, logLevel: 'error', server: { port: 0, host: '127.0.0.1' } })
  await server.listen()
  const base = server.resolvedUrls.local[0].replace(/\/$/, '')
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const errors = []
  const page = await browser.newPage({ viewport: { width: TAILLE, height: Math.ceil(TAILLE * 1.1) }, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  const files = {}
  try {
    for (const [pose, [expr, t]] of Object.entries(POSES)) {
      const q = new URLSearchParams({ expr, t, taille: TAILLE, dpr: 2, capture: 1, camera: 1 })
      await page.goto(`${base}/src/companion/pilou/banc/index.html?${q}`)
      await page.waitForFunction(() => window.banc?.pret, null, { timeout: 120000 })
      const data = await page.evaluate(() => document.getElementById('vue').toDataURL('image/png'))
      const raw = path.join(dir, `${pose}.png`)
      writeFileSync(raw, Buffer.from(data.split(',')[1], 'base64'))
      // fond crème sous l'image transparente, carré du haut (Pilou entier, pieds et antenne compris)
      const sq = path.join(dir, `${pose}-sq.png`)
      execFileSync('convert', ['-size', '576x634', `xc:${FOND}`, raw, '-compose', 'over', '-composite', '-crop', '576x576+0+40', '+repage', sq])
      if (TINTS[pose]) {
        const [top, bottom, mod] = TINTS[pose]
        execFileSync('convert', [sq, '(', '-size', '576x576', `gradient:${top}-${bottom}`, ')', '-compose', 'multiply', '-composite', '-modulate', mod, sq])
      }
      const name = `pilou_pose_${pose.replace(/-/g, '_')}`
      const webp = path.join(dir, `${name}.webp`)
      execFileSync('convert', [sq, '-filter', 'Lanczos', '-resize', '288x288', '-alpha', 'set',
        '(', '-size', '288x288', 'xc:none', '-fill', 'white', '-draw', 'roundrectangle 0,0,287,287,40,40', ')',
        '-compose', 'DstIn', '-composite', '-strip', '-quality', '88', '-define', 'webp:method=6', webp])
      files[`${name}.webp`] = webp
      if (pose === 'content' || pose === 'soir') {
        // vignette des notifications de l'iPhone : carrée, sans coins arrondis (iOS les arrondit lui-même)
        const jpg = path.join(dir, `${name}.jpg`)
        execFileSync('convert', [sq, '-filter', 'Lanczos', '-resize', '288x288', '-strip', '-quality', '86', jpg])
        files[`${name}.jpg`] = jpg
      }
    }
  } finally {
    await browser.close()
    await server.close()
  }
  if (errors.length) throw new Error(`Erreurs JS dans le banc : ${errors.join(' | ')}`)
  return files
}

const work = mkdtempSync(path.join(tmpdir(), 'pilou-poses-'))
try {
  mkdirSync(path.join(work, 'a'))
  const a = await renderAll(path.join(work, 'a'))
  if (check) {
    mkdirSync(path.join(work, 'b'))
    const b = await renderAll(path.join(work, 'b'))
    const diff = Object.keys(a).filter((k) => !readFileSync(a[k]).equals(readFileSync(b[k])))
    if (diff.length) { console.error('Rendus différents :', diff.join(', ')); process.exitCode = 1 } else console.log('Deux rendus, mêmes octets :', Object.keys(a).length, 'fichiers')
  } else {
    mkdirSync(OUT, { recursive: true })
    for (const [name, file] of Object.entries(a)) {
      const dest = path.join(name.endsWith('.jpg') ? JPEG : OUT, name)
      copyFileSync(file, dest)
      console.log(name, '→', path.relative(APP, dest), readFileSync(dest).length, 'octets')
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true })
}
