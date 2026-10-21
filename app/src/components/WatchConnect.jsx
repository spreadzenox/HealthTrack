/**
 * Cœur de la carte « Montre Huawei » (chantier D3 étapes c et d) : par défaut, une ligne d'état (connectée,
 * batterie, dernière synchro, mesures) et « Synchroniser la montre ». Les étapes techniques, « Refaire
 * l'appairage » et ce que la carte passe en `children` (test, libération, export du journal) sont repliés sous
 * « Diagnostic ». HealthTrack s'authentifie auprès de la montre (HiChain), garde la clé sur le téléphone, puis lit les mesures. Au premier appairage,
 * 3 constantes publiques (huawei-lpv2, MIT) sont nécessaires : téléchargées ou collées d'un geste,
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
import { APP_NAME } from '../config/brand'

const ICONS = { ok: '✓', warn: '!', fail: '✕', skip: '–', running: '…', pending: '·' }


async function defaultFetchSecrets() {
  const res = await fetch(SECRETS_SOURCE_URL)
  if (!res.ok) throw new Error(`téléchargement refusé (${res.status})`)
  return res.text()
}

/**
 * @param {{ connect: Function, fetchSecrets?: Function, onReport?: Function, children?: any }} props
 * `connect({ secrets, rebind, onUpdate })` → rapport (pairing.connectAndAuthenticate).
 * `onReport(rapport)` : rapport final, pour l'export du journal commun de la carte (WatchDiagnostic).
 * `children` : outils de dépannage ajoutés en bas de « Diagnostic ».
 */
export default function WatchConnect({ connect, fetchSecrets = defaultFetchSecrets, onReport = () => {}, children = null }) {
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

  const start = async (rebind = false) => {
    setRunning(true)
    setMessage(null)
    try {
      const final = await connect({ secrets, rebind, onUpdate: (r) => setReport(r) })
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
          {APP_NAME} parle directement à votre montre, sans Huawei Santé ni Gadgetbridge, et relit ses mesures à chaque ouverture de
          l’app. La clé de la montre reste <strong>sur ce téléphone</strong>.
        </p>
      )}

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

      <div className="my-device-actions">
        <button type="button" className="btn btn-primary connector-btn" onClick={() => start(false)} disabled={running}>
          {running ? 'Connexion…' : everConnected ? 'Synchroniser la montre' : 'Se connecter à la montre'}
        </button>
      </div>
      {message && <p className="my-device-message">{message}</p>}
      {everConnected && <WatchPresence />}

      <details className="watch-trouble" open={!everConnected || (code && code !== 'connected') || undefined}>
        <summary>Diagnostic</summary>
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
            {report.outcome && code !== 'connected' && (
              <div className="watch-diag-verdict">
                <p className="watch-diag-verdict-title">{report.outcome.title}</p>
                <ul>
                  {connectAdvice(report).map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
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
    </div>
  )
}
