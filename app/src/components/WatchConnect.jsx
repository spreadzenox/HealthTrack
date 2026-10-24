/**
 * Cœur de la carte « Montre Huawei » (chantier D3 étapes c et d) : par défaut, une ligne d'état (connectée,
 * batterie, dernière synchro, mesures) et « Synchroniser la montre ». Les étapes techniques, « Refaire
 * l'appairage » et ce que la carte passe en `children` (test, libération, export du journal) sont repliés sous
 * « Diagnostic », fermé par défaut (VC-8). HealthTrack s'authentifie auprès de la montre (HiChain), garde la clé sur le téléphone, puis lit les mesures. Au premier appairage,
 * 3 constantes publiques (huawei-lpv2, MIT) sont nécessaires : téléchargées au premier « Connecter ma montre » (ou collées sous « Diagnostic »),
 * gardées en local, jamais dans le code de l'app. Logique dans src/devices/huawei/pairing.js.
 */
import { useEffect, useState } from 'react'
import { CONNECT_STEPS, SECRETS_SOURCE_URL, connectAdvice, loadSecrets, saveSecrets } from '../devices/huawei/pairing'
import { parseDigestSecrets } from '../devices/huawei/hichain'
import { associationState } from '../devices/huawei/association'
import { loadLastConnect, saveLastConnect } from '../devices/huawei/journal'
import { formatAgo } from '../utils/timeAgo'
import { describeWatchStatus, getWatchAutoSyncState } from '../services/watchAutoSync'
import WatchPresence from './WatchPresence'
import WatchSkinTemp from './WatchSkinTemp'
import { APP_NAME } from '../config/brand'

const ICONS = { ok: '✓', warn: '!', fail: '✕', skip: '–', running: '…', pending: '·' }


async function defaultFetchSecrets() {
  const res = await fetch(SECRETS_SOURCE_URL)
  if (!res.ok) throw new Error(`téléchargement refusé (${res.status})`)
  return res.text()
}

/**
 * @param {{ connect: Function, fetchSecrets?: Function, onReport?: Function, dataLink?: any, children?: any }} props
 * `connect({ secrets, rebind, onUpdate })` → rapport (pairing.connectAndAuthenticate).
 * `onReport(rapport)` : rapport final, pour l'export du journal commun de la carte (WatchDiagnostic).
 * `children` : outils de dépannage ajoutés en bas de « Diagnostic ».
 * `troubleshooting` : false sur la page Sources hors mode diagnostic (POL-8) : « Diagnostic » n'apparaît alors qu'après
 * une connexion qui a échoué, là où « Libérer et appairer » et « Refaire l'appairage » servent vraiment.
 * `dataLink` : lien vers l'écran « Montre » (M5), visible dès qu'une montre a été connectée.
 */
export default function WatchConnect({ connect, fetchSecrets = defaultFetchSecrets, onReport = () => {}, dataLink = null, children = null, troubleshooting = true }) {
  const [report, setReport] = useState(loadLastConnect)
  const [secrets, setSecrets] = useState(() => loadSecrets())
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState(null)
  const [paste, setPaste] = useState('')
  const [auto, setAuto] = useState(() => getWatchAutoSyncState())

  useEffect(() => {
    // la synchro automatique (ouverture de l'app) met à jour la ligne d'état
    const refresh = () => setAuto(getWatchAutoSyncState())
    window.addEventListener('watch-sync-updated', refresh)
    return () => window.removeEventListener('watch-sync-updated', refresh)
  }, [])

  const keep = (s) => {
    saveSecrets(s)
    setSecrets(s)
  }

  const download = async () => {
    setMessage(null)
    try {
      const parsed = parseDigestSecrets(await fetchSecrets())
      if (!parsed) throw new Error('constantes introuvables dans le fichier')
      keep(parsed)
      setMessage('Paramètres Huawei enregistrés sur ce téléphone.')
    } catch (e) {
      setMessage(`Paramètres non téléchargés : ${e?.message || e}. Vous pouvez les coller ci-dessous.`)
    }
  }

  const usePasted = () => {
    const parsed = parseDigestSecrets(paste)
    if (!parsed) return setMessage('Texte non reconnu : il faut les 3 lignes v1, v2, v3 de 16 octets chacune.')
    keep(parsed)
    setPaste('')
    setMessage('Paramètres Huawei enregistrés sur ce téléphone.')
  }

  /** Premier appairage : les constantes sont téléchargées au premier geste, sans écran technique (VC-8). */
  const ensureSecrets = async () => {
    if (secrets) return secrets
    try {
      const parsed = parseDigestSecrets(await fetchSecrets())
      if (!parsed) throw new Error('constantes introuvables dans le fichier')
      keep(parsed)
      return parsed
    } catch (e) {
      setMessage(`Connexion impossible pour l’instant : ${e?.message || e}. Vérifiez la connexion Internet du téléphone, puis réessayez.`)
      return null
    }
  }

  const start = async (rebind = false) => {
    setRunning(true)
    setMessage(null)
    try {
      const useSecrets = await ensureSecrets()
      if (!useSecrets) return
      const final = await connect({ secrets: useSecrets, rebind, onUpdate: (r) => setReport(r) })
      keepReport(final)
    } catch (e) {
      setMessage(e?.message || String(e))
    } finally {
      setRunning(false)
    }
  }

  const keepReport = (r) => {
    setReport(r)
    onReport(r)
    saveLastConnect(r)
  }

  /** Ce que le propriétaire voit sur la montre : l'information décisive, gardée dans le journal (§6.12). */
  const tellWhatWatchShows = (userSaw) => {
    if (!report?.association) return
    keepReport({ ...report, association: { ...report.association, userSaw, userSawAt: new Date().toISOString() } })
  }

  const code = report?.outcome?.code
  const status = describeWatchStatus(auto, { formatAgo })
  const assoc = code === 'connected' ? associationState(report) : null
  const steps = report?.steps || CONNECT_STEPS.map((s) => ({ ...s, status: 'pending' }))
  const everConnected = Boolean(auto?.everConnected) || code === 'connected'

  return (
    <div className="watch-connect" aria-label="Connexion à la montre">
      {status ? (
        <p className={`watch-status watch-status-${status.tone}`} aria-live="polite">
          <strong>{status.title}</strong> · {status.text}
        </p>
      ) : (
        <p className="my-devices-intro">
          Connectez une montre compatible Huawei : {APP_NAME} lit ses mesures (sommeil, fréquence cardiaque, pas…) directement, à chaque
          ouverture de l’app. La clé de la montre reste <strong>sur ce téléphone</strong>.
        </p>
      )}

      <div className="my-device-actions">
        <button type="button" className="btn btn-primary connector-btn" onClick={() => start(false)} disabled={running}>
          {running ? 'Connexion…' : everConnected ? 'Synchroniser la montre' : 'Connecter ma montre'}
        </button>
      </div>
      {message && <p className="my-device-message">{message}</p>}
      {everConnected && <WatchPresence />}
      {everConnected && <WatchSkinTemp />}
      {everConnected && dataLink}

      {report?.outcome && code !== 'connected' && !running && (
        <div className="watch-diag-verdict">
          <p className="watch-diag-verdict-title">{report.outcome.title}</p>
          <ul>
            {connectAdvice(report).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* fermé par défaut, même avant le premier appairage : les termes techniques n'apparaissent qu'une fois déplié (VC-8) */}
      {(troubleshooting || (report?.outcome && code !== 'connected')) && (
      <details className="watch-trouble">
        <summary>Diagnostic</summary>
        {!secrets && (
          <div className="watch-connect-secrets">
            <p className="my-device-meta">
              Le premier appairage a besoin de 3 constantes publiques (projet libre huawei-lpv2, licence MIT). Elles sont téléchargées sur ce
              téléphone, pas incluses dans l’app.
            </p>
            <button type="button" className="btn btn-secondary connector-btn" onClick={download}>
              Télécharger les paramètres
            </button>
            <details className="watch-connect-paste">
              <summary>Ou les coller</summary>
              <textarea
                className="settings-input"
                rows={3}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder={'v1: 00 11 … (16 octets)\nv2: …\nv3: …'}
                aria-label="Constantes Huawei v1, v2, v3"
              />
              <button type="button" className="btn btn-secondary connector-btn" onClick={usePasted} disabled={!paste.trim()}>
                Utiliser ce texte
              </button>
            </details>
          </div>
        )}

        {report && (
          <div className="watch-diag-report" aria-live="polite">
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
            {assoc && assoc.code !== 'confirmed' && (
              <div className="watch-assoc" aria-live="polite">
                <p className="watch-assoc-title">{assoc.title}</p>
                {assoc.code === 'likely' && (
                  <>
                    <p className="my-device-meta">Que montre la montre maintenant ?</p>
                    <div className="my-device-actions">
                      <button type="button" className="btn btn-secondary connector-btn" onClick={() => tellWhatWatchShows('watchface')}>
                        Son cadran
                      </button>
                      <button type="button" className="btn btn-secondary connector-btn" onClick={() => tellWhatWatchShows('pairing_screen')}>
                        Encore « Association »
                      </button>
                    </div>
                  </>
                )}
                {assoc.code === 'not_associated' && (
                  <p className="my-device-meta">
                    Si elle affiche « Échec de l’association », réinitialisez-la (« Libérer et appairer », plus bas), puis touchez « Refaire
                    l’appairage » pendant que son écran d’association est affiché.
                  </p>
                )}
                {assoc.code === 'pending' && <p className="my-device-meta">« Synchroniser la montre » termine l’association côté montre.</p>}
              </div>
            )}
            {report.finishedAt && <p className="my-device-meta">Dernière connexion : {formatAgo(report.finishedAt)}.</p>}
          </div>
        )}
        {(code === 'key_rejected' || code === 'pin_failed' || code === 'connected') && !running && (
          <div className="my-device-actions">
            <button type="button" className="btn btn-secondary connector-btn" onClick={() => start(true)} disabled={!secrets}>
              Refaire l’appairage
            </button>
          </div>
        )}
        {children}
      </details>
      )}
    </div>
  )
}
