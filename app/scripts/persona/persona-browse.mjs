#!/usr/bin/env node
/**
 * Navigateur des simulations de personas (décision C du 07/11, PERSONAS-1).
 * Lance l'app (Vite, variante play par défaut) dans un téléphone simulé (≈ Galaxy A56, Chromium), avec les données de
 * démo que la persona aurait (personaData.mjs), puis attend des gestes sur un petit serveur local. Chaque geste
 * renvoie une capture de l'écran : l'agent qui simule la persona ne voit que ces captures, jamais le code.
 *
 *   node scripts/persona/persona-browse.mjs --day=14 --equipment=watch --port=7801 --out=/tmp/sim-1 [--dark] [--sideload]
 *     [--goals=care,stress]   objectifs cochés à l'accueil (jour > 1 ; au jour 1 l'agent les choisit lui-même) :
 *                             gut, cycle, stress, sport, care, all (POLISH-SIM-7)
 *     [--notes=few]           profil de saisie : full (défaut) ou few (persona pressée, presque rien de noté)
 *
 * Gestes (GET, réponse JSON { shot, url } ; la capture est un PNG à lire) :
 *   /start                     capture de l'écran actuel
 *   /tap?text=Journal          toucher l'élément dont le texte visible ou le nom accessible est « Journal »
 *                              (&n=2 : la 2e occurrence) ; /tap?x=200&y=640 : toucher un point de l'écran
 *   /type?text=pâtes           écrire dans le champ qui a le focus (&label=… : le champ nommé ainsi)
 *   /scroll?dy=600             faire défiler (négatif : remonter)
 *   /back                      bouton retour d'Android
 *   /full                      capture de toute la page (défilement compris)
 *   /quit                      arrêter
 * Aucun appel réseau réel : relais Halcya, météo et GitHub sont simulés ou coupés ; analyse de repas factice.
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdirSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { generateDemoEntries } from '../visual/demoData.mjs'
import { gotoRoute } from '../visual/navigate.mjs'
import { personaEntries } from './personaData.mjs'

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=')
  return [k, v ?? true]
}))
const day = Number(args.day || 14)
const equipment = String(args.equipment || 'phone')
const goals = args.goals ? String(args.goals).split(',').filter(Boolean) : []
const notes = String(args.notes || 'full')
const port = Number(args.port || 7801)
const vitePort = port + 100
const outDir = resolve(String(args.out || join(APP_DIR, '.persona')))
mkdirSync(outDir, { recursive: true })

async function loadPlaywright() {
  try { return await import('playwright') } catch {
    return createRequire(join(execSync('npm root -g').toString().trim(), 'noop.js'))('playwright')
  }
}

const vite = spawn(join(APP_DIR, 'node_modules/.bin/vite'), ['--port', String(vitePort), '--strictPort', '--host', '127.0.0.1'], {
  cwd: APP_DIR, stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, BROWSER: 'none', ...(args.sideload ? {} : { VITE_DISTRIBUTION: 'play' }) },
})
process.on('exit', () => vite.kill('SIGTERM'))
const base = `http://127.0.0.1:${vitePort}`
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(base)).ok) break } catch { /* pas prêt */ }
  await new Promise((r) => setTimeout(r, 300))
}

const { chromium } = await loadPlaywright()
// Les champs date et heure natifs suivent la langue du système, pas celle du contexte : téléphone en français.
const browser = await chromium.launch({ env: { ...process.env, LANG: 'fr_FR.UTF-8', LANGUAGE: 'fr' } })
const context = await browser.newContext({
  viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
  locale: 'fr-FR', timezoneId: 'Europe/Paris', colorScheme: args.dark ? 'dark' : 'light',
})
const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) })
await context.route('https://api.github.com/**', (r) => r.abort())
await context.route('https://*.open-meteo.com/**', (r) => r.abort())
await context.route('**/v1/subscription/verify', (r) => json(r, { ok: true, premium: true, source: 'launch', launchUntil: new Date(Date.now() + 20 * 86400000).toISOString() }))
await context.route('**/v1/credits', (r) => json(r, { credits: { plan: 'premium', tier: 'gold', remaining: 20, daily: 20, resetAt: new Date(Date.now() + 86400000).toISOString(), state: 'x' } }))
const FAKE_MEAL = { dish: 'Pâtes à la carbonara', ingredients: [{ ingredient: 'Pâtes alimentaires, cuites', quantity_g: 220 }, { ingredient: 'Lardons', quantity_g: 50 }, { ingredient: 'Oeuf, cru', quantity_g: 50 }, { ingredient: 'Parmesan', quantity_g: 15 }] }
await context.route('**/v1/meal/analyze', (r) => json(r, { parsed: FAKE_MEAL, quota: { remaining: 19, resetAt: new Date(Date.now() + 6 * 3600000).toISOString() } }))
// Faux Play Billing (aucun achat) : comme sur le téléphone, l'app relit ses droits au démarrage auprès du relais
// (période de lancement : Gold offert). Sans lui, le navigateur restait en gratuit (constat des simulations du 08/11).
await context.addInitScript(() => {
  window.__HT_PLAY_BILLING__ = {
    getProducts: async () => ({ products: [] }), purchase: async () => ({ status: 'cancelled' }),
    queryPurchases: async () => ({ purchases: [] }), addListener: async () => ({ remove() {} }),
  }
})
const latestId = readdirSync(join(APP_DIR, 'src/data/changelog')).filter((f) => f.endsWith('.json')).sort().pop().replace(/\.json$/, '')
// Jour 1 : premier lancement, l'onboarding s'ouvre ; sinon il a été fait le jour de l'installation.
// Au jour 1, les 30 jours importés sont déjà dans la base : sans marque, l'app y verrait quelqu'un qui a déjà des
// données (`needsOnboarding` → « existing ») et sauterait l'accueil (artefact des J1 du 08/11). On marque donc
// l'onboarding comme commencé (maxStep 1, écran 0), ce qui le rouvre au premier écran.
if (day === 1) {
  await context.addInitScript(() => {
    if (!localStorage.getItem('healthtrack_onboarding')) {
      localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: false, step: 0, maxStep: 1 }))
    }
  })
}
if (day > 1) {
  await context.addInitScript(({ doneAt, latestId, goals }) => {
    if (!localStorage.getItem('healthtrack_onboarding')) {
      localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, endedBy: 'completed', doneAt, step: 6, maxStep: 6, goals, flow: 2 }))
      // L'onboarding marque toutes les Nouveautés comme lues : pas de « 258 autres changements » (artefact du 08/11)
      localStorage.setItem('healthtrack-whats-new-last-seen', latestId)
    }
  }, { doneAt: new Date(Date.now() - (day - 1) * 86400000).toISOString(), latestId, goals })
}
const page = await context.newPage()
await page.goto(base, { waitUntil: 'load' })
const entries = personaEntries(generateDemoEntries(), { day, equipment, notes })
await page.evaluate(async (list) => {
  await new Promise((res) => { const q = indexedDB.deleteDatabase('HealthTrack'); q.onsuccess = q.onerror = q.onblocked = () => res() })
  if (list.length) await (await import('/src/storage/localHealthStorage.js')).upsertEntries(list)
}, entries)
await gotoRoute(page, base + '/')

let n = 0
async function shot(full = false) {
  await page.waitForTimeout(600)
  // Visite guidée : capture à la fin du « Voir dans 14 jours » (rideau et compteur, ≈ 1 s), jamais au milieu
  // (POLISH-SIM-20, 21 : « jour 10 » et bande claire venaient d'une capture à 600 ms)
  await page.waitForSelector('.tour-curtain', { state: 'detached', timeout: 3000 }).catch(() => {})
  const file = join(outDir, `${String(++n).padStart(3, '0')}.png`)
  await page.screenshot({ path: file, fullPage: full })
  return { shot: file, url: page.url().replace(base, '') }
}

async function tap(q) {
  if (q.get('x')) { await page.touchscreen.tap(Number(q.get('x')), Number(q.get('y'))); return }
  const text = q.get('text')
  const nth = Math.max(0, Number(q.get('n') || 1) - 1)
  const candidates = [
    page.getByRole('button', { name: text, exact: true }), page.getByRole('link', { name: text, exact: true }),
    page.getByRole('tab', { name: text, exact: true }), page.getByText(text, { exact: true }),
    page.getByRole('button', { name: text }), page.getByRole('link', { name: text }), page.getByText(text),
  ]
  for (const loc of candidates) {
    const visible = loc.filter({ visible: true })
    if (await visible.count() > nth) { await visible.nth(nth).click({ timeout: 4000 }); return }
  }
  throw new Error(`Rien de visible ne s'appelle « ${text} »`)
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const q = url.searchParams
  try {
    let out
    switch (url.pathname) {
      case '/start': out = await shot(); break
      case '/tap': await tap(q); out = await shot(); break
      case '/type':
        if (q.get('label')) await page.getByLabel(q.get('label')).first().fill(q.get('text'))
        else await page.keyboard.type(q.get('text'))
        out = await shot(); break
      case '/scroll': await page.mouse.wheel(0, Number(q.get('dy') || 600)); out = await shot(); break
      case '/back': await page.goBack(); out = await shot(); break
      case '/full': out = await shot(true); break
      case '/quit': res.end('{"ok":true}'); await browser.close(); process.exit(0)
      default: throw new Error('Geste inconnu')
    }
    res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(out))
  } catch (e) {
    res.statusCode = 400; res.end(JSON.stringify({ error: String(e.message || e).split('\n')[0] }))
  }
}).listen(port, '127.0.0.1', () => console.log(`Prêt : http://127.0.0.1:${port}/start (jour ${day}, ${equipment}, ${entries.length} entrées)`))
