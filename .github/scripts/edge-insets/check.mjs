#!/usr/bin/env node
/**
 * POL-PLAY-9 — bord à bord sous Android 14 et avant : vérifie sur l'émulateur que l'app reçoit les vraies hauteurs
 * des barres système (variables --safe-area-inset-* injectées par SystemBarsPlugin) et que le clavier ouvert
 * remonte la page au lieu de la couvrir. APK sideload debug déjà installé (protocole DevTools de la WebView).
 *
 * Sorties (dossier courant) : edge_insets.md (résumé du job), edge-insets/NN-<étape>.png. Code de sortie non nul si
 * l'en-tête ou la barre d'onglets passent sous les barres système.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import http from 'node:http'

const PKG = 'com.healthtrack.app'
const OUT_DIR = 'edge-insets'
const OUT_MD = 'edge_insets.md'
mkdirSync(OUT_DIR, { recursive: true })

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
        const page = (await getJson(`http://127.0.0.1:${port}/json/list`)).find((p) => p.type === 'page' && p.webSocketDebuggerUrl)
        if (!page) continue
        cdp = new WebSocket(page.webSocketDebuggerUrl)
        await new Promise((res, rej) => {
          cdp.onopen = res
          cdp.onerror = rej
        })
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
function evaluate(expression) {
  const id = ++msgId
  return new Promise((resolve) => {
    pending.set(id, (msg) => resolve(msg.result?.result?.value))
    cdp.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }))
  })
}
const readInsets = () =>
  evaluate(`(() => { const s = getComputedStyle(document.documentElement); const n = (k) => parseFloat(s.getPropertyValue(k)) || 0;
    return { top: n('--safe-area-inset-top'), bottom: n('--safe-area-inset-bottom'), innerHeight: innerHeight } })()`)

const lines = []
let ok = true
const sdk = shell('getprop ro.build.version.sdk').trim()
lines.push(`### Bord à bord (Android API ${sdk}, POL-PLAY-9)`, '')

shell(`am force-stop ${PKG}`)
shell('logcat -c')
shell(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`)
if (!(await connect())) {
  lines.push('- ❌ WebView inaccessible (protocole DevTools)')
  ok = false
} else {
  await sleep(6000)
  shot('accueil-6s')
  await sleep(10000)
  const rest = await readInsets()
  shot('accueil')
  const statusFrame = shell('dumpsys window | grep -m3 -iE "statusBars|status_bar.*frame"').trim()
  lines.push('```', statusFrame, shell('logcat -d -s HalcyaInsets').trim().split('\n').slice(-6).join('\n'), '```')
  const restOk = rest && rest.top >= 20 && rest.bottom >= 16
  ok &&= restOk
  lines.push(`- ${restOk ? '✅' : '❌'} encarts au repos : haut ${rest?.top} px, bas ${rest?.bottom} px (attendu ≥ 20 et ≥ 16)`)

  // Clavier : premier champ de saisie visible, touché par un vrai appui (s'il existe sur l'écran affiché)
  const field = await evaluate(`(() => { const el = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea')]
    .find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top > 0 && r.bottom < innerHeight });
    if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, dpr: devicePixelRatio } })()`)
  if (field) {
    const wvTop = Number(/class="android\.webkit\.WebView"[^>]*bounds="\[\d+,(\d+)\]/.exec((shell('uiautomator dump /sdcard/ei.xml >/dev/null 2>&1'), shell('cat /sdcard/ei.xml')))?.[1] || 0)
    shell(`input tap ${Math.round(field.x * field.dpr)} ${Math.round(field.y * field.dpr) + wvTop}`)
    await sleep(3000)
    const kb = await readInsets()
    shot('clavier')
    const kbOk = kb && kb.bottom === 0 && kb.innerHeight < rest.innerHeight - 100
    lines.push(`- ${kbOk ? '✅' : '⚠️'} clavier ouvert : bas ${kb?.bottom} px, hauteur visible ${rest.innerHeight} → ${kb?.innerHeight} px`)
    shell('input keyevent KEYCODE_BACK')
  } else {
    lines.push('- ℹ️ aucun champ de saisie sur le premier écran : clavier non vérifié')
  }
}
lines.push('', `Captures : artefact \`edge-insets-api${sdk}\`.`, '')
writeFileSync(OUT_MD, lines.join('\n'))
console.log(lines.join('\n'))
try {
  cdp?.close()
} catch {
  /* fermée */
}
process.exit(ok ? 0 : 1)
