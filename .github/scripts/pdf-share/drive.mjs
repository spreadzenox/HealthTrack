#!/usr/bin/env node
/**
 * N6c — vérifie sur l'émulateur le parcours « Rapport PDF pour mon médecin » de la variante sideload (debug) :
 * Données → « Préparer le rapport » → « Créer le PDF » → fichier écrit dans Documents → feuille de partage
 * d'Android ouverte avec le PDF ; partage annulé (retour) → le fichier reste et l'app le dit ; un 2ᵉ rapport le même
 * jour remplace le premier sans erreur. Appelé par run-emulator-tests.sh (job API 35), émulateur démarré, APK installé.
 *
 * Même pilotage que la vidéo P28 (.github/scripts/p28-video/drive.mjs) : l'interface web par le protocole DevTools
 * de la WebView (build debug) pour TROUVER les éléments, puis de vrais appuis `adb shell input tap` ; l'interface
 * d'Android par uiautomator. Données de démonstration synthétiques (scripts/visual/demoData.mjs), jamais réelles.
 *
 * Sorties (dossier courant) : pdf_share.md (résumé du job), pdf-share/NN-<étape>.png, pdf-share/rapport.pdf et,
 * si pdftoppm est installé, pdf-share/rapport-page-1.png. Code de sortie non nul si une étape indispensable échoue.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import http from 'node:http'
import { generateDemoEntries } from '../../../app/scripts/visual/demoData.mjs'

const PKG = process.env.PDF_SHARE_PKG || 'com.healthtrack.app'
const OUT_DIR = 'pdf-share'
const OUT_MD = 'pdf_share.md'
const steps = []
let stepNo = 0
mkdirSync(OUT_DIR, { recursive: true })

const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8', maxBuffer: 64 << 20 }).replace(/\r/g, '')
const shell = (cmd) => {
  try {
    return adb('shell', cmd)
  } catch (e) {
    return String(e.stdout || '')
  }
}
const log = (...a) => console.log('[pdf]', ...a)

function shot(name) {
  stepNo += 1
  const file = `${OUT_DIR}/${String(stepNo).padStart(2, '0')}-${name}.png`
  try {
    writeFileSync(file, execFileSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 }))
  } catch {
    /* capture facultative */
  }
  return file
}

function record(step, ok, proof, required = true) {
  steps.push({ step, ok, proof, required })
  log(ok ? 'OK ' : 'ÉCHEC', step, '—', proof)
}

// ── Interface d'Android (uiautomator) ──────────────────────────────────────────────────────────────────────────
function dumpUi() {
  shell('uiautomator dump /sdcard/pdf-ui.xml >/dev/null 2>&1')
  return shell('cat /sdcard/pdf-ui.xml')
}

/** Premier nœud dont le texte, la description ou l'identifiant correspond à `re` : centre, sinon null. */
function nodeCenter(xml, re) {
  for (const node of xml.split('<node ').slice(1)) {
    const text = /text="([^"]*)"/.exec(node)?.[1] ?? ''
    const desc = /content-desc="([^"]*)"/.exec(node)?.[1] ?? ''
    const rid = /resource-id="([^"]*)"/.exec(node)?.[1] ?? ''
    if (!re.test(text) && !re.test(desc) && !re.test(rid)) continue
    const b = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(node)
    if (!b) continue
    const [x1, y1, x2, y2] = b.slice(1).map(Number)
    if (x2 <= x1 || y2 <= y1) continue
    return [Math.round((x1 + x2) / 2), Math.round((y1 + y2) / 2)]
  }
  return null
}

async function waitNative(re, timeoutMs = 10000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const xml = dumpUi()
    if (nodeCenter(xml, re)) return xml
    await sleep(800)
  }
  return null
}

/** Boîte « … ne répond pas » d'Android sur l'émulateur lent : « Attendre ». */
async function dismissAnr() {
  const pos = nodeCenter(dumpUi(), /^(wait|attendre)$/i)
  if (pos) {
    shell(`input tap ${pos[0]} ${pos[1]}`)
    log('boîte « ne répond pas » fermée')
    await sleep(1000)
  }
}

// ── WebView (protocole DevTools) ───────────────────────────────────────────────────────────────────────────────
let cdp = null
let msgId = 0
const pending = new Map()

/** GET JSON sans agent (aucune connexion réutilisée), avec délai. */
function getJson(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { agent: false, timeout: timeoutMs }, (res) => {
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
    req.on('timeout', () => req.destroy(new Error(`pas de réponse en ${timeoutMs / 1000} s`)))
    req.on('error', reject)
  })
}

async function connectWebView(timeoutMs = 180000) {
  if (cdp) {
    try {
      cdp.close()
    } catch {
      /* déjà fermée */
    }
    cdp = null
  }
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const pids = shell(`pidof ${PKG}`).trim().split(/\s+/).filter(Boolean)
    const socks = [
      ...new Set(
        shell('cat /proc/net/unix')
          .split('\n')
          .map((l) => /@([\w.]*devtools_remote\w*)/.exec(l)?.[1])
          .filter(Boolean),
      ),
    ]
    const candidates = [...new Set([...socks.filter((x) => pids.some((p) => x.endsWith(`_${p}`))), ...pids.map((p) => `webview_devtools_remote_${p}`)])]
    for (const sock of candidates) {
      let port = 0
      try {
        // Port local neuf à chaque essai, requête sans keep-alive (leçon de la vidéo P28, 26/10)
        port = Number(adb('forward', 'tcp:0', `localabstract:${sock}`).trim())
        const pages = await getJson(`http://127.0.0.1:${port}/json/list`, 15000)
        const page = pages.find((p) => p.type === 'page' && p.webSocketDebuggerUrl)
        if (page) {
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
        }
      } catch (e) {
        log('WebView pas encore prête :', sock, e.message)
        if (port) {
          try {
            adb('forward', '--remove', `tcp:${port}`)
          } catch {
            /* déjà retirée */
          }
        }
      }
    }
    await sleep(1500)
  }
  return false
}

function send(method, params = {}) {
  const id = ++msgId
  return new Promise((resolve) => {
    pending.set(id, resolve)
    cdp.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (res.result?.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description || 'erreur JS')
  return res.result?.result?.value
}

/** Haut de la WebView à l'écran (px de l'appareil) : la barre d'état peut la décaler. */
function webViewTop() {
  for (const node of dumpUi().split('<node ').slice(1)) {
    if (!node.includes('class="android.webkit.WebView"')) continue
    const b = /bounds="\[(\d+),(\d+)\]/.exec(node)
    if (b) return { x: Number(b[1]), y: Number(b[2]) }
  }
  return { x: 0, y: 0 }
}

/** Bouton web visible dont le texte contient `text` (le plus court), amené au centre puis touché par un vrai appui. */
async function tapButton(text, timeoutMs = 15000) {
  const finder = `(() => {
    const want = ${JSON.stringify(text)}.toLowerCase()
    const els = [...document.querySelectorAll('button, a, [role=button]')]
      .filter((el) => el.offsetParent !== null && !el.disabled && el.textContent.replace(/\\s+/g, ' ').trim().toLowerCase().includes(want))
    els.sort((a, b) => a.textContent.length - b.textContent.length)
    return els[0] || null
  })`
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const found = await evaluate(`(() => { const el = ${finder}(); if (!el) return false; el.scrollIntoView({ block: 'center' }); return true })()`).catch(() => false)
    if (found) {
      await sleep(800)
      const r = await evaluate(`(() => {
        const el = ${finder}()
        if (!el) return null
        const b = el.getBoundingClientRect()
        return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, dpr: window.devicePixelRatio }
      })()`).catch(() => null)
      if (r && r.w > 0) {
        const top = webViewTop()
        shell(`input tap ${Math.round(top.x + r.x * r.dpr)} ${Math.round(top.y + r.y * r.dpr)}`)
        log('appui', text)
        return true
      }
    }
    await sleep(700)
  }
  log('introuvable :', text)
  return false
}

async function webText() {
  return (await evaluate('document.body.innerText').catch(() => '')) || ''
}

async function waitWebText(re, timeoutMs = 30000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const t = await webText()
    const m = re.exec(t)
    if (m) return m
    await sleep(1000)
  }
  return null
}

/** PDF(s) du rapport rangés dans Documents (stockage partagé). */
function reportFiles() {
  return shell('ls -l /sdcard/Documents/ 2>/dev/null')
    .split('\n')
    .filter((l) => /-rapport-\d{4}-\d{2}-\d{2}\.pdf$/.test(l.trim()))
    .map((l) => ({ name: l.trim().split(/\s+/).pop(), size: Number(l.trim().split(/\s+/)[4]) || 0 }))
}

// ── Parcours ───────────────────────────────────────────────────────────────────────────────────────────────────
// Feuille de partage d'Android : titre « Envoyer le rapport » (dialogTitle), ou le sélecteur système.
const SHARE_SHEET = /Envoyer le rapport|:id\/(chooser_header|resolver_list|profile_tabhost|sem_chooser)|android:id\/contentPanel|Partager|^Share$/i

async function run() {
  await dismissAnr()
  shell(`am force-stop ${PKG}`)
  shell('rm -f /sdcard/Documents/*-rapport-*.pdf')
  shell(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`)
  if (!(await connectWebView())) {
    record('Connexion à la WebView', false, shot('echec-webview'))
    return
  }
  await sleep(3000)

  // Données de démonstration (30 jours synthétiques, avec repas et ventre) et onboarding fait, objectif « Mon ventre »
  const entries = generateDemoEntries({ days: 30, seed: 6363 })
  const inserted = await evaluate(`new Promise((resolve, reject) => {
    const list = ${JSON.stringify(entries)}
    const req = indexedDB.open('HealthTrack')
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('health_entries')) return resolve(-1)
      const stores = ['health_entries'].concat(db.objectStoreNames.contains('daily_aggregates') ? ['daily_aggregates'] : [])
      const tx = db.transaction(stores, 'readwrite')
      const now = new Date().toISOString()
      for (const e of list) tx.objectStore('health_entries').add({ type: e.type, source: e.source, payload: e.payload || {}, at: e.at, created_at: now })
      if (stores.length > 1) tx.objectStore('daily_aggregates').clear()
      tx.oncomplete = () => resolve(list.length)
      tx.onerror = () => reject(tx.error)
    }
  })`).catch((e) => {
    log('insertion impossible :', e.message)
    return -1
  })
  record('Données de démonstration insérées', inserted > 0, `${inserted} entrées synthétiques (30 jours)`)
  await evaluate(`(() => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, endedBy: 'pdf-share', goal: 'gut' }))
    localStorage.setItem('healthtrack_theme', 'light')
    location.replace('/')
  })()`).catch(() => null)
  await sleep(2000)
  await connectWebView()
  await sleep(3000)
  // Page Données par le routeur (comme un lien interne), sans recharger
  await evaluate(`(() => { history.pushState({}, '', '/data'); dispatchEvent(new PopStateEvent('popstate')) })()`).catch(() => null)
  await sleep(2500)
  // Bandeaux du premier lancement fermés s'ils sont là
  for (const t of ['Plus tard', 'Compris']) await tapButton(t, 1500)

  const prepared = await tapButton('Préparer le rapport', 20000)
  await sleep(1200)
  const created = prepared && (await tapButton('Créer le PDF', 8000))
  record('Données → « Préparer le rapport » → « Créer le PDF »', created, shot('carte-rapport'))
  if (!created) return

  // Feuille de partage (le rendu des polices et de pdf-lib peut prendre quelques secondes sur l'émulateur)
  const sheetXml = await waitNative(SHARE_SHEET, 40000)
  const sheetShot = shot('feuille-de-partage')
  if (sheetXml) writeFileSync(`${OUT_DIR}/ui-feuille-de-partage.xml`, sheetXml)
  record('Feuille de partage d’Android ouverte', !!sheetXml, sheetShot)
  const pdfInSheet = !!sheetXml && /\.pdf|rapport|PDF/i.test(sheetXml)
  record('Le PDF est nommé dans la feuille de partage', pdfInSheet, pdfInSheet ? 'nom ou type du fichier trouvé dans l’arbre d’accessibilité' : 'non trouvé', false)

  const files = reportFiles()
  const file = files[0]
  let header = ''
  if (file) {
    try {
      adb('pull', `/sdcard/Documents/${file.name}`, `${OUT_DIR}/rapport.pdf`)
      header = readFileSync(`${OUT_DIR}/rapport.pdf`).subarray(0, 5).toString('latin1')
    } catch (e) {
      log('récupération du PDF impossible :', e.message)
    }
  }
  record('Fichier écrit dans Documents', !!file && header === '%PDF-' && file.size > 5000, file ? `${file.name}, ${file.size} octets, en-tête « ${header} »` : 'aucun fichier *-rapport-*.pdf dans /sdcard/Documents')

  // Partage annulé (retour) : le fichier reste et l'app le dit
  shell('input keyevent KEYCODE_BACK')
  await sleep(2000)
  await connectWebView(30000)
  const status = await waitWebText(/[^\n]*est dans Documents[^\n]*|Le rapport n’a pas pu être créé[^\n]*/, 20000)
  record('Partage annulé : l’app dit où est le fichier', !!status && /est dans Documents/.test(status[0]), status ? `« ${status[0].trim()} »` : 'aucun message', true)
  shot('apres-annulation')

  // 2ᵉ rapport le même jour : le fichier du jour est remplacé, sans erreur
  const again = await tapButton('Créer le PDF', 8000)
  const sheet2 = again && (await waitNative(SHARE_SHEET, 40000))
  shell('input keyevent KEYCODE_BACK')
  await sleep(2000)
  await connectWebView(30000)
  const status2 = await waitWebText(/[^\n]*est dans Documents[^\n]*|Le rapport n’a pas pu être créé[^\n]*/, 20000)
  const files2 = reportFiles()
  record(
    '2ᵉ rapport le même jour (fichier remplacé)',
    !!sheet2 && !!status2 && /est dans Documents/.test(status2[0]) && files2.length === 1,
    `${status2 ? `« ${status2[0].trim()} »` : 'aucun message'} · fichiers : ${files2.map((f) => f.name).join(', ') || 'aucun'}`,
    false,
  )
  shot('deuxieme-rapport')

  // Aperçu de la première page (facultatif : pdftoppm installé par le workflow)
  if (existsSync(`${OUT_DIR}/rapport.pdf`)) {
    try {
      execFileSync('pdftoppm', ['-png', '-r', '60', '-f', '1', '-l', '2', `${OUT_DIR}/rapport.pdf`, `${OUT_DIR}/rapport-page`])
      log('pages du PDF rendues en PNG')
    } catch {
      log('pdftoppm absent : pas d’aperçu PNG du PDF')
    }
  }
}

async function main() {
  let error = null
  try {
    await run()
  } catch (e) {
    error = e
    log('erreur :', e.stack || e.message)
  }
  const failed = steps.filter((s) => s.required && !s.ok)
  const lines = [
    '## Rapport PDF : création et partage sur l’émulateur (N6c)',
    '',
    `APK : \`${PKG}\` (sideload debug), données de démonstration synthétiques. Captures et PDF : artefact « rapport-pdf-emulateur ».`,
    '',
    '| Étape | Prouvée | Preuve |',
    '|---|---|---|',
    ...steps.map((s) => `| ${s.step} | ${s.ok ? '✅' : s.required ? '❌' : '⚠️'} | ${String(s.proof).replace(/\|/g, '/')} |`),
    '',
    error ? `Erreur : \`${error.message}\`` : '',
  ]
  writeFileSync(OUT_MD, lines.join('\n') + '\n')
  if (cdp) cdp.close()
  process.exit(error || failed.length || !steps.length ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
