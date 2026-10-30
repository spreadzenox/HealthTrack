#!/usr/bin/env node
/**
 * POL-PLAY-10 (R8a) — vérifie sur l'émulateur que l'APK play RELEASE, optimisé et obscurci par R8 (même code que
 * l'AAB envoyé sur Google Play), démarre et que ses plugins natifs répondent encore. Appelé par
 * run-emulator-tests.sh (job API 35), émulateur démarré. L'APK de test est signé avec la clé de debug et sa WebView
 * est inspectable (capacitor.config.json modifié pour ce seul APK, jamais publié) : on appelle les plugins par le
 * protocole DevTools, comme pdf-share/drive.mjs.
 *
 * Ce qui est vérifié :
 *   - démarrage sans plantage, premier écran (onboarding) affiché ;
 *   - chaque plugin maison (et Health Connect) encore enregistré auprès de Capacitor (R8 ne l'a pas retiré) ;
 *   - lecture du visage : modèles LiteRT chargés, modèles ONNX valence / éveil téléchargés puis ouverts, une lecture
 *     manuelle rendue (le résultat dépend de la caméra virtuelle ; seul compte qu'aucun modèle ne casse) ;
 *   - Play Billing, Play Integrity, Health Connect : une réponse (un refus est normal sans Play Store), jamais
 *     « not implemented » ;
 *   - journal Android sans ClassNotFoundException / NoSuchMethodError / UnsatisfiedLinkError… pour l'app.
 *
 * Sorties : play_release.md (résumé du job), play_release_logcat.txt, screenshot_play_release.png.
 * Code de sortie non nul si une vérification échoue.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, existsSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import http from 'node:http'

const PKG = 'fr.jpesquet.sante'
const APK = process.env.PLAY_RELEASE_APK || 'app/android/app/build/outputs/apk/play/release/app-play-release.apk'
const OUT_MD = 'play_release.md'
const FIRST_SCREEN = 'Comprenez ce qui va'
// Plugins maison (main + play) et Health Connect : tous doivent survivre à R8 (AppUpdate n'existe que dans la
// sideload, SELF_UPDATE)
const PLUGINS = [
  'AppManager', 'BackupMarker', 'BtClassic', 'Companion', 'EveningNote', 'FaceSense', 'GutEvening',
  'PhoneUsage', 'PlayBilling', 'PlayIntegrity', 'PortionReminder', 'SystemBars', 'TrialReminder', 'VoiceProbe',
  'WatchCapture', 'WatchVault', 'Health',
]
const ABSENT = ['AppUpdate']
const LINKAGE = /ClassNotFoundException|NoClassDefFoundError|NoSuchMethodError|NoSuchFieldError|UnsatisfiedLinkError|AbstractMethodError|IncompatibleClassChangeError/

const checks = []
// `known` : défaut connu d'une fonction coupée dans les versions publiées (affiché ⚠️, ne fait pas échouer le job).
const record = (name, ok, proof, known = false) => {
  checks.push({ name, ok, proof, known })
  console.log('[release]', ok ? 'OK ' : 'ÉCHEC', name, '—', proof)
}
const adb = (...args) => execFileSync('adb', args, { encoding: 'utf8', maxBuffer: 64 << 20 }).replace(/\r/g, '')
const shell = (cmd) => {
  try {
    return adb('shell', cmd)
  } catch (e) {
    return String(e.stdout || '')
  }
}

// ── WebView (protocole DevTools), même méthode que pdf-share/drive.mjs ──────────────────────────────────────────
let cdp = null
let msgId = 0
const pending = new Map()

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
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const pids = shell(`pidof ${PKG}`).trim().split(/\s+/).filter(Boolean)
    const socks = [...new Set(shell('cat /proc/net/unix').split('\n').map((l) => /@([\w.]*devtools_remote\w*)/.exec(l)?.[1]).filter(Boolean))]
    const candidates = [...new Set([...socks.filter((x) => pids.some((p) => x.endsWith(`_${p}`))), ...pids.map((p) => `webview_devtools_remote_${p}`)])]
    for (const sock of candidates) {
      let port = 0
      try {
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
        console.log('[release] WebView pas encore prête :', sock, e.message)
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

/** Appelle Capacitor.Plugins[plugin][method](options) : { ok, value } ou { ok: false, error } (jamais d'exception). */
function callPlugin(plugin, method, options = {}) {
  return evaluate(`(async () => {
    try {
      const value = await window.Capacitor.Plugins[${JSON.stringify(plugin)}][${JSON.stringify(method)}](${JSON.stringify(options)})
      return { ok: true, value }
    } catch (e) {
      return { ok: false, error: String((e && (e.code ? e.code + ': ' : '') + e.message) || e) }
    }
  })()`)
}

const notImplemented = (r) => !r.ok && /not implemented|UNIMPLEMENTED/i.test(r.error)
const brief = (v) => JSON.stringify(v).slice(0, 200)

// À passer à true (scénarios affichés ⚠️ sans bloquer) seulement si la lecture au déverrouillage est coupée dans les
// versions publiées (FACE_UNLOCK_INTERNAL=false, play-bundle.yml) le temps de corriger un défaut connu.
const UNLOCK_KNOWN = false

/** Appel de plugin borné dans le temps : si l'app est tuée, la WebView ne répond plus jamais. */
const callWithin = (ms, plugin, method, options) =>
  Promise.race([callPlugin(plugin, method, options), sleep(ms).then(() => ({ ok: false, error: 'pas de réponse (app fermée ?)' }))])

/**
 * Plantage du 30/10 (Galaxy A56, « activer la lecture du visage ») : APK construit avec l'interrupteur faceUnlockPlay
 * comme les versions de test interne. (1) Lecture au déverrouillage démarrée puis coupée ; (2) caméra refusée par
 * Android (appops « ignore » : la permission reste accordée mais le service caméra ne peut plus passer au premier
 * plan) : le service doit s'arrêter seul et l'app rester ouverte (avant le correctif : startForegroundService puis
 * stopSelf → Android tuait l'app). Le délai de 12 s couvre celui qu'Android laisse pour appeler startForeground.
 */
async function unlockScenarios() {
  const pid0 = shell(`pidof ${PKG}`).trim()
  // Cause du 30/10 : sous R8, Capacitor ne relisait plus les annotations @Permission → NullPointerException dans
  // getPermissionState, app fermée (« Activer » comme « Aussi à chaque déverrouillage »). checkPermissions passe par
  // le même code pour chaque plugin.
  const perms = []
  for (const plugin of PLUGINS) {
    const r = await callWithin(10000, plugin, 'checkPermissions')
    if (!r.ok && /app fermée/.test(r.error)) {
      perms.push(`${plugin} : ${r.error}`)
      break
    }
  }
  record('checkPermissions de chaque plugin (annotations gardées par R8)', perms.length === 0 && shell(`pidof ${PKG}`).trim() === pid0, perms.join(' ; ') || `${PLUGINS.length} plugins`)
  if (perms.length) return
  const enable = await callWithin(10000, 'FaceSense', 'start')
  record('« Activer » la lecture du visage (FaceSense.start)', enable.ok && enable.value?.started === true, brief(enable.ok ? enable.value : enable.error))
  const st = (await callWithin(10000, 'FaceSense', 'status')).value || {}
  if (st.unlockAvailable !== true) {
    record('Lecture au déverrouillage (interrupteur faceUnlockPlay)', false, `absente de cet APK : ${brief(st)}`)
    return
  }
  const on = await callWithin(10000, 'FaceSense', 'start', { unlock: true })
  await sleep(3000)
  const running = (await callWithin(10000, 'FaceSense', 'status')).value || {}
  record(
    'Lecture au déverrouillage démarrée (R8)',
    on.ok && running.running === true && shell(`pidof ${PKG}`).trim() === pid0,
    `start ${brief(on.ok ? on.value : on.error)}, running ${running.running}, lastError ${running.lastError ?? '—'}`,
    UNLOCK_KNOWN,
  )
  await callWithin(10000, 'FaceSense', 'stopUnlock')
  await sleep(1500)

  shell(`cmd appops set ${PKG} CAMERA ignore`)
  const refused = await callWithin(10000, 'FaceSense', 'start', { unlock: true })
  await sleep(12000)
  const pid1 = shell(`pidof ${PKG}`).trim()
  const after = (await callWithin(10000, 'FaceSense', 'status')).value || null
  record(
    'Caméra refusée par Android : l’app reste ouverte',
    pid1 === pid0 && !!after,
    `pid ${pid0} → ${pid1 || 'aucun'}, start ${brief(refused.ok ? refused.value : refused.error)}, running ${after?.running}, lastError ${after?.lastError ?? '—'}`,
    UNLOCK_KNOWN,
  )
  shell(`cmd appops set ${PKG} CAMERA allow`)
  await callWithin(10000, 'FaceSense', 'stopUnlock')
}

// ── Déroulé ────────────────────────────────────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(APK)) {
    record('APK play release présent', false, `${APK} introuvable`)
    return
  }
  shell('am force-stop com.healthtrack.app')
  shell(`pm uninstall ${PKG}`)
  adb('install', APK)
  // Caméra accordée d'avance : la lecture du visage ne passe pas par l'écran d'accord pendant ce test
  shell(`pm grant ${PKG} android.permission.CAMERA`)
  adb('logcat', '-b', 'all', '-c')
  const component = shell(`cmd package resolve-activity --brief ${PKG}`).trim().split('\n').pop()
  shell(`am start -W -n ${component}`)

  const t0 = Date.now()
  let firstScreen = false
  while (Date.now() - t0 < 90000) {
    shell('uiautomator dump /sdcard/ui_release.xml >/dev/null 2>&1')
    if (shell('cat /sdcard/ui_release.xml').includes(FIRST_SCREEN)) {
      firstScreen = true
      break
    }
    await sleep(1000)
  }
  record('Premier écran affiché (release R8)', firstScreen, firstScreen ? `« ${FIRST_SCREEN}… » en ${Math.round((Date.now() - t0) / 1000)} s` : 'non affiché après 90 s')

  if (!(await connectWebView())) {
    record('WebView inspectable (APK de test)', false, 'aucune page DevTools : capacitor.config.json non modifié ?')
    return
  }
  await evaluate(`new Promise((r) => { const t = setInterval(() => { if (window.Capacitor?.Plugins) { clearInterval(t); r(true) } }, 200) })`)

  const headers = (await evaluate('(window.Capacitor.PluginHeaders || []).map((h) => h.name)')) || []
  const missing = PLUGINS.filter((p) => !headers.includes(p))
  record('Plugins natifs enregistrés', missing.length === 0, missing.length ? `absents : ${missing.join(', ')}` : `${PLUGINS.length} plugins présents (${headers.length} au total)`)
  const extra = ABSENT.filter((p) => headers.includes(p))
  record('Pas de mise à jour hors Play (AppUpdate absent)', extra.length === 0, extra.length ? `présents : ${extra.join(', ')}` : 'absent')

  // Lecture du visage : modèles LiteRT (embarqués) et ONNX (téléchargés à la demande)
  const prep = await callPlugin('FaceSense', 'prepareAffect')
  record('FaceSense.prepareAffect', prep.ok, brief(prep.ok ? prep.value : prep.error))
  let status = null
  const tDl = Date.now()
  while (Date.now() - tDl < 240000) {
    const s = await callPlugin('FaceSense', 'status')
    status = s.ok ? s.value : null
    if (!status || (status.affectModel && status.affectModel2) || !status.affectDownloading) break
    await sleep(3000)
  }
  record('FaceSense.status', !!status && status.models === true, status ? `models ${status.models}, ONNX ${status.affectModel}/${status.affectModel2}` : 'pas de réponse')
  const onnxReady = !!(status && status.affectModel && status.affectModel2)
  if (!onnxReady) console.log('::warning::Modèles ONNX du visage non téléchargés sur l’émulateur : leur ouverture n’est pas vérifiée')

  const read = await callPlugin('FaceSense', 'test')
  const outcome = read.ok ? String(read.value?.outcome ?? '') : ''
  const after = (await callPlugin('FaceSense', 'status')).value || {}
  const affectErr = after.lastAffectError ? String(after.lastAffectError) : ''
  const modelsBroken = /no_models|inference_error/.test(outcome) || /Error$/.test(affectErr)
  record(
    'Lecture du visage (LiteRT + ONNX)',
    read.ok && outcome !== '' && !modelsBroken,
    `issue « ${outcome || read.error} »${after.modelLoadMs != null ? `, modèles chargés en ${after.modelLoadMs} ms` : ''}${affectErr ? `, erreur ONNX ${affectErr}` : ''}${onnxReady ? '' : ' (ONNX absents)'}`,
  )

  for (const [plugin, method, options] of [
    ['PlayBilling', 'getProducts', { productIds: ['premium'] }],
    ['PlayBilling', 'queryPurchases', {}],
    ['PlayIntegrity', 'request', { requestHash: 'c21va2UtdGVzdA' }],
    ['Health', 'isAvailable', {}],
    ['PhoneUsage', 'checkAccess', {}],
  ]) {
    const r = await callPlugin(plugin, method, options)
    record(`${plugin}.${method}`, !notImplemented(r), r.ok ? `réponse ${brief(r.value)}` : `refus attendu sur l’émulateur : ${r.error.slice(0, 160)}`)
  }
  await sleep(2000)
}

try {
  await main()
} catch (e) {
  record('Déroulé du test', false, e.message)
}

try {
  writeFileSync('screenshot_play_release.png', execFileSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 }))
} catch {
  /* capture facultative */
}
const pid = shell(`pidof ${PKG}`).trim()
const logcat = pid ? shell(`logcat -d --pid=${pid}`) : shell('logcat -d')
writeFileSync('play_release_logcat.txt', logcat)
const crash = shell('logcat -d -b crash')
const linkage = [...logcat.split('\n'), ...crash.split('\n').filter((l) => l.includes(PKG))].filter((l) => LINKAGE.test(l))
const crashed = new RegExp(`Process: ${PKG.replace(/\./g, '\\.')}[,:]`).test(crash)
record('Aucune classe ou méthode retirée par R8 (journal)', linkage.length === 0, linkage.length ? linkage.slice(0, 3).join(' | ').slice(0, 300) : 'journal propre')
record('Aucun plantage du processus', !crashed, crashed ? 'FATAL EXCEPTION dans le tampon crash' : 'aucun')

// Lecture au déverrouillage en dernier : si elle tue l'app, la WebView ne répond plus. Trace du plantage et journal
// complet gardés dans play_release_unlock.txt (artefact) et affichés ici.
if (cdp) {
  adb('logcat', '-b', 'all', '-c')
  try {
    await unlockScenarios()
  } catch (e) {
    record('Lecture au déverrouillage (déroulé)', false, e.message, UNLOCK_KNOWN)
  }
  await sleep(2000)
  const unlockCrash = shell('logcat -d -b crash')
  const unlockLog = shell('logcat -d -b main -b system -v threadtime')
    .split('\n')
    .filter((l) => /FaceSense|AndroidRuntime|ActivityManager|ActiveServices|ForegroundService|healthtrack|jpesquet/.test(l))
    .join('\n')
  writeFileSync('play_release_unlock.txt', `== tampon crash ==\n${unlockCrash}\n== journal filtré ==\n${unlockLog}\n`)
  console.log('[release] tampon crash après la lecture au déverrouillage :\n' + (unlockCrash.trim() || '(vide)').slice(0, 6000))
  const fatal = unlockCrash.split('\n').find((l) => /Exception|Error/.test(l))
  if (fatal) record('Lecture au déverrouillage : trace du plantage', false, fatal.trim().slice(0, 300), UNLOCK_KNOWN)
}

const failed = checks.filter((c) => !c.ok && !c.known)
writeFileSync(
  OUT_MD,
  [
    '## Variante play en release (R8 : optimisée, obscurcie) — POL-PLAY-10',
    '',
    '| Vérification | Résultat | Détail |',
    '|---|---|---|',
    ...checks.map((c) => `| ${c.name} | ${c.ok ? '✅' : c.known ? '⚠️ connu' : '❌'} | ${c.proof.replace(/\|/g, '/')} |`),
    '',
    failed.length ? `**${failed.length} vérification(s) en échec.**` : 'Tout est vert : le code obscurci par R8 se comporte comme la build debug sur ces points.',
    '',
  ].join('\n'),
)
shell(`pm uninstall ${PKG}`)
process.exit(failed.length ? 1 : 0)
