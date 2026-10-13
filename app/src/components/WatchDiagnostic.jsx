/**
 * « Montre Huawei en direct » (page Connecteurs) : diagnostic de la connexion directe à une montre
 * Huawei / Honor, sans Huawei Santé ni Gadgetbridge (chantier D3, étape a). Déroule chaque étape,
 * conclut, et exporte un journal (sans adresse MAC complète) à transmettre pour la suite.
 * Logique dans src/devices/huawei/diagnostic.js.
 */
import { useState } from 'react'
import { registerPlugin } from '@capacitor/core'
import { getClient, isBleAvailable, ready } from '../devices/ble/bleService'
import { runHuaweiDiagnostic, STEPS } from '../devices/huawei/diagnostic'
import { detectPhoneApps } from '../devices/phoneApps'
import { CURRENT_VERSION } from '../services/updateCheck'
import { formatAgo } from '../utils/timeAgo'
import WatchSetup from './WatchSetup'
import WatchConnect from './WatchConnect'
import { connectAndAuthenticate, findBondedWatch } from '../devices/huawei/pairing'
import { classicTransport, HUAWEI_RFCOMM_UUID, HONOR_RFCOMM_UUID } from '../devices/huawei/transports'
import { loadSetup } from '../devices/huawei/setup'
import './WatchDiagnostic.css'

const LAST_KEY = 'healthtrack_watch_diagnostic_last'

const ICONS = { ok: '✓', warn: '!', fail: '✕', skip: '–', running: '…', pending: '·' }

function loadLast() {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) || 'null')
    return v && Array.isArray(v.steps) ? v : null
  } catch {
    return null
  }
}

function saveLast(report) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(report))
  } catch {
    /* stockage plein : le rapport reste affiché et exportable */
  }
}

const isNative = () => typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true

const NativeBtClassic = registerPlugin('BtClassic')
const NativeAppManager = registerPlugin('AppManager')

/** Plugin RFCOMM : faux plugin des captures (`npm run visual -- --ble=watch`), natif dans l'app, sinon aucun. */
function classicPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeBtClassic) return window.__healthtrackFakeBtClassic
  return isNative() ? NativeBtClassic : null
}

/** Boîte de désinstallation / réglages d'une app : faux plugin des captures, natif dans l'app, sinon aucun. */
function appManagerPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeAppManager) return window.__healthtrackFakeAppManager
  return isNative() ? NativeAppManager : null
}

async function defaultRun(onUpdate) {
  const client = await getClient()
  return runHuaweiDiagnostic({ client, classic: classicPlugin(), ready, detectApps: detectPhoneApps, onUpdate, appVersion: CURRENT_VERSION })
}

/** Connexion authentifiée (étape c) à la montre appairée à Android, en Bluetooth classique. */
async function defaultConnect({ secrets, rebind, onUpdate }) {
  const classic = classicPlugin()
  if (!classic) throw new Error('Connexion possible seulement dans l’app Android.')
  const watch = await findBondedWatch(classic)
  if (!watch) throw new Error('Aucune montre Huawei appairée à Android : suivez d’abord « Libérer et appairer la montre ».')
  const honor = /honor/i.test(watch.name) && (watch.uuids || []).map((u) => String(u).toLowerCase()).includes(HONOR_RFCOMM_UUID)
  const setupState = loadSetup()
  return connectAndAuthenticate({
    transport: classicTransport(classic, watch.deviceId, honor ? HONOR_RFCOMM_UUID : HUAWEI_RFCOMM_UUID),
    watchKey: watch.deviceId,
    watchName: watch.name,
    secrets,
    rebind,
    accountId: setupState.choice === 'keep' ? setupState.accountId || null : null,
    onUpdate,
    appVersion: CURRENT_VERSION,
  })
}

async function defaultSave(json, filename) {
  if (isNative()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    await Filesystem.writeFile({ path: filename, data: btoa(unescape(encodeURIComponent(json))), directory: Directory.Documents })
    return 'Journal enregistré dans le dossier Documents du téléphone.'
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'Téléchargement du journal démarré.'
}

async function defaultCopy(text) {
  await navigator.clipboard.writeText(text)
  return 'Journal copié : collez-le dans un message.'
}

/**
 * @param {{ run?: Function, available?: boolean, save?: Function, copy?: Function, setup?: object|null }} props
 * `connect` : connexion authentifiée (pairing.js), null pour masquer « Connexion à la montre ».
 * `setup` : dépendances de l'assistant « Libérer et appairer » ({ detectApps, classic, appManager }), null pour le masquer.
 */
export default function WatchDiagnostic({ run = defaultRun, available = isBleAvailable(), save = defaultSave, copy = defaultCopy, setup, connect }) {
  const connectFn = connect === undefined ? (classicPlugin() ? defaultConnect : null) : connect
  const setupDeps = setup === undefined ? { detectApps: detectPhoneApps, classic: classicPlugin(), appManager: appManagerPlugin() } : setup
  const [report, setReport] = useState(loadLast)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState(null)

  const start = async () => {
    setRunning(true)
    setMessage(null)
    try {
      const final = await run((r) => setReport(r))
      setReport(final)
      saveLast(final)
    } catch (e) {
      setMessage(`Diagnostic interrompu : ${e?.message || e}`)
    } finally {
      setRunning(false)
    }
  }

  const exportWith = async (fn) => {
    if (!report) return
    const json = JSON.stringify(report, null, 2)
    const filename = `healthtrack-diagnostic-montre-${(report.startedAt || new Date().toISOString()).slice(0, 16).replace(/[T:]/g, '-')}.json`
    try {
      setMessage(await fn(json, filename))
    } catch (e) {
      setMessage(`Export impossible : ${e?.message || e}`)
    }
  }

  const steps = report?.steps || STEPS.map((s) => ({ ...s, status: 'pending' }))

  return (
    <section className="my-devices watch-diag" aria-labelledby="watch-diag-title">
      <h3 id="watch-diag-title" className="my-devices-title">Montre Huawei en direct</h3>
      <p className="my-devices-intro">
        HealthTrack apprend à parler directement à votre montre Huawei ou Honor, sans Huawei Santé ni Gadgetbridge. Ce test vérifie
        chaque étape <strong>sans rien modifier sur la montre</strong> (ni appairage, ni réinitialisation), puis vous donne un journal à
        me transmettre.
      </p>

      {!available ? (
        <p className="my-devices-intro">Dans l’app Android, un bouton lance le test, montre allumée près du téléphone.</p>
      ) : (
        <button type="button" className="btn btn-primary connector-btn" onClick={start} disabled={running}>
          {running ? 'Test en cours…' : report ? 'Relancer le test' : 'Tester la connexion directe'}
        </button>
      )}

      {report && (
        <div className="my-device watch-diag-report" aria-live="polite">
          {report.watch?.name && <p className="watch-diag-watch">{report.watch.name}</p>}
          <ol className="watch-diag-steps">
            {steps.map((s) => (
              <li key={s.id} className={`watch-diag-step watch-diag-${s.status}`}>
                <span className="watch-diag-icon" aria-hidden="true">
                  {ICONS[s.status] || '·'}
                </span>
                <span className="watch-diag-label">
                  {s.label}
                  {s.detail && <span className="watch-diag-detail"> — {s.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
          {report.verdict && (
            <div className={`watch-diag-verdict ${report.verdict.code === 'link_ok' ? 'watch-diag-verdict-ok' : ''}`}>
              <p className="watch-diag-verdict-title">{report.verdict.title}</p>
              <ul>
                {report.verdict.advice.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {report.finishedAt && (
            <>
              <p className="my-device-meta">Dernier test : {formatAgo(report.finishedAt)} · {report.log.length} lignes de journal, sans votre adresse Bluetooth complète.</p>
              <div className="my-device-actions">
                <button type="button" className="btn btn-secondary connector-btn" onClick={() => exportWith(save)}>
                  Enregistrer le journal
                </button>
                <button type="button" className="btn btn-secondary connector-btn" onClick={() => exportWith((json) => copy(json))}>
                  Copier le journal
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {message && <p className="my-device-message">{message}</p>}
      {available && setupDeps && <WatchSetup {...setupDeps} verdict={report?.verdict?.code || null} onRunTest={running ? undefined : start} />}
      {available && connectFn && <WatchConnect connect={connectFn} save={save} copy={copy} />}
    </section>
  )
}
