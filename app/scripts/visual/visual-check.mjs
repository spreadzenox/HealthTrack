#!/usr/bin/env node
/**
 * Vérification visuelle : lance l'app (Vite), injecte des données de démo dans
 * IndexedDB, puis capture chaque page dans un viewport mobile (≈ Galaxy A56)
 * avec Playwright/Chromium. Collecte aussi les erreurs console et JS.
 *
 * Usage :
 *   npm run visual                         # toutes les pages, données de démo
 *   npm run visual -- --empty              # état vide (premier lancement)
 *   npm run visual -- --routes=/,/food     # pages choisies
 *   npm run visual -- --light              # schéma de couleurs clair
 *   npm run visual -- --update-banner      # simule une release plus récente
 *   npm run visual -- --wellbeing-prompt   # laisse la modale bien-être s'ouvrir
 *   npm run visual -- --whats-new          # affiche le bandeau « Nouveautés »
 *   npm run visual -- --radar              # simule un début d'infection (« Radar forme » en alerte)
 *   npm run visual -- --routes=/food --food-analysis
 *                                          # analyse photo simulée (réponse Gemini factice) sur /food
 *   npm run visual -- --routes=/food --meal-text       # repas décrit en texte, réponse Gemini factice
 *   npm run visual -- --routes=/food --meal-text=form  # formulaire de description, avant l'envoi
 *   npm run visual -- --routes=/data --import          # aperçu d'une sauvegarde choisie (avant import)
 *   npm run visual -- --routes=/data --import=replace  # … puis confirmation « Remplacer mes données »
 *   npm run visual -- --url=http://localhost:5173   # serveur déjà lancé
 *   npm run visual -- --out=.visual/avant  # dossier de sortie
 *   npm run visual -- --viewport --insets=24,48 # simule les barres d'état / navigation d'Android 15+
 *                                          # (variables --safe-area-inset-* injectées par Capacitor, en px)
 *   npm run visual -- --routes=/recommendations --click="Recommandations avancées"
 *                                          # clique un bouton (nom accessible) avant la capture
 *
 * Sortie : <out>/<page>.png (page entière), <out>/tiles/<page>-<n>.png (un écran
 * par image, à regarder en priorité) + <out>/report.json. Code de sortie 1 si une page
 * lève une erreur JS non gérée (pageerror) ou ne se charge pas.
 */
import { spawn, execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateDemoEntries } from './demoData.mjs'

// Même fuseau que le navigateur simulé, pour que les heures des données de démo soient cohérentes.
process.env.TZ = 'Europe/Paris'

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const DEFAULT_ROUTES = [
  ['/', 'dashboard'],
  ['/food', 'food'],
  ['/nutrition', 'nutrition'],
  ['/data', 'data'],
  ['/connectors', 'connectors'],
  ['/recommendations', 'recommendations'],
  ['/settings', 'settings'],
  ['/plus', 'plus'],
]

const FAKE_MEAL_ANALYSIS = {
  not_food: false,
  dish: 'Poulet, riz et haricots verts',
  ingredients: [
    { ingredient: 'Poulet, filet sans peau grillé/poêlé', quantity_g: 140, confidence: 'high' },
    { ingredient: 'riz blanc, cuit', quantity_g: 180, confidence: 'medium' },
    { ingredient: 'Haricot vert, cuit', quantity_g: 90, confidence: 'medium' },
    { ingredient: "Huile d'olive vierge extra", quantity_g: 10, confidence: 'low' },
    { ingredient: 'Sauce maison du chef', quantity_g: 30, confidence: 'low' },
  ],
}

const MEAL_TEXT = 'Deux œufs au plat, une tartine beurrée et un café'
const FAKE_MEAL_TEXT_ANALYSIS = {
  not_food: false,
  dish: 'Œufs au plat et tartine beurrée',
  ingredients: [
    { ingredient: 'Oeuf au plat, sans matière grasse', quantity_g: 110, confidence: 'high' },
    { ingredient: 'Pain (aliment moyen)', quantity_g: 35, confidence: 'high' },
    { ingredient: 'Beurre à 80% MG minimum, doux', quantity_g: 10, confidence: 'medium' },
    { ingredient: 'Café expresso, non instantané, sans sucres ajoutés, prêt à boire', quantity_g: 100, confidence: 'medium' },
    { ingredient: "Huile d'olive vierge extra", quantity_g: 5, confidence: 'low' },
  ],
}

// PNG 1×1 (la photo elle-même n'est pas analysée : la réponse est factice)
const DEMO_PHOTO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

function parseArgs(argv) {
  const args = {}
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) args[m[1]] = m[2] ?? true
  }
  return args
}

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim()
    return createRequire(join(globalRoot, 'noop.js'))('playwright')
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Serveur injoignable : ${url}`)
}

function latestChangelogId() {
  // Même tri que src/data/changelog.js : le nom de fichier commence par la date.
  const files = readdirSync(join(APP_DIR, 'src/data/changelog')).filter((f) => f.endsWith('.json'))
  return files.sort().at(-1)?.replace(/\.json$/, '') ?? null
}

function routeName(path) {
  return path === '/' ? 'dashboard' : path.replace(/^\//, '').replace(/\//g, '_')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const port = Number(args.port || 5199)
  const outDir = resolve(APP_DIR, args.out || '.visual')
  const routes = args.routes
    ? String(args.routes).split(',').map((p) => [p, routeName(p)])
    : DEFAULT_ROUTES
  mkdirSync(outDir, { recursive: true })

  let server = null
  let baseUrl = args.url
  if (!baseUrl) {
    baseUrl = `http://127.0.0.1:${port}`
    server = spawn(join(APP_DIR, 'node_modules/.bin/vite'), ['--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
      cwd: APP_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none' },
    })
    server.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`))
  }

  const cleanup = () => server?.kill('SIGTERM')
  process.on('exit', cleanup)

  try {
    await waitForServer(baseUrl)
    const { chromium } = await loadPlaywright()
    const browser = await chromium.launch()
    const context = await browser.newContext({
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: Number(args.dpr || 2),
      isMobile: true,
      hasTouch: true,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      colorScheme: args.light ? 'light' : 'dark',
    })

    // Pas d'appel réseau réel vers GitHub : release simulée (ancienne par défaut).
    await context.route('https://api.github.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tag_name: args['update-banner'] ? 'v99999' : 'v0',
          html_url: 'https://github.com/spreadzenox/HealthTrack/releases',
          assets: [{ name: 'HealthTrack-v99999.apk', browser_download_url: 'https://example.invalid/app.apk' }],
        }),
      })
    )
    if (args['food-analysis'] || args['meal-text']) {
      // Analyse photo ou texte sans clé réelle ni appel réseau : réponse Gemini factice.
      await context.addInitScript(() => {
        try {
          localStorage.setItem('healthtrack_gemini_api_key', 'demo-key')
        } catch {
          /* ignore */
        }
      })
      await context.route('https://generativelanguage.googleapis.com/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(args['meal-text'] ? FAKE_MEAL_TEXT_ANALYSIS : FAKE_MEAL_ANALYSIS) }] } }] }),
        })
      )
    }
    if (!args['whats-new']) {
      await context.addInitScript((latestId) => {
        try {
          if (latestId) localStorage.setItem('healthtrack-whats-new-last-seen', latestId)
        } catch {
          /* ignore */
        }
      }, latestChangelogId())
    }
    if (args.insets) {
      // Comme Capacitor (SystemBars) sur Android 15+ : encarts injectés sur <html>, barres système
      // dessinées en bandes semi-transparentes pour voir ce qui passerait dessous.
      const [top, bottom] = String(args.insets).split(',').map((v) => Number(v) || 0)
      await context.addInitScript(
        ({ top, bottom }) => {
          window.addEventListener('DOMContentLoaded', () => {
            document.documentElement.style.setProperty('--safe-area-inset-top', `${top}px`)
            document.documentElement.style.setProperty('--safe-area-inset-bottom', `${bottom}px`)
            for (const [edge, height] of [['top', top], ['bottom', bottom]]) {
              const bar = document.createElement('div')
              bar.setAttribute('aria-hidden', 'true')
              bar.style.cssText = `position:fixed;left:0;right:0;${edge}:0;height:${height}px;z-index:2147483647;pointer-events:none;background:rgba(255,0,80,0.35)`
              document.body.appendChild(bar)
            }
          })
        },
        { top, bottom }
      )
    }
    if (!args['wellbeing-prompt']) {
      await context.addInitScript(() => {
        try {
          sessionStorage.setItem('healthtrack-wellbeing-prompt-session', '1')
        } catch {
          /* ignore */
        }
      })
    }

    const page = await context.newPage()
    const report = { baseUrl, seeded: !args.empty, routes: [] }
    let current = null
    page.on('console', (msg) => {
      if (current && (msg.type() === 'error' || msg.type() === 'warning')) {
        current.console.push(`${msg.type()}: ${msg.text()}`)
      }
    })
    page.on('pageerror', (err) => current?.pageErrors.push(String(err?.stack || err)))

    // Base propre + données de démo injectées via le module de stockage de l'app.
    await page.goto(baseUrl, { waitUntil: 'load' })
    const entries = args.empty ? [] : generateDemoEntries({ illness: Boolean(args.radar) })
    const seedResult = await page.evaluate(async (list) => {
      await new Promise((res) => {
        const req = indexedDB.deleteDatabase('HealthTrack')
        req.onsuccess = req.onerror = req.onblocked = () => res()
      })
      if (!list.length) return { inserted: 0 }
      const storage = await import('/src/storage/localHealthStorage.js')
      return storage.upsertEntries(list)
    }, entries)
    report.seed = seedResult

    let failed = false
    for (const [path, name] of routes) {
      current = { path, name, console: [], pageErrors: [] }
      try {
        await page.goto(baseUrl + path, { waitUntil: 'networkidle', timeout: 20000 })
        await page.waitForTimeout(700)
        if (args['food-analysis'] && path === '/food') {
          await page.locator('#gallery-upload').setInputFiles({ name: 'repas.png', mimeType: 'image/png', buffer: DEMO_PHOTO })
          await page.getByRole('button', { name: 'Analyser les ingrédients' }).click()
          await page.getByRole('heading', { name: FAKE_MEAL_ANALYSIS.dish }).waitFor({ timeout: 10000 })
        }
        if (args['meal-text'] && path === '/food') {
          await page.getByRole('button', { name: /Décrire ou saisir sans photo/ }).click()
          await page.getByLabel('Décrivez votre repas').fill(MEAL_TEXT)
          if (args['meal-text'] !== 'form') {
            await page.getByRole('button', { name: /Remplir avec Gemini/ }).click()
            await page.getByRole('heading', { name: FAKE_MEAL_TEXT_ANALYSIS.dish }).waitFor({ timeout: 10000 })
          }
          await page.evaluate(() => document.querySelector('.new-meal')?.scrollIntoView({ block: 'start' }))
          await page.waitForTimeout(500)
        }
        if (args.import && path === '/data') {
          // Sauvegarde de démo (+ une entrée illisible) choisie dans le sélecteur de fichier.
          const backup = {
            version: 1,
            exportedAt: new Date().toISOString(),
            entries: [...generateDemoEntries(), { type: 'food' }],
          }
          await page.locator('input[type="file"]').setInputFiles({
            name: 'healthtrack-export.json',
            mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(backup)),
          })
          await page.getByRole('button', { name: 'Ajouter à mes données' }).waitFor({ timeout: 10000 })
          if (args.import === 'replace') await page.getByRole('button', { name: 'Remplacer mes données' }).click()
          await page.evaluate(() => document.querySelector('.import-preview')?.scrollIntoView({ block: 'start' }))
          await page.waitForTimeout(400)
        }
        if (args.click) {
          const button = page.getByRole('button', { name: String(args.click) }).first()
          if (await button.count()) {
            await button.click()
            await page.waitForTimeout(700)
          }
        }
        const file = join(outDir, `${name}.png`)
        await page.screenshot({ path: file, fullPage: !args.viewport })
        current.screenshot = file
        // Découpe en écrans successifs (plus lisibles qu'une capture très haute).
        const height = await page.evaluate(() => document.documentElement.scrollHeight)
        const vp = page.viewportSize()
        current.tiles = []
        for (let k = 0; k * vp.height < height && k < 12; k++) {
          const tile = join(outDir, 'tiles', `${name}-${k + 1}.png`)
          mkdirSync(dirname(tile), { recursive: true })
          const h = Math.min(vp.height, height - k * vp.height)
          await page.screenshot({ path: tile, fullPage: true, clip: { x: 0, y: k * vp.height, width: vp.width, height: h } })
          current.tiles.push(tile)
        }
        current.overflowX = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        )
      } catch (e) {
        current.error = String(e?.message || e)
      }
      if (current.error || current.pageErrors.length) failed = true
      report.routes.push(current)
    }

    await browser.close()
    writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2))

    console.log(`\nVérification visuelle — ${report.routes.length} page(s), données : ${report.seeded ? `démo (${seedResult?.inserted ?? 0} entrées)` : 'vides'}`)
    for (const r of report.routes) {
      const flags = [
        r.error ? `ÉCHEC: ${r.error}` : 'ok',
        r.pageErrors.length ? `${r.pageErrors.length} erreur(s) JS` : null,
        r.console.length ? `${r.console.length} msg console` : null,
        r.overflowX ? 'DÉBORDEMENT HORIZONTAL' : null,
      ].filter(Boolean)
      console.log(`  ${r.path.padEnd(18)} ${flags.join(' · ')}${r.tiles ? `  (${r.tiles.length} écran(s))` : ''}`)
    }
    console.log(`Captures : ${outDir}/<page>.png et ${outDir}/tiles/<page>-<n>.png`)
    console.log(`Rapport : ${join(outDir, 'report.json')}`)
    process.exitCode = failed ? 1 : 0
  } finally {
    cleanup()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
