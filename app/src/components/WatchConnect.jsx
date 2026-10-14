/**
 * « Connexion à la montre » (cœur de la carte « Montre Huawei », chantier D3 étapes c et d) : HealthTrack
 * s'authentifie auprès de la montre (HiChain), garde la clé sur le téléphone, puis lit les mesures. Au premier appairage,
 * 3 constantes publiques (huawei-lpv2, MIT) sont nécessaires : téléchargées ou collées d'un geste,
 * gardées en local, jamais dans le code de l'app. Logique dans src/devices/huawei/pairing.js.
 */
import { useEffect, useState } from 'react'
import { CONNECT_STEPS, SECRETS_SOURCE_URL, connectAdvice, loadSecrets, saveSecrets } from '../devices/huawei/pairing'
import { parseDigestSecrets } from '../devices/huawei/hichain'
import { associationState } from '../devices/huawei/association'
import { loadLastConnect, saveLastConnect } from '../devices/huawei/journal'
import { formatAgo } from '../utils/timeAgo'
import { describeAutoSync, getWatchAutoSyncState } from '../services/watchAutoSync'

const ICONS = { ok: '✓', warn: '!', fail: '✕', skip: '–', running: '…', pending: '·' }


async function defaultFetchSecrets() {
  const res = await fetch(SECRETS_SOURCE_URL)
  if (!res.ok) throw new Error(`téléchargement refusé (${res.status})`)
  return res.text()
}

/**
 * @param {{ connect: Function, fetchSecrets?: Function, onReport?: Function }} props
 * `connect({ secrets, rebind, onUpdate })` → rapport (pairing.connectAndAuthenticate).
 * `onReport(rapport)` : rapport final, pour l'export du journal commun de la carte (WatchDiagnostic).
 */
export default function WatchConnect({ connect, fetchSecrets = defaultFetchSecrets, onReport = () => {} }) {
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
  const autoLine = describeAutoSync(auto, { formatAgo })
  const assoc = code === 'connected' ? associationState(report) : null
  const steps = report?.steps || CONNECT_STEPS.map((s) => ({ ...s, status: 'pending' }))

  return (
    <div className="watch-connect" aria-label="Connexion à la montre">
      <p className="my-devices-intro">
        HealthTrack parle directement à votre montre, sans Huawei Santé ni Gadgetbridge. La clé que la montre lui remet reste{' '}
        <strong>sur ce téléphone uniquement</strong> ; chaque connexion lit les nouvelles mesures (pas, cœur, SpO₂, sommeil, VFC de la
        nuit, séances), et HealthTrack resynchronise tout seul quand vous ouvrez l’app.
      </p>
      {autoLine && <p className="my-device-meta watch-connect-auto">{autoLine}</p>}

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
          {running ? 'Connexion…' : code === 'connected' ? 'Synchroniser la montre' : 'Se connecter à la montre'}
        </button>
        {(code === 'key_rejected' || code === 'pin_failed' || code === 'connected') && !running && (
          <button type="button" className="btn btn-secondary connector-btn" onClick={() => start(true)} disabled={!secrets}>
            Refaire l’appairage
          </button>
        )}
      </div>

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
          {report.outcome && (
            <div className={`watch-diag-verdict ${code === 'connected' ? 'watch-diag-verdict-ok' : ''}`}>
              <p className="watch-diag-verdict-title">{report.outcome.title}</p>
              <ul>
                {connectAdvice(report).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {assoc && (
            <div className={`watch-assoc ${assoc.code === 'confirmed' ? 'watch-assoc-ok' : ''}`} aria-live="polite">
              <p className="watch-assoc-title">{assoc.title}</p>
              {assoc.code === 'likely' && (
                <>
                  <p className="my-device-meta">
                    HealthTrack a envoyé ce qu’une app compagnon envoie après l’appairage (accords, appareil principal, profil, fuseau). Que
                    montre la montre maintenant ?
                  </p>
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
              {assoc.code === 'confirmed' && <p className="my-device-meta">Elle enregistre vos mesures : elles arrivent à chaque synchro.</p>}
              {assoc.code === 'not_associated' && (
                <p className="my-device-meta">
                  Enregistrez le journal et transmettez-le : il dit ce que la montre a accepté et demandé. Si elle affiche « Échec de
                  l’association », réinitialisez-la (Dépannage, plus bas), puis touchez « Refaire l’appairage » pendant que son écran
                  d’association est affiché.
                </p>
              )}
              {assoc.code === 'pending' && (
                <p className="my-device-meta">Touchez « Synchroniser la montre » : HealthTrack termine maintenant l’association côté montre.</p>
              )}
            </div>
          )}
          {report.finishedAt && (
            <p className="my-device-meta">Dernière connexion : {formatAgo(report.finishedAt)} · journal sans clé, sans PIN ni adresse complète.</p>
          )}
        </div>
      )}
      {message && <p className="my-device-message">{message}</p>}
    </div>
  )
}
