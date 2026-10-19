/**
 * « Lecture du visage » (page Connecteurs, D4 / I88) : un interrupteur pour le service caméra natif, l'état du
 * jour en comptes (jamais un score : porte I110), « Relancer » si Android l'a arrêté, la sortie de l'optimisation
 * de batterie et un diagnostic exportable pour vérifier le comportement réel sur le téléphone.
 * Logique dans services/faceSense.js, natif dans FaceSenseService.java / FaceSensePlugin.java.
 */
import { useCallback, useEffect, useState } from 'react'
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
} from '../services/faceSense'
import { FACE_BURST_TYPE, faceHistorySummary, getLastFaceImport, importPendingFaceBursts } from '../services/faceBursts'
import { describeGate, evaluateGate, gateDays } from '../services/mood/gate'
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

/** Comptes des rafales rangées dans l'historique et état de la porte de calibration, ou null (base illisible). */
async function defaultLoadHistory() {
  try {
    const [bursts, notes] = await Promise.all([
      listEntries({ type: FACE_BURST_TYPE, limit: Infinity }),
      listEntries({ type: 'wellbeing', limit: Infinity }),
    ])
    const gate = evaluateGate(gateDays([...bursts, ...notes]), { today: localDateKey(new Date().toISOString()) })
    return { ...faceHistorySummary(bursts), gate }
  } catch {
    return null
  }
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

  const refresh = useCallback(async () => {
    // Rafales en attente rangées d'abord : le diagnostic dit alors ce qui reste vraiment en attente.
    if (plugin) await importBursts({ plugin })
    const [s, h, e] = await Promise.all([getFaceSenseStatus(plugin), plugin ? loadHistory() : null, plugin ? loadEveningNote() : null])
    setStatus(s)
    setHistory(h)
    setEvening(e)
    setLoaded(true)
    return s
  }, [plugin, importBursts, loadHistory, loadEveningNote])

  useEffect(() => {
    refresh()
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  async function activate() {
    setBusy(true)
    setMessage(null)
    try {
      const res = await startFaceSense(plugin)
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
      await refresh()
      setMessage(null)
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

  const d = describeFaceSense(status)
  const available = plugin != null

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
          le téléphone en tire une dizaine de mesures d’expression puis les efface. Rien ne quitte le téléphone. Il
          faudra plusieurs semaines de vos notes pour que ces mesures veuillent dire quelque chose : une estimation,
          jamais un diagnostic.
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
            Android a arrêté la lecture du visage (mise à jour, redémarrage du téléphone, économie d’énergie…).
            Elle ne peut reprendre que depuis l’app ouverte : une notification « Reprendre » vous le propose
            quand l’app est fermée.
          </p>
          <div className="my-device-actions">
            <button type="button" className="btn btn-primary connector-btn" onClick={activate} disabled={busy}>Relancer</button>
            <button type="button" className="btn btn-secondary connector-btn" onClick={turnOff} disabled={busy}>Désactiver</button>
          </div>
        </>
      )}

      {available && d.state === 'active' && (
        <div className="weather-on">
          {d.lines.map((line) => <p key={line} className="weather-today">{line}</p>)}
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

      {message && <p className="my-device-meta" role="status">{message}</p>}

      {available && status && d.state !== 'off' && d.state !== 'no_models' && (
        <details className="connectors-more">
          <summary className="connectors-more-summary">Diagnostic</summary>
          <ul className="my-device-meta">
            {faceDiagnosticLines(status, { history, lastImport: getLastFaceImport(), eveningNote: evening }).map((line) => <li key={line}>{line}</li>)}
          </ul>
          <div className="my-device-actions">
            {d.state === 'active' && (
              <button type="button" className="btn btn-secondary connector-btn" onClick={test} disabled={busy}>Tester maintenant</button>
            )}
            <button type="button" className="btn btn-secondary connector-btn" onClick={exportDiagnostic} disabled={busy}>
              Enregistrer le diagnostic
            </button>
          </div>
        </details>
      )}
    </section>
  )
}
