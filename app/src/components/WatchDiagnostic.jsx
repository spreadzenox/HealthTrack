/**
 * « Montre Huawei » (page Connecteurs) : la seule carte de la montre (chantier D3). Par défaut, l'état
 * et « Synchroniser la montre » (WatchConnect). Repliés sous « Diagnostic » : les étapes de la
 * connexion, un seul journal exportable (dernière connexion + dernier test), le test de connexion
 * directe (étape a, rien n'est modifié sur la montre) et l'assistant « Libérer et appairer » (WatchSetup).
 * Logique dans src/devices/huawei/diagnostic.js, pairing.js et setup.js.
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
import { backgroundForJournal, loadLastConnect, watchJournal } from '../devices/huawei/journal'
import { findBondedWatch } from '../devices/huawei/pairing'
import { getBackgroundSync } from '../services/watchCaptures'
import { classicPlugin, connectBondedWatch } from '../services/watchAutoSync'
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

const NativeAppManager = registerPlugin('AppManager')

/** Boîte de désinstallation / réglages d'une app : faux plugin des captures, natif dans l'app, sinon aucun. */
function appManagerPlugin() {
  if (typeof window !== 'undefined' && window.__healthtrackFakeAppManager) return window.__healthtrackFakeAppManager
  return isNative() ? NativeAppManager : null
}

async function defaultRun(onUpdate) {
  const client = await getClient()
  return runHuaweiDiagnostic({ client, classic: classicPlugin(), ready, detectApps: detectPhoneApps, onUpdate, appVersion: CURRENT_VERSION })
}

/** Connexion authentifiée (étape c) puis lecture des mesures (étape d) : services/watchAutoSync.js. */
const defaultConnect = ({ secrets, rebind, onUpdate }) => connectBondedWatch({ secrets, rebind, onUpdate })

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
/** État de la relecture app fermée de la montre appairée (journal exporté), null hors de l'app. */
async function defaultBackground() {
  const classic = classicPlugin()
  const watch = classic ? await findBondedWatch(classic).catch(() => null) : null
  return watch ? getBackgroundSync({ deviceId: watch.deviceId }) : null
}

export default function WatchDiagnostic({ run = defaultRun, available = isBleAvailable(), save = defaultSave, copy = defaultCopy, setup, connect, background = defaultBackground }) {
  const connectFn = connect === undefined ? (classicPlugin() ? defaultConnect : null) : connect
  const setupDeps = setup === undefined ? { detectApps: detectPhoneApps, classic: classicPlugin(), appManager: appManagerPlugin() } : setup
  const [report, setReport] = useState(loadLast)
  const [connectReport, setConnectReport] = useState(loadLastConnect)
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

  const finished = (r) => (r?.finishedAt ? r : null)
  const journal = { connect: finished(connectReport), diagnostic: finished(report) }
  const exportWith = async (fn) => {
    const bg = backgroundForJournal(await Promise.resolve().then(background).catch(() => null))
    const { json, filename } = watchJournal({ ...journal, background: bg })
    try {
      setMessage(await fn(json, filename))
    } catch (e) {
      setMessage(`Export impossible : ${e?.message || e}`)
    }
  }

  const steps = report?.steps || STEPS.map((s) => ({ ...s, status: 'pending' }))
  const showConnect = available && Boolean(connectFn)

  const exportBlock = (journal.connect || journal.diagnostic) && (
    <div className="watch-journal">
      <div className="my-device-actions">
        <button type="button" className="btn btn-secondary connector-btn" onClick={() => exportWith(save)}>
          Enregistrer le journal
        </button>
        <button type="button" className="btn btn-secondary connector-btn" onClick={() => exportWith((json) => copy(json))}>
          Copier le journal
        </button>
      </div>
      <p className="my-device-meta">Sans clé, sans PIN ni adresse Bluetooth complète.</p>
    </div>
  )

  const test = (
    <>
      {!available ? (
        <p className="my-devices-intro">Dans l’app Android, un bouton teste la connexion directe, montre allumée près du téléphone.</p>
      ) : (
        <>
          <p className="my-device-meta">Le test vérifie chaque étape sans rien modifier sur la montre.</p>
          <button type="button" className="btn btn-secondary connector-btn" onClick={start} disabled={running}>
            {running ? 'Test en cours…' : report ? 'Relancer le test' : 'Tester la connexion directe'}
          </button>
        </>
      )}
      {report && (
        <div className="watch-diag-report" aria-live="polite">
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
          {report.finishedAt && <p className="my-device-meta">Dernier test : {formatAgo(report.finishedAt)}.</p>}
        </div>
      )}
      {available && setupDeps && <WatchSetup {...setupDeps} verdict={report?.verdict?.code || null} onRunTest={running ? undefined : start} />}
    </>
  )

  return (
    <section className="my-devices watch-diag" aria-labelledby="watch-diag-title">
      <h3 id="watch-diag-title" className="my-devices-title">Montre Huawei</h3>
      {showConnect ? (
        <WatchConnect connect={connectFn} onReport={setConnectReport}>
          {exportBlock}
          {message && <p className="my-device-message">{message}</p>}
          {test}
        </WatchConnect>
      ) : (
        <>
          {test}
          {exportBlock}
          {message && <p className="my-device-message">{message}</p>}
        </>
      )}
    </section>
  )
}
