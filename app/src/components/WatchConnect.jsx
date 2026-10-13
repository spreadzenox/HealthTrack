/**
 * « Connexion à la montre » (carte « Montre Huawei en direct », chantier D3 étapes c et d) : HealthTrack
 * s'authentifie auprès de la montre (HiChain), garde la clé sur le téléphone, puis lit les mesures. Au premier appairage,
 * 3 constantes publiques (huawei-lpv2, MIT) sont nécessaires : téléchargées ou collées d'un geste,
 * gardées en local, jamais dans le code de l'app. Logique dans src/devices/huawei/pairing.js.
 */
import { useState } from 'react'
import { CONNECT_STEPS, SECRETS_SOURCE_URL, connectAdvice, loadSecrets, saveSecrets } from '../devices/huawei/pairing'
import { parseDigestSecrets } from '../devices/huawei/hichain'
import { formatAgo } from '../utils/timeAgo'

const LAST_KEY = 'healthtrack_watch_connect_last'
const ICONS = { ok: '✓', warn: '!', fail: '✕', skip: '–', running: '…', pending: '·' }

function loadLast() {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) || 'null')
    return v && Array.isArray(v.steps) ? v : null
  } catch {
    return null
  }
}

async function defaultFetchSecrets() {
  const res = await fetch(SECRETS_SOURCE_URL)
  if (!res.ok) throw new Error(`téléchargement refusé (${res.status})`)
  return res.text()
}

/**
 * @param {{ connect: Function, fetchSecrets?: Function, save: Function, copy: Function }} props
 * `connect({ secrets, rebind, onUpdate })` → rapport (pairing.connectAndAuthenticate).
 */
export default function WatchConnect({ connect, fetchSecrets = defaultFetchSecrets, save, copy }) {
  const [report, setReport] = useState(loadLast)
  const [secrets, setSecrets] = useState(() => loadSecrets())
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState(null)
  const [paste, setPaste] = useState('')

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
      setReport(final)
      try {
        localStorage.setItem(LAST_KEY, JSON.stringify(final))
      } catch {
        /* rapport seulement affiché */
      }
    } catch (e) {
      setMessage(e?.message || String(e))
    } finally {
      setRunning(false)
    }
  }

  const exportWith = async (fn) => {
    const json = JSON.stringify(report, null, 2)
    const filename = `healthtrack-connexion-montre-${(report.startedAt || new Date().toISOString()).slice(0, 16).replace(/[T:]/g, '-')}.json`
    try {
      setMessage(await fn(json, filename))
    } catch (e) {
      setMessage(`Export impossible : ${e?.message || e}`)
    }
  }

  const code = report?.outcome?.code
  const steps = report?.steps || CONNECT_STEPS.map((s) => ({ ...s, status: 'pending' }))

  return (
    <div className="my-device watch-setup watch-connect" aria-labelledby="watch-connect-title">
      <p id="watch-connect-title" className="watch-diag-watch">Connexion à la montre</p>
      <p className="my-devices-intro">
        Une fois la montre appairée, HealthTrack s’y connecte seule : elle obtient une clé que la montre ne donne qu’à une app à la fois,
        et la garde <strong>sur ce téléphone uniquement</strong>. Chaque connexion lit ensuite les nouvelles mesures (pas, cœur, SpO₂,
        sommeil).
      </p>

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
          {report.finishedAt && (
            <>
              <p className="my-device-meta">Dernière connexion : {formatAgo(report.finishedAt)} · journal sans clé, sans PIN ni adresse complète.</p>
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
    </div>
  )
}
