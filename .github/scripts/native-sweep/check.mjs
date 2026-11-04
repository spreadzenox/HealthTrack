#!/usr/bin/env node
/**
 * PLUGIN-API-2 (04/11) — sous Android 12 (API 31), avec une WebView assez récente pour lancer le JS : parcourt les
 * écrans du premier lancement (onboarding, Accueil, Sources, Journal, Analyses, Montre, Paramètres) puis appelle
 * directement les méthodes natives de lecture des plugins (statuts, listes, vérifications d'accès). Le job API 28 ne
 * voit que le démarrage (sa WebView est trop ancienne) : celui-ci exécute les corps des méthodes natives, où un
 * appel d'API plus récente sans test de version ferait planter l'app (NoSuchMethodError, NoClassDefFoundError).
 *
 * Aucune méthode qui ouvre un écran système, demande une permission, écrit ou démarre un service n'est appelée.
 * APK sideload debug déjà installé (WebView inspectable). Sorties : native_sweep.md, native-sweep/NN-<étape>.png.
 * Code de sortie non nul si le JS ne démarre pas, si l'app se ferme ou si logcat montre un plantage Java.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import http from 'node:http'

const PKG = 'com.healthtrack.app'
const OUT_DIR = 'native-sweep'
const OUT_MD = 'native_sweep.md'
mkdirSync(OUT_DIR, { recursive: true })

// Méthodes de lecture seule, appelées sans argument. Une erreur JS (permission absente, non pris en charge) est
// normale ; seul un plantage du processus ou une erreur Java fatale fait échouer le job.
const CALLS = [
  ['AppUpdate', 'canInstall'],
  ['AppUpdate', 'status'],
  ['BackupMarker', 'marker'],
  ['BtClassic', 'listBonded'],
  ['Companion', 'status'],
  ['EveningNote', 'status'],
  ['EveningNote', 'list'],
  ['FaceSense', 'status'],
  ['FaceSense', 'list'],
  ['GutEvening', 'status'],
  ['GutEvening', 'list'],
  ['PhoneUsage', 'checkAccess'],
  ['SystemBars', 'getInsets'],
  ['VoiceProbe', 'probe'],
  ['WatchCapture', 'list'],
  ['WatchVault', 'status'],
  ['AppManager', 'installedPackages'],
]
const ROUTES = ['/', '/connectors', '/journal', '/tendances', '/recommendations', '/montre', '/settings', '/premium']

const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8', maxBuffer: 64 << 20 }).replace(/\r/g, '')
const shell = (cmd) => {
  try {
    return adb('shell', cmd)
  } catch (e) {
    return String(e.stdout || '')
  }
}
let shotNo = 0
function shot(name) {
  shotNo += 1
  try {
    writeFileSync(`${OUT_DIR}/${String(shotNo).padStart(2, '0')}-${name}.png`, execFileSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 }))
  } catch {
    /* capture facultative */
  }
}
const alive = () => shell(`pidof ${PKG}`).trim() !== ''

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { agent: false, timeout: 15000 }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('timeout', () => req.destroy(new Error('pas de réponse')))
    req.on('error', reject)
  })
}

let cdp = null
let msgId = 0
const pending = new Map()
async function connect(timeoutMs = 120000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    for (const pid of shell(`pidof ${PKG}`).trim().split(/\s+/).filter(Boolean)) {
      try {
        const port = Number(adb('forward', 'tcp:0', `localabstract:webview_devtools_remote_${pid}`).trim())
        const pages = (await getJson(`http://127.0.0.1:${port}/json/list`)).filter((p) => p.type === 'page' && p.webSocketDebuggerUrl)
        const page = pages.find((p) => /^https?:\/\/localhost/.test(p.url)) || pages[0]
        if (!page) continue
        cdp = new WebSocket(page.webSocketDebuggerUrl)
        await new Promise((res, rej) => {
          cdp.onopen = res
          cdp.onerror = rej
        })
        cdp.onclose = () => {
          for (const done of pending.values()) done({})
          pending.clear()
          cdp = null
        }
        cdp.onmessage = (ev) => {
          const msg = JSON.parse(ev.data)
          if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)(msg)
            pending.delete(msg.id)
          }
        }
        return true
      } catch {
        /* WebView pas encore prête */
      }
    }
    await sleep(1500)
  }
  return false
}
function evaluateOnce(expression, timeoutMs = 15000) {
  const id = ++msgId
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id)
      resolve(undefined)
    }, timeoutMs)
    pending.set(id, (msg) => {
      clearTimeout(timer)
      resolve(msg.result?.result?.value)
    })
    try {
      cdp.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }))
    } catch {
      clearTimeout(timer)
      pending.delete(id)
      resolve(undefined)
    }
  })
}
async function evaluate(expression) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!cdp || cdp.readyState !== WebSocket.OPEN) {
      cdp = null
      if (!(await connect(30000))) return undefined
    }
    const value = await evaluateOnce(expression)
    if (value !== undefined) return value
    try {
      cdp?.close()
    } catch {
      /* déjà fermée */
    }
    cdp = null
    await sleep(2000)
  }
  return undefined
}

const lines = []
const apiErrors = []
let ok = true
const fail = (msg) => {
  ok = false
  lines.push(`- ❌ ${msg}`)
}
const sdk = shell('getprop ro.build.version.sdk').trim()
const wv = /Current WebView package \(name, version\): \(([^)]*)\)/.exec(shell('dumpsys webviewupdate'))?.[1] || 'inconnue'
lines.push(`### Méthodes natives sous Android API ${sdk} (PLUGIN-API-2)`, '', `- WebView de l'image : ${wv}`)

shell(`am force-stop ${PKG}`)
shell('logcat -b all -c')
shell(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`)
if (!(await connect())) {
  fail(alive() ? 'WebView inaccessible (protocole DevTools)' : "l'app s'est fermée au démarrage")
} else {
  await sleep(8000)
  const boot = await evaluate(`(() => ({ path: location.pathname, root: (document.getElementById('root')?.childElementCount || 0),
    native: !!window.Capacitor?.isNativePlatform?.(), page: document.title }))()`)
  shot('premier-ecran')
  if (!boot || !boot.root) fail(`le JS n'a rien affiché (${JSON.stringify(boot)})`)
  else lines.push(`- ✅ premier écran : ${boot.path} (natif : ${boot.native ? 'oui' : 'non'})`)

  for (const route of ROUTES) {
    if (!alive()) break
    await evaluate(`(() => { history.pushState({}, '', ${JSON.stringify(route)}); dispatchEvent(new PopStateEvent('popstate')); return true })()`)
    await sleep(4000)
    const seen = await evaluate(`location.pathname`)
    shot(route === '/' ? 'accueil' : route.slice(1))
    lines.push(`- ${alive() ? '✅' : '❌'} écran ${route} (affiché : ${seen ?? '?'})`)
  }

  lines.push('', '| Plugin | Méthode | Résultat |', '|---|---|---|')
  for (const [plugin, method] of CALLS) {
    if (!alive()) break
    const r = await evaluate(`(async () => { const p = window.Capacitor?.Plugins?.[${JSON.stringify(plugin)}];
      if (!p || typeof p[${JSON.stringify(method)}] !== 'function') return { skipped: true };
      try { const v = await Promise.race([p[${JSON.stringify(method)}]({}), new Promise((r) => setTimeout(() => r({ timeout: true }), 8000))]);
        return { ok: true, keys: Object.keys(v || {}).slice(0, 6).join(', '), timeout: !!v?.timeout } }
      catch (e) { return { error: String(e?.message || e).slice(0, 120) } } })()`)
    const res = !r ? 'pas de réponse' : r.skipped ? 'absent de cette variante' : r.error ? `erreur JS : ${r.error}` : r.timeout ? 'sans réponse en 8 s' : `ok (${r.keys || '—'})`
    if (r?.error && /NoSuchMethod|NoClassDef|VerifyError/.test(r.error)) apiErrors.push(`${plugin}.${method}`)
    lines.push(`| ${plugin} | ${method} | ${res.replace(/\|/g, '/')} |`)
    await sleep(500)
  }
  lines.push('')
}

await sleep(2000)
const logcat = shell('logcat -d')
writeFileSync(`${OUT_DIR}/logcat.txt`, logcat)
// Tampon « crash » d'Android : seulement les plantages, ceux d'autres apps de l'image sont ignorés.
const crash = shell('logcat -d -b crash')
writeFileSync(`${OUT_DIR}/crash.txt`, crash)
if (!alive()) fail("l'app s'est fermée pendant le parcours")
if (crash.includes(`Process: ${PKG}`)) {
  fail('plantage Java de l’app (tampon crash) :')
  const i = crash.indexOf(`Process: ${PKG}`)
  lines.push('```', ...crash.slice(i).split('\n').slice(0, 14), '```')
}
if (apiErrors.length) fail(`méthodes natives en erreur d'API récente : ${apiErrors.join(', ')}`)
if (ok) lines.push('- ✅ aucun plantage, processus vivant jusqu’au bout')
lines.push('', `Captures et logcat : artefact \`native-sweep-api${sdk}\`.`, '')
writeFileSync(OUT_MD, lines.join('\n'))
console.log(lines.join('\n'))
try {
  cdp?.close()
} catch {
  /* fermée */
}
process.exit(ok ? 0 : 1)
