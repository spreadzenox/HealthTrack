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
 *   npm run visual -- --dark               # thème sombre de l'app (le clair est celui par défaut)
 *   npm run visual -- --light              # schéma de couleurs clair du téléphone (avec --theme=system)
 *   npm run visual -- --theme=system       # thème « Comme le téléphone »
 *   npm run visual -- --update-banner      # simule une release plus récente
 *   npm run visual -- --update-banner=progress  # … et un téléchargement en cours (plugin AppUpdate simulé)
 *   npm run visual -- --update-banner=stalled   # … téléchargement bloqué (aucun octet depuis 45 s)
 *   npm run visual -- --wellbeing-prompt   # laisse la modale bien-être s'ouvrir
 *   npm run visual -- --whats-new          # affiche le bandeau « Nouveautés »
 *   npm run visual -- --radar              # simule un début d'infection (« Radar forme » en alerte)
 *   npm run visual -- --radar=explained    # … avec « Voyage » noté chaque jour (« Probablement lié à… »)
 *   npm run visual -- --routes=/connectors --hrv-gap  # plus de VFC depuis 4 jours (« qui envoie quoi »)
 *   npm run visual -- --wellbeing-gap      # aucune note de bien-être de J-9 à J-4 (saisie interrompue)
 *   npm run visual -- --routes=/food --food-analysis
 *                                          # analyse photo simulée (réponse Gemini factice) sur /food
 *   npm run visual -- --routes=/food --meal-text       # repas décrit en texte, réponse Gemini factice
 *   npm run visual -- --routes=/food --meal-text=form  # formulaire de description, avant l'envoi
 *   npm run visual -- --play --routes=/food --food-analysis  # variante play : relais Halcya factice, accord accepté ;
 *                                                  --ai-consent=ask : s'arrête sur la divulgation avant l'envoi (6a-2)
 *   npm run visual -- --play --routes=/premium [--billing=none]  # paywall : faux plugin Play Billing (formules
 *                                                     synthétiques, essai 14 j) ; --billing=none : aucune formule
 *   npm run visual -- --play --routes=/settings --subscription=active  # état d'abonnement factice renvoyé par le
 *                                                  relais (free par défaut, launch, active, trial, paused, grace,
 *                                                  on_hold ; grace / on_hold : carte de l'Accueil, 6e) (6c)
 *   npm run visual -- --routes=/data --import          # aperçu d'une sauvegarde choisie (avant import)
 *   npm run visual -- --routes=/data --import=replace  # … puis confirmation « Remplacer mes données »
 *   npm run visual -- --routes=/connectors --devices   # « Mes appareils » : simule Huawei Health + Garmin installés
 *   npm run visual -- --devices=com.huawei.health,nodomain.freeyourgadget.gadgetbridge  # paquets choisis
 *   npm run visual -- --routes=/connectors --ble          # « Capteurs Bluetooth » : faux Bluetooth, recherche lancée
 *   npm run visual -- --routes=/connectors --ble=measure  # … puis mesure cardio en direct sur la ceinture simulée
 *   npm run visual -- --routes=/connectors --ble=receive  # … attente d'une mesure du tensiomètre simulé (1 reçue)
 *   npm run visual -- --routes=/connectors --ble=received # … mesures du tensiomètre reçues et enregistrées
 *   npm run visual -- --routes=/connectors --ble=watch --devices  # « Montre Huawei en direct » : test, la montre répond
 *   npm run visual -- --routes=/connectors --ble=watch-silent --devices  # … la montre ne répond pas (liée à Huawei Santé)
 *   npm run visual -- --routes=/connectors --ble=watch-silent --devices --setup  # … assistant « Libérer et appairer »
 *   npm run visual -- --routes=/connectors --ble=watch --connect       # … « Connexion à la montre » (avant import des paramètres)
 *   npm run visual -- --routes=/connectors --ble=watch --connect=done  # … montre appairée et authentifiée (rapport factice)
 *   npm run visual -- --routes=/montre --connect=done   # écran « Données de la montre » (M5) avec l'issue de chaque lecture
 *   npm run visual -- --routes=/connectors --ble=watch --connect=stalled  # … la montre n'a pas répondu pour le sommeil
 *   npm run visual -- --routes=/connectors --ble=watch --connect=done --companion  # … « Synchro dès que la montre se reconnecte » (à activer)
 *   npm run visual -- --routes=/connectors --ble=watch --connect=done --companion=on  # … activée, montre vue il y a 5 min, relue app fermée il y a 3 min
 *   npm run visual -- --routes=/connectors --phone      # « Temps d'écran et sommeil » : faux plugin, accès accordé
 *   npm run visual -- --routes=/connectors --phone=ask  # … accès pas encore accordé (guide pas à pas)
 *   npm run visual -- --routes=/connectors --face       # « Lecture du visage » : faux plugin, service actif
 *   npm run visual -- --routes=/connectors --face=off   # … pas encore activée ; --face=stopped : arrêtée par le téléphone (Samsung) ;
 *                                                                      --face=blocked : caméra refusée en arrière-plan ;
 *                                                                      --face=nomodel : modèle valence / éveil absent ;
 *                                                                      --face-diag : Diagnostic de la carte déplié
 *   npm run visual -- --play --routes=/connectors --face   # variante play (VITE_DISTRIBUTION=play) : lecture à l'ouverture ;
 *                                                        --face=reading : bandeau « Lecture du visage » en cours (jalon 3b-2)
 *   npm run visual -- --routes=/connectors --face=off --disclosure=camera  # divulgation avant la caméra (jalon 3b) ;
 *                                                     --phone=ask --disclosure=usage, --disclosure=location (sans données de démo : --empty)
 *   npm run visual -- --routes=/ --wellbeing-prompt --phrase="Crevée mais contente, apéro"  # phrase → propositions (I119)
 *   npm run visual -- --wellbeing-prompt --evening-note  # « Note du soir d'un geste » (faux plugin, éteinte ; =on : allumée)
 *   (météo : jamais d'appel à Open-Meteo ; avec les données de démo, météo activée sur Paris et à jour ;
 *    --empty → carte « Météo, pression et air » à activer)
 *   npm run visual -- --empty --routes=/ --onboarding   # premier lancement : l'Accueil redirige vers /bienvenue (jalon 4)
 *   npm run visual -- --routes=/bienvenue --click="Mon ventre > Continuer"  # écrans suivants de l'onboarding
 *                                          (sans --onboarding, il est noté « fait » pour que les autres pages s'affichent)
 *   npm run visual -- --routes=/bienvenue --onboarding=aha   # « Vos 30 derniers jours » (jalon 4b), données de démo
 *   npm run visual -- --routes=/bienvenue --onboarding=gesture   # premier geste (jalon 4c ; gesture-energy : 0 à 5)
 *   npm run visual -- --face=on --routes=/bienvenue --onboarding=face   # lecture du visage facultative (jalon 4c-2)
 *   npm run visual -- --play --routes=/bienvenue --onboarding=premium   # paywall soft en fin d'onboarding (play)
 *   npm run visual -- --routes=/ --goal=energy   # Accueil réglé par l'objectif « énergie et sommeil » (I155 ; sans carte ventre, POL-4)
 *   npm run visual -- --routes=/bienvenue --click="Mon ventre > Continuer > Continuer > Health Connect > Continuer"
 *                                          # écran Health Connect (dans le navigateur : « pas disponible »)
 *   npm run visual -- --size=360x640 --dpr=3   # autre viewport (captures 1080×1920 de la fiche Play)
 *   npm run visual -- --url=http://localhost:5173   # serveur déjà lancé
 *   npm run visual -- --out=.visual/avant  # dossier de sortie
 *   npm run visual -- --viewport --insets=24,48 # simule les barres d'état / navigation d'Android 15+
 *                                          # (variables --safe-area-inset-* injectées par Capacitor, en px)
 *   npm run visual -- --routes=/recommendations --click="Analyse avancée"
 *                                          # clique un bouton (nom accessible) ou un volet <summary> avant la capture
 *                                          # (« Analyse avancée > Comment fonctionne » : plusieurs clics à la suite)
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
import { encodeFrame } from '../../src/devices/huawei/protocol.js'

// Même fuseau que le navigateur simulé, pour que les heures des données de démo soient cohérentes.
process.env.TZ = 'Europe/Paris'

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const DEFAULT_ROUTES = [
  ['/', 'dashboard'],
  ['/journal', 'journal'],
  ['/tendances', 'tendances'],
  ['/food', 'food'],
  ['/nutrition', 'nutrition'],
  ['/data', 'data'],
  ['/connectors', 'connectors'],
  ['/recommendations', 'recommendations'],
  ['/settings', 'settings'],
  ['/plus', 'plus'],
  ['/montre', 'montre'],
  ['/premium', 'premium'],
  ['/bienvenue', 'bienvenue'],
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

/** « 360x640 » → { width: 360, height: 640 } (captures de la fiche Play : ratio ≤ 2, voir scripts/store). */
function parseSize(text) {
  const m = String(text).match(/^(\d+)x(\d+)$/)
  if (!m) throw new Error(`--size attendu sous la forme LARGEURxHAUTEUR, reçu « ${text} »`)
  return { width: Number(m[1]), height: Number(m[2]) }
}

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
      env: { ...process.env, BROWSER: 'none', ...(args.play ? { VITE_DISTRIBUTION: 'play' } : {}) },
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
      viewport: args.size ? parseSize(args.size) : { width: 412, height: 915 },
      deviceScaleFactor: Number(args.dpr || 2),
      isMobile: true,
      hasTouch: true,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      colorScheme: args.light ? 'light' : 'dark',
    })

    // Thème de l'app (src/theme/theme.js) : clair par défaut, comme sur un premier lancement.
    const themeChoice = args.dark ? 'dark' : args.theme
    if (themeChoice) {
      await context.addInitScript((choice) => {
        localStorage.setItem('healthtrack_theme', choice)
      }, themeChoice)
    }

    // Pas d'appel réseau réel vers GitHub : release simulée (ancienne par défaut).
    await context.route('https://api.github.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tag_name: args['update-banner'] ? 'v99999' : 'v0',
          html_url: 'https://github.com/spreadzenox/HealthTrack/releases',
          assets: [
            {
              name: 'HealthTrack-v99999.apk',
              size: 33_562_556,
              digest: `sha256:${'0'.repeat(64)}`,
              browser_download_url: 'https://example.invalid/app.apk',
            },
          ],
        }),
      })
    )
    const bannerMode = args['update-banner']
    if (bannerMode === 'progress' || bannerMode === 'stalled') {
      // Plugin natif AppUpdate simulé (lu par loadAppUpdatePlugin en dev seulement).
      await context.addInitScript((mode) => {
        const t0 = Date.now()
        window.__HT_APP_UPDATE__ = {
          canInstall: async () => ({ granted: true }),
          openInstallSettings: async () => {},
          start: async () => ({ id: 1 }),
          cancel: async () => {},
          install: async () => ({ ok: true }),
          status: async () => {
            const s = (Date.now() - t0) / 1000
            const downloaded = mode === 'stalled' ? 4_200_000 : Math.min(33_000_000, 9_000_000 + s * 1_400_000)
            return { state: 'running', version: '99999', downloaded, total: 33_562_556, reason: 0 }
          },
        }
        if (mode === 'stalled') {
          const realNow = Date.now.bind(Date)
          let first = null
          Date.now = () => {
            const n = realNow()
            if (first == null) first = n
            return n + (n - first > 1500 ? 60_000 : 0)
          }
        }
      }, bannerMode)
    }
    if (args.play) {
      // Paywall (variante play) : faux plugin PlayBilling (lu par src/services/playBilling.js en dev) avec des
      // formules synthétiques ; --billing=none : Google Play ne propose encore aucune formule
      await context.addInitScript((mode) => {
        const phase = (formattedPrice, priceMicros, billingPeriod) => ({ formattedPrice, priceMicros, currency: 'EUR', billingPeriod })
        const offers = mode === 'none' ? [] : [
          { basePlanId: 'annuel', offerId: 'essai', offerToken: 'fake-a', phases: [phase('Gratuit', 0, 'P14D'), phase('29,99 €', 29990000, 'P1Y')] },
          { basePlanId: 'mensuel', offerId: null, offerToken: 'fake-m', phases: [phase('4,99 €', 4990000, 'P1M')] },
        ]
        window.__HT_PLAY_BILLING__ = {
          getProducts: async () => ({ products: offers.length ? [{ productId: 'halcya_premium', offers }] : [] }),
          purchase: async () => ({ status: 'cancelled' }),
          queryPurchases: async () => ({ purchases: [] }),
          addListener: async () => ({ remove() {} }),
        }
        // rappel local de fin d'essai (VC-18b) : le paywall le promet là où le téléphone sait le programmer
        window.__HT_TRIAL_REMINDER__ = { schedule: async () => ({ notifications: true }), cancel: async () => ({}) }
      }, String(args.billing ?? ''))
    }
    // Abonnement (variante play) : jamais d'appel au vrai relais ; état factice choisi par --subscription
    await context.route('**/v1/subscription/verify', (route) => {
      const inDays = (n) => new Date(Date.now() + n * 86_400_000).toISOString()
      const states = {
        free: { premium: false, source: null },
        launch: { premium: true, source: 'launch', launchUntil: inDays(20) },
        active: { premium: true, source: 'play', state: 'active', productId: 'halcya_premium', expiresAt: inDays(300), autoRenewing: true },
        trial: { premium: true, source: 'play', state: 'active', trial: true, productId: 'halcya_premium', expiresAt: inDays(12), autoRenewing: true },
        paused: { premium: false, source: null, state: 'paused', productId: 'halcya_premium', expiresAt: inDays(25) },
        grace: { premium: true, source: 'play', state: 'grace', productId: 'halcya_premium', expiresAt: inDays(5), autoRenewing: true },
        on_hold: { premium: false, source: 'play', state: 'on_hold', productId: 'halcya_premium', expiresAt: inDays(-1) },
      }
      const sub = typeof args.subscription === 'string' && states[args.subscription] ? args.subscription : 'free'
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, ...states[sub] }),
      })
    })
    // Crédits d'analyse IA (variante play) : compteur factice, premium si l'abonnement factice l'est
    await context.route('**/v1/credits', (route) => {
      const premium = ['launch', 'active', 'trial', 'grace'].includes(String(args.subscription ?? ''))
      const d = new Date()
      const credits = premium
        ? { plan: 'premium', remaining: 9, daily: 10, resetAt: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toISOString(), state: 'x' }
        : { plan: 'free', remaining: 22, monthly: 12, welcome: 10, resetAt: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString(), state: 'x' }
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ credits }) })
    })
    // Onboarding (jalon 4) : noté « fait » pour que chaque page s'affiche même --empty, sauf sur /bienvenue
    // (ou avec --onboarding, pour vérifier la redirection d'une installation vierge).
    // Écrans de l'onboarding ouverts directement : « aha » (jalon 4b, résumé depuis les données de démo, sans relire
    // Health Connect), premier geste et paywall soft (jalon 4c ; ce dernier avec --play).
    const ONBOARDING_AT = {
      aha: { goal: 'energy', watch: 'health_connect', health: 'granted', imported: true, step: 4 },
      gesture: { goal: 'gut', watch: 'none', step: 3, maxStep: 3 },
      'gesture-energy': { goal: 'energy', watch: 'none', step: 3, maxStep: 3 },
      // Lecture du visage facultative (jalon 4c-2) : seulement avec --face (sinon le téléphone « ne sait pas lire »)
      face: { goal: 'gut', watch: 'none', step: 3, maxStep: 3 },
      premium: { goal: 'gut', watch: 'none', step: 4, maxStep: 4 },
    }
    if (ONBOARDING_AT[args.onboarding]) {
      await context.addInitScript((state) => {
        try {
          localStorage.setItem('healthtrack_onboarding', JSON.stringify(state))
        } catch {
          /* ignore */
        }
      }, ONBOARDING_AT[args.onboarding])
    } else if (!args.onboarding) {
      await context.addInitScript((goal) => {
        try {
          if (!location.pathname.startsWith('/bienvenue') && !localStorage.getItem('healthtrack_onboarding')) {
            localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, endedBy: 'visual', goal }))
          }
        } catch {
          /* ignore */
        }
      }, typeof args.goal === 'string' ? args.goal : null)
    }
    // Météo : jamais d'appel réseau réel. Avec les données de démo, météo activée (Paris) et à jour.
    await context.route('https://*.open-meteo.com/**', (route) => route.abort())
    if (!args.empty) {
      await context.addInitScript(() => {
        try {
          localStorage.setItem(
            'healthtrack_weather',
            JSON.stringify({
              enabled: true,
              location: { lat: 48.9, lon: 2.4, name: 'Paris' },
              lastSyncAt: new Date(Date.now() - 40 * 60000).toISOString(),
              lastError: null,
              today: { tempMaxC: 14.2, tempMinC: 6.8, precipMm: 2.4, sunshineH: 1.5, pressureHpa: 1004, pressureChangeHpa: -8.2, aqi: 24, pollen: { grass: 3 }, pollenMax: 3 },
            }),
          )
        } catch {
          /* ignore */
        }
      })
    }
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
      // Variante play : même réponse, par le relais Halcya
      await context.route('**/v1/meal/analyze', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            parsed: args['meal-text'] ? FAKE_MEAL_TEXT_ANALYSIS : FAKE_MEAL_ANALYSIS,
            model: 'gemini-2.5-flash-lite',
            quota: { remaining: 18, resetAt: new Date(Date.now() + 6 * 3600_000).toISOString() },
          }),
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
    if (args.connect === 'done' || args.connect === 'stalled') {
      // --connect=done : « Connexion à la montre » réussie (rapport factice déjà en mémoire)
      // --connect=stalled : … mais la montre n'a pas répondu pour le sommeil (I69)
      await context.addInitScript((stalled) => {
        const step = (id, label, status, detail = null) => ({ id, label, status, detail })
        const t = new Date(Date.now() - 120000).toISOString()
        localStorage.setItem('healthtrack_huawei_secrets', JSON.stringify({ v1: '00', v2: '00', v3: '00' }))
        localStorage.setItem(
          'healthtrack_watch_autosync',
          JSON.stringify({
            at: t, auto: true, outcome: 'connected', label: '38 minutes → 9 mesures', inserted: stalled ? 0 : 9, stalled: stalled ? ['sommeil'] : null, battery: 84, failures: 0, everConnected: true,
            // Issue de chaque lecture (écran « Montre », M5)
            readsAt: t,
            reads: [['sleep', 'ok'], ['minutes', 'ok'], ['totals', 'ok'], ['workouts', 'empty'], ['sleepFile', stalled ? 'timeout' : 'ok'], ['stress', 'ok'], ['hrvDay', 'ok'], ['skinTemp', 'ok']].map(([id, outcome]) => ({ id, outcome, count: outcome === 'ok' ? 3 : 0 })),
          }),
        )
        localStorage.setItem(
          'healthtrack_watch_connect_last',
          JSON.stringify({
            startedAt: t,
            finishedAt: t,
            steps: [
              step('connect', 'Connexion à la montre', 'ok', 'Bluetooth classique'),
              step('link', 'Paramètres du lien', 'ok', 'HiChain · version 2 · GCM'),
              step('negotiate', 'Négociation de sécurité', 'ok', 'HiChain'),
              step('bind', 'Premier appairage (PIN et clé)', 'ok', 'clé gardée sur ce téléphone'),
              step('auth', 'Authentification', 'ok', 'trames chiffrées (AES-GCM)'),
              step('check', 'Échange chiffré (batterie)', 'ok', 'batterie 87 %'),
              step('associate', 'Fin d’association côté montre', 'ok', '11 acceptés, appareil principal déclaré'),
              step('sync', 'Lecture des mesures', 'ok', '1 248 minutes, 2 nuits → 214 mesures'),
            ],
            sync: { label: '1 248 minutes, 2 nuits → 214 mesures', inserted: 214 },
            association: { deviceStatus: 1, sentSetupStatus: true, accepted: 11, refused: 0, steps: [], freshData: false, userSaw: 'watchface' },
            outcome: { code: 'connected', title: 'Montre appairée à Halcya' },
            log: [],
          }),
        )
      }, args.connect === 'stalled')
    }
    if (args.companion) {
      // Montre en appareil compagnon (src/services/watchPresence.js) : Android 13+, association à faire ou faite
      await context.addInitScript((on) => {
        const state = { associations: on ? [{ id: 7, deviceId: 'fake-watch' }] : [] }
        window.__healthtrackFakeCompanion = {
          status: async () => ({ supported: true, associations: state.associations, ...(on ? { last: { at: Date.now() - 5 * 60000, event: 'appeared', appearedCount: 3 } } : {}) }),
          associate: async ({ deviceId }) => {
            state.associations = [{ id: 7, deviceId }]
            return { associated: true, id: 7 }
          },
          addListener: async () => ({ remove: async () => {} }),
        }
        // Relecture app fermée (BackgroundWatchSync.java) : montre relue il y a 3 min
        if (on) {
          window.__healthtrackFakeWatchCapture = {
            list: async () => ({ captures: [] }),
            remove: async () => ({ removed: 0 }),
            background: async () => ({ busy: false, lastSuccessAt: Date.now() - 3 * 60000, battery: 74 }),
            shareResume: async () => {},
          }
        }
      }, args.companion === 'on')
    }
    if (args.devices) {
      // « Mes appareils » : apps santé « installées » (lu par src/components/MyDevices.jsx).
      const packages = args.devices === true ? ['com.huawei.health', 'com.garmin.android.apps.connectmobile'] : String(args.devices).split(',')
      await context.addInitScript((pkgs) => {
        window.__healthtrackFakeInstalledPackages = pkgs
      }, packages)
    }
    if (args.ble) {
      // « Capteurs Bluetooth » : faux client BLE (lu par src/devices/ble/bleService.js), sans adresse réelle.
      // Réponse de la montre simulée aux paramètres du lien (protocole v2, authentification v2, 1 étiquette récente)
      const linkAnswer = Array.from(
        encodeFrame(1, 1, [
          { tag: 1, value: [2] },
          { tag: 2, value: [0x02, 0x00] },
          { tag: 3, value: [0x01, 0xf4] },
          { tag: 4, value: [0x00, 0x1e] },
          { tag: 5, value: [0x00, 0x02, ...Array(16).fill(0x42)] },
          { tag: 7, value: [0x01] },
        ]),
      )
      await context.addInitScript(({ mode, linkAnswer }) => {
        const dv = (bytes) => new DataView(Uint8Array.from(bytes).buffer)
        const DIS = '0000180a-0000-1000-8000-00805f9b34fb'
        const FE86 = '0000fe86-0000-1000-8000-00805f9b34fb'
        let watchNotify = null
        const HR = '0000180d-0000-1000-8000-00805f9b34fb'
        let onDisconnect = null
        if (mode === 'watch' || mode === 'watch-silent') {
          // GT 6 Pro : Bluetooth classique (RFCOMM) ; « watch-silent » = montre liée à Huawei Santé, muette
          const listeners = {}
          const hex = linkAnswer.map((b) => b.toString(16).padStart(2, '0')).join('')
          window.__healthtrackFakeAppManager = { uninstall: async () => {}, openSettings: async () => {} }
          window.__healthtrackFakeBtClassic = {
            listBonded: async () => ({ devices: [{ deviceId: 'fake-watch', name: 'HUAWEI WATCH GT 6 Pro-A1B', type: 3, uuids: ['82ff3820-8411-400c-b85a-55bdb32cf060'] }] }),
            discover: async () => ({ devices: [{ deviceId: 'fake-watch', name: 'HUAWEI WATCH GT 6 Pro-A1B', rssi: -50 }] }),
            pair: async () => ({ state: 'bonded' }),
            openBluetoothSettings: async () => {},
            addListener: async (e, cb) => {
              listeners[e] = cb
              return { remove: async () => {} }
            },
            connect: async () => {},
            write: async () => {
              if (mode === 'watch') setTimeout(() => listeners.data?.({ value: hex }), 150)
            },
            disconnect: async () => {},
          }
        }
        window.__healthtrackFakeBle = {
          scanMs: 300,
          initialize: async () => {},
          isEnabled: async () => true,
          getBondedDevices: async () => [{ deviceId: 'fake-watch', name: 'HUAWEI WATCH GT 6 Pro-A1B' }],
          requestLEScan: async (_o, cb) => {
            cb({ device: { deviceId: 'fake-h10', name: 'Polar H10 9A1B2C3D' }, rssi: -58, uuids: [HR], manufacturerData: { 107: dv([1]) } })
            cb({ device: { deviceId: 'fake-bp', name: 'BP7000' }, rssi: -72, uuids: ['00001810-0000-1000-8000-00805f9b34fb'] })
            cb({ device: { deviceId: 'fake-tv', name: '[TV] Salon' }, rssi: -80, manufacturerData: { 117: dv([1]) } })
            cb({ device: { deviceId: 'fake-x', name: '' }, rssi: -90, manufacturerData: { 6: dv([1]) } })
          },
          stopLEScan: async () => {},
          connect: async (_id, cb) => {
            onDisconnect = cb
          },
          disconnect: async () => {},
          getServices: async () => [
            { uuid: DIS, characteristics: [{ uuid: '00002a24-0000-1000-8000-00805f9b34fb' }] },
            { uuid: FE86, characteristics: [{ uuid: '0000fe01-0000-1000-8000-00805f9b34fb' }, { uuid: '0000fe02-0000-1000-8000-00805f9b34fb' }] },
          ],
          read: async (_id, _s, c) => {
            if (c.startsWith('00002a24')) return dv([...new TextEncoder().encode('GT6 Pro')])
            if (c.startsWith('00002a26')) return dv([...new TextEncoder().encode('6.0.0.110')])
            throw new Error('absent')
          },
          write: async () => {
            if (mode === 'watch') setTimeout(() => watchNotify?.(dv(linkAnswer)), 100)
          },
          startNotifications: async (_id, _s, c, cb) => {
            if (c.startsWith('0000fe02')) {
              watchNotify = cb
              return
            }
            if (c.startsWith('00002a35')) {
              // tensiomètre : mesure du jour (mmHg, horodatée, pouls) puis, en mode « received », une ancienne et déconnexion
              const sf = (v) => [v & 0xff, (v >> 8) & 0x0f]
              const d = new Date()
              const ts = [d.getFullYear() & 0xff, d.getFullYear() >> 8, d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0]
              setTimeout(() => cb(dv([0x06, ...sf(127), ...sf(81), ...sf(96), ...ts, ...sf(63)])), 200)
              if (mode === 'received') {
                setTimeout(() => cb(dv([0x04, ...sf(122), ...sf(79), ...sf(93), ...sf(66)])), 400)
                setTimeout(() => onDisconnect?.(), 600)
              }
              return
            }
            let i = 0
            window.__fakeBleTimer = setInterval(() => {
              const rr = 960 + (i++ % 3) * 25
              cb(dv([0x10, 62 + (i % 2), rr & 0xff, rr >> 8]))
            }, 200)
          },
          stopNotifications: async () => clearInterval(window.__fakeBleTimer),
        }
      }, { mode: String(args.ble), linkAnswer })
    }
    if (args.phone) {
      // « Temps d'écran et sommeil » : faux plugin PhoneUsage (lu par src/services/phoneUsageSync.js).
      // --phone → accès accordé et activé ; --phone=ask → accès pas encore accordé (guide pas à pas).
      await context.addInitScript((mode) => {
        const granted = mode !== 'ask'
        try {
          localStorage.setItem('healthtrack_phone_usage', JSON.stringify({ enabled: true }))
        } catch {
          /* ignore */
        }
        const at = (d, h, m) => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - d, h, m).getTime()
        const events = []
        for (let d = 9; d >= 0; d--) {
          for (const [h, m, mins] of [[3, 12, 1], [7, 5, 18], [12, 30, 40], [18, 10, 85], [22, 35, 55 + d * 3]]) {
            const t = at(d, h, m)
            if (t + mins * 60000 > Date.now()) continue
            events.push({ t, e: 'on' }, { t: t + 4000, e: 'unlock' }, { t: t + mins * 60000, e: 'off' })
          }
        }
        window.__healthtrackFakePhoneUsage = {
          checkAccess: async () => ({ granted, supported: true }),
          openAccessSettings: async () => {},
          queryScreenEvents: async () => ({ events }),
          // Temps par app (I116) : chaque session d'écran répartie entre quelques apps fictives.
          queryAppEvents: async () => {
            const cycle = ['com.instagram.android', 'com.whatsapp', 'com.google.android.youtube', 'com.example.notes']
            const appEvents = []
            for (let i = 0; i < events.length; i += 3) {
              const on = events[i].t
              const off = events[i + 2].t
              const step = (off - on) / cycle.length
              cycle.forEach((p, k) => appEvents.push({ t: on + k * step, e: 'fg', p }, { t: on + (k + 1) * step, e: 'bg', p }))
              appEvents.push({ t: off, e: 'off' })
            }
            return {
              events: appEvents,
              apps: {
                'com.instagram.android': { label: 'Instagram', category: -1 },
                'com.whatsapp': { label: 'WhatsApp', category: 4 },
                'com.google.android.youtube': { label: 'YouTube', category: 2 },
                'com.example.notes': { label: 'Notes', category: 7 },
              },
            }
          },
        }
      }, String(args.phone))
    }
    if (args.face) {
      // « Lecture du visage » : faux plugin FaceSense (lu par src/services/faceSense.js). Jamais de score.
      await context.addInitScript(([mode, play]) => {
        const on = mode !== 'off'
        try {
          localStorage.setItem('healthtrack_face_sense', JSON.stringify({ enabled: on }))
        } catch {
          /* ignore */
        }
        const status = {
          models: true, enabled: on, permission: true, running: on && mode !== 'stopped', batteryExempt: false,
          dayUnlocks: 14, dayBursts: 11, dayFaces: 8, timed: 11, sumCameraMs: 11 * 1350, sumInferenceMs: 11 * 120,
          lastOutcome: 'face', lastTrigger: 'unlock', lastOutcomeAt: Date.now() - 6 * 60000,
          outcomes: { face: 8, no_valid_frame: 3, 'skip:too_soon': 3 }, rejected: { no_face: 4, too_dark: 3, turned: 2 },
          startBattery: 82, battery: 76, manufacturer: 'samsung', model: 'SM-A566B', release: '16', sdk: 36, pending: 11,
          retries: 3, retryFaces: 2,
          // Cause de l'arrêt (I123) : --face=stopped → arrêtée par le téléphone, sans mise à jour ni redémarrage.
          startedAt: Date.now() - 5 * 3600000, lastUpdateAt: Date.now() - 26 * 3600000, bootAt: Date.now() - 50 * 3600000,
          // Modèle valence / éveil (étape 2) ; --face=nomodel : pas encore téléchargé.
          affectModel: mode !== 'nomodel', affectBursts: 6, affectLoadMs: 280, affectDownloadMs: 8400,
          // Duo (I126) : second modèle (MobileFaceNet) ; --face=nomodel : absent lui aussi.
          affectModel2: mode !== 'nomodel', affectDuoBursts: 4, affect2LoadMs: 110,
          resumeNotices: 1, resumeTaps: 1, resumeCheck: 'running', resumeCheckAt: Date.now() - 40 * 60000, resumeCheckTrigger: 'periodic',
          // Repérage du déverrouillage et accès caméra (signalement du 19/10 15:05) ; --face=blocked : caméra refusée.
          dayScreenOns: 19, dayPresents: 12, dayUnlock_user_present: 12, dayUnlock_keyguard: 2, lastUnlockAt: Date.now() - 6 * 60000,
          lastUnlockSource: 'user_present', lastScreenOnAt: Date.now() - 6 * 60000, cameraOp: 'foreground', startOrigin: 'app', starts: 3,
          attempts: JSON.stringify([
            { at: Date.now() - 30 * 60000, trigger: 'manual', source: 'test', outcome: 'face' },
            { at: Date.now() - 12 * 60000, trigger: 'unlock', source: 'keyguard', outcome: 'no_valid_frame' },
            { at: Date.now() - 6 * 60000, trigger: 'unlock', source: 'user_present', outcome: mode === 'blocked' ? 'camera:camera_disabled' : 'face',
              ...(mode === 'blocked' ? { detail: 'onError:3' } : {}) },
          ]),
        }
        // Variante play (--play) : pas de service, lectures à l'ouverture de l'app ; --face=reading : lecture en cours.
        // (intervalle de 30 min côté JS remis à zéro : la page est rechargée après le remplissage des données)
        if (play) localStorage.removeItem('healthtrack_face_app_open')
        if (play) Object.assign(status, { mode: 'app_open', running: false, dayAppOpens: 3, dayAppOpenFaces: 2, lastTrigger: 'app_open' })
        // 11 rafales en attente (scores fictifs) sur 3 jours, rangées dans l'historique à l'affichage de la carte (I90)
        let bursts = Array.from({ length: 11 }, (_, i) => ({
          name: `capture-${i}-000.json`,
          json: JSON.stringify({ v: 1, at: Date.now() - (i + 1) * 5 * 3600000, trigger: i === 0 ? 'manual' : 'unlock', frames: 3, valid: i % 4 === 3 ? 0 : 3, values: { smile: 0.2 }, rejected: {}, ms: { camera: 1350, inference: 120 } }),
        }))
        window.__healthtrackFakeFaceSense = {
          status: async () => ({ ...status, pending: bursts.length }),
          list: async () => ({ bursts }),
          remove: async ({ names }) => {
            bursts = bursts.filter((b) => !names.includes(b.name))
            return { removed: names.length }
          },
          start: async () => ({ started: true, permission: true }),
          stop: async () => {},
          test: async () => {},
          requestBatteryExemption: async () => {},
          openNeverSleep: async () => ({ opened: 'samsung' }),
          prepareAffect: async () => ({ ready: mode !== 'nomodel', downloading: mode === 'nomodel' }),
          ...(play ? { readNow: () => new Promise((r) => setTimeout(() => r({ outcome: 'face' }), mode === 'reading' ? 600000 : 50)) } : {}),
        }
        // Sonde vocale (I124) : un A56 plausible, français téléchargeable mais pas encore installé.
        window.__healthtrackFakeVoiceProbe = {
          probe: async () => ({ sdk: 36, language: 'fr-FR', available: true, onDevice: true, supportFrom: 'on_device',
            defaultService: 'com.google.android.as', services: ['com.google.android.as', 'com.samsung.android.bixby.agent'],
            support: { installed: ['en-US'], pending: [], supported: ['fr-FR', 'de-DE'], online: [] }, errors: [] }),
        }
      }, [String(args.face), !!args.play])
    }
    if (args['evening-note']) {
      await context.addInitScript((mode) => {
        let s = { enabled: mode === 'on', minuteOfDay: 21 * 60 + 40, notifications: true, nextAt: Date.now() + 3600000,
          pending: 0, asked: 5, answers: 4, check: 'asked', checkAt: Date.now() - 86400000 }
        window.__healthtrackFakeEveningNote = {
          status: async () => s,
          configure: async (o) => (s = { ...s, ...o }),
          requestNotifications: async () => ({ asked: true, notifications: true }),
          list: async () => ({ notes: [] }),
          remove: async () => ({ removed: 0 }),
        }
      }, String(args['evening-note']))
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
    let entries = args.empty ? [] : generateDemoEntries({ illness: Boolean(args.radar) })
    if (args['wellbeing-gap']) {
      // Saisie interrompue (vacances…) : pas de note de bien-être entre 9 et 4 jours avant aujourd'hui.
      const dayStart = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n); return d }
      const from = dayStart(9)
      const to = dayStart(3)
      entries = entries.filter((e) => e.type !== 'wellbeing' || new Date(e.at) < from || new Date(e.at) >= to)
    }
    const daysAgo = (n, h) => { const d = new Date(); d.setHours(h, 0, 0, 0); d.setDate(d.getDate() - n); return d }
    if (args.radar === 'explained') {
      // Check-in du matin avec « Voyage » chacun des jours simulés « malades » : radar expliqué.
      for (const n of [0, 1, 2]) {
        entries.push({ type: 'wellbeing', source: 'app_wellbeing', at: daysAgo(n, 8).toISOString(), payload: { score: 3, tags: ['travel'] } })
      }
    }
    if (args['hrv-gap']) {
      // La montre n'envoie plus sa VFC depuis 4 jours (le reste continue d'arriver).
      const from = daysAgo(4, 0)
      entries = entries.filter((e) => e.payload?.subtype !== 'heartRateVariability' || new Date(e.at) < from)
    }
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
        if (args.onboarding === 'aha' && path === '/bienvenue') {
          await page.locator('.onb-facts, .onb-note').first().waitFor({ timeout: 10000 })
        }
        if (args['food-analysis'] && path === '/food') {
          await page.locator('#gallery-upload').setInputFiles({ name: 'repas.png', mimeType: 'image/png', buffer: DEMO_PHOTO })
          await page.getByRole('button', { name: 'Analyser les ingrédients' }).click()
          if (args.play) {
            const accept = page.getByRole('button', { name: /J’accepte, analyser ce repas/ })
            await accept.waitFor({ timeout: 10000 })
            if (args['ai-consent'] !== 'ask') await accept.click()
          }
          if (!(args.play && args['ai-consent'] === 'ask')) {
            await page.getByRole('heading', { name: FAKE_MEAL_ANALYSIS.dish }).waitFor({ timeout: 10000 })
          }
        }
        if (args['meal-text'] && path === '/food') {
          await page.getByRole('button', { name: /Décrire ou saisir sans photo/ }).click()
          await page.getByLabel('Décrivez votre repas').fill(MEAL_TEXT)
          if (args['meal-text'] !== 'form') {
            await page.getByRole('button', { name: /Remplir avec (Gemini|l’IA)/ }).click()
            if (args.play) await page.getByRole('button', { name: /J’accepte, analyser ce repas/ }).click()
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
        if (args.disclosure) {
          // --disclosure=camera|usage|location : divulgation affichée avant la demande d'Android (jalon 3b)
          const trigger = { camera: 'Activer la lecture du visage', location: 'Utiliser ma position approximative' }[args.disclosure]
          const button = trigger
            ? page.getByRole('button', { name: trigger })
            : page.locator('section', { hasText: 'Temps d’écran' }).getByRole('button', { name: 'Activer' })
          await button.first().evaluate((el) => el.scrollIntoView({ block: 'center' }))
          await button.first().click()
          await page.getByRole('dialog').waitFor({ timeout: 10000 })
          await page.waitForTimeout(300)
        }
        if (args['face-diag']) {
          // --face-diag : Diagnostic de la carte « Lecture du visage » déplié et centré (modèles, accord du duo…)
          await page.evaluate(() => {
            const d = [...document.querySelectorAll('details.connectors-more')].find((x) => x.querySelector('summary')?.textContent === 'Diagnostic')
            if (d) { d.open = true; d.scrollIntoView({ block: 'start' }) }
          })
          await page.waitForTimeout(300)
        }
        if (args.ble === 'watch' || args.ble === 'watch-silent') {
          // le test vit sous « Dépannage », replié une fois la montre connectée
          await page.evaluate(() => document.querySelectorAll('details.watch-trouble, details.connectors-more').forEach((d) => (d.open = true)))
          const testButton = page.getByRole('button', { name: /^(Tester la connexion directe|Relancer le test)$/ }).first()
          await testButton.evaluate((el) => el.scrollIntoView({ block: 'center' }))
          await testButton.click()
          await page.getByRole('button', { name: 'Relancer le test' }).waitFor({ timeout: 30000 })
          // --setup : capture centrée sur l'assistant « Libérer et appairer la montre »
          await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), args.connect ? '.watch-connect' : args.setup ? '.watch-setup' : '.watch-diag')
          await page.waitForTimeout(300)
        } else if (args.ble) {
          // « Capteurs Bluetooth » vit sous « Brancher une autre source », replié quand une source envoie déjà
          await page.evaluate(() => document.querySelectorAll('details.connectors-more').forEach((d) => (d.open = true)))
          await page.getByRole('button', { name: 'Rechercher autour de moi' }).click()
          await page.waitForTimeout(700)
          if (args.ble === 'measure') {
            await page.getByRole('button', { name: /Mesurer ma VFC/ }).click()
            await page.waitForTimeout(2500)
          }
          if (args.ble === 'receive' || args.ble === 'received') {
            await page.getByRole('button', { name: 'Recevoir la mesure' }).click()
            await page.waitForTimeout(1200)
          }
          await page.evaluate(() => document.querySelector('.ble-devices')?.scrollIntoView({ block: 'start' }))
          await page.waitForTimeout(300)
        }
        // Un bouton, ou à défaut un volet repliable (<summary>), un choix radio ou une case qui contient ce texte ; « A > B » clique A puis B.
        for (const target of args.click ? String(args.click).split(' > ') : []) {
          let button = page.getByRole('button', { name: target }).first()
          if (!(await button.count())) button = page.locator('summary', { hasText: target }).first()
          if (!(await button.count())) button = page.getByRole('radio', { name: target }).first()
          if (!(await button.count())) button = page.getByRole('checkbox', { name: target }).first()
          if (await button.count()) {
            await button.click()
            await page.waitForTimeout(700)
          }
        }
        if (args.phrase) {
          const field = page.getByLabel(/En une phrase/).first()
          if (await field.count()) {
            await field.fill(String(args.phrase))
            await field.evaluate((el) => el.scrollIntoView({ block: 'center' }))
            await page.waitForTimeout(300)
          }
        }
        const file = join(outDir, `${name}.png`)
        await page.screenshot({ path: file, fullPage: !args.viewport })
        current.screenshot = file
        // Découpe en écrans successifs (plus lisibles qu'une capture très haute).
        const height = await page.evaluate(() => document.documentElement.scrollHeight)
        const vp = page.viewportSize()
        // La barre d'onglets fixe recouvre le bas du 1er écran : les écrans se chevauchent
        // de sa hauteur pour que ce qu'elle cache apparaisse en haut de l'écran suivant.
        const overlap = await page.evaluate(() => document.querySelector('.tabbar')?.getBoundingClientRect().height || 0)
        const step = vp.height - Math.round(overlap)
        current.tiles = []
        for (let k = 0; (k === 0 || k * step + overlap < height) && k < 12; k++) {
          const tile = join(outDir, 'tiles', `${name}-${k + 1}.png`)
          mkdirSync(dirname(tile), { recursive: true })
          const h = Math.min(vp.height, height - k * step)
          // Écrans suivants : barre masquée, sinon elle cache de nouveau le même contenu
          if (k === 1) await page.evaluate(() => document.querySelector('.tabbar')?.style.setProperty('visibility', 'hidden'))
          await page.screenshot({ path: tile, fullPage: true, clip: { x: 0, y: k * step, width: vp.width, height: h } })
          current.tiles.push(tile)
        }
        await page.evaluate(() => document.querySelector('.tabbar')?.style.removeProperty('visibility'))
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
