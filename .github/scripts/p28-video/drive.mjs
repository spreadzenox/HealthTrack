#!/usr/bin/env node
/**
 * P28 — filme sur l'émulateur la lecture du bien-être au déverrouillage (APK d'aperçu fr.jpesquet.sante.apercu),
 * selon le script de journal/PLAY-CONFORMITE.md §1 bis. Appelé par .github/workflows/p28-video.yml, émulateur
 * démarré et APK installé.
 *
 * Pilotage : l'interface web de l'app par le protocole DevTools de la WebView (build debug : débogage actif) pour
 * TROUVER les éléments, puis de vrais gestes `adb shell input tap` à leurs coordonnées (visibles dans la vidéo, avec
 * « Afficher les appuis ») ; l'interface d'Android (volet des notifications, autorisations, écran de verrouillage)
 * par uiautomator. Données de démonstration synthétiques (scripts/visual/demoData.mjs), jamais de données réelles.
 *
 * Sorties (dossier courant) : p28-video.mp4, steps/NN-<étape>.png (capture après chaque étape), p28-video.md
 * (résumé : chaque étape, preuve vérifiée par le système, lectures gardées avant / après).
 * Code de sortie non nul si une étape indispensable (divulgation, notification, caméra au déverrouillage, arrêt)
 * n'a pas pu être prouvée.
 */
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { generateDemoEntries } from '../../../app/scripts/visual/demoData.mjs'

const PKG = process.env.P28_PKG || 'fr.jpesquet.sante.apercu'
const OUT_MD = 'p28-video.md'
const steps = []
let stepNo = 0
mkdirSync('steps', { recursive: true })

const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8', maxBuffer: 64 << 20 }).replace(/\r/g, '')
const shell = (cmd) => {
  try {
    return adb('shell', cmd)
  } catch (e) {
    return String(e.stdout || '')
  }
}
const log = (...a) => console.log('[p28]', ...a)

async function shot(name) {
  stepNo += 1
  const file = `steps/${String(stepNo).padStart(2, '0')}-${name}.png`
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
  shell('uiautomator dump /sdcard/p28-ui.xml >/dev/null 2>&1')
  return shell('cat /sdcard/p28-ui.xml')
}

/** Centre du premier nœud dont le texte ou la description correspond à `re` (insensible à la casse). */
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

async function tapNative(re, timeoutMs = 8000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const pos = nodeCenter(dumpUi(), re)
    if (pos) {
      shell(`input tap ${pos[0]} ${pos[1]}`)
      return true
    }
    await sleep(700)
  }
  return false
}

async function waitNative(re, timeoutMs = 10000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    if (nodeCenter(dumpUi(), re)) return true
    await sleep(700)
  }
  return false
}

// ── WebView (protocole DevTools) ───────────────────────────────────────────────────────────────────────────────
let cdp = null
let msgId = 0
const pending = new Map()

async function connectWebView(timeoutMs = 60000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const pid = shell(`pidof ${PKG}`).trim()
    const sock = shell('cat /proc/net/unix')
      .split('\n')
      .map((l) => /@(webview_devtools_remote_\d+)/.exec(l)?.[1])
      .find((s) => s && (!pid || s.endsWith(`_${pid}`)))
    if (sock) {
      try {
        adb('forward', 'tcp:9222', `localabstract:${sock}`)
        const pages = await (await fetch('http://127.0.0.1:9222/json')).json()
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
        log('WebView pas encore prête :', e.message)
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
  const xml = dumpUi()
  for (const node of xml.split('<node ').slice(1)) {
    if (!node.includes('class="android.webkit.WebView"')) continue
    const b = /bounds="\[(\d+),(\d+)\]/.exec(node)
    if (b) return { x: Number(b[1]), y: Number(b[2]) }
  }
  return { x: 0, y: 0 }
}

/**
 * Touche l'élément web trouvé par `finder` (code JS qui renvoie un élément ou null), par un vrai geste à l'écran.
 * L'élément est d'abord amené au centre de l'écran (défilement doux, visible dans la vidéo).
 */
async function tapWeb(finder, { timeoutMs = 15000, label = finder } = {}) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const found = await evaluate(`(() => {
      const el = (${finder})()
      if (!el) return null
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return true
    })()`).catch(() => null)
    if (found) {
      await sleep(900)
      const r = await evaluate(`(() => {
        const el = (${finder})()
        if (!el) return null
        const b = el.getBoundingClientRect()
        return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, dpr: window.devicePixelRatio }
      })()`)
      if (r && r.w > 0) {
        const top = webViewTop()
        const x = Math.round(top.x + r.x * r.dpr)
        const y = Math.round(top.y + r.y * r.dpr)
        shell(`input tap ${x} ${y}`)
        log('appui', label, x, y)
        return true
      }
    }
    await sleep(700)
  }
  log('introuvable :', label)
  return false
}

// Recherche par texte visible, parmi les éléments cliquables (le plus petit qui contient le texte).
const byText = (text, sel = 'button, a, [role=tab], [role=button], label') => `() => {
  const want = ${JSON.stringify(text)}.toLowerCase()
  const els = [...document.querySelectorAll(${JSON.stringify(sel)})]
    .filter((el) => el.offsetParent !== null && el.textContent.replace(/\\s+/g, ' ').trim().toLowerCase().includes(want))
  els.sort((a, b) => a.textContent.length - b.textContent.length)
  return els[0] || null
}`
const unlockSwitch = `() => document.getElementById('face-unlock-label')?.closest('.face-unlock-row')?.querySelector('.connector-toggle') || null`

async function webText() {
  return (await evaluate('document.body.innerText').catch(() => '')) || ''
}

/** Lectures du visage gardées (entrées de bien-être estimé) dans IndexedDB. */
async function storedFaceReadings() {
  return evaluate(`new Promise((resolve) => {
    const req = indexedDB.open('HealthTrack')
    req.onerror = () => resolve(-1)
    req.onsuccess = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('health_entries')) return resolve(-1)
      const all = db.transaction('health_entries', 'readonly').objectStore('health_entries').getAll()
      all.onsuccess = () => resolve(all.result.filter((e) => /face/.test(e.type) || /face/.test(e.source || '')).length)
      all.onerror = () => resolve(-1)
    }
  })`).catch(() => -1)
}

// ── Préparation (hors vidéo) ───────────────────────────────────────────────────────────────────────────────────
async function prepare() {
  shell('settings put system show_touches 1')
  shell('settings put global heads_up_notifications_enabled 1')
  shell(`pm grant ${PKG} android.permission.CAMERA`)
  shell(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`)
  if (!(await connectWebView())) throw new Error('WebView introuvable (débogage inactif ?)')
  await sleep(4000)

  // Données de démonstration (30 jours synthétiques) et onboarding noté fait, comme `npm run visual`.
  const entries = generateDemoEntries({ days: 30, seed: 2828 })
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
      // agrégats effacés : l'app les reconstruit entièrement à la prochaine lecture
      if (stores.length > 1) tx.objectStore('daily_aggregates').clear()
      tx.oncomplete = () => resolve(list.length)
      tx.onerror = () => reject(tx.error)
    }
  })`)
  log('données de démonstration :', inserted)
  await evaluate(`(() => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, endedBy: 'p28-video', goal: 'gut' }))
    localStorage.setItem('healthtrack_theme', 'light')
    location.replace('/')
  })()`)
  await sleep(1500)
  await connectWebView()
  await sleep(4000)
  // Nouveautés et autres bandeaux du premier lancement : fermés s'ils sont là
  for (const t of ['Plus tard', 'Fermer', 'Compris']) await tapWeb(byText(t), { timeoutMs: 1500, label: t })

  // Lecture du visage à l'ouverture activée d'abord (préalable à l'interrupteur du déverrouillage), hors vidéo
  await tapWeb(byText('Sources'), { label: 'onglet Sources' })
  await sleep(2500)
  if (await tapWeb(byText('Activer la lecture du visage'), { timeoutMs: 6000, label: 'Activer la lecture du visage' })) {
    await sleep(1500)
    await tapWeb(byText('J’accepte'), { timeoutMs: 6000, label: 'divulgation caméra' })
    await sleep(1500)
    await tapNative(/while using|pendant l.utilisation|only this time|autoriser/i, 5000)
    await sleep(5000)
  }
  await shot('preparation-sources')
  await tapWeb(byText('Aujourd'), { label: 'onglet Aujourd’hui' })
  await sleep(2000)
  shell('input keyevent KEYCODE_HOME')
  await sleep(1500)
}

// ── Plans de la vidéo (PLAY-CONFORMITE.md §1 bis) ────────────────────────────────────────────────────────────
async function film() {
  // 1. Écran d'accueil → ouvrir Halcya
  shell(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`)
  await connectWebView()
  await sleep(3500)
  record('1. Ouverture de l’app (Accueil)', /Bien-être|Aujourd/i.test(await webText()), await shot('accueil'), false)

  // 2. Sources → Lecture du visage → interrupteur « Aussi à chaque déverrouillage »
  await tapWeb(byText('Sources'), { label: 'onglet Sources' })
  await sleep(2500)
  const switched = await tapWeb(unlockSwitch, { label: 'interrupteur déverrouillage', timeoutMs: 20000 })
  await sleep(1800)
  const sheet = await webText()
  record('2–3. Interrupteur puis divulgation', switched && /Avant la lecture à chaque déverrouillage/.test(sheet), await shot('divulgation'))

  // 3. Faire défiler la divulgation lentement, puis « J’accepte, lire au déverrouillage »
  await evaluate(`(() => {
    const els = [...document.querySelectorAll('[role=dialog], .sheet, .permission-disclosure, dialog')]
    const box = els.find((e) => e.scrollHeight > e.clientHeight) || els[0]
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' })
  })()`).catch(() => null)
  await sleep(3500)
  await tapWeb(byText('J’accepte, lire au déverrouillage'), { label: 'J’accepte, lire au déverrouillage' })
  await sleep(2000)

  // 4. Autorisation des notifications (Android 13+), si Android la demande
  const askedNotif = await tapNative(/^(allow|autoriser)$/i, 6000)
  log('autorisation des notifications demandée :', askedNotif)
  await sleep(2500)
  await shot('apres-accord')

  // 5. Volet des notifications : « Lecture du visage active » et « Arrêter »
  shell('cmd statusbar expand-notifications')
  await sleep(2000)
  let notif = await waitNative(/Lecture du visage active/, 6000)
  if (notif && !nodeCenter(dumpUi(), /^Arr[êe]ter$/i)) {
    // notification discrète repliée : on la déplie pour montrer le bouton
    await tapNative(/expand_button|développer|expand/i, 3000)
    await sleep(1200)
  }
  const stopVisible = !!nodeCenter(dumpUi(), /^Arr[êe]ter$/i)
  record('5. Notification « Lecture du visage active » avec « Arrêter »', notif && stopVisible, await shot('notification'))
  await sleep(2000)
  shell('cmd statusbar collapse')
  await sleep(1500)

  // 6. Verrouiller, attendre, déverrouiller : la caméra s'ouvre (point vert)
  const before = await storedFaceReadings()
  shell('logcat -c')
  shell('input keyevent KEYCODE_SLEEP')
  await sleep(3000)
  shell('input keyevent KEYCODE_WAKEUP')
  await sleep(1200)
  shell('input swipe 540 1900 540 500 250')
  shell('wm dismiss-keyguard')
  await sleep(700)
  await shot('deverrouillage')
  await sleep(4000)
  const camLog = shell('logcat -d')
  const camOpened = camLog
    .split('\n')
    .some((l) => /CameraService/.test(l) && /connect|open/i.test(l) && l.includes(PKG.split('.')[0]))
  const camEvents = shell('dumpsys media.camera').includes(PKG)
  record('6. Déverrouillage : la caméra s’ouvre (point vert)', camOpened || camEvents, `logcat CameraService : ${camOpened}, dumpsys media.camera : ${camEvents}`)
  await sleep(3000)

  // 7. Rouvrir Halcya → Accueil : la nouvelle lecture
  shell(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`)
  await connectWebView()
  await sleep(2500)
  await tapWeb(byText('Aujourd'), { label: 'onglet Aujourd’hui', timeoutMs: 5000 })
  await sleep(3500)
  const after = await storedFaceReadings()
  record('7. Nouvelle lecture gardée (facultatif : la mire de l'émulateur n'a pas de visage)', after > before, `lectures avant : ${before}, après : ${after}`, false)
  await shot('accueil-apres')

  // 8. Volet → « Arrêter » : la notification disparaît ; dans Sources, l'interrupteur est coupé
  shell('cmd statusbar expand-notifications')
  await sleep(1500)
  if (!nodeCenter(dumpUi(), /^Arr[êe]ter$/i)) await tapNative(/expand_button|développer|expand/i, 3000)
  await sleep(1000)
  const stopped = await tapNative(/^Arr[êe]ter$/i, 6000)
  await sleep(2500)
  const gone = !(await waitNative(/Lecture du visage active/, 2500))
  await shot('arret')
  shell('cmd statusbar collapse')
  await sleep(1200)
  await tapWeb(byText('Sources'), { label: 'onglet Sources' })
  await sleep(2500)
  await tapWeb(unlockSwitch, { label: 'interrupteur (vérification)', timeoutMs: 5000 }).then(() => null)
  // l'appui ci-dessus rouvrirait la divulgation : on le referme sans rien accepter
  await sleep(1500)
  await tapWeb(byText('Pas maintenant'), { timeoutMs: 3000, label: 'Pas maintenant' })
  await sleep(1500)
  const switchOff = await evaluate(`document.querySelector('[aria-labelledby="face-unlock-label"]')?.checked === false`).catch(() => false)
  record('8. « Arrêter » : notification retirée, interrupteur coupé', stopped && gone && switchOff, await shot('sources-coupe'))
  await sleep(2500)
}

// ── Enregistrement ────────────────────────────────────────────────────────────────────────────────────────────
async function main() {
  await prepare()
  shell('rm -f /sdcard/p28-video.mp4')
  const rec = spawn('adb', ['shell', 'screenrecord', '--size', '720x1560', '--bit-rate', '6000000', '--time-limit', '175', '/sdcard/p28-video.mp4'])
  const recDone = new Promise((res) => rec.on('exit', res))
  await sleep(1500)
  shell('input keyevent KEYCODE_HOME')
  await sleep(2500)
  let error = null
  try {
    await film()
  } catch (e) {
    error = e
    log('erreur pendant le film :', e.stack || e.message)
  }
  shell('pkill -INT screenrecord')
  await Promise.race([recDone, sleep(15000)])
  await sleep(1500)
  try {
    adb('pull', '/sdcard/p28-video.mp4', 'p28-video.mp4')
  } catch (e) {
    log('vidéo introuvable :', e.message)
  }

  const failed = steps.filter((s) => s.required && !s.ok)
  const lines = [
    '## P28 — vidéo de la lecture au déverrouillage',
    '',
    `APK : \`${PKG}\` (aperçu play, interrupteur allumé), données de démonstration synthétiques.`,
    '',
    '| Étape | Prouvée | Preuve |',
    '|---|---|---|',
    ...steps.map((s) => `| ${s.step} | ${s.ok ? '✅' : s.required ? '❌' : '⚠️'} | ${String(s.proof).replace(/\|/g, '/')} |`),
    '',
    error ? `Erreur : \`${error.message}\`` : '',
  ]
  writeFileSync(OUT_MD, lines.join('\n') + '\n')
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
  if (cdp) cdp.close()
  process.exit(error || failed.length ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
