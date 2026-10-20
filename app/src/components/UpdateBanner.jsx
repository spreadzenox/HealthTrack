import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchLatestRelease, isNewerVersion, CURRENT_VERSION } from '../services/updateCheck'
import {
  getApkAsset,
  formatMo,
  progressLabel,
  loadAppUpdatePlugin,
  createUpdateRunner,
  openInBrowser,
  STALL_MS,
} from '../services/appUpdate'
import './UpdateBanner.css'

const STEPS = [
  ['download', 'Téléchargement'],
  ['verify', 'Vérification'],
  ['installer', 'Installation'],
]

function Steps({ step }) {
  const current = STEPS.findIndex(([k]) => k === step)
  return (
    <ol className="update-steps" aria-label="Étapes de la mise à jour">
      {STEPS.map(([key, label], i) => (
        <li
          key={key}
          className={i < current ? 'done' : i === current ? 'current' : ''}
          aria-current={i === current ? 'step' : undefined}
        >
          {i < current ? '✓ ' : `${i + 1}. `}
          {label}
        </li>
      ))}
    </ol>
  )
}

export default function UpdateBanner() {
  const [release, setRelease] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [plugin, setPlugin] = useState(undefined)
  const [run, setRun] = useState({ step: 'idle' })
  const runnerRef = useRef(null)

  const asset = getApkAsset(release)
  const version = release?.tag_name?.replace(/^v/i, '') || ''
  const browserUrl = asset?.url || release?.html_url

  const check = useCallback(async () => {
    const latest = await fetchLatestRelease()
    if (latest && isNewerVersion(latest.tag_name, CURRENT_VERSION)) setRelease(latest)
  }, [])

  useEffect(() => {
    let alive = true
    loadAppUpdatePlugin().then((p) => alive && setPlugin(p))
    return () => {
      alive = false
    }
  }, [])

  // Un pilote par version ; il reprend un téléchargement déjà lancé (app rouverte, retour d'arrière-plan).
  useEffect(() => {
    if (!plugin || !asset || !version) return undefined
    const runner = createUpdateRunner({ plugin, asset, version, onChange: setRun })
    runnerRef.current = runner
    runner.attach()
    return () => {
      runner.dispose()
      runnerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugin, asset?.url, version])

  useEffect(() => {
    const refresh = () => {
      check()
      runnerRef.current?.attach()
    }
    refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    let appListenerRemove = () => {}
    import('@capacitor/app')
      .then(({ App }) =>
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) refresh()
        })
      )
      .then((handle) => {
        appListenerRemove = () => handle.remove()
      })
      .catch(() => {})
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      appListenerRemove()
    }
  }, [check])

  if (!release || dismissed) return null

  const inApp = Boolean(plugin && asset)
  const installed = CURRENT_VERSION === 'dev' ? null : CURRENT_VERSION
  const step = run.step
  const busy = step === 'download' || step === 'verify'
  const progress = step === 'download' ? progressLabel(run) : null

  const start = () => (inApp ? runnerRef.current?.start() : openInBrowser(browserUrl))
  const browserButton = (
    <button type="button" className="btn update-banner-link" onClick={() => openInBrowser(browserUrl)}>
      Télécharger depuis le navigateur
    </button>
  )

  return (
    <div className="update-banner" role="region" aria-label="Mise à jour" aria-live="polite">
      <div className="update-banner-text">
        <strong>Mise à jour disponible : version {version}</strong>
        <span className="update-banner-meta">
          {installed ? `Installée : version ${installed}` : 'Version installée inconnue'}
          {asset?.size ? ` · Taille : ${formatMo(asset.size)}` : ''}
        </span>
      </div>

      {step !== 'idle' && step !== 'permission' && step !== 'error' && <Steps step={step} />}

      {step === 'download' && (
        <div className="update-progress">
          <div
            className="update-progress-bar"
            role="progressbar"
            aria-label="Téléchargement de la mise à jour"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent ?? undefined}
          >
            <span
              className={progress.percent == null ? 'indeterminate' : ''}
              style={progress.percent == null ? undefined : { width: `${progress.percent}%` }}
            />
          </div>
          <p className="update-progress-text">
            {run.downloaded > 0 || progress.percent ? progress.text : 'Connexion à GitHub…'}
          </p>
          {run.notice && <p className="update-banner-note">{run.notice}</p>}
          {run.stalled ? (
            <p className="update-banner-error">
              Aucune donnée reçue depuis plus de {Math.round(STALL_MS / 1000)} s : le réseau semble bloqué. Le
              téléchargement continue d'essayer ; vous pouvez aussi le relancer ou passer par le navigateur.
            </p>
          ) : (
            <p className="update-banner-note">
              Vous pouvez quitter l'app : le téléchargement continue (notification Android).
            </p>
          )}
        </div>
      )}

      {step === 'verify' && (
        <p className="update-banner-note">Vérification du fichier (taille, empreinte, version)…</p>
      )}
      {step === 'installer' && (
        <p className="update-banner-note">
          L'installateur Android est ouvert : touchez « Mettre à jour ». L'app se fermera puis rouvrira dans sa
          nouvelle version.
        </p>
      )}
      {step === 'permission' && run.notice && <p className="update-banner-note">{run.notice}</p>}
      {step === 'error' && <p className="update-banner-error">Échec : {run.error}</p>}

      <div className="update-banner-actions">
        {step === 'idle' && (
          <button type="button" className="btn update-banner-btn" onClick={start}>
            {inApp ? `Mettre à jour${asset?.size ? ` (${formatMo(asset.size)})` : ''}` : 'Voir la mise à jour'}
          </button>
        )}
        {step === 'permission' && (
          <button type="button" className="btn update-banner-btn" onClick={start} disabled={!run.notice}>
            {run.notice ? 'Continuer' : 'Vérification de l’autorisation…'}
          </button>
        )}
        {(step === 'error' || run.stalled) && (
          <button type="button" className="btn update-banner-btn" onClick={start}>
            Réessayer
          </button>
        )}
        {step === 'installer' && (
          <button type="button" className="btn update-banner-btn" onClick={() => runnerRef.current?.install()}>
            Rouvrir l'installateur
          </button>
        )}
        {step === 'download' && (
          <button type="button" className="btn update-banner-dismiss" onClick={() => runnerRef.current?.cancel()}>
            Annuler
          </button>
        )}
        {!busy && (
          <button
            type="button"
            className="btn btn-secondary update-banner-dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Fermer"
          >
            Plus tard
          </button>
        )}
      </div>
      {inApp && (step === 'idle' || step === 'error' || run.stalled || step === 'installer') && (
        <div className="update-banner-fallback">{browserButton}</div>
      )}
    </div>
  )
}
