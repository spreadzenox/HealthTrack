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
let pageInfo = '?'
let msgId = 0
const pending = new Map()
async function connect(timeoutMs = 120000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    for (const pid of shell(`pidof ${PKG}`).trim().split(/\s+/).filter(Boolean)) {
      try {
        const port = Number(adb('forward', 'tcp:0', `localabstract:webview_devtools_remote_${pid}`).trim())
        // La page de l'app (https://localhost) plutôt qu'une autre cible éventuelle (about:blank…)
        const pages = (await getJson(`http://127.0.0.1:${port}/json/list`)).filter((p) => p.type === 'page' && p.webSocketDebuggerUrl)
        const page = pages.find((p) => /^https?:\/\/localhost/.test(p.url)) || pages[0]
        if (!page) continue
        pageInfo = `${page.url} (${pages.length} page${pages.length > 1 ? 's' : ''})`
        cdp = new WebSocket(page.webSocketDebuggerUrl)
        await new Promise((res, rej) => {
          cdp.onopen = res
          cdp.onerror = rej
        })
        cdp.onclose = () => {
          // Page rechargée ou WebView recréée : on libère les attentes, l'appelant se reconnecte
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
function evaluateOnce(expression, timeoutMs = 10000) {
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
      cdp.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }))
    } catch {
      clearTimeout(timer)
      pending.delete(id)
      resolve(undefined)
    }
  })
}
// La WebView peut recharger sa page (redirection, réinjection des encarts) : sans réponse, on se reconnecte et on
// réessaie, au lieu de rester bloqué sur une promesse jamais résolue (échec du 27/10 21:16, code 13).
async function evaluate(expression) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!cdp || cdp.readyState !== WebSocket.OPEN) {
      try {
        cdp?.close()
      } catch {
        /* déjà fermée */
      }
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
const readInsets = () =>
  evaluate(`(() => { const s = getComputedStyle(document.documentElement); const n = (k) => parseFloat(s.getPropertyValue(k)) || 0;
    return { top: n('--safe-area-inset-top'), bottom: n('--safe-area-inset-bottom'), innerHeight: innerHeight } })()`)
const insetsOk = (r) => r && r.top >= 20 && r.top <= 64 && r.bottom >= 16
// Émulateur chargé (« Pixel Launcher isn't responding » le 31/10 04:21) : une seule lecture ne suffit pas à conclure.
// On ferme les dialogues système et on relit jusqu'à 5 fois (≈ 15 s) ; une vraie régression reste à 0 px.
async function readInsetsSettled() {
  let r
  for (let attempt = 1; attempt <= 5; attempt++) {
    r = await readInsets()
    if (insetsOk(r)) return { ...r, attempt }
    shell('am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS')
    await sleep(3000)
  }
  return r && { ...r, attempt: 5 }
}

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
  const rest = await readInsetsSettled()
  shot('accueil')
  const statusFrame = shell('dumpsys window | grep -m3 -iE "statusBars|status_bar.*frame"').trim()
  lines.push('```', statusFrame, shell('logcat -d -s HalcyaInsets').trim().split('\n').slice(-6).join('\n'), '```')
  // Haut : barre d'état + encoche, jamais plus de 64 dp sur un téléphone (105 = barre de titre en trop)
  const restOk = insetsOk(rest)
  ok &&= restOk
  lines.push(`- ${restOk ? '✅' : '❌'} encarts au repos : haut ${rest?.top} px, bas ${rest?.bottom} px (attendu 20–64 et ≥ 16 ; lecture ${rest?.attempt ?? '?'}/5)`)
  lines.push(`- page lue : ${pageInfo}`)

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
