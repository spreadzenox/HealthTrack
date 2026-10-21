#!/usr/bin/env node
/**
 * Mesure de performance (directive D2 « mesurer d'abord ») : construit l'app (vite build), la sert
 * (vite preview), injecte des données de démo sur une longue période dans IndexedDB, puis charge
 * chaque page dans un viewport ≈ Galaxy A56 et relève :
 *   - `settledMs`  : temps entre la navigation et la fin de la dernière tâche longue (> 50 ms) suivie de
 *                    1 s de calme (≈ « page utilisable ») ;
 *   - `tbtMs`      : temps bloquant total (somme des tâches longues au-delà de 50 ms) ;
 *   - `longestMs`  : tâche longue la plus longue ;
 *   - `idbReads` / `idbRecords` : nombre de lectures IndexedDB (getAll, get, count, curseurs) et
 *                    d'enregistrements renvoyés par la page ;
 *   - `workerReads` / `workerRecords` : idem pour le Web Worker des analyses (instrumenté en réécrivant
 *                    son script à la volée), attendu jusqu'à la fin de ses lectures.
 * Chaque page est mesurée `--runs` fois (médiane). Le processeur est ralenti (`--cpu`, ×4 par défaut,
 * via CDP) pour approcher un téléphone milieu de gamme.
 *
 * Usage :
 *   npm run perf                       # 3 ans de démo, toutes les pages, 3 passages, CPU ×4
 *   npm run perf -- --days=365         # 1 an
 *   npm run perf -- --dense            # + fréquence cardiaque toutes les heures (≈ montre synchronisée)
 *   npm run perf -- --spo2=minute      # + SpO₂ de la montre à la minute sur 30 j (format ≤ v138, I82)
 *   npm run perf -- --spo2=slot        # + la même SpO₂ en tranches de 10 min (format actuel) ; --spo2-days=N
 *   npm run perf -- --routes=/,/data   # pages choisies
 *   npm run perf -- --runs=5 --cpu=6
 *   npm run perf -- --no-build         # réutilise dist/
 *   npm run perf -- --keep-cache       # garde le cache des analyses entre passages (ouverture « à chaud »)
 *   npm run perf -- --budget           # échoue si une page lit plus d'enregistrements que `budget.json`
 *                                      # (garde-fou CI ; la démo prend alors les `days` du budget)
 *
 * Par défaut le cache des analyses (`healthtrack-analysis-cache-v1`) est vidé avant chaque passage :
 * la mesure est celle d'une ouverture après une écriture (pire cas). Les tâches lourdes tournent alors
 * dans un Web Worker, hors du fil principal, et ne comptent pas dans les tâches longues de la page.
 *
 * Sortie : tableau dans la console + `.perf/report.json`.
 */
import { spawn, execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateDemoEntries } from '../visual/demoData.mjs'
import { checkBudget } from './budget.mjs'

process.env.TZ = 'Europe/Paris'
const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const DEFAULT_ROUTES = ['/', '/journal', '/food', '/nutrition', '/data', '/connectors', '/recommendations', '/settings', '/plus']

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
      if ((await fetch(url)).ok) return
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`Serveur injoignable : ${url}`)
}

/** Fréquence cardiaque toutes les heures (comme une montre synchronisée), en plus de la démo. */
export function denseHeartRate(days, now = new Date()) {
  const out = []
  for (let i = days; i >= 0; i--) {
    for (let h = 0; h < 24; h++) {
      const at = new Date(now)
      at.setDate(at.getDate() - i)
      at.setHours(h, 17, 0, 0)
      if (at > now) continue
      const bpm = Math.round(62 + 18 * Math.sin(((h - 4) / 24) * 2 * Math.PI) + ((i * 7 + h * 13) % 9))
      out.push({ type: 'heart_rate', source: 'perf_dense', at: at.toISOString(), payload: { bpm, subtype: 'heartRate' } })
    }
  }
  return out
}

/**
 * SpO₂ de la montre Huawei sur `days` jours, une mesure par minute : `minute` = une entrée par minute (format
 * jusqu'à la v138), `slot` = une entrée par tranche de 10 min (I82). Mêmes valeurs dans les deux cas.
 */
export function watchSpo2(days, mode, now = new Date()) {
  const out = []
  const end = Math.floor(now.getTime() / 600_000) * 600_000
  const base = { unit: '%', subtype: 'oxygenSaturation', connector: 'huawei_watch' }
  for (let s = end - days * 86_400_000; s < end; s += 600_000) {
    const values = Array.from({ length: 10 }, (_, m) => 94 + ((s / 60_000 + m) * 7) % 6)
    if (mode === 'slot') {
      const value = Math.round(values.reduce((a, v) => a + v, 0) / 10)
      out.push({ type: 'heart_rate', source: 'huawei_watch', at: new Date(s + 20_000).toISOString(), payload: { value, samples: 10, min: Math.min(...values), max: Math.max(...values), ...base } })
    } else {
      values.forEach((value, m) => out.push({ type: 'heart_rate', source: 'huawei_watch', at: new Date(s + m * 60_000 + 30_000).toISOString(), payload: { value, ...base } }))
    }
  }
  return out
}

export const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0
}

function latestChangelogId() {
  const files = readdirSync(join(APP_DIR, 'src/data/changelog')).filter((f) => f.endsWith('.json'))
  return files.sort().at(-1)?.replace(/\.json$/, '') ?? null
}

/**
 * Script injecté (page, et Worker des analyses) : compte les lectures IndexedDB et suit les tâches
 * longues. `pending` = requêtes pas encore terminées.
 */
function instrument() {
  const stats = { idbReads: 0, idbRecords: 0, pending: 0, longTasks: [] }
  globalThis.__perf = stats
  const wrap = (proto, name, count) => {
    const orig = proto[name]
    if (!orig) return
    proto[name] = function (...a) {
      const req = orig.apply(this, a)
      stats.idbReads++
      stats.pending++
      // Un curseur repasse par « success » à chaque position : `pending` ne baisse qu'en fin de parcours
      const done = () => {
        stats.pending--
      }
      req.addEventListener('success', () => {
        stats.idbRecords += count(req.result)
        if (name !== 'openCursor' || !req.result) done()
      })
      req.addEventListener('error', done)
      return req
    }
  }
  const many = (r) => (Array.isArray(r) ? r.length : 0)
  // Un curseur déclenche « success » à chaque position (ouverture, continue, advance) : un enregistrement
  // par événement, null en fin de parcours
  const one = (r) => (r === undefined || r === null ? 0 : 1)
  for (const P of [IDBObjectStore.prototype, IDBIndex.prototype]) {
    wrap(P, 'getAll', many)
    wrap(P, 'get', one)
    wrap(P, 'count', () => 0)
    wrap(P, 'openCursor', one)
  }
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) stats.longTasks.push({ start: e.startTime, duration: e.duration })
    }).observe({ type: 'longtask', buffered: true })
  } catch {
    /* longtask non pris en charge */
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const budget = args.budget ? JSON.parse(readFileSync(join(APP_DIR, 'scripts/perf/budget.json'), 'utf8')) : null
  const days = Number(args.days || budget?.days || 1095)
  const runs = Number(args.runs || 3)
  const cpu = Number(args.cpu || 4)
  const port = Number(args.port || 5299)
  const routes = args.routes ? String(args.routes).split(',') : DEFAULT_ROUTES
  const outDir = resolve(APP_DIR, args.out || '.perf')
  mkdirSync(outDir, { recursive: true })

  if (!args['no-build']) execSync('npx vite build --logLevel error', { cwd: APP_DIR, stdio: 'inherit' })
  const server = spawn(join(APP_DIR, 'node_modules/.bin/vite'), ['preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: APP_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const cleanup = () => server.kill('SIGTERM')
  process.on('exit', cleanup)
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    await waitForServer(baseUrl)
    const { chromium } = await loadPlaywright()
    const browser = await chromium.launch()
    const context = await browser.newContext({
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
    })
    await context.route('https://api.github.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"tag_name":"v0","assets":[]}' }))
    await context.route('https://*.open-meteo.com/**', (r) => r.abort())
    await context.addInitScript((latestId) => {
      try {
        if (latestId) localStorage.setItem('healthtrack-whats-new-last-seen', latestId)
        // Pas de modale bien-être par-dessus la page mesurée
        sessionStorage.setItem('healthtrack-wellbeing-prompt-session', '1')
      } catch {
        /* ignore */
      }
    }, latestChangelogId())
    await context.addInitScript(instrument)
    // Le Worker n'hérite pas des scripts injectés : son fichier est servi précédé de l'instrumentation
    await context.route('**/assets/analysis.worker*.js', async (route) => {
      const res = await route.fetch()
      route.fulfill({ response: res, body: `(${instrument})();\n${await res.text()}` })
    })

    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))

    // Données : la base est créée par l'app (bon schéma), puis remplie en une transaction.
    let entries = generateDemoEntries({ days })
    if (args.dense) entries = entries.concat(denseHeartRate(days))
    if (args.spo2) entries = entries.concat(watchSpo2(Number(args['spo2-days'] || 30), args.spo2))
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    const seeded = await page.evaluate(async (list) => {
      const db = await new Promise((res, rej) => {
        const req = indexedDB.open('HealthTrack')
        req.onsuccess = () => res(req.result)
        req.onerror = () => rej(req.error)
      })
      const now = new Date().toISOString()
      await new Promise((res, rej) => {
        const tx = db.transaction('health_entries', 'readwrite')
        const store = tx.objectStore('health_entries')
        store.clear()
        for (const e of list) store.add({ type: e.type, source: e.source, payload: e.payload || {}, at: e.at || now, created_at: now })
        tx.oncomplete = res
        tx.onerror = () => rej(tx.error)
      })
      db.close()
      // Écriture hors de l'app : invalider les caches comme le ferait une écriture normale
      localStorage.setItem('healthtrack-data-revision', String(Date.now()))
      return list.length
    }, entries)

    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })

    const results = []
    for (const path of routes) {
      const samples = []
      for (let i = 0; i < runs; i++) {
        if (!args['keep-cache']) await page.evaluate(() => localStorage.removeItem('healthtrack-analysis-cache-v1'))
        await page.goto(baseUrl + path, { waitUntil: 'load', timeout: 60000 })
        // Attendre 1 s sans nouvelle tâche longue (60 s au plus)
        const m = await page.evaluate(async () => {
          const p = window.__perf
          const t0 = performance.now()
          let seen = -1
          let calmSince = performance.now()
          while (performance.now() - t0 < 60000) {
            await new Promise((r) => setTimeout(r, 100))
            if (p.longTasks.length !== seen) {
              seen = p.longTasks.length
              calmSince = performance.now()
            } else if (performance.now() - calmSince >= 1000) break
          }
          const last = p.longTasks.at(-1)
          const settled = last ? last.start + last.duration : performance.getEntriesByType('navigation')[0]?.loadEventEnd || 0
          return {
            settledMs: Math.round(settled),
            tbtMs: Math.round(p.longTasks.reduce((s, t) => s + Math.max(0, t.duration - 50), 0)),
            longestMs: Math.round(Math.max(0, ...p.longTasks.map((t) => t.duration))),
            idbReads: p.idbReads,
            idbRecords: p.idbRecords,
          }
        })
        // Lectures du Worker des analyses : attendre qu'il ait fini (500 ms sans nouvelle lecture)
        m.workerReads = 0
        m.workerRecords = 0
        for (const w of page.workers()) {
          const t0 = Date.now()
          let last = null
          while (Date.now() - t0 < 60000) {
            const s = await w.evaluate(() => ({ reads: globalThis.__perf?.idbReads ?? 0, records: globalThis.__perf?.idbRecords ?? 0, pending: globalThis.__perf?.pending ?? 0 })).catch(() => null)
            if (!s) break
            if (last && s.pending === 0 && s.reads === last.reads) {
              m.workerReads += s.reads
              m.workerRecords += s.records
              break
            }
            last = s
            await new Promise((r) => setTimeout(r, 500))
          }
        }
        samples.push(m)
      }
      const pick = (k) => Math.round(median(samples.map((s) => s[k])))
      results.push({ path, settledMs: pick('settledMs'), tbtMs: pick('tbtMs'), longestMs: pick('longestMs'), idbReads: pick('idbReads'), idbRecords: pick('idbRecords'), workerReads: pick('workerReads'), workerRecords: pick('workerRecords') })
    }

    await browser.close()
    const report = { at: new Date().toISOString(), days, dense: Boolean(args.dense), spo2: args.spo2 || null, entries: seeded, cpuSlowdown: cpu, runs, results, pageErrors: errors }
    writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2))
    console.log(`\n${seeded} entrées (${days} jours${args.dense ? ', FC horaire' : ''}${args.spo2 ? `, SpO₂ ${args.spo2}` : ''}), CPU ×${cpu}, médiane de ${runs} passages\n`)
    console.table(results)
    if (errors.length) {
      console.error('Erreurs JS :', errors)
      process.exitCode = 1
    }
    if (budget) {
      const over = checkBudget(results, budget)
      for (const o of over) {
        console.error(o.max === null
          ? `Budget : ${o.path} n'a pas de budget dans scripts/perf/budget.json (${o.idbRecords} enregistrements lus)`
          : `Budget dépassé : ${o.path} lit ${o.idbRecords} enregistrements, Worker des analyses compris (max ${o.max})`)
      }
      if (over.length) process.exitCode = 1
      else console.log(`Budget de lectures respecté (${results.length} pages)`)
    }
  } finally {
    cleanup()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
