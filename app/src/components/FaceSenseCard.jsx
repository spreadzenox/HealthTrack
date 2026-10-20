/**
 * « Lecture du visage » (page Connecteurs, D4 / I88) : un interrupteur pour le service caméra natif, l'humeur
 * estimée dès la première lecture (mood/faceMood.js, consigne du 19/10 au soir) avec sa fourchette et sa confiance,
 * « Relancer » si Android l'a arrêté, la sortie de l'optimisation de batterie et un diagnostic exportable (comptes
 * seulement) pour vérifier le comportement réel sur le téléphone.
 * Logique dans services/faceSense.js, natif dans FaceSenseService.java / FaceSensePlugin.java.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getFaceSenseStatus,
  startFaceSense,
  stopFaceSense,
  testFaceSense,
  requestFaceBatteryExemption,
  describeFaceSense,
  faceDiagnosticReport,
  faceDiagnosticLines,
  faceSensePlugin,
  faceCameraAccess,
  faceAffectState,
  faceAffectDuoState,
  prepareFaceAffect,
  isSamsungDevice,
  openFaceNeverSleep,
} from '../services/faceSense'
import { FACE_BURST_TYPE, faceDailyCounts, faceHistorySummary, getLastFaceImport, importPendingFaceBursts } from '../services/faceBursts'
import { describeGate, evaluateGate, gateDays } from '../services/mood/gate'
import { describeFaceMood, faceMoodEstimate, testReadingEstimate } from '../services/mood/faceMood'
import { loadFaceMoodEntries } from '../services/mood/faceMoodData'
import { getEveningNoteStatus } from '../services/eveningNote'
import { localDateKey } from '../services/analysisEngine'
import { listEntries } from '../storage/localHealthStorage'
import { CURRENT_VERSION } from '../services/updateCheck'
import './MyDevices.css'
import './WeatherCard.css'

async function defaultSave(json, filename) {
  const isNative = typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true
  if (isNative) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    await Filesystem.writeFile({ path: filename, data: btoa(unescape(encodeURIComponent(json))), directory: Directory.Documents })
    return 'Diagnostic enregistré dans le dossier Documents du téléphone.'
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'Téléchargement du diagnostic démarré.'
}

/**
 * Comptes des rafales rangées dans l'historique, humeur estimée (et celle d'un test récent), état de la
 * vérification visage ↔ notes ; null si la base est illisible.
 */
async function defaultLoadHistory() {
  try {
    const [{ bursts, notes }, usage] = await Promise.all([
      loadFaceMoodEntries(),
      listEntries({ type: 'phone_usage', limit: 14 }),
    ])
    const now = new Date()
    const today = localDateKey(now.toISOString())
    const y = [...bursts, ...notes]
    const gate = evaluateGate(gateDays(y), { today })
    return {
      ...faceHistorySummary(bursts),
      gate,
      perDay: faceDailyCounts([...bursts, ...usage], { today }),
      estimate: faceMoodEstimate(y, { now }),
      testEstimate: testReadingEstimate(y, { now }),
    }
  } catch {
    return null
  }
}

const SHIZUKU_CMD = 'appops set com.healthtrack.app CAMERA allow'

/** Pourquoi la lecture est arrêtée (faceStopCause), dit simplement. */
const STOPPED_TEXT = {
  update: 'Android a arrêté la lecture du visage pendant la mise à jour de l’app, comme à chaque mise à jour.',
  reboot: 'Le téléphone a redémarré : Android ne relance pas la lecture du visage tout seul.',
  system: 'Le téléphone a arrêté la lecture du visage de lui-même, sans mise à jour ni redémarrage — sans doute pour économiser la batterie.',
  default: 'Android a arrêté la lecture du visage (mise à jour, redémarrage du téléphone, économie d’énergie…).',
}

/**
 * Guide « accès permanent à la caméra » (I89) : Android 11+ ne laisse la caméra au service en arrière-plan que
 * s'il a démarré app ouverte ; l'app-op CAMERA en « allow », que le propriétaire s'accorde lui-même (Shizuku sans
 * PC, ou ADB), lève cette condition. L'app lit le mode courant et dit s'il est accordé.
 */
function PermanentCameraGuide({ access, open = false }) {
  if (access.permanent) {
    return <p className="my-device-meta">Accès permanent à la caméra : accordé en permanence (Shizuku / ADB).</p>
  }
  return (
    <details className="connectors-more" open={open}>
      <summary className="connectors-more-summary">Accès permanent à la caméra (Shizuku ou ADB)</summary>
      <ol className="my-device-meta">
        <li>Sans PC : installez Shizuku (Play Store), démarrez-le par le débogage sans fil (Options pour les
          développeurs), puis un terminal compatible Shizuku (par exemple aShell) et tapez la commande ci-dessous.</li>
        <li>Avec un PC : débogage USB activé, puis <code>adb shell {SHIZUKU_CMD}</code>.</li>
        <li>Commande : <code>{SHIZUKU_CMD}</code></li>
        <li>Revenez ici : le Diagnostic doit dire « Accès caméra : accordé en permanence ». À refaire seulement si
          vous réinstallez l’app (une mise à jour le garde) ou changez l’autorisation Appareil photo dans Android.</li>
      </ol>
    </details>
  )
}

const fmt = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Humeur estimée (dès la première lecture) : la phrase du jour, celle du moment, la confiance et le modèle. */
export function FaceMoodBlock({ estimate }) {
  const [main, ...rest] = describeFaceMood(estimate)
  return (
    <div className="face-mood" aria-label="Humeur estimée">
      <p className="weather-today"><strong>{main}</strong></p>
      {rest.map((line) => <p key={line} className="my-device-meta">{line}</p>)}
    </div>
  )
}

function frenchDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

/**
 * @param {{ plugin?: object|null, save?: Function, importBursts?: Function, loadHistory?: Function, loadEveningNote?: Function }} props
 */
export default function FaceSenseCard({
  plugin = faceSensePlugin(),
  save = defaultSave,
  importBursts = importPendingFaceBursts,
  loadHistory = defaultLoadHistory,
  loadEveningNote = getEveningNoteStatus,
}) {
  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState(null)
  const [evening, setEvening] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const affectAsked = useRef(false)

  const refresh = useCallback(async () => {
    // Rafales en attente rangées d'abord : le diagnostic dit alors ce qui reste vraiment en attente.
    if (plugin) await importBursts({ plugin })
    const [s, h, e] = await Promise.all([getFaceSenseStatus(plugin), plugin ? loadHistory() : null, plugin ? loadEveningNote() : null])
    // Modèle valence / éveil (étape 2) : téléchargé une fois, app ouverte, dès que la lecture est active.
    // Duo (I126) : le second modèle (8 Mo) est demandé de la même façon, y compris quand le premier est déjà là.
    const missing = (state) => state === 'missing' || state === 'error'
    if (s?.enabled && (missing(faceAffectState(s)) || missing(faceAffectDuoState(s))) && !affectAsked.current) {
      affectAsked.current = true
      prepareFaceAffect(plugin)
    }
    setStatus(s)
    setHistory(h)
    setEvening(e)
    setLoaded(true)
    return { status: s, history: h }
  }, [plugin, importBursts, loadHistory, loadEveningNote])

  useEffect(() => {
    refresh()
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  async function activate({ restart = false } = {}) {
    setBusy(true)
    setMessage(null)
    try {
      const res = await startFaceSense(plugin, restart ? { restart: true } : undefined)
      if (!res.permission) setMessage('Accès à la caméra refusé : rien n’a été activé.')
      else if (!res.started) setMessage('Android a refusé de démarrer la lecture. Réessayez app ouverte.')
      // le service met un instant à démarrer
      await new Promise((r) => setTimeout(r, 400))
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function turnOff() {
    setBusy(true)
    try {
      await stopFaceSense(plugin)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function test() {
    setBusy(true)
    setMessage('Regardez l’écran quelques secondes…')
    try {
      await testFaceSense(plugin)
      await new Promise((r) => setTimeout(r, 4000))
      const { history: h } = await refresh()
      const t = h?.testEstimate
      setMessage(t
        ? `Test : visage lu. Humeur de ce moment : ${t.label}, ≈ ${fmt(t.note)} / 5 (entre ${fmt(t.low)} et ${fmt(t.high)}). Un test ne compte pas dans l’estimation du jour.`
        : null)
    } finally {
      setBusy(false)
    }
  }

  async function exportDiagnostic() {
    const report = faceDiagnosticReport(await getFaceSenseStatus(plugin), {
      appVersion: CURRENT_VERSION,
      history: await loadHistory(),
      lastImport: getLastFaceImport(),
      eveningNote: await loadEveningNote(),
    })
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    try {
      setMessage(await save(JSON.stringify(report, null, 2), `healthtrack-visage-${stamp}.json`))
    } catch {
      setMessage('Enregistrement impossible.')
    }
  }

  async function neverSleep() {
    const opened = await openFaceNeverSleep(plugin)
    setMessage(opened === 'app_details'
      ? 'Liste Samsung introuvable : réglages de l’app ouverts. Cherchez Batterie → Applis jamais en veille.'
      : opened ? null : 'Réglage introuvable : Paramètres → Batterie → Limites d’utilisation en arrière-plan → Applis jamais en veille.')
  }

  const d = describeFaceSense(status)
  const available = plugin != null
  const samsung = isSamsungDevice(status)

  return (
    <section className="weather-card" aria-labelledby="face-sense-title">
      <div className="my-device-head">
        <h3 id="face-sense-title" className="my-devices-title">Lecture du visage</h3>
        {d.badge && (
          <span className={`my-device-status ${d.state === 'active' ? 'device-status-ok' : 'device-status-action'}`}>{d.badge}</span>
        )}
      </div>

      {(d.state === 'off' || d.state === 'unavailable') && (
        <p className="my-devices-intro">
          Pour estimer votre humeur sans rien saisir : à chaque déverrouillage, la caméra frontale prend 3 images,
          le téléphone en tire une dizaine de mesures d’expression puis les efface. Rien ne quitte le téléphone. Une
          humeur estimée s’affiche dès la première lecture, avec sa fourchette ; vos notes, facultatives, l’affinent.
          Une estimation, jamais un diagnostic.
        </p>
      )}

      {!available && <p className="my-device-message">Disponible dans l’app Android.</p>}
      {available && !loaded && <p className="my-device-message">Lecture de l’état…</p>}
      {available && loaded && d.state === 'unavailable' && (
        <>
          <p className="my-device-message">
            Le module de lecture du visage ne répond pas. Vérifiez que l’app est à jour (Plus → Nouveautés), puis
            réessayez.
          </p>
          <div className="my-device-actions">
            <button type="button" className="btn btn-primary connector-btn" onClick={() => refresh()} disabled={busy}>Réessayer</button>
          </div>
        </>
      )}
      {available && d.state === 'no_models' && (
        <p className="my-device-message">Cette version de l’app n’embarque pas le modèle du visage.</p>
      )}

      {available && d.state === 'off' && (
        <button type="button" className="btn btn-primary connector-btn" onClick={activate} disabled={busy}>
          Activer la lecture du visage
        </button>
      )}

      {available && d.state === 'denied' && (
        <>
          <p className="my-device-message">
            L’accès à la caméra a été retiré. Touchez « Autoriser », ou Paramètres Android → Applications →
            HealthTrack → Autorisations → Appareil photo.
          </p>
          <div className="my-device-actions">
            <button type="button" className="btn btn-primary connector-btn" onClick={activate} disabled={busy}>Autoriser</button>
            <button type="button" className="btn btn-secondary connector-btn" onClick={turnOff} disabled={busy}>Désactiver</button>
          </div>
        </>
      )}

      {available && d.state === 'stopped' && (
        <>
          <p className="my-device-message">
            {STOPPED_TEXT[d.cause] || STOPPED_TEXT.default}
            {' '}Elle ne peut reprendre que depuis l’app ouverte : une notification « Reprendre » vous le propose
            quand l’app est fermée.
          </p>
          {d.cause === 'system' && samsung && (
            <p className="my-device-meta">
              Pour que ça ne se reproduise pas : touchez « Applis jamais en veille », puis « + » et cochez HealthTrack.
            </p>
          )}
          <div className="my-device-actions">
            <button type="button" className="btn btn-primary connector-btn" onClick={activate} disabled={busy}>Relancer</button>
            {d.cause === 'system' && samsung && (
              <button type="button" className="btn btn-secondary connector-btn" onClick={neverSleep} disabled={busy}>Applis jamais en veille</button>
            )}
            <button type="button" className="btn btn-secondary connector-btn" onClick={turnOff} disabled={busy}>Désactiver</button>
          </div>
        </>
      )}

      {available && d.state === 'blocked' && (
        <>
          {d.lines.map((line) => <p key={line} className="weather-today">{line}</p>)}
          <p className="my-device-message">
            Android a refusé la caméra au dernier déverrouillage : le réglage « Autoriser seulement lorsque l’appli
            est utilisée » ne la laisse au service que s’il a démarré app ouverte. Touchez « Relancer » maintenant,
            app ouverte ; pour ne plus dépendre de ce détail, accordez l’accès permanent (guide ci-dessous).
          </p>
          <div className="my-device-actions">
            <button type="button" className="btn btn-primary connector-btn" onClick={() => activate({ restart: true })} disabled={busy}>Relancer</button>
            <button type="button" className="btn btn-secondary connector-btn" onClick={turnOff} disabled={busy}>Désactiver</button>
          </div>
          <PermanentCameraGuide access={faceCameraAccess(status)} open />
        </>
      )}

      {available && d.state === 'active' && (
        <div className="weather-on">
          {d.lines.map((line) => <p key={line} className="weather-today">{line}</p>)}
          {history?.estimate && <FaceMoodBlock estimate={history.estimate} />}
          <p className="my-device-meta">
            {history?.stored
              ? `${history.stored} ${history.stored > 1 ? 'lectures gardées' : 'lecture gardée'} depuis le ${frenchDate(history.firstAt)}. `
              : ''}
            {describeGate(history?.gate)}
          </p>
          {!status.batteryExempt && (
            <p className="my-device-meta">
              Pour qu’Android ne coupe pas la lecture en arrière-plan, autorisez HealthTrack sans restriction de
              batterie.
            </p>
          )}
          <div className="my-device-actions">
            {!status.batteryExempt && (
              <button type="button" className="btn btn-primary connector-btn" onClick={() => requestFaceBatteryExemption(plugin)} disabled={busy}>
                Sans restriction
              </button>
            )}
            <button type="button" className="btn btn-secondary connector-btn" onClick={turnOff} disabled={busy}>Désactiver</button>
          </div>
        </div>
      )}

      {available && history?.estimate && d.state !== 'off' && d.state !== 'active' && <FaceMoodBlock estimate={history.estimate} />}

      {message && <p className="my-device-meta" role="status">{message}</p>}

      {available && status && d.state !== 'off' && d.state !== 'no_models' && (
        <details className="connectors-more">
          <summary className="connectors-more-summary">Diagnostic</summary>
          <ul className="my-device-meta">
            {faceDiagnosticLines(status, { history, lastImport: getLastFaceImport(), eveningNote: evening }).map((line) => <li key={line}>{line}</li>)}
          </ul>
          <div className="my-device-actions">
            {(d.state === 'active' || d.state === 'blocked') && (
              <button type="button" className="btn btn-secondary connector-btn" onClick={test} disabled={busy}>Tester maintenant</button>
            )}
            <button type="button" className="btn btn-secondary connector-btn" onClick={exportDiagnostic} disabled={busy}>
              Enregistrer le diagnostic
            </button>
            {samsung && d.cause !== 'system' && (
              <button type="button" className="btn btn-secondary connector-btn" onClick={neverSleep} disabled={busy}>Applis jamais en veille</button>
            )}
          </div>
          {samsung && (
            <p className="my-device-meta">
              Samsung met aussi en veille les applis peu ouvertes, même « sans restriction » : ajoutez HealthTrack aux
              « Applis jamais en veille » (Batterie → Limites d’utilisation en arrière-plan) pour que la lecture tienne.
            </p>
          )}
          {d.state !== 'blocked' && <PermanentCameraGuide access={faceCameraAccess(status)} />}
        </details>
      )}
    </section>
  )
}
